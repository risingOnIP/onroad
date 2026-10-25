'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Mail, 
  FileText, 
  User, 
  Calendar,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { getDealOptionsWithForms } from '@/app/actions/realtor/deal-option-actions';
import { getSignatureCollection } from '@/app/actions/realtor/signatures-actions';
import { DealOptionFormMerged, SignatureCollection } from '@/components/files/types/realtor';
import { toast } from 'sonner';

interface SignatureProgress {
  form: {
    id: string;
    form_type: string;
    deal_option_address: string;
  };
  signingSteps: {
    stepIndex: number;
    signers: {
      email: string;
      display_names: string[];
      actionAs: string;
      status: 'pending' | 'sent' | 'signed' | 'expired';
      signatureCollection?: SignatureCollection;
      hoursLeft?: number;
      sentAt?: Date;
      signedAt?: Date;
    }[];
    isComplete: boolean;
    isActive: boolean;
  }[];
  overallStatus: 'not_started' | 'in_progress' | 'completed';
}

const FormsPage = () => {
  const params = useParams<{ deal: string }>();
  const dealId = params?.deal;
  
  const [signatureProgress, setSignatureProgress] = useState<SignatureProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (dealId) {
      fetchSignatureProgress();
    }
  }, [dealId]);

  const fetchSignatureProgress = async () => {
    if (!dealId) return;
    
    setIsLoading(true);
    try {
      // Get all deal options with their forms
      const dealOptions: DealOptionFormMerged[] = await getDealOptionsWithForms(dealId);
      
      // Extract all forms from all deal options
      const allForms = dealOptions.flatMap(dealOption => 
        (dealOption.forms || []).map(form => ({
          ...form,
          deal_option_address: dealOption.address
        }))
      );

      // Filter forms that have signature sequences
      const formsWithSignatures = allForms.filter(form => 
        form.signature_sequence && form.signature_sequence.length > 0
      );

      const progressData: SignatureProgress[] = [];

      for (const form of formsWithSignatures) {
        const signingSteps: SignatureProgress['signingSteps'] = [];
        let overallStatus: SignatureProgress['overallStatus'] = 'not_started';
        let hasAnySent = false;
        let allCompleted = true;

        for (let stepIndex = 0; stepIndex < form.signature_sequence.length; stepIndex++) {
          const step = form.signature_sequence[stepIndex];
          const signers: SignatureProgress['signingSteps'][0]['signers'] = [];
          let stepCompleted = true;

          for (const signer of step) {
            const signerData: SignatureProgress['signingSteps'][0]['signers'][0] = {
              email: signer.email,
              display_names: signer.display_names || [],
              actionAs: signer.actionAs,
              status: 'pending'
            };

            if (signer.row_uuid && signer.row_uuid !== '') {
              try {
                const signatureCollection = await getSignatureCollection(signer.row_uuid);
                signerData.signatureCollection = signatureCollection;
                signerData.status = 'sent';
                signerData.sentAt = new Date(signatureCollection.created_at);
                hasAnySent = true;

                // Calculate hours left (24 hour expiry)
                const hoursElapsed = (new Date().getTime() - new Date(signatureCollection.created_at).getTime()) / (1000 * 60 * 60);
                signerData.hoursLeft = Math.max(0, Math.round(24 - hoursElapsed));

                // Check if signed
                if (signatureCollection.signature_data && 
                    Object.values(signatureCollection.signature_data).some(value => value && Object.keys(value).length > 0)) {
                  signerData.status = 'signed';
                  // Find latest signature event for signed timestamp
                  const signedEvent = signatureCollection.audit_json?.events
                    ?.filter(e => e.event === 'signature_applied')
                    ?.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                  if (signedEvent) {
                    signerData.signedAt = new Date(signedEvent.timestamp);
                  }
                } else {
                  stepCompleted = false;
                  if (signerData.hoursLeft === 0) {
                    signerData.status = 'expired';
                  }
                }
              } catch (error) {
                console.error(`Error fetching signature collection for ${signer.email}:`, error);
                signerData.status = 'pending';
                stepCompleted = false;
              }
            } else {
              stepCompleted = false;
            }

            signers.push(signerData);
          }

          if (!stepCompleted) {
            allCompleted = false;
          }

          // Determine if this step is active (previous steps completed)
          let isActive = false;
          if (stepIndex === 0) {
            isActive = !stepCompleted;
          } else {
            // Check if all previous steps are completed
            let allPreviousCompleted = true;
            for (let i = 0; i < stepIndex; i++) {
              const prevStep = signingSteps[i];
              if (!prevStep.isComplete) {
                allPreviousCompleted = false;
                break;
              }
            }
            isActive = allPreviousCompleted && !stepCompleted;
          }

          signingSteps.push({
            stepIndex: stepIndex + 1,
            signers,
            isComplete: stepCompleted,
            isActive
          });
        }

        // Determine overall status
        if (allCompleted) {
          overallStatus = 'completed';
        } else if (hasAnySent) {
          overallStatus = 'in_progress';
        } else {
          overallStatus = 'not_started';
        }

        progressData.push({
          form: {
            id: form.id,
            form_type: form.form_type,
            deal_option_address: form.deal_option_address
          },
          signingSteps,
          overallStatus
        });
      }

      setSignatureProgress(progressData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching signature progress:', error);
      toast.error('Failed to load signature progress');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-800 border-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed': return <CheckCircle className="w-4 h-4" />;
      case 'sent': return <Mail className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getOverallStatusBadge = (status: SignatureProgress['overallStatus']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Not Started</Badge>;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading signature progress...</p>
        </div>
      </div>
    );
  }

  if (signatureProgress.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Signature Requests Found</h3>
          <p className="text-gray-500">No forms in this deal require signatures yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Signature Progress</h1>
          <p className="text-gray-600 mt-1">
            Track the status of all signature requests in this deal
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Last updated: {formatTimeAgo(lastUpdated)}
          </span>
          <Button onClick={fetchSignatureProgress} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Total Forms</p>
                <p className="text-2xl font-bold text-blue-600">{signatureProgress.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {signatureProgress.filter(p => p.overallStatus === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {signatureProgress.filter(p => p.overallStatus === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Pending</p>
                <p className="text-2xl font-bold text-red-600">
                  {signatureProgress.filter(p => p.overallStatus === 'not_started').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms with Signature Progress */}
      <div className="space-y-6">
        {signatureProgress.map((progress) => (
          <Card key={progress.form.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {progress.form.form_type}
                    {getOverallStatusBadge(progress.overallStatus)}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {progress.form.deal_option_address !== 'deal-wide' && (
                      <span className="font-medium">{progress.form.deal_option_address} • </span>
                    )}
                    {progress.signingSteps.length} signing step{progress.signingSteps.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/realtor/workspace/${dealId}/forms/${progress.form.id}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Form
                  </a>
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-6">
                {progress.signingSteps.map((step, stepIndex) => (
                  <div key={stepIndex} className={`relative ${step.isActive ? 'ring-2 ring-blue-200 rounded-lg p-4 -m-4' : ''}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.isComplete 
                          ? 'bg-green-100 text-green-800' 
                          : step.isActive 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {step.isComplete ? <CheckCircle className="w-4 h-4" /> : step.stepIndex}
                      </div>
                      <h4 className="font-medium text-gray-900">
                        Step {step.stepIndex}
                        {step.isActive && <span className="ml-2 text-blue-600 text-sm">(Active)</span>}
                        {step.isComplete && <span className="ml-2 text-green-600 text-sm">(Completed)</span>}
                      </h4>
                    </div>
                    
                    <div className="grid gap-3 ml-11">
                      {step.signers.map((signer, signerIndex) => (
                        <div key={signerIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900">{signer.email}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="capitalize">{signer.actionAs}</span>
                                {signer.display_names.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{signer.display_names.join(', ')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(signer.status)}>
                              {getStatusIcon(signer.status)}
                              <span className="ml-1 capitalize">{signer.status}</span>
                            </Badge>
                            
                            {signer.status === 'sent' && signer.hoursLeft !== undefined && (
                              <div className="text-sm text-gray-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {signer.hoursLeft > 0 ? `${signer.hoursLeft}h left` : 'Expired'}
                              </div>
                            )}
                            
                            {signer.sentAt && (
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Sent {formatTimeAgo(signer.sentAt)}
                              </div>
                            )}
                            
                            {signer.signedAt && (
                              <div className="text-sm text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Signed {formatTimeAgo(signer.signedAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {stepIndex < progress.signingSteps.length - 1 && (
                      <div className="flex justify-center mt-4">
                        <div className="w-px h-6 bg-gray-300"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FormsPage;
