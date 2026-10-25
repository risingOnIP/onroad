'use client'

import React, { useState, useEffect } from "react";
import { CogIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mapping, MappingModalProps } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SchemaItem } from "@/components/files/types/realtor";

// Helper to find a field's display name from the list of available fields
const getFieldName = (
  uniqueId: string,
  fields: (SchemaItem | any)[]
): string => {
  if (!fields || fields.length === 0) return uniqueId;
  const field = fields.find((f) => f.unique_id === uniqueId);
  return field
    ? field.display_attributes?.display_name || field.display_name || uniqueId
    : uniqueId;
};

// Helper to get radio options from a field
const getRadioOptions = (field: SchemaItem): string[] => {
  if (!field || field.display_attributes?.input_type !== "radio") return [];
  
  return (
    field.display_attributes?.display_radio_options || 
    field.pdf_attributes?.[0]?.linked_form_fields_radio?.map((opt: any) => opt.displayName) ||
    []
  );
};

const getCheckboxOptions = (field: SchemaItem): { option: string, databaseStored: string }[] => {
  if (!field || field.display_attributes?.input_type !== "checkbox") return [];
  
  return (
    field.display_attributes?.checkbox_options?.options.map((opt: any) => ({
      option: opt.display_name,
      databaseStored: opt.databaseStored
    })) ||
    []
  );
};

export const MappingModal: React.FC<MappingModalProps> = ({
  isOpen,
  inputType,
  currentMappings = [],
  currentItem,
  availableFormTypes,
  availableFields,
  loadingFormTypes,
  loadingFields,
  onClose,
  onSave,
  onFormTypeChange,
}) => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [mappedFormType, setMappedFormType] = useState<string>("");
  const [mappedUniqueId, setMappedUniqueId] = useState<string>("");
  const [radioMappings, setRadioMappings] = useState<{ [option: string]: string }>({});
  const [checkboxMappings, setCheckboxMappings] = useState<{ [option: string]: string }>({});
  const [editingMappingIndex, setEditingMappingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMappings(currentMappings || []);
      // Reset selections completely when the modal is first opened
      setMappedFormType("");
      setMappedUniqueId("");
      setRadioMappings({});
      setCheckboxMappings({});
    }
  }, [isOpen, currentMappings]);

  const handleFormTypeChange = (value: string) => {
    setMappedFormType(value);
    // Reset subsequent selections
    setMappedUniqueId("");
    setRadioMappings({});
    setCheckboxMappings({});
    // Trigger data fetch in parent
    onFormTypeChange(value);
  };

  const handleFieldChange = (value: string) => {
    setMappedUniqueId(value);
    setRadioMappings({});
    setCheckboxMappings({});
  };

  const handleRadioMappingChange = (sourceOption: string, targetOption: string) => {
    setRadioMappings(prev => ({
      ...prev,
      [sourceOption]: targetOption
    }));
    setCheckboxMappings(prev => ({
      ...prev,
      [sourceOption]: targetOption
    }));
  };

  const handleAddMapping = () => {
    if (mappedFormType && mappedUniqueId) {
      const newMapping: Mapping = { 
        formType: mappedFormType, 
        uniqueId: mappedUniqueId 
      };

      // If both fields are radio type and we have radio mappings, include them
      const targetField = availableFields.find(f => f.unique_id === mappedUniqueId);
      const isTargetRadio = targetField?.display_attributes?.input_type === "radio";
      const isSourceRadio = inputType === "radio";
      const isTargetCheckbox = targetField?.display_attributes?.input_type === "checkbox";
      const isSourceCheckbox = inputType === "checkbox";

      if (isSourceRadio && isTargetRadio && Object.keys(radioMappings).length > 0) {
        newMapping.radio_mapping = Object.entries(radioMappings).map(([option, mappedRadioField]) => ({
          option,
          mappedRadioField
        }));
      }

      if (isSourceCheckbox && isTargetCheckbox && Object.keys(checkboxMappings).length > 0) {
        newMapping.checkbox_mapping = Object.entries(checkboxMappings).map(([option, mappedCheckboxField]) => ({
          option,
          mappedCheckboxField
        }));
      }

      // Add the new mapping, ensuring no duplicates
      if (
        !mappings.some(
          (m) =>
            m.formType === newMapping.formType &&
            m.uniqueId === newMapping.uniqueId
        )
      ) {
        setMappings((prev) => [...prev, newMapping]);
      }
      // Only reset the final selection, allowing for multiple mappings from the same form type
      setMappedUniqueId("");
      setRadioMappings({});
      setCheckboxMappings({});
    }
  };

  const handleRemoveMapping = (idx: number) => {
    setMappings((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleEditMapping = (idx: number) => {
    const mapping = mappings[idx];
    setEditingMappingIndex(idx);
    setMappedFormType(mapping.formType);
    setMappedUniqueId(mapping.uniqueId);
    
    // Set radio mappings if they exist
    if (mapping.radio_mapping) {
      const radioMap: { [option: string]: string } = {};
      mapping.radio_mapping.forEach(rm => {
        radioMap[rm.option] = rm.mappedRadioField;
      });
      setRadioMappings(radioMap);
      setCheckboxMappings({});
    } else {
      setRadioMappings({});
      setCheckboxMappings({});
      if (mapping.checkbox_mapping) {
        const checkboxMap: { [option: string]: string } = {};
        mapping.checkbox_mapping.forEach(cm => {
          checkboxMap[cm.option] = cm.mappedCheckboxField;
        });
        setCheckboxMappings(checkboxMap);
      } else {
        setCheckboxMappings({});
      }
    }
    
    // Load fields for the form type
    onFormTypeChange(mapping.formType);
  };

  const handleUpdateMapping = () => {
    if (editingMappingIndex !== null && mappedFormType && mappedUniqueId) {
      const newMapping: Mapping = { 
        formType: mappedFormType, 
        uniqueId: mappedUniqueId 
      };

      // If both fields are radio type and we have radio mappings, include them
      const targetField = availableFields.find(f => f.unique_id === mappedUniqueId);
      const isTargetRadio = targetField?.display_attributes?.input_type === "radio";
      const isSourceRadio = inputType === "radio";
      const isTargetCheckbox = targetField?.display_attributes?.input_type === "checkbox";
      const isSourceCheckbox = inputType === "checkbox";

      if (isSourceRadio && isTargetRadio && Object.keys(radioMappings).length > 0) {
        newMapping.radio_mapping = Object.entries(radioMappings).map(([option, mappedRadioField]) => ({
          option,
          mappedRadioField
        }));
      }

      if (isSourceCheckbox && isTargetCheckbox && Object.keys(checkboxMappings).length > 0) {
        newMapping.checkbox_mapping = Object.entries(checkboxMappings).map(([option, mappedCheckboxField]) => ({
          option,
          mappedCheckboxField
        }));
      }

      // Update the mapping at the editing index
      setMappings((prev) => {
        const updated = [...prev];
        updated[editingMappingIndex] = newMapping;
        return updated;
      });

      // Reset editing state
      setEditingMappingIndex(null);
      setMappedFormType("");
      setMappedUniqueId("");
      setRadioMappings({});
      setCheckboxMappings({});
    }
  };

  const handleCancelEdit = () => {
    setEditingMappingIndex(null);
    setMappedFormType("");
    setMappedUniqueId("");
    setRadioMappings({});
    setCheckboxMappings({});
  };

  const handleSave = async () => {
    await onSave(mappings);
    onClose();
  };

  const filteredFields =
    inputType && availableFields
      ? availableFields.filter(
          (f) =>
            inputType === "all" || f.display_attributes.input_type === inputType
        )
      : availableFields || [];

  // Get current source radio options
  const currentSourceRadioOptions = inputType === "radio" && currentItem 
    ? getRadioOptions(currentItem) 
    : [];

  // Get current source checkbox options
  const currentSourceCheckboxOptions = inputType === "checkbox" && currentItem 
    ? getCheckboxOptions(currentItem) 
    : [];

  // Get target field radio options
  const targetField = availableFields.find(f => f.unique_id === mappedUniqueId);
  const targetRadioOptions = targetField ? getRadioOptions(targetField) : [];

  // Get target field checkbox options
  const targetCheckboxOptions = targetField ? getCheckboxOptions(targetField) : [];

  // Check if we should show radio mapping UI
  const shouldShowRadioMapping = inputType === "radio" && 
    targetField?.display_attributes?.input_type === "radio" &&
    currentSourceRadioOptions.length > 0 && 
    targetRadioOptions.length > 0;

  const shouldShowCheckboxMapping = inputType === "checkbox" && 
    targetField?.display_attributes?.input_type === "checkbox" &&
    currentSourceCheckboxOptions.length > 0 && 
    targetCheckboxOptions.length > 0;

  const isAddMappingDisabled = !mappedFormType || 
    !mappedUniqueId || 
    loadingFields ||
    (shouldShowRadioMapping && Object.keys(radioMappings).length === 0) ||
    (shouldShowCheckboxMapping && Object.keys(checkboxMappings).length === 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <CogIcon className="w-6 h-6 text-indigo-600" />
            </div>
            Map to Form Fields
          </DialogTitle>
          <DialogDescription className="text-base text-slate-600 leading-relaxed">
            Create a link between this form item and fields in other forms. This
            allows data to be automatically populated.
            {inputType === "radio" && (
              <span className="font-medium text-blue-700">
                {" "}For radio fields, you can map individual options.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section for adding a new mapping */}
          <Card className="bg-gradient-to-r from-slate-50/80 to-gray-50/80 border-slate-200 shadow-sm">
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block font-semibold text-slate-800">
                    1. Select Form Type
                  </Label>
                  <Select
                    value={mappedFormType}
                    onValueChange={handleFormTypeChange}
                    disabled={loadingFormTypes}
                  >
                    <SelectTrigger className="bg-white border-slate-300 hover:border-indigo-400 focus:border-indigo-500 transition-colors">
                      <SelectValue
                        placeholder={
                          loadingFormTypes ? "Loading..." : "Select a form"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFormTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block font-semibold text-slate-800">
                    2. Select Field to Map
                  </Label>
                  <Select
                    value={mappedUniqueId}
                    onValueChange={handleFieldChange}
                    disabled={!mappedFormType || loadingFields}
                  >
                    <SelectTrigger className="bg-white border-slate-300 hover:border-indigo-400 focus:border-indigo-500 transition-colors disabled:opacity-70">
                      <SelectValue
                        placeholder={
                          !mappedFormType
                            ? "First, select a form type"
                            : loadingFields
                            ? "Loading fields..."
                            : "Select a field"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingFields ? (
                        <div className="flex items-center justify-center p-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : filteredFields.length > 0 ? (
                        filteredFields.map((field) => (
                          <SelectItem
                            key={field.unique_id}
                            value={field.unique_id}
                          >
                            {field.display_attributes?.display_name ||
                              field.display_name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-center text-sm text-slate-500">
                          {mappedFormType
                            ? "No available fields."
                            : "Select a form type to see fields."}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Radio Option Mapping Section */}
              {shouldShowRadioMapping && (
                <div className="mt-4 p-4 border rounded-lg bg-slate-50/50 border-slate-200">
                  <Label className="mb-3 block font-semibold text-slate-800">
                    3. Map Radio Options
                  </Label>
                  <div className="space-y-3">
                    {currentSourceRadioOptions.map((sourceOption) => (
                      <div key={sourceOption} className="flex items-center gap-6 p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex-1 max-w-xs">
                          <div className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 px-4 py-2 rounded-md font-medium border border-slate-300 shadow-sm text-center h-10 flex items-center justify-center">
                            {sourceOption}
                          </div>
                        </div>
                        <div className="flex items-center justify-center flex-shrink-0 w-12">
                          <div className="bg-slate-200 rounded-full p-2 w-8 h-8 flex items-center justify-center">
                            <span className="text-slate-600 font-bold text-lg">→</span>
                          </div>
                        </div>
                        <div className="flex-1 max-w-xs">
                          <Select
                            value={radioMappings[sourceOption] || ""}
                            onValueChange={(value) => handleRadioMappingChange(sourceOption, value)}
                          >
                            <SelectTrigger className="bg-white border-slate-300 hover:border-slate-400 focus:border-blue-500 transition-colors h-10">
                              <SelectValue placeholder="Select target option" />
                            </SelectTrigger>
                            <SelectContent>
                              {targetRadioOptions.map((targetOption) => (
                                <SelectItem key={targetOption} value={targetOption}>
                                  {targetOption}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                  {shouldShowRadioMapping && Object.keys(radioMappings).length === 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                        Map at least one radio option to proceed.
                      </p>
                    </div>
                  )}
                </div>
              )}

{shouldShowCheckboxMapping && (
                <div className="mt-4 p-4 border rounded-lg bg-slate-50/50 border-slate-200">
                  <Label className="mb-3 block font-semibold text-slate-800">
                    3. Map Checkbox Options
                  </Label>
                  <div className="space-y-3">
                    {currentSourceCheckboxOptions.map((sourceOption) => (
                      <div key={sourceOption.databaseStored} className="flex items-center gap-6 p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex-1 max-w-xs">
                          <div className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 px-4 py-2 rounded-md font-medium border border-slate-300 shadow-sm text-center h-10 flex items-center justify-center">
                            {sourceOption.option}
                          </div>
                        </div>
                        <div className="flex items-center justify-center flex-shrink-0 w-12">
                          <div className="bg-slate-200 rounded-full p-2 w-8 h-8 flex items-center justify-center">
                            <span className="text-slate-600 font-bold text-lg">→</span>
                          </div>
                        </div>
                        <div className="flex-1 max-w-xs">
                          <Select
                            value={checkboxMappings[sourceOption.databaseStored] || ""}
                            onValueChange={(value) => handleRadioMappingChange(sourceOption.databaseStored, value)}
                          >
                            <SelectTrigger className="bg-white border-slate-300 hover:border-slate-400 focus:border-blue-500 transition-colors h-10">
                              <SelectValue placeholder="Select target option" />
                            </SelectTrigger>
                            <SelectContent>
                              {targetCheckboxOptions.map((targetOption) => (
                                <SelectItem key={targetOption.databaseStored} value={targetOption.databaseStored}>
                                  {targetOption.option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                  {shouldShowCheckboxMapping && Object.keys(checkboxMappings).length === 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                        Map at least one checkbox option to proceed.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2 gap-2">
                {editingMappingIndex !== null ? (
                  <>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="px-4 py-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateMapping}
                      disabled={isAddMappingDisabled}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2"
                    >
                      <CogIcon className="w-4 h-4 mr-2" />
                      Update Mapping
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleAddMapping}
                    disabled={isAddMappingDisabled}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Mapping
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section for displaying current mappings */}
          {mappings.length > 0 && (
            <div>
              <Label className="mb-3 block text-lg font-semibold text-slate-800">
                Current Mappings
              </Label>
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                {mappings.map((m, idx) => (
                  <div
                    key={`${m.uniqueId}-${idx}`}
                    className={`rounded-lg p-3 transition-all duration-200 border ${
                      editingMappingIndex === idx 
                        ? 'bg-blue-50 border-blue-300 shadow-md' 
                        : 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-100 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 font-medium px-2 py-1">
                          {m.formType}
                        </Badge>
                        <div className="bg-slate-100 rounded-full p-1">
                          <span className="text-slate-600 font-bold text-sm">→</span>
                        </div>
                        <span className="font-semibold text-slate-800">
                          {getFieldName(m.uniqueId, availableFields)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-blue-500 hover:bg-blue-100 hover:text-blue-600 h-8 w-8 transition-colors duration-200"
                          onClick={() => handleEditMapping(idx)}
                          disabled={editingMappingIndex !== null}
                        >
                          <CogIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-100 hover:text-red-600 h-8 w-8 transition-colors duration-200"
                          onClick={() => handleRemoveMapping(idx)}
                          disabled={editingMappingIndex !== null}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Show radio mappings if they exist */}
                    {m.radio_mapping && m.radio_mapping.length > 0 && (
                      <div className="ml-4 mt-2 space-y-1">
                        <div className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          Radio Option Mappings:
                        </div>
                        <div className="grid gap-1">
                          {m.radio_mapping.map((radioMap, radioIdx) => (
                            <div key={radioIdx} className="flex items-center gap-2 text-sm bg-white p-2 rounded-md border border-slate-200">
                              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 font-medium text-xs px-2 py-1">
                                {radioMap.option}
                              </Badge>
                              <span className="text-slate-400 font-bold">→</span>
                              <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 font-medium text-xs px-2 py-1">
                                {radioMap.mappedRadioField}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 mt-6 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} className="px-4 py-2">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={mappings.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2"
          >
            Save Mappings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
