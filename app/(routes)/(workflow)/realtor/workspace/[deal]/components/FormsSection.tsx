"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

import {
  getDealOption,
  loadPdfFieldMetadata,
} from "@/app/actions/realtor/deal-option-actions";
import {
  getForm,
  updateFormResponse,
  updateFormWithCustomPdf,
  removeSignaturesAndEnableEditing,
} from "@/app/actions/realtor/form-actions";
import OptimizedFormInput from "@/components/files/realtor/OptimizedFormInput";
import { getSchemaByFormType } from "@/app/actions/realtor/schema";
import {
  AutoFilledTypes,
  FILE_NAMES,
  Form,
  FormResponse,
  PartyIntakeSchemaItem,
  SchemaItem,
} from "@/components/files/types/realtor";
import {
  downloadFunction,
  modifyPDF,
} from "@/components/files/realtor/pdf-utils/downloadFunction";
import { getDownloadUrl } from "@/app/actions/realtor/fileupload-actions";
import { PDFFormField } from "@/components/files/types/realtor";
import { PDFDocument } from "pdf-lib";
import {
  getSignatureCollection,
  renewSignatureCollection,
} from "@/app/actions/realtor/signatures-actions";

// Import the existing forms page content for forms listing
import FormsListView from "./FormsListView";
import PropertyInformationComponent from "./PropertyInformationComponent";
import PreviewSection, { formTypeDisplay } from "./PreviewSection";
import FinalizedSection from "./FinalizedSection";
import { getClientIntakesByDealId } from "@/app/actions/realtor/client-intake-actions";
import HybridPDFFormEditor from "@/components/files/realtor/HybridPDFFormEditor";
import DealSignaturePanel from "../components_layout/DealSignaturePanel";
import DealReviewPanel from "../components_layout/DealReviewPanel";
import FormProgress from "./FormProgress";
import { calculateFormProgress } from "@/components/files/utils/formProgress";
import { getBlankFile } from "@/app/actions/realtor/blank-file-actions";
import { sendFormForReview } from "@/app/actions/realtor/form-review-actions";
import SendActionsDropdown from "./SendActionsDropdown";

// Helper function to convert SchemaItems to PDFFormFields
function convertSchemaToPDFFields(
  schemaItems: any[],
  existingFields: PDFFormField[] = []
): PDFFormField[] {
  const convertedFields: PDFFormField[] = [];

  schemaItems.forEach((item) => {
    // Check if field already exists
    const existingField = existingFields.find((f) => f.id === item.unique_id);

    if (existingField) {
      convertedFields.push(existingField);
      return;
    }

    // Convert input type to PDF field type
    let fieldType: PDFFormField["type"] = "text";
    switch (item.display_attributes.input_type) {
      case "text":
        fieldType = "text";
        break;
      case "signature":
        fieldType = "signature";
        break;
      case "checkbox":
        fieldType = "checkmark";
        break;
      default:
        fieldType = "text";
    }

    // Create new PDF field with default positioning
    const newField: PDFFormField = {
      id: item.unique_id,
      type: fieldType,
      x: 50,
      y: 100,
      width:
        fieldType === "signature" ? 250 : fieldType === "checkmark" ? 20 : 200,
      height:
        fieldType === "signature" ? 60 : fieldType === "checkmark" ? 20 : 32,
      page: 1,
      label: item.display_attributes.display_name,
      placeholder: item.display_attributes.placeholder,
      required: false,
    };

    convertedFields.push(newField);
  });

  return convertedFields;
}

interface FormsSectionProps {
  dealId: string;
  selectedFormId?: string;
  selectedPropertyId?: string;
  viewMode?: string;
  dealSide?: string;
  onEditForm: (formId: string) => void;
  onBack?: () => void;
  onPreview?: (formId: string) => void;
}

const FormsSection: React.FC<FormsSectionProps> = ({
  dealId,
  selectedFormId,
  selectedPropertyId,
  viewMode,
  dealSide,
  onEditForm,
  onBack,
  onPreview,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Form editor specific state
  const [schemaItems, setSchemaItems] = useState<SchemaItem[]>([]);
  const [formType, setFormType] = useState<FILE_NAMES | null>(null);
  const [dealOption, setDealOption] = useState<string>("");
  const [creationDate, setCreationDate] = useState<string>("");
  const [can_edit, setCanEdit] = useState<boolean>(false);
  const [pdfFinalized, setPdfFinalized] = useState<boolean>(false);
  const [formResponses, setFormResponses] = useState<FormResponse>({});
  const [customForm, setCustomForm] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [pdfFields, setPdfFields] = useState<PDFFormField[]>([]);
  const [dealOptionId, setDealOptionId] = useState<string>("");
  const [hasCustomSchema, setHasCustomSchema] = useState<boolean>(false);
  const [reviewStage, setReviewStage] = useState<'not_sent' | 'reviewing' | 'approved' | undefined>();

  const [isRevokingSignatures, setIsRevokingSignatures] = useState(false);
  const [isSendingForReview, setIsSendingForReview] = useState(false);
  const [clientIntakeSetting, setClientIntakeSetting] = useState<string[]>([]); //unique ids of fields that will be sent from client intakes
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Record<string, AutoFilledTypes>>({});


  useEffect(() => {
      
    const fetchAutoFilledFields = async () => {
      const autoFields: Record<string, AutoFilledTypes> = {};
      const clientIntakes = await getClientIntakesByDealId(dealId);
      clientIntakes.forEach((clientIntake) => {
        clientIntake.party_intake_form_schema.forEach((item: PartyIntakeSchemaItem) => {
          // Check if this intake item has mappings to form fields
          if (item.mapping && item.mapping.length > 0) {
            item.mapping.forEach((mapping) => {
              // Mark the form field (mapping.uniqueId) as filled from intake
              autoFields[mapping.uniqueId] = "intake";
            });
          }
        });
      });
      schemaItems.forEach((item: SchemaItem) => {
        if (item.display_attributes.isCached) {
          autoFields[item.unique_id] = "cached";
        }
        else if (item.display_attributes.value.type === "resolved") {
          autoFields[item.unique_id] = "resolved";
        }
        else if (item.display_attributes.value.type === "reserved") {
          autoFields[item.unique_id] = "resolved"; // Map "reserved" to "resolved" for autofill badge display
        }
      });
      setAutoFilledFields(autoFields);
  }
  fetchAutoFilledFields();
  }, [dealId, formType]);

  // Confirmation modal state
  const [showConversionModal, setShowConversionModal] =
    useState<boolean>(false);
  const [acceptConversion, setAcceptConversion] = useState<boolean>(false);

  // Load form data when selectedFormId changes
  useEffect(() => {
    if (viewMode === "preview") {
      return;
    }
    if (selectedFormId) {
      fetchFormData(selectedFormId);
    }
  }, [selectedFormId, viewMode]);

  const fetchFormData = async (formId: string) => {
    try {
      setIsLoading(true);

      // 1. Fetch the form itself
      const form: Form = await getForm(formId);

      // 1a. Populate existing responses
      setFormResponses(form.form_response ?? {});
      
      // 1b. Set review stage
      setReviewStage(form.review_stage);

      // 1b. Handle custom form PDF
      if (form.file_upload_pdf) {
        setCustomForm(true);
        try {
          const downloadUrl = await getDownloadUrl(form.file_upload_pdf);
          setPdfUrl(downloadUrl);
        } catch (error) {
          console.error("Error fetching PDF URL:", error);
          toast.error("Failed to load custom PDF form");
        }
      } else {
        setCustomForm(false);
      }

      // 1c. Determine if the PDF is finalized
      setPdfFinalized(!!form.finalized_pdf);

      // 2. Load the schema for this formType
      const schemaItemsFromAPI: SchemaItem[] =
        form.custom_schema || (await getSchemaByFormType(form.form_type));
      setSchemaItems(schemaItemsFromAPI);

      // Check if form has custom schema (PDF already includes signature fields)
      // Empty array should be considered as no custom schema
      const hasCustomSchemaItems =
        form.custom_schema && form.custom_schema.length > 0;
      setHasCustomSchema(hasCustomSchemaItems);

      // 2b. Convert schema to PDF fields if it's a custom form
      if (form.file_upload_pdf && schemaItemsFromAPI.length > 0) {
        // Load existing PDF field metadata first
        const existingPdfFields =
          ((await loadPdfFieldMetadata(formId)) as PDFFormField[]) || [];

        // Convert schema to PDF fields, passing existing fields for position preservation
        const convertedFields = convertSchemaToPDFFields(
          schemaItemsFromAPI,
          existingPdfFields
        );
        // Sync existing form response values with PDF fields
        const fieldsWithValues = convertedFields.map((field) => {
          const existingValue = form.form_response?.[field.id];
          let fieldValue: string | undefined = field.value;

          if (existingValue) {
            if (typeof existingValue === "string") {
              fieldValue = existingValue;
            } else if (
              typeof existingValue === "object" &&
              "email" in existingValue &&
              existingValue.email
            ) {
              // Handle SignatureInput type - use email for signature fields
              fieldValue = existingValue.email;
            }
          }

          return {
            ...field,
            value: fieldValue,
          };
        });
        setPdfFields(fieldsWithValues);
      }

      // 2a. Store formType for header
      setFormType(form.form_type as FILE_NAMES);

      // 3. If there's a deal_option_id, fetch that too
      if (form.deal_option_id) {
        const dealOpt = await getDealOption(form.deal_option_id);
        setDealOption(dealOpt.address || "");
        setDealOptionId(form.deal_option_id);
      }

      // 4. Handle signature sequence and review stage → can_edit
      if (form.signature_sequence && form.signature_sequence.length > 0) {
        setCanEdit(false);
      } else if (form.review_stage === 'reviewing') {
        setCanEdit(false); // Lock editing when under review
      } else {
        setCanEdit(true);
      }

      // 5. Format creation date if present
      if (form.created_at) {
        try {
          const date = new Date(form.created_at);
          setCreationDate(date.toLocaleDateString());
        } catch {
          // If it's not a valid date string, just show raw
          setCreationDate(form.created_at);
        }
      }
    } catch (error) {
      console.error("Error fetching form data or schema:", error);
      toast.error("Failed to load form. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle preview
  const handlePreview = () => {
    if (selectedFormId && onPreview) {
      onPreview(selectedFormId);
    }
  };

  // Handle export
  const handleDownload = () => {
    if (selectedFormId) {
      downloadFunction(dealId, selectedFormId);
    }
  };

  // Enhanced form response update handler that also updates progress
  const handleFormResponseUpdate = async (itemKey: string, newValue: any) => {
    if (!selectedFormId) return;
    try {
      await updateFormResponse(selectedFormId, itemKey, newValue);
      // Update local state to trigger progress recalculation
      setFormResponses(prev => ({
        ...prev,
        [itemKey]: newValue
      }));
    } catch (error) {
      console.error("Error updating form response:", error);
      toast.error("Failed to save form response");
      // Re-throw the error so the form component can handle it properly
      throw error;
    }
  };

  // Handle PDF field changes
  const handlePDFFieldsChange = (newFields: PDFFormField[]) => {
    setPdfFields(newFields);
  };

  // Handle PDF form save
  const handlePDFFormSave = async (fields: PDFFormField[]) => {
    if (!selectedFormId) return;
    try {
      // Convert PDF fields back to form responses
      const updatedResponses: FormResponse = { ...formResponses };
      fields.forEach((field) => {
        if (field.value !== undefined) {
          // Handle signature fields - convert back to SignatureInput format
          if (field.type === "signature" && field.value) {
            const existingSignature = formResponses[field.id];
            if (
              typeof existingSignature === "object" &&
              "actionAs" in existingSignature &&
              typeof existingSignature.actionAs === "string"
            ) {
              // Preserve existing actionAs, update email
              updatedResponses[field.id] = {
                actionAs: existingSignature.actionAs,
                email: field.value,
              };
            } else {
              // Create new SignatureInput
              updatedResponses[field.id] = {
                actionAs: "signer",
                email: field.value,
              };
            }
          } else {
            // Regular field value
            updatedResponses[field.id] = field.value;
          }
        }
      });

      // Save each field response
      for (const [fieldId, value] of Object.entries(updatedResponses)) {
        const currentValue = formResponses[fieldId];
        const hasChanged =
          typeof currentValue === "object" && typeof value === "object"
            ? JSON.stringify(currentValue) !== JSON.stringify(value)
            : currentValue !== value;

        if (hasChanged) {
          await updateFormResponse(selectedFormId, fieldId, value);
        }
      }

      setFormResponses(updatedResponses);
      toast.success("PDF form saved successfully");
    } catch (error) {
      console.error("Error saving PDF form:", error);
      toast.error("Failed to save PDF form");
      throw error;
    }
  };

  // Handle conversion from normal form to custom form
  const handleConvertToCustomForm = async () => {
    setShowConversionModal(true);
  };

  // Handle confirmed conversion to custom form
  const handleConfirmedConvertToCustomForm = async () => {
    if (!selectedFormId || schemaItems.length === 0) {
      toast.error("Cannot convert form - no schema items found");
      return;
    }

    try {
      // Close modal and reset state
      setShowConversionModal(false);
      setAcceptConversion(false);

      toast.info("Converting form to custom PDF form...");

      // 1. Fetch the original PDF template from public directory
      const blankFileResult = await getBlankFile(formType as FILE_NAMES);
      if (blankFileResult.error?.type === 'TAR_FORM_NOT_UPLOADED') {
        // Show modal for TAR form not uploaded
        toast.error(blankFileResult.error.message);
        return;
      }
      if (!blankFileResult.data) {
        throw new Error(blankFileResult.error?.message || `PDF template not found for form type: ${formType}`);
      }
      const pdfArrayBuffer = blankFileResult.data;

      // 2. Load PDF and fill it with existing form data using modifyPDF
      const pdfDoc = await PDFDocument.load(pdfArrayBuffer);

      // Get signature data if any exists in nested structure
      const signature_data: Record<string, Record<string, string>> = {};
      const form = await getForm(selectedFormId);
      if (form.signature_sequence) {
        for (const step of form.signature_sequence) {
          for (const signer of step) {
            if (signer.row_uuid) {
              const signatureCollection = await getSignatureCollection(
                signer.row_uuid
              );

              // Merge nested signature data structure
              if (signatureCollection.signature_data) {
                Object.assign(
                  signature_data,
                  signatureCollection.signature_data
                );
              }
            }
          }
        }
      }

      // Fill the PDF with existing form responses
      const filledPdfDoc = await modifyPDF(
        pdfDoc,
        schemaItems,
        formResponses,
        signature_data
      );

      // 4. Create a blob URL for the flattened PDF
      const pdfBytes = await filledPdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfBlobUrl = URL.createObjectURL(pdfBlob);

      // 5. Update form to mark it as custom (with empty schema for fresh start)
      // Pass the filled PDF blob so it gets saved instead of the blank template
      toast.info("Converting to custom form...");
      await updateFormWithCustomPdf(
        selectedFormId,
        formType as FILE_NAMES,
        [],
        pdfBlob
      ); // Pass the filled PDF blob

      // 6. Update local state
      setCustomForm(true);
      setPdfUrl(pdfBlobUrl);

      // Start with empty fields - users can add new custom fields on top of flattened content
      setPdfFields([]);

      toast.success("Form successfully converted to custom PDF form!");
    } catch (error) {
      console.error("Error converting form to custom:", error);
      toast.error(
        `Failed to convert form: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Handle removing all signatures and re-enabling form editing
  const handleRemoveSignatures = async () => {
    if (!selectedFormId) {
      toast.error("No form selected");
      return;
    }
    setIsRevokingSignatures(true);
    try {
      await removeSignaturesAndEnableEditing(selectedFormId);
      toast.success("Signatures removed and form editing re-enabled!");

      // Reload the form to update the state
      const formData = await getForm(selectedFormId);

      // Update state to reflect changes
      setCanEdit(true);
      setPdfFinalized(false);

      // Reset signature-related state
      if (
        !formData.signature_sequence ||
        formData.signature_sequence.length === 0
      ) {
        setCanEdit(true);
      }
    } catch (error) {
      console.error("Error removing signatures:", error);
      toast.error(
        `Failed to remove signatures: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsRevokingSignatures(false);
    }
  };

  const [isRenewingSignatures, setIsRenewingSignatures] = useState(false);
  const [renewed, setRenewed] = useState(false);

  // Get all linked field IDs to hide them from progress calculation
  const linkedFieldIds = React.useMemo(() => {
    const linkedIds = new Set<string>();
    schemaItems.forEach((item) => {
      if (item.display_attributes.checkbox_options?.options) {
        item.display_attributes.checkbox_options.options.forEach((option) => {
          if (option.linkedFields) {
            option.linkedFields.forEach((linkedId) => linkedIds.add(linkedId));
          }
        });
      }
    });
    return linkedIds;
  }, [schemaItems]);

  // Calculate form progress
  const formProgress = React.useMemo(() => {
    if (!schemaItems.length || customForm) return null;
    
    // Check field visibility function using the same logic as OptimizedFormInput
    const isFieldVisible = (item: SchemaItem): boolean => {
      if (item.display_attributes.isHidden) return false;

      // Hide items that are linked checkbox fields (they appear inside their parent)
      if (linkedFieldIds.has(item.unique_id)) return false;

      if (
        !item.display_attributes.visibleIf ||
        item.display_attributes.visibleIf.length === 0
      )
        return true;

      // All conditions must be true
      return item.display_attributes.visibleIf.every((condition) => {
        const fieldValue = formResponses[condition.unique_id];
        const checkValue = condition.valueChecked;

        switch (condition.operation) {
          case "==":
            return String(fieldValue) === String(checkValue);
          case "!==":
            return String(fieldValue) !== String(checkValue);
          case ">":
            return Number(fieldValue) > Number(checkValue);
          case ">=":
            return Number(fieldValue) >= Number(checkValue);
          case "<":
            return Number(fieldValue) < Number(checkValue);
          case "<=":
            return Number(fieldValue) <= Number(checkValue);
          case "contains":
            // For checkbox arrays, check if the array contains the value
            if (Array.isArray(fieldValue)) {
              return fieldValue.includes(checkValue);
            } else {
              return String(fieldValue).includes(String(checkValue));
            }
          case "doesNotContain":
            // For checkbox arrays, check if the array does NOT contain the value
            if (Array.isArray(fieldValue)) {
              return !fieldValue.includes(checkValue);
            } else {
              return !String(fieldValue).includes(String(checkValue));
            }
          default:
            return true;
        }
      });
    };
    
    return calculateFormProgress(schemaItems, formResponses, isFieldVisible);
  }, [schemaItems, formResponses, customForm, linkedFieldIds]);

  const handleSendForReview = async () => {
    if (!selectedFormId) {
      toast.error("No form selected");
      return;
    }
    
    setIsSendingForReview(true);
    
    try {
      await sendFormForReview(selectedFormId);
      toast.success("Form sent for broker review!");
      
      // Update local state
      setReviewStage('reviewing');
      setCanEdit(false);
      
      // Refresh form data
      await fetchFormData(selectedFormId);
    } catch (error) {
      console.error("Error sending form for review:", error);
      toast.error(
        `Failed to send form for review: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSendingForReview(false);
    }
  };

  const handleRenewSignatures = async () => {
    if (!selectedFormId) {
      toast.error("No form selected");
      return;
    }
    setIsRenewingSignatures(true);
    setRenewed(false);
    try {
      // Fetch the form to get the signature_sequence
      const form = await getForm(selectedFormId);
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

  // Handle PDF overlay save
  const handlePDFOverlaySave = async (pdfId: string, newFormId?: string) => {
    try {
      toast.success(
        `PDF saved with overlays! PDF ID: ${pdfId}${
          newFormId ? `, Form ID: ${newFormId}` : ""
        }`
      );

      // Optionally redirect to a new page or refresh data
      if (newFormId) {
      }

      // Refresh the current form data to reflect any changes
      if (selectedFormId) {
        fetchFormData(selectedFormId);
      }
    } catch (error) {
      console.error("Error handling PDF overlay save result:", error);
      toast.error("PDF saved but failed to update interface");
    }
  };

  // Memoized callback for form changes to avoid re-renders
  const handleFormChange = useCallback((newResponses: FormResponse) => {
    setFormResponses(newResponses);
  }, []);

  // If property is selected, show property information
  if (selectedPropertyId) {
    return (
      <PropertyInformationComponent
        dealId={dealId}
        dealOptionId={selectedPropertyId}
        dealSide={dealSide}
        onBack={onBack}
        showBackButton={true}
      />
    );
  }

  // If preview mode is selected, show preview section
  if (viewMode === "preview" && selectedFormId) {
    return (
      <PreviewSection
        dealId={dealId}
        formId={selectedFormId}
        onBack={onBack}
        showBackButton={true}
      />
    );
  }

  // If finalized mode is selected, show finalized section
  if (viewMode === "finalized" && selectedFormId) {
    return (
      <FinalizedSection
        formId={selectedFormId}
        onBack={onBack}
        showBackButton={true}
      />
    );
  }

  // If no form is selected, show the forms list
  if (!selectedFormId) {
    return (
      <FormsListView
        dealId={dealId}
        onEditForm={onEditForm}
        onPreview={onPreview}
        onFinalized={(formId) => onPreview && onPreview(formId)}
      />
    );
  }

  // If form has finalized PDF (all signatures completed), automatically show finalized view
  if (pdfFinalized && !isLoading && viewMode !== "finalized") {
    return (
      <FinalizedSection
        formId={selectedFormId}
        onBack={onBack}
        showBackButton={true}
      />
    );
  }

  // If normal form (not custom) and can_edit is false, show preview instead
  if (!customForm && !can_edit && !isLoading && viewMode !== "preview") {
    return (
      <PreviewSection
        dealId={dealId}
        formId={selectedFormId}
        onBack={onBack}
        showBackButton={true}
        onSignaturesRevoked={() => fetchFormData(selectedFormId)}
      />
    );
  }

  // Show individual form editor
  return (
    <div className="w-full h-full px-6 my-5">
      <Card className="border rounded-lg shadow-sm overflow-hidden h-full">
        <CardHeader className="bg-white p-3 border-b">
          <div className="flex flex-row justify-between items-start">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="outline" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">
                    {formTypeDisplay(formType as FILE_NAMES)}
                  </h1>
                  {reviewStage && reviewStage !== 'not_sent' && (
                    <Badge 
                      variant={reviewStage === 'approved' ? 'default' : 'secondary'}
                      className={`flex items-center gap-1 ${
                        reviewStage === 'reviewing' 
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-300' 
                          : reviewStage === 'approved'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : ''
                      }`}
                    >
                      {reviewStage === 'reviewing' ? (
                        <>
                          <Clock className="h-3 w-3" />
                          Under Broker Review
                        </>
                      ) : reviewStage === 'approved' ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Broker Approved
                        </>
                      ) : null}
                    </Badge>
                  )}
                </div>
                {(dealOption || creationDate) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dealOption && `${dealOption}`}
                    {dealOption && creationDate && " • "}
                    {creationDate && `Created on ${creationDate}`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
            {!isLoading && (
              <>
                {/* Combined Send button with dropdown */}
                <SendActionsDropdown
                  onSendSignatures={() => setShowSignaturePanel(true)}
                  onSendForReview={() => setShowReviewPanel(true)}
                  showReviewOption={true}
                  isReviewDisabled={isSendingForReview}
                />

                {/* Divider */}
                <div className="h-6 w-px bg-gray-200" />

                {/* Secondary actions */}
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 px-3 h-8 text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={handlePreview}
                  >
                    <FileText className="h-3.5 w-3.5 text-gray-500" />
                    <span>Preview</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 px-3 h-8 text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={handleDownload}
                  >
                    <Download className="h-3.5 w-3.5 text-gray-500" />
                    <span>Download</span>
                  </Button>

                  {!customForm && can_edit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 px-3 h-8 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={handleConvertToCustomForm}
                    >
                      <FileText className="h-3.5 w-3.5 text-gray-500" />
                      <span className="hidden lg:inline">
                        Convert to Custom
                      </span>
                      <span className="lg:hidden">Custom</span>
                    </Button>
                  )}
                </div>

                {!can_edit && !pdfFinalized && (
                  <>
                    {/* Another divider */}
                    <div className="h-6 w-px bg-gray-200" />

                    {/* Signature management actions */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveSignatures}
                        disabled={isRevokingSignatures}
                        className="flex items-center gap-1.5 px-3 h-8 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">
                          {isRevokingSignatures ? "Revoking..." : "Revoke"}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRenewSignatures}
                        disabled={isRenewingSignatures}
                        className="flex items-center gap-1.5 px-3 h-8 text-teal-600 hover:bg-teal-50 hover:border-teal-300 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>
                          {isRenewingSignatures
                            ? "Renewing..."
                            : renewed
                            ? "Renewed"
                            : "Renew"}
                        </span>
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
            </div>
          </div>
          
          {/* Form Progress Bar - underneath buttons */}
          {formProgress && !customForm && can_edit && (
            <div className="mt-3">
              <FormProgress
                completed={formProgress.completed}
                total={formProgress.total}
                percentage={formProgress.percentage}
                isComplete={formProgress.isComplete}
                missingFields={formProgress.missingFields}
              />
            </div>
          )}
        </CardHeader>

        {/* Review Notice */}
        {reviewStage === 'reviewing' && !can_edit && (
          <div className="mx-6 mt-4 mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900">Form is currently under broker review</p>
              <p className="text-yellow-800 mt-1">
                This form has been locked for editing while your broker reviews it. 
                You will be able to edit again once the review is complete.
              </p>
            </div>
          </div>
        )}

        <CardContent
          className={
            customForm && pdfUrl
              ? "p-0 h-[calc(100vh-160px)] overflow-y-auto"
              : "p-0 flex-1 min-h-0 overflow-hidden"
          }
        >
          <div className="px-6 pb-2 h-full max-h-full overflow-y-auto">
          {customForm && pdfUrl ? (
            <HybridPDFFormEditor
              pdfUrl={pdfUrl}
              dealId={dealId}
              formId={selectedFormId}
              formType={formType as FILE_NAMES}
              initialFields={pdfFields}
              onFieldsChange={handlePDFFieldsChange}
              onSave={handlePDFFormSave}
              onSaveWithOverlays={handlePDFOverlaySave}
              canEdit={can_edit}
              isLoading={isLoading}
              hasCustomSchema={hasCustomSchema}
              dealSide={dealSide}
              dealOptionName={dealOption}
              dealOptionId={dealOptionId}
            />
          ) : (

            

            <OptimizedFormInput
              key={selectedFormId}
              schema={schemaItems}
              can_edit={can_edit}
              initialFormResponses={formResponses}
              formResponseUpdateByField={handleFormResponseUpdate}
              onFormChange={handleFormChange}
              dealId={dealId}
              dealOptionId={dealOptionId}
              dealSide={dealSide}
              dealOptionName={dealOption}
              loading={isLoading}
              autoFilledFields={autoFilledFields}
            />

            
          )}
          </div>
        </CardContent>
      </Card>

      {/* Deal Signature Panel */}
      {showSignaturePanel && selectedFormId && (
        <DealSignaturePanel
          dealId={dealId}
          isOpen={showSignaturePanel}
          onClose={() => setShowSignaturePanel(false)}
        />
      )}

      {/* Deal Review Panel */}
      {showReviewPanel && (
        <DealReviewPanel
          dealId={dealId}
          isOpen={showReviewPanel}
          onClose={() => setShowReviewPanel(false)}
        />
      )}

      {/* Conversion Confirmation Modal */}
      <Dialog open={showConversionModal} onOpenChange={setShowConversionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to Custom Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to convert this form to a custom PDF form?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 font-medium">
                ⚠️ Important Warning
              </p>
              <p className="text-sm text-amber-700 mt-2">
                Once you convert this form to a custom PDF form, you{" "}
                <strong>cannot go back</strong> to the regular form format. This
                action is permanent and irreversible.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="accept-conversion"
                checked={acceptConversion}
                onCheckedChange={(checked) => setAcceptConversion(!!checked)}
              />
              <label
                htmlFor="accept-conversion"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I accept and understand this conversion is permanent
              </label>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConversionModal(false);
                setAcceptConversion(false);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmedConvertToCustomForm}
              disabled={!acceptConversion}
              className="w-full sm:w-auto"
            >
              Convert to Custom Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default FormsSection;
