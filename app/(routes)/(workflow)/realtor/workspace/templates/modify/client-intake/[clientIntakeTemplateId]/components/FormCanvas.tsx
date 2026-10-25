import React from "react";
import { RectangleGroupIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { EditingItem } from "../types";
import { BlockRenderer } from "./BlockRenderer";
import { ClientIntakeSchemaItem } from "../types";

export interface FormCanvasProps {
  schemaItems: ClientIntakeSchemaItem[];
  onAddItem: (type: string, targetBlock?: string) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onAddBlock: () => void;
  onUpdateItemLabel: (itemId: string, newLabel: string) => Promise<void>;
  onUpdateItemOptions: (itemId: string, newOptions: string[]) => void;
  onUpdateItemPlaceholder: (itemId: string, newPlaceholder: string) => void;
  onUpdateItemMapping: (itemId: string, mapping: any) => Promise<void>;
  onUpdateConditionalVisibility: (itemId: string, visibility: any) => void;
  editingItem: EditingItem | null;
  editingValue: string;
  onStartEditing: (
    id: string,
    type: "item" | "block" | "placeholder" | "option",
    currentValue: string,
    blockName?: string,
    optionIndex?: number
  ) => void;
  onSaveEdit: () => Promise<void>;
  onCancelEdit: () => void;
  onEditKeyDown: (e: React.KeyboardEvent) => void;
  onOpenMappingModal: (itemId: string, inputType: string) => void;
  onOpenVisibilityModal: (itemId: string) => void;
  onUpdateItemRequired: (itemId: string, isRequired: boolean) => void;
}

export const FormCanvas: React.FC<FormCanvasProps> = ({
  schemaItems,
  onAddItem,
  onRemoveItem,
  onAddBlock,
  onUpdateItemOptions,
  onUpdateItemPlaceholder,
  onUpdateItemRequired,
  editingItem,
  editingValue,
  onStartEditing,
  onSaveEdit,
  onEditKeyDown,
  onOpenMappingModal,
  onOpenVisibilityModal,
}) => {
  // Group items by block
  const blockGroups = schemaItems.reduce(
    (groups: Record<string, ClientIntakeSchemaItem[]>, item) => {
      const blockName = item.display_attributes.block || "Default Block";
      if (!groups[blockName]) {
        groups[blockName] = [];
      }
      groups[blockName].push(item);
      return groups;
    },
    {}
  );

  const blockNames = Object.keys(blockGroups);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("text/plain");
    // Validate that the type is one of the allowed input types
    if (["text", "radio", "checkbox", "fileUpload"].includes(type)) {
      await onAddItem(type);
    } else {
      console.error(`Invalid form element type: ${type}`);
    }
  };

  return (
    <div
      className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 h-[600px] overflow-y-auto"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {blockNames.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <div className="text-lg font-semibold mb-2">No items found</div>
          <div>Add items from the left sidebar to create blocks</div>
        </div>
      ) : (
        <div className="space-y-4 pb-32">
          <div className="text-center text-sm text-gray-500 mb-4">
            Drag form elements into the blocks below. Blocks are created
            automatically when items reference them.
          </div>
          {blockNames.map((blockName) => (
            <BlockRenderer
              key={blockName}
              blockName={blockName}
              items={blockGroups[blockName]}
              editingItem={editingItem}
              editingValue={editingValue}
              onStartEditing={onStartEditing}
              onSaveEdit={onSaveEdit}
              onEditKeyDown={onEditKeyDown}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
              onUpdateItemOptions={onUpdateItemOptions}
              onUpdateItemPlaceholder={onUpdateItemPlaceholder}
              onUpdateItemRequired={onUpdateItemRequired}
              onOpenMappingModal={onOpenMappingModal}
              onOpenVisibilityModal={onOpenVisibilityModal}
            />
          ))}

          <div className="flex justify-center mt-6">
            <Button
              onClick={onAddBlock}
              variant="outline"
              className="border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
            >
              <RectangleGroupIcon className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
