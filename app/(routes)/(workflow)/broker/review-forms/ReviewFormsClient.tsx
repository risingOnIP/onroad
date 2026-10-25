'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Home, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFormsForReview, updateFormReviewStage, FormForReview } from '@/app/actions/broker/form-review-actions';
import { FormSummary } from '@/components/files/broker/FormSummary';

export default function ReviewFormsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const realtorId = searchParams.get('realtorId');
  const [forms, setForms] = useState<FormForReview[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormForReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'mls-cad' | 'summary'>('summary');
  const [currentFormIndex, setCurrentFormIndex] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [mlsCadView, setMlsCadView] = useState<'mls' | 'cad'>('mls');

  useEffect(() => {
    fetchForms();
  }, [realtorId]);

  // Update PDF URL when selected form changes
  useEffect(() => {
    let currentBlobUrl: string | null = null;

    const generatePdfUrl = async () => {
      if (selectedForm) {
        try {
          // Use the existing JWT signing endpoint for PDF preview
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/jwt/signing/generate-preview-pdf/${selectedForm.id}`,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/pdf')) {
              // PDF returned as binary, create blob URL
              const pdfBlob = await response.blob();
              const blobUrl = URL.createObjectURL(pdfBlob);
              currentBlobUrl = blobUrl;
              setPdfUrl(blobUrl);
            } else {
              // PDF URL returned as JSON
              const data = await response.json();
              setPdfUrl(data.pdfUrl);
            }
          } else {
            console.error('Failed to generate PDF preview');
            setPdfUrl(null);
          }
        } catch (error) {
          console.error('Error generating PDF URL:', error);
          setPdfUrl(null);
        }
      } else {
        setPdfUrl(null);
      }
    };

    generatePdfUrl();

    // Cleanup blob URL when component unmounts or form changes
    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [selectedForm]);

  const fetchForms = async () => {
    try {
      let data = await getFormsForReview();
      
        data = data.filter(form => {
          const formRealtorId = form.deal_option?.deal?.realtor?.id;
          return realtorId === formRealtorId;
        });
      
      setForms(data);
      
      // Auto-select first form in reviewing stage
      const reviewingFormIndex = data.findIndex((f: FormForReview) => f.review_stage === 'reviewing');
      if (reviewingFormIndex !== -1) {
        setCurrentFormIndex(reviewingFormIndex);
        setSelectedForm(data[reviewingFormIndex]);
      } else if (data.length > 0) {
        setCurrentFormIndex(0);
        setSelectedForm(data[0]);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to load forms for review');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReviewStage = async (formId: string, newStage: 'approved' | 'not_sent') => {
    setIsUpdating(true);
    try {
      await updateFormReviewStage(formId, newStage);
      
      toast.success(`Form ${newStage === 'approved' ? 'approved' : 'sent back for revision'}`);
      
      // Refresh forms list
      const updatedForms = await getFormsForReview();
      setForms(updatedForms);
      
      // Auto-advance to next form if approved
      if (newStage === 'approved') {
        // Find the next form that needs review (status = 'reviewing')
        const nextReviewingForm = updatedForms.find(
          (f: FormForReview) => f.review_stage === 'reviewing'
        );
        
        if (nextReviewingForm) {
          const nextIndex = updatedForms.findIndex((f: FormForReview) => f.id === nextReviewingForm.id);
          setCurrentFormIndex(nextIndex);
          setSelectedForm(nextReviewingForm);
        } else if (currentFormIndex < updatedForms.length - 1) {
          // If no more forms need review, just go to the next form in the list
          const nextIndex = currentFormIndex + 1;
          setCurrentFormIndex(nextIndex);
          setSelectedForm(updatedForms[nextIndex]);
        } else {
          // All forms processed
          toast.success('All forms have been reviewed!');
        }
      }
    } catch (error) {
      console.error('Error updating form:', error);
      toast.error('Failed to update form status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (stage: string) => {
    switch (stage) {
      case 'reviewing':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      default:
        return <Badge variant="outline">Not Sent</Badge>;
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleFormSelect = (index: number) => {
    setCurrentFormIndex(index);
    setSelectedForm(forms[index]);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push('/broker/workspace')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                Form Review
                {realtorId && forms.length > 0 && (
                  <span> - {forms[0]?.deal_option?.deal?.realtor?.full_name || 'Realtor'}</span>
                )}
              </h1>
              {realtorId && forms.length > 0 && forms[0]?.deal_option?.deal?.realtor?.email && (
                <p className="text-sm text-gray-500 mt-1">{forms[0].deal_option.deal.realtor.email}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {forms.filter(f => f.review_stage === 'reviewing').length} Pending Review
            </Badge>
          </div>
        </div>
      </div>

      {/* Forms Breadcrumb */}
      {forms.length > 0 && (
        <div className="border-b px-6 py-3 bg-muted/30">
          <div className="flex items-center gap-2 overflow-x-auto">
            {forms.map((form, index) => (
              <div key={form.id} className="flex items-center">
                <Button
                  variant={currentFormIndex === index ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleFormSelect(index)}
                  className="flex items-center gap-2"
                >
                  <span className="text-xs font-medium">
                    {index + 1}. {form.form_type}
                  </span>
                  {form.review_stage === 'reviewing' && (
                    <Clock className="h-3 w-3" />
                  )}
                  {form.review_stage === 'approved' && (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  )}
                </Button>
                {index < forms.length - 1 && (
                  <span className="mx-2 text-muted-foreground">/</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - 50% */}
        <div className="w-1/2 border-r flex flex-col">

          {/* Tabs Section */}
          <div className="flex-1 p-4 flex flex-col">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">
                  <FileText className="w-4 h-4 mr-2" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="mls-cad">
                  <Home className="w-4 h-4 mr-2" />
                  MLS & CAD
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Form Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[calc(100vh-500px)]">
                      {selectedForm ? (
                        <FormSummary 
                          formType={selectedForm.form_type}
                          formResponse={selectedForm.form_response}
                          propertyAddress={selectedForm.deal_option?.address}
                        />
                      ) : (
                        <p className="text-muted-foreground">Select a form to view summary</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mls-cad" className="mt-4 flex flex-col flex-1">
                {/* Toggle Button */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={mlsCadView === 'mls' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMlsCadView('mls')}
                      className="flex items-center gap-2"
                    >
                      <Home className="w-4 h-4" />
                      MLS Listing
                    </Button>
                    <Button
                      variant={mlsCadView === 'cad' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMlsCadView('cad')}
                      className="flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      CAD Property
                    </Button>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => window.open(mlsCadView === 'mls' ? 'https://ntreis.clareityiam.net/idp/login' : 'https://www.collincad.org', '_blank')}
                  >
                    Open in New Tab
                  </Button>
                </div>

                {/* Iframe Display - Edge to Edge */}
                <div className="flex-1 -mx-4 -mb-4">
                  {mlsCadView === 'mls' ? (
                    <iframe
                      src="https://ntreis.clareityiam.net/idp/login"
                      className="w-full h-full border-0"
                      title="MLS Listing"
                    />
                  ) : (
                    <iframe
                      src="https://www.collincad.org"
                      className="w-full h-full border-0"
                      title="CAD Property Data"
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Action Buttons */}
          {selectedForm && selectedForm.review_stage === 'reviewing' && (
            <div className="border-t p-4 flex gap-2">
              <Button
                className="flex-1"
                variant="destructive"
                onClick={() => handleUpdateReviewStage(selectedForm.id, 'not_sent')}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Request Revision
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleUpdateReviewStage(selectedForm.id, 'approved')}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Approve Form
              </Button>
            </div>
          )}
        </div>

        {/* Right Side - 50% - PDF Preview */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold">PDF Preview</h2>
          </div>
          <div className="flex-1 p-4">
            {selectedForm && pdfUrl ? (
              <iframe
                key={selectedForm.id}
                src={pdfUrl}
                className="w-full h-full border rounded"
                title="PDF Preview"
              />
            ) : selectedForm ? (
              <div className="flex items-center justify-center h-full bg-muted rounded">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-muted rounded">
                <p className="text-muted-foreground">
                  Select a form to preview
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}