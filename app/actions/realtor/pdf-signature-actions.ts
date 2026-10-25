"use server";

import { getForm } from "./form-actions";
import { getDownloadUrl } from "./fileupload-actions";

/**
 * Ensures a form has a PDF ready for signatures.
 * For custom forms: checks if they have been edited with signature fields.
 * For normal forms: always returns success as PDFs are generated dynamically during signing.
 */
export async function ensurePdfWithSignatures(formId: string): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
  try {
    // Get the form data
    const form = await getForm(formId);
    
    // For custom forms with uploaded PDFs
    if (form.file_upload_pdf && form.file_upload_pdf.length > 0) {
      // Check if the form has signature fields defined (either in custom_schema or pdf_field_metadata)
      const hasSignatureFields = 
        (form.custom_schema?.some(field => field.display_attributes?.input_type === 'signature')) ||
        (form.pdf_field_metadata && Object.values(form.pdf_field_metadata).some((field: any) => field.type === 'signature'));
      
      if (hasSignatureFields) {
        const existingPdfUrl = await getDownloadUrl(form.file_upload_pdf);
        return { success: true, pdfUrl: existingPdfUrl };
      } else {
        return {
          success: false,
          error: "Please use the PDF editor to place signature fields on the form first"
        };
      }
    }
    
    // For normal/template forms (forms without uploaded PDFs)
    // These forms generate PDFs dynamically during the signing process
    // The backend will use the form schema and current form_response to generate the PDF
    if (!form.file_upload_pdf || form.file_upload_pdf.length === 0) {
      // For normal forms, we don't need a pre-existing PDF
      // The signing process will generate it dynamically
      return { 
        success: true, 
        pdfUrl: undefined // No URL needed, PDF will be generated on-demand
      };
    }
    
    // This should not happen - form has file_upload_pdf but no signature fields
    return {
      success: false,
      error: "Form configuration error. Please contact support."
    };
    
  } catch (error) {
    console.error("Error checking form PDF status:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to check form PDF status" 
    };
  }
}