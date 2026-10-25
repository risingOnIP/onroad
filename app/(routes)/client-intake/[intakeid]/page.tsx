"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import {
  getClientIntakeByIdNoAuth,
  updateClientIntakeResponseNoAuth,
} from "@/app/actions/jwt/client-intake-otp-actions";

import OptimizedFormInput from "@/components/files/realtor/OptimizedFormInput";
import {
  SignatureInput,
  FormResponse,
  PartyIntake,
  PartyResponse,
} from "@/components/files/types/realtor";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ClientIntakeFormPage = () => {
  const { intakeid } = useParams();
  const [realtorIntakeSchema, setRealtorIntakeSchema] = useState<PartyIntake>(
    {} as PartyIntake
  );
  const [partyResponses, setPartyResponses] = useState<PartyResponse>(
    {} as PartyResponse
  );
  const [fileUploadResponse, setFileUploadResponse] = useState<
    Record<string, File[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  // Removed OTP state - direct access to form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  // Load client intake data directly without OTP
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const fetchedSchema = (await getClientIntakeByIdNoAuth(
          intakeid as string
        )) as PartyIntake;
        setRealtorIntakeSchema(fetchedSchema);
        setPartyResponses(fetchedSchema.party_response || {});
        // Check if form has been submitted based on whether party_response has meaningful values
        const hasResponse =
          fetchedSchema.party_response &&
          typeof fetchedSchema.party_response === "object";
        const hasValues =
          hasResponse &&
          Object.values(fetchedSchema.party_response).some(
            (value) =>
              value !== null &&
              value !== undefined &&
              value !== "" &&
              value !== "{}"
          );
        setIsSubmitted(hasValues);
      } catch (error) {
        console.error("Error fetching client intake:", error);
        toast.error("Failed to load form");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchema();
  }, [intakeid]);


  const handlePartyResponseUpdateByField = async (
    itemKey: string,
    newValue: string | string[] | SignatureInput | File[]
  ) => {
    
    // Check if it's a file upload (File array)
    if (Array.isArray(newValue) && newValue.length > 0 && newValue[0] instanceof File) {
      // Handle File array - store in fileUploadResponse for submission
      
      setFileUploadResponse((prev) => {
        const updated = {
          ...prev,
          [itemKey]: newValue as File[],
        };
        return updated;
      });
      
      // Also update partyResponses to track that files were uploaded (store file names)
      const fileNames = (newValue as File[]).map(f => f.name).join(', ');
      setPartyResponses((prev) => ({
        ...prev,
        [itemKey]: fileNames, // Store file names as a string for display
      }));
    } else {
      // Handle regular field
      const stringValue = newValue as string;
      setPartyResponses((prev) => ({
        ...prev,
        [itemKey]: stringValue,
      }));
    }

    // Don't save to backend until form is submitted
  };

  // Check if all required fields are filled
  const isFormComplete = () => {
    if (!realtorIntakeSchema.party_intake_form_schema) return false;

    const requiredFields = realtorIntakeSchema.party_intake_form_schema.filter(
      (field) => field.display_attributes.isRequired
    );

    return requiredFields.every((field) => {
      // Check if this is a file upload field
      if (field.display_attributes.input_type === "fileUpload") {
        // Check if files have been uploaded for this field
        const uploadedFiles = fileUploadResponse[field.unique_id];
        return uploadedFiles && uploadedFiles.length > 0;
      } else {
        // For non-file fields, check partyResponses
        const value = partyResponses[field.unique_id];
        return value !== null && value !== undefined && value !== "";
      }
    });
  };

  // Submit the form with validation
  const handleSubmit = async () => {
    if (!isFormComplete()) {
      setShowValidationError(true);
      return;
    }

    setShowValidationError(false);
    setIsSubmitting(true);


    try {
      const response = await updateClientIntakeResponseNoAuth(
        intakeid as string,
        partyResponses,
        fileUploadResponse
      );
      
      
      // Update party responses with the file paths returned from backend
      if (response && response.party_response) {
        setPartyResponses(response.party_response);
      }
      
      setIsSubmitted(true);
      toast.success("Form submitted successfully!");
    } catch (error) {
      console.error("[CLIENT INTAKE PAGE] Error submitting form:", error);
      toast.error("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Client Intake Form
            </h2>
          {showValidationError && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please complete all required fields before submitting the form.
              </AlertDescription>
            </Alert>
          )}

          {isSubmitted && (
            <Alert className="mb-4">
              <AlertDescription className="text-green-600">
                ✓ Form has been successfully submitted. Thank you!
              </AlertDescription>
            </Alert>
          )}

          <OptimizedFormInput
            schema={realtorIntakeSchema.party_intake_form_schema || []}
            formResponseUpdateByField={handlePartyResponseUpdateByField}
            initialFormResponses={partyResponses as FormResponse}
            can_edit={!isSubmitted}
            loading={isLoading}
          />

          {!isSubmitted && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "Submitting..." : "Submit Form"}
              </Button>
            </div>
          )}

          {isSubmitted && (
            <div className="mt-6 flex justify-center">
              <p className="text-green-600 font-medium">
                Form submitted successfully! You can now close this page.
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientIntakeFormPage;
