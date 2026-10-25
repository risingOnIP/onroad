import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getForm } from "@/app/actions/realtor/form-actions";
import { getSchemaByFormType } from "@/app/actions/realtor/schema";
import { FormResponse, SchemaItem, PDFFormField } from "@/components/files/types/realtor";
import { getSignatureCollection } from "@/app/actions/realtor/signatures-actions";
import { getDownloadUrl } from "@/app/actions/realtor/fileupload-actions";
import { loadPdfFieldMetadata } from "@/app/actions/realtor/deal-option-actions";
import { getBlankFile } from "@/app/actions/realtor/blank-file-actions";

export const modifyPDF = async (
  pdfDoc: PDFDocument,
  form_schema: SchemaItem[],
  form_response: FormResponse,
  signature_data: Record<string, Record<string, string>>
): Promise<PDFDocument> => {

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pdfDocForm = pdfDoc.getForm();
  // const BLUE_COLOR = rgb(0, 0, 0.5); // RGB(0, 0, 128) normalized to 0-1 range

  for (const schemaItem of form_schema) {


    if (schemaItem.pdf_attributes) {
      // 1) Changed .forEach to a for...of loop to properly handle await
      for (const pdfAttribute of schemaItem.pdf_attributes) {
        try {
          // Handle text input
          const value = form_response[schemaItem.unique_id];
          if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
            continue; 
          }
          if (schemaItem.display_attributes.input_type === "text" || schemaItem.display_attributes.input_type === "text-area") {
            let userText = form_response[schemaItem.unique_id] as string;
            if (!pdfAttribute.linked_form_fields_text || pdfAttribute.linked_form_fields_text.length === 0) {
              if (typeof userText === "string") {
                const pdfField = pdfDocForm.getTextField(
                  pdfAttribute.formfield as string
                );
                
                // Check if field supports multiline from both PDF structure and schema
                const isPdfFieldMultiline = pdfField.isMultiline();
                const isSchemaMultiline = schemaItem.display_attributes.input_type === "text-area";
                const shouldHandleAsMultiline = isPdfFieldMultiline || isSchemaMultiline;
                
                // Get field dimensions
                const acroField = pdfField.acroField;
                const widgets = acroField.getWidgets();
                const rect = widgets[0].getRectangle();
                const fieldWidth = rect.width;
                const fieldHeight = rect.height;
                
                if (shouldHandleAsMultiline) {
                  // Enable multiline on the field if not already enabled
                  if (!isPdfFieldMultiline) {
                    pdfField.enableMultiline();
                  }

                  
                  
                  // Split text by newlines first
                  const requestedLines = userText.split('\n').map((line) => line.replace(/\n/g, '\n'));
                  
                  // Start with larger font size for better readability
                  let fontSize = 16;
                  
                  // Use adaptive line height - tighter spacing when more lines needed
                  const calculateLineHeight = (fs: number, lineCount: number) => {
                    if (lineCount <= 2) return fs * 1.3; // More spacing for few lines
                    if (lineCount <= 4) return fs * 1.2; // Standard spacing
                    if (lineCount <= 6) return fs * 1.1; // Tighter spacing for more lines
                    return fs * 1.05; // Very tight spacing for many lines
                  };
                  
                  let lineHeight = calculateLineHeight(fontSize, requestedLines.length);
                  let maxLines = Math.floor(fieldHeight / lineHeight);
                  
                  // Ensure at least 1 line can fit
                  if (maxLines < 1) {
                    maxLines = 1;
                    fontSize = Math.max(8, fieldHeight / 1.3); // Don't go below 8pt
                    lineHeight = calculateLineHeight(fontSize, 1);
                  }
                  
                  // Adjust font size if we have too many lines (less aggressive reduction)
                  while (requestedLines.length > maxLines && fontSize > 8) {
                    fontSize -= 0.25; // Smaller reduction steps
                    lineHeight = calculateLineHeight(fontSize, requestedLines.length);
                    maxLines = Math.floor(fieldHeight / lineHeight);
                  }
                  
                  // Take only the lines that fit and check width constraints
                  const finalLines = requestedLines.slice(0, maxLines);
                  
                  // Check if any line is too wide and adjust font size accordingly (less aggressive)
                  const maxLineWidth = Math.max(...finalLines.map(line => 
                    font.widthOfTextAtSize(line, fontSize)
                  ));
                  
                  // Be less aggressive with width-based font reduction
                  while (maxLineWidth > fieldWidth && fontSize > 8) {
                    fontSize -= 0.25; // Smaller reduction steps
                    // Recalculate line height with new font size
                    lineHeight = calculateLineHeight(fontSize, finalLines.length);
                  }
                  
                  // Join the final lines with proper line breaks for PDF
                  const finalText = finalLines.join('\n');
                  
                  pdfField.setFontSize(fontSize);
                  pdfField.setText(finalText);
                  
                  // Set text color to blue
                  try {
                    const acroField = pdfField.acroField;
                    acroField.setDefaultAppearance(`0 0 0.5 rg /${font.name} ${fontSize} Tf`);
                  } catch (error) {
                    console.warn('Could not set text color for field:', error);
                  }
                } else {
                  // For single-line fields, convert newlines to spaces
                  const singleLineText = userText.replace(/\n/g, ' ');
                  
                  // Calculate appropriate font size (max 12, shrink if needed)
                  let fontSize = 12;
                  let textWidth = font.widthOfTextAtSize(singleLineText, fontSize);
                  while (textWidth > fieldWidth && fontSize > 1) {
                    fontSize -= 0.5;
                    textWidth = font.widthOfTextAtSize(singleLineText, fontSize);
                  }
                  
                  pdfField.setFontSize(fontSize);
                  pdfField.setText(singleLineText);
                  
                  // Set text color to blue
                  try {
                    const acroField = pdfField.acroField;
                    acroField.setDefaultAppearance(`0 0 0.5 rg /${font.name} ${fontSize} Tf`);
                  } catch (error) {
                    console.warn('Could not set text color for field:', error);
                  }
                }
              }
            } else {
              // If linked_form_fields_text is present, distribute words across those fields
              
              // Helper function to calculate optimal font size for all linked fields
              const calculateOptimalFontSize = (text: string, totalWidth: number): number => {
                let fontSize = 12;
                let textWidth = font.widthOfTextAtSize(text, fontSize);
                while (textWidth > totalWidth && fontSize > 1) {
                  fontSize -= 0.5;
                  textWidth = font.widthOfTextAtSize(text, fontSize);
                }
                return fontSize;
              };
              
              const defaultFontSize = 12;
              const linkedFields = pdfAttribute.linked_form_fields_text.map(
                (fieldName) => {
                  const pdfField = pdfDocForm.getTextField(fieldName);
                  const acroField = pdfField.acroField;
                  const widgets = acroField.getWidgets();
                  const rect = widgets[0].getRectangle();
                  const fieldWidth = rect.width;
                  return { pdfField, fieldWidth };
                }
              );
              
              // Calculate optimal font size based on total text and total width
              const totalFieldWidth = linkedFields.reduce((sum, field) => sum + field.fieldWidth, 0);
              const textToCalculate = typeof userText === "string" ? userText.replace(/\n/g, ' ') : "";
              const optimalFontSize = calculateOptimalFontSize(textToCalculate, totalFieldWidth);
              
              const measureWidth = (text: string) =>
                font.widthOfTextAtSize(text, optimalFontSize);

              let words: string[] = [];
              if (typeof userText === "string") {
                words = userText.split(/\s+/).filter((w) => w.length > 0);
              }

              const assignedTexts = Array(linkedFields.length).fill("");
              let wordIndex = 0;

              for (let i = 0; i < linkedFields.length - 1; i++) {
                const { fieldWidth } = linkedFields[i];
                let fieldText = "";

                while (wordIndex < words.length) {
                  const candidateText =
                    fieldText.length === 0
                      ? words[wordIndex]
                      : fieldText + " " + words[wordIndex];

                  if (measureWidth(candidateText) <= fieldWidth) {
                    fieldText = candidateText;
                    wordIndex++;
                  } else {
                    break;
                  }
                }

                assignedTexts[i] = fieldText.trimEnd();
                if (wordIndex >= words.length) {
                  break;
                }
              }

              if (wordIndex < words.length) {
                assignedTexts[linkedFields.length - 1] = words
                  .slice(wordIndex)
                  .join(" ");
              }

              linkedFields.forEach((f, idx) => {
                // Apply the uniform optimal font size to all linked fields
                f.pdfField.setFontSize(optimalFontSize);
                f.pdfField.setText(assignedTexts[idx]);
                
                // Set text color to blue
                try {
                  const acroField = f.pdfField.acroField;
                  acroField.setDefaultAppearance(`0 0 0.5 rg /${font.name} ${optimalFontSize} Tf`);
                } catch (error) {
                  console.warn('Could not set text color for linked field:', error);
                }
              });
            }
          } else if (schemaItem.display_attributes.input_type === "radio") {
            const radioOption = (form_response[schemaItem.unique_id]);
            if (typeof radioOption === "string" && radioOption.trim() !== "") {
                if (Array.isArray(pdfAttribute.formfield)) {
                  pdfAttribute.formfield.forEach((field) => {
                    pdfDocForm.getRadioGroup(field).select(radioOption);
                  });
                } else {
                  pdfDocForm
                    .getRadioGroup(pdfAttribute.formfield as string)
                    .select(radioOption);
                }
            }

            //checkboxes start here
          } else if (schemaItem.display_attributes.input_type === "checkbox" ) {
            const checkboxResponseValues : string[] | undefined = form_response[schemaItem.unique_id] as string[];

            
            checkboxResponseValues?.forEach((value) => {
              const checkBoxPdfAttribute = pdfAttribute.linked_form_fields_checkbox?.find((checkbox) => checkbox.fromDatabase === value)?.pdfAttribute;
              if (checkBoxPdfAttribute) {
                const checkBoxField = pdfDocForm.getCheckBox(checkBoxPdfAttribute);
                
                checkBoxField.check();



              }
            })

            //singatures start here
          } else if (
            schemaItem.display_attributes.input_type === "signature" &&
            signature_data
          ) {
            // Use nested structure: signature_data[unique_id][formfield_name] = signaturePng
            const uniqueIdSignatures = signature_data[schemaItem.unique_id];
            if (uniqueIdSignatures) {
              const sigData = uniqueIdSignatures[pdfAttribute.formfield as string];
              if (sigData) {
                const signatureImage = await pdfDoc.embedPng(sigData);
                const signatureField = pdfDocForm.getTextField(
                  pdfAttribute.formfield as string
                );
                
                // Set the image
                signatureField.setImage(signatureImage);
              }
            }
          } else {
          }
        } catch (error) {
          // 2) Added a try-catch block to log errors for any failed field interaction
          console.error(
            `Failed to process form field: '${pdfAttribute.formfield}' for unique_id: '${schemaItem.unique_id}'.`,
            error
          );
        }
      }
    }
  }
  
  // Update appearances to apply color changes
  pdfDocForm.updateFieldAppearances();
  
  return pdfDoc;
};

/**
 * Apply custom fields to PDF for download, skipping signature fields
 * Similar to applyFieldsToPDF but only applies non-signature fields
 */
async function applyCustomFieldsForDownload(
  pdfDoc: PDFDocument,
  fields: PDFFormField[]
): Promise<PDFDocument> {
  const pages = pdfDoc.getPages();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  
  for (const field of fields) {
    // Skip signature fields - we don't want to add them as static content in downloads
    if (field.type === 'signature') {
      continue;
    }
    
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
        await drawCustomTextField(page, field, pdfY, helveticaFont);
        break;
        
      case 'date':
        await drawCustomDateField(page, field, pdfY, helveticaFont);
        break;
        
      case 'checkmark':
        await drawCustomCheckmark(page, field, pdfY);
        break;
    }
  }
  
  return pdfDoc;
}

async function drawCustomTextField(page: any, field: PDFFormField, pdfY: number, font: any) {
  const text = field.value || field.label || '';
  const color = field.color ? parseCustomHexToRgb(field.color) : rgb(0, 0, 0);
  
  page.drawText(text, {
    x: field.x,
    y: pdfY + field.height - 12,
    size: 12,
    font,
    color
  });
}

async function drawCustomDateField(page: any, field: PDFFormField, pdfY: number, font: any) {
  const dateText = field.value || new Date().toLocaleDateString();
  const color = field.color ? parseCustomHexToRgb(field.color) : rgb(0, 0, 0);
  
  page.drawText(dateText, {
    x: field.x,
    y: pdfY + field.height - 12,
    size: 12,
    font,
    color
  });
}

async function drawCustomCheckmark(page: any, field: PDFFormField, pdfY: number) {
  try {
    const response = await fetch('/checkmark.png');
    if (response.ok) {
      const imageBytes = await response.arrayBuffer();
      const pdfDoc = page.doc;
      const checkmarkImage = await pdfDoc.embedPng(imageBytes);
      
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
  
  // Fallback: Draw a simple checkmark
  const color = field.color ? parseCustomHexToRgb(field.color) : rgb(0, 0, 0);
  const checkSize = Math.min(field.width, field.height) * 0.7;
  const centerX = field.x + field.width / 2;
  const centerY = pdfY + field.height / 2;
  
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

function parseCustomHexToRgb(hex: string) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

/**
 * Helper function to get the processed PDF for any form type
 * Used by bulk download to handle both standard and custom forms
 */
export async function getProcessedPDFForForm(form: any, signature_data: Record<string, Record<string, string>> = {}): Promise<PDFDocument> {
  
  // Priority 1: Custom forms with file_upload_pdf
  if (form.file_upload_pdf) {
    
    // Get the custom PDF from Supabase storage
    const customPdfUrl = await getDownloadUrl(form.file_upload_pdf);
    const pdfResponse = await fetch(customPdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch custom PDF: ${pdfResponse.statusText}`);
    }
    const pdfBytes = await pdfResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Load and apply custom field metadata (excluding signatures)
    const customFields = await loadPdfFieldMetadata(form.id);
    
    if (customFields && customFields.length > 0) {
      await applyCustomFieldsForDownload(pdfDoc, customFields);
    }
    
    return pdfDoc;
  }
  
  // Priority 2: Standard forms with templates
  
  // Fetch the original PDF template
  const blankFileResult = await getBlankFile(form.form_type);
  if (blankFileResult.error?.type === 'TAR_FORM_NOT_UPLOADED') {
    throw new Error(blankFileResult.error.message);
  }
  if (!blankFileResult.data) {
    throw new Error(blankFileResult.error?.message || `Failed to load blank file`);
  }
  const existingPdfBytes = blankFileResult.data;
  
  // Load and modify with schema
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form_schema = await getSchemaByFormType(form.form_type);
  const modifiedPDF = await modifyPDF(
    pdfDoc,
    form_schema,
    form.form_response,
    signature_data
  );
  
  return modifiedPDF;
}

export async function downloadFunction(dealId: string, formId: string) {
  try {
    const form = await getForm(formId);
    
    
    // Priority 1: If finalized_pdf exists, download that directly without modifications
    if (form.finalized_pdf) {
      const finalizedUrl = await getDownloadUrl(form.finalized_pdf);
      
      // Direct download of finalized PDF
      const link = document.createElement("a");
      link.href = finalizedUrl;
      link.download = `${form.form_type}_Final.pdf`;
      link.click();
      
      return true;
    }
    
    // Priority 2: Custom forms with file_upload_pdf
    // A form is custom if it has file_upload_pdf (regardless of custom_schema content)
    if (form.file_upload_pdf) {
      
      // Get the custom PDF from Supabase storage
      const customPdfUrl = await getDownloadUrl(form.file_upload_pdf);
      const pdfResponse = await fetch(customPdfUrl);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to fetch custom PDF: ${pdfResponse.statusText}`);
      }
      const pdfBytes = await pdfResponse.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Load custom field metadata
      const customFields = await loadPdfFieldMetadata(formId);
      
      // Apply custom fields (excluding signatures) to the PDF
      if (customFields && customFields.length > 0) {
        await applyCustomFieldsForDownload(pdfDoc, customFields);
      } else {
      }
      
      // Flatten and save
      const pdfForm = pdfDoc.getForm();
      pdfForm.flatten();
      const finalPdfBytes = await pdfDoc.save();
      const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
      
      // Trigger download
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${form.form_type}_Custom.pdf`;
      link.click();
      URL.revokeObjectURL(blobUrl);
      
      return true;
    }
    
    // Priority 3: Standard forms with schema-based filling
    
    // Collect signature data in nested structure
    let signature_data: Record<string, Record<string, string>> = {};
    const signatureSequence = form.signature_sequence || [];
    
    if (Array.isArray(signatureSequence) && signatureSequence.length > 0) {
      for (const step of signatureSequence) {
        if (Array.isArray(step)) {
          for (const signer of step) {
            if (signer && signer.row_uuid) {
              const signatureCollection = await getSignatureCollection(signer.row_uuid);
              
              // Merge nested signature data structure
              if (signatureCollection.signature_data) {
                Object.assign(signature_data, signatureCollection.signature_data);
              }
            }
          }
        }
      }
    }

    // Fetch the original PDF template
    const blankFileResult = await getBlankFile(form.form_type);
    if (blankFileResult.error?.type === 'TAR_FORM_NOT_UPLOADED') {
      throw new Error(blankFileResult.error.message);
    }
    if (!blankFileResult.data) {
      throw new Error(blankFileResult.error?.message || "Failed to load blank file");
    }
    const existingPdfBytes = blankFileResult.data;

    // Load and modify with schema
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form_schema = await getSchemaByFormType(form.form_type);
    const pdfDocModified = await modifyPDF(
      pdfDoc,
      form_schema,
      form.form_response,
      signature_data
    );

    // Flatten and save
    const pdfDocForm = pdfDocModified.getForm();
    pdfDocForm.flatten();
    const finalPdfBytes = await pdfDoc.save();
    const blob = new Blob([finalPdfBytes], { type: "application/pdf" });

    // Trigger download
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${form.form_type}.pdf`;
    link.click();
    URL.revokeObjectURL(blobUrl);

    return true;
  } catch (error) {
    console.error("[DOWNLOAD] Error downloading PDF:", error);
    throw error;
  }
}