import React from "react";
import { RectangleGroupIcon } from "@heroicons/react/24/solid";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BlockRendererProps } from "../types";
import { ItemRenderer } from "./ItemRenderer";

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  blockName,
  items,
  editingItem,
  editingValue,
  onStartEditing,
  onSaveEdit,
  onEditKeyDown,
  onAddItem,
  onRemoveItem,
  onUpdateItemOptions,
  onUpdateItemPlaceholder,
  onUpdateItemRequired,
  onOpenMappingModal,
  onOpenVisibilityModal,
}) => {
  const isEditingBlockName =
    editingItem?.id === blockName && editingItem?.type === "block";

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData("text/plain");
    // Validate that the type is one of the allowed input types
    if (["text", "radio", "checkbox", "fileUpload"].includes(type)) {
      await onAddItem(type, blockName);
    } else {
      console.error(`Invalid form element type: ${type}`);
    }
  };

  return (
    <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RectangleGroupIcon className="w-5 h-5 text-blue-600" />
          {isEditingBlockName ? (
            <Input
              value={editingValue}
              onChange={(e) =>
                onStartEditing(blockName, "block", e.target.value)
              }
              onBlur={onSaveEdit}
              onKeyDown={onEditKeyDown}
              className="text-lg font-semibold text-blue-800 bg-white border-blue-300 focus:border-blue-500"
              autoFocus
            />
          ) : (
            <h3
              className="text-lg font-semibold text-blue-800 cursor-pointer hover:bg-blue-100 px-2 py-1 rounded border-2 border-transparent hover:border-blue-300 hover:shadow-sm transition-all"
              onClick={() => onStartEditing(blockName, "block", blockName)}
              title="Click to edit block name"
            >
              {blockName}
            </h3>
          )}
          <Badge
            variant="outline"
            className="text-xs bg-blue-100 text-blue-700 border-blue-300"
          >
            Section
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-blue-600">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div
        className="min-h-[120px] border-2 border-dashed border-blue-300 rounded-lg p-4 bg-white"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {items.length > 0 ? (
          <div className="space-y-3">
            {items
              .sort(
                (a, b) =>
                  a.display_attributes.order - b.display_attributes.order
              )
              .map((item, itemIndex) => (
                <ItemRenderer
                  key={`${item.unique_id}-${itemIndex}`}
                  item={item}
                  editingItem={editingItem}
                  editingValue={editingValue}
                  onStartEditing={onStartEditing}
                  onSaveEdit={onSaveEdit}
                  onEditKeyDown={onEditKeyDown}
                  onRemoveItem={onRemoveItem}
                  onUpdateItemOptions={onUpdateItemOptions}
                  onUpdateItemPlaceholder={onUpdateItemPlaceholder}
                  onUpdateItemRequired={onUpdateItemRequired}
                  onOpenMappingModal={onOpenMappingModal}
                  onOpenVisibilityModal={onOpenVisibilityModal}
                />
              ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-blue-400 text-sm">
            Drop form elements here to add them to the &quot;{blockName}&quot;
            section
          </div>
        )}
      </div>
    </div>
  );
};
