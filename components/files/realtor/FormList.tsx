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
import { useState, useEffect, useRef } from "react";
import { Form, TemplateForm } from "../types/realtor";

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
import { SortableFormItem } from "./SortableFormItem"; // Make sure the path is correct

interface FormListProps {
  handleFormClick: (formId: string) => void;
  activeFormId: string | null;
  forms: Form[] | TemplateForm[];
  availableForms: string[];
  addFormToBackend: (formType: string) => Promise<Form | TemplateForm>;
  updateFormOrderInBackend: (
    updates: { id: string; order: number; form_stage?: string }[]
  ) => Promise<void>;
  onFormDeleted: (formId: string) => void;
  addUploadedFormToBackend?: (
    uploadedForm: File,
    formName: string
  ) => Promise<Form | TemplateForm>;
  onRefresh?: () => void;
  allFormTypes?: string[];
}

export default function FormList({
  handleFormClick,
  availableForms,
  addFormToBackend,
  updateFormOrderInBackend,
  addUploadedFormToBackend,
  forms,
  onRefresh,
  activeFormId,
  allFormTypes,
  onFormDeleted,
}: FormListProps) {
  // `forms` is always either `Form[]` OR `TemplateForm[]` (never mixed).
  // Keep that information at the type level so callers can rely on the
  // narrower type once the component has inspected the data.
  const [localForms, setLocalForms] = useState<Form[] | TemplateForm[]>([]);
  const [isAddingForm, setIsAddingForm] = useState<string | null>(null);

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
    // Sorting causes TypeScript to widen the array to `(Form | TemplateForm)[]`.
    // We know at runtime that the array is still homogeneous, so cast back to
    // the union-of-arrays type expected by `localForms`.
    const sortedForms = [...forms].sort((a, b) => a.order - b.order) as
      | Form[]
      | TemplateForm[];
    setLocalForms(sortedForms);
  }, [forms]);

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

    if (!over || active.id === over.id) return;

    // Simple reordering without stages
    const homogeneous = localForms as (Form | TemplateForm)[];

    const oldIndex = homogeneous.findIndex((f) => f.id === active.id);
    const newIndex = homogeneous.findIndex((f) => f.id === over.id);

    const reorderedForms = arrayMove(homogeneous, oldIndex, newIndex) as
      | Form[]
      | TemplateForm[];

    setLocalForms(reorderedForms);

    // Prepare data for Supabase update
    const updates = reorderedForms.map((form, index) => ({
      id: form.id,
      order: index,
    }));

    try {
      await updateFormOrderInBackend(updates);
    } catch (error) {
      console.error("Failed to update form order:", error);
      setLocalForms(
        [...forms].sort((a, b) => a.order - b.order) as Form[] | TemplateForm[]
      );
    }
  }

  // This function is called when the user clicks the "Upload Form" menu item.
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // This function is triggered when the user selects a file from the file picker.
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null); // Clear any previous errors
      setIsDialogOpen(true);
      event.target.value = ""; // Reset file input
    }
  };

  // This function handles the submission from the dialog.
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
      await addUploadedFormToBackend(selectedFile, uploadFormName.trim());
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
      await addFormToBackend(formType);
      // onRefresh is now handled by optimistic UI in parent component
      onRefresh?.();
    } catch (error) {
      console.error("Error adding form:", error);
    } finally {
      setIsAddingForm(null);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className=" pr-2 py-2 space-y-2">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelected}
          accept="application/pdf,.pdf"
          className="hidden"
        />

        {/* Render all forms in a simple flat list */}
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

        {/* Dropdown for adding a new form */}
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

        {/* Dialog for entering form name */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Name Your Form</DialogTitle>
              <DialogDescription>
                Please provide a name for the form you&apos;re uploading. Click
                upload when you&apos;re done.
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
