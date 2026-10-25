"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import TemplateFormsSidebar from "./TemplateFormsSidebar";
import OptimizedFormInput from "@/components/files/realtor/OptimizedFormInput";
import {
  AvailableForms,
  FormResponse,
  SchemaItem,
  SignatureInput,
  Stage,
  Template,
  TemplateForm,
} from "@/components/files/types/realtor";
import { getSchemaByFormType } from "@/app/actions/realtor/schema";
import {
  fetchTemplateFormResponses,
  getIndividualTemplateForm,
  updateTemplateFormResponse,
  getTemplateFormsById,
  addTemplateFormByTemplateId,
  getTemplate,
  updateTemplateFormStage,
  getStageByTemplateId,
} from "@/app/actions/realtor/template-actions";
import { getAvailableFormsFromTemplateId } from "@/app/actions/realtor/form-actions";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { fetchAllPossibleFormTypes } from "@/app/actions/realtor/schema-actions";

const ModifyTransactionFormPage = () => {
  const router = useRouter();
  const { templateId } = useParams<{
    templateId: string;
  }>();

  // Header state

  // States for transaction forms
  const [currentForms, setCurrentForms] = useState<TemplateForm[]>([]);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [schema, setSchema] = useState<SchemaItem[]>([]);
  const [formResponses, setFormResponses] = useState<FormResponse>({});
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [isLoadingMain, setIsLoadingMain] = useState(false);
  const [availableForms, setAvailableForms] = useState<AvailableForms>({
    deal_wide: [],
    property_specific: [],
  });
  const [template, setTemplate] = useState<Template | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [allFormTypes, setAllFormTypes] = useState<string[]>([]);

  // Sets current forms
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingForms(true);

      try {
        const fetched = await getTemplateFormsById(templateId);
        setCurrentForms(fetched);

        const availableForms = await getAvailableFormsFromTemplateId(
          templateId
        );
        setAvailableForms(availableForms);

        const template: Template = await getTemplate(templateId);
        setTemplate(template);

        // For templates, we'll use default stages since templates don't have deal-specific stages
        // In a future implementation, you could create a separate template stages system
        setStages(await getStageByTemplateId(templateId));
      } catch (e) {
        console.error(e);
        setCurrentForms([]);
      } finally {
        setIsLoadingForms(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch all form types for validation
  useEffect(() => {
    const fetchFormTypes = async () => {

      try {
        const formTypes = await fetchAllPossibleFormTypes();
        setAllFormTypes(formTypes);

        if (formTypes.length === 0) {
          console.warn("ModifyTransactionFormPage: No form types received!");
          console.warn("Check console for fetchAllPossibleFormTypes logs above");
        }
      } catch (error) {
        console.error(
          "ModifyTransactionFormPage: ❌ Failed to fetch form types:",
          error
        );
      }
    };

    fetchFormTypes();
  }, []);

  // sets available forms for adding

  // Sets schema and responses for active form
  useEffect(() => {
    if (!activeFormId) return;
    const loadSchemaAndResponses = async () => {
      setIsLoadingMain(true);
      try {
        const templateForm = await getIndividualTemplateForm(activeFormId);
        const schemaData = await getSchemaByFormType(templateForm.form_type);
        setSchema(schemaData as SchemaItem[]);
        try {
          const responses = await fetchTemplateFormResponses(activeFormId);
          setFormResponses(responses);
        } catch {
          setFormResponses({});
        }
      } catch {
        setSchema([]);
        setFormResponses({});
      } finally {
        setIsLoadingMain(false);
      }
    };
    loadSchemaAndResponses();
  }, [activeFormId]);

  // Add form handler
  const handleAddForm = async (
    formType: string,
    deal_wide: boolean,
    stage?: string
  ) => {
    try {
      await addTemplateFormByTemplateId(templateId, formType, deal_wide, stage);
      // Refresh forms list
      const fetched = await getTemplateFormsById(templateId);
      setCurrentForms(fetched);
    } catch (e) {
      // Optionally show error
      console.error(e);
    }
  };

  // Update form stage handler
  const handleUpdateFormStage = async (formId: string, newStage: string) => {
    try {
      await updateTemplateFormStage(formId, newStage);
      // Refresh forms list
      const fetched = await getTemplateFormsById(templateId);
      setCurrentForms(fetched);
    } catch (e) {
      console.error("Error updating form stage:", e);
    }
  };

  // Update forms handler for optimistic updates
  const handleUpdateForms = (
    updatedForms: {
      id: string;
      name: string;
      deal_wide: boolean;
      form_stage?: string;
    }[]
  ) => {
    // Convert back to TemplateForm format and update state
    const templateForms: TemplateForm[] = updatedForms.map((f) => ({
      id: f.id,
      form_type: f.name,
      deal_wide: f.deal_wide,
      form_stage: f.form_stage,
      order: 0,
      template_id: templateId,
      created_at: "",
      updated_at: "",
      user_id: "",
      form_response: {} as JSON,
      file_upload_pdf: "",
    }));
    setCurrentForms(templateForms);
  };

  // Sidebar form list for sidebar component
  const sidebarForms = currentForms.map((f) => ({
    id: f.id,
    name: f.form_type,
    deal_wide: f.deal_wide,
    form_stage: f.form_stage,
  }));

  return (
    <div className="flex-grow flex w-full h-full flex-col my-4">
      {/* Subtle back button above the card */}
      <div className="mx-4 mb-2">
        <Link href="/realtor/workspace/templates/">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:underline flex items-center gap-1 px-2 py-1"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </Link>
      </div>
      {/* Inserted Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mx-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            OnRoad Template Builder
          </h1>
          {template?.name && (
            <div className="text-lg text-gray-500 font-medium mt-1">
              {template.name}
            </div>
          )}
          <div className="flex space-x-3">
            <Button
              onClick={() => router.push("/realtor/workspace/templates/forms")}
              variant="outline"
              className={""}
            >
              Create New Template
            </Button>
            <Button
              onClick={() => {}}
              variant={"default"}
              className={
                "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
              }
            >
              Modify Existing
            </Button>
          </div>
        </div>
      </div>
      {/* Card containing sidebar and main content */}
      <div className="flex w-full justify-center">
        <div className="w-full max-w-5xl min-h-[80vh] max-h-[80vh] flex">
          {/* Sidebar */}
          <div className="w-1/4 min-w-[220px] h-full overflow-y-auto">
            <TemplateFormsSidebar
              forms={sidebarForms}
              activeFormId={activeFormId}
              onSelectForm={setActiveFormId}
              availableForms={availableForms}
              onAddForm={handleAddForm}
              onUpdateFormStage={handleUpdateFormStage}
              onUpdateForms={handleUpdateForms}
              isLoading={isLoadingForms}
              dealSide={
                (template?.name?.split("-")[0] as
                  | "sell"
                  | "buy"
                  | "lease"
                  | "rent") || null
              }
              stages={stages}
              allFormTypes={allFormTypes}
            />
          </div>
          {/* Main content */}
          <div className="w-3/4 flex flex-col px-8 py-10 overflow-y-auto">
            {!activeFormId ? (
              <div className="flex items-center justify-center h-full text-gray-400 ">
                Select a form to start working
              </div>
            ) : (
              <OptimizedFormInput
                key={activeFormId}
                schema={schema}
                formResponseUpdateByField={(
                  itemKey: string,
                  newValue: string | string[] | SignatureInput
                ) =>
                  updateTemplateFormResponse(activeFormId, itemKey, newValue)
                }
                initialFormResponses={formResponses}
                can_edit={true}
                loading={isLoadingMain}
                dealOptionId={""}
              />
            )}
          </div>
        </div>
      </div>
      {/* Back button below card (no change) */}
      <div className="flex justify-start  max-w-5xl mt-6">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.back()}
          className="min-w-[120px]"
        >
          &larr; Back
        </Button>
      </div>
    </div>
  );
};

export default ModifyTransactionFormPage;
