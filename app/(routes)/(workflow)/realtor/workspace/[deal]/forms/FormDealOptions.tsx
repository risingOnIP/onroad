"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { Building, ChevronRight, Home, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddDealOptionDialog from "./AddDealOptionDialog";
import TemplateFormsSidebarSkeleton from "@/components/loading-skeletons/TemplateFormsSidebarSkeleton";

import {
  addFormToDealOption,
  createDealOption,
  getDealOptionsWithForms,
  uploadFormToDealOption,
  deleteDealOption,
} from "@/app/actions/realtor/deal-option-actions";
import {
  deleteForm,
  getAvailableFormsFromDealId,
  updateFormOrderInDealOption,
} from "@/app/actions/realtor/form-actions";
import { getStagesForDeal } from "@/app/actions/realtor/stage-actions";
import { fetchAllPossibleFormTypes } from "@/app/actions/realtor/schema-actions";
import {
  AvailableForms,
  DealOptionFormMerged,
  Stage,
  Form,
} from "@/components/files/types/realtor";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DealPageContext } from "../DealPageContext";
import FormList from "@/components/files/realtor/FormList";
import HorizontalStageFormList from "@/components/files/realtor/HorizontalStageFormList";

interface DealOptionSidebarProps {
  dealId: string;
  dealSide?: string;
}

export default function DealOptionSidebar({
  dealId,
  dealSide,
}: DealOptionSidebarProps) {
  const [dealOptions, setDealOptions] = useState<DealOptionFormMerged[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableForms, setAvailableForms] = useState<AvailableForms>();
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [openCollapsibles, setOpenCollapsibles] = useState<Set<string>>(
    new Set()
  );
  const [stages, setStages] = useState<Stage[]>([]);
  const [allFormTypes, setAllFormTypes] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealOptionToDelete, setDealOptionToDelete] = useState<{
    id: string;
    address: string;
  } | null>(null);

  const { state, editForm, editProperty } = useContext(DealPageContext);

  /* ───────────────── helper functions ───────────────── */
  // Helper function to find which deal option contains a given form ID
  const findDealOptionByFormId = (
    formId: string
  ): DealOptionFormMerged | null => {
    for (const dealOption of dealOptions) {
      if (dealOption.forms?.some((form) => form.id === formId)) {
        return dealOption;
      }
    }
    return null;
  };

  /* ───────────────── data fetching ───────────────── */
  useEffect(() => {
    const fetchAvailableForms = async () => {
      if (!dealId) return [];
      try {
        const forms: AvailableForms = await getAvailableFormsFromDealId(dealId);
        setAvailableForms(forms);
      } catch (error) {
        console.error("Error fetching available forms:", error);
      }
    };
    fetchAvailableForms();
  }, [dealId]);

  useEffect(() => {
    const fetchStages = async () => {
      if (!dealId) return;
      try {
        const stageData = await getStagesForDeal(dealId);
        setStages(stageData);
      } catch (error) {
        console.error("Error fetching stages:", error);
      }
    };
    fetchStages();
  }, [dealId]);

  useEffect(() => {
    const fetchFormTypes = async () => {

      try {
        const formTypes = await fetchAllPossibleFormTypes();
        setAllFormTypes(formTypes);

        if (formTypes.length === 0) {
          console.warn("FormDealOptions: No form types received!");
          console.warn("Check console for fetchAllPossibleFormTypes logs above");
        }
      } catch (error) {
        console.error("FormDealOptions: Failed to fetch form types:", error);
      }
    };

    fetchFormTypes();
  }, []);

  const fetchDealOptions = useCallback(async () => {
    if (!dealId || !hasMounted) return;
    try {
      setIsLoading(true);
      const dealOptionData = await getDealOptionsWithForms(dealId);
      setDealOptions(dealOptionData);
    } catch (error) {
      console.error("Error fetching dealOptions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dealId, hasMounted]);

  useEffect(() => setHasMounted(true), []);
  useEffect(() => {
    if (hasMounted) fetchDealOptions();
  }, [fetchDealOptions, hasMounted]);

  // Initialize activeFormId and collapsible states from URL parameters
  useEffect(() => {
    if (!state.selectedFormId || !dealOptions.length) return;

    // Set the active form from URL
    setActiveFormId(state.selectedFormId);

    // Find which deal option contains this form
    const dealOption = findDealOptionByFormId(state.selectedFormId);
    if (dealOption && dealOption.address !== "deal-wide") {
      // For property-specific forms, open that property's collapsible
      setOpenCollapsibles(new Set([dealOption.id]));
    }
  }, [state.selectedFormId, dealOptions]);

  /* ───────────────── handlers ───────────────── */
  const handleFormClick = (formId: string) => {
    setActiveFormId(formId);
    // Use context navigation function for proper URL management
    editForm(formId);
  };

  const handleCollapsibleOpenChange = (
    dealOptionId: string,
    isOpen: boolean
  ) => {
    setOpenCollapsibles((prev) => {
      const newSet = new Set(prev);
      if (isOpen) {
        newSet.add(dealOptionId);
      } else {
        newSet.delete(dealOptionId);
      }
      return newSet;
    });
  };

  const handlePropertyInfoClick = (dealOptionId: string) => {
    // Use context navigation function for proper URL management
    editProperty(dealOptionId);
  };

  const handleAddForm = async (
    form_type: string,
    dealOptionId: string,
    targetStage?: string
  ) => {

    // Optimistic update: Add form to local state immediately
    const optimisticForm: Partial<Form> = {
      id: `temp-${Date.now()}`, // Temporary ID
      form_type,
      form_stage:
        targetStage || (stages.length > 0 ? stages[0].name : "default"),
      // order: 0, // Will be updated with actual order from backend
      created_at: new Date().toISOString(),
      user_id: "", // Will be filled by backend
      deal_option_id: dealOptionId,
      form_response: {},
      signature_sequence: [],
      file_upload_pdf: "",
      finalized_pdf: "",
      custom_schema: [],
    };

    // Update local state optimistically
    setDealOptions((prev) =>
      prev.map((opt) =>
        opt.id === dealOptionId
          ? { ...opt, forms: [...(opt.forms || []), ({...optimisticForm, order: opt.forms?.length || 0} as Form)] }
          : opt
      )
    );

    try {
      const newForm = await addFormToDealOption(
        dealOptionId,
        form_type,
        targetStage
      );
      //

      // Replace optimistic form with real form data
      setDealOptions((prev) =>
        prev.map((opt) =>
          opt.id === dealOptionId
            ? {
                ...opt,
                forms: (opt.forms || []).map((form) =>
                  form.id === optimisticForm.id ? newForm : form
                ),
              }
            : opt
        )
      );

      return newForm;
    } catch (error) {
      // Revert optimistic update on error
      setDealOptions((prev) =>
        prev.map((opt) =>
          opt.id === dealOptionId
            ? {
                ...opt,
                forms: (opt.forms || []).filter(
                  (form) => form.id !== (optimisticForm as Form).id
                ),
              }
            : opt
        )
      );
      throw error;
    }
  };

  const onFormDeleted = async (formId: string) => {
    // Store the original state for potential reversion
    const originalDealOptions = [...dealOptions];

    // Find which deal option contains this form
    const dealOptionWithForm = dealOptions.find((opt) =>
      opt.forms?.some((form) => form.id === formId)
    );

    if (!dealOptionWithForm) {
      console.error("Could not find deal option containing form:", formId);
      return;
    }

    // Store the form being deleted for potential reversion
    const formToDelete = dealOptionWithForm.forms?.find(
      (form) => form.id === formId
    );

    if (!formToDelete) {
      console.error("Could not find form to delete:", formId);
      return;
    }

    // Optimistic update: Remove form from local state immediately
    setDealOptions((prev) =>
      prev.map((opt) =>
        opt.id === dealOptionWithForm.id
          ? {
              ...opt,
              forms: (opt.forms || []).filter((form) => form.id !== formId),
            }
          : opt
      )
    );

    try {
      const response: { message: string; success: boolean; deletedForm: Form } =
        await deleteForm(formId);

      if (!response.success) {
        // Revert optimistic update on failure
        console.error("Failed to delete form:", response.message);
        setDealOptions(originalDealOptions);

        // Optionally show user feedback
        alert(`Failed to delete form: ${response.message}`);
      }
      // If successful, the optimistic update already handled the UI change
    } catch (error) {
      // Revert optimistic update on error
      console.error("Error deleting form:", error);
      setDealOptions(originalDealOptions);

      // Optionally show user feedback
      alert("An error occurred while deleting the form. Please try again.");
    }
  };

  const handleAddUploadedForm = async (
    file: File,
    dealOptionId: string,
    formName: string,
    targetStage?: string
  ) => {
    // Optimistic update: Add form to local state immediately
    const optimisticForm: Partial<Form> & { form_name?: string } = {
      id: `temp-${Date.now()}`, // Temporary ID
      form_type: "uploaded_form",
      form_stage:
        targetStage || (stages.length > 0 ? stages[0].name : "default"),
      order: 0, // Will be updated with actual order from backend
      created_at: new Date().toISOString(),
      user_id: "", // Will be filled by backend
      deal_option_id: dealOptionId,
      form_response: {},
      signature_sequence: [],
      file_upload_pdf: "",
      finalized_pdf: "",
      custom_schema: [],
      form_name: formName,
    };

    // Update local state optimistically
    setDealOptions((prev) =>
      prev.map((opt) =>
        opt.id === dealOptionId
          ? { ...opt, forms: [...(opt.forms || []), optimisticForm as Form] }
          : opt
      )
    );

    try {
      const newForm = await uploadFormToDealOption(
        file,
        dealOptionId,
        formName,
        targetStage
      );

      // Replace optimistic form with real form data
      setDealOptions((prev) =>
        prev.map((opt) =>
          opt.id === dealOptionId
            ? {
                ...opt,
                forms: (opt.forms || []).map((form) =>
                  form.id === (optimisticForm as Form).id ? newForm : form
                ),
              }
            : opt
        )
      );

      return newForm;
    } catch (error) {
      // Revert optimistic update on error
      setDealOptions((prev) =>
        prev.map((opt) =>
          opt.id === dealOptionId
            ? {
                ...opt,
                forms: (opt.forms || []).filter(
                  (form) => form.id !== (optimisticForm as Form).id
                ),
              }
            : opt
        )
      );
      throw error;
    }
  };

  const handleAddDealOption = async (address: string) => {
    if (!address.trim() || !dealId) return;
    try {
      await createDealOption(dealId, address);
      await fetchDealOptions();
    } catch (error) {
      console.error("Error creating dealOption:", error);
    }
  };

  const handleDeleteDealOption = async (
    dealOptionId: string,
    address: string
  ) => {
    if (!dealOptionId) return;

    // Set the deal option to delete and open the dialog
    setDealOptionToDelete({ id: dealOptionId, address });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDealOption = async () => {
    if (!dealOptionToDelete) return;

    try {
      await deleteDealOption(dealOptionToDelete.id);
      await fetchDealOptions(); // Refresh the list
      setDeleteDialogOpen(false);
      setDealOptionToDelete(null);
    } catch (error) {
      console.error("Error deleting deal option:", error);
      alert("Failed to delete deal option. Please try again.");
    }
  };

  const cancelDeleteDealOption = () => {
    setDeleteDialogOpen(false);
    setDealOptionToDelete(null);
  };

  if (!hasMounted) return <div className="flex flex-col w-full" />;

  if (isLoading) {
    return <TemplateFormsSidebarSkeleton />;
  }

  // For sell/lease deals, find the deal-wide option to use for property information
  const dealWideOption = dealOptions.find((opt) => opt.address === "deal-wide");
  const isSellOrLease = dealSide === "sell" || dealSide === "lease";

  /* ───────────────── render ───────────────── */
  return (
    <div className="flex flex-col w-full">
      <ul className="space-y-0.5 list-none p-0">
        {/* Property Information - show directly for sell/lease deals */}
        {isSellOrLease && dealWideOption && (
          <li key="property-info">
            <button
              className="w-full text-left hover:bg-muted rounded-md"
              onClick={() => handlePropertyInfoClick(dealWideOption.id)}
            >
              <div className="flex items-center gap-2 px-2 py-1 text-sm">
                <Building className="h-4 w-4 shrink-0" />
                Property Information
              </div>
            </button>
          </li>
        )}

        {/* Deal‑wide forms - Collapsible */}
        {dealOptions
          .filter((opt) => opt.address === "deal-wide")
          .map((opt) => (
            <li key={opt.id}>
              <Collapsible defaultOpen={true}>
                <CollapsibleTrigger asChild>
                  <button className="group flex w-full items-center justify-between rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground/70 hover:bg-muted">
                    <span>Deal‑Wide Forms</span>
                    <div className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2">
                    {isSellOrLease ? (
                      <HorizontalStageFormList
                        handleFormClick={handleFormClick}
                        activeFormId={activeFormId}
                        forms={opt.forms || []}
                        onRefresh={undefined} // Remove onRefresh to prevent reloading
                        addFormToBackend={(form_type, targetStage) =>
                          handleAddForm(form_type, opt.id, targetStage)
                        }
                        addUploadedFormToBackend={(file, formName) =>
                          handleAddUploadedForm(file, opt.id, formName)
                        }
                        availableForms={
                          availableForms?.deal_wide.map(
                            (form) => form.formType
                          ) || []
                        }
                        updateFormOrderInBackend={(updates) =>
                          updateFormOrderInDealOption(updates)
                        }
                        stages={stages}
                        allFormTypes={allFormTypes}
                        onFormDeleted={onFormDeleted}
                      />
                    ) : (
                      <FormList
                        handleFormClick={handleFormClick}
                        activeFormId={activeFormId}
                        forms={opt.forms || []}
                        onRefresh={undefined} // Remove onRefresh to prevent reloading
                        addFormToBackend={(form_type) =>
                          handleAddForm(form_type, opt.id)
                        }
                        addUploadedFormToBackend={(file, formName) =>
                          handleAddUploadedForm(file, opt.id, formName)
                        }
                        availableForms={
                          availableForms?.deal_wide.map(
                            (form) => form.formType
                          ) || []
                        }
                        updateFormOrderInBackend={(updates) =>
                          updateFormOrderInDealOption(updates)
                        }
                        allFormTypes={allFormTypes}
                        onFormDeleted={onFormDeleted}
                      />
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </li>
          ))}
      </ul>

      {/* separator between Add Form (inside FormList) and Add Deal Option - only show for buy/rent */}
      {!isSellOrLease && <Separator className="my-2" />}

      {/* Add Deal Option button - only show for buy/rent deals */}
      {!isSellOrLease && (
        <div className="mb-4 pl-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-black hover:bg-gray-100"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Add Property</span>
          </Button>
        </div>
      )}

      <ul className="space-y-0.5 list-none p-0">
        {/* Property‑specific options */}
        {dealOptions
          .filter((opt) => opt.address !== "deal-wide")
          .map((opt) => (
            <li key={opt.id}>
              <Collapsible
                open={openCollapsibles.has(opt.id)}
                onOpenChange={(isOpen) =>
                  handleCollapsibleOpenChange(opt.id, isOpen)
                }
              >
                <CollapsibleTrigger asChild>
                  <button className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                    <span className="flex items-center gap-2 truncate">
                      <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {opt.address}
                    </span>
                    <div className="flex items-center gap-1">
                      <div
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDealOption(opt.id, opt.address);
                        }}
                        title="Delete deal option"
                      >
                        <Trash2 className="h-4 w-4 text-red-600 hover:text-red-700" />
                      </div>
                      <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-1 space-y-1 border-l border-muted-foreground/10 pl-2">
                  <button
                    className="w-full text-left hover:bg-muted rounded-md"
                    onClick={() => handlePropertyInfoClick(opt.id)}
                  >
                    <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                      <Building className="h-4 w-4 shrink-0" />
                      Property Information
                    </div>
                  </button>

                  <p className="px-2 pt-1 text-xs font-semibold text-muted-foreground/70">
                    Forms
                  </p>

                  <HorizontalStageFormList
                    handleFormClick={handleFormClick}
                    activeFormId={activeFormId}
                    forms={opt.forms || []}
                    onRefresh={undefined} // Remove onRefresh to prevent reloading
                    addFormToBackend={(form_type, targetStage) =>
                      handleAddForm(form_type, opt.id, targetStage)
                    }
                    addUploadedFormToBackend={(file, formName, targetStage) =>
                      handleAddUploadedForm(file, opt.id, formName, targetStage)
                    }
                    availableForms={
                      availableForms?.property_specific?.map(
                        (form) => form.formType
                      ) || []
                    }
                    updateFormOrderInBackend={(updates) =>
                      updateFormOrderInDealOption(updates)
                    }
                    stages={stages}
                    allFormTypes={allFormTypes}
                    onFormDeleted={onFormDeleted}
                  />
                </CollapsibleContent>
              </Collapsible>
            </li>
          ))}
      </ul>

      <AddDealOptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddDealOption={handleAddDealOption}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the deal option &quot;
              {dealOptionToDelete?.address}&quot;? This will also delete all
              associated forms and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDeleteDealOption}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteDealOption}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
