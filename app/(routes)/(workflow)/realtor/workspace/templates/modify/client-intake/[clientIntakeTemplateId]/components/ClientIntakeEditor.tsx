"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ClientIntakeEditorProps,
  EditingItem,
  Mapping,
  VisibilityCondition,
} from "../types";
import { PartyIntakeSchemaItem } from "@/components/files/types/realtor";
import { SaveHeader } from "./SaveHeader";
import { FormElementsSidebar } from "./FormElementsSidebar";
import { FormCanvas } from "./FormCanvas";
import { MappingModal } from "./MappingModal";
import { VisibilityModal } from "./VisibilityModal";

export const ClientIntakeEditor: React.FC<ClientIntakeEditorProps> = ({
  title,
  onLoadItems,
  onSaveItems,
  onGetAvailableFormTypes,
  onGetSchemaByFormType,
  onAddItem,
  onRemoveItem,
  onUnsavedChanges,
  autoSave = true,
  autoSaveInterval = 10000,
  disabled = false,
  disabledMessage = "This form is read-only",
}) => {
  const [schemaItems, setSchemaItems] = useState<PartyIntakeSchemaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  const [mappingModal, setMappingModal] = useState<{
    isOpen: boolean;
    itemId: string;
  } | null>(null);
  const [visibilityModal, setVisibilityModal] = useState<{
    isOpen: boolean;
    itemId: string;
  } | null>(null);

  const [availableFormTypes, setAvailableFormTypes] = useState<string[]>([]);
  const [availableMappedSchemaItems, setAvailableMappedSchemaItems] = useState<
    any[]
  >([]);
  const [loadingFormTypes, _] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);



  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      try {
        const items = await onLoadItems();
        setSchemaItems(items);
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        onUnsavedChanges?.(false);
        const types = await onGetAvailableFormTypes();
        setAvailableFormTypes(types);
      } catch (err) {
        console.error("Failed to load items", err);
        setError("Failed to load items. Starting with default block.");
        setSchemaItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, []);

  useEffect(() => {
    if (!hasUnsavedChanges || !autoSave) return;

    const autoSaveTimer = setTimeout(() => {
      handleSaveForm();
    }, autoSaveInterval);

    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, autoSave, autoSaveInterval]);

  const handleSaveForm = async () => {
    if (!hasUnsavedChanges || disabled) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSaveItems(schemaItems);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      onUnsavedChanges?.(false);
    } catch (err) {
      console.error("Failed to save items", err);
      setError("Failed to save items. Please try again.");
      setHasUnsavedChanges(true);
      setLastSaved(null);
    } finally {
      setIsSaving(false);
    }
  };

  const addBlock = () => {
    const blockName = `Section ${getUniqueBlockNames().length + 1}`;
    // Create a placeholder item to establish the block
    const newItem: PartyIntakeSchemaItem = {
      unique_id: `placeholder_${Date.now()}`,
      mapping: [
        {
          formType: "text",
          uniqueId: "Placeholder Item",
        },
      ],
      display_attributes: {
        display_name: "Placeholder Item",
        input_type: "text",
        value: { type: "manual" },
        order: 1,
        block: blockName,
      },
    };
    setSchemaItems((prevItems) => [...prevItems, newItem]);
    setHasUnsavedChanges(true);
    setError(null);
    onUnsavedChanges?.(true);
  };

  const getUniqueBlockNames = (): string[] => {
    const blockNames = new Set(
      schemaItems.map(
        (item) => item.display_attributes.block || "Default Section"
      )
    );
    return Array.from(blockNames);
  };

  const addItem = async (type: string, targetBlock?: string) => {
    const blockName = targetBlock || "Default Section";
    const existingItemsInBlock = schemaItems.filter(
      (item) =>
        (item.display_attributes.block || "Default Section") === blockName
    );
    const nextOrder =
      existingItemsInBlock.length > 0
        ? Math.max(
            ...existingItemsInBlock.map((item) => item.display_attributes.order)
          ) + 1
        : 1;

    // Ensure type is one of the allowed input types
    const inputType = type as "text" | "radio" | "checkbox" | "fileUpload";
    if (!["text", "radio", "checkbox", "fileUpload"].includes(inputType)) {
      console.error(`Invalid input type: ${type}`);
      return;
    }

    const newItem: PartyIntakeSchemaItem = {
      unique_id: `item_${Date.now()}`,
      mapping: [],
      display_attributes: {
        display_name: `${
          inputType.charAt(0).toUpperCase() + inputType.slice(1)
        } Field`,
        input_type: inputType,
        value: { type: "manual" },
        order: nextOrder,
        block: blockName,
        ...(inputType === "radio" && {
          display_radio_options: ["Option 1", "Option 2"],
        }),
        ...(inputType === "checkbox" && {
          checkbox_options: {
            options: [
              {
                display_name: "Option 1",
                databaseStored: "Option 1",
              },
              {
                display_name: "Option 2",
                databaseStored: "Option 2",
              },
            ],
          },
        }),
      },
    };

    setSchemaItems((prevItems) => [...prevItems, newItem]);
    setHasUnsavedChanges(true);
    setError(null);
    onUnsavedChanges?.(true);

    // Call optional callback for adding item to backend
    if (onAddItem) {
      try {
        await onAddItem(newItem);
      } catch (err) {
        console.error("Failed to save new item to backend", err);
        setError(
          "Failed to save new item to backend. The item was added locally but may not persist."
        );
      }
    }
  };

  const removeItem = async (itemId: string) => {
    setSchemaItems((prevItems) =>
      prevItems.filter((item) => item.unique_id !== itemId)
    );
    setHasUnsavedChanges(true);
    setError(null);
    onUnsavedChanges?.(true);

    // Call optional callback for removing item from backend
    if (onRemoveItem) {
      try {
        await onRemoveItem(itemId);
      } catch (err) {
        console.error("Failed to remove item from backend", err);
        setError("Failed to remove item from backend.");
      }
    }
  };

  const updateItemLabel = async (itemId: string, newLabel: string) => {
    setSchemaItems((prevItems) =>
      prevItems.map((item) =>
        item.unique_id === itemId
          ? {
              ...item,
              display_attributes: {
                ...item.display_attributes,
                display_name: newLabel,
              },
            }
          : item
      )
    );
    setHasUnsavedChanges(true);
    setError(null);
    onUnsavedChanges?.(true);
  };

  const updateBlockName = async (
    oldBlockName: string,
    newBlockName: string
  ) => {
    setSchemaItems((prevItems) =>
      prevItems.map((item) =>
        (item.display_attributes.block || "Default Section") === oldBlockName
          ? {
              ...item,
              display_attributes: {
                ...item.display_attributes,
                block: newBlockName,
              },
            }
          : item
      )
    );
    setHasUnsavedChanges(true);
    setError(null);
    onUnsavedChanges?.(true);
  };

  const updateItemOptions = (itemId: string, newOptions: string[]) => {
    
    setSchemaItems((prevItems) =>
      prevItems.map((item) =>
        item.unique_id === itemId
          ? {
              ...item,
              display_attributes: {
                ...item.display_attributes,
                ...(item.display_attributes.input_type === "radio" && {
                  display_radio_options: newOptions,
                }),
                ...(item.display_attributes.input_type === "checkbox" && {
                  checkbox_options: {
                    options: newOptions.map((option) => ({
                      display_name: option,
                      databaseStored: option,
                    })),
                  },
                }),
              },
            }
          : item
      )
    );
    setHasUnsavedChanges(true);
    setError(null);
    onUnsavedChanges?.(true);
  };

  const updateItemMapping = async (itemId: string, mappings: Mapping[]) => {
    setSchemaItems((prevItems) =>
      prevItems.map((item) =>
        item.unique_id === itemId
          ? {
              ...item,
              mapping: mappings,
            }
          : item
      )
    );
    setHasUnsavedChanges(true);
    setError(null);
    onUnsavedChanges?.(true);
  };

  const updateConditionalVisibility = (
    itemId: string,
    conditions: VisibilityCondition[]
  ) => {
    setSchemaItems((prevItems) =>
      prevItems.map((item) =>
        item.unique_id === itemId
          ? {
              ...item,
              display_attributes: {
                ...item.display_attributes,
                visibleIf: conditions.map((cond) => ({
                  unique_id: cond.dependsOnField,
                  operation: cond.operator as
                    | ">"
                    | ">="
                    | "<"
                    | "<="
                    | "=="
                    | "!==",
                  valueChecked: cond.value,
                })),
              },
            }
          : item
      )
    );
    setHasUnsavedChanges(true);
    setError(null);
    onUnsavedChanges?.(true);
  };

  const startEditing = (
    id: string,
    type: "item" | "block" | "placeholder" | "option",
    currentValue: string,
    blockName?: string,
    optionIndex?: number
  ) => {
    setEditingItem({ id, type, blockName, optionIndex });
    setEditingValue(currentValue || "");
  };

  const saveEdit = async () => {
    if (!editingItem) return;

    if (editingItem.type === "block") {
      await updateBlockName(editingItem.id, editingValue);
    } else if (editingItem.type === "placeholder") {
      updateItemPlaceholder(editingItem.id, editingValue);
    } else if (
      editingItem.type === "option" &&
      editingItem.optionIndex !== undefined
    ) {
      const item = findItem(editingItem.id);
      if (item && item.display_attributes.display_radio_options) {
        const newOptions = [...item.display_attributes.display_radio_options];
        newOptions[editingItem.optionIndex] = editingValue;
        updateItemOptions(editingItem.id, newOptions);
      } else if (item && item.display_attributes.checkbox_options) {
        const newOptions =
        item.display_attributes.checkbox_options.options.map((opt, index) =>
          index === editingItem.optionIndex
            ? { display_name: editingValue, databaseStored: editingValue }
            : opt
        );
        updateItemOptions(editingItem.id, newOptions.map((opt) => opt?.display_name || ""));
      }
    } else {
      await updateItemLabel(editingItem.id, editingValue);
    }

    setEditingItem(null);
    setEditingValue("");
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditingValue("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const getAvailableItems = () => {
    return schemaItems.map((item) => ({
      id: item.unique_id,
      label:
        item.display_attributes.display_name ||
        item.display_attributes.input_type,
      type: item.display_attributes.input_type,
    }));
  };

  const findItem = (itemId: string): PartyIntakeSchemaItem | null => {
    return schemaItems.find((item) => item.unique_id === itemId) || null;
  };

  const getCurrentMapping = (itemId: string): Mapping[] => {
    const item = findItem(itemId);
    return item?.mapping || [];
  };

  const getCurrentVisibility = (itemId: string): VisibilityCondition[] => {
    const item = findItem(itemId);
    const raw = (item?.display_attributes as any)?.visibleIf || [];
    if (!Array.isArray(raw)) return [];
    return raw.map((cond: any) => ({
      dependsOnField: cond.unique_id || cond.dependsOnField,
      operator: cond.operation || cond.operator,
      value: cond.valueChecked || cond.value,
    }));
  };

  const handleFormTypeChange = async (formType: string) => {
    if (!formType) {
      setAvailableMappedSchemaItems([]);
      return;
    }

    setLoadingFields(true);
    try {
      // Assuming onGetSchemaByFormType returns SchemaItem[]
      const schema = await onGetSchemaByFormType(formType);
      setAvailableMappedSchemaItems(schema);
    } catch (err) {
      console.error("Error fetching fields", err);
      setAvailableMappedSchemaItems([]);
    } finally {
      setLoadingFields(false);
    }
  };


  // Add handler for updating placeholder
  const updateItemPlaceholder = (itemId: string, placeholder: string) => {
    setSchemaItems((prevItems) =>
      prevItems.map((item) =>
        item.unique_id === itemId
          ? {
              ...item,
              display_attributes: {
                ...item.display_attributes,
                placeholder: placeholder,
              },
            }
          : item
      )
    );
    setHasUnsavedChanges(true);
    setError(null);
    onUnsavedChanges?.(true);
  };

  // Add handler for updating required status
  const updateItemRequired = (itemId: string, isRequired: boolean) => {
    setSchemaItems((prevItems) =>
      prevItems.map((item) =>
        item.unique_id === itemId
          ? {
              ...item,
              display_attributes: {
                ...item.display_attributes,
                isRequired: isRequired,
              },
            }
          : item
      )
    );
    setHasUnsavedChanges(true);
    setError(null);
    onUnsavedChanges?.(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <SaveHeader
          title={title}
          isSaving={isSaving}
          lastSaved={lastSaved}
          hasUnsavedChanges={hasUnsavedChanges}
          error={error}
          onSave={handleSaveForm}
        />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-muted-foreground">Loading form...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <SaveHeader
        title={title}
        isSaving={isSaving}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
        error={error}
        onSave={handleSaveForm}
        disabled={disabled}
      />

      {/* Disabled warning banner */}
      {disabled && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <p className="text-sm text-yellow-800 flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            {disabledMessage}
          </p>
        </div>
      )}

      <div className="flex-1 p-6">
        <Card className="w-full max-w-7xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              Build Your Forms
            </CardTitle>
            <CardDescription className="text-gray-600">
              Drag and drop form elements to create or edit your form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-3">
                <FormElementsSidebar />
              </div>

              <div className="col-span-9">
                <FormCanvas
                  schemaItems={schemaItems}
                  onAddItem={disabled ? async () => {} : addItem}
                  onRemoveItem={disabled ? async () => {} : removeItem}
                  onAddBlock={addBlock}
                  onUpdateItemLabel={updateItemLabel}
                  onUpdateItemOptions={updateItemOptions}
                  onUpdateItemPlaceholder={updateItemPlaceholder}
                  onUpdateItemRequired={updateItemRequired}
                  onUpdateItemMapping={updateItemMapping}
                  onUpdateConditionalVisibility={updateConditionalVisibility}
                  editingItem={editingItem}
                  editingValue={editingValue}
                  onStartEditing={startEditing}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onEditKeyDown={handleEditKeyDown}
                  onOpenMappingModal={(itemId) =>
                    setMappingModal({ isOpen: true, itemId })
                  }
                  onOpenVisibilityModal={(itemId) =>
                    setVisibilityModal({ isOpen: true, itemId })
                  }
                />
              </div>
            </div>

            {mappingModal && (
              <MappingModal
                isOpen={mappingModal.isOpen}
                itemId={mappingModal.itemId}
                inputType={
                  findItem(mappingModal.itemId)?.display_attributes
                    .input_type || "text"
                }
                currentMappings={getCurrentMapping(mappingModal.itemId)}
                currentItem={findItem(mappingModal.itemId)}
                availableFormTypes={availableFormTypes}
                availableFields={availableMappedSchemaItems}
                loadingFormTypes={loadingFormTypes}
                loadingFields={loadingFields}
                onClose={() => setMappingModal(null)}
                onSave={(mappings) =>
                  updateItemMapping(mappingModal.itemId, mappings)
                }
                onFormTypeChange={handleFormTypeChange}
              />
            )}

            {visibilityModal && (
              <VisibilityModal
                isOpen={visibilityModal.isOpen}
                itemId={visibilityModal.itemId}
                currentVisibility={getCurrentVisibility(visibilityModal.itemId)}
                availableItems={getAvailableItems().filter(
                  (item) => item.id !== visibilityModal.itemId
                )}
                onClose={() => setVisibilityModal(null)}
                onSave={(conditions) =>
                  updateConditionalVisibility(
                    visibilityModal.itemId,
                    conditions
                  )
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
