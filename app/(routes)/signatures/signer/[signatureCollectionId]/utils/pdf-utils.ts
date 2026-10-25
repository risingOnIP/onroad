import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/webpack.mjs";
import {
  Form,
  FormResponse,
  SchemaItem,
  SignatureInput,
} from "@/components/files/types/realtor";
import { getDownloadUrlNoAuth } from "@/app/actions/jwt/signing-actions";
import { modifyPDF } from "@/components/files/realtor/pdf-utils/downloadFunction";
import { getBlankFile } from "@/app/actions/jwt/blank-file-actions";

interface SigningWidget {
  displayName: string;
  unique_id: string;
  fields: Array<{
    pageNum: number;
    x: number;
    y: number;
    w: number;
    h: number;
    width?: number;
    height?: number;
    formfield_name?: string;
    unique_id?: string;
    mappingDetails: any;
    signaturePng: string | null;
  }>;
}

export const pdfScale = 1.0;

export function deepClone<T>(obj: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));
}

export async function addDynamicFields(
  formType: string,
  formSchema: SchemaItem[],
  formResponse: FormResponse,
  signatureData: Record<string, Record<string, string>>,
  isCustomForm: boolean,
  formDoc: Form,
  signatureCollectionId: string,
  token?: string
): Promise<Uint8Array> {
  let base: ArrayBuffer;
  
  // Check if this is a custom form with an uploaded PDF

  if (formDoc.file_upload_pdf) {
    try {
      // For custom forms, fetch the uploaded PDF from storage
      
      // Extract just the filename if it's a full path
      const fileName = formDoc.file_upload_pdf.split('/').pop() || formDoc.file_upload_pdf;
      
      if (!token) {
        throw new Error("Authentication token required for custom form PDF");
      }
      
      const pdfUrl = await getDownloadUrlNoAuth(fileName, token);
      
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      // Check content type
      const contentType = response.headers.get('content-type');
      
      base = await response.arrayBuffer();
      
      // Verify it's a valid PDF by checking the header
      const header = new Uint8Array(base.slice(0, 5));
      const pdfHeader = String.fromCharCode(...header);
      if (!pdfHeader.startsWith('%PDF')) {
        console.error("Invalid PDF header:", pdfHeader);
        throw new Error("Downloaded file is not a valid PDF");
      }
    } catch (error) {
      console.error("Error fetching custom form PDF:", error);
      throw new Error(`Failed to load custom form PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    // For standard forms, use the template
    const blankFile = await getBlankFile(formType, signatureCollectionId);
    if (!blankFile.data) {
      throw new Error(`Failed to load blank file`);
    }
    base = blankFile.data;
  }

  // For custom forms, we don't modify the PDF since it doesn't have form fields
  // The signature placement will be handled visually
  if (formDoc.file_upload_pdf) {
    return new Uint8Array(base);
  }
  
  // For standard forms, fill in the form fields
  const pdfDoc = await PDFDocument.load(base);
  const pdfWithFields = await modifyPDF(
    pdfDoc,
    formSchema,
    formResponse,
    signatureData
  );
  return new Uint8Array(await pdfWithFields.save());
}

export async function computeSigningWidgets(
  pdfBytes: Uint8Array,
  formDoc: Form,
  schema: SchemaItem[],
  actionEmail: string,
  sigCollection: any
): Promise<{ widgets: SigningWidget[]; numPages: number }> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;

  const widgets: SigningWidget[] = [];
  
  // Check if this is a custom form with pdf_field_metadata
  const isCustomForm = !!formDoc.file_upload_pdf && !!formDoc.pdf_field_metadata;
  
  if (isCustomForm && formDoc.pdf_field_metadata && typeof formDoc.pdf_field_metadata === 'object' && !Array.isArray(formDoc.pdf_field_metadata)) {
    // For custom forms, use pdf_field_metadata
    for (const [fieldId, fieldData] of Object.entries(formDoc.pdf_field_metadata)) {
      if (fieldData.type !== 'signature') continue;
      
      // Check if this signature field is for the current signer
      const sigInput = formDoc.form_response[fieldId] as SignatureInput;
      if (!sigInput || sigInput.email !== actionEmail) continue;
      
      // For custom forms, signature_data might be nested: signature_data[fieldId][fieldId] or just signature_data[fieldId]
      // Check both patterns for compatibility
      const existingSignature = 
        (typeof sigCollection.signature_data?.[fieldId] === 'string' 
          ? sigCollection.signature_data[fieldId] 
          : sigCollection.signature_data?.[fieldId]?.[fieldId]) || "";
      
      // Get page dimensions for coordinate conversion
      const page = await pdf.getPage(fieldData.page);
      const viewport = page.getViewport({ scale: pdfScale });
      
      // Convert normalized coordinates to viewport coordinates
      const x = fieldData.x * viewport.width;
      const y = viewport.height - (fieldData.y * viewport.height) - (fieldData.height * viewport.height);
      const width = fieldData.width * viewport.width;
      const height = fieldData.height * viewport.height;
      
      widgets.push({
        displayName: fieldData.name || "Signature",
        unique_id: fieldId,
        fields: [{
          formfield_name: fieldId,
          pageNum: fieldData.page,
          x: x,
          y: y,
          w: width,
          h: height,
          width: width,
          height: height,
          signaturePng: existingSignature || null,
          unique_id: fieldId,
          mappingDetails: null,
        }],
      });
    }
  } else {
    // For standard forms, use the existing logic with PDF annotations
    const fieldMap: Record<string, { widgetIdx: number; fieldIdx: number }> = {};
    
    // Pass 1: schema → widgets
    for (const item of schema) {
      if (item.display_attributes.input_type !== "signature") continue;

      const sigInput = formDoc.form_response[item.unique_id] as SignatureInput;
      if (sigInput?.email !== actionEmail) continue;

      const formFields =
        item.pdf_attributes?.map((attr) => attr.formfield) ?? [];
      if (!formFields.length) continue;

      const widgetIdx = widgets.length;

      const fields = formFields.map((formfield_name, fieldIdx) => {
        fieldMap[formfield_name as string] = { widgetIdx, fieldIdx };

        // signature_data is structured as: signature_data[unique_id][formfield_name] = signaturePng
        const existingSignature =
          sigCollection.signature_data?.[item.unique_id]?.[formfield_name as string] || "";

        return {
          formfield_name: formfield_name as string,
          pageNum: 0,
          x: 0,
          y: 0,
          w: 0,
          h: 0,
          width: 0,
          height: 0,
          unique_id: formfield_name as string,
          mappingDetails: null,
          signaturePng: existingSignature || null,
        };
      });

      widgets.push({
        displayName: item.display_attributes.display_name as string,
        unique_id: item.unique_id,
        fields,
      });
    }

    // Pass 2: locate each field on the rendered pages
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const vp = page.getViewport({ scale: pdfScale });
      for (const annot of await page.getAnnotations()) {
        if (annot.subtype !== "Widget" || !annot.fieldName) continue;
        const map = fieldMap[annot.fieldName];
        if (!map) continue;

        const [l, t, r, b] = vp.convertToViewportRectangle(annot.rect!);
        const f = widgets[map.widgetIdx].fields[map.fieldIdx];
        f.pageNum = p;
        f.x = Math.min(l, r);
        f.y = Math.min(t, b);
        f.w = Math.abs(r - l);
        f.h = Math.abs(b - t);
        f.width = Math.abs(r - l);
        f.height = Math.abs(b - t);
      }
    }
  }

  const numPages = pdf.numPages;
  await pdf.destroy();

  return { widgets, numPages };
}