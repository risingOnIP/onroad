"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { Rnd } from "react-rnd";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Type,
  FileSignature,
  Calendar,
  Check,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Download,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFFormField, ClientIntake } from "../types/realtor";
import { getClientIntakesByDealId } from "@/app/actions/realtor/client-intake-actions";
import { useGroupStore } from "./stores/groupSelectionStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPdfWithOverlays,
  createPdfWithOverlaysAndForm,
  savePdfFieldMetadata,
  loadPdfFieldMetadata,
  type PdfOverlayData,
  type TextFieldOverlay,
  type CheckmarkOverlay,
  type DateFieldOverlay,
  type SignatureFieldOverlay,
} from "@/app/actions/realtor/deal-option-actions";
import AddPartyModal from "./AddPartyModal";

// Configure PDF.js worker with more reliable source
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PDFFormEditorProps {
  pdfUrl: string;
  dealId: string;
  formId: string; // For saving with form integration
  formType: string; // For custom form type when saving with overlays
  initialFields: PDFFormField[];
  onFieldsChange: (fields: PDFFormField[]) => void;
  onSave: (fields: PDFFormField[]) => Promise<void>; // Save metadata only
  onSaveWithOverlays: (pdfId: string, formId?: string) => Promise<void>; // Generate PDF with overlays
  canEdit: boolean;
  isLoading: boolean;
  hasCustomSchema?: boolean; // Indicates if the form PDF already includes signature fields
  dealSide?: string; // Deal side for proper party role selection
  dealOptionName?: string; // Deal option name for determining party assignment
}

interface SignatureDialogData {
  displayName: string;
  recipient: string;
  actionAs: "signer" | "delegator";
  x: number;
  y: number;
  isEditing?: boolean;
  fieldId?: string;
  // Store container bounds and scale at drag time for accurate positioning
  containerBounds?: DOMRect;
  dragScale?: number;
}

const FIELD_TYPES = [
  {
    type: "signature",
    icon: FileSignature,
    label: "Signature Field",
    color: "bg-green-100 border-green-300",
  },
  {
    type: "date",
    icon: Calendar,
    label: "Date Field",
    color: "bg-purple-100 border-purple-300",
  },
  {
    type: "text",
    icon: Type,
    label: "Static Tsdfext",
    color: "bg-blue-100 border-blue-300",
  },
  {
    type: "checkmark",
    icon: Check,
    label: "Checkmark",
    color: "bg-orange-100 border-orange-300",
  },
] as const;

const DEFAULT_FIELD_DIMENSIONS = {
  signature: { width: 250, height: 60 },
  date: { width: 150, height: 32 },
  text: { width: 100, height: 24 },
  checkmark: { width: 24, height: 24 },
};

// Draggable field type component
function DraggableFieldType({
  type,
  icon: Icon,
  label,
  color,
}: {
  type: string;
  icon: React.ComponentType<any>;
  label: string;
  color: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: type,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "p-3 rounded-lg border-2 border-dashed cursor-grab active:cursor-grabbing flex items-center gap-2 hover:shadow-md transition-shadow",
        color,
        isDragging && "opacity-50"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

// PDF drop zone component
function PDFDropZone({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: "pdf-drop-zone",
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative",
        isOver && "ring-2 ring-blue-400 ring-opacity-50"
      )}
    >
      {children}
    </div>
  );
}

export default function PDFFormEditor({
  pdfUrl,
  dealId,
  formId,
  formType,
  initialFields = [],
  onFieldsChange,
  onSave,
  onSaveWithOverlays,
  canEdit = true,
  isLoading = false,
  hasCustomSchema = false,
  dealSide = "buy",
  dealOptionName = "deal-wide",
}: PDFFormEditorProps) {
  const [fields, setFields] = useState<PDFFormField[]>(initialFields);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  // Group/selection store
  const {
    selectedIds,
    toggleSelect,
    marqueeSelect,
    setSelection,
    clearSelection,
    groupName,
    groupDescription,
    setGroupName,
    setGroupDescription,
    addSelectedToGroup,
    removeSelectedFromGroup,
    groupFieldIds,
  } = useGroupStore();
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [showFieldLabels, setShowFieldLabels] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [signatureDialog, setSignatureDialog] =
    useState<SignatureDialogData | null>(null);
  const [dealClients, setDealClients] = useState<ClientIntake[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState<boolean>(false);
  const [pdfDimensions, setPdfDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 595, height: 842 });
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState<boolean>(false);

  // Marquee selection state (coords are in CSS pixels of the scaled container)
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const lastInitialFieldsRef = useRef<string>("");
  const lastNotifiedFieldsRef = useRef<string>("");
  const textInputRef = useRef<HTMLInputElement>(null);
  const shouldSelectTextRef = useRef<boolean>(false);
  const signatureDialogBeforeAddParty = useRef<SignatureDialogData | null>(null);

  // Override canEdit if form has custom schema (PDF already includes signature fields)
  const effectiveCanEdit = canEdit && !hasCustomSchema;

  // Function to fetch deal clients
  const fetchDealClients = useCallback(async () => {
    if (!dealId) return;
    
    try {
      setIsLoadingClients(true);
      const fetchedClients = await getClientIntakesByDealId(dealId);
      setDealClients(fetchedClients);
    } catch (error) {
      console.error("Error fetching deal clients:", error);
      toast.error("Failed to load deal clients");
    } finally {
      setIsLoadingClients(false);
    }
  }, [dealId]);

  // Fetch deal-specific clients on component mount
  useEffect(() => {
    fetchDealClients();
  }, [fetchDealClients]);

  // Handle party added callback
  const handlePartyAdded = useCallback(async () => {
    setIsAddPartyModalOpen(false);
    // Refresh the deal clients list
    await fetchDealClients();
    toast.success("Party added successfully");
    
    // Reopen the signature dialog if it was previously open
    if (signatureDialogBeforeAddParty.current) {
      setSignatureDialog(signatureDialogBeforeAddParty.current);
      signatureDialogBeforeAddParty.current = null;
    }
  }, [fetchDealClients]);

  // Load saved field metadata and handle form switching
  useEffect(() => {
    const loadSavedFields = async () => {
      if (!formId) return;

      try {
        const savedFields = await loadPdfFieldMetadata(formId);
        
        
        if (savedFields && savedFields.length > 0) {
          
          // Ensure all fields have proper coordinate system - they should already be in UI pixel coordinates
          const normalizedFields = savedFields.map((field: PDFFormField, index: number) => {
            const originalField = {
              x: field.x,
              y: field.y,
              width: field.width,
              height: field.height,
              page: field.page
            };
            
            const normalizedField = {
              ...field,
              // Ensure coordinates are numbers and properly bounded
              x: Math.max(0, Number(field.x) || 0),
              y: Math.max(0, Number(field.y) || 0), 
              width: Math.max(20, Number(field.width) || 100),
              height: Math.max(20, Number(field.height) || 32),
              page: Number(field.page) || 1,
            };
            
            
            return normalizedField;
          });
          
          setFields(normalizedFields);
        } else {
          // Clear fields if no saved data exists
          setFields([]);
        }
      } catch (error) {
        console.error("[LOAD] Error loading saved field metadata:", error);
        // Clear fields on error to prevent inheritance
        setFields([]);
      }
    };

    // Clear state when formId changes (prevents field inheritance)
    setFields([]);
    setSelectedField(null);
    
    // Load saved fields if formId exists
    if (formId) {
      loadSavedFields();
    }
  }, [formId]); // Only depend on formId

  // Sync with initial fields when they change (separate from loading)
  useEffect(() => {
    const initialFieldsString = JSON.stringify(initialFields);
    if (initialFieldsString !== lastInitialFieldsRef.current && initialFields.length > 0) {
      lastInitialFieldsRef.current = initialFieldsString;
      setFields(initialFields);
    }
  }, [initialFields]);

  // Notify parent when fields change (with debouncing to prevent excessive calls)
  useEffect(() => {
    const fieldsString = JSON.stringify(fields);
    if (fieldsString !== lastNotifiedFieldsRef.current && onFieldsChange) {
      lastNotifiedFieldsRef.current = fieldsString;
      onFieldsChange(fields);
    }
  }, [fields, onFieldsChange]);

  // Focus text input when a text field is selected
  useEffect(() => {
    if (selectedField && textInputRef.current) {
      const selectedFieldData = fields.find((f) => f.id === selectedField);
      if (selectedFieldData?.type === "text") {
        // Mark that we should select text on first focus
        shouldSelectTextRef.current = true;
        // Use setTimeout to ensure the input is rendered before focusing
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 10);
      }
    }
  }, [selectedField, fields]);

  const handleDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
    },
    []
  );

  // Handle PDF page render success to get actual dimensions
  const handlePageRenderSuccess = useCallback((page: any) => {
    // Get page dimensions from the PDF page viewport
    if (page && page.getViewport) {
      const viewport = page.getViewport({ scale: 1.0 }); // Always use scale 1.0 for base dimensions
      setPdfDimensions({
        width: viewport.width,
        height: viewport.height,
      });
    }
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggedType(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event;
      setDraggedType(null);

      if (!over || over.id !== "pdf-drop-zone" || !pdfContainerRef.current || !effectiveCanEdit)
        return;

      const rect = pdfContainerRef.current.getBoundingClientRect();
      const activatorEvent = event.activatorEvent as any;

      // Calculate coordinates relative to the PDF page, accounting for scale
      let x =
        activatorEvent && "clientX" in activatorEvent
          ? (activatorEvent.clientX - rect.left + (delta?.x || 0)) / scale
          : 100;
      let y =
        activatorEvent && "clientY" in activatorEvent
          ? (activatorEvent.clientY - rect.top + (delta?.y || 0)) / scale
          : 100;

      if (FIELD_TYPES.find((ft) => ft.type === active.id)) {
        const fieldType = active.id as PDFFormField["type"];
        
        // Get default dimensions for the field type
        const defaultDimensions =
          DEFAULT_FIELD_DIMENSIONS[
            fieldType as keyof typeof DEFAULT_FIELD_DIMENSIONS
          ];

        // Constrain coordinates to ensure field stays within PDF bounds
        const maxX = pdfDimensions.width - defaultDimensions.width;
        const maxY = pdfDimensions.height - defaultDimensions.height;
        
        x = Math.max(0, Math.min(x, maxX));
        y = Math.max(0, Math.min(y, maxY));

        // Special handling for signature fields
        if (fieldType === "signature") {
          // Store the PDF container bounds to ensure consistent positioning
          const pdfContainer = pdfContainerRef.current;
          if (pdfContainer) {
            const containerRect = pdfContainer.getBoundingClientRect();
            
            setSignatureDialog({
              displayName: "",
              recipient: "",
              actionAs: "signer",
              x,
              y,
              isEditing: false,
              containerBounds: containerRect,
              dragScale: scale,
            });
          } else {
            // Fallback if container not available
            setSignatureDialog({
              displayName: "",
              recipient: "",
              actionAs: "signer",
              x,
              y,
              isEditing: false,
            });
          }
          return;
        }

        // For other field types, create directly
        const newField: PDFFormField = {
          id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          type: fieldType,
          x,
          y,
          width: defaultDimensions.width,
          height: defaultDimensions.height,
          page: currentPage,
          label:
            fieldType === "text"
              ? "Sample Text"
              : `${
                  fieldType.charAt(0).toUpperCase() + fieldType.slice(1)
                } Field`,
          required: false,
          value: fieldType === "text" ? "Sample Text" : undefined,
        };

        setFields((prev) => [...prev, newField]);
        setSelectedField(newField.id);
        toast.success(
          `${
            fieldType.charAt(0).toUpperCase() + fieldType.slice(1)
          } field added`
        );
      }
    },
    [currentPage, scale, pdfDimensions, effectiveCanEdit]
  );

  const updateField = useCallback(
    (fieldId: string, updates: Partial<PDFFormField>) => {
      setFields((prevFields) =>
        prevFields.map((field) =>
          field.id === fieldId ? { ...field, ...updates } : field
        )
      );
    },
    []
  );

  const handleSignatureDialogSubmit = useCallback(() => {
    if (!signatureDialog || !signatureDialog.displayName) {
      toast.error("Please enter a display name");
      return;
    }

    // Check if we need recipient info
    if (!signatureDialog.recipient) {
      toast.error("Please select a recipient");
      return;
    }

    // Look up the client by ID to get their email
    const selectedClient = dealClients.find(
      (client) => client.id === signatureDialog.recipient
    );
    const recipientValue = selectedClient?.email || signatureDialog.recipient;

    if (signatureDialog.isEditing && signatureDialog.fieldId) {
      // Edit existing signature field
      updateField(signatureDialog.fieldId, {
        displayName: signatureDialog.displayName,
        email: recipientValue,
        actionAs: signatureDialog.actionAs,
        label: signatureDialog.displayName,
      });
    } else {
      // Create new signature field
      const defaultDimensions = DEFAULT_FIELD_DIMENSIONS.signature;
      
      // Recalculate coordinates if we have stored container bounds
      let finalX = signatureDialog.x;
      let finalY = signatureDialog.y;
      
      if (signatureDialog.containerBounds && signatureDialog.dragScale && pdfContainerRef.current) {
        const currentContainer = pdfContainerRef.current;
        const currentRect = currentContainer.getBoundingClientRect();
        
        // Calculate the difference in container position between drag time and creation time
        const deltaX = currentRect.left - signatureDialog.containerBounds.left;
        const deltaY = currentRect.top - signatureDialog.containerBounds.top;
        
        // Apply the delta to the stored coordinates, accounting for any scale changes
        const scaleRatio = scale / signatureDialog.dragScale;
        finalX = signatureDialog.x + (deltaX / scale);
        finalY = signatureDialog.y + (deltaY / scale);
        
      }
      
      // Ensure signature field stays within PDF bounds
      const maxX = pdfDimensions.width - defaultDimensions.width;
      const maxY = pdfDimensions.height - defaultDimensions.height;
      
      finalX = Math.max(0, Math.min(finalX, maxX));
      finalY = Math.max(0, Math.min(finalY, maxY));
      

      const newField: PDFFormField = {
        id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        type: "signature",
        x: finalX,
        y: finalY,
        width: defaultDimensions.width,
        height: defaultDimensions.height,
        page: currentPage,
        label: signatureDialog.displayName,
        required: false,
        email: recipientValue,
        displayName: signatureDialog.displayName,
        actionAs: signatureDialog.actionAs,
      };

      setFields((prev) => [...prev, newField]);
      setSelectedField(newField.id);
    }

    setSignatureDialog(null);
    toast.success(
      signatureDialog.isEditing
        ? "Signature field updated"
        : "Signature field added"
    );
  }, [signatureDialog, currentPage, dealClients, updateField, scale, pdfDimensions]);

  const deleteField = useCallback((fieldId: string) => {
    setFields((prevFields) =>
      prevFields.filter((field) => field.id !== fieldId)
    );
    setSelectedField((prev) => (prev === fieldId ? null : prev));
    toast.success("Field deleted");
  }, []);

  const handleFieldClick = useCallback(
    (fieldId: string, e?: React.MouseEvent) => {
      if (!effectiveCanEdit) return;
      const shift = !!e?.shiftKey;
      if (shift) {
        toggleSelect(fieldId, { shiftKey: true });
      } else {
        // Single click toggles selection
        toggleSelect(fieldId);
      }
      setSelectedField((prev) => (prev === fieldId ? null : fieldId));
    },
    [effectiveCanEdit, toggleSelect]
  );

  // Handle double-click on signature fields
  const handleSignatureDoubleClick = useCallback(
    (field: PDFFormField) => {
      if (!effectiveCanEdit || field.type !== "signature") return;

      setSignatureDialog({
        displayName: field.displayName || "",
        recipient: field.email || "",
        actionAs: field.actionAs || "signer",
        x: field.x,
        y: field.y,
        isEditing: true,
        fieldId: field.id,
        // For editing, we don't need container bounds since we're not repositioning
        containerBounds: undefined,
        dragScale: undefined,
      });
    },
    [effectiveCanEdit]
  );

  // Save metadata only (no PDF generation)
  const handleSaveMetadata = useCallback(async () => {
    if (!formId) {
      toast.error("Form ID is required to save field metadata");
      return;
    }


    setIsSaving(true);
    try {
      // Ensure all fields have proper data types and bounds before saving
      const fieldsToSave = fields.map((field, index) => {
        const originalField = {
          x: field.x,
          y: field.y,
          width: field.width,
          height: field.height,
          page: field.page
        };
        
        const processedField = {
          ...field,
          x: Math.max(0, Number(field.x) || 0),
          y: Math.max(0, Number(field.y) || 0),
          width: Math.max(20, Number(field.width) || 100),
          height: Math.max(20, Number(field.height) || 32),
          page: Number(field.page) || 1,
        };
        
        
        return processedField;
      });

      
      const saveResult = await savePdfFieldMetadata(formId, fieldsToSave);

      // Also call the onSave callback if provided (for backwards compatibility)
      if (onSave) {
        await onSave(fieldsToSave);
      }

      toast.success("Form field metadata saved successfully!");
    } catch (error) {
      console.error("[SAVE] Metadata save failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Failed to save form fields: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [fields, onSave, formId]);

  // Helper function to convert PDFFormFields to overlay data with proper coordinate conversion
  const convertFieldsToOverlays = useCallback(
    (fields: PDFFormField[]): PdfOverlayData => {
      const overlayData: PdfOverlayData = {};

      fields.forEach((field) => {
        // Only convert fields on the current page
        if (field.page !== currentPage) {
          return;
        }


        // Convert coordinates to PDF coordinate system (bottom-left origin)
        // PDF coordinates are from bottom-left, while our UI coordinates are from top-left.
        // We round all values to avoid sub-pixel artefacts that resulted in an extra rectangle
        // being rendered at (0, 0) in the generated PDF.
        const round = (v: number) => Math.round(v);

        // Ensure we have valid numeric values
        const x = Math.max(0, Number(field.x) || 0);
        const y = Math.max(0, Number(field.y) || 0);
        const width = Math.max(20, Number(field.width) || 100);
        const height = Math.max(20, Number(field.height) || 32);

        const pdfX = round(x);
        const pdfY = round(pdfDimensions.height - y - height); // Flip Y coordinate and round


        switch (field.type) {
          case "text":
            if (!overlayData.textFields) overlayData.textFields = [];
            overlayData.textFields.push({
              x: pdfX,
              y: pdfY,
              text: field.value || field.label || "Sample Text",
              fontSize: 12,
            } as TextFieldOverlay);
            break;

          case "signature":
            if (!overlayData.signatureFields) overlayData.signatureFields = [];
            overlayData.signatureFields.push({
              x: pdfX,
              y: pdfY,
              width: round(width),
              height: round(height),
              text: field.value || field.displayName || "Signature",
              fieldName: field.id,
              displayName: field.displayName || field.label || "Signature",
              fontSize: 12,
              email: field.email || "",
              actionAs: field.actionAs || "signer",
            } as SignatureFieldOverlay);
            break;

          case "date":
            if (!overlayData.dateFields) overlayData.dateFields = [];
            overlayData.dateFields.push({
              x: pdfX,
              y: pdfY,
              date: field.value || new Date().toISOString().split("T")[0],
              fontSize: 12,
            } as DateFieldOverlay);
            break;

          case "checkmark":
            if (!overlayData.checkmarks) overlayData.checkmarks = [];
            overlayData.checkmarks.push({
              x: pdfX,
              y: pdfY,
              checked:
                field.value === "true" ||
                field.value === "checked" ||
                Boolean(field.value),
              size: 12,
            } as CheckmarkOverlay);
            break;
        }
      });

      overlayData.pageNumber = currentPage - 1; // Convert to 0-indexed
      return overlayData;
    },
    [currentPage, pdfDimensions]
  );

  // Generate PDF with overlays
  const handleGeneratePdf = useCallback(async () => {


    if (!onSaveWithOverlays) {
      return;
    }

    setIsGeneratingPdf(true);

    try {
      // First, save the current field metadata to ensure it's persisted
      await handleSaveMetadata();

      // First, fetch the PDF file from the URL
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch PDF file: ${response.status} ${response.statusText}`
        );
      }
      const pdfBlob = await response.blob();
      const pdfFile = new File([pdfBlob], "document.pdf", {
        type: "application/pdf",
      });

      // Convert fields to overlay data
      const overlayData = convertFieldsToOverlays(fields);

      // Check if we have any overlay data
      const hasOverlays =
        overlayData.textFields?.length ||
        overlayData.signatureFields?.length ||
        overlayData.dateFields?.length ||
        overlayData.checkmarks?.length;


      if (!hasOverlays) {
        toast.error("No fields to save with overlays");
        return;
      }

      let result;
      if (formId) {
        // Use the form integration version
        result = await createPdfWithOverlaysAndForm(
          pdfFile,
          overlayData,
          formId,
          formType
        );
        await onSaveWithOverlays(result.pdfId, result.formId);
      } else {
        // Use the basic version
        result = await createPdfWithOverlays(pdfFile, overlayData);
        await onSaveWithOverlays(result.pdfId);
      }

      // After PDF generation, reload the field metadata to check persistence
      setTimeout(async () => {
        try {
          const reloadedFields = await loadPdfFieldMetadata(formId);
          
          // Check if coordinates match
          if (reloadedFields && reloadedFields.length > 0) {
            fields.forEach((originalField, index) => {
              const reloadedField = reloadedFields.find(f => f.id === originalField.id);
              if (reloadedField) {
              }
            });
          }
        } catch (error) {
          console.error("[PDF-GEN] Error reloading field metadata:", error);
        }
      }, 1000);

      toast.success(
        formId
          ? "PDF created with form and signatures"
          : "PDF created with overlays"
      );
    } catch (error) {
      console.error("[PDF-GEN] PDF generation failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [
    fields,
    onSaveWithOverlays,
    pdfUrl,
    formId,
    formType,
    convertFieldsToOverlays,
    handleSaveMetadata,
  ]);

  // Handle field resize using react-rnd
  const handleFieldResize = useCallback(
    (fieldId: string, ref: HTMLElement, position: { x: number; y: number }) => {
      const newWidth = parseInt(ref.style.width, 10) / scale;
      const newHeight = parseInt(ref.style.height, 10) / scale;
      let newX = position.x / scale;
      let newY = position.y / scale;

      // Ensure the field stays within PDF bounds after resize
      const maxX = pdfDimensions.width - newWidth;
      const maxY = pdfDimensions.height - newHeight;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      updateField(fieldId, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY,
      });
    },
    [updateField, scale, pdfDimensions]
  );

  // Handle field drag using react-rnd
  const handleFieldDrag = useCallback(
    (fieldId: string, data: { x: number; y: number }) => {
      // Find the field to get its dimensions
      const field = fields.find(f => f.id === fieldId);
      if (!field) return;

      let newX = data.x / scale;
      let newY = data.y / scale;

      // Ensure the field stays within PDF bounds after drag
      const maxX = pdfDimensions.width - field.width;
      const maxY = pdfDimensions.height - field.height;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      updateField(fieldId, {
        x: newX,
        y: newY,
      });
    },
    [updateField, scale, fields, pdfDimensions]
  );

  // Memoize field rendering to prevent infinite loops
  const renderField = useCallback(
    (field: PDFFormField) => {
      const isSelected = selectedField === field.id || selectedIds.has(field.id);
      const fieldType = FIELD_TYPES.find((ft) => ft.type === field.type);

      // Debug logging for signature fields
      if (field.type === "signature") {
      }

      return (
        <Rnd
          key={field.id}
          size={{
            width: field.width * scale,
            height: field.height * scale,
          }}
          position={{
            x: field.x * scale,
            y: field.y * scale,
          }}
          onDragStop={(_e, data) => handleFieldDrag(field.id, data)}
          onResizeStop={(_e, _direction, ref, _delta, position) => {
            handleFieldResize(field.id, ref, position);
          }}
          disableDragging={!effectiveCanEdit}
          enableResizing={effectiveCanEdit}
          dragHandleClassName={effectiveCanEdit ? "drag-handle" : undefined}
          bounds="parent"
          scale={1} // We handle scaling manually
          minWidth={20}
          minHeight={20}
          // Make sure the fields stay above the PDF page but below any Radix / shadcn dialog (z-50)
          // 40 when selected, 30 otherwise.
          style={{
            zIndex: isSelected ? 40 : 30,
          }}
          className={cn(
            "border-2 transition-all duration-200",
            fieldType?.color || "bg-gray-100 border-gray-300",
            isSelected ? "border-blue-500 shadow-lg" : "border-dashed",
            !effectiveCanEdit && "cursor-default",
            "select-none" // Prevent text selection
          )}
        >
          <div
            className={cn(
              "w-full h-full flex items-center justify-center relative cursor-pointer",
              effectiveCanEdit && "drag-handle"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFieldClick(field.id, e);
            }}
            onDoubleClick={(e) => {
              if (effectiveCanEdit && field.type === "signature") {
                e.preventDefault();
                e.stopPropagation();
                handleSignatureDoubleClick(field);
              }
            }}
          >
            {/* Field content based on type */}
            {field.type === "text" && (
              <div
                className="w-full h-full flex items-center justify-center bg-white rounded text-sm font-medium text-gray-800 p-1 relative z-20"
                onDoubleClick={(e) => {
                  if (effectiveCanEdit) {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedField(field.id);
                  }
                }}
                onClick={(e) => {
                  // Don't interfere with delete button clicks
                  e.stopPropagation();
                }}
                style={{ pointerEvents: "auto" }}
              >
                {isSelected && effectiveCanEdit ? (
                  <Input
                    ref={textInputRef}
                    value={field.value || "Sample Text"}
                    onChange={(e) =>
                      updateField(field.id, { value: e.target.value })
                    }
                    onBlur={() => setSelectedField(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        setSelectedField(null);
                      }
                      e.stopPropagation();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onFocus={(e) => {
                      e.stopPropagation();
                      // Only select all text on initial focus, not during typing
                      if (shouldSelectTextRef.current) {
                        e.target.select();
                        shouldSelectTextRef.current = false;
                      }
                    }}
                    className="w-full h-full text-xs border-none focus:ring-0 text-center bg-transparent"
                    style={{ pointerEvents: "auto" }}
                    autoFocus
                  />
                ) : (
                  <span
                    className="text-center truncate px-1 cursor-text"
                    title="Double-click to edit"
                  >
                    {field.value || "Sample Text"}
                  </span>
                )}
              </div>
            )}

            {field.type === "signature" && (
              <div
                className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded text-xs text-gray-500 p-1 cursor-pointer"
                title="Double-click to edit signature details"
              >
                <div className="font-medium">
                  {field.displayName || "Signature"}
                </div>
                {field.email && (
                  <div className="text-xs text-gray-400">
                    {dealClients.find((c) => c.id === field.email)
                      ?.partyrole_partynumber ||
                      dealClients.find((c) => c.email === field.email)
                        ?.partyrole_partynumber ||
                      field.email}
                  </div>
                )}
                <div className="text-xs">
                  {field.value ? "Saved and Awaiting Signature" : "Awaiting Signature"}
                </div>
              </div>
            )}

            {field.type === "date" && (
              <Input
                type="date"
                value={field.value || ""}
                onChange={(e) =>
                  updateField(field.id, { value: e.target.value })
                }
                onMouseDown={(e) => e.stopPropagation()}
                disabled={!effectiveCanEdit}
                className="w-full h-full text-xs border-none focus:ring-0"
                style={{ pointerEvents: "auto" }}
              />
            )}

            {field.type === "checkmark" && (
              <div className="w-full h-full flex items-center justify-center bg-white rounded">
                <Check className="w-4 h-4 text-green-600 stroke-2" />
              </div>
            )}

            {/* Field label */}
            {showFieldLabels &&
              field.label &&
              field.type !== "text" &&
              isSelected && (
                <div className="absolute -top-6 left-0 text-xs bg-white px-1 rounded shadow-sm border text-gray-600 z-10">
                  {field.label}
                </div>
              )}

            {/* Delete button for selected field */}
            {isSelected && effectiveCanEdit && (
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 w-6 h-6 p-0 z-30"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent?.stopImmediatePropagation();
                  deleteField(field.id);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{ pointerEvents: "auto" }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </Rnd>
      );
    },
    [
      selectedField,
      effectiveCanEdit,
      scale,
      showFieldLabels,
      handleFieldClick,
      updateField,
      deleteField,
      handleFieldDrag,
      handleFieldResize,
      dealClients,
      handleSignatureDoubleClick,
    ]
  );

  const fieldsOnCurrentPage = useMemo(
    () => fields.filter((field) => field.page === currentPage),
    [fields, currentPage]
  );

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="w-full h-full flex">
          {/* Sidebar */}
          {effectiveCanEdit && (
            <div className="w-80 bg-gray-50 border-r p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Form Fields</h3>
                <div className="grid grid-cols-1 gap-2">
                  {FIELD_TYPES.map(({ type, icon: Icon, label, color }) => (
                    <DraggableFieldType
                      key={type}
                      type={type}
                      icon={Icon}
                      label={label}
                      color={color}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Controls</h3>
                <div className="flex flex-col gap-2">
                  {/* Group editor */}
                  <div className="p-2 border rounded bg-white space-y-2">
                    <div className="text-xs font-medium text-gray-700">Group</div>
                    <input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Group name"
                    />
                    <textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Description"
                      rows={2}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{Array.from(groupFieldIds).length} in group</span>
                      <span>{Array.from(selectedIds).length} selected</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={addSelectedToGroup} disabled={Array.from(selectedIds).length===0}>
                        Add selected
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={removeSelectedFromGroup} disabled={Array.from(selectedIds).length===0}>
                        Remove selected
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowFieldLabels(!showFieldLabels)}
                    className="w-full justify-start"
                  >
                    {showFieldLabels ? (
                      <EyeOff className="w-4 h-4 mr-2" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    {showFieldLabels ? "Hide Labels" : "Show Labels"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setScale((prev) => Math.min(prev + 0.25, 3))}
                    className="w-full justify-start"
                  >
                    <ZoomIn className="w-4 h-4 mr-2" />
                    Zoom In2
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setScale((prev) => Math.max(prev - 0.25, 0.25))
                    }
                    className="w-full justify-start"
                  >
                    <ZoomOut className="w-4 h-4 mr-2" />
                    Zoom Out
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setScale(1)}
                    className="w-full justify-start"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Zoom
                  </Button>
                </div>
              </div>

              {/* Save Actions */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Actions</h3>
                  <Button
                    onClick={handleSaveMetadata}
                    disabled={isSaving}
                    className="w-full"
                    variant="outline"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Field Positions
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleGeneratePdf}
                    disabled={isGeneratingPdf}
                    className="w-full"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        {formId
                          ? "Generate and Lock PDF"
                          : "Generate PDF with Fields"}
                      </>
                    )}
                  </Button>
              </div>
            </div>
          )}

          {/* Main PDF area */}
          <div className="flex-1 flex flex-col">
            {/* Page navigation */}
            <div className="bg-white border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {numPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, numPages))
                  }
                  disabled={currentPage >= numPages}
                >
                  Next
                </Button>
              </div>

              <div className="text-sm text-gray-600">
                {fieldsOnCurrentPage.length} field
                {fieldsOnCurrentPage.length !== 1 ? "s" : ""} on this page
              </div>
            </div>

            {/* PDF viewer */}
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
              <PDFDropZone>
                <div
                  ref={pdfContainerRef}
                  className="relative mx-auto bg-white shadow-lg"
                  style={{ width: `${pdfDimensions.width * scale}px` }}
                  onMouseDown={(e) => {
                    // Start marquee if clicking empty space (not on a field), using left button
                    if (e.button !== 0) return;
                    // Only start if target is the container itself
                    if (e.currentTarget !== e.target) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setIsMarqueeActive(true);
                    const start = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                    marqueeStartRef.current = start;
                    setMarqueeRect({ left: start.x, top: start.y, width: 0, height: 0 });
                  }}
                  onMouseMove={(e) => {
                    if (!isMarqueeActive || !marqueeStartRef.current) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const cx = e.clientX - rect.left;
                    const cy = e.clientY - rect.top;
                    const left = Math.min(cx, marqueeStartRef.current.x);
                    const top = Math.min(cy, marqueeStartRef.current.y);
                    const width = Math.abs(cx - marqueeStartRef.current.x);
                    const height = Math.abs(cy - marqueeStartRef.current.y);
                    setMarqueeRect({ left, top, width, height });
                  }}
                  onMouseUp={() => {
                    if (!isMarqueeActive || !marqueeRect) return;
                    // Convert marquee rect (CSS pixels) to field-space (divide by scale)
                    const left = marqueeRect.left / scale;
                    const top = marqueeRect.top / scale;
                    const width = marqueeRect.width / scale;
                    const height = marqueeRect.height / scale;

                    // Build selection of fields on current page that intersect the rect
                    const ids: string[] = [];
                    fields
                      .filter((f) => f.page === currentPage)
                      .forEach((f) => {
                        const fx = f.x;
                        const fy = f.y;
                        const fw = f.width;
                        const fh = f.height;
                        const intersects =
                          fx < left + width &&
                          fx + fw > left &&
                          fy < top + height &&
                          fy + fh > top;
                        if (intersects) ids.push(f.id);
                      });
                    marqueeSelect(ids);
                    setIsMarqueeActive(false);
                    marqueeStartRef.current = null;
                    setMarqueeRect(null);
                  }}
                  onMouseLeave={() => {
                    if (isMarqueeActive) {
                      setIsMarqueeActive(false);
                      marqueeStartRef.current = null;
                      setMarqueeRect(null);
                    }
                  }}
                >
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={handleDocumentLoadSuccess}
                    className="relative"
                  >
                    <Page
                      pageNumber={currentPage}
                      scale={scale}
                      className="relative"
                      // Hide the annotation layer to prevent the PDF viewer from
                      // drawing the interactive form widgets. The widgets’ own
                      // appearance streams are still rendered on the canvas, so
                      // the visual output remains intact, but the duplicate
                      // rectangle that was showing at the top-left disappears.
                      renderAnnotationLayer={false}
                      onRenderSuccess={handlePageRenderSuccess}
                    />

                    {/* Render form fields */}
                    {fieldsOnCurrentPage.map(renderField)}

                    {/* Marquee rectangle overlay */}
                    {marqueeRect && (
                      <div
                        className="absolute border-2 border-blue-400/70 bg-blue-200/20 pointer-events-none"
                        style={{ left: marqueeRect.left, top: marqueeRect.top, width: marqueeRect.width, height: marqueeRect.height }}
                      />
                    )}
                  </Document>
                </div>
              </PDFDropZone>
            </div>
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {draggedType && (
            <div className="p-2 bg-white border-2 border-dashed border-blue-300 rounded shadow-lg">
              {FIELD_TYPES.find((ft) => ft.type === draggedType)?.label}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Signature Configuration Dialog */}
      <Dialog
        open={!!signatureDialog}
        onOpenChange={() => setSignatureDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {signatureDialog?.isEditing
                ? "Edit Signature Field"
                : "Configure Signature Field"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={signatureDialog?.displayName || ""}
                onChange={(e) =>
                  setSignatureDialog((prev) =>
                    prev ? { ...prev, displayName: e.target.value } : null
                  )
                }
                placeholder="e.g., Client Signature, Agent Signature"
              />
            </div>
            <div>
              <Label htmlFor="recipient">Recipient</Label>
              <Select
                value={signatureDialog?.recipient || ""}
                onValueChange={(value) =>
                  setSignatureDialog((prev) =>
                    prev ? { ...prev, recipient: value } : null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingClients ? (
                    <SelectItem value="loading" disabled>
                      Loading clients...
                    </SelectItem>
                  ) : (
                    <>
                      {dealClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.partyrole_partynumber} ({client.email})
                        </SelectItem>
                      ))}
                      <div className="border-t mt-1 pt-1">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-sm py-1.5 px-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none cursor-default"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Store the current signature dialog state before closing it
                            if (signatureDialog) {
                              signatureDialogBeforeAddParty.current = { ...signatureDialog };
                            }
                            setSignatureDialog(null);
                            setIsAddPartyModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Add Signer
                        </button>
                      </div>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="actionAs">Action As</Label>
              <Select
                value={signatureDialog?.actionAs || "signer"}
                onValueChange={(value: "signer" | "delegator") =>
                  setSignatureDialog((prev) =>
                    prev ? { ...prev, actionAs: value } : null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="signer">Signer</SelectItem>
                  <SelectItem value="delegator">Delegator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignatureDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSignatureDialogSubmit}>
              {signatureDialog?.isEditing
                ? "Update Signature Field"
                : "Add Signature Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Party Modal */}
      <AddPartyModal
        isOpen={isAddPartyModalOpen}
        onClose={() => setIsAddPartyModalOpen(false)}
        onPartyAdded={handlePartyAdded}
        dealId={dealId}
        dealSide={dealSide}
        dealOptionName={dealOptionName}
      />
    </>
  );
}
