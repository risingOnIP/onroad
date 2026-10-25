import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HomeIcon } from "lucide-react";
import { CellOption } from "./GamifiedTemplateBirth";
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/solid";
import { getAllTemplates } from "@/app/actions/realtor/template-actions";
import { getAllPartyIntakeTemplates } from "@/app/actions/realtor/client-intake-template-actions";

interface TemplateNamingPageProps {
  onContinue: (
    selectedTemplateType: string,
    templateName: string,
    description: string,
    supabaseTable: "client_intake" | "transaction_forms"
  ) => Promise<void>;
  onBack: () => void;
  selectedTemplateType: string;
  cellOptions: CellOption[];
  templateName: string;
  description: string;
  setTemplateName: (name: string) => void;
  setDescription: (description: string) => void;
  setSupabaseTable: (
    table: "client_intake" | "transaction_forms" | null
  ) => void;
  supabaseTable: "client_intake" | "transaction_forms" | null;
  nameChangeDisabled: boolean;
}

const TemplateNamingPage = ({
  onContinue,
  onBack,
  selectedTemplateType,
  cellOptions,
  templateName,
  description,
  setTemplateName,
  setDescription,
  setSupabaseTable,
  supabaseTable,
  nameChangeDisabled,
}: TemplateNamingPageProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [isValidating, setIsValidating] = useState(false);

  // Extract dealside and property type from selectedTemplateType
  const [dealSide, propertyType] = selectedTemplateType.split("-");

  // Validate template name against existing templates
  const validateTemplateName = async (name: string) => {
    if (!name.trim() || !supabaseTable) {
      setValidationError("");
      return;
    }

    setIsValidating(true);
    setValidationError("");

    try {
      // Check if the name is "blank" (reserved name)
      if (name.toLowerCase() === "blank") {
        setValidationError(
          `"blank" is a reserved name and cannot be used. Please choose a different name.`
        );
        return;
      }

      if (name.toLowerCase() === "default") {
        setValidationError(
          `"default" is a reserved name and cannot be used. Please choose a different name.`
        );
        return;
      }

      let existingTemplates: any[] = [];

      if (supabaseTable === "client_intake") {
        existingTemplates = await getAllPartyIntakeTemplates();
      } else {
        existingTemplates = await getAllTemplates();
      }      
      const duplicateExists = existingTemplates.some((template) => {
        return template.name.split("-")[2] === name;
      });
      if (duplicateExists) {
        setValidationError(
          `A template with the name "${name}" already exists for ${dealSide} ${propertyType} templates. Please choose a different name.`
        );
      }
    } catch (error) {
      console.error("Error validating template name:", error);
      setValidationError("Error validating template name. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  // Debounced validation effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateTemplateName(templateName);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [templateName, supabaseTable, dealSide, propertyType]);

  const handleContinue = async () => {
    if (validationError) return;
    
    setIsSubmitting(true);
    await onContinue(
      selectedTemplateType,
      templateName,
      description,
      supabaseTable!
    );
    // Optionally, setIsSubmitting(false) if you want to re-enable after async
  };

  const handleBack = () => {
    setIsSubmitting(true);
    onBack();
    // Optionally, setIsSubmitting(false) if you want to re-enable after async
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-0">
      <Card className="w-full border-none shadow-lg">
        <CardContent className="p-8 flex flex-col gap-8">
          {/* Form type selection */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              What type of form are you editing?
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {/* Client Intake Form Card */}
              <div className="relative">
                <div
                  onClick={() =>
                    setSupabaseTable(
                      supabaseTable === "client_intake" ? null : "client_intake"
                    )
                  }
                  className={`h-full flex flex-col items-center justify-center rounded-lg cursor-pointer transition p-6
                    ${
                      supabaseTable === "client_intake"
                        ? "bg-gradient-to-r from-green-400 to-green-600 text-white shadow-xl"
                        : "border border-gray-200 hover:border-green-400 hover:bg-green-50"
                    }
                  `}
                >
                  <DocumentTextIcon
                    className={`h-8 w-8 transition ${
                      supabaseTable === "client_intake"
                        ? "text-white"
                        : "text-green-600"
                    }`}
                  />
                  <p
                    className={`mt-2 text-sm font-semibold ${
                      supabaseTable === "client_intake"
                        ? "text-white"
                        : "text-gray-900"
                    } text-center`}
                  >
                    Client Intake Form
                  </p>
                </div>
              </div>
              {/* Transaction Forms Card */}
              <div className="relative">
                <div
                  onClick={() =>
                    setSupabaseTable(
                      supabaseTable === "transaction_forms"
                        ? null
                        : "transaction_forms"
                    )
                  }
                  className={`h-full flex flex-col items-center justify-center rounded-lg cursor-pointer transition p-6
                    ${
                      supabaseTable === "transaction_forms"
                        ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-xl"
                        : "border border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                    }
                  `}
                >
                  <ClipboardDocumentListIcon
                    className={`h-8 w-8 transition ${
                      supabaseTable === "transaction_forms"
                        ? "text-white"
                        : "text-blue-600"
                    }`}
                  />
                  <p
                    className={`mt-2 text-sm font-semibold ${
                      supabaseTable === "transaction_forms"
                        ? "text-white"
                        : "text-gray-900"
                    } text-center`}
                  >
                    Transaction Forms
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Only show the rest of the form if a type is selected */}
          {supabaseTable && (
            <>
              {/* Header with icon, title, subtitle */}
              <div className="flex items-center gap-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-4 mb-2">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600">
                  <HomeIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {
                      cellOptions.find(
                        (option) => option.id === selectedTemplateType
                      )?.title
                    }
                  </div>
                  <div className="text-sm text-gray-600">
                    {
                      cellOptions.find(
                        (option) => option.id === selectedTemplateType
                      )?.description
                    }
                  </div>
                </div>
              </div>

              {/* Title and subtitle */}
              <div className="mb-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Name Your Template
                </h2>
                <p className="text-gray-600 text-base">
                  Give your template a memorable name and description
                </p>
              </div>

              {/* Form fields */}
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name"
                    required
                    disabled={nameChangeDisabled}
                    className={validationError ? "border-red-500" : ""}
                  />
                  {isValidating && (
                    <p className="text-sm text-blue-600 mt-1">
                      Validating template name...
                    </p>
                  )}
                  {validationError && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationError}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this template is for..."
                    rows={4}
                    disabled={nameChangeDisabled}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-between mt-8 gap-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleBack}
                  className="min-w-[120px]"
                  disabled={isSubmitting}
                >
                  &larr; Back
                </Button>
                <Button
                  type="button"
                  onClick={handleContinue}
                  className={`min-w-[140px] bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white`}
                  disabled={!templateName.trim() || isSubmitting || !!validationError || isValidating}
                >
                  Continue &rarr;
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateNamingPage;
