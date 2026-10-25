import { SchemaItem } from '@/components/files/types/realtor';
import { PDFDocument, PDFPage, rgb, StandardFonts, PDFForm } from 'pdf-lib';


export interface PDFField {
  id: string;
  type: 'text' | 'signature' | 'date' | 'checkmark' | 'strikethrough';
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  value?: string;
  color?: string;
  label?: string;
  email?: string;
  displayName?: string;
  actionAs?: 'signer' | 'delegator';
}



export type SchemaUpdateCallback = (signatureFields: SchemaItem[]) => void;

export interface PDFGenerationResult {
  pdfBytes: Uint8Array;
  pdfBlob: Blob;
}


/**
 * Apply fields to a PDF document directly in the browser
 */
export async function applyFieldsToPDF(
  pdfUrl: string,
  fields: PDFField[],
  options?: { 
    preserveSignatureFields?: boolean;
    onSchemaUpdate?: SchemaUpdateCallback
  }
): Promise<PDFGenerationResult> {
  try {
    // Fetch the PDF
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    const pdfBytes = await response.arrayBuffer();
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    // Step 1: Flatten existing form fields (convert to static content)
    // DISABLED: Signature fields should not be flattened
    // await flattenExistingFields(pdfDoc, options);
    
    // Embed font for text fields
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Get the form to add new fields
    const form = pdfDoc.getForm();
    
    // Process each new field to add to the PDF
    const signatureFields: SchemaItem[] = [];
    
    
    for (const field of fields) {
      // Ensure page index is valid (convert from 1-based to 0-based)
      const pageIndex = field.page - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) {
        console.warn(`Invalid page index ${field.page} for field ${field.id}`);
        continue;
      }
      
      const page = pages[pageIndex];
      const pageHeight = page.getHeight();
      
      // Convert from top-left origin to PDF's bottom-left origin
      const pdfY = pageHeight - field.y - field.height;
      
      switch (field.type) {
        case 'text':
          await drawTextField(page, field, pdfY, helveticaFont);
          break;
          
        case 'date':
          await drawDateField(page, field, pdfY, helveticaFont);
          break;
          
        case 'checkmark':
          await drawCheckmark(page, field, pdfY);
          break;
          
        case 'strikethrough':
          await drawStrikethrough(page, field, pdfY);
          break;
          
        case 'signature':
          // Create a form field for signatures (these remain interactive)
          await createSignatureField(form, page, field, pdfY);
          
          // Add to signature fields for schema update
          signatureFields.push(createSignatureSchemaItem(field, signatureFields.length));
          break;
      }
    }
    
    // Step 4: Update custom schema with signature fields if callback provided
    if (options?.onSchemaUpdate && signatureFields.length > 0) {
      options.onSchemaUpdate(signatureFields);
    } else if (options?.onSchemaUpdate && signatureFields.length === 0) {
    } else if (!options?.onSchemaUpdate) {
    }
    
    // Save the PDF
    const modifiedPdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    
    return {
      pdfBytes: modifiedPdfBytes,
      pdfBlob
    };
  } catch (error) {
    console.error('Error applying fields to PDF:', error);
    throw error;
  }
}

async function drawTextField(
  page: PDFPage,
  field: PDFField,
  pdfY: number,
  font: any
) {
  const text = field.value || field.label || '';
  const color = field.color ? parseHexToRgb(field.color) : rgb(0, 0, 0);
  
  // Check if this is multiline text (contains \n or is longer than expected width)
  const isMultiline = text.includes('\n') || text.length > 30;
  
  if (isMultiline) {
    // For multiline text, create a canvas to render the text and convert to image
    await drawTextAsImage(page, field, pdfY, text, color);
  } else {
    // Single line text - use direct text drawing
    page.drawText(text, {
      x: field.x,
      y: pdfY + field.height - 12, // Adjust for text baseline
      size: 12,
      font,
      color
    });
  }
}

async function drawTextAsImage(
  page: PDFPage,
  field: PDFField,
  pdfY: number,
  text: string,
  color: any
) {
  // Create a canvas to render the text
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Set canvas size to match field dimensions with higher DPI for better quality
  const scale = 2;
  canvas.width = field.width * scale;
  canvas.height = field.height * scale;
  ctx.scale(scale, scale);
  
  // Configure text rendering
  ctx.fillStyle = `rgb(${Math.round(color.red * 255)}, ${Math.round(color.green * 255)}, ${Math.round(color.blue * 255)})`;
  ctx.font = '12px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Split text into lines and draw
  const lines = text.split('\n');
  const lineHeight = 14; // Match the lineHeight from the fabric canvas
  
  lines.forEach((line, index) => {
    const y = index * lineHeight + 2; // Small top padding
    if (y < field.height - lineHeight) { // Ensure we don't draw outside bounds
      ctx.fillText(line, 2, y); // Small left padding
    }
  });
  
  // Convert canvas to data URL and embed as image
  const imageDataUrl = canvas.toDataURL('image/png');
  
  try {
    // Convert data URL to bytes
    const imageBytes = dataURLToBytes(imageDataUrl);
    
    // Embed image in PDF
    const pdfDoc = page.doc as PDFDocument;
    const image = await pdfDoc.embedPng(imageBytes);
    
    // Draw the image
    page.drawImage(image, {
      x: field.x,
      y: pdfY,
      width: field.width,
      height: field.height
    });
  } catch (error) {
    console.error('Error embedding text as image:', error);
    // Fallback to simple text if image embedding fails
    page.drawText(text.replace(/\n/g, ' '), {
      x: field.x,
      y: pdfY + field.height - 12,
      size: 12,
      font: await page.doc.embedFont(StandardFonts.Helvetica),
      color
    });
  }
}

async function drawDateField(
  page: PDFPage,
  field: PDFField,
  pdfY: number,
  font: any
) {
  const dateText = field.value || new Date().toLocaleDateString();
  const color = field.color ? parseHexToRgb(field.color) : rgb(0, 0, 0);
  
  page.drawText(dateText, {
    x: field.x,
    y: pdfY + field.height - 12,
    size: 12,
    font,
    color
  });
}

async function drawCheckmark(
  page: PDFPage,
  field: PDFField,
  pdfY: number
) {
  try {
    // Try to load the checkmark.png image from public directory
    const response = await fetch('/checkmark.png');
    if (response.ok) {
      const imageBytes = await response.arrayBuffer();
      const pdfDoc = page.doc as PDFDocument;
      const checkmarkImage = await pdfDoc.embedPng(imageBytes);
      
      // Draw the checkmark image
      page.drawImage(checkmarkImage, {
        x: field.x,
        y: pdfY,
        width: field.width,
        height: field.height
      });
      return;
    }
  } catch (error) {
    console.warn('Could not load checkmark.png, falling back to drawn checkmark:', error);
  }
  
  // Fallback: Draw a simple checkmark using lines if image loading fails
  const color = field.color ? parseHexToRgb(field.color) : rgb(0, 0, 0);
  const checkSize = Math.min(field.width, field.height) * 0.7;
  const centerX = field.x + field.width / 2;
  const centerY = pdfY + field.height / 2;
  
  // Draw checkmark as two lines forming a "✓"
  page.drawLine({
    start: { x: centerX - checkSize * 0.3, y: centerY },
    end: { x: centerX - checkSize * 0.1, y: centerY - checkSize * 0.3 },
    thickness: 2,
    color
  });
  
  page.drawLine({
    start: { x: centerX - checkSize * 0.1, y: centerY - checkSize * 0.3 },
    end: { x: centerX + checkSize * 0.3, y: centerY + checkSize * 0.2 },
    thickness: 2,
    color
  });
}

async function drawStrikethrough(
  page: PDFPage,
  field: PDFField,
  pdfY: number
) {
  try {
    // Try to load the strikethrough.png image from public directory
    const response = await fetch('/strikethrough.png');
    if (response.ok) {
      const imageBytes = await response.arrayBuffer();
      const pdfDoc = page.doc as PDFDocument;
      const strikethroughImage = await pdfDoc.embedPng(imageBytes);
      
      // Draw the strikethrough image
      page.drawImage(strikethroughImage, {
        x: field.x,
        y: pdfY,
        width: field.width,
        height: field.height
      });
      return;
    }
  } catch (error) {
    console.warn('Could not load strikethrough.png, falling back to drawn line:', error);
  }
  
  // Fallback: Draw a simple horizontal line if image loading fails
  const color = field.color ? parseHexToRgb(field.color) : rgb(0.93, 0.26, 0.26); // Default red color
  const centerY = pdfY + field.height / 2;
  
  page.drawLine({
    start: { x: field.x, y: centerY },
    end: { x: field.x + field.width, y: centerY },
    thickness: 3,
    color
  });
}

async function createSignatureField(
  form: PDFForm,
  page: PDFPage,
  field: PDFField,
  pdfY: number
) {
  // Create a unique field name matching the field ID for consistency
  const fieldName = field.id;
  
  // Create text field for signature (will display signature image later)
  const textField = form.createTextField(fieldName);
  textField.addToPage(page, {
    x: field.x,
    y: pdfY,
    width: field.width,
    height: field.height
  });
  
  // Style the field - make it suitable for signature display
  textField.setFontSize(10);
  
  // Don't enable multiline for signature fields - signatures are single elements
  // textField.enableMultiline();
  
  // Keep fields editable until signatures are actually collected
  // This matches the old implementation behavior
  
  // Set placeholder text to show who needs to sign
  const placeholderText = field.displayName 
    ? `${field.displayName} (${field.email || 'Signature Required'})`
    : 'Signature Required';
  textField.setText(placeholderText);
  
  // Make the field background slightly visible so users can see where to sign
}

function parseHexToRgb(hex: string) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  return rgb(r, g, b);
}

function dataURLToBytes(dataURL: string): Uint8Array {
  // Remove the data:image/png;base64, prefix
  const base64 = dataURL.split(',')[1];
  
  // Convert base64 to binary string
  const binaryString = atob(base64);
  
  // Convert binary string to Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

/**
 * Create a schema item for a signature field
 */
function createSignatureSchemaItem(field: PDFField, order: number): SchemaItem {
  return {
    unique_id: field.id,
    display_attributes: {
      display_name: field.displayName || field.label || 'Signature',
      input_type: 'signature',
      order: order,
      isRequired: true,
      placeholder: field.email || '',
      value: {
        type: "manual",
      }
    },
    pdf_attributes: [{
      formType: "fileUpload",
      formfield: field.id,
    }]
  };
}

/**
 * Extract only signature fields from field metadata
 */
export function extractSignatureFields(fields: PDFField[]): PDFField[] {
  return fields.filter(field => field.type === 'signature');
}

/**
 * Check if a PDF should be editable based on its lock status
 */
export function isPDFEditable(isLocked?: boolean): boolean {
  return !isLocked;
}

/**
 * Embed signature images into existing PDF form fields
 * This is used after signatures are collected to display them in the PDF
 */
export async function embedSignaturesIntoPDF(
  pdfUrl: string,
  signatureData: Record<string, string> // fieldId -> PNG base64 data
): Promise<{ pdfBytes: Uint8Array; pdfBlob: Blob }> {
  try {
    // Fetch the PDF
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    const pdfBytes = await response.arrayBuffer();
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    // Embed each signature image into its corresponding field
    for (const [fieldId, pngData] of Object.entries(signatureData)) {
      try {
        // Get the text field by ID
        const textField = form.getTextField(fieldId);
        
        if (textField) {
          // Convert base64 PNG data to bytes
          const imageBytes = dataURLToBytes(pngData);
          
          // Embed the PNG image
          const signatureImage = await pdfDoc.embedPng(imageBytes);
          
          // Set the image in the field
          textField.setImage(signatureImage);
          
          // Make the field read-only now that it has a signature
          textField.enableReadOnly();
          
        } else {
          console.warn(`Field not found for signature: ${fieldId}`);
        }
      } catch (error) {
        console.error(`Error embedding signature for field ${fieldId}:`, error);
        // Continue with other signatures even if one fails
      }
    }
    
    // Save the PDF
    const modifiedPdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    
    return {
      pdfBytes: modifiedPdfBytes,
      pdfBlob
    };
  } catch (error) {
    console.error('Error embedding signatures into PDF:', error);
    throw error;
  }
}