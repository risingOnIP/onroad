import { PDFDocument } from "pdf-lib";
import { getDealOptionsWithForms } from "@/app/actions/realtor/deal-option-actions";
import { getSchemaByFormType } from "@/app/actions/realtor/schema";
import { Form } from "@/components/files/types/realtor";
import { getSignatureCollection } from "@/app/actions/realtor/signatures-actions";
import { modifyPDF } from "@/components/files/realtor/pdf-utils/downloadFunction";
import { toast } from "sonner";
import { getBlankFile } from "@/app/actions/realtor/blank-file-actions";

export async function downloadAllFormsFromDeal(dealId: string) {
  try {
    toast.info("Preparing to download all forms...");
    
    // Get all deal options with their forms
    const dealOptions = await getDealOptionsWithForms(dealId);
    
    // Collect all forms from all deal options (including deal-wide forms)
    const allForms: Form[] = [];
    dealOptions.forEach(dealOption => {
      if (dealOption.forms && dealOption.forms.length > 0) {
        allForms.push(...dealOption.forms);
      }
    });
    
    if (allForms.length === 0) {
      toast.error("No forms found in this deal");
      return;
    }

    toast.info(`Found ${allForms.length} forms. Generating combined PDF...`);

    // Create a new PDF document for the combined output
    const combinedPDF = await PDFDocument.create();

    // Process each form and add to combined PDF
    for (let i = 0; i < allForms.length; i++) {
      const form = allForms[i];
      try {
        toast.info(`Processing form ${i + 1} of ${allForms.length}: ${form.form_type}`);
        
        // Get signature data for this form in nested structure
        let signature_data: Record<string, Record<string, string>> = {};
        if (form.signature_sequence) {
          for (const step of form.signature_sequence) {
            for (const signer of step) {
              if (signer.row_uuid) {
                const signatureCollection = await getSignatureCollection(signer.row_uuid);
                
                // Merge nested signature data structure
                if (signatureCollection.signature_data) {
                  Object.assign(signature_data, signatureCollection.signature_data);
                }
              }
            }
          }
        }

        // Fetch the original PDF template (same logic as individual downloadFunction)
        const blankFileResult = await getBlankFile(form.form_type);
        if (blankFileResult.error?.type === 'TAR_FORM_NOT_UPLOADED') {
          throw new Error(blankFileResult.error.message);
        }
        if (!blankFileResult.data) {
          throw new Error(blankFileResult.error?.message || `Failed to load blank file`);
        }
        const existingPdfBytes = blankFileResult.data;

        // Load the template PDF
        const templatePDF = await PDFDocument.load(existingPdfBytes);

        // Get the schema and modify the PDF (same logic as individual downloadFunction)
        const form_schema = await getSchemaByFormType(form.form_type);
        const modifiedPDF = await modifyPDF(
          templatePDF,
          form_schema,
          form.form_response,
          signature_data
        );

        // Flatten the form
        const pdfForm = modifiedPDF.getForm();
        pdfForm.flatten();

        // Copy pages to combined PDF
        const pages = await combinedPDF.copyPages(modifiedPDF, modifiedPDF.getPageIndices());
        pages.forEach((page) => combinedPDF.addPage(page));

      } catch (error) {
        console.error(`Error processing form ${form.form_type}:`, error);
        // Continue with other forms even if one fails
      }
    }

    // Save and download the combined PDF
    const pdfBytes = await combinedPDF.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // Create download link
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `Deal_${dealId}_All_Forms.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(blobUrl);

    toast.success("All forms downloaded successfully!");
    return true;

  } catch (error) {
    console.error("Error downloading all forms:", error);
    toast.error("Failed to download all forms. Please try again.");
    throw error;
  }
} 