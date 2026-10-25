"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  FileSignature,
  Send,
  X,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  UserX,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Calendar,
  Users,
  Plus,
  ArrowRight,
  UserPlus,
  Trash2,
  Info,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDealOptionsWithForms } from "@/app/actions/realtor/deal-option-actions";
import { getSchemaByFormType } from "@/app/actions/realtor/schema";
import {
  getSignatureSequence,
} from "@/app/actions/realtor/form-actions";
import { SignerAssignment } from "@/components/files/types/realtor";
import { updateSignatureCollections } from "@/app/actions/realtor/signatures-actions";
import { removeSignaturesAndEnableEditing } from "@/app/actions/realtor/form-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formTypeDisplay } from "../components/PreviewSection";

// Types

interface FormWithSignatures {
  id: string;
  form_name: string;
  form_type: string;
  hasSignatureFields: boolean;
  signatureFields: {
    unique_id: string;
    display_name: string;
    email?: string;
    actionAs?: "signer" | "delegator";
  }[];
  signatureSequence: SignerAssignment[][];
  signersByEmail: Record<string, SignerAssignment>;
  dealOptionId: string;
  dealOptionAddress: string;
  finalized_pdf?: string;
  expirationDays?: number;
}

interface DealOptionWithSignatureForms {
  id: string;
  address: string;
  forms: FormWithSignatures[];
  isExpanded: boolean;
}

interface DealSignaturePanelProps {
  dealId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DealSignaturePanel({
  dealId,
  isOpen,
  onClose,
}: DealSignaturePanelProps) {
  const [dealOptions, setDealOptions] = useState<DealOptionWithSignatureForms[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingBulkEmail, setIsSendingBulkEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [originalSignatureSequences, setOriginalSignatureSequences] = useState<Map<string, SignerAssignment[][]>>(new Map());
  const [revokingFormId, setRevokingFormId] = useState<string | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [formToRevoke, setFormToRevoke] = useState<FormWithSignatures | null>(null);
  const [expirationSettings, setExpirationSettings] = useState<Map<string, { days: number; custom: boolean }>>(new Map());
  
  // Helper to find selected form across all deal options
  const selectedForm = selectedFormId
    ? dealOptions
        .flatMap((dealOption) => dealOption.forms)
        .find((f) => f.id === selectedFormId)
    : null;

  // Load all forms with signature information when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFormsWithSignatures();
    }
  }, [dealId, isOpen]);

  const loadFormsWithSignatures = async () => {
    try {
      setIsLoading(true);

      // Get all deal options with their forms
      const dealOptionsData = await getDealOptionsWithForms(dealId);

      const organizedDealOptions: DealOptionWithSignatureForms[] = [];

      // Process each deal option's forms
      for (const dealOption of dealOptionsData) {
        const formsWithSignatures: FormWithSignatures[] = [];
        
        if (dealOption.forms && dealOption.forms.length > 0) {
          for (const form of dealOption.forms) {
            // Check if form has signature fields by examining the schema
            const signatureFields = [];

            if (form.custom_schema && Array.isArray(form.custom_schema)) {
              // For custom forms, check custom_schema
              for (const field of form.custom_schema) {
                if (field.display_attributes?.input_type === "signature") {
                  // Check if this signature field has a form response with an email
                  const signatureResponse =
                    form.form_response?.[field.unique_id];
                  if (
                    signatureResponse &&
                    typeof signatureResponse === "object" &&
                    "email" in signatureResponse &&
                    signatureResponse.email
                  ) {
                    signatureFields.push({
                      unique_id: field.unique_id,
                      display_name: field.display_attributes.display_name,
                      email: signatureResponse.email,
                      actionAs: signatureResponse.actionAs,
                    });
                  }
                }
              }
            } else if (form.form_type) {
              // For template forms, get schema using getSchemaByFormType
              try {
                const templateSchema = await getSchemaByFormType(
                  form.form_type
                );
                if (Array.isArray(templateSchema)) {
                  for (const field of templateSchema) {
                    if (field.display_attributes?.input_type === "signature") {
                      // Check if this signature field has a form response with an email
                      const signatureResponse =
                        form.form_response?.[field.unique_id];
                      if (
                        signatureResponse &&
                        typeof signatureResponse === "object" &&
                        "email" in signatureResponse &&
                        signatureResponse.email
                      ) {
                        signatureFields.push({
                          unique_id: field.unique_id,
                          display_name:
                            field.display_attributes.display_name ||
                            "Signature",
                          email: signatureResponse.email,
                          actionAs: signatureResponse.actionAs,
                        });
                      }
                    }
                  }
                }
              } catch (error) {
                console.error(
                  "Error loading schema for form type:",
                  form.form_type,
                  error
                );
              }
            }

            // Only include forms that have signature fields with emails filled in
            if (signatureFields.length > 0) {
              // Build signers by email for this form
              const signersByEmail: Record<string, SignerAssignment> = {};
              signatureFields.forEach((field) => {
                if (field.email) {
                  if (!signersByEmail[field.email]) {
                    signersByEmail[field.email] = {
                      email: field.email,
                      display_names: [field.display_name as string],
                      row_uuid: "",
                      actionAs: field.actionAs,
                    };
                  } else {
                    signersByEmail[field.email].display_names?.push(
                      field.display_name as string
                    );
                  }
                }
              });

              // Load existing signature sequence or initialize with empty step
              let signatureSequence: SignerAssignment[][] = [[]];
              try {
                const loadedSequence = await getSignatureSequence(form.id);
                if (loadedSequence && loadedSequence.length > 0) {
                  signatureSequence = loadedSequence;
                }
              } catch (error) {
              }

              // Store the original signature sequence from database
              setOriginalSignatureSequences(prev => {
                const newMap = new Map(prev);
                newMap.set(form.id, JSON.parse(JSON.stringify(signatureSequence))); // Deep copy
                return newMap;
              });

              formsWithSignatures.push({
                id: form.id,
                form_name: `${form.form_type || "Form"}`,
                form_type: form.form_type || "custom",
                hasSignatureFields: true,
                signatureFields: signatureFields as { unique_id: string; display_name: string; email?: string; actionAs?: "signer" | "delegator" }[],
                signatureSequence,
                signersByEmail,
                dealOptionId: dealOption.id,
                dealOptionAddress: dealOption.address,
                finalized_pdf: form.finalized_pdf,
              });
            }
          }
        }
        
        // Only add deal option if it has forms with signatures
        if (formsWithSignatures.length > 0) {
          organizedDealOptions.push({
            id: dealOption.id,
            address: dealOption.address,
            forms: formsWithSignatures,
            isExpanded: true, // Default to expanded
          });
        }
      }

      setDealOptions(organizedDealOptions);
    } catch (error) {
      console.error("Error loading forms with signatures:", error);
      toast.error("Failed to load signature information");
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


  const handleSetAllSignatureOrders = async () => {
    // Get all forms from all deal options
    const allForms = dealOptions.flatMap((dealOption) => dealOption.forms);
    const formsToSend = allForms.filter((form) => canSendFormSignature(form.id));
    if (formsToSend.length === 0) {
      setErrorMessage(
        "Please ensure all forms have at least one signer in their first step"
      );
      return;
    }

    // Clear any existing error message
    setErrorMessage(null);
    setIsSendingBulkEmail(true);
    try {
      // Prepare forms data for the consolidated API call
      const formsData = formsToSend.map(form => ({
        formId: form.id,
        formName: form.form_name,
        signatureSequence: form.signatureSequence
      }));

      
      // Make single API call that handles everything
      const result = await updateSignatureCollections(formsData, dealId);
      

      // Update original sequences state after successful save
      for (const form of formsToSend) {
        setOriginalSignatureSequences(prev => {
          const newMap = new Map(prev);
          newMap.set(form.id, JSON.parse(JSON.stringify(form.signatureSequence))); // Deep copy
          return newMap;
        });
      }

      if (result.affectedClients.length > 0) {
        toast.success(
          `Signature orders set and ${result.affectedClients.length} client${
            result.affectedClients.length !== 1 ? "s" : ""
          } notified for ${result.formCount} form${
            result.formCount !== 1 ? "s" : ""
          }`
        );
      } else {
        toast.success(
          `Signature orders saved for ${result.formCount} form${
            result.formCount !== 1 ? "s" : ""
          }`
        );
      }
      
      onClose();
    } catch (error) {
      console.error("Error in handleSetAllSignatureOrders:", error);

      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      console.error("Final error message:", errorMessage);

      // Set error message state instead of using toast
      setErrorMessage(`Sending signatures didn't work: ${errorMessage}`);
    } finally {
      setIsSendingBulkEmail(false);
    }
  };

  const getFormStatus = (form: FormWithSignatures) => {
    // Check if form is finalized (all signatures completed and PDF generated)
    if (form.finalized_pdf) {
      return { label: "Finalized", icon: CheckCircle2, color: "text-green-600" };
    }

    // Check if signatures have been sent (use original sequence from database, not current UI state)
    const originalSequence = originalSignatureSequences.get(form.id);
    if (originalSequence && originalSequence.length > 0) {
      const hasSigners = originalSequence.some(step => step.length > 0);
      if (hasSigners) {
        return { label: "Sent", icon: Mail, color: "text-blue-600" };
      }
    }

    // Form has signature fields but no sequence set up yet
    return { label: "Ready", icon: Clock, color: "text-gray-600" };
  };

  const handleRevokeSignatures = async (form: FormWithSignatures) => {
    setFormToRevoke(form);
    setShowRevokeDialog(true);
  };

  const confirmRevokeSignatures = async () => {
    if (!formToRevoke) return;

    setRevokingFormId(formToRevoke.id);
    setShowRevokeDialog(false);

    try {
      await removeSignaturesAndEnableEditing(formToRevoke.id);

      // Clear the signature sequence for this form
      setOriginalSignatureSequences(prev => {
        const newMap = new Map(prev);
        newMap.set(formToRevoke.id, [[]]);
        return newMap;
      });

      // Update the form's signature sequence in state
      setDealOptions(prevDealOptions =>
        prevDealOptions.map(dealOption => ({
          ...dealOption,
          forms: dealOption.forms.map(f =>
            f.id === formToRevoke.id
              ? { ...f, signatureSequence: [[]] }
              : f
          ),
        }))
      );

      toast.success(`Signatures revoked for ${formTypeDisplay(formToRevoke.form_name)}`);

      // Reload forms to get updated state
      await loadFormsWithSignatures();
    } catch (error) {
      console.error("Error revoking signatures:", error);
      toast.error("Failed to revoke signatures");
    } finally {
      setRevokingFormId(null);
      setFormToRevoke(null);
    }
  };

  // Signature sequence management functions
  const updateFormSignatureSequence = (
    formId: string,
    newSequence: SignerAssignment[][]
  ) => {
    setDealOptions((prevDealOptions) =>
      prevDealOptions.map((dealOption) => ({
        ...dealOption,
        forms: dealOption.forms.map((currentForm) =>
          currentForm.id === formId
            ? { ...currentForm, signatureSequence: newSequence }
            : currentForm
        ),
      }))
    );
  };

  const addSigningStepToForm = (formId: string) => {
    const form = dealOptions
      .flatMap((dealOption) => dealOption.forms)
      .find((f) => f.id === formId);
    if (!form) return;

    const newSequence = [...form.signatureSequence, []];
    updateFormSignatureSequence(formId, newSequence);
  };

  const addSignerToFormStep = (
    formId: string,
    stepIndex: number,
    email: string
  ) => {
    const form = dealOptions
      .flatMap((dealOption) => dealOption.forms)
      .find((f) => f.id === formId);
    if (!form || !form.signersByEmail[email]) return;

    const signer = form.signersByEmail[email];
    const newSequence = form.signatureSequence.map((signers, idx) =>
      idx === stepIndex ? [...signers, signer] : signers
    );
    updateFormSignatureSequence(formId, newSequence);
  };

  const removeSignerFromFormStep = (
    formId: string,
    stepIndex: number,
    email: string
  ) => {
    const form = dealOptions
      .flatMap((dealOption) => dealOption.forms)
      .find((f) => f.id === formId);
    if (!form) return;

    const newSequence = form.signatureSequence.map((signers, idx) =>
      idx === stepIndex ? signers.filter((s) => s.email !== email) : signers
    );
    updateFormSignatureSequence(formId, newSequence);
  };

  const removeSigningStepFromForm = (formId: string, stepIndex: number) => {
    const form = dealOptions
      .flatMap((dealOption) => dealOption.forms)
      .find((f) => f.id === formId);
    if (!form || form.signatureSequence.length === 1) return;

    const newSequence = form.signatureSequence.filter(
      (_, idx) => idx !== stepIndex
    );
    updateFormSignatureSequence(formId, newSequence);
  };


  const getUnassignedSigners = (form: FormWithSignatures) => {
    const assignedEmails = form.signatureSequence.flat().map((s) => s.email);
    return Object.values(form.signersByEmail).filter(
      (s) => s.email && !assignedEmails.includes(s.email)
    );
  };

  const canSendFormSignature = (formId: string) => {
    const form = dealOptions
      .flatMap((dealOption) => dealOption.forms)
      .find((f) => f.id === formId);
    return (
      form &&
      form.signatureSequence.length > 0 &&
      form.signatureSequence[0].length > 0
    );
  };

  const isWorkflowLocked = (form: FormWithSignatures) => {
    const status = getFormStatus(form);
    return status.label === "Sent" || status.label === "Finalized";
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[1500px] !w-[95vw] !h-[90vh] !max-h-[95vh] p-0 flex flex-col overflow-hidden">
        <div className="p-6 pb-0 flex-shrink-0">
          <DialogHeader className="pb-0">
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Send Signatures
            </DialogTitle>
            <DialogDescription>
              Configure signature workflow and send documents for signing. Links expire in 3 days.
            </DialogDescription>
          </DialogHeader>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 flex-1">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading signature workflows...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-hidden flex min-h-0">
              {/* Left Panel - Forms Sidebar */}
              <div className="w-[350px] flex-shrink-0 border-r flex flex-col min-h-0 bg-slate-50">
                <ScrollArea className="flex-1 px-6 py-4 min-h-0">
                  <div className="space-y-2">
                    {dealOptions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileSignature className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>
                          No forms with signature fields found in this deal.
                        </p>
                      </div>
                    ) : (
                      dealOptions.map((dealOption) => (
                        <div key={dealOption.id} className="border rounded-lg">
                          {/* Deal Option Header */}
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-t-lg border-b border-blue-100">
                            <button
                              onClick={() => handleToggleDealOption(dealOption.id)}
                              className="flex items-center gap-2 flex-1 text-left hover:bg-accent/50 rounded p-1 -m-1"
                            >
                              {dealOption.isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <FolderOpen className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-sm">
                                {dealOption.address}
                              </span>
                              <Badge className="text-xs bg-blue-100 text-blue-700">
                                {dealOption.forms.length} form{dealOption.forms.length !== 1 ? "s" : ""}
                              </Badge>
                            </button>
                          </div>

                          {/* Forms List */}
                          {dealOption.isExpanded && dealOption.forms.length > 0 && (
                            <div className="p-2 space-y-1">
                              {dealOption.forms.map((form) => {
                                const status = getFormStatus(form);
                                const StatusIcon = status.icon;
                                const isSelected = selectedFormId === form.id;

                                return (
                                  <div
                                    key={form.id}
                                    role="button"
                                    onClick={() => setSelectedFormId(form.id)}
                                    className={`group relative border rounded-lg p-3 cursor-pointer transition-all ${
                                      isSelected
                                        ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200 shadow-sm"
                                        : "bg-white hover:bg-blue-50/50 hover:border-blue-200"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-medium text-sm">
                                            {formTypeDisplay(form.form_name)}
                                          </h4>
                                          <div className={`flex items-center gap-1 ${status.color}`}>
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium">{status.label}</span>
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          {form.signatureFields.length} signature field
                                          {form.signatureFields.length !== 1 ? "s" : ""}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Right Panel - Workflow Configuration */}
              <div className="flex-1 flex flex-col min-h-0">
                {selectedForm ? (
                  <>
                    {/* Form Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-white border-b px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {formTypeDisplay(selectedForm.form_name)}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Configure signature workflow for this form
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Revoke Button */}
                      {(() => {
                        const formStatus = getFormStatus(selectedForm);
                        const canRevoke = formStatus.label === "Sent" && !selectedForm.finalized_pdf;
                        return canRevoke ? (
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => handleRevokeSignatures(selectedForm)}
                            disabled={revokingFormId === selectedForm.id}
                            className="flex items-center gap-2 px-4 py-2 border-red-500 text-red-600 hover:bg-red-50"
                          >
                            {revokingFormId === selectedForm.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                <span className="font-medium">Revoking...</span>
                              </>
                            ) : (
                              <>
                                <UserX className="h-4 w-4" />
                                <span className="font-medium">Revoke</span>
                              </>
                            )}
                          </Button>
                        ) : null;
                      })()}

                      {/* Expiration Settings */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Expires:</span>
                        <select
                          className="text-sm border rounded px-2 py-1"
                          value={expirationSettings.get(selectedForm.id)?.days || 3}
                          disabled={isWorkflowLocked(selectedForm)}
                          onChange={(e) => {
                            const days = parseInt(e.target.value);
                            setExpirationSettings(prev => {
                              const newMap = new Map(prev);
                              newMap.set(selectedForm.id, { days, custom: days !== 3 });
                              return newMap;
                            });
                          }}
                        >
                          <option value="1">1 day</option>
                          <option value="3">3 days (default)</option>
                          <option value="7">7 days</option>
                          <option value="14">14 days</option>
                          <option value="30">30 days</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Locked Workflow Warning */}
                {isWorkflowLocked(selectedForm) && (
                  <div className="bg-gradient-to-r from-amber-50 to-amber-50/50 border-b border-amber-200 px-6 py-3">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">
                        Workflow is locked
                      </span>
                      <span className="text-sm text-amber-700">
                        - Signatures have been sent. Revoke signatures to make changes.
                      </span>
                    </div>
                  </div>
                )}

                {/* Workflow Timeline */}
                <div className="flex-1 flex flex-col overflow-auto p-6">
                  {/* All steps in a grid with arrows */}
                  {selectedForm.signatureSequence.length > 0 && (
                    <div className="grid grid-cols-3 gap-x-4 gap-y-4">
                      {selectedForm.signatureSequence.map((step, stepIndex) => {
                        const isLastInRow = (stepIndex + 1) % 3 === 0;
                        const isLastStep = stepIndex === selectedForm.signatureSequence.length - 1;
                        return (
                          <div key={stepIndex} className="flex items-center">
                            <div className="w-[280px]">
                              <div className={`rounded-lg border-2 p-4 shadow-sm transition-all ${
                                isWorkflowLocked(selectedForm)
                                  ? "border-gray-300 bg-gray-50"
                                  : "bg-white border-blue-200 hover:border-blue-300 hover:shadow-md"
                              }`}>
                              {/* Step Header */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ${
                                    isWorkflowLocked(selectedForm) ? "bg-gray-400" : "bg-gradient-to-br from-blue-500 to-blue-600"
                                  }`}>
                                    {stepIndex + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm">Step {stepIndex + 1}</h4>
                                    <p className="text-xs text-gray-500">
                                      {step.length} signer{step.length !== 1 ? "s" : ""}
                                    </p>
                                  </div>
                                  {isWorkflowLocked(selectedForm) && (
                                    <Lock className="h-3 w-3 text-gray-400" />
                                  )}
                                </div>
                                {selectedForm.signatureSequence.length > 1 && !isWorkflowLocked(selectedForm) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSigningStepFromForm(selectedForm.id, stepIndex)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-destructive" />
                                  </Button>
                                )}
                              </div>

                              {/* Signers List */}
                              <div className="space-y-2 mb-3 max-h-[200px] overflow-y-auto">
                                {step.length === 0 ? (
                                  <div className="text-center py-6 text-gray-400">
                                    <Users className="h-6 w-6 mx-auto mb-2" />
                                    <p className="text-sm">No signers added</p>
                                    <p className="text-xs mt-1">Add signers below</p>
                                  </div>
                                ) : (
                                  step.map((signer) => (
                                    <div
                                      key={signer.email}
                                      className="group flex items-center gap-2 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                    >
                                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-semibold text-blue-600">
                                          {signer.email.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                          {signer.email}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {signer.actionAs === "signer" ? "✍️ Signs" : "📤 Delegates"}
                                        </div>
                                      </div>
                                      {!isWorkflowLocked(selectedForm) && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            removeSignerFromFormStep(
                                              selectedForm.id,
                                              stepIndex,
                                              signer.email
                                            )
                                          }
                                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Add Signer Dropdown */}
                              {getUnassignedSigners(selectedForm).length > 0 && !isWorkflowLocked(selectedForm) && (
                                <div className="border-t border-blue-100 pt-3">
                                  <select
                                    className="w-full text-sm border border-blue-200 rounded-md px-3 py-2 bg-blue-50/30 hover:bg-blue-50/50 focus:bg-white"
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        addSignerToFormStep(
                                          selectedForm.id,
                                          stepIndex,
                                          e.target.value
                                        );
                                        e.target.value = "";
                                      }
                                    }}
                                  >
                                    <option value="">+ Add signer...</option>
                                    {getUnassignedSigners(selectedForm).map((signer) => (
                                      <option key={signer.email} value={signer.email}>
                                        {signer.email}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              </div>
                            </div>

                            {/* Arrow after step (except last in row or last overall) */}
                            {!isLastInRow && !isLastStep && (
                              <div className="flex items-center px-2">
                                <ArrowRight className="h-5 w-5 text-blue-400" />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Step Button in grid */}
                      {!isWorkflowLocked(selectedForm) && (
                        <button
                          onClick={() => addSigningStepToForm(selectedForm.id)}
                          className="w-[280px] h-[260px] rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50/50 p-4 shadow-sm transition-all flex items-center justify-center cursor-pointer"
                        >
                          <div className="text-center">
                            <Plus className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                            <span className="text-sm font-medium text-blue-600">Add Step</span>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Unassigned Signers Pool - Outside scrollable area */}
                  {getUnassignedSigners(selectedForm).length > 0 && (
                    <div className="mt-6">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <h3 className="font-medium text-sm text-amber-900">
                            Unassigned Signers ({getUnassignedSigners(selectedForm).length})
                          </h3>
                        </div>
                        <p className="text-xs text-amber-700 mb-3">
                          These signers have signature fields but are not assigned to any step:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {getUnassignedSigners(selectedForm).map((signer) => (
                            <div
                              key={signer.email}
                              className="bg-white rounded-md px-3 py-1.5 border border-amber-200 text-sm"
                            >
                              <span className="font-medium">{signer.email}</span>
                              <span className="text-gray-500 ml-2 text-xs">
                                ({signer.display_names?.join(", ")})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Select a form to configure its signing steps.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Bar */}
            {dealOptions.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-white border-t border-blue-100 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {dealOptions.reduce((total, option) => total + option.forms.length, 0)} forms ready
                  </div>
                  <Button
                    onClick={handleSetAllSignatureOrders}
                    disabled={!dealOptions.some(option =>
                      option.forms.some(form => canSendFormSignature(form.id))
                    )}
                    size="lg"
                    className="min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSendingBulkEmail ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send All Signatures
                      </>
                    )}
                  </Button>
                </div>

                {/* Error message display */}
                {errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-700 flex-1">{errorMessage}</div>
                      <button
                        onClick={() => setErrorMessage(null)}
                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                        aria-label="Dismiss error"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Revoke Confirmation Dialog */}
    <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke Signatures</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke all signatures for{" "}
            <span className="font-semibold">
              {formToRevoke ? formTypeDisplay(formToRevoke.form_name) : "this form"}
            </span>
            ? This will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Remove all collected signatures</li>
              <li>Clear the signature collection history</li>
              <li>Re-enable form editing</li>
              <li>Require signatures to be recollected</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmRevokeSignatures}
            className="bg-red-600 text-white hover:bg-red-700 font-medium"
          >
            Revoke Signatures
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
