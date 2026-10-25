/* ----------------------------------------------------------------------
 * FormInput.tsx: fixed grid-width logic + nicer spacing
 * ------------------------------------------------------------------- */
"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useReducer,
  useRef,
  Fragment,
} from "react";
import clsx from "clsx";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Check,
  Plus,
  Upload,
  X,
  Info,
  Edit3,
  MapPin,
  Home,
  FileText,
  Calendar,
  CreditCard,
  Users,
  AlertCircle,
  CalendarIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  FormResponse,
  SchemaItem,
  SignatureInput,
  FileUpload,
} from "../types/realtor";
import { useFormProgress } from "../hooks/useFormProgress";
import FormProgressIndicator from "../components/FormProgressIndicator";
import {
  getDealPartiesByDealOptionId,
  getPartiesByDealId,
} from "@/app/actions/realtor/dealClient-actions";
import AddPartyModal from "./AddPartyModal";

/* ------------------------------------------------------------------ */
/* Optimized Date Utility Functions                                   */
/* ------------------------------------------------------------------ */

// Extracted to prevent re-creation on each render - performance optimization
const formatNumberedDate = (date: Date | undefined): string => {
  if (!date) return "";
  return date.toLocaleDateString();
};

const formatDate = (date: Date | undefined): string => {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long", 
    year: "numeric",
  });
};

const isValidDate = (date: Date | undefined): boolean => {
  if (!date) return false;
  return !isNaN(date.getTime());
};

/* ------------------------------------------------------------------ */
/* Date Picker State Management                                       */
/* ------------------------------------------------------------------ */

interface DatePickerState {
  openStates: Record<string, boolean>;
  months: Record<string, Date>;
  values: Record<string, string>;
}

type DatePickerAction = 
  | { type: 'SET_OPEN'; fieldId: string; open: boolean }
  | { type: 'SET_MONTH'; fieldId: string; month: Date }
  | { type: 'SET_VALUE'; fieldId: string; value: string }
  | { type: 'INITIALIZE_VALUE'; fieldId: string; value: string };

const datePickerReducer = (state: DatePickerState, action: DatePickerAction): DatePickerState => {
  switch (action.type) {
    case 'SET_OPEN':
      return {
        ...state,
        openStates: { ...state.openStates, [action.fieldId]: action.open }
      };
    case 'SET_MONTH':
      return {
        ...state,
        months: { ...state.months, [action.fieldId]: action.month }
      };
    case 'SET_VALUE':
      return {
        ...state,
        values: { ...state.values, [action.fieldId]: action.value }
      };
    case 'INITIALIZE_VALUE':
      // Only set if not already present
      if (state.values[action.fieldId]) return state;
      return {
        ...state,
        values: { ...state.values, [action.fieldId]: action.value }
      };
    default:
      return state;
  }
};

/* ------------------------------------------------------------------ */
/* Types for party selection                                          */
/* ------------------------------------------------------------------ */

interface PartyOption {
  id: string;
  type: "deal_party" | "deal_option_party";
  label: string;
  email: string;
  role?: string;
}

/* ------------------------------------------------------------------ */
/* Types and Icon/Theme Mapping                                       */
/* ------------------------------------------------------------------ */

type IconName =
  | "MapPin"
  | "Home"
  | "FileText"
  | "Calendar"
  | "CreditCard"
  | "Users"
  | "Info"
  | "AlertCircle";

type ThemeColor = "blue" | "green" | "purple" | "orange" | "gray";

type ThemeConfig = {
  border: string;
  bg: string;
  text: string;
  icon: string;
  header: string;
};

type GroupWithStyle = {
  id: string;
  name?: string;
  items: SchemaItem[];
  style?: {
    title?: string;
    description?: string;
    icon?: string;
    color_theme?: ThemeColor;
  };
};

const iconMap: Record<IconName, React.ComponentType<any>> = {
  MapPin,
  Home,
  FileText,
  Calendar,
  CreditCard,
  Users,
  Info,
  AlertCircle,
};

const themeColors: Record<ThemeColor, ThemeConfig> = {
  blue: {
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: "text-blue-600",
    header: "bg-blue-50",
  },
  green: {
    border: "border-l-green-500",
    bg: "bg-green-50",
    text: "text-green-700",
    icon: "text-green-600",
    header: "bg-green-50",
  },
  purple: {
    border: "border-l-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-700",
    icon: "text-purple-600",
    header: "bg-purple-50",
  },
  orange: {
    border: "border-l-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-700",
    icon: "text-orange-600",
    header: "bg-orange-50",
  },
  gray: {
    border: "border-l-gray-400",
    bg: "bg-gray-50",
    text: "text-gray-700",
    icon: "text-gray-600",
    header: "bg-gray-50",
  },
};

/* ------------------------------------------------------------------ */
/* Width helpers                                                      */
/* ------------------------------------------------------------------ */

const MAX_GRID = 12;

/** A static palette of span classes so Tailwind's scanner picks them up */
const SPAN_CLASSES = [
  "col-span-1",
  "col-span-2",
  "col-span-3",
  "col-span-4",
  "col-span-5",
  "col-span-6",
  "col-span-7",
  "col-span-8",
  "col-span-9",
  "col-span-10",
  "col-span-11",
  "col-span-12",
] as const;

/** Map a SchemaItem → grid span class (defaults to full width) */
const getSpanClass = (item: SchemaItem): string => {
  const gotWidth: number = item.display_attributes.width ?? MAX_GRID;
  return SPAN_CLASSES[gotWidth - 1];
};

/* ------------------------------------------------------------------ */
/* Component                                                          */


/* ------------------------------------------------------------------ */

interface FormInputProps {
  schema: SchemaItem[];
  formResponseUpdateByField: (
    itemKey: string,
    newValue: string | string[] | SignatureInput
  ) => Promise<void>;
  initialFormResponses: FormResponse;
  can_edit: boolean;
  isLoading: boolean;
  showProgress?: boolean;
  dealId?: string;
  dealOptionId?: string;
  dealSide?: string;
  dealOptionName?: string;
  onPartyAdded?: () => void;
  handleFileUpload?: (file: File[], fieldId: string) => Promise<void>;
  clientIntakeWillSend?: string[]; //unique ids of fields that will be sent from client intakes
}

const FormInput: React.FC<FormInputProps> = ({
  schema,
  
  formResponseUpdateByField,
  initialFormResponses,
  can_edit,
  isLoading,
  showProgress = false,
  dealId,
  dealOptionId,
  dealOptionName,
  onPartyAdded,
  handleFileUpload,
  clientIntakeWillSend = [],
}) => {
  // --- add party modal state ---
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);
  // Track which signature-party dropdown is open (per field)
  const [openSelectId, setOpenSelectId] = useState<string | null>(null);

  /* --------------------------- state & effects -------------------- */

  const [formResponses, setFormResponses] =
    useState<FormResponse>(initialFormResponses);
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [editedItems, setEditedItems] = useState<Set<string>>(new Set());
  // Local state for tracking file upload status per field
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(
    new Set()
  );

  // State for managing multiple file inputs per field
  const [fileInputCounts, setFileInputCounts] = useState<
    Record<string, number>
  >({});

  // State to track actual File objects per field for idempotent uploads
  const [fieldFiles, setFieldFiles] = useState<Record<string, File[]>>({});
  
  // Consolidated date picker state management with reducer
  const [datePickerState, dispatchDatePicker] = useReducer(datePickerReducer, {
    openStates: {},
    months: {},
    values: {}
  });
  
  // State for minimized info items
  const [minimizedInfoItems, setMinimizedInfoItems] = useState<Set<string>>(new Set());

  // State to track which client intake fields are being edited
  const [editingClientIntakeFields, setEditingClientIntakeFields] = useState<
    Set<string>
  >(new Set());

  // --- label truncation state ---
  const labelRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const [truncatedLabels, setTruncatedLabels] = React.useState<
    Record<string, boolean>
  >({});
  const containerRef = React.useRef<HTMLDivElement>(null);

  // --- party selection state ---
  const [partyOptions, setPartyOptions] = useState<PartyOption[]>([]);
  const [loadingParties, setLoadingParties] = useState(false);

  // --- Performance optimization refs ---
  const fieldRefs = useRef<Record<string, any>>({});
  const debouncedSaves = useRef<Record<string, NodeJS.Timeout>>({});

  // Memoize the schema grouping to prevent recalculation on every render
  const groupedSchema = useMemo(() => {
    const groups: GroupWithStyle[] = [];
    const ungroupedItems: SchemaItem[] = [];
    let current: GroupWithStyle | null = null;

    schema.forEach((item) => {
      // If item has no block, add it to ungrouped items
      if (!item.display_attributes.block) {
        ungroupedItems.push(item);
        return;
      }

      const blockId = `${item.display_attributes.block}__${groups.length}`;
      if (
        current &&
        item.display_attributes.block &&
        current.name === item.display_attributes.block
      ) {
        current.items.push(item);
      } else {
        current = {
          id: blockId,
          name: item.display_attributes.block,
          items: [item],
          style: item.display_attributes.block_style || {
            color_theme: "gray" as ThemeColor,
          },
        };
        groups.push(current);
      }
    });

    return { groups, ungroupedItems };
  }, [schema]);

  // Memoize the truncation check function
  const checkTruncation = useCallback(() => {
    const newTruncated: Record<string, boolean> = {};

    schema.forEach((item) => {
      const ref = labelRefs.current[item.unique_id];
      if (ref) {
        newTruncated[item.unique_id] = ref.scrollWidth > ref.clientWidth + 1;
      }
    });
    setTruncatedLabels(newTruncated);
  }, [schema]);

  // Batch observer setup
  useEffect(() => {
    if (!containerRef.current) return;

    let mutationObserver: MutationObserver | null = null;
    const resizeObservers = new Map();

    // Only set up observers if we have items to observe
    if (schema.length > 0) {
      mutationObserver = new MutationObserver((mutations) => {
        const shouldCheck = mutations.some((mutation) => {
          return Array.from(mutation.addedNodes).some((node) => {
            if (node instanceof HTMLElement) {
              return node.tagName === "LABEL" || node.querySelector("label");
            }
            return false;
          });
        });

        if (shouldCheck) {
          requestAnimationFrame(checkTruncation);
        }
      });

      mutationObserver.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });

      // Initial check
      requestAnimationFrame(checkTruncation);

      // Set up ResizeObserver for each label
      schema.forEach((item) => {
        const ref = labelRefs.current[item.unique_id];
        if (ref) {
          const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(checkTruncation);
          });
          resizeObserver.observe(ref);
          resizeObservers.set(item.unique_id, resizeObserver);
        }
      });
    }

    return () => {
      mutationObserver?.disconnect();
      resizeObservers.forEach((observer) => observer.disconnect());
    };
  }, [checkTruncation, schema]);

  useEffect(() => {
    setFormResponses(initialFormResponses);
  }, [initialFormResponses]);

  // Cleanup debounced saves on unmount
  useEffect(() => {
    return () => {
      Object.values(debouncedSaves.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  /* --------------------------- handlers --------------------------- */
  const handleFieldChange = useCallback(
    (item: SchemaItem, newValue: string | string[] |  SignatureInput) => {
      if (!can_edit) return;
      setFormResponses((prev) => ({
        ...prev,
        [item.unique_id]: newValue,
      }));
      setEditedItems((prev) => new Set(prev).add(item.unique_id));
      setSavedItems((prev) => {
        const next = new Set(prev);
        next.delete(item.unique_id);
        return next;
      });
    },
    [can_edit]
  );

  const handleFieldBlur = useCallback(
    async (item: SchemaItem, newValue: string | string[] | SignatureInput, forceUpdate = false) => {
      if (!can_edit) return;
      if (!forceUpdate && !editedItems.has(item.unique_id)) return;
      
      setSavingItems((prev) => new Set(prev).add(item.unique_id));
      try {
        await formResponseUpdateByField(item.unique_id, newValue);
        toast.success("Field updated successfully.");
        setSavedItems((prev) => new Set(prev).add(item.unique_id));
        setEditedItems((prev) => {
          const updated = new Set(prev);
          updated.delete(item.unique_id);
          return updated;
        });
        // Clear client intake editing state if field has value now
        if (newValue && editingClientIntakeFields.has(item.unique_id)) {
          setEditingClientIntakeFields((prev) => {
            const updated = new Set(prev);
            updated.delete(item.unique_id);
            return updated;
          });
        }
      } catch (err) {
        toast.error("Failed to update field.");
        console.error("Save failed:", err);
      } finally {
        setSavingItems((prev) => {
          const updated = new Set(prev);
          updated.delete(item.unique_id);
          return updated;
        });
      }
    },
    [
      can_edit,
      editedItems,
      formResponseUpdateByField,
      editingClientIntakeFields,
    ]
  );

  // Optimistic update handler for better performance
  const handleOptimisticUpdate = useCallback(
    (item: SchemaItem, newValue: string | string[] | SignatureInput, fieldType: string) => {
      if (!can_edit) return;
      
      // Update local state immediately for instant UI feedback
      setFormResponses((prev) => ({
        ...prev,
        [item.unique_id]: newValue,
      }));
      
      // Mark as edited
      setEditedItems((prev) => new Set(prev).add(item.unique_id));
      setSavedItems((prev) => {
        const next = new Set(prev);
        next.delete(item.unique_id);
        return next;
      });
      
      // Clear any existing debounce timer
      if (debouncedSaves.current[item.unique_id]) {
        clearTimeout(debouncedSaves.current[item.unique_id]);
      }
      
      // Different debounce times based on field type
      const debounceTime = fieldType === 'text' || fieldType === 'text-area' ? 300 : 100;
      
      // Debounce the actual save
      debouncedSaves.current[item.unique_id] = setTimeout(() => {
        handleFieldBlur(item, newValue, true);
      }, debounceTime);
    },
    [can_edit, handleFieldBlur]
  );

  // Force save for dropdown selections - bypasses editedItems check
  const handleForceSave = useCallback(
    async (item: SchemaItem, newValue: string | string[] | SignatureInput) => {
      if (!can_edit) return;
      setSavingItems((prev) => new Set(prev).add(item.unique_id));
      try {
        await formResponseUpdateByField(item.unique_id, newValue);
        toast.success("Field updated successfully.");
        setSavedItems((prev) => new Set(prev).add(item.unique_id));
        setEditedItems((prev) => {
          const updated = new Set(prev);
          updated.delete(item.unique_id);
          return updated;
        });
        // Clear client intake editing state if field has value now
        if (newValue && editingClientIntakeFields.has(item.unique_id)) {
          setEditingClientIntakeFields((prev) => {
            const updated = new Set(prev);
            updated.delete(item.unique_id);
            return updated;
          });
        }
      } catch (err) {
        toast.error("Failed to update field.");
        console.error("Save failed:", err);
      } finally {
        setSavingItems((prev) => {
          const updated = new Set(prev);
          updated.delete(item.unique_id);
          return updated;
        });
      }
    },
    [can_edit, formResponseUpdateByField, editingClientIntakeFields]
  );

  // Load party options from deal and deal option parties
  const loadPartyOptions = useCallback(async () => {
    if (!dealId && !dealOptionId) {
      return;
    }

    setLoadingParties(true);
    try {
      const options: PartyOption[] = [];
      const seenIds = new Set<string>();

      // Load deal parties if dealId is available
      if (dealId) {
        try {
          const dealParties = await getPartiesByDealId(dealId);

          if (dealParties && Array.isArray(dealParties)) {
            dealParties.forEach((party: any) => {
              // Check multiple possible email field names
              const email = party.party_email || party.email;
              if (email) {
                // Generate unique ID with fallback to ensure uniqueness
                let id =
                  party.party_id ||
                  party.id ||
                  `deal_party_${party.party_email || party.email}`;

                // Handle duplicate IDs by appending a counter
                let counter = 1;
                const originalId = id;
                while (seenIds.has(id)) {
                  id = `${originalId}_${counter}`;
                  counter++;
                }
                seenIds.add(id);

                options.push({
                  id: id,
                  type: "deal_party",
                  label: `${
                    party.party_name || party.full_name || "Unknown"
                  } (${email})`,
                  email: email,
                  role: party.party_role,
                });
              } else {
                console.warn("Deal party missing email:", party);
              }
            });
          } else {
            console.warn(
              "Deal parties is not an array or is null:",
              dealParties
            );
          }
        } catch (error) {
          console.error("Error loading deal parties:", error);
        }
      }

      // Load deal option parties if dealOptionId is available
      if (dealOptionId) {
        try {
          const dealOptionParties = await getDealPartiesByDealOptionId(dealOptionId);

          if (dealOptionParties && Array.isArray(dealOptionParties)) {
            dealOptionParties.forEach((party: any) => {
              // Check multiple possible email field names
              const email = party.email || party.party_email;
              if (email) {
                // Generate unique ID with fallback to ensure uniqueness
                let id =
                  party.party_id ||
                  party.id ||
                  `deal_option_party_${party.email || party.party_email}`;

                // Handle duplicate IDs by appending a counter
                let counter = 1;
                const originalId = id;
                while (seenIds.has(id)) {
                  id = `${originalId}_${counter}`;
                  counter++;
                }
                seenIds.add(id);

                options.push({
                  id: id,
                  type: "deal_option_party",
                  label: `${
                    party.full_name || party.party_name || "Unknown"
                  } (${email})`,
                  email: email,
                  role: party.party_role,
                });
              } else {
                console.warn("Deal option party missing email:", party);
              }
            });
          } else {
            console.warn(
              "Deal option parties is not an array or is null:",
              dealOptionParties
            );
          }
        } catch (error) {
          console.error("Error loading deal option parties:", error);
        }
      }

      setPartyOptions(options);
    } catch (error) {
      console.error("Error loading party options:", error);
      toast.error("Failed to load party options");
    } finally {
      setLoadingParties(false);
    }
  }, [dealId, dealOptionId]);

  // Load party options when component mounts or deal info changes
  useEffect(() => {
    loadPartyOptions();
  }, [loadPartyOptions]);

  // Reload party options when a new party is added
  useEffect(() => {
    if (onPartyAdded) {
      loadPartyOptions();
    }
  }, [onPartyAdded, loadPartyOptions]);

  // Auto-populate dropdowns when form responses or party options change
  useEffect(() => {
    if (partyOptions.length === 0) return;

    // No need to update SignatureInput since it only stores actionAs and email
    // The party matching is done in the UI layer only
  }, [partyOptions, formResponses, schema]);

  // Handle party selection in signature dropdown
  const handlePartySelection = useCallback(
    async (item: SchemaItem, partyId: string) => {
      // Ignore the "no-parties" placeholder value
      if (partyId === "no-parties") {
        return;
      }

      const selectedParty = partyOptions.find((p) => p.id === partyId);
      if (selectedParty) {
        const signatureInput: SignatureInput = {
          actionAs:
            (formResponses[item.unique_id] as SignatureInput)?.actionAs ||
            "signer",
          email: selectedParty.email,
        };
        handleOptimisticUpdate(item, signatureInput, 'signature');
        // Force save when party is selected to ensure loading icon shows
        await handleForceSave(item, signatureInput);
      }
    },
    [partyOptions, formResponses, handleFieldChange, handleForceSave]
  );

  // Handle party added through modal
  const handlePartyAdded = useCallback(async () => {
    setIsAddPartyModalOpen(false);
    // Refresh party options
    await loadPartyOptions();
    toast.success("Party options refreshed");
    // Call the optional parent callback
    if (onPartyAdded) {
      onPartyAdded();
    }
  }, [loadPartyOptions, onPartyAdded]);

  // Helper function to handle idempotent file uploads
  const handleFileChange = useCallback(
    async (fieldId: string, newFiles: File[]) => {
      if (!handleFileUpload) return;

      // Set uploading state
      setUploadingFields((prev) => new Set(prev).add(fieldId));

      try {
        // Send all files for this field (idempotent)
        await handleFileUpload(newFiles, fieldId);

        // Update local state
        setFieldFiles((prev) => ({
          ...prev,
          [fieldId]: newFiles,
        }));

        // Update form response for UI display
        const newFileUpload: FileUpload = {
          files: newFiles.map((f) => f.name),
          count: newFiles.length,
        };

        if (newFiles.length > 0) {
          setFormResponses((prev) => ({
            ...prev,
            [fieldId]: newFileUpload,
          }));
        } else {
          // Remove from form responses if no files
          setFormResponses((prev) => {
            const newResponses = { ...prev };
            delete newResponses[fieldId];
            return newResponses;
          });
        }

        toast.success(
          newFiles.length > 0
            ? "Files updated successfully"
            : "File removed successfully"
        );
      } catch (error) {
        console.error("File upload error:", error);
        toast.error("File operation failed");
      } finally {
        // Clear uploading state
        setUploadingFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fieldId);
          return newSet;
        });
      }
    },
    [handleFileUpload]
  );

  // Helper function to add a file to a field
  const addFileToField = useCallback(
    async (fieldId: string, newFile: File) => {
      const currentFiles = fieldFiles[fieldId] || [];
      const updatedFiles = [...currentFiles, newFile];
      await handleFileChange(fieldId, updatedFiles);
    },
    [fieldFiles, handleFileChange]
  );

  // Helper function to remove a file from a field
  const removeFileFromField = useCallback(
    async (fieldId: string, fileIndex: number) => {
      const currentFiles = fieldFiles[fieldId] || [];
      const updatedFiles = currentFiles.filter(
        (_, index) => index !== fileIndex
      );
      await handleFileChange(fieldId, updatedFiles);
    },
    [fieldFiles, handleFileChange]
  );

  /* --------------------------- helpers ---------------------------- */

  const isFieldVisible = useCallback(
    (uniqueId: string, operation: string, valueChecked: string): boolean => {
      if (
        schema.find((item) => item.unique_id === uniqueId)?.display_attributes
          .isHidden
      )
        return false;

      const fieldValue = formResponses[uniqueId];
      // if (typeof fieldValue !== "string" && !Array.isArray(fieldValue)) return false;
      const operators: Record<string, (a: string, b: string) => boolean> = {
        ">": (a, b) => parseInt(a) > parseInt(b),
        ">=": (a, b) => parseInt(a) >= parseInt(b),
        "<": (a, b) => parseInt(a) < parseInt(b),
        "<=": (a, b) => parseInt(a) <= parseInt(b),
        "==": (a, b) => a === b,
        "!==": (a, b) => a !== b,
        "contains": (a, b) => a.includes(b),
        "notContains": (a, b) => !a.includes(b)
      };
      const operatorFn = operators[operation];
      
      // Return false if fieldValue is not string or string[]
      if (typeof fieldValue !== "string" && !Array.isArray(fieldValue)) return false;
      
      if (!operatorFn) return false;
      
      // If fieldValue is a string, run the operator on it
      if (typeof fieldValue === "string") {
        return operatorFn(fieldValue, valueChecked);
      }
      
      // If fieldValue is a string array, check if ALL items pass the test
      if (Array.isArray(fieldValue)) {
        // If array is empty, return false
        if (fieldValue.length === 0) return false;
        
        // Check if every string in the array passes the operator test
        const result = fieldValue.every((item) => {
          // Only process string items
          if (typeof item === "string") {
            return operatorFn(item, valueChecked);
          }
          return false;
        });
        return result;
      }
      
      return false;
    },
    [formResponses]
  );

  // Helper function to check if a specific field should be visible
  const checkFieldVisibility = useCallback(
    (item: SchemaItem): boolean => {
      // Null check for item and display_attributes
      if (!item || !item.display_attributes) {
        return false;
      }
      
      // First check if the field is hidden
      if (item.display_attributes.isHidden) {
        return false;
      }

      // Then check visibleIf conditions
      return (
        !item.display_attributes.visibleIf ||
        item.display_attributes.visibleIf.length === 0 ||
        item.display_attributes.visibleIf.every(
          (cond) =>
            cond.unique_id &&
            cond.operation &&
            cond.valueChecked !== undefined &&
            cond.valueChecked !== null &&
            isFieldVisible(cond.unique_id, cond.operation, cond.valueChecked)
        )
      );
    },
    [isFieldVisible]
  );

  // Use the form progress hook (must be after checkFieldVisibility is defined)
  const { progress: formProgress } = useFormProgress({
    enabled: showProgress,
    schema,
    formResponses,
    isFieldVisible: checkFieldVisibility,
  });


  // Filter blocks to only show those with at least one visible field
  const visibleGroupedSchema = useMemo(() => {
    return groupedSchema.groups.filter((group) =>
      group.items.some((item) => checkFieldVisibility(item))
    );
  }, [groupedSchema, checkFieldVisibility]);

  // Clear values for fields that become invisible
  useEffect(() => {
    if (!can_edit) return;
    
    // Create map of linked field IDs to their parent checkbox option
    const linkedFieldToParent = new Map<string, {parentId: string, optionValue: string}>();
    schema.forEach(schemaItem => {
      if (schemaItem.display_attributes.input_type === 'checkbox' && 
          schemaItem.display_attributes.checkbox_options?.options) {
        schemaItem.display_attributes.checkbox_options.options.forEach(option => {
          option.linkedFields?.forEach(fieldId => {
            linkedFieldToParent.set(fieldId, {
              parentId: schemaItem.unique_id,
              optionValue: option.databaseStored
            });
          });
        });
      }
    });
    
    const fieldsToUpdate: Record<string, undefined> = {};
    let hasChanges = false;
    
    // Check each field in formResponses
    Object.keys(formResponses).forEach((fieldId) => {
      const schemaItem = schema.find((item) => item.unique_id === fieldId);
      
      // Check if this is a linked field
      const parentInfo = linkedFieldToParent.get(fieldId);
      if (parentInfo) {
        // For linked fields, check if parent checkbox is selected
        const parentSelections = Array.isArray(formResponses[parentInfo.parentId]) 
          ? formResponses[parentInfo.parentId] as string[]
          : formResponses[parentInfo.parentId] ? [formResponses[parentInfo.parentId] as string] : [];
        
        if (!parentSelections.includes(parentInfo.optionValue)) {
          // Parent checkbox is not selected, clear this linked field
          fieldsToUpdate[fieldId] = undefined;
          hasChanges = true;
        }
      } else if (schemaItem && !checkFieldVisibility(schemaItem)) {
        // Regular field - clear if invisible
        fieldsToUpdate[fieldId] = undefined;
        hasChanges = true;
      }
    });
    
    // Update formResponses to remove invisible field values
    if (hasChanges) {
      setFormResponses((prev) => {
        const newResponses = { ...prev };
        Object.keys(fieldsToUpdate).forEach((fieldId) => {
          delete newResponses[fieldId];
        });
        return newResponses;
      });
    }
  }, [schema, formResponses, checkFieldVisibility, can_edit]);

  /* ------------------------ group schema -------------------------- */

  const getBlockTheme = useCallback(
    (group: GroupWithStyle, index: number): ThemeConfig => {
      if (group.style?.color_theme && group.style.color_theme in themeColors) {
        return themeColors[group.style.color_theme];
      }
      // Fallback theme
      const themes: ThemeColor[] = ["blue", "green", "purple", "orange"];
      const themeName = themes[index % themes.length];
      return themeColors[themeName];
    },
    []
  );

  const formatBlockName = useCallback(
    (name: string) => name.replace(/_/g, " "),
    []
  );

  const getBlockIcon = useCallback(
    (group: GroupWithStyle): React.ComponentType<any> => {
      if (group.style?.icon && group.style.icon in iconMap) {
        return iconMap[group.style.icon as IconName];
      }
      return FileText; // Default icon
    },
    []
  );

  
  /* --------------------------- renderers -------------------------- */
  const renderField = useCallback(
    (item: SchemaItem, showClientIntakePlaceholder: boolean = false) => {
      const visible = checkFieldVisibility(item);
      if (!visible) return null;

      // Check if this is a client intake field
      const isClientIntakeField = clientIntakeWillSend.includes(item.unique_id);
      const hasExistingValue = !!formResponses[item.unique_id];
      const isEditingClientIntake = editingClientIntakeFields.has(
        item.unique_id
      );

      // Determine if field should be disabled for client intake
      const shouldDisableForClientIntake =
        can_edit &&
        isClientIntakeField &&
        !hasExistingValue &&
        !isEditingClientIntake;

      const StatusIcon = () => (
        <Fragment>
          {savingItems.has(item.unique_id) ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : savedItems.has(item.unique_id) && (item.display_attributes.input_type !== "checkbox") ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : null}
        </Fragment>
      );

      const LinkedFieldStatusIcon = ({ fieldId }: { fieldId: string }) => (
        <Fragment>
          {savingItems.has(fieldId) ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : savedItems.has(fieldId) ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : null}
        </Fragment>
      );

      const containerClass = clsx(
        getSpanClass(item),
        "flex flex-col space-y-1.5 justify-start"
      );


      const { input_type } = item.display_attributes;

      return (
        <div key={item.unique_id} className={containerClass}>
          {/* Client intake badge row - only render when placeholder is needed */}
          {showClientIntakePlaceholder && (
            <div className="h-6">
              {(shouldDisableForClientIntake ||
                (isClientIntakeField && isEditingClientIntake)) && (
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                        <Info className="h-3 w-3 mr-1" />
                        <span>From Client Intake</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>
                        This field will be populated by the client intake
                        template
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  {/* Edit/Disable button for client intake fields */}
                  {isClientIntakeField && can_edit && !hasExistingValue && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingClientIntakeFields((prev) => {
                          const newSet = new Set(prev);
                          if (isEditingClientIntake) {
                            newSet.delete(item.unique_id);
                          } else {
                            newSet.add(item.unique_id);
                          }
                          return newSet;
                        });
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      {isEditingClientIntake ? (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Label and description combined with better spacing */}
          {input_type !== "info" && input_type !== "checkbox" && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <Tooltip
                  disableHoverableContent={!truncatedLabels[item.unique_id]}
                >
                  <TooltipTrigger asChild>
                    <Label
                      ref={(el) => {
                        labelRefs.current[item.unique_id] = el;
                      }}
                      className="text-sm font-medium text-gray-900 flex items-center gap-1"
                    >
                      <span>{item.display_attributes.display_name}</span>
                      {item.display_attributes.isRequired && (
                        <span className="text-red-500">*</span>
                      )}
                      {input_type === "signature" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-xs text-center"
                          >
                            <p>
                              Dates will be automatically handled if a signer is
                              chosen.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </Label>
                  </TooltipTrigger>
                  {truncatedLabels[item.unique_id] && (
                    <TooltipContent side="top" className="max-w-xs break-words">
                      {item.display_attributes.display_name}
                    </TooltipContent>
                  )}
                </Tooltip>
                <StatusIcon />
              </div>
              {item.display_attributes.description && (
                <p className="text-xs text-gray-600 leading-tight mt-0.5">
                  {item.display_attributes.description}
                </p>
              )}
            </div>
          )}

          {/* -------------- RADIO GROUP ---------------- */}
          {input_type === "radio" &&
            (() => {
              const specialInput = item.display_attributes.special_input;
              const layout = specialInput?.radio?.layout || 'vertical';
              const columns = specialInput?.radio?.columns || 2;
              
              const radioOptions =
                item.display_attributes.display_radio_options?.map((opt) => ({
                  displayName: opt,
                  value: opt,
                })) ||
                item.pdf_attributes?.[0]?.linked_form_fields_radio?.map(
                  (opt) => ({
                    displayName: opt.displayName,
                    value: opt.radioField,
                  })
                );

              if (!radioOptions?.length) return null;
              
              const gridClass = (() => {
                if (layout === 'horizontal') {
                  return `flex flex-wrap gap-4`;
                } else if (layout === 'grid') {
                  return `grid grid-cols-${columns} gap-2`;
                } else {
                  return 'flex flex-col gap-2';
                }
              })();

              return (
                <div className={gridClass}>
                  {radioOptions.map((choice) => (
                    <label
                      key={choice.displayName}
                      className={clsx(
                        "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                        layout === 'horizontal' ? 'flex-shrink-0' : '',
                        formResponses[item.unique_id] === choice.value
                          ? "border-blue-300 bg-blue-50 shadow-sm"
                          : "hover:bg-gray-50 border-gray-200",
                        shouldDisableForClientIntake &&
                          "bg-blue-50 border-blue-200 cursor-not-allowed opacity-70"
                      )}
                    >
                      <input
                        type="radio"
                        name={item.unique_id}
                        value={choice.value}
                        checked={formResponses[item.unique_id] === choice.value}
                        onChange={(e) =>
                          handleOptimisticUpdate(item, e.target.value, 'radio')
                        }
                        onBlur={(e) => handleFieldBlur(item, e.target.value)}
                        disabled={!can_edit || shouldDisableForClientIntake}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">
                        {choice.displayName}
                      </span>
                    </label>
                  ))}
                </div>
              );
            })()}

          {/* -------------- CHECKBOX -------------------- */}
          {input_type === "checkbox" && (
            (() => {
              const specialInput = item.display_attributes.special_input;
              const isRadioMode = specialInput?.checkbox?.asRadio;
              const horizontalColumns = specialInput?.checkbox?.horizontal || 1;
              const options = item.display_attributes.checkbox_options?.options || [];
              
              
              // Helper function to render a single checkbox/radio option
              const renderOption = (option: any, index: number, isHorizontal: boolean = false) => {
                const currentSelections = Array.isArray(formResponses[item.unique_id]) 
                  ? formResponses[item.unique_id] as string[]
                  : formResponses[item.unique_id] ? [formResponses[item.unique_id] as string] : [];
                const isChecked = currentSelections.includes(option.databaseStored);
                const maxSelected = item.display_attributes.checkbox_options?.maxSelected;
                const canSelect = !isChecked && (!maxSelected || currentSelections.length < maxSelected);

                return (
                  <div 
                    key={`${item.unique_id}-${index}`}
                    className={clsx(
                      "border rounded-lg transition-all",
                      isHorizontal && "h-full flex flex-col",
                      isChecked
                        ? "border-blue-300 bg-blue-50 shadow-sm"
                        : canSelect
                        ? "hover:bg-gray-50 border-gray-200"
                        : "border-gray-200 bg-gray-50 opacity-50",
                      shouldDisableForClientIntake &&
                        "bg-blue-50 border-blue-200 opacity-70",
                      !can_edit && "opacity-70"
                    )}
                  >
                    <label
                      className={clsx(
                        "relative flex items-center justify-between p-3 cursor-pointer",
                        isHorizontal && "flex-1"
                      )}
                    >
                    {/* Invisible input that handles the click */}
                    <input
                      type={isRadioMode ? "radio" : "checkbox"}
                      name={isRadioMode ? item.unique_id : undefined}
                      checked={isChecked}
                      onChange={(e) => {
                        let newSelections: string[];
                        
                        if (isRadioMode) {
                          // Radio mode - only one selection allowed
                          newSelections = e.target.checked ? [option.databaseStored] : [];
                        } else {
                          // Checkbox mode
                          if (e.target.checked) {
                            // Adding selection
                            if (maxSelected === 1) {
                              // Single selection mode - replace current selection
                              newSelections = [option.databaseStored];
                            } else if (!maxSelected || currentSelections.length < maxSelected) {
                              // Multiple selection mode - add to current selections
                              newSelections = [...currentSelections, option.databaseStored];
                            } else {
                              // At max limit, don't add
                              return;
                            }
                          } else {
                            // Removing selection
                            newSelections = currentSelections.filter(val => val !== option.databaseStored);
                          }
                        }
                        
                        handleOptimisticUpdate(item, newSelections, 'checkbox');
                      }}
                      onBlur={() => {
                        const currentSelections = Array.isArray(formResponses[item.unique_id]) 
                          ? formResponses[item.unique_id] as string[]
                          : formResponses[item.unique_id] ? [formResponses[item.unique_id] as string] : [];
                        handleFieldBlur(item, currentSelections);
                      }}
                      disabled={!can_edit || shouldDisableForClientIntake || (!isChecked && !canSelect && !isRadioMode)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />

                    {/* Visual content */}
                    <div className="flex-1 min-w-0 pointer-events-none">
                      <span className={clsx(
                        "text-sm font-medium",
                        isChecked || canSelect || isRadioMode ? "text-gray-900" : "text-gray-400"
                      )}>
                        {option.display_name}
                      </span>
                    </div>

                    <span
                      className={clsx(
                        "ml-3 flex h-5 w-5 items-center justify-center transition-colors pointer-events-none flex-shrink-0",
                        isRadioMode
                          ? isChecked
                            ? "rounded-full bg-blue-600 border-2 border-blue-600"
                            : "rounded-full bg-white border-2 border-gray-400"
                          : isChecked
                            ? "rounded-sm bg-blue-600 border border-blue-600 text-white"
                            : "rounded-sm bg-white border border-gray-400 text-transparent"
                      )}
                    >
                      {isRadioMode ? (
                        isChecked && <span className="block w-2 h-2 bg-white rounded-full" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </span>
                  </label>

                  {/* Linked fields that appear when checkbox is selected - supports all input types */}
                  {isChecked && option.linkedFields && option.linkedFields.length > 0 && (
                    <div className="px-3 pb-3 -mt-1">
                      <div className="grid grid-cols-12 gap-x-3 gap-y-2">
                        {option.linkedFields.map((fieldId: string) => {
                          const linkedField = schema.find((schemaItem: SchemaItem) => schemaItem.unique_id === fieldId);
                          if (!linkedField) return null;
                          
                          const linkedInputType = linkedField.display_attributes.input_type;
                          const linkedValue = formResponses[linkedField.unique_id];
                          
                          // Get width from schema item, default to 12 (full width)
                          const fieldWidth = linkedField.display_attributes.width || 12;
                          
                          // Map width to Tailwind classes
                          const getColSpanClass = (width: number) => {
                            const widthMap: Record<number, string> = {
                              1: 'col-span-1',
                              2: 'col-span-2', 
                              3: 'col-span-3',
                              4: 'col-span-4',
                              5: 'col-span-5',
                              6: 'col-span-6',
                              7: 'col-span-7',
                              8: 'col-span-8',
                              9: 'col-span-9',
                              10: 'col-span-10',
                              11: 'col-span-11',
                              12: 'col-span-12'
                            };
                            return widthMap[width] || 'col-span-12';
                          };
                          
                          return (
                            <div key={fieldId} className={clsx(getColSpanClass(fieldWidth), "border-l-2 border-blue-200 pl-3")}>
                              {/* Render different input types */}
                              {(() => {
                                // TEXT INPUT
                                if (linkedInputType === 'text') {
                                  const specialInput = linkedField.display_attributes.special_input;
                                  
                                  // Handle date pickers with Calendar widget (same as normal fields)
                                  if (specialInput?.text?.numbered_date) {
                                    const open = datePickerState.openStates[linkedField.unique_id] || false;
                                    const setOpen = (value: boolean) => {
                                      dispatchDatePicker({ type: 'SET_OPEN', fieldId: linkedField.unique_id, open: value });
                                    };
                                    
                                    const date = linkedValue 
                                      ? new Date(linkedValue as string) 
                                      : undefined;
                                    
                                    const month = datePickerState.months[linkedField.unique_id] || date || new Date();
                                    const setMonth = (value: Date | undefined) => {
                                      if (value) {
                                        dispatchDatePicker({ type: 'SET_MONTH', fieldId: linkedField.unique_id, month: value });
                                      }
                                    };
                                    
                                    const value = datePickerState.values[linkedField.unique_id] || formatNumberedDate(date);
                                    const setValue = (val: string) => {
                                      dispatchDatePicker({ type: 'SET_VALUE', fieldId: linkedField.unique_id, value: val });
                                    };
                                    
                                    // Initialize value if not set
                                    if (!datePickerState.values[linkedField.unique_id] && date) {
                                      dispatchDatePicker({ type: 'INITIALIZE_VALUE', fieldId: linkedField.unique_id, value: formatNumberedDate(date) });
                                    }
                                    
                                    return (
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <label className="text-sm text-gray-600 block">
                                            {linkedField.display_attributes.display_name}
                                            {linkedField.display_attributes.isRequired && (
                                              <span className="text-red-500 ml-0.5">*</span>
                                            )}
                                          </label>
                                          <LinkedFieldStatusIcon fieldId={linkedField.unique_id} />
                                        </div>
                                        <div className="relative flex gap-2">
                                          <Input
                                            id={`date-${linkedField.unique_id}`}
                                            value={value}
                                            placeholder={linkedField.display_attributes.placeholder || "Select date"}
                                            className="bg-background pr-10 text-sm"
                                            onChange={(e) => {
                                              const date = new Date(e.target.value)
                                              setValue(e.target.value)
                                              if (isValidDate(date)) {
                                                handleOptimisticUpdate(linkedField, formatNumberedDate(date), 'date')
                                                setMonth(date)
                                              }
                                            }}
                                            onBlur={() => {
                                              if (isValidDate(new Date(value))) {
                                                handleFieldBlur(linkedField, formatNumberedDate(new Date(value)))
                                              }
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === "ArrowDown") {
                                                e.preventDefault()
                                                setOpen(true)
                                              }
                                            }}
                                            disabled={!can_edit}
                                          />
                                          <Popover open={open} onOpenChange={setOpen}>
                                            <PopoverTrigger asChild>
                                              <Button
                                                id={`date-picker-${linkedField.unique_id}`}
                                                variant="ghost"
                                                className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                                                disabled={!can_edit}
                                              >
                                                <CalendarIcon className="size-3.5" />
                                                <span className="sr-only">Select date</span>
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                              className="w-auto overflow-hidden p-0 z-50"
                                              align="end"
                                              alignOffset={-8}
                                              sideOffset={10}
                                            >
                                              <CalendarWidget
                                                mode="single"
                                                selected={date}
                                                captionLayout="dropdown"
                                                month={month}
                                                onMonthChange={setMonth}
                                                fromYear={1900}
                                                toYear={new Date().getFullYear() + 50}
                                                onSelect={(date) => {
                                                  if (date) {
                                                    const formattedDate = formatNumberedDate(date)
                                                    
                                                    // 1. INSTANT: Close calendar first
                                                    setOpen(false)
                                                    
                                                    // 2. INSTANT: Update display value
                                                    setValue(formattedDate)
                                                    
                                                    // 3. INSTANT: Show loading state
                                                    setSavingItems(prev => new Set(prev).add(linkedField.unique_id))
                                                    
                                                    // 4. DEFERRED: All heavy operations
                                                    queueMicrotask(() => {
                                                      handleOptimisticUpdate(linkedField, formattedDate, 'date')
                                                      handleFieldBlur(linkedField, formattedDate, true)
                                                    })
                                                  } else {
                                                    setOpen(false)
                                                  }
                                                }}
                                              />
                                            </PopoverContent>
                                          </Popover>
                                        </div>
                                      </div>
                                    );
                                  }
                                  
                                  // Handle verbose date pickers with Calendar widget (same as normal fields)
                                  if (specialInput?.text?.date) {
                                    const open = datePickerState.openStates[linkedField.unique_id] || false;
                                    const setOpen = (value: boolean) => {
                                      dispatchDatePicker({ type: 'SET_OPEN', fieldId: linkedField.unique_id, open: value });
                                    };
                                    
                                    const date = linkedValue 
                                      ? new Date(linkedValue as string) 
                                      : undefined;
                                    
                                    const month = datePickerState.months[linkedField.unique_id] || date || new Date();
                                    const setMonth = (value: Date | undefined) => {
                                      if (value) {
                                        dispatchDatePicker({ type: 'SET_MONTH', fieldId: linkedField.unique_id, month: value });
                                      }
                                    };
                                    
                                    const value = datePickerState.values[linkedField.unique_id] || formatDate(date);
                                    const setValue = (val: string) => {
                                      dispatchDatePicker({ type: 'SET_VALUE', fieldId: linkedField.unique_id, value: val });
                                    };
                                    
                                    // Initialize value if not set
                                    if (!datePickerState.values[linkedField.unique_id] && date) {
                                      dispatchDatePicker({ type: 'INITIALIZE_VALUE', fieldId: linkedField.unique_id, value: formatDate(date) });
                                    }
                                    
                                    return (
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <label className="text-sm text-gray-600 block">
                                            {linkedField.display_attributes.display_name}
                                            {linkedField.display_attributes.isRequired && (
                                              <span className="text-red-500 ml-0.5">*</span>
                                            )}
                                          </label>
                                          <LinkedFieldStatusIcon fieldId={linkedField.unique_id} />
                                        </div>
                                        <div className="relative flex gap-2">
                                          <Input
                                            id={`date-${linkedField.unique_id}`}
                                            value={value}
                                            placeholder={linkedField.display_attributes.placeholder || "Select date"}
                                            className="bg-background pr-10 text-sm"
                                            onChange={(e) => {
                                              const date = new Date(e.target.value)
                                              setValue(e.target.value)
                                              if (isValidDate(date)) {
                                                handleOptimisticUpdate(linkedField, formatDate(date), 'date')
                                                setMonth(date)
                                              }
                                            }}
                                            onBlur={() => {
                                              if (isValidDate(new Date(value))) {
                                                handleFieldBlur(linkedField, formatDate(new Date(value)))
                                              }
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === "ArrowDown") {
                                                e.preventDefault()
                                                setOpen(true)
                                              }
                                            }}
                                            disabled={!can_edit}
                                          />
                                          <Popover open={open} onOpenChange={setOpen}>
                                            <PopoverTrigger asChild>
                                              <Button
                                                id={`date-picker-${linkedField.unique_id}`}
                                                variant="ghost"
                                                className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                                                disabled={!can_edit}
                                              >
                                                <CalendarIcon className="size-3.5" />
                                                <span className="sr-only">Select date</span>
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                              className="w-auto overflow-hidden p-0 z-50"
                                              align="end"
                                              alignOffset={-8}
                                              sideOffset={10}
                                            >
                                              <CalendarWidget
                                                mode="single"
                                                selected={date}
                                                captionLayout="dropdown"
                                                month={month}
                                                onMonthChange={setMonth}
                                                fromYear={1900}
                                                toYear={new Date().getFullYear() + 50}
                                                onSelect={(date) => {
                                                  if (date) {
                                                    const formattedDate = formatDate(date)
                                                    
                                                    // 1. INSTANT: Close calendar first
                                                    setOpen(false)
                                                    
                                                    // 2. INSTANT: Update display value
                                                    setValue(formattedDate)
                                                    
                                                    // 3. INSTANT: Show loading state
                                                    setSavingItems(prev => new Set(prev).add(linkedField.unique_id))
                                                    
                                                    // 4. DEFERRED: All heavy operations
                                                    queueMicrotask(() => {
                                                      handleOptimisticUpdate(linkedField, formattedDate, 'date')
                                                      handleFieldBlur(linkedField, formattedDate, true)
                                                    })
                                                  } else {
                                                    setOpen(false)
                                                  }
                                                }}
                                              />
                                            </PopoverContent>
                                          </Popover>
                                        </div>
                                      </div>
                                    );
                                  }
                                  
                                  // Handle other text input types (non-date)
                                  const inputType = specialInput?.text?.email ? 'email' :
                                                   specialInput?.text?.url ? 'url' :
                                                   specialInput?.text?.phone ? 'tel' :
                                                   specialInput?.text?.number ? 'number' : 'text';
                                  
                                  return (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <label className="text-sm text-gray-600 block">
                                          {linkedField.display_attributes.display_name}
                                          {linkedField.display_attributes.isRequired && (
                                            <span className="text-red-500 ml-0.5">*</span>
                                          )}
                                        </label>
                                        <LinkedFieldStatusIcon fieldId={linkedField.unique_id} />
                                      </div>
                                      <Input
                                        type={inputType}
                                        value={(formResponses[linkedField.unique_id] as string) || ""}
                                        onChange={(e) => handleOptimisticUpdate(linkedField, e.target.value, 'text')}
                                        onBlur={(e) => handleFieldBlur(linkedField, e.target.value)}
                                        disabled={!can_edit}
                                        placeholder={linkedField.display_attributes.placeholder || 'Enter value'}
                                        className="text-sm bg-white"
                                      />
                                    </div>
                                  );
                                }
                                
                                // TEXT AREA
                                if (linkedInputType === 'text-area') {
                                  return (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <label className="text-sm text-gray-600 block">
                                          {linkedField.display_attributes.display_name}
                                          {linkedField.display_attributes.isRequired && (
                                            <span className="text-red-500 ml-0.5">*</span>
                                          )}
                                        </label>
                                        <LinkedFieldStatusIcon fieldId={linkedField.unique_id} />
                                      </div>
                                      <textarea
                                        value={linkedValue as string || ''}
                                        onChange={(e) => handleOptimisticUpdate(linkedField, e.target.value, 'text')}
                                        onBlur={(e) => handleFieldBlur(linkedField, e.target.value)}
                                        disabled={!can_edit}
                                        placeholder={linkedField.display_attributes.placeholder}
                                        rows={2}
                                        className={clsx(
                                          "w-full px-2 py-1 text-sm rounded-md border bg-white transition-colors resize-none",
                                          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                                          can_edit
                                            ? "border-gray-300 text-gray-900"
                                            : "border-gray-200 text-gray-500 cursor-not-allowed bg-gray-50"
                                        )}
                                      />
                                    </div>
                                  );
                                }
                                
                                // RADIO
                                if (linkedInputType === 'radio') {
                                  const radioOptions = linkedField.display_attributes.display_radio_options || [];
                                  const radioLayout = linkedField.display_attributes.special_input?.radio?.layout || 'horizontal';
                                  const radioColumns = linkedField.display_attributes.special_input?.radio?.columns || 1;
                                  
                                  return (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <label className="text-sm text-gray-600 block">
                                          {linkedField.display_attributes.display_name}
                                          {linkedField.display_attributes.isRequired && (
                                            <span className="text-red-500 ml-0.5">*</span>
                                          )}
                                        </label>
                                        <LinkedFieldStatusIcon fieldId={linkedField.unique_id} />
                                      </div>
                                      <div 
                                        className={
                                          radioLayout === 'grid' ? "grid gap-2" :
                                          radioLayout === 'horizontal' ? "flex flex-wrap gap-3" :
                                          "space-y-2"
                                        }
                                        style={radioLayout === 'grid' ? { 
                                          gridTemplateColumns: `repeat(${radioColumns}, 1fr)`
                                        } : undefined}
                                      >
                                        {radioOptions.map((radioOption, idx) => (
                                          <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                              type="radio"
                                              name={linkedField.unique_id}
                                              value={radioOption}
                                              checked={linkedValue === radioOption}
                                              onChange={(e) => handleOptimisticUpdate(linkedField, e.target.value, 'text')}
                                              onBlur={() => handleFieldBlur(linkedField, linkedValue as string || '')}
                                              disabled={!can_edit}
                                              className={clsx(
                                                "h-4 w-4 border-gray-300 focus:ring-2 focus:ring-blue-500",
                                                can_edit ? "text-blue-600" : "text-gray-400"
                                              )}
                                            />
                                            <span className={clsx(
                                              "text-sm font-medium",
                                              can_edit ? "text-gray-900 group-hover:text-gray-700" : "text-gray-500"
                                            )}>{radioOption}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                                
                                // NESTED CHECKBOX
                                if (linkedInputType === 'checkbox') {
                                  const checkboxOptions = linkedField.display_attributes.checkbox_options?.options || [];
                                  const currentSelections = Array.isArray(linkedValue) ? linkedValue as string[] : [];
                                  const horizontalColumns = linkedField.display_attributes.special_input?.checkbox?.horizontal || 1;
                                  const isHorizontal = horizontalColumns > 1;
                                  const isRadioMode = linkedField.display_attributes.special_input?.checkbox?.asRadio;
                                  const maxSelected = linkedField.display_attributes.checkbox_options?.maxSelected;
                                  
                                  return (
                                    <div className="space-y-1">
                                      <label className="text-sm text-gray-600 block">
                                        {linkedField.display_attributes.display_name}
                                        {linkedField.display_attributes.isRequired && (
                                          <span className="text-red-500 ml-0.5">*</span>
                                        )}
                                      </label>
                                      <div 
                                        className={isHorizontal ? "grid gap-2" : "space-y-2"}
                                        style={isHorizontal ? { 
                                          gridTemplateColumns: `repeat(${horizontalColumns}, 1fr)`,
                                          gridAutoRows: '1fr'
                                        } : undefined}
                                      >
                                        {checkboxOptions.map((checkOpt, idx) => {
                                          const isChecked = currentSelections.includes(checkOpt.databaseStored);
                                          const canSelect = !isChecked && (!maxSelected || currentSelections.length < maxSelected);
                                          
                                          return (
                                            <div 
                                              key={idx}
                                              className={clsx(
                                                "border rounded-md transition-all text-xs",
                                                isHorizontal && "h-full flex flex-col",
                                                isChecked
                                                  ? "border-blue-300 bg-blue-50 shadow-sm"
                                                  : canSelect
                                                  ? "hover:bg-gray-50 border-gray-200"
                                                  : "border-gray-200 bg-gray-50 opacity-50",
                                                !can_edit && "opacity-70"
                                              )}
                                            >
                                              <label className={clsx(
                                                "relative flex items-center justify-between p-2 cursor-pointer",
                                                isHorizontal && "flex-1"
                                              )}>
                                                {/* Invisible input */}
                                                <input
                                                  type={isRadioMode ? "radio" : "checkbox"}
                                                  name={isRadioMode ? linkedField.unique_id : undefined}
                                                  checked={isChecked}
                                                  onChange={(e) => {
                                                    let newSelections: string[];
                                                    
                                                    if (isRadioMode) {
                                                      newSelections = e.target.checked ? [checkOpt.databaseStored] : [];
                                                    } else {
                                                      if (e.target.checked) {
                                                        if (maxSelected === 1) {
                                                          newSelections = [checkOpt.databaseStored];
                                                        } else if (!maxSelected || currentSelections.length < maxSelected) {
                                                          newSelections = [...currentSelections, checkOpt.databaseStored];
                                                        } else {
                                                          return;
                                                        }
                                                      } else {
                                                        newSelections = currentSelections.filter(val => val !== checkOpt.databaseStored);
                                                      }
                                                    }
                                                    
                                                    handleOptimisticUpdate(linkedField, newSelections, 'checkbox');
                                                  }}
                                                  onBlur={() => handleFieldBlur(linkedField, currentSelections)}
                                                  disabled={!can_edit || (!isChecked && !canSelect && !isRadioMode)}
                                                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                />
                                                
                                                {/* Visual content */}
                                                <div className="flex-1 min-w-0 pointer-events-none">
                                                  <span className={clsx(
                                                    "text-xs font-medium",
                                                    isChecked || canSelect || isRadioMode ? "text-gray-900" : "text-gray-400"
                                                  )}>
                                                    {checkOpt.display_name}
                                                  </span>
                                                </div>
                                                
                                                <span
                                                  className={clsx(
                                                    "ml-2 flex h-4 w-4 items-center justify-center transition-colors pointer-events-none flex-shrink-0",
                                                    isRadioMode
                                                      ? isChecked
                                                        ? "rounded-full bg-blue-600 border-2 border-blue-600"
                                                        : "rounded-full bg-white border-2 border-gray-400"
                                                      : isChecked
                                                        ? "rounded-sm bg-blue-600 border border-blue-600 text-white"
                                                        : "rounded-sm bg-white border border-gray-400 text-transparent"
                                                  )}
                                                >
                                                  {isRadioMode ? (
                                                    isChecked && <span className="block w-1.5 h-1.5 bg-white rounded-full" />
                                                  ) : (
                                                    <Check className="h-3 w-3" />
                                                  )}
                                                </span>
                                              </label>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                }
                                
                                // INFO
                                if (linkedInputType === 'info') {
                                  const style = linkedField.display_attributes.special_input?.info?.style || 'default';
                                  const isMinimized = minimizedInfoItems.has(linkedField.unique_id);
                                  
                                  const infoIcons = {
                                    default: Info,
                                    warning: AlertCircle,
                                    error: AlertCircle,
                                    success: Check,
                                    tip: Info,
                                    minimal: Info,
                                    compact: Info,
                                    subtle: Info,
                                    inline: Info
                                  };
                                  
                                  const IconComponent = infoIcons[style] || Info;
                                  
                                  return (
                                    <div className={clsx(
                                      "rounded-md transition-all",
                                      style === 'minimal' && "bg-gray-50 text-gray-700 p-3",
                                      style === 'subtle' && "bg-gray-100 text-gray-700 p-3",
                                      style === 'compact' && "bg-blue-50 text-blue-900 border border-blue-200 p-3",
                                      style === 'warning' && "bg-yellow-50 text-yellow-900 border border-yellow-200 p-3",
                                      style === 'error' && "bg-red-50 text-red-900 border border-red-200 p-3",
                                      style === 'success' && "bg-green-50 text-green-900 border border-green-200 p-3",
                                      style === 'tip' && "bg-purple-50 text-purple-900 border border-purple-200 p-3",
                                      style === 'inline' && "bg-blue-50 text-blue-800 px-2 py-1 inline-block",
                                      style === 'default' && "bg-blue-100 text-blue-900 border border-blue-300 p-4"
                                    )}>
                                      <div className="flex items-start gap-3">
                                        {linkedField.display_attributes.special_input?.info?.icon !== false && (
                                          <IconComponent className={clsx(
                                            "flex-shrink-0 mt-0.5",
                                            style === 'inline' ? "h-4 w-4" : "h-5 w-5",
                                            style === 'warning' && "text-yellow-600",
                                            style === 'error' && "text-red-600",
                                            style === 'success' && "text-green-600",
                                            style === 'tip' && "text-purple-600"
                                          )} />
                                        )}
                                        <div className="flex-1 space-y-1">
                                          {linkedField.display_attributes.display_name && (
                                            <div className="font-semibold text-sm">{linkedField.display_attributes.display_name}</div>
                                          )}
                                          {!isMinimized && linkedField.display_attributes.description && (
                                            <div className="text-sm leading-relaxed">{linkedField.display_attributes.description}</div>
                                          )}
                                        </div>
                                        {linkedField.display_attributes.special_input?.info?.minimizable && (
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setMinimizedInfoItems((prev: Set<string>) => {
                                                const newSet = new Set(prev);
                                                if (isMinimized) {
                                                  newSet.delete(linkedField.unique_id);
                                                } else {
                                                  newSet.add(linkedField.unique_id);
                                                }
                                                return newSet;
                                              });
                                            }}
                                            className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                                            type="button"
                                          >
                                            {isMinimized ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                
                                // Default fallback for unsupported types
                                return (
                                  <div className="text-sm text-gray-500">
                                    Linked {linkedInputType} field not supported in compact view
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  </div>
                );
              };
              
              return (
                <div className="space-y-3">
                  {/* General title for all checkboxes - always show even if display_name is blank */}
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {item.display_attributes.display_name && (
                          <Tooltip
                            disableHoverableContent={!truncatedLabels[item.unique_id]}
                          >
                            <TooltipTrigger asChild>
                              <Label
                                ref={(el) => {
                                  labelRefs.current[item.unique_id] = el;
                                }}
                                className="text-sm font-medium text-gray-900 flex items-center gap-1"
                              >
                                <span>{item.display_attributes.display_name}</span>
                                {item.display_attributes.isRequired && (
                                  <span className="text-red-500">*</span>
                                )}
                              </Label>
                            </TooltipTrigger>
                            {truncatedLabels[item.unique_id] && (
                              <TooltipContent side="top" className="max-w-xs break-words">
                                {item.display_attributes.display_name}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        )}
                        
                        {/* Selection requirements info icon inline with display name */}
                        {(item.display_attributes.checkbox_options?.minSelected || 
                          item.display_attributes.checkbox_options?.maxSelected || 
                          isRadioMode) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-help ml-1"
                              >
                                <Info className="h-3 w-3 text-gray-500" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-center">
                              <p>
                                {(() => {
                                  if (isRadioMode) {
                                    return "Please choose one option";
                                  }
                                  const minSelected = item.display_attributes.checkbox_options?.minSelected || 0;
                                  const maxSelected = item.display_attributes.checkbox_options?.maxSelected;
                                  
                                  if (maxSelected === 1) {
                                    return "Please choose 1";
                                  } else if (maxSelected) {
                                    return `Please choose at least ${minSelected} and at most ${maxSelected}`;
                                  } else {
                                    return `Please choose at least ${minSelected}`;
                                  }
                                })()}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <StatusIcon />
                    </div>
                    {item.display_attributes.description && (
                      <p className="text-xs text-gray-600 leading-tight mt-0.5">
                        {item.display_attributes.description}
                      </p>
                    )}
                  </div>

                  {/* Checkbox/Radio options with horizontal layout support */}
                  {horizontalColumns > 1 && options.length > 1 ? (
                    <div 
                      className="grid gap-3" 
                      style={{ 
                        gridTemplateColumns: `repeat(${horizontalColumns}, 1fr)`,
                        gridAutoRows: '1fr' 
                      }}
                    >
                      {options.map((option, index) => (
                        <div key={`${item.unique_id}-${index}`} className="h-full">
                          {renderOption(option, index, true)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Vertical layout (default)
                    options.map((option, index) => renderOption(option, index, false))
                  )}
                </div>
              );
            })()
          )}

          {/* -------------- INFO TYPE ------------------- */}
          {input_type === "info" && (
            (() => {
              const specialInput = item.display_attributes.special_input;
              const style = specialInput?.info?.style || 'default';
              const showIcon = specialInput?.info?.icon !== false;
              const isMinimizable = specialInput?.info?.minimizable;
              const isMinimized = minimizedInfoItems.has(item.unique_id);
              
              const styleConfigs = {
                default: {
                  container: "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200",
                  iconBg: "bg-blue-500",
                  iconColor: "text-white",
                  titleColor: "text-blue-900",
                  textColor: "text-blue-800",
                  icon: Info,
                  padding: "p-4",
                  iconSize: "h-5 w-5",
                  iconPadding: "p-2"
                },
                subtle: {
                  container: "bg-gray-50 border border-gray-200",
                  iconBg: "",
                  iconColor: "text-gray-500",
                  titleColor: "text-gray-700",
                  textColor: "text-gray-600",
                  icon: Info,
                  padding: "p-3",
                  iconSize: "h-4 w-4",
                  iconPadding: ""
                },
                minimal: {
                  container: "border-l-4 border-blue-400 pl-3",
                  iconBg: "",
                  iconColor: "text-blue-500",
                  titleColor: "text-gray-700",
                  textColor: "text-gray-600 text-sm",
                  icon: Info,
                  padding: "py-2",
                  iconSize: "h-4 w-4",
                  iconPadding: ""
                },
                inline: {
                  container: "bg-gray-50/50 rounded",
                  iconBg: "",
                  iconColor: "text-gray-400",
                  titleColor: "text-gray-700",
                  textColor: "text-gray-600 text-sm",
                  icon: Info,
                  padding: "px-3 py-1.5",
                  iconSize: "h-3.5 w-3.5",
                  iconPadding: ""
                },
                compact: {
                  container: "",
                  iconBg: "",
                  iconColor: "text-gray-400",
                  titleColor: "text-gray-600 text-sm font-medium",
                  textColor: "text-gray-500 text-xs",
                  icon: Info,
                  padding: "py-1",
                  iconSize: "h-3 w-3",
                  iconPadding: ""
                },
                warning: {
                  container: "bg-amber-50 border border-amber-200",
                  iconBg: "",
                  iconColor: "text-amber-600",
                  titleColor: "text-amber-900",
                  textColor: "text-amber-700",
                  icon: AlertCircle,
                  padding: "p-3",
                  iconSize: "h-4 w-4",
                  iconPadding: ""
                },
                success: {
                  container: "bg-green-50 border border-green-200",
                  iconBg: "",
                  iconColor: "text-green-600",
                  titleColor: "text-green-900",
                  textColor: "text-green-700",
                  icon: Check,
                  padding: "p-3",
                  iconSize: "h-4 w-4",
                  iconPadding: ""
                },
                error: {
                  container: "bg-red-50 border border-red-200",
                  iconBg: "",
                  iconColor: "text-red-600",
                  titleColor: "text-red-900",
                  textColor: "text-red-700",
                  icon: X,
                  padding: "p-3",
                  iconSize: "h-4 w-4",
                  iconPadding: ""
                },
                tip: {
                  container: "border-l-4 border-orange-400 bg-orange-50/50 pl-3",
                  iconBg: "",
                  iconColor: "text-orange-600",
                  titleColor: "text-orange-900 text-sm",
                  textColor: "text-orange-700 text-sm",
                  icon: Info,
                  padding: "py-2 pr-3",
                  iconSize: "h-4 w-4",
                  iconPadding: ""
                }
              };
              
              const config = styleConfigs[style] || styleConfigs.default;
              const IconComponent = config.icon;
              
              // Minimized version
              if (isMinimized) {
                return (
                  <div className={clsx(
                    "relative flex items-center gap-2 py-1.5 px-3 rounded cursor-pointer",
                    "bg-gray-50 hover:bg-gray-100 transition-colors",
                    config.container && config.container.includes('border-l-4') ? config.container : ""
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMinimizedInfoItems(prev => {
                      const newArray = Array.from(prev);
                      return new Set(newArray.filter(id => id !== item.unique_id));
                    });
                  }}>
                    {showIcon && (
                      <IconComponent className={clsx("h-3.5 w-3.5", config.iconColor)} />
                    )}
                    <span className={clsx("text-sm", config.titleColor)}>
                      {item.display_attributes.display_name || "Click to expand"}
                    </span>
                    <ChevronRight className="h-3 w-3 text-gray-400 ml-auto" />
                  </div>
                );
              }
              
              // Full version
              return (
                <div className={clsx(
                  "relative",
                  config.container && "rounded-lg",
                  config.padding,
                  config.container
                )}>
                  <div className={clsx(
                    "flex gap-2",
                    ['minimal', 'inline', 'compact'].includes(style) ? 'items-center' : 'items-start'
                  )}>
                    {showIcon && (
                      <div className={clsx(
                        "flex-shrink-0",
                        config.iconPadding && "rounded-lg",
                        config.iconBg,
                        config.iconPadding
                      )}>
                        <IconComponent className={clsx(config.iconSize, config.iconColor)} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {item.display_attributes.display_name && (
                        <h3 className={clsx(
                          "leading-tight",
                          ['inline', 'compact'].includes(style) ? "" : "font-bold",
                          ['minimal', 'inline', 'compact', 'tip'].includes(style) ? "" : "mb-1",
                          config.titleColor
                        )}>
                          {item.display_attributes.display_name}
                        </h3>
                      )}
                      {item.display_attributes.description && (
                        <p className={clsx(
                          "leading-snug",
                          config.textColor
                        )}>
                          {item.display_attributes.description}
                        </p>
                      )}
                      {(formResponses[item.unique_id] as string) && (
                        <div className={clsx(
                          "mt-2 p-2 rounded text-xs text-gray-700",
                          "bg-gray-50 border border-gray-200"
                        )}>
                          {formResponses[item.unique_id] as string}
                        </div>
                      )}
                    </div>
                    {isMinimizable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMinimizedInfoItems((prev: Set<string>) => {
                            const newArray = Array.from(prev);
                            if (!newArray.includes(item.unique_id)) {
                              newArray.push(item.unique_id);
                            }
                            return new Set(newArray);
                          });
                        }}
                        className={clsx(
                          "flex-shrink-0 p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors",
                          config.textColor
                        )}
                      >
                        <ChevronDown className={clsx(
                          ['compact', 'inline'].includes(style) ? "h-3 w-3" : "h-3.5 w-3.5"
                        )} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()
          )}

          {/* -------------- UNKNOWN TYPE --------------- */}
          {![
            "radio",
            "checkbox",
            "text",
            "text-area",
            "info",
            "signature",
            "fileUpload",
          ].includes(input_type) && (
            <div className="text-red-500">Input type improperly defined</div>
          )}
        </div>
      );
    },
    [
      formResponses,
      savingItems,
      savedItems,
      truncatedLabels,
      checkFieldVisibility,
      handleFieldChange,
      handleFieldBlur,
      can_edit,
      dealId,
      dealOptionId,
      handlePartySelection,
      loadPartyOptions,
      loadingParties,
      partyOptions,
      openSelectId,
      setOpenSelectId,
      uploadingFields,
      setUploadingFields,
      fileInputCounts,
      setFileInputCounts,
      fieldFiles,
      setFieldFiles,
      handleFileChange,
      addFileToField,
      removeFileFromField,
      clientIntakeWillSend,
      editingClientIntakeFields,
      setEditingClientIntakeFields,
      datePickerState,
      dispatchDatePicker,
    ]
  );

  // Helper to render fields with proper breakBefore handling
  const renderFieldsWithBreaks = useCallback(
    (items: SchemaItem[], showClientIntakePlaceholder: boolean = false) => {
      const elements: React.ReactNode[] = [];
      let currentRowItems: React.ReactNode[] = [];
      
      // Create a set of all linked field IDs for efficient lookup
      const linkedFieldIds = new Set<string>();
      schema.forEach(schemaItem => {
        if (schemaItem.display_attributes.input_type === 'checkbox' && 
            schemaItem.display_attributes.checkbox_options?.options) {
          schemaItem.display_attributes.checkbox_options.options.forEach(option => {
            option.linkedFields?.forEach(fieldId => linkedFieldIds.add(fieldId));
          });
        }
      });
      
      items.forEach((item) => {
        const visible = checkFieldVisibility(item);
        if (!visible) return;
        
        // Skip fields that are linked to checkboxes (they'll be rendered inside the checkbox)
        if (linkedFieldIds.has(item.unique_id)) return;

        // If this item has breakBefore and we have items in current row, close the row
        if (item.display_attributes.breakBefore && currentRowItems.length > 0) {
          elements.push(
            <div key={`row-${elements.length}`} className="grid grid-cols-12 gap-x-4 gap-y-3">
              {currentRowItems}
            </div>
          );
          currentRowItems = [];
        }

        // Add the current field to the row
        currentRowItems.push(renderField(item, showClientIntakePlaceholder));
      });

      // Add any remaining items in the last row
      if (currentRowItems.length > 0) {
        elements.push(
          <div key={`row-${elements.length}`} className="grid grid-cols-12 gap-x-4 gap-y-3">
            {currentRowItems}
          </div>
        );
      }

      return elements;
    },
    [checkFieldVisibility, renderField, schema]
  );

  /* -------------------------- skeleton ---------------------------- */
  const LoadingSkeleton = useCallback(
    () => (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-md p-4 space-y-3">
            <div className="h-5 w-1/3 rounded bg-gray-200 animate-pulse" />
            <div className="h-10 w-full rounded bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>
    ),
    []
  );

  /* --------------------------- render ----------------------------- */
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Form Progress Indicator */}
      {showProgress && formProgress && (
        <FormProgressIndicator
          progress={formProgress}
          showMissingFields={true}
          title="Form Completion"
        />
      )}

      <div className="space-y-6" ref={containerRef}>
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Render ungrouped items (no blocks) with proper breakBefore handling */}
            {groupedSchema.ungroupedItems.length > 0 && (
              <div className="space-y-4">
                {(() => {
                  // Check if any ungrouped items have client intake content
                  const hasClientIntakeContent = groupedSchema.ungroupedItems.some((item) =>
                    clientIntakeWillSend.includes(item.unique_id)
                  );
                  return renderFieldsWithBreaks(groupedSchema.ungroupedItems, hasClientIntakeContent);
                })()}
              </div>
            )}

            {/* Render grouped items (with blocks) in cards */}
            {visibleGroupedSchema.length === 0 &&
            groupedSchema.ungroupedItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No fields or questions found in this form.</p>
              </div>
            ) : (
              visibleGroupedSchema.map((group, index) => {
                const theme = getBlockTheme(group, index);
                const IconComponent = getBlockIcon(group);

                // Check if this group has any client intake fields
                const hasClientIntakeInGroup = group.items.some((item) =>
                  clientIntakeWillSend.includes(item.unique_id)
                );

                return (
                  <Card
                    key={group.id}
                    className={clsx(
                      "border-l-4 shadow-lg pt-0", // <-- remove top padding
                      theme.border
                    )}
                  >
                    {/* Enhanced Header with Icon and Theme */}
                    {(group.name || group.style) && (
                      <div
                        className={clsx("p-4 pb-2 rounded-t-lg", theme.header)}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={clsx(
                              "p-3 rounded-lg bg-white shadow-sm"
                            )}
                          >
                            <IconComponent
                              className={clsx("h-6 w-6", theme.icon)}
                            />
                          </div>
                          <div className="flex-1">
                            <h2
                              className={clsx(
                                "text-xl font-bold",
                                theme.text,
                                "mb-1"
                              )}
                            >
                              {group.style?.title ||
                                formatBlockName(group.name || "Form Section")}
                            </h2>
                            {group.style?.description && (
                              <p
                                className={clsx(
                                  "text-sm opacity-80",
                                  theme.text
                                )}
                              >
                                {group.style.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Grid with Tighter Spacing and breakBefore support */}
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-3">
                        {renderFieldsWithBreaks(group.items, hasClientIntakeInGroup)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </>
        )}
      </div>

      <AddPartyModal
        isOpen={isAddPartyModalOpen}
        onClose={() => setIsAddPartyModalOpen(false)}
        onPartyAdded={handlePartyAdded}
        dealId={dealId}
        dealOptionId={dealOptionId || ""}
        dealOptionName={dealOptionName}
      />
    </div>
  );
};

export default React.memo(FormInput);
