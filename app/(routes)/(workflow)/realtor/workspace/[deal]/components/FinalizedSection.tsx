"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Download, ArrowLeft } from "lucide-react";
import { getForm } from "@/app/actions/realtor/form-actions";
import { getDealOption } from "@/app/actions/realtor/deal-option-actions";
import { generateSignedPDFURL } from "@/app/actions/realtor/signatures-actions";

interface FinalizedSectionProps {
  formId: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export default function FinalizedSection({ 
  formId, 
  onBack, 
  showBackButton = true 
}: FinalizedSectionProps) {
  const [finalizedPdfURL, setFinalizedPdfURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formType, setFormType] = useState<string>("");
  const [dealOption, setDealOption] = useState<string>("Loading...");
  const [creationDate, setCreationDate] = useState<string>("Loading...");

  useEffect(() => {
    const loadFinalizedPDF = async () => {
      try {
        setLoading(true);
        
        // Fetch form data for metadata
        const form = await getForm(formId);
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
          const dealOptionData = await getDealOption(form.deal_option_id);
          setDealOption(dealOptionData.address);
        }

        // Get the finalized PDF URL
        const pdfUrl = await generateSignedPDFURL(formId);
        setFinalizedPdfURL(pdfUrl);
      } catch (error) {
        console.error("Error loading finalized PDF:", error);
        toast.error("Failed to load finalized PDF");
      } finally {
        setLoading(false);
      }
    };

    loadFinalizedPDF();
  }, [formId]);

  const handleDownload = () => {
    if (finalizedPdfURL) {
      const link = document.createElement("a");
      link.href = finalizedPdfURL;
      link.download = `finalized-${formType}-${formId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
              <h1 className="text-xl font-semibold text-gray-900">Finalized: {formType}</h1>
              {(dealOption || creationDate) && (
                <p className="text-sm text-muted-foreground mt-1">
                  {dealOption && `${dealOption}`}
                  {dealOption && creationDate && " • "}
                  {creationDate && `Created on ${creationDate}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="cursor-pointer"
              disabled={!finalizedPdfURL}
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {loading || !finalizedPdfURL ? (
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
                src={finalizedPdfURL}
                width="100%"
                height="700px"
                style={{ border: "none" }}
                title="Finalized PDF"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}