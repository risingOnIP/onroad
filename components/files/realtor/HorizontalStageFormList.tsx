"use client";

import { Upload, FileText, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useMemo } from "react";
import { Form, Stage, TemplateForm } from "../types/realtor";

// --- DND-KIT IMPORTS ---
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableFormItem } from "./SortableFormItem";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface HorizontalStageFormListProps {
  handleFormClick: (formId: string) => void;
  activeFormId: string | null;
  forms: Form[] | TemplateForm[];
  availableForms: string[];
  addFormToBackend: (
    formType: string,
    stage?: string
  ) => Promise<Form | TemplateForm>;
  updateFormOrderInBackend: (
    updates: { id: string; order: number; form_stage?: string }[]
  ) => Promise<void>;
  addUploadedFormToBackend?: (
    uploadedForm: File,
    formName: string,
    stage?: string
  ) => Promise<Form | TemplateForm>;
  onFormDeleted: (formId: string) => void;
  onRefresh?: () => void;
  stages?: Stage[];
  showAddButton?: boolean;
  onSelectedStageChange?: (stage: string) => void;
  selectedStage?: string;
  allFormTypes?: string[];
}

export default function HorizontalStageFormList({
  handleFormClick,
  availableForms,
  addFormToBackend,
  updateFormOrderInBackend,
  addUploadedFormToBackend,
  forms,
  onRefresh,
  activeFormId,
  stages = [],
  onFormDeleted,
  showAddButton = true,
  onSelectedStageChange,
  selectedStage: propSelectedStage,
  allFormTypes,
}: HorizontalStageFormListProps) {
  const [localForms, setLocalForms] = useState<Form[] | TemplateForm[]>([]);
  const [isAddingForm, setIsAddingForm] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [hasInitializedStage, setHasInitializedStage] = useState(false);

  // State for the upload dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadFormName, setUploadFormName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const beautifyFormType = (formType: string): string =>
    formType
      .replace(/_([A-Za-z])/g, (_, c) => " " + c.toUpperCase())
      .replace(/^[A-Za-z]/, (c) => c.toUpperCase());


  // Sort forms by the 'order' property when they are received from props
  useEffect(() => {
    const sortedForms = [...forms].sort((a, b) => a.order - b.order) as
      | Form[]
      | TemplateForm[];
    setLocalForms(sortedForms);
  }, [forms]);

  // Group forms by stage
  const formsByStage = useMemo(() => {
    const grouped: Record<string, (Form | TemplateForm)[]> = {};

    // Initialize with empty arrays for each stage

    stages.forEach((stage) => {
      grouped[stage.name] = [];
    });

    // Group forms
    localForms.forEach((form) => {
      const stage = (form as Form).form_stage;
      if (stage && grouped[stage]) {
        grouped[stage].push(form);
      }
    });

    // Sort forms within each stage by order
    Object.keys(grouped).forEach((stageName) => {
      grouped[stageName].sort((a, b) => {
        return a.order - b.order;
      });
    });

    return grouped;
  }, [localForms, stages]);

  // Use prop selectedStage when available, otherwise use internal state
  const currentSelectedStage = propSelectedStage ?? selectedStage;

  // Set default stage when stages are loaded (only once)
  useEffect(() => {
    if (stages.length > 0 && !currentSelectedStage && !hasInitializedStage) {
      if (propSelectedStage !== undefined) {
        // If using prop, notify parent to set the default stage
        onSelectedStageChange?.(stages[0].name);
      } else {
        // If using internal state, set it directly
        setSelectedStage(stages[0].name);
      }
      setHasInitializedStage(true);
    }
  }, [
    stages,
    currentSelectedStage,
    hasInitializedStage,
    propSelectedStage,
    onSelectedStageChange,
  ]);

  // Notify parent when selected stage changes (only for internal state)
  useEffect(() => {
    if (
      selectedStage &&
      onSelectedStageChange &&
      propSelectedStage === undefined
    ) {
      onSelectedStageChange(selectedStage);
    }
  }, [selectedStage, onSelectedStageChange, propSelectedStage]);

  // --- DND-KIT SENSOR SETUP ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- DND-KIT DRAG END HANDLER ---
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a stage tab
    let targetStage: string | undefined;
    if (overId.startsWith("stage-tab-")) {
      targetStage = overId.replace("stage-tab-", "");
    }

    // Find the active form
    const activeForm = localForms.find((f) => f.id === activeId);
    if (!activeForm) return;

    // If dropped on a stage tab
    if (targetStage) {
      // Update the form's stage
      const updates = [
        {
          id: activeForm.id,
          order: activeForm.order,
          form_stage: targetStage,
        },
      ];

      try {
        await updateFormOrderInBackend(updates);
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error("Failed to update form stage:", error);
      }
    } else if (active.id !== over.id) {
      // Regular reordering within the same stage
      const currentStageforms = formsByStage[currentSelectedStage] || [];
      const oldIndex = currentStageforms.findIndex((f) => f.id === active.id);
      const newIndex = currentStageforms.findIndex((f) => f.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedForms = arrayMove(currentStageforms, oldIndex, newIndex);

      // Update local state immediately for optimistic UI
      const newFormsByStage = { ...formsByStage };
      newFormsByStage[currentSelectedStage] = reorderedForms;

      // Rebuild localForms with updated order values
      const updatedLocalForms = localForms.map((form) => {
        const stageForm = reorderedForms.find((f) => f.id === form.id);
        if (stageForm) {
          const newOrder = reorderedForms.findIndex((f) => f.id === form.id);
          return { ...form, order: newOrder };
        }
        return form;
      });

      setLocalForms(updatedLocalForms as Form[] | TemplateForm[]);

      // Prepare data for backend update with proper order values
      const updates = reorderedForms.map((form, index) => ({
        id: form.id,
        order: index,
      }));

      try {
        await updateFormOrderInBackend(updates);
      } catch (error) {
        console.error("Failed to update form order:", error);
        // Revert to original state on error
        setLocalForms(
          [...forms].sort((a, b) => a.order - b.order) as
            | Form[]
            | TemplateForm[]
        );
      }
    }
  }

  // Stage dot component
  const StageDot = ({
    stage,
    isActive,
  }: {
    stage: Stage;
    isActive: boolean;
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: `stage-tab-${stage.name}`,
    });

    return (
      <button
        key={stage.name}
        ref={setNodeRef}
        onClick={() => {
          if (propSelectedStage !== undefined) {
            // If using prop, notify parent
            onSelectedStageChange?.(stage.name);
          } else {
            // If using internal state, set it directly
            setSelectedStage(stage.name);
          }
        }}
        className={cn(
          "w-4 h-4 rounded-full border-2 transition-all duration-200 hover:scale-110",
          isActive && "scale-125",
          isOver && "ring-2 ring-offset-1"
        )}
        style={{
          backgroundColor: isActive ? stage.color : "transparent",
          borderColor: stage.color,
          ...(isOver && { ringColor: stage.color }),
        }}
        title={stage.name
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")}
      />
    );
  };

  // Stage dot indicator component
  const StageDotIndicator = () => {
    const currentStageIndex = stages.findIndex(
      (stage) => stage.name === currentSelectedStage
    );
    const currentStage = stages[currentStageIndex];

    const stageDisplayName = currentStage
      ? currentStage.name
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : "";

    return (
      <div className="flex flex-col items-center space-y-2 p-3 bg-gray-50 rounded-lg">
        {/* Stage name */}
        <div className="text-lg font-semibold text-gray-800">
          {stageDisplayName}
        </div>

        {/* Dot indicator */}
        <div className="flex items-center">
          {stages.map((stage, index) => {
            const isActive = index === currentStageIndex;

            return (
              <div key={stage.name} className="flex items-center">
                <StageDot stage={stage} isActive={isActive} />
                {/* Add dash after each dot except the last one */}
                {index < stages.length - 1 && (
                  <div className="w-6 h-0.5 bg-gray-300 mx-1"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Form count */}
        <div className="text-sm text-gray-600">
          {(formsByStage[currentSelectedStage] || []).length} forms
        </div>
      </div>
    );
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null); // Clear any previous errors
      setIsDialogOpen(true);
      event.target.value = "";
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !uploadFormName.trim() || !addUploadedFormToBackend) {
      console.error("Missing required data for upload");
      setIsDialogOpen(false);
      setSelectedFile(null);
      setUploadFormName("");
      setUploadError(null);
      return;
    }

    // Check for duplicate form names in allFormTypes
    if (allFormTypes && allFormTypes.length > 0) {
      const normalizedFormName = uploadFormName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
      const existingFormNames = allFormTypes.map((formType) =>
        formType.toLowerCase()
      );

      if (existingFormNames.includes(normalizedFormName)) {
        // Don't close the dialog, show error instead
        setUploadError(
          `A form with the name "${uploadFormName}" already exists. Please choose a different name.`
        );
        return;
      }
    }

    setIsDialogOpen(false);
    setUploadError(null);
    setIsAddingForm("upload");
    try {
      // Always upload to the currently selected stage, or first stage if none selected
      const targetStage =
        currentSelectedStage ||
        (stages.length > 0 ? stages[0].name : undefined);
      await addUploadedFormToBackend(
        selectedFile,
        uploadFormName.trim(),
        targetStage
      );
      // onRefresh is now handled by optimistic UI in parent component
      onRefresh?.();
    } catch (error) {
      console.error("Error uploading form:", error);
    } finally {
      setIsAddingForm(null);
      setSelectedFile(null);
      setUploadFormName("");
    }
  };

  const handleAddForm = async (formType: string) => {
    try {
      setIsAddingForm(formType);
      // Always add to the currently selected stage, or first stage if none selected
      const targetStage =
        currentSelectedStage ||
        (stages.length > 0 ? stages[0].name : undefined);
      await addFormToBackend(formType, targetStage);
      // onRefresh is now handled by optimistic UI in parent component
      onRefresh?.();
    } catch (error) {
      console.error("Error adding form:", error);
    } finally {
      setIsAddingForm(null);
    }
  };

  const currentStageForms = formsByStage[currentSelectedStage] || [];
  const currentStage = stages.find(
    (stage) => stage.name === currentSelectedStage
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="pr-2 py-2 space-y-2">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelected}
          accept="application/pdf,.pdf"
          className="hidden"
        />

        {/* Stage Dot Indicator */}
        {stages.length > 0 && <StageDotIndicator />}

        {/* Forms for Selected Stage */}
        {stages.length > 0 ? (
          <div
            className="space-y-2 p-3 rounded-lg"
            style={{
              backgroundColor: currentStage
                ? `${currentStage.color}08`
                : "transparent",
            }}
          >
            {currentStageForms.length > 0 ? (
              <SortableContext
                items={currentStageForms.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {currentStageForms.map((form) => (
                  <SortableFormItem
                    key={form.id}
                    form={form}
                    activeFormId={activeFormId}
                    handleFormClick={handleFormClick}
                    beautifyFormType={beautifyFormType}
                    onFormDeleted={onFormDeleted}
                  />
                ))}
              </SortableContext>
            ) : (
              <div
                className="py-8 px-4 text-center text-sm text-gray-500 border-2 border-dashed rounded-lg"
                style={{
                  borderColor: currentStage
                    ? `${currentStage.color}40`
                    : "#D1D5DB",
                  backgroundColor: currentStage
                    ? `${currentStage.color}08`
                    : "transparent",
                }}
              >
                <p>
                  No forms in{" "}
                  {currentSelectedStage
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </p>
                <p className="text-xs mt-1">Add forms using the button below</p>
              </div>
            )}
          </div>
        ) : (
          /* Fallback to original rendering if no stages */
          <SortableContext
            items={localForms.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {localForms.map((form) => (
              <SortableFormItem
                key={form.id}
                form={form}
                activeFormId={activeFormId}
                handleFormClick={handleFormClick}
                beautifyFormType={beautifyFormType}
                onFormDeleted={onFormDeleted}
              />
            ))}
          </SortableContext>
        )}

        {/* Dropdown for adding a new form */}
        {showAddButton && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-black hover:bg-gray-100"
                disabled={isAddingForm !== null}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {isAddingForm ? (
                  <div className="h-4 w-4 border-t-2 border-gray-900 rounded-full animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Add Form</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-full z-50 bg-white border border-gray-200 rounded-md shadow-lg"
              sideOffset={5}
              avoidCollisions={true}
              onCloseAutoFocus={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
              {availableForms.map((fType: string, idx: number) => (
                <DropdownMenuItem
                  key={idx}
                  className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-black min-h-fit"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddForm(fType);
                  }}
                  disabled={isAddingForm !== null}
                >
                  {isAddingForm === fType ? (
                    <div className="h-4 w-4 border-t-2 border-gray-900 rounded-full animate-spin flex-shrink-0 mt-0.5" />
                  ) : (
                    <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="whitespace-normal break-words leading-tight">
                    {beautifyFormType(fType)}
                  </span>
                </DropdownMenuItem>
              ))}

              <div className="border-t my-1" />

              <DropdownMenuItem
                className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-black min-h-fit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUploadClick();
                }}
                disabled={isAddingForm !== null}
              >
                {isAddingForm === "upload" ? (
                  <div className="h-4 w-4 border-t-2 border-gray-900 rounded-full animate-spin flex-shrink-0 mt-0.5" />
                ) : (
                  <Upload className="h-4 w-4 flex-shrink-0 mt-0.5" />
                )}
                <span className="whitespace-normal break-words leading-tight">
                  Upload Form
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Dialog for entering form name */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Name Your Form</DialogTitle>
              <DialogDescription>
                Please provide a name for the form you&apos;re uploading. It
                will be added to the{" "}
                {currentSelectedStage
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}{" "}
                stage.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="form-name" className="text-right">
                  Form Name
                </Label>
                <Input
                  id="form-name"
                  value={uploadFormName}
                  onChange={(e) => {
                    setUploadFormName(e.target.value);
                    setUploadError(null); // Clear error when user types
                  }}
                  className="col-span-3"
                  placeholder="e.g., 'Client Offer Letter'"
                />
              </div>
              {uploadError && (
                <div className="text-sm text-red-600 text-center">
                  {uploadError}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleUploadSubmit} disabled={!uploadFormName}>
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  );
}
