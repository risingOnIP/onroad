import React, { useCallback, useState, useEffect, useRef } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import clsx from "clsx";
import { SchemaItem } from "../../types/realtor";
import FieldRenderer from "./FieldRenderer";
import { useFieldStore } from "../stores/fieldStore";

// Tailwind classes that need to be statically included for grid system
// grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 grid-cols-6
// grid-cols-7 grid-cols-8 grid-cols-9 grid-cols-10 grid-cols-11 grid-cols-12

interface CheckboxFieldProps {
  schema: SchemaItem;
  value: string[] | string;
  onChange: (value: string[] | string) => void;
  onBlur: (value: string[] | string) => void;
  disabled?: boolean;
  shouldDisableForClientIntake?: boolean;
  formResponses?: Record<string, any>;
  onLinkedFieldChange?: (fieldId: string, value: string) => void;
  onLinkedFieldBlur?: (fieldId: string, value: string) => void;
  allSchemaItems?: SchemaItem[]; // For finding linked field schema
}

const CheckboxField = React.memo<CheckboxFieldProps>(
  ({
    schema,
    value,
    onChange,
    onBlur, // Keep in interface for compatibility but not used internally
    disabled = false,
    shouldDisableForClientIntake = false,
    formResponses = {},
    onLinkedFieldChange,
    onLinkedFieldBlur,
    allSchemaItems = [],
  }) => {
    const { checkbox_options, special_input } = schema.display_attributes;

    // Move hook calls to top level - get store state for reactivity
    const fieldStore = useFieldStore();

    // Local state for instant UI updates
    const [localSelections, setLocalSelections] = useState<string[]>(() => {
      return Array.isArray(value) ? value : [];
    });

    // Debounce timer ref
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync with prop value only on mount and when prop changes from external source
    useEffect(() => {
      const newSelections = Array.isArray(value) ? value : [];
      setLocalSelections(newSelections);
    }, [value]);

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
      };
    }, []);

    if (!checkbox_options?.options) {
      return null;
    }

    const {
      options,
      maxSelected: rawMaxSelected,
      minSelected,
    } = checkbox_options;
    const asRadio = special_input?.checkbox?.asRadio || false;
    const horizontalColumns = special_input?.checkbox?.horizontal;
    const maxSelected = asRadio ? 1 : rawMaxSelected;
    const isRadioMode = maxSelected === 1 || asRadio;

    const handleOptionChange = useCallback(
      (optionValue: string, checked: boolean) => {
        let newSelections: string[];

        if (isRadioMode) {
          // Radio mode: clicking any option automatically selects it (and deselects others)
          // No need to check the 'checked' parameter - just select the clicked option
          newSelections = [optionValue];
        } else {
          // Checkbox mode: multiple selections
          if (checked) {
            // Don't add if max limit reached
            if (maxSelected && localSelections.length >= maxSelected) {
              return;
            }
            newSelections = [...localSelections, optionValue];
          } else {
            newSelections = localSelections.filter((s) => s !== optionValue);
          }
        }

        // Validate min/max constraints
        if (
          minSelected &&
          newSelections.length < minSelected &&
          newSelections.length < localSelections.length
        ) {
          return; // Don't allow reducing below minimum
        }

        // Update local state INSTANTLY for immediate UI feedback
        setLocalSelections(newSelections);
        
        // Clear any existing save timer
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
        
        // Set a new timer to save after 2 seconds of no activity
        saveTimerRef.current = setTimeout(() => {
          onChange(newSelections);
          saveTimerRef.current = null;
        }, 1000); // Wait 2 seconds after last click before saving
      },
      [localSelections, maxSelected, minSelected, isRadioMode, onChange]
    );


    // Calculate selection limits
    const canSelectMore =
      !maxSelected || localSelections.length < maxSelected;

    // Grid layout for horizontal display
    const getContainerClass = () => {
      if (!horizontalColumns) return "space-y-3";
      const cols = Math.min(Math.max(1, horizontalColumns), 12);
      switch (cols) {
        case 1:
          return "grid grid-cols-1 gap-3";
        case 2:
          return "grid grid-cols-2 gap-3";
        case 3:
          return "grid grid-cols-3 gap-3";
        case 4:
          return "grid grid-cols-4 gap-3";
        case 5:
          return "grid grid-cols-5 gap-3";
        case 6:
          return "grid grid-cols-6 gap-3";
        case 7:
          return "grid grid-cols-7 gap-3";
        case 8:
          return "grid grid-cols-8 gap-3";
        case 9:
          return "grid grid-cols-9 gap-3";
        case 10:
          return "grid grid-cols-10 gap-3";
        case 11:
          return "grid grid-cols-11 gap-3";
        case 12:
          return "grid grid-cols-12 gap-3";
        default:
          return "space-y-3";
      }
    };
    
    // Toggle collapsed state for a specific option

    return (
      <div className={getContainerClass()}>
        {options.map((option) => {
          const optionValue = option?.databaseStored;
          const isChecked = localSelections.includes(optionValue);
          const canSelect = !isChecked && canSelectMore;
          // In radio mode, allow clicking any option. In checkbox mode, respect canSelect
          const isClickDisabled =
            disabled ||
            shouldDisableForClientIntake ||
            (!isRadioMode && !isChecked && !canSelect);
          // Visual disabled state - gray out unselected options when one is selected in radio mode
          const isVisuallyDisabled =
            disabled ||
            shouldDisableForClientIntake ||
            (!isChecked && !canSelect);
          const hasLinkedFields =
            option?.linkedFields && option?.linkedFields.length > 0;
          const showLinkedFields = isChecked && hasLinkedFields;

          
          if(optionValue) {
          return (
            <div 
              key={optionValue} 
              className={clsx(
                "space-y-2",
                // Make container stretch to full height in horizontal layouts
                horizontalColumns && horizontalColumns > 1 && "h-full flex flex-col"
              )}
            >
              <div
                onClick={() =>
                  !isClickDisabled &&
                  handleOptionChange(optionValue, !isChecked)
                }
                className={clsx(
                  "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all select-none",
                  "hover:bg-gray-50",
                  isChecked
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white",
                  isVisuallyDisabled &&
                    "opacity-50 cursor-not-allowed hover:bg-white",
                  shouldDisableForClientIntake &&
                    isChecked &&
                    "border-blue-300 bg-blue-100",
                  // Add full height when using horizontal columns > 1
                  horizontalColumns && horizontalColumns > 1 && "h-full"
                )}
                role={isRadioMode ? "radio" : "checkbox"}
                aria-checked={isChecked}
                aria-disabled={isClickDisabled}
                tabIndex={isClickDisabled ? -1 : 0}
              >
                <div
                  className={clsx(
                    "flex items-center justify-center transition-all",
                    isRadioMode ? "w-5 h-5 rounded-full" : "w-5 h-5 rounded",
                    isChecked
                      ? shouldDisableForClientIntake
                        ? "bg-blue-400 border-blue-400"
                        : "bg-blue-500 border-blue-500"
                      : "bg-white border-2 border-gray-300"
                  )}
                >
                  {isChecked && !isRadioMode && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                  {isChecked && isRadioMode && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span
                  className={clsx(
                    "text-sm font-medium",
                    isChecked
                      ? shouldDisableForClientIntake
                        ? "text-blue-700"
                        : "text-blue-900"
                      : "text-gray-700"
                  )}
                >
                  {option?.display_name}
                </span>
              </div>

              {/* Render linked fields if option is checked */}
              {showLinkedFields && option.linkedFields && (
                <div className="ml-8 mt-2 animate-in slide-in-from-top-2 fade-in-50 duration-200">
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-200 shadow-sm">
                    <div className="space-y-4">
                      {/* Group linked fields into rows based on width */}
                      {(() => {
                      const linkedRows: SchemaItem[][] = [];
                      let currentRow: SchemaItem[] = [];
                      let currentRowWidth = 0;

                      option?.linkedFields.forEach((linkedFieldId) => {
                        const linkedSchema = allSchemaItems.find(
                          (item) => item.unique_id === linkedFieldId
                        );
                        if (!linkedSchema) return;

                        const itemWidth = linkedSchema.display_attributes.width || 12;
                        const breakBefore = linkedSchema.display_attributes.breakBefore || false;

                        // Start new row if breakBefore is true or width exceeds 12
                        if (breakBefore || currentRowWidth + itemWidth > 12) {
                          if (currentRow.length > 0) {
                            linkedRows.push(currentRow);
                          }
                          currentRow = [linkedSchema];
                          currentRowWidth = itemWidth;
                        } else {
                          currentRow.push(linkedSchema);
                          currentRowWidth += itemWidth;
                        }
                      });

                      if (currentRow.length > 0) {
                        linkedRows.push(currentRow);
                      }

                      return linkedRows.map((row, rowIndex) => (
                        <div key={rowIndex} className="grid grid-cols-12 gap-4">
                          {row.map((linkedSchema) => {
                            const linkedFieldId = linkedSchema.unique_id;
                            const itemWidth = linkedSchema.display_attributes.width || 12;

                            // Use the functions/data from the hooks called at top level
                            const linkedFieldStatus =
                              fieldStore.getFieldStatus(linkedFieldId);
                            const linkedFieldError =
                              fieldStore.fieldErrors.get(linkedFieldId);

                            const renderLinkedStatusIcon = () => {
                              switch (linkedFieldStatus) {
                                case "saving":
                                  return (
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                  );
                                case "saved":
                                  return <Check className="h-4 w-4 text-green-500" />;
                                case "error":
                                  return (
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                  );
                                default:
                                  return null;
                              }
                            };

                            // Use static classes for Tailwind to detect them
                            const getColSpanClass = (width: number) => {
                              switch (width) {
                                case 1: return "col-span-1";
                                case 2: return "col-span-2";
                                case 3: return "col-span-3";
                                case 4: return "col-span-4";
                                case 5: return "col-span-5";
                                case 6: return "col-span-6";
                                case 7: return "col-span-7";
                                case 8: return "col-span-8";
                                case 9: return "col-span-9";
                                case 10: return "col-span-10";
                                case 11: return "col-span-11";
                                default: return "col-span-12";
                              }
                            };

                            return (
                              <div key={linkedFieldId} className={getColSpanClass(itemWidth)}>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label
                                      className={clsx(
                                        "text-sm font-medium",
                                        linkedFieldError
                                          ? "text-red-700"
                                          : "text-gray-700"
                                      )}
                                    >
                                      {linkedSchema.display_attributes.display_name}
                                      {linkedSchema.display_attributes.isRequired && (
                                        <span className="text-red-500 ml-1">*</span>
                                      )}
                                    </label>
                                    {renderLinkedStatusIcon()}
                                  </div>
                                  {linkedSchema.display_attributes.description && (
                                    <p className="text-xs text-gray-500 mb-1">
                                      {linkedSchema.display_attributes.description}
                                    </p>
                                  )}
                                  <FieldRenderer
                                    schemaItem={linkedSchema}
                                    value={formResponses[linkedFieldId] || ""}
                                    onChange={(value) =>
                                      onLinkedFieldChange?.(linkedFieldId, value)
                                    }
                                    onBlur={(value) =>
                                      onLinkedFieldBlur?.(linkedFieldId, value)
                                    }
                                    disabled={disabled || shouldDisableForClientIntake}
                                    shouldDisableForClientIntake={
                                      shouldDisableForClientIntake
                                    }
                                    formResponses={formResponses}
                                    onLinkedFieldChange={onLinkedFieldChange}
                                    onLinkedFieldBlur={onLinkedFieldBlur}
                                    allSchemaItems={allSchemaItems}
                                  />
                                  {linkedFieldError && (
                                    <p className="text-sm text-red-600">
                                      {linkedFieldError}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ));
                    })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }
      })}

        {/* Selection limits info */}
        {(minSelected || maxSelected) && (
          <div className="text-xs text-gray-500 mt-2">
            {minSelected && maxSelected
              ? `Select ${minSelected} to ${maxSelected} options`
              : minSelected
              ? `Select at least ${minSelected} option${
                  minSelected > 1 ? "s" : ""
                }`
              : maxSelected
              ? `Select up to ${maxSelected} option${
                  maxSelected > 1 ? "s" : ""
                }`
              : null}
          </div>
        )}
      </div>
    );
  }
);

CheckboxField.displayName = "CheckboxField";

export default CheckboxField;
