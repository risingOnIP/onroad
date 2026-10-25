"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Download, ArrowLeft, RotateCcw } from "lucide-react";
import { getForm, removeSignaturesAndEnableEditing } from "@/app/actions/realtor/form-actions";
import { getDealOption } from "@/app/actions/realtor/deal-option-actions";
import { getSchemaByFormType } from "@/app/actions/realtor/schema";
import { downloadFunction, modifyPDF } from "@/components/files/realtor/pdf-utils/downloadFunction";
import { FormResponse, SchemaItem, Form, FILE_NAMES } from "@/components/files/types/realtor";
import { getSignatureCollection, renewSignatureCollection } from "@/app/actions/realtor/signatures-actions";
import { getDownloadUrl } from "@/app/actions/realtor/fileupload-actions";
import { getBlankFile } from "@/app/actions/realtor/blank-file-actions";

interface PreviewSectionProps {
  dealId: string;
  formId: string;
  onBack?: () => void;
  showBackButton?: boolean;
  onSignaturesRevoked?: () => void;
}
export const formTypeDisplay = (form_type: string) => {
  return form_type
    ?.replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word only
};


export default function PreviewSection({ 
  dealId, 
  formId, 
  onBack, 
  showBackButton = false,
  onSignaturesRevoked
}: PreviewSectionProps) {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formType, setFormType] = useState<string>("");
  const [dealOption, setDealOption] = useState<string>("Loading...");
  const [creationDate, setCreationDate] = useState<string>("Loading...");
  const [isRevokingSignatures, setIsRevokingSignatures] = useState(false);
  const [isRenewingSignatures, setIsRenewingSignatures] = useState(false);
  const [renewed, setRenewed] = useState(false);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [hasSignatures, setHasSignatures] = useState<boolean>(false);
  const [formData, setFormData] = useState<Form | null>(null);



  const generatePDF = async (
    form_type: string,
    form_schema: SchemaItem[],
    form_response: FormResponse, 
    signature_data: Record<string, Record<string, string>>,
    formDoc: Form
  ) => {
    setLoading(true);

    
    try {

      // Check if this is a custom form
      const isCustomForm = Boolean(formDoc.file_upload_pdf && formDoc.file_upload_pdf.length > 0);
      
      let existingPdfBytes: ArrayBuffer;
      
      if (isCustomForm) {
        try {
          const downloadUrl = await getDownloadUrl(formDoc.file_upload_pdf);
          const pdfResponse = await fetch(downloadUrl);
          if (!pdfResponse.ok) {
            throw new Error(`Failed to fetch custom PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
          }
          existingPdfBytes = await pdfResponse.arrayBuffer();
        } catch (error) {
          console.error("Error fetching custom PDF, falling back to blank template:", error);
          // Fallback to blank template if custom PDF is not accessible
          const blankFileResult = await getBlankFile(form_type as FILE_NAMES);
          if (blankFileResult.error?.type === 'TAR_FORM_NOT_UPLOADED') {
            throw new Error(blankFileResult.error.message);
          }
          if (!blankFileResult.data) {
            throw new Error(blankFileResult.error?.message || `Failed to fetch PDF template`);
          }
          existingPdfBytes = blankFileResult.data;
        }
      } else {

        
        // Fetch the original PDF from your public folder
        const blankFileResult = await getBlankFile(form_type as FILE_NAMES);
        if (blankFileResult.error?.type === 'TAR_FORM_NOT_UPLOADED') {
          throw new Error(blankFileResult.error.message);
        }
        if (!blankFileResult.data) {
          throw new Error(blankFileResult.error?.message || `Failed to fetch PDF template`);
        }
        existingPdfBytes = blankFileResult.data;
      }

      // Load it into pdf-lib
      const pdfDoc = await PDFDocument.load(existingPdfBytes);


      // Fill or manipulate PDF fields here
       const pdfDocModified = await modifyPDF(
         pdfDoc,
         form_schema,
         form_response,
         signature_data
       );

      // Save the modified PDF and convert to a Blob
      const pdfDocForm = pdfDocModified.getForm();
      pdfDocForm.flatten();
      const pdfBytes = await pdfDocModified.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      // Create a blob URL to render in an iframe
      const blobUrl = URL.createObjectURL(blob);
      setPdfUrl(blobUrl);
    } catch (error) {
      console.error("Detailed error in PDF generation:", error);
      // Show more specific error message if available
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to generate PDF preview");
      }
    } finally {
      setLoading(false);
    }
  };

  // Call generatePDF on mount
  useEffect(() => {
    const callGeneratePDF = async () => {
      try {
        const form = await getForm(formId);
        setFormData(form);

        // Check if form has signatures and can be edited
        const hasSignatureSequence = form.signature_sequence && form.signature_sequence.length > 0;
        setHasSignatures(hasSignatureSequence);
        setCanEdit(!hasSignatureSequence);

        // Check if this is a custom form by looking for file_upload_pdf field
        const isCustomForm = Boolean(form.file_upload_pdf && form.file_upload_pdf.length > 0);
        
        
        // Use custom_schema for custom forms, otherwise fetch schema by form type
        let form_schema: SchemaItem[];
        if (isCustomForm) {
          form_schema = form.custom_schema || [];
        } else {
          form_schema = await getSchemaByFormType(form.form_type);
        }

        const signatureSequence = form.signature_sequence;
        let signature_data: Record<string, Record<string, string>> = {};
        if (signatureSequence) {
          for (const step of signatureSequence) {
            for (const signer of step) {
              if (signer.row_uuid) {
                const signatureCollection = await getSignatureCollection(
                  signer.row_uuid
                );
                
                // Merge nested signature data structure
                if (signatureCollection.signature_data) {
                  Object.assign(signature_data, signatureCollection.signature_data);
                }
              }
            }
          }
        }

        await generatePDF(
          form.form_type,
          form_schema,
          form.form_response,
          signature_data,
          form
        );
        setFormType(form.form_type);

        if (form.created_at) {
          try {
            const date = new Date(form.created_at);
            setCreationDate(date.toLocaleDateString());
          } catch {
            setCreationDate(form.created_at);
          }
        }

        if (form.deal_option_id) {
          const dealOption = await getDealOption(form.deal_option_id);
          setDealOption(dealOption.address);
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
        toast.error("Failed to fetch form data");
      }
    };
    callGeneratePDF();
  }, [formId]);

  // Handler to export/download the final PDF
  const handleExport = () => {
    downloadFunction(dealId, formId);
  };

  // Handle removing all signatures and re-enabling form editing
  const handleRemoveSignatures = async () => {
    if (!formId) {
      toast.error("No form selected");
      return;
    }
    setIsRevokingSignatures(true);
    try {
      await removeSignaturesAndEnableEditing(formId);
      toast.success("Signatures removed and form editing re-enabled!");

      // Trigger the callback to refresh form data in parent component
      if (onSignaturesRevoked) {
        onSignaturesRevoked();
      }
    } catch (error) {
      console.error("Error removing signatures:", error);
      toast.error(
        `Failed to remove signatures: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      router.refresh();
      setIsRevokingSignatures(false);
    }
  };

  // Handle renewing signatures
  const handleRenewSignatures = async () => {
    if (!formId || !formData) {
      toast.error("No form selected");
      return;
    }
    setIsRenewingSignatures(true);
    setRenewed(false);
    try {
      // Fetch the form to get the signature_sequence
      const form = formData;
      if (!form.signature_sequence || form.signature_sequence.length === 0) {
        throw new Error("No signature sequence found");
      }
      // Find the first valid signatureCollectionId (row_uuid)
      let signatureCollectionId = null;
      for (const step of form.signature_sequence) {
        for (const signer of step) {
          if (signer.row_uuid) {
            signatureCollectionId = signer.row_uuid;
            break;
          }
        }
        if (signatureCollectionId) break;
      }
      if (!signatureCollectionId) {
        throw new Error("No signature collection ID found");
      }
      await renewSignatureCollection(signatureCollectionId);
      setRenewed(true);
      toast.success("Signatures renewed!");
    } catch (error) {
      console.error("Error renewing signatures:", error);
      toast.error(
        `Failed to renew signatures: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsRenewingSignatures(false);
      setTimeout(() => setRenewed(false), 2000);
    }
  };

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="w-full h-full px-6">
      <Card className="border rounded-lg shadow-sm overflow-hidden h-full">
        <CardHeader className="bg-white p-4 border-b flex flex-row justify-between items-start">
          <div className="flex items-center space-x-4">
            {showBackButton && onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Preview: {formTypeDisplay(formType)}</h1>
              {(dealOption || creationDate) && (
                <p className="text-sm text-muted-foreground mt-1">
                  {dealOption && `${dealOption}`}
                  {dealOption && creationDate && " • "}
                  {creationDate && `Created on ${creationDate}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 min-w-0">
            {/* Download PDF button - always visible */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex items-center gap-2 min-w-fit"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download the completed PDF form with all filled data and signatures</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Signature management buttons - only when signatures exist */}
            {hasSignatures && !canEdit && (
              <div className="flex flex-col gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveSignatures}
                      disabled={isRevokingSignatures}
                      className="flex items-center gap-2 min-w-fit text-sm"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>
                        {isRevokingSignatures ? "Revoking..." : "Revoke Signatures"}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove all signatures and allow the form to be edited again</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleRenewSignatures}
                      disabled={isRenewingSignatures}
                      className="flex items-center gap-2 min-w-fit text-sm bg-blue-600 hover:bg-blue-700"
                    >
                      {isRenewingSignatures ? (
                        <span>Renewing...</span>
                      ) : renewed ? (
                        <span>✓ Renewed</span>
                      ) : (
                        <span>Renew Signatures</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Extend signature collection period for another 3 days</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {loading || !pdfUrl ? (
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <div className="flex-grow flex justify-center items-start pb-10 pt-10">
                <div className="w-full max-w-[900px] bg-white rounded-lg shadow border border-gray-300 overflow-hidden">
                  {/* PDF Header */}
                  <div className="h-12 bg-gray-100 animate-pulse px-6 py-2 border-b border-gray-300">
                    <div className="h-5 w-1/3 bg-gray-200 rounded animate-pulse" />
                  </div>

                  {/* PDF Content */}
                  <div className="p-6 space-y-8">
                    {/* Section 1 */}
                    <div className="space-y-4">
                      <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <div className="h-3 w-1/4 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-4">
                      <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                      <div className="grid grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="space-y-2">
                            <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Checkbox Area */}
                    <div className="space-y-3">
                      <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                      <div className="flex items-center space-x-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gray-100 rounded animate-pulse" />
                            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Signature Section */}
                    <div className="pt-8 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PDF Footer */}
                  <div className="h-10 bg-gray-100 animate-pulse border-t border-gray-300 px-6 py-2">
                    <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center bg-gray-50 p-4">
              <iframe
                src={pdfUrl}
                width="100%"
                height="700px"
                style={{ border: "none" }}
                title="PDF Preview"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}