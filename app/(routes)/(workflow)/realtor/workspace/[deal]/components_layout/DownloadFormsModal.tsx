"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  GripVertical,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { getDealOptionsWithForms } from "@/app/actions/realtor/deal-option-actions";

// Import the download function components
import { PDFDocument, StandardFonts, PageSizes } from "pdf-lib";
import { getSignatureCollection } from "@/app/actions/realtor/signatures-actions";
import { getProcessedPDFForForm } from "@/components/files/realtor/pdf-utils/downloadFunction";
import { Form } from "@/components/files/types/realtor";

interface FormWithSource extends Form {
  dealOptionAddress: string;
}

interface DealOptionWithForms {
  id: string;
  address: string;
  forms: FormWithSource[];
  isExpanded: boolean;
}

interface SelectedFormForDownload extends FormWithSource {
  originalIndex: number;
}

interface DownloadFormsModalProps {
  dealId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DownloadFormsModal({
  dealId,
  isOpen,
  onClose,
}: DownloadFormsModalProps) {
  const [dealOptions, setDealOptions] = useState<DealOptionWithForms[]>([]);
  const [selectedForms, setSelectedForms] = useState<SelectedFormForDownload[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Fetch forms when modal opens
  useEffect(() => {
    if (isOpen && dealId) {
      fetchForms();
    }
  }, [isOpen, dealId]);

  const fetchForms = async () => {
    setIsLoading(true);
    try {
      const dealOptionsData = await getDealOptionsWithForms(dealId);

      // Organize forms by deal options
      const organizedDealOptions: DealOptionWithForms[] = dealOptionsData.map(
        (dealOption) => ({
          id: dealOption.id,
          address: dealOption.address,
          forms: (dealOption.forms || []).map((form) => ({
            ...form,
            dealOptionAddress: dealOption.address,
          })),
          isExpanded: true, // Default to expanded
        })
      );

      setDealOptions(organizedDealOptions);
    } catch (error) {
      console.error("Error fetching forms:", error);
      toast.error("Failed to fetch forms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDealOption = (dealOptionId: string) => {
    setDealOptions((prev) =>
      prev.map((dealOption) =>
        dealOption.id === dealOptionId
          ? { ...dealOption, isExpanded: !dealOption.isExpanded }
          : dealOption
      )
    );
  };

  const handleAddFormToSelection = (form: FormWithSource) => {
    // Check if form is already selected
    const isAlreadySelected = selectedForms.some((sf) => sf.id === form.id);
    if (isAlreadySelected) return;

    setSelectedForms((prev) => [
      ...prev,
      {
        ...form,
        originalIndex: prev.length,
      },
    ]);
  };

  const handleRemoveFormFromSelection = (formId: string) => {
    setSelectedForms((prev) => prev.filter((form) => form.id !== formId));
  };

  const handleSelectAllFromDealOption = (dealOptionId: string) => {
    const dealOption = dealOptions.find((d) => d.id === dealOptionId);
    if (!dealOption) return;

    dealOption.forms.forEach((form) => {
      const isAlreadySelected = selectedForms.some((sf) => sf.id === form.id);
      if (!isAlreadySelected) {
        setSelectedForms((prev) => [
          ...prev,
          {
            ...form,
            originalIndex: prev.length,
          },
        ]);
      }
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newForms = [...selectedForms];
    const draggedItem = newForms[draggedItemIndex];

    // Remove dragged item
    newForms.splice(draggedItemIndex, 1);

    // Insert at new position
    newForms.splice(index, 0, draggedItem);

    setSelectedForms(newForms);
    setDraggedItemIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const downloadSelectedForms = async () => {
    if (selectedForms.length === 0) {
      toast.error("Please select at least one form to download");
      return;
    }

    setIsDownloading(true);
    try {
      toast.info("Preparing to download selected forms...");

      // Create a new PDF document for the combined output
      const combinedPDF = await PDFDocument.create();

      // Add a cover page
      // await addCoverPage(combinedPDF, dealId, selectedForms);

      // Process each selected form in order
      for (let i = 0; i < selectedForms.length; i++) {
        const form = selectedForms[i];
        try {
          toast.info(
            `Processing form ${i + 1} of ${selectedForms.length}: ${
              form.form_type
            }`
          );

          // Get signature data for this form in nested structure
          let signature_data: Record<string, Record<string, string>> = {};
          if (form.signature_sequence) {
            for (const step of form.signature_sequence) {
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

          // Use the new helper function to handle both standard and custom forms
          const modifiedPDF = await getProcessedPDFForForm(form, signature_data);

          // Flatten the form
          const pdfForm = modifiedPDF.getForm();
          pdfForm.flatten();

          // Section divider removed - no extra pages between forms

          // Copy pages to combined PDF
          const pages = await combinedPDF.copyPages(
            modifiedPDF,
            modifiedPDF.getPageIndices()
          );
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
      link.download = `Deal_${dealId}_Selected_Forms.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(blobUrl);

      toast.success("Selected forms downloaded successfully!");
      onClose();
    } catch (error) {
      console.error("Error downloading forms:", error);
      toast.error("Failed to download forms. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const totalFormsCount = dealOptions.reduce(
    (count, dealOption) => count + dealOption.forms.length,
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[95vh] !h-[90vh] !w-[90vw] !max-w-[1400px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Forms to Download 2
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex min-h-0 gap-4">
          {/* Left Panel - Available Forms by Deal Option */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Available Forms</h3>
              <Badge variant="outline" className="text-xs">
                {totalFormsCount} total forms
              </Badge>
            </div>

            <ScrollArea className="flex-1 min-h-0 border rounded-lg p-4 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Loading forms...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {dealOptions.map((dealOption) => (
                    <div key={dealOption.id} className="border rounded-lg">
                      {/* Deal Option Header */}
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-t-lg">
                        <button
                          onClick={() => handleToggleDealOption(dealOption.id)}
                          className="flex items-center gap-2 flex-1 text-left hover:bg-accent/50 rounded p-1 -m-1"
                        >
                          {dealOption.isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <FolderOpen className="h-4 w-4" />
                          <span className="font-medium text-sm">
                            {dealOption.address}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {dealOption.forms.length} forms
                          </Badge>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleSelectAllFromDealOption(dealOption.id)
                          }
                          className="text-xs"
                        >
                          Add All
                        </Button>
                      </div>

                      {/* Forms List */}
                      {dealOption.isExpanded && dealOption.forms.length > 0 && (
                        <div className="p-2 space-y-1">
                          {dealOption.forms.map((form) => {
                            const isSelected = selectedForms.some(
                              (sf) => sf.id === form.id
                            );
                            return (
                              <div
                                key={form.id}
                                className={`flex items-center gap-3 p-2 rounded border-l-2 hover:bg-accent/50 transition-colors ${
                                  isSelected
                                    ? "border-l-green-500 bg-green-50 dark:bg-green-950/20"
                                    : "border-l-transparent"
                                }`}
                              >
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {form.form_type}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {form.form_response ? "Filled" : "Empty"}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    isSelected
                                      ? handleRemoveFormFromSelection(form.id)
                                      : handleAddFormToSelection(form)
                                  }
                                  className="text-xs"
                                >
                                  {isSelected ? (
                                    <X className="h-3 w-3" />
                                  ) : (
                                    <ArrowRight className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {dealOption.isExpanded &&
                        dealOption.forms.length === 0 && (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No forms in this deal option
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel - Selected Forms for Download */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Download Queue</h3>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <Badge variant="outline" className="text-xs">
                  {selectedForms.length} selected
                </Badge>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 border rounded-lg p-4 overflow-auto">
              {selectedForms.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No forms selected
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select forms from the left panel to add them here
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedForms.map((form, index) => (
                    <div
                      key={form.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors ${
                        draggedItemIndex === index ? "opacity-50" : ""
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {index + 1}
                          </span>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium text-sm truncate">
                            {form.form_type}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {form.dealOptionAddress}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {form.form_response ? "Filled" : "Empty"}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFormFromSelection(form.id)}
                        className="text-xs"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Reorder Instructions */}
            {selectedForms.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Tip:</strong> Drag forms up and down to reorder
                  them. Forms will appear in the PDF in the order shown here.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDownloading}>
            Cancel
          </Button>
          <Button
            onClick={downloadSelectedForms}
            disabled={isDownloading || selectedForms.length === 0}
          >
            {isDownloading ? (
              "Downloading..."
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download {selectedForms.length} Form
                {selectedForms.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions for PDF generation
async function addCoverPage(
  pdf: PDFDocument,
  dealId: string,
  forms: SelectedFormForDownload[]
) {
  const page = pdf.addPage(PageSizes.A4);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  const height = page.getSize().height;

  // Title
  page.drawText("Selected Forms Package", {
    x: 50,
    y: height - 100,
    size: 24,
    font: boldFont,
  });

  // Deal ID
  page.drawText(`Deal ID: ${dealId}`, {
    x: 50,
    y: height - 140,
    size: 14,
    font: font,
  });

  // Generation date
  const now = new Date();
  page.drawText(
    `Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`,
    {
      x: 50,
      y: height - 160,
      size: 12,
      font: font,
    }
  );

  // Forms list
  page.drawText("Included Forms (in order):", {
    x: 50,
    y: height - 200,
    size: 16,
    font: boldFont,
  });

  let yPosition = height - 230;

  forms.forEach((form, index) => {
    if (yPosition < 100) return; // Stop if running out of space

    page.drawText(
      `${index + 1}. ${form.form_type} (${form.dealOptionAddress})`,
      {
        x: 70,
        y: yPosition,
        size: 12,
        font: font,
      }
    );
    yPosition -= 20;
  });
}

async function addSectionDivider(
  pdf: PDFDocument,
  formType: string,
  formNumber: number,
  dealOptionAddress: string
) {
  const page = pdf.addPage(PageSizes.A4);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  const height = page.getSize().height;
  const width = page.getSize().width;

  // Center the text
  page.drawText(`Form ${formNumber}`, {
    x: width / 2 - 40,
    y: height / 2 + 40,
    size: 18,
    font: boldFont,
  });

  page.drawText(formType, {
    x: width / 2 - formType.length * 6,
    y: height / 2,
    size: 16,
    font: font,
  });

  page.drawText(`Property: ${dealOptionAddress}`, {
    x: width / 2 - dealOptionAddress.length * 4,
    y: height / 2 - 40,
    size: 12,
    font: font,
  });
}
