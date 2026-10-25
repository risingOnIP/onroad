"use client";

import React from "react";
import { FileText, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AvailableForms,
  Stage,
  TemplateForm,
} from "@/components/files/types/realtor";
import HorizontalStageFormList from "@/components/files/realtor/HorizontalStageFormList";
import { deleteTemplateFormById } from "@/app/actions/realtor/template-actions";
interface TemplateFormsSidebarProps {
  forms: {
    id: string;
    name: string;
    deal_wide: boolean;
    form_stage?: string;
  }[];
  activeFormId: string | null;
  onSelectForm: (formId: string) => void;
  availableForms: AvailableForms;
  onAddForm: (
    formType: string,
    deal_wide: boolean,
    stage?: string
  ) => Promise<void>;
  onUpdateFormStage?: (formId: string, newStage: string) => Promise<void>;
  onUpdateForms?: (
    forms: {
      id: string;
      name: string;
      deal_wide: boolean;
      form_stage?: string;
    }[]
  ) => void;
  isLoading?: boolean;
  dealSide: "sell" | "buy" | "lease" | "rent" | null;
  stages: Stage[];
  allFormTypes?: string[];
}

const beautifyFormType = (formType: string): string =>
  formType
    // 1) Replace "_a" → " A", leaving other letters alone:
    .replace(/_([A-Za-z])/g, (_, c) => " " + c.toUpperCase())
    // 2) Uppercase the very first letter of the whole string:
    .replace(/^[A-Za-z]/, (c) => c.toUpperCase());

const TemplateFormsSidebar: React.FC<TemplateFormsSidebarProps> = ({
  forms,
  activeFormId,
  onSelectForm,
  availableForms,
  onAddForm,
  onUpdateFormStage,
  onUpdateForms,
  isLoading = false,
  dealSide,
  stages,
  allFormTypes,
}) => {
  // Track the currently selected stage from HorizontalStageFormList
  const [currentSelectedStage, setCurrentSelectedStage] =
    React.useState<string>("");

  // Track which form is being deleted to show loading state
  const [deletingFormId, setDeletingFormId] = React.useState<string | null>(
    null
  );

  /* group forms */
  const dealWide = forms.filter((f) => f.deal_wide);
  const propertyWide = forms.filter((f) => !f.deal_wide);

  /** UI for a permanently-open "folder" with add form dropdown */
  const FolderBlock = ({
    title,
    children,
    showAddButton = false,
    isDealWide = false,
    availableFormTypes = [],
  }: {
    title: string;
    children: React.ReactNode;
    showAddButton?: boolean;
    isDealWide?: boolean;
    availableFormTypes?: string[];
  }) => (
    <div className="space-y-2">
      <div className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
        <span className="flex items-center gap-2 truncate">{title}</span>
        {showAddButton && availableFormTypes.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              {availableFormTypes.map((formType) => (
                <DropdownMenuItem
                  key={formType}
                  onClick={() => handleAddForm(formType, isDealWide)}
                  className="cursor-pointer"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {beautifyFormType(formType)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {children}
    </div>
  );

  // Add form handler that respects the selected stage from HorizontalStageFormList
  const handleAddForm = async (formType: string, isDealWide: boolean) => {
    try {
      let stage: string | undefined;

      if (dealSide === "sell" || dealSide === "lease") {
        // For sell/lease deals, use the currently selected stage from HorizontalStageFormList
        stage =
          currentSelectedStage ||
          (stages.length > 0 ? stages[0].name : undefined);
      } else if (dealSide === "buy" || dealSide === "rent") {
        if (isDealWide) {
          // Deal-wide forms don't have stages for buy/rent
          stage = undefined;
        } else {
          // Property-specific forms use the currently selected stage from HorizontalStageFormList
          stage =
            currentSelectedStage ||
            (stages.length > 0 ? stages[0].name : undefined);
        }
      }

      await onAddForm(formType, isDealWide, stage);
    } catch (error) {
      console.error("Error adding form:", error);
    }
  };

  const deleteTemplateForm = async (formId: string) => {
    // Prevent multiple delete operations on the same form
    if (deletingFormId === formId) {
      return;
    }

    // Find the form being deleted for potential reversion
    const formToDelete = forms.find((form) => form.id === formId);

    if (!formToDelete) {
      console.error("Could not find form to delete:", formId);
      return;
    }

    // Set loading state
    setDeletingFormId(formId);

    // Store the original forms state for potential reversion
    const originalForms = [...forms];

    // Optimistic update: immediately remove the form from the UI
    const optimisticForms = forms.filter((form) => form.id !== formId);
    onUpdateForms?.(optimisticForms);

    // If the deleted form was the active one, clear the selection
    if (activeFormId === formId) {
      onSelectForm("");
    }

    try {
      await deleteTemplateFormById(formId);
      // If successful, the optimistic update remains
    } catch (error) {
      console.error("Error deleting template form:", error);
      // Revert the optimistic update on error
      onUpdateForms?.(originalForms);

      // Restore active form selection if the deleted form was active
      if (activeFormId === formId) {
        onSelectForm(formId);
      }

      alert("An error occurred while deleting the form. Please try again.");
    } finally {
      // Clear loading state
      setDeletingFormId(null);
    }
  };

  // Convert forms to proper format for HorizontalStageFormList
  const convertFormsToTemplateForm = (
    formsList: typeof forms
  ): TemplateForm[] => {
    return formsList.map((f) => ({
      id: f.id,
      form_type: f.name, // The 'name' field contains the form type
      deal_wide: f.deal_wide,
      form_stage: f.form_stage,
      order: 0, // Will be handled by HorizontalStageFormList
      template_id: "", // Not needed for display
      created_at: "", // Not needed for display
      user_id: "", // Not needed for display but required by interface
      form_response: {} as JSON, // Not needed for display but required by interface
      file_upload_pdf: "", // Not needed for display but required by interface
    }));
  };

  // Helper function to render stage-organized forms using HorizontalStageFormList
  const renderStageOrganizedForms = (
    formsToRender: typeof forms,
    useStages: boolean,
    includeAllForms: boolean = false
  ) => {
    if (!useStages || stages.length === 0) {
      // No stages - render simple list
      return (
        <div className="space-y-2">
          {formsToRender.length === 0 ? (
            <p className="text-xs px-2 text-muted-foreground">No forms yet.</p>
          ) : (
            formsToRender.map((f) => (
              <div key={f.id} className="relative group w-full">
                <button
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                    f.id === activeFormId
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => onSelectForm(f.id)}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0" />
                    {beautifyFormType(f.name)}
                  </div>

                  {/* Dropdown menu trigger (three dots) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 cursor-pointer"
                        title="More options"
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </DropdownMenuTrigger>

                    {/* Drop-up menu */}
                    <DropdownMenuContent
                      align="end"
                      side="top"
                      sideOffset={4}
                      className="w-40 bg-white border border-gray-200 rounded-md shadow-md z-50"
                    >
                      <DropdownMenuItem
                        className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${
                          deletingFormId === f.id
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-red-600 hover:bg-red-100 hover:text-red-700"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (deletingFormId !== f.id) {
                            deleteTemplateForm(f.id);
                          }
                        }}
                        disabled={deletingFormId === f.id}
                      >
                        {deletingFormId === f.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {deletingFormId === f.id
                          ? "Deleting..."
                          : "Delete Form"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </button>
              </div>
            ))
          )}
        </div>
      );
    }

    // With stages - use HorizontalStageFormList
    const templateForms = convertFormsToTemplateForm(formsToRender);

    // Determine which forms to show in the dropdown based on the context
    const availableFormsForDropdown = includeAllForms
      ? [
          ...availableForms.deal_wide.map((form) => form.formType),
          ...(availableForms.property_specific?.map((form) => form.formType) ||
            []),
        ]
      : availableForms.property_specific?.map((form) => form.formType) || [];

    return (
      <HorizontalStageFormList
        handleFormClick={onSelectForm}
        activeFormId={activeFormId}
        forms={templateForms}
        availableForms={availableFormsForDropdown}
        addFormToBackend={async (formType: string, stage?: string) => {
          // Determine if this is a deal-wide form based on the available forms
          const isDealWide = availableForms.deal_wide.some(
            (form) => form.formType === formType
          );
          await onAddForm(formType, isDealWide, stage);
          return {
            id: "temp-id",
            form_type: formType,
            deal_wide: isDealWide,
            form_stage: stage,
            order: 0,
            template_id: "",
            created_at: "",
            updated_at: "",
            user_id: "",
            form_response: {} as JSON,
            file_upload_pdf: "",
          };
        }}
        updateFormOrderInBackend={async (updates) => {
          // Handle form order updates and stage changes
          for (const update of updates) {
            if (update.form_stage && onUpdateFormStage) {
              await onUpdateFormStage(update.id, update.form_stage);
            }
          }
        }}
        stages={stages}
        showAddButton={false}
        onSelectedStageChange={setCurrentSelectedStage}
        selectedStage={currentSelectedStage}
        allFormTypes={allFormTypes}
        onFormDeleted={deleteTemplateForm}
      />
    );
  };

  /* top-level render */
  return (
    <aside className="flex h-full flex-col border-r border-gray-200">
      <header className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold tracking-tight">Forms</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin w-6 h-6 text-gray-400" />
          </div>
        ) : (
          <>
            {/* Current Forms organized by deal type */}
            {dealSide === "buy" || dealSide === "rent" ? (
              <>
                <FolderBlock
                  title="Deal-Wide Forms"
                  showAddButton={true}
                  isDealWide={true}
                  availableFormTypes={availableForms.deal_wide.map(
                    (form) => form.formType
                  )}
                >
                  {/* Buy/Rent: Deal-wide forms WITHOUT stages */}
                  {renderStageOrganizedForms(dealWide, false)}
                </FolderBlock>

                <FolderBlock
                  title="Property-Specific Forms"
                  showAddButton={true}
                  isDealWide={false}
                  availableFormTypes={
                    availableForms.property_specific?.map(
                      (form) => form.formType
                    ) || []
                  }
                >
                  {/* Buy/Rent: Property-specific forms WITH stages */}
                  {renderStageOrganizedForms(propertyWide, true)}
                </FolderBlock>
              </>
            ) : (
              /* sell / lease - only deal-wide forms WITH stages, no property-specific section */
              <>
                <FolderBlock
                  title="Deal-Wide Forms"
                  showAddButton={true}
                  isDealWide={true}
                  availableFormTypes={[
                    ...availableForms.deal_wide.map((form) => form.formType),
                    ...(availableForms.property_specific?.map(
                      (form) => form.formType
                    ) || []),
                  ]}
                >
                  {/* Sell/Lease: All forms WITH stages using HorizontalFormStageList */}
                  {renderStageOrganizedForms(
                    [...dealWide, ...propertyWide],
                    true,
                    true
                  )}
                </FolderBlock>
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default TemplateFormsSidebar;
