'use client'
import React from "react";
import { TrashIcon, CogIcon, EyeIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ItemRendererProps } from "../types";

export const ItemRenderer: React.FC<ItemRendererProps> = ({
  item,
  editingItem,
  editingValue,
  onStartEditing,
  onSaveEdit,
  onEditKeyDown,
  onRemoveItem,
  onUpdateItemOptions,
  onUpdateItemPlaceholder,
  onUpdateItemRequired,
  onOpenMappingModal,
  onOpenVisibilityModal,
}) => {
  const isEditingLabel = editingItem?.id === item.unique_id && editingItem?.type === "item";
  const isEditingPlaceholder = editingItem?.id === item.unique_id && editingItem?.type === "placeholder";

  const handleRemove = async () => {
    await onRemoveItem(item.unique_id);
  };

  const handleOptionsChange = (options: string[]) => {
    onUpdateItemOptions(item.unique_id, options);
  };

  const handlePlaceholderSave = () => {
    onUpdateItemPlaceholder(item.unique_id, editingValue);
    onSaveEdit();
  };

  const isEditingOption = (index: number) => {
    return editingItem?.id === item.unique_id && 
           editingItem?.type === "option" && 
           editingItem?.optionIndex === index;
  };

  const handleOptionEdit = (index: number, newValue: string) => {
    if (item.display_attributes.input_type === "radio") {
      const options = item.display_attributes.display_radio_options ||
  [];
      const newOptions = [...options];
      newOptions[index] = newValue;
      handleOptionsChange(newOptions);
    } else if (item.display_attributes.input_type === "checkbox") {
      const options = item.display_attributes.checkbox_options?.options
   || [];
      const newOptions = options.map((opt, i) =>
        i === index
          ? { display_name: newValue, databaseStored: newValue }
          : opt
      );
      handleOptionsChange(newOptions.map(opt => opt?.display_name || ""));
    }
  };

  const handleAddOption = () => {

    if (item.display_attributes.input_type === "radio") {
      const options = item.display_attributes.display_radio_options || [];
      const newOptions = [...options, `Option ${options.length + 1}`];
      handleOptionsChange(newOptions);
    } else if (item.display_attributes.input_type === "checkbox") {
      const options = item.display_attributes.checkbox_options?.options || [];
      const newOptionName = `Option ${options.length + 1}`;
      const newOptions = [...options.map(opt => opt.display_name), newOptionName];
      handleOptionsChange(newOptions);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (item.display_attributes.input_type === "radio") {
      const options = item.display_attributes.display_radio_options ||
  [];
      if (options.length <= 2) return;
      const newOptions = options.filter((_, i) => i !== index);
      handleOptionsChange(newOptions);
    } else if (item.display_attributes.input_type === "checkbox") {
      const options = item.display_attributes.checkbox_options?.options
   || [];
      if (options.length <= 2) return;
      const newOptions = options.filter((_, i) => i !== index).map((opt) => opt?.display_name || "");
      handleOptionsChange(newOptions);
    }
  };

  const renderOptions = () => {
    if (item.display_attributes.input_type === "radio") {
      const options = item.display_attributes.display_radio_options || [
        "Option 1",
        "Option 2",
      ];
      return (
        <div className="mt-3 space-y-2">
          <RadioGroup defaultValue={options[0]} className="space-y-2">
            {options.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2 group">
                <RadioGroupItem
                  value={option}
                  id={`${item.unique_id}-${index}`}
                />
                {isEditingOption(index) ? (
                  <Input
                    value={editingValue}
                    onChange={(e) => 
                      onStartEditing(item.unique_id, "option", e.target.value, undefined, index)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleOptionEdit(index, editingValue);
                        onSaveEdit();
                      } else if (e.key === "Escape") {
                        onSaveEdit();
                      }
                    }}
                    onBlur={() => {
                      handleOptionEdit(index, editingValue);
                      onSaveEdit();
                    }}
                    autoFocus
                    className="flex-1 h-8"
                  />
                ) : (
                  <Label 
                    htmlFor={`${item.unique_id}-${index}`}
                    className="flex-1 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-transparent hover:border-blue-200 hover:shadow-sm transition-all"
                    onClick={() => onStartEditing(item.unique_id, "option", option, undefined, index)}
                    title="Click to edit option"
                  >
                    {option}
                  </Label>
                )}
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </RadioGroup>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            className="mt-2"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Option
          </Button>
        </div>
      );
    }
    if (item.display_attributes.input_type === "checkbox") {
      const options = item.display_attributes.checkbox_options?.options.map((opt, idx) => opt?.display_name || `Option ${idx + 1}`) || [
        "Option 1",
        "Option 2",
      ];
      return (
        <div className="mt-3 space-y-2">
          <div className="space-y-2">
            {options.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2 group">
                <Checkbox
                  id={`${item.unique_id}-${index}`}
                  disabled
                />
                {isEditingOption(index) ? (
                  <Input
                    value={editingValue}
                    onChange={(e) => 
                      onStartEditing(item.unique_id, "option", e.target.value, undefined, index)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleOptionEdit(index, editingValue);
                        onSaveEdit();
                      } else if (e.key === "Escape") {
                        onSaveEdit();
                      }
                    }}
                    onBlur={() => {
                      handleOptionEdit(index, editingValue);
                      onSaveEdit();
                    }}
                    autoFocus
                    className="flex-1 h-8"
                  />
                ) : (
                  <Label 
                    htmlFor={`${item.unique_id}-${index}`}
                    className="flex-1 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-transparent hover:border-blue-200 hover:shadow-sm transition-all"
                    onClick={() => onStartEditing(item.unique_id, "option", option, undefined, index)}
                    title="Click to edit option"
                  >
                    {option}
                  </Label>
                )}
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            className="mt-2"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Option
          </Button>
        </div>
      );
    }
    return null;
  };

  const renderInput = () => {
    switch (item.display_attributes.input_type) {
      case "text":
        return (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder={item.display_attributes.placeholder || "Enter text..."}
              disabled
              className="bg-gray-50"
            />
            <div className="text-xs text-gray-500">
              Placeholder: {" "}
              {isEditingPlaceholder ? (
                <Input
                  value={editingValue}
                  onChange={(e) =>
                    onStartEditing(item.unique_id, "placeholder", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePlaceholderSave();
                    } else if (e.key === "Escape") {
                      onSaveEdit();
                    }
                  }}
                  onBlur={handlePlaceholderSave}
                  autoFocus
                  className="inline-block w-48 h-6 text-xs"
                  placeholder="Enter placeholder text..."
                />
              ) : (
                <span
                  className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-transparent hover:border-blue-200 hover:shadow-sm transition-all"
                  onClick={() =>
                    onStartEditing(
                      item.unique_id,
                      "placeholder",
                      item.display_attributes.placeholder || ""
                    )
                  }
                  title="Click to edit placeholder"
                >
                  {item.display_attributes.placeholder || "Click to add placeholder"}
                </span>
              )}
            </div>
          </div>
        );
      case "fileUpload":
        return (
          <div className="space-y-2">
            <Input
              type="file"
              disabled
              className="bg-gray-50"
            />
            <div className="text-xs text-gray-500">
              File upload field - files will be uploaded and stored securely
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 overflow-hidden">
            {isEditingLabel ? (
              <Input
                value={editingValue}
                onChange={(e) =>
                  onStartEditing(item.unique_id, "item", e.target.value)
                }
                onKeyDown={onEditKeyDown}
                onBlur={onSaveEdit}
                autoFocus
                className="text-lg font-medium w-full"
              />
            ) : (
              <div
                className="text-lg font-medium cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-transparent hover:border-blue-200 hover:shadow-sm transition-all break-words"
                onClick={() =>
                  onStartEditing(
                    item.unique_id,
                    "item",
                    item.display_attributes.display_name as string
                  )
                }
                title="Click to edit field name"
              >
                {item.display_attributes.display_name}
              </div>
            )}
            <div className="mt-4">
              {renderInput()}
              {renderOptions()}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Switch
                id={`required-${item.unique_id}`}
                checked={item.display_attributes.isRequired || false}
                onCheckedChange={(checked) => onUpdateItemRequired?.(item.unique_id, checked)}
              />
              <Label htmlFor={`required-${item.unique_id}`} className="text-sm text-gray-600">
                Required field
              </Label>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {item.display_attributes.input_type !== "fileUpload" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  onOpenMappingModal(
                    item.unique_id,
                    item.display_attributes.input_type
                  )
                }
                title="Configure mapping"
              >
                <CogIcon className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenVisibilityModal(item.unique_id)}
              title="Configure visibility"
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRemove}
              title="Remove field"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
