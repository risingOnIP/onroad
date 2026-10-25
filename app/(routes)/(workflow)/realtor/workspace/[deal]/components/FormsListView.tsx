"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  Mail,
  FileText,
  AlertCircle,
  Edit3,
  Eye,
  Home,
  PenTool,
} from "lucide-react";
import { getDealOptionsWithForms } from "@/app/actions/realtor/deal-option-actions";
import { getSchemaByFormType } from "@/app/actions/realtor/schema";
import {
  DealOptionFormMerged,
  Form,
} from "@/components/files/types/realtor";
import { toast } from "sonner";
import FormsListViewSkeleton from "@/components/loading-skeletons/FormsListViewSkeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import DealSignaturePanel from "../components_layout/DealSignaturePanel";
import DealReviewPanel from "../components_layout/DealReviewPanel";
import SendActionsDropdown from "./SendActionsDropdown";
import { formTypeDisplay } from "./PreviewSection";

interface FormWithProgress {
  form: Form & {
    deal_option_address: string;
  };
  completion_percentage: number;
  status:
    | "not_started"
    | "in_progress"
    | "ready_for_signatures"
    | "sent_for_signatures"
    | "finalized";
  is_custom_form: boolean;
}

interface DealOptionWithForms extends DealOptionFormMerged {
  forms_with_progress: FormWithProgress[];
}

interface FormsListViewProps {
  dealId: string;
  onEditForm: (formId: string) => void;
  onPreview?: (formId: string) => void;
  onFinalized?: (formId: string) => void;
}

const FormsListView: React.FC<FormsListViewProps> = ({
  dealId,
  onEditForm,
  onPreview,
  onFinalized,
}) => {
  const [dealOptions, setDealOptions] = useState<DealOptionWithForms[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);

  useEffect(() => {
    if (dealId) {
      fetchDealOptionsWithForms();
    }
  }, [dealId]);

  const calculateFormProgress = async (form: Form): Promise<number> => {
    // For custom forms, don't calculate progress
    if (form.file_upload_pdf) return 0;

    let schema;

    // Use custom schema if it exists, otherwise get the default schema for the form type
    if (form.custom_schema && form.custom_schema.length > 0) {
      schema = form.custom_schema;
    } else {
      try {
        schema = await getSchemaByFormType(form.form_type);
      } catch (error) {
        console.error(
          `Error fetching schema for form type ${form.form_type}:`,
          error
        );
        return 0;
      }
    }

    const responses = form.form_response || {};

    if (!schema || schema.length === 0) return 0;

    // Only count required fields for progress calculation
    const requiredFields = schema.filter(
      (item) => item.display_attributes.isRequired
    );

    if (requiredFields.length === 0) return 100; // If no required fields, consider complete

    const filledRequiredFields = requiredFields.filter((item) => {
      const response = responses[item.unique_id];
      return response !== undefined && response !== null && response !== "";
    });

    return Math.round(
      (filledRequiredFields.length / requiredFields.length) * 100
    );
  };

  const determineFormStatus = async (
    form: Form
  ): Promise<FormWithProgress["status"]> => {
    // Check if finalized first
    if (form.finalized_pdf) return "finalized";

    // Check if sent for signatures
    if (form.signature_sequence && form.signature_sequence.length > 0) {
      return "sent_for_signatures";
    }

    // For custom forms, only check if they have any responses
    if (form.file_upload_pdf) {
      if (form.form_response && Object.keys(form.form_response).length > 0) {
        return "in_progress";
      }
      return "not_started";
    }

    // For regular forms, check progress
    const progress = await calculateFormProgress(form);

    if (progress === 0) return "not_started";
    if (progress === 100) return "ready_for_signatures";
    return "in_progress";
  };

  const fetchDealOptionsWithForms = async () => {
    if (!dealId) return;

    setIsLoading(true);
    try {
      // Get all deal options with their forms
      const fetchedDealOptions: DealOptionFormMerged[] =
        await getDealOptionsWithForms(dealId);

      // Process each deal option to add progress information
      const processedDealOptions: DealOptionWithForms[] = [];

      for (const dealOption of fetchedDealOptions) {
        const formsWithProgress: FormWithProgress[] = [];

        for (const form of dealOption.forms || []) {
          const completion_percentage = await calculateFormProgress(form);
          const status = await determineFormStatus(form);

          formsWithProgress.push({
            form: {
              ...form,
              deal_option_address: dealOption.address,
            },
            completion_percentage,
            status,
            is_custom_form: !!form.file_upload_pdf,
          });
        }

        processedDealOptions.push({
          ...dealOption,
          forms_with_progress: formsWithProgress,
        });
      }

      setDealOptions(processedDealOptions);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching deal options and forms:", error);
      toast.error("Failed to load forms and deal options");
    } finally {
      setIsLoading(false);
    }
  };



  const getStatusBadge = (status: FormWithProgress["status"]) => {
    switch (status) {
      case "finalized":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Finalized
          </Badge>
        );
      case "sent_for_signatures":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            Sent for Signatures
          </Badge>
        );
      case "ready_for_signatures":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            Ready for Signatures
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Not Started
          </Badge>
        );
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  if (isLoading) {
    return <FormsListViewSkeleton />;
  }

  // Check if we have any forms at all
  const totalForms = dealOptions.reduce(
    (acc, option) => acc + option.forms_with_progress.length,
    0
  );

  if (totalForms === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Forms Found
          </h3>
          <p className="text-gray-500 mb-4">
            No forms have been created for this deal yet.
          </p>
          <p className="text-gray-500">
            Open the sidebar to create forms and get started.
          </p>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const allForms = dealOptions.flatMap((option) => option.forms_with_progress);
  const finalizedForms = allForms.filter((form) => form.status === "finalized");
  const sentForSignaturesForms = allForms.filter(
    (form) => form.status === "sent_for_signatures"
  );
  const inProgressForms = allForms.filter(
    (form) => form.status === "in_progress"
  );
  const notStartedForms = allForms.filter(
    (form) => form.status === "not_started"
  );

  const handleFormAction = (
    formId: string,
    formStatus: FormWithProgress["status"]
  ) => {
    if (formStatus === "finalized" && onFinalized) {
      onFinalized(formId);
    } else if (formStatus === "in_progress" && onPreview) {
      onPreview(formId);
    } else {
      onEditForm(formId);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden min-h-0">
      {/* Header + Summary (non-scrollable) */}
      <div className="flex-shrink-0 space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Forms & Deal Options
            </h1>
            <p className="text-gray-600 mt-1">
              Track the progress of all forms across deal options
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Last updated: {formatTimeAgo(lastUpdated)}
            </span>
            <Button
              onClick={fetchDealOptionsWithForms}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
            <SendActionsDropdown
              onSendSignatures={() => setShowSignaturePanel(true)}
              onSendForReview={() => setShowReviewPanel(true)}
              showReviewOption={true}
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Total Forms
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalForms}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Finalized</p>
                  <p className="text-2xl font-bold text-green-600">
                    {finalizedForms.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Sent for Signatures
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {sentForSignaturesForms.length}
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
                  <p className="text-sm font-medium text-gray-900">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {inProgressForms.length}
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
                  <p className="text-sm font-medium text-gray-900">
                    Not Started
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {notStartedForms.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scrollable Forms List */}
      <ScrollArea className="flex-1 p-6 min-h-0">
        <div className="space-y-6">
          {dealOptions.map((dealOption) => (
            <Card key={dealOption.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Home className="w-5 h-5" />
                      {dealOption.address}
                      <Badge variant="outline" className="text-xs">
                        {dealOption.forms_with_progress.length} forms
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Deal Option • Created{" "}
                      {formatTimeAgo(new Date(dealOption.created_at))}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {dealOption.forms_with_progress.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No forms created for this deal option yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dealOption.forms_with_progress.map((formWithProgress) => (
                      <div
                        key={formWithProgress.form.id}
                        className="border rounded-lg p-4 bg-white"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <h4 className="font-medium text-gray-900">
                                {formTypeDisplay(formWithProgress.form.form_type)}
                              </h4>
                              {getStatusBadge(formWithProgress.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>
                                Progress:{" "}
                                {formWithProgress.completion_percentage}%
                              </span>
                              <span>
                                Created:{" "}
                                {formatTimeAgo(
                                  new Date(formWithProgress.form.created_at)
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {formWithProgress.status === "finalized" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleFormAction(
                                    formWithProgress.form.id,
                                    formWithProgress.status
                                  )
                                }
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Finalized
                              </Button>
                            ) : formWithProgress.status ===
                              "sent_for_signatures" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  onPreview &&
                                  onPreview(formWithProgress.form.id)
                                }
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  onEditForm(formWithProgress.form.id)
                                }
                              >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit Form
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar - Only show for non-custom forms that are not finalized or sent for signatures */}
                        {!formWithProgress.is_custom_form &&
                          formWithProgress.status !== "finalized" &&
                          formWithProgress.status !== "sent_for_signatures" && (
                            <div className="mt-3">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Completion Progress</span>
                                <span>
                                  {formWithProgress.completion_percentage}%
                                </span>
                              </div>
                              <Progress
                                value={formWithProgress.completion_percentage}
                                className="h-2"
                              />
                            </div>
                          )}

                        {/* Custom Form Note */}
                        {formWithProgress.is_custom_form && (
                          <div className="mt-3">
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span>Custom PDF Form</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {showSignaturePanel && (
        <DealSignaturePanel
          dealId={dealId}
          isOpen={showSignaturePanel}
          onClose={() => setShowSignaturePanel(false)}
        />
      )}

      {showReviewPanel && (
        <DealReviewPanel
          dealId={dealId}
          isOpen={showReviewPanel}
          onClose={() => setShowReviewPanel(false)}
        />
      )}
    </div>
  );
};

export default FormsListView;
