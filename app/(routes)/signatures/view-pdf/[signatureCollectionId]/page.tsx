"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  FileText, 
  MapPin, 
  Calendar, 
  User,
  CheckCircle,
  Clock,
  ArrowLeft,
  Download,
  Loader2
} from "lucide-react";
import { SignatureCollection, Form } from "@/components/files/types/realtor";

interface ExtendedForm extends Form {
  dealOptions?: {
    id: string;
    address: string;
  };
}

export default function ViewPdfPage() {
  const params = useParams();
  const router = useRouter();
  const signatureCollectionId = params.signatureCollectionId as string;
  
  const [loading, setLoading] = useState(true);
  const [signatureData, setSignatureData] = useState<SignatureCollection | null>(null);
  const [formData, setFormData] = useState<ExtendedForm | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const NEXT_PUBLIC_EXPRESS_API_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

  useEffect(() => {
    loadSignatureData();
  }, [signatureCollectionId]);

  // Clean up blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const loadSignatureData = async () => {
    setLoading(true);
    try {
      // Get signature collection data directly (no auth required for viewing)
      const response = await fetch(`${NEXT_PUBLIC_EXPRESS_API_URL}/jwt/signing/get-signature-collection/${signatureCollectionId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load signature data');
      }

      const sigData = await response.json() as SignatureCollection;
      setSignatureData(sigData);

      // Get form data using JWT endpoint (no auth required)
      const formResponse = await fetch(`${NEXT_PUBLIC_EXPRESS_API_URL}/jwt/signing/form/${sigData.form_id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (formResponse.ok) {
        const formDataResponse = await formResponse.json() as ExtendedForm;
        setFormData(formDataResponse);

        // Set PDF URL - try different sources in order of preference
        if (formDataResponse.finalized_pdf) {
          // Use dedicated finalized-pdf endpoint to get the signed PDF with signatures
          try {
            const finalizedResponse = await fetch(`${NEXT_PUBLIC_EXPRESS_API_URL}/jwt/signing/finalized-pdf/${sigData.form_id}`, {
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (finalizedResponse.ok) {
              const finalizedData = await finalizedResponse.json();
              setPdfUrl(finalizedData.pdfUrl);
            } else {
              const errorData = await finalizedResponse.json();
              console.error('Failed to get finalized PDF:', errorData.error);
              // Fall back to generate-preview-pdf endpoint
              try {
                const previewResponse = await fetch(`${NEXT_PUBLIC_EXPRESS_API_URL}/jwt/signing/generate-preview-pdf/${sigData.form_id}`, {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });

                if (previewResponse.ok) {
                  const contentType = previewResponse.headers.get('content-type');
                  
                  if (contentType && contentType.includes('application/pdf')) {
                    const pdfBlob = await previewResponse.blob();
                    const blobUrl = URL.createObjectURL(pdfBlob);
                    setPdfUrl(blobUrl);
                  } else {
                    const previewData = await previewResponse.json();
                    setPdfUrl(previewData.pdfUrl);
                  }
                }
              } catch (err) {
                console.error('Fallback preview also failed:', err);
              }
            }
          } catch (finalizedError) {
            console.error('Error getting finalized PDF:', finalizedError);
            // Keep pdfUrl as null to show "not available" message
          }
        } else if (formDataResponse.file_upload_pdf && formDataResponse.file_upload_pdf !== '') {
          // Generate signed URL for uploaded PDF using the generate-preview-pdf endpoint
          try {
            const previewResponse = await fetch(`${NEXT_PUBLIC_EXPRESS_API_URL}/jwt/signing/generate-preview-pdf/${sigData.form_id}`, {
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (previewResponse.ok) {
              const contentType = previewResponse.headers.get('content-type');
              
              if (contentType && contentType.includes('application/pdf')) {
                // For template forms: API returns PDF directly as binary data
                const pdfBlob = await previewResponse.blob();
                const blobUrl = URL.createObjectURL(pdfBlob);
                setPdfUrl(blobUrl);
              } else {
                // For custom forms: API returns JSON with URL
                const previewData = await previewResponse.json();
                setPdfUrl(previewData.pdfUrl);
              }
            } else {
              const errorData = await previewResponse.json();
              console.error('Failed to generate preview PDF:', errorData.error);
              // Keep pdfUrl as null to show "not available" message
            }
          } catch (previewError) {
            console.error('Error generating preview PDF:', previewError);
            // Keep pdfUrl as null to show "not available" message
          }
        } else {
          // Generate preview PDF from template and form data
          try {
            const previewResponse = await fetch(`${NEXT_PUBLIC_EXPRESS_API_URL}/jwt/signing/generate-preview-pdf/${sigData.form_id}`, {
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (previewResponse.ok) {
              const contentType = previewResponse.headers.get('content-type');
              
              if (contentType && contentType.includes('application/pdf')) {
                // For template forms: API returns PDF directly as binary data
                const pdfBlob = await previewResponse.blob();
                const blobUrl = URL.createObjectURL(pdfBlob);
                setPdfUrl(blobUrl);
              } else {
                // For custom forms: API returns JSON with URL
                const previewData = await previewResponse.json();
                setPdfUrl(previewData.pdfUrl);
              }
            } else {
              const errorData = await previewResponse.json();
              console.error('Failed to generate preview PDF:', errorData.error);
              // Keep pdfUrl as null to show "not available" message
            }
          } catch (previewError) {
            console.error('Error generating preview PDF:', previewError);
            // Keep pdfUrl as null to show "not available" message
          }
        }
      }
    } catch (error) {
      console.error('Error loading signature data:', error);
      toast.error('Failed to load document. The document may not exist or you may not have permission to view it.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (pdfUrl && formData) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${formData.form_type}.pdf`;
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading document...</span>
        </div>
      </div>
    );
  }

  if (!signatureData || !formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h2 className="text-lg font-semibold mb-2">Document Not Found</h2>
              <p className="text-gray-600 mb-4">
                The requested document could not be found or you don&apos;t have permission to view it.
              </p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  {formData.form_type}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  {formData.dealOptions?.address && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {formData.dealOptions.address}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Created: {new Date(formData.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={signatureData.signature_data ? "default" : "secondary"}>
                {signatureData.signature_data ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </>
                )}
              </Badge>
              {pdfUrl && (
                <Button onClick={downloadPdf} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Document Info */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Assigned to:</span>
              <span>{signatureData.action_email}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Role:</span>
              <span className="capitalize">{signatureData.actionAs}</span>
            </div>
            <div className="ml-auto">
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                VIEW ONLY
              </Badge>
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[800px] border-0"
              title={`${formData.form_type} - View Only`}
            />
          ) : (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                PDF Preview Not Available
              </h3>
              <p className="text-gray-600">
                This document is still being processed or the PDF could not be generated.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}