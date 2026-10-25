import { PartyIntakeSchemaItem, Schema } from "@/components/files/types/realtor";

export type ClientIntakeSchemaItem = PartyIntakeSchemaItem;

export interface EditingItem {
  id: string;
  type: "item" | "block" | "placeholder" | "option";
  blockName?: string;
  optionIndex?: number;
}

export interface ClientIntakeEditorProps {
  title: string;
  onLoadItems: () => Promise<ClientIntakeSchemaItem[]>;
  onSaveItems: (items: ClientIntakeSchemaItem[]) => Promise<void>;
  onGetAvailableFormTypes: () => Promise<string[]>;
  onGetSchemaByFormType: (formType: string) => Promise<Schema>;
  onUpdateItem?: (item: ClientIntakeSchemaItem) => Promise<void>;
  onAddItem?: (item: ClientIntakeSchemaItem) => Promise<void>;
  onRemoveItem?: (itemId: string) => Promise<void>;
  onUnsavedChanges?: (hasChanges: boolean) => void;
  autoSave?: boolean;
  autoSaveInterval?: number;
  disabled?: boolean;
  disabledMessage?: string;
}

export interface SaveHeaderProps {
  title: string;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: string | null;
  onSave: () => void;
  disabled?: boolean;
}

export interface FormCanvasProps {
  schemaItems: ClientIntakeSchemaItem[];
  onAddItem: (type: string, targetBlock?: string) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onAddBlock: () => void;
  onUpdateItemLabel: (itemId: string, newLabel: string) => Promise<void>;
  onUpdateItemOptions: (itemId: string, newOptions: string[]) => void;
  onUpdateItemPlaceholder: (itemId: string, placeholder: string) => void;
  onUpdateItemRequired: (itemId: string, isRequired: boolean) => void;
  onUpdateItemMapping: (itemId: string, mapping: Mapping[]) => Promise<void>;
  onUpdateConditionalVisibility: (
    itemId: string,
    visibility: VisibilityCondition[]
  ) => void;
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
}

export interface ItemRendererProps {
  item: ClientIntakeSchemaItem;
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
  onEditKeyDown: (e: React.KeyboardEvent) => void;
  onRemoveItem: (itemId: string) => Promise<void>;
  onUpdateItemOptions: (itemId: string, newOptions: string[]) => void;
  onUpdateItemPlaceholder: (itemId: string, placeholder: string) => void;
  onUpdateItemRequired?: (itemId: string, isRequired: boolean) => void;
  onOpenMappingModal: (itemId: string, inputType: string) => void;
  onOpenVisibilityModal: (itemId: string) => void;
}

export interface BlockRendererProps {
  blockName: string;
  items: ClientIntakeSchemaItem[];
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
  onEditKeyDown: (e: React.KeyboardEvent) => void;
  onAddItem: (type: string, targetBlock?: string) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onUpdateItemOptions: (itemId: string, newOptions: string[]) => void;
  onUpdateItemPlaceholder: (itemId: string, placeholder: string) => void;
  onUpdateItemRequired: (itemId: string, isRequired: boolean) => void;
  onOpenMappingModal: (itemId: string, inputType: string) => void;
  onOpenVisibilityModal: (itemId: string) => void;
}

export interface Mapping {
  formType: string;
  uniqueId: string;
  radio_mapping?: {
    option: string;
    mappedRadioField: string;
  }[];

  checkbox_mapping?: {
    option: string;
    mappedCheckboxField: string;
  }[];
}

export interface VisibilityCondition {
  dependsOnField: string;
  operator: string;
  value: string;
}

export interface MappingModalProps {
  isOpen: boolean;
  itemId: string;
  inputType: string;
  currentMappings?: Mapping[];
  currentItem?: any; // The current item being mapped to access its radio options
  availableFormTypes: string[];
  availableFields: any[];
  loadingFormTypes: boolean;
  loadingFields: boolean;
  onClose: () => void;
  onSave: (mappings: Mapping[]) => Promise<void>;
  onFormTypeChange: (formType: string) => void;
}

export interface VisibilityModalProps {
  isOpen: boolean;
  itemId: string;
  currentVisibility?: VisibilityCondition[];
  availableItems: Array<{ id: string; label: string; type: string }>;
  onClose: () => void;
  onSave: (visibility: VisibilityCondition[]) => void;
}
