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
import * as fabric from "fabric";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Type,
  FileSignature,
  Check,
  Strikethrough,
  Trash2,
  Save,
  Plus,
  Download,
} from "lucide-react";
import { PDFFormField, SchemaItem, DealParty } from "../types/realtor";
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
  savePdfFieldMetadata,
  loadPdfFieldMetadata,
} from "@/app/actions/realtor/deal-option-actions";
import {
  applyFieldsToPDF,
  type PDFField as PDFGeneratorField,
} from "@/utils/pdf/pdfFieldGenerator";
import { updateFormCustomSchema } from "@/app/actions/realtor/form-actions";
import AddPartyModal from "./AddPartyModal";
import { debounce } from "lodash";
import "./HybridPDFFormEditor.css";
import {
  checkPDFLockStatus,
  uploadGeneratedPDF,
} from "@/app/actions/realtor/pdf-actions";
import { getDealPartiesByDealAndOptionId } from "@/app/actions/realtor/dealClient-actions";

// Configure PDF.js worker
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

// Debug flag
const DEBUG = false;

interface HybridPDFFormEditorProps {
  pdfUrl: string;
  dealId: string;
  formId: string;
  formType?: string; // Add formType prop
  initialFields: PDFFormField[];
  onFieldsChange: (fields: PDFFormField[]) => void;
  onSave: (fields: PDFFormField[]) => Promise<void>;
  onSaveWithOverlays: (pdfId: string, formId?: string) => Promise<void>;
  canEdit: boolean;
  isLoading: boolean;
  hasCustomSchema?: boolean;
  dealSide?: string;
  dealOptionName?: string;
  dealOptionId: string;
}

interface SignatureDialogData {
  displayName: string;
  recipient: string;
  actionAs: "signer" | "delegator";
  x: number;
  y: number;
  isEditing?: boolean;
  fieldId?: string;
}

// Field type configurations
const FIELD_TYPES = [
  {
    type: "signature",
    icon: FileSignature,
    label: "Signature Field",
    color: "rgba(230, 245, 230, 0.95)",
    borderColor: "#22c55e",
  },
  {
    type: "text",
    icon: Type,
    label: "Static Text",
    color: "rgba(219, 234, 254, 0.95)",
    borderColor: "#3b82f6",
  },
  {
    type: "checkmark",
    icon: Check,
    label: "Checkmark",
    color: "rgba(254, 215, 170, 0.95)",
    borderColor: "#f97316",
  },
  {
    type: "strikethrough",
    icon: Strikethrough,
    label: "Strikethrough",
    color: "rgba(254, 202, 202, 0.95)",
    borderColor: "#ef4444",
  },
] as const;

const DEFAULT_FIELD_DIMENSIONS = {
  signature: { width: 250, height: 60 },
  date: { width: 150, height: 32 },
  text: { width: 100, height: 24 },
  checkmark: { width: 24, height: 24 },
  strikethrough: { width: 24, height: 24 },
};

// Extend fabric to store custom properties
interface CustomFabricObject extends fabric.Object {
  fieldId?: string;
  fieldType?: string;
  fieldData?: PDFFormField;
}

// Helper function to bring images/checkmarks above text fields
function bringImageAboveTextFields(
  canvas: fabric.Canvas,
  imageObject: fabric.Object
) {
  const allObjects = canvas.getObjects();

  // Check if there are any text fields
  const hasTextFields = allObjects.some((obj) => {
    const customObj = obj as CustomFabricObject;
    return customObj.fieldType === "text";
  });

  // If there are text fields, bring the image to front
  if (hasTextFields) {
    canvas.bringObjectToFront(imageObject);
  }
}

// Helper function to extract field data from canvas objects
function extractFieldsFromCanvas(canvas: fabric.Canvas): PDFFormField[] {
  return canvas
    .getObjects()
    .map((obj) => {
      const customObj = obj as CustomFabricObject;
      if (customObj.fieldData) {
        // For signature fields, use visual dimensions to avoid including selection handles
        let width, height;
        if (
          obj instanceof fabric.Group &&
          (obj as any).fieldType === "signature"
        ) {
          width = obj.getScaledWidth();
          height = obj.getScaledHeight();
        } else {
          width = (obj.width || customObj.fieldData.width) * (obj.scaleX || 1);
          height =
            (obj.height || customObj.fieldData.height) * (obj.scaleY || 1);
        }

        // Update field data with current object position and size
        return {
          ...customObj.fieldData,
          x: obj.left || 0,
          y: obj.top || 0,
          width: width,
          height: height,
        };
      }
      return null;
    })
    .filter((field): field is PDFFormField => field !== null);
}

export default function HybridPDFFormEditor({
  pdfUrl,
  dealId,
  formId,
  initialFields = [],
  onFieldsChange,
  onSave,
  onSaveWithOverlays,
  canEdit = true,
  isLoading = false,
  hasCustomSchema = false,
  dealSide = "buy",
  dealOptionName = "deal-wide",
  dealOptionId,
}: HybridPDFFormEditorProps) {
  // Component mount logging
  useEffect(() => {
  }, []);

  // Memoize PDF.js options to prevent unnecessary reloads
  const pdfOptions = useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
    }),
    []
  );

  const [fields, setFields] = useState<PDFFormField[]>([]);
  const lastInitialFieldsRef = useRef<string>("");
  const lastNotifiedFieldsRef = useRef<string>("");
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isSavingAuto, setIsSavingAuto] = useState<boolean>(false);

  // Reset dimensions when PDF URL changes
  useEffect(() => {
    setPdfDimensions(null);
    setIsPdfLoaded(false);
    setIsPdfRendered(false);
    dimensionsSetRef.current = false;

    // Clean up any existing PDF.js resources
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
    }
  }, [pdfUrl]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showFieldLabels] = useState<boolean>(true);
  const [hoveredField, setHoveredField] = useState<{
    id: string;
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [signatureDialog, setSignatureDialog] =
    useState<SignatureDialogData | null>(null);
  const [dealClients, setDealClients] = useState<DealParty[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState<boolean>(false);
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] =
    useState<boolean>(false);
  const [pdfDimensions, setPdfDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [isPdfLoaded, setIsPdfLoaded] = useState<boolean>(false);
  const [isPdfRendered, setIsPdfRendered] = useState<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<string>("#000000"); // Color picker state
  const [isPdfLocked, setIsPdfLocked] = useState<boolean>(false);

  // Debug state changes
  useEffect(() => {
  }, [pdfDimensions]);

  useEffect(() => {
  }, [isPdfLoaded]);

  useEffect(() => {
  }, [isPdfRendered]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const signatureDialogBeforeAddParty = useRef<SignatureDialogData | null>(
    null
  );
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const dimensionsSetRef = useRef<boolean>(false);

  /* ------------------------------------------------------------------
   * Clipboard support for copy / paste of fields
   * ------------------------------------------------------------------ */
  // Holds the last copied fields
  const clipboardRef = useRef<PDFFormField[] | null>(null);

  // Override canEdit if form has custom schema or PDF is locked
  const effectiveCanEdit = canEdit && !hasCustomSchema && !isPdfLocked;

  // Log the factors affecting editing capability

  // Check PDF lock status on mount
  useEffect(() => {
    const checkLockStatus = async () => {
      if (!formId) return;


      try {
        const lockResult = await checkPDFLockStatus(formId);

        setIsPdfLocked(lockResult.isLocked);

        if (lockResult.isLocked) {
        } else {
        }
      } catch (error) {
        console.error(
          "[PDF-LOCK-CHECK] Error checking PDF lock status:",
          error
        );
      }
    };

    checkLockStatus();
  }, [formId]);

  // Load saved field metadata and handle form switching
  useEffect(() => {
    const loadSavedFields = async () => {
      if (!formId) return;

      try {
        const savedFields = await loadPdfFieldMetadata(formId);

        if (savedFields && savedFields.length > 0) {

          // Filter fields if PDF is locked - only show signature fields
          const fieldsToLoad = isPdfLocked
            ? savedFields.filter(
                (field: PDFFormField) => field.type === "signature"
              )
            : savedFields;

          // Ensure all fields have proper coordinate system - they should already be in UI pixel coordinates
          const normalizedFields = fieldsToLoad.map((field: PDFFormField) => {
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
        console.error("Error loading saved fields:", error);
        // Clear fields on error to prevent inheritance
        setFields([]);
      }
    };

    // Clear state when formId changes (prevents field inheritance)
    setFields([]);
    setSelectedFieldId(null);

    // Load saved fields if formId exists
    if (formId) {
      loadSavedFields();
    }
  }, [formId, isPdfLocked]); // Depend on formId and lock status

  // Sync with initial fields when they change (separate from loading)
  useEffect(() => {
    const initialFieldsString = JSON.stringify(initialFields);
    if (
      initialFieldsString !== lastInitialFieldsRef.current &&
      initialFields.length > 0
    ) {
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

  // Debounced field update for smooth dragging
  const debouncedUpdateFields = useMemo(
    () =>
      debounce((newFields: PDFFormField[]) => {
        setFields(newFields);
        onFieldsChange(newFields);
      }, 100),
    [onFieldsChange]
  );

  // Fetch deal clients
  const fetchDealClients = useCallback(async () => {
    
    if (!dealOptionId) {
      return;
    }

    try {
      setIsLoadingClients(true);
      
      const fetchedClients = await getDealPartiesByDealAndOptionId(dealId, dealOptionId);
      
      
      setDealClients(fetchedClients);
      
      // Verify state update
      setTimeout(() => {
      }, 100);
    } catch (error) {
      console.error("Error fetching deal clients:", error);
      if (DEBUG) console.error("Error fetching deal clients:", error);
      toast.error("Failed to load deal parties");
    } finally {
      setIsLoadingClients(false);
    }
  }, [dealOptionId, dealId]);

  useEffect(() => {
    fetchDealClients();
  }, [fetchDealClients]);
  
  // Monitor dealClients state changes
  useEffect(() => {
  }, [dealClients]);

  // Handle container resize
  useEffect(() => {
    if (!pdfContainerRef.current) return;

    const handleResize = debounce(() => {
      if (fabricCanvasRef.current && pdfDimensions) {
        // Recalculate scale based on container width if needed
        const containerWidth =
          pdfContainerRef.current?.parentElement?.clientWidth;
        if (containerWidth && containerWidth < pdfDimensions.width) {
          const newScale = (containerWidth / pdfDimensions.width) * 0.9; // 90% to add some padding
          setScale(newScale);
        }
      }
    }, 250);

    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(pdfContainerRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [pdfDimensions]);

  // Initialize Fabric canvas
  useEffect(() => {
    // Wait for all prerequisites
    if (
      !canvasRef.current ||
      !isPdfLoaded ||
      !isPdfRendered ||
      !pdfDimensions
    ) {
      return;
    }


    // If canvas already exists, dispose it first
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }


    try {
      const canvas = new fabric.Canvas(canvasRef.current, {
        backgroundColor: "transparent",
        selection: effectiveCanEdit,
        preserveObjectStacking: true,
        width: pdfDimensions.width * scale,
        height: pdfDimensions.height * scale,
      });

      fabricCanvasRef.current = canvas;

      console.log("Canvas size:", canvas.getWidth(), "x", canvas.getHeight());

      if (DEBUG) {
        // Add a test rectangle to verify canvas is working
        const testRect = new fabric.Rect({
          left: 100,
          top: 100,
          width: 200,
          height: 100,
          fill: "rgba(0, 255, 0, 0.5)",
          stroke: "green",
          strokeWidth: 2,
        });
        canvas.add(testRect);
        canvas.renderAll();
      }
    } catch (error) {
      console.error("Failed to initialize Fabric canvas:", error);
    }

    // Handle object selection - only set up if canvas was successfully created
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.on("selection:created", (e) => {
        const selected = e.selected?.[0] as CustomFabricObject;
        if (selected?.fieldId) {
          setSelectedFieldId(selected.fieldId);
        }
      });

      fabricCanvasRef.current.on("selection:updated", (e) => {
        const selected = e.selected?.[0] as CustomFabricObject;
        if (selected?.fieldId) {
          setSelectedFieldId(selected.fieldId);
        }
      });

      fabricCanvasRef.current.on("selection:cleared", () => {
        setSelectedFieldId(null);
      });

      // Handle object modifications
      fabricCanvasRef.current.on("object:modified", (e) => {
        const obj = e.target as CustomFabricObject;
        if (!obj?.fieldId) return;

        // Handle text field resizing - keep font size fixed
        if (
          obj instanceof fabric.Textbox &&
          (obj as any).fieldType === "text"
        ) {
          const newWidth = (obj.width || 0) * (obj.scaleX || 1);
          const newHeight = (obj.height || 0) * (obj.scaleY || 1);

          obj.set({
            fontSize: 11, // Keep fixed 11-point font
            scaleX: 1,
            scaleY: 1,
            width: newWidth,
            height: newHeight,
          });

          obj.setCoords();
        }

        // Handle checkmark resizing - normalize the scale
        if (
          (obj instanceof fabric.FabricImage || obj instanceof fabric.Rect) &&
          (obj as any).fieldType === "checkmark"
        ) {
          const newScaleX = obj.scaleX || 1;
          const newScaleY = obj.scaleY || 1;

          // Keep the visual size but reset the scale to prevent accumulation
          obj.set({
            scaleX: newScaleX,
            scaleY: newScaleY,
          });

          obj.setCoords();
        }

        // Handle strikethrough resizing - normalize the scale (same as checkmarks)
        if (
          (obj instanceof fabric.FabricImage || obj instanceof fabric.Rect) &&
          (obj as any).fieldType === "strikethrough"
        ) {
          const newScaleX = obj.scaleX || 1;
          const newScaleY = obj.scaleY || 1;

          // Keep the visual size but reset the scale to prevent accumulation
          obj.set({
            scaleX: newScaleX,
            scaleY: newScaleY,
          });

          obj.setCoords();
        }

        // Handle signature field resizing
        if (
          obj instanceof fabric.Group &&
          (obj as any).fieldType === "signature"
        ) {
          const group = obj as fabric.Group;
          const items = group.getObjects();
          const rect = items[0] as fabric.Rect;
          const textbox = items[1] as fabric.Textbox;

          if (rect && textbox) {
            // Calculate the actual visual dimensions (excluding selection handles)
            // Use getScaledWidth/Height to get the visual dimensions without selection UI
            const visualWidth = obj.getScaledWidth();
            const visualHeight = obj.getScaledHeight();

            // Get stroke width for proper sizing
            const strokeWidth = rect.strokeWidth || 3;

            // Update rect dimensions based on visual size, accounting for stroke
            rect.set({
              width: visualWidth - strokeWidth,
              height: visualHeight - strokeWidth,
            });

            // Update textbox dimensions
            const padding = 10;
            const textWidth = visualWidth - strokeWidth - padding * 2;
            const textHeight = visualHeight - strokeWidth - padding * 2;
            textbox.set({
              width: textWidth,
            });

            // Get the full text
            const fullText = (obj as any).fullText || textbox.text;

            // Set the text to check bounds
            textbox.set({ text: fullText });
            const textBounds = textbox.getBoundingRect();
            const textFitsWidth = textBounds.width <= textWidth;
            const textFitsHeight = textBounds.height <= textHeight;
            const textFits = textFitsWidth && textFitsHeight;

            if (!textFits) {
              // If text doesn't fit, clear it completely
              textbox.set({ text: "" });
              (obj as any).showTooltip = true;
            } else {
              // Text fits, show it
              (obj as any).showTooltip = false;
            }

            // Reset group scale and set dimensions to visual size
            obj.set({
              scaleX: 1,
              scaleY: 1,
              width: visualWidth,
              height: visualHeight,
              padding: 0, // Maintain zero padding to keep selection box tight
            });

            group.setCoords();
          }
        }

        const updatedFields = fields.map((field) => {
          if (field.id === obj.fieldId) {
            let updatedField;

            // Special handling for checkmarks
            if (
              (obj instanceof fabric.FabricImage ||
                obj instanceof fabric.Rect) &&
              field.type === "checkmark"
            ) {
              // For images/rects, we calculate based on scale
              const actualWidth = (obj.width || 24) * (obj.scaleX || 1);
              const actualHeight = (obj.height || 24) * (obj.scaleY || 1);

              updatedField = {
                ...field,
                x: (obj.left || 0) / scale,
                y: (obj.top || 0) / scale,
                width: actualWidth / scale,
                height: actualHeight / scale,
                color: field.color, // Keep the original color since image filters are applied
              };
            } else if (
              (obj instanceof fabric.FabricImage ||
                obj instanceof fabric.Rect) &&
              field.type === "strikethrough"
            ) {
              // For strikethrough images/rects, we calculate based on scale (same as checkmarks)
              const actualWidth = (obj.width || 24) * (obj.scaleX || 1);
              const actualHeight = (obj.height || 24) * (obj.scaleY || 1);

              updatedField = {
                ...field,
                x: (obj.left || 0) / scale,
                y: (obj.top || 0) / scale,
                width: actualWidth / scale,
                height: actualHeight / scale,
                color: field.color, // Keep the original color since image filters are applied
              };
            } else if (
              obj instanceof fabric.Group &&
              (obj as any).fieldType === "signature"
            ) {
              // For signature fields, use visual dimensions to avoid including selection handles
              updatedField = {
                ...field,
                x: (obj.left || 0) / scale,
                y: (obj.top || 0) / scale,
                width: obj.getScaledWidth() / scale,
                height: obj.getScaledHeight() / scale,
              };
            } else {
              updatedField = {
                ...field,
                x: (obj.left || 0) / scale,
                y: (obj.top || 0) / scale,
                width: ((obj.width || 0) * (obj.scaleX || 1)) / scale,
                height: ((obj.height || 0) * (obj.scaleY || 1)) / scale,
              };

              // Update text value and color if it's a textbox
              if (obj instanceof fabric.Textbox && field.type === "text") {
                updatedField.value = obj.text || "";
                updatedField.color = (obj.fill as string) || field.color;
              }
            }

            return updatedField;
          }
          return field;
        });

        debouncedUpdateFields(updatedFields);
      });

      // Handle mouse hover for tooltips
      fabricCanvasRef.current.on("mouse:over", (e) => {
        const obj = e.target as CustomFabricObject;
        if (
          obj instanceof fabric.Group &&
          (obj as any).fieldType === "signature" &&
          (obj as any).showTooltip
        ) {
          const fullText = (obj as any).fullText || "";
          const bounds = obj.getBoundingRect();
          const canvasOffset = fabricCanvasRef
            .current!.getElement()
            .getBoundingClientRect();

          setHoveredField({
            id: (obj as any).fieldId || "",
            text: fullText,
            x: canvasOffset.left + bounds.left + bounds.width / 2,
            y: canvasOffset.top + bounds.top - 10,
          });
        }
      });

      fabricCanvasRef.current.on("mouse:out", (e) => {
        const obj = e.target as CustomFabricObject;
        if (
          obj instanceof fabric.Group &&
          (obj as any).fieldType === "signature"
        ) {
          setHoveredField(null);
        }
      });
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [
    effectiveCanEdit,
    debouncedUpdateFields,
    setSignatureDialog,
    scale,
    pdfDimensions,
    isPdfLoaded,
    isPdfRendered,
    setHoveredField,
  ]);

  // Create Fabric object for field
  const createFieldObject = useCallback(
    (field: PDFFormField): fabric.Object => {

      const fieldType = FIELD_TYPES.find((ft) => ft.type === field.type);

      let obj: fabric.Object;

      // Validate field dimensions
      if (
        !field.width ||
        !field.height ||
        field.width <= 0 ||
        field.height <= 0
      ) {
        console.error("Invalid field dimensions:", field);
        console.error("Using default dimensions for type:", field.type);

        const defaultDims =
          DEFAULT_FIELD_DIMENSIONS[
            field.type as keyof typeof DEFAULT_FIELD_DIMENSIONS
          ];
        if (defaultDims) {
          field.width = defaultDims.width;
          field.height = defaultDims.height;
        } else {
          field.width = 100;
          field.height = 50;
        }
      }

      // Don't scale positions and dimensions - let canvas zoom handle it
      const scaledX = field.x;
      const scaledY = field.y;
      const scaledWidth = field.width;
      const scaledHeight = field.height;


      switch (field.type) {
        case "text":
          obj = new fabric.Textbox(field.value || "Sample Text", {
            left: scaledX,
            top: scaledY,
            width: scaledWidth,
            height: scaledHeight,
            fontSize: 11, // Fixed 11-point font
            fontFamily: "Arial, sans-serif",
            fill: field.color || selectedColor, // Use field color or selected color
            backgroundColor: "transparent", // Transparent background
            borderColor: "#3b82f6", // Blue border for selection
            cornerColor: "#3b82f6", // Blue corners for resize handles
            padding: 8,
            cornerSize: 8,
            transparentCorners: false,
            lockRotation: true,
            fontWeight: "normal", // Normal weight, not bold
            lineHeight: 1.2,
            textAlign: "left",
            editingBorderColor: "#3b82f6", // Blue border when editing
            editable: true, // Explicitly enable text editing
            selectable: true, // Allow selection
            evented: true, // Allow events
          });

          // Override the default behavior to show controls during editing
          (obj as any).on("editing:entered", function (this: fabric.Textbox) {
            this.hasControls = true;
            this.hasBorders = true;
            this.borderColor = "#3b82f6";
            this.cornerColor = "#3b82f6";
            this.transparentCorners = false;
            this.setControlsVisibility({
              mtr: false, // Hide rotation control
              mt: true, // Show middle top
              mb: true, // Show middle bottom
              ml: true, // Show middle left
              mr: true, // Show middle right
              tl: true, // Show top left
              tr: true, // Show top right
              bl: true, // Show bottom left
              br: true, // Show bottom right
            });
            this.canvas?.renderAll();
          });

          // Handle text editing completion with field updates
          (obj as any).on("editing:exited", function (this: fabric.Textbox) {
            this.hasControls = true;
            this.hasBorders = true;
            this.canvas?.renderAll();

            // Update the field data with the new text value
            const fieldData = (this as CustomFabricObject).fieldData;
            if (fieldData) {
              fieldData.value = this.text || "";
              (this as CustomFabricObject).fieldData = fieldData;

              // Trigger the update to parent component
              if (fabricCanvasRef.current) {
                const updatedFields = extractFieldsFromCanvas(
                  fabricCanvasRef.current
                );
                debouncedUpdateFields(updatedFields);
              }
            }
          });

          // Handle real-time text changes
          (obj as any).on("text:changed", function (this: fabric.Textbox) {
            this.hasControls = true;
            this.setCoords();

            // Update the field data with the new text value in real-time
            const fieldData = (this as CustomFabricObject).fieldData;
            if (fieldData) {
              fieldData.value = this.text || "";
              (this as CustomFabricObject).fieldData = fieldData;
            }
          });

          // Ensure double-click starts text editing
          (obj as any).on("mousedown", function (this: fabric.Textbox, e: any) {
            if (e.e.detail === 2) {
              // Double click
              this.enterEditing();
              this.selectAll();
            }
          });
          break;

        case "signature":
          // Create a group for signature field with background and text

          if (
            !scaledWidth ||
            !scaledHeight ||
            scaledWidth <= 0 ||
            scaledHeight <= 0
          ) {
            console.error("Invalid dimensions for signature field:", {
              scaledWidth,
              scaledHeight,
            });
            // Use fallback dimensions
            const fallbackWidth = DEFAULT_FIELD_DIMENSIONS.signature.width;
            const fallbackHeight = DEFAULT_FIELD_DIMENSIONS.signature.height;

            obj = new fabric.Rect({
              left: scaledX,
              top: scaledY,
              width: fallbackWidth,
              height: fallbackHeight,
              fill: fieldType?.color || "rgba(230, 245, 230, 0.95)",
              stroke: fieldType?.borderColor || "#22c55e",
              strokeWidth: 3,
              strokeDashArray: [8, 4],
              rx: 4,
              ry: 4,
            });
          } else {
            // Adjust dimensions to account for stroke width
            const strokeWidth = 3;
            const halfStroke = strokeWidth / 2;

            const signatureRect = new fabric.Rect({
              left: halfStroke,
              top: halfStroke,
              width: scaledWidth - strokeWidth,
              height: scaledHeight - strokeWidth,
              fill: fieldType?.color,
              stroke: fieldType?.borderColor,
              strokeWidth: strokeWidth,
              strokeDashArray: [8, 4],
              rx: 4,
              ry: 4,
            });

            const displayText = field.displayName || "Signature";
            const emailText = field.email
              ? `(${field.email.substring(0, 20)}${
                  field.email.length > 20 ? "..." : ""
                })`
              : "";
            const fullText = showFieldLabels
              ? `${displayText}\n${emailText}`
              : displayText;

            // Calculate available text area (subtract padding and stroke)
            const padding = 10;
            const textWidth = scaledWidth - strokeWidth - padding * 2;
            const textHeight = scaledHeight - strokeWidth - padding * 2;

            // Prepare text box for the label
            const signatureText = new fabric.Textbox(fullText, {
              left: halfStroke + padding,
              top: halfStroke + padding,
              width: textWidth,
              fontSize: 12,
              fontFamily: "Arial",
              fill: "#065f46",
              fontWeight: "bold",
              lineHeight: 1.3,
              splitByGrapheme: true,
              editable: false,
              selectable: false,
            });

            // Determine whether the text fits inside the available area
            const textBounds = signatureText.getBoundingRect();
            const textFits =
              textBounds.width <= textWidth && textBounds.height <= textHeight;

            // Decide which objects to include in the group
            const groupObjects: fabric.Object[] = [signatureRect];
            if (textFits && fullText) {
              // Only include the text if it actually fits; otherwise omit it to keep the bounding box tight
              groupObjects.push(signatureText);
            }

            obj = new fabric.Group(groupObjects, {
              left: scaledX,
              top: scaledY,
              lockRotation: true,
              padding: 0, // Ensure selection box matches visual bounds
            });

            // Store metadata for tooltip behaviour (still needed even if text omitted)
            (obj as any).fullText = fullText;
            (obj as any).showTooltip = !textFits;
            (obj as any).fieldType = "signature"; // Ensure field type is set for proper handling
          }

          // Store additional data for display
          (obj as any).displayName = field.displayName || "Signature";
          (obj as any).email = field.email || "";
          break;

        case "date":
          obj = new fabric.Textbox(
            field.value || new Date().toLocaleDateString(),
            {
              left: scaledX,
              top: scaledY,
              width: scaledWidth,
              height: scaledHeight,
              fontSize: 12,
              fontFamily: "Arial",
              fill: "#7c3aed",
              backgroundColor: fieldType?.color,
              borderColor: fieldType?.borderColor,
              cornerColor: fieldType?.borderColor,
              strokeWidth: 2,
              stroke: fieldType?.borderColor,
              padding: 5,
              cornerSize: 8,
              transparentCorners: false,
              lockRotation: true,
            }
          );
          break;

        case "checkmark":
          // Create a placeholder rectangle first that will be replaced
          obj = new fabric.Rect({
            left: scaledX,
            top: scaledY,
            width: scaledWidth,
            height: scaledHeight,
            fill: "rgba(200, 200, 200, 0.3)",
            stroke: "#999",
            strokeWidth: 1,
            selectable: effectiveCanEdit,
            evented: effectiveCanEdit,
            hasBorders: true,
            hasControls: effectiveCanEdit,
            cornerStyle: "rect",
            transparentCorners: false,
            borderColor: "#2563eb",
            cornerColor: "#2563eb",
            borderScaleFactor: 2,
            cornerSize: 10,
            lockRotation: true,
          });

          // Store field data on the placeholder
          (obj as CustomFabricObject).fieldId = field.id;
          (obj as CustomFabricObject).fieldType = field.type;
          (obj as CustomFabricObject).fieldData = field;
          (obj as any).isCheckmarkPlaceholder = true;

          // Load the checkmark image asynchronously using fabric.js 6.x Promise API
          const imageUrl = "/checkmark.png";

          // Use the updated FabricImage API for fabric.js 6.x
          fabric.FabricImage.fromURL(imageUrl)
            .then((img) => {

              // Configure the image
              img.set({
                left: scaledX,
                top: scaledY,
                scaleX: scaledWidth / (img.width || 512),
                scaleY: scaledHeight / (img.height || 512),
                selectable: effectiveCanEdit,
                evented: effectiveCanEdit,
                hasBorders: true,
                hasControls: effectiveCanEdit,
                cornerStyle: "rect",
                transparentCorners: false,
                borderColor: "#2563eb",
                cornerColor: "#2563eb",
                borderScaleFactor: 2,
                cornerSize: 10,
                lockRotation: true,
              });

              // Copy field data to the image
              (img as CustomFabricObject).fieldId = field.id;
              (img as CustomFabricObject).fieldType = field.type;
              (img as CustomFabricObject).fieldData = field;

              // Replace placeholder with actual image and ensure proper layering
              const canvas = fabricCanvasRef.current;
              if (canvas) {
                // Find and store selection state
                const placeholder = canvas
                  .getObjects()
                  .find(
                    (o) =>
                      (o as CustomFabricObject).fieldId === field.id &&
                      (o as any).isCheckmarkPlaceholder
                  );

                if (placeholder) {
                  // Check if placeholder is selected
                  const isSelected = canvas.getActiveObject() === placeholder;

                  // Remove placeholder
                  canvas.remove(placeholder);

                  // Add image
                  canvas.add(img);

                  // Move checkmark above all text fields
                  bringImageAboveTextFields(canvas, img);

                  // Restore selection if it was selected
                  if (isSelected) {
                    canvas.setActiveObject(img);
                  }

                  canvas.renderAll();
                }
              }
            })
            .catch((error) => {
              console.error("Failed to load checkmark image:", error);
            });
          break;

        case "strikethrough":
          // Create a placeholder rectangle first that will be replaced
          obj = new fabric.Rect({
            left: scaledX,
            top: scaledY,
            width: scaledWidth,
            height: scaledHeight,
            fill: "rgba(200, 200, 200, 0.3)",
            stroke: "#999",
            strokeWidth: 1,
            selectable: effectiveCanEdit,
            evented: effectiveCanEdit,
            hasBorders: true,
            hasControls: effectiveCanEdit,
            cornerStyle: "rect",
            transparentCorners: false,
            borderColor: "#2563eb",
            cornerColor: "#2563eb",
            borderScaleFactor: 2,
            cornerSize: 10,
            lockRotation: true,
          });

          // Store field data on the placeholder
          (obj as CustomFabricObject).fieldId = field.id;
          (obj as CustomFabricObject).fieldType = field.type;
          (obj as CustomFabricObject).fieldData = field;
          (obj as any).isStrikethroughPlaceholder = true;

          // Load the strikethrough image asynchronously using fabric.js 6.x Promise API
          const strikethroughImageUrl = "/strikethrough.png";

          // Use the updated FabricImage API for fabric.js 6.x
          fabric.FabricImage.fromURL(strikethroughImageUrl)
            .then((img) => {

              // Configure the image
              img.set({
                left: scaledX,
                top: scaledY,
                scaleX: scaledWidth / (img.width || 512),
                scaleY: scaledHeight / (img.height || 512),
                selectable: effectiveCanEdit,
                evented: effectiveCanEdit,
                hasBorders: true,
                hasControls: effectiveCanEdit,
                cornerStyle: "rect",
                transparentCorners: false,
                borderColor: "#2563eb",
                cornerColor: "#2563eb",
                borderScaleFactor: 2,
                cornerSize: 10,
                lockRotation: true,
              });

              // Copy field data to the image
              (img as CustomFabricObject).fieldId = field.id;
              (img as CustomFabricObject).fieldType = field.type;
              (img as CustomFabricObject).fieldData = field;

              // Replace placeholder with actual image and ensure proper layering
              const canvas = fabricCanvasRef.current;
              if (canvas) {
                // Find and store selection state
                const placeholder = canvas
                  .getObjects()
                  .find(
                    (o) =>
                      (o as CustomFabricObject).fieldId === field.id &&
                      (o as any).isStrikethroughPlaceholder
                  );

                if (placeholder) {
                  // Check if placeholder is selected
                  const isSelected = canvas.getActiveObject() === placeholder;

                  // Remove placeholder
                  canvas.remove(placeholder);

                  // Add image
                  canvas.add(img);

                  // Move strikethrough above all text fields
                  bringImageAboveTextFields(canvas, img);

                  // Restore selection if it was selected
                  if (isSelected) {
                    canvas.setActiveObject(img);
                  }

                  canvas.renderAll();
                }
              }
            })
            .catch((error) => {
              console.error("Failed to load strikethrough image:", error);
            });
          break;

        default:
          obj = new fabric.Rect({
            left: scaledX,
            top: scaledY,
            width: scaledWidth,
            height: scaledHeight,
            fill: fieldType?.color || "rgba(229, 231, 235, 0.8)",
            stroke: fieldType?.borderColor || "#9ca3af",
            strokeWidth: 2,
            lockRotation: true,
          });
      }

      // Add custom properties
      (obj as CustomFabricObject).fieldId = field.id;
      (obj as CustomFabricObject).fieldType = field.type;
      (obj as CustomFabricObject).fieldData = field;

      // Set common properties (avoid overriding text-specific settings)
      if (field.type !== "text") {
        const commonProps: Record<string, unknown> = {
          lockRotation: true,
          cornerStyle: "rect",
          transparentCorners: false,
          borderColor: "#2563eb",
          cornerColor: "#2563eb",
          borderScaleFactor: 2,
          cornerSize: 10,
          selectable: effectiveCanEdit,
          evented: effectiveCanEdit,
        };

        // Maintain zero padding for signature fields
        if (field.type === "signature") {
          commonProps.padding = 0;
        }

        obj.set({
          ...commonProps,
          hasBorders: true,
          hasControls: effectiveCanEdit,
        });
      } else {
        // For text fields, preserve editing capabilities
        obj.set({
          lockRotation: true,
          cornerStyle: "rect",
          transparentCorners: false,
          borderColor: "#2563eb",
          cornerColor: "#2563eb",
          borderScaleFactor: 2,
          cornerSize: 10,
          selectable: effectiveCanEdit,
          evented: effectiveCanEdit,
          hasBorders: true,
          hasControls: effectiveCanEdit,
          editable: effectiveCanEdit, // Ensure text editing remains enabled
        });
      }


      return obj;
    },
    [effectiveCanEdit, scale, showFieldLabels, selectedColor]
  );

  // Handle field deletion
  const deleteSelectedField = useCallback(() => {
    if (!selectedFieldId || !fabricCanvasRef.current) return;

    const updatedFields = fields.filter(
      (field) => field.id !== selectedFieldId
    );
    setFields(updatedFields);
    onFieldsChange(updatedFields);

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      fabricCanvasRef.current.remove(activeObject);
    }

    // Clear tooltip if it was showing for the deleted field
    setHoveredField(null);
    setSelectedFieldId(null);
    toast.success("Field deleted");
  }, [selectedFieldId, fields, onFieldsChange]);

  /* ------------------------------------------------------------------
   * Clipboard copy-paste keyboard shortcuts (Cmd/Ctrl + C / V)
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!effectiveCanEdit || !fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events when canvas is focused or a field is selected
      if (!canvas.getActiveObject() && !selectedFieldId) return;

      const key = e.key;
      const isModifier = e.metaKey || e.ctrlKey;

      // -------------------- COPY --------------------
      if (isModifier && key === "c") {
        const activeObjects = canvas.getActiveObjects();
        if (!activeObjects.length) return;

        const copied: PDFFormField[] = [];
        activeObjects.forEach((obj) => {
          const fieldId = (obj as CustomFabricObject).fieldId;
          if (!fieldId) return;
          const original = fields.find((f) => f.id === fieldId);
          if (original) copied.push({ ...original });
        });

        if (copied.length) {
          clipboardRef.current = copied;
          toast.success(
            `${copied.length} field${copied.length > 1 ? "s" : ""} copied`
          );
          e.preventDefault();
        }
      }

      // -------------------- PASTE -------------------
      if (isModifier && key === "v") {
        if (!clipboardRef.current?.length) return;

        const timestamp = Date.now();
        const offset = 10;

        const duplicates: PDFFormField[] = clipboardRef.current.map(
          (field, idx) => ({
            ...field,
            id: `field_${timestamp}_${idx}_${Math.random()
              .toString(36)
              .slice(2, 6)}`,
            x: field.x + offset,
            y: field.y + offset,
          })
        );

        const updated = [...fields, ...duplicates];
        setFields(updated);
        onFieldsChange(updated);

        duplicates.forEach((dup) => {
          const obj = createFieldObject(dup);
          if (obj) {
            canvas.add(obj);
          }
        });

        canvas.discardActiveObject();
        canvas.renderAll();

        toast.success(
          `${duplicates.length} field${duplicates.length > 1 ? "s" : ""} pasted`
        );
        e.preventDefault();
      }

      // -------------------- DELETE -------------------
      if ((key === "Backspace" || key === "Delete") && selectedFieldId) {
        // Check if we're currently editing a text field
        const activeObject = canvas.getActiveObject();
        const isEditingText = activeObject && 
          activeObject instanceof fabric.Textbox && 
          (activeObject as any).isEditing;
        
        // Only delete the field if we're NOT currently editing text
        if (!isEditingText) {
          deleteSelectedField();
          e.preventDefault();
        }
        // If we ARE editing text, let the default behavior handle text deletion
      }
    };

    // Add event listener to canvas element instead of window
    const canvasElement = canvas.getElement();
    canvasElement.tabIndex = 1000; // Make canvas focusable
    canvasElement.addEventListener("keydown", handleKeyDown);
    
    // Also listen on window for when canvas doesn't have focus but field is selected
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (!selectedFieldId) return;
      
      const key = e.key;
      if (key === "Backspace" || key === "Delete") {
        // Check if we're currently editing a text field
        const activeObject = canvas.getActiveObject();
        const isEditingText = activeObject && 
          activeObject instanceof fabric.Textbox && 
          (activeObject as any).isEditing;
        
        // Only delete the field if we're NOT currently editing text
        if (!isEditingText) {
          deleteSelectedField();
          e.preventDefault();
        }
        // If we ARE editing text, let the default behavior handle text deletion
      }
    };
    
    window.addEventListener("keydown", handleWindowKeyDown);
    
    return () => {
      canvasElement.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [effectiveCanEdit, fields, createFieldObject, onFieldsChange, selectedFieldId, deleteSelectedField]);

  // Render fields on canvas
  const renderFieldsOnCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) {
      if (DEBUG) console.log("Canvas not initialized yet");
      return;
    }

    if (DEBUG) {
      console.log(
        "Fabric canvas size:",
        fabricCanvasRef.current.getWidth(),
        fabricCanvasRef.current.getHeight()
      );
    }

    // Clear existing objects
    const objects = fabricCanvasRef.current.getObjects();
    objects.forEach((obj) => fabricCanvasRef.current?.remove(obj));

    // Add fields for current page
    const currentPageFields = fields.filter(
      (field) => field.page === currentPage
    );
    if (DEBUG) console.log("Fields for current page:", currentPageFields);

    currentPageFields.forEach((field) => {
      const obj = createFieldObject(field);
      if (DEBUG) console.log("Created field object:", obj);

      // Only add if object was created (checkmarks are added asynchronously)
      if (obj) {
        fabricCanvasRef.current?.add(obj);

        // If this field is currently selected according to React state, keep it active
        if (field.id === selectedFieldId) {
          fabricCanvasRef.current?.setActiveObject(obj);
        }
      }
      // No need for separate text overlay since signature fields now include text in their group
    });

    fabricCanvasRef.current.renderAll();
  }, [fields, currentPage, createFieldObject, scale, selectedFieldId]);

  useEffect(() => {
    renderFieldsOnCanvas();
  }, [renderFieldsOnCanvas]);

  // Re-render fields when canvas is ready or dimensions change
  useEffect(() => {
    if (fabricCanvasRef.current && pdfDimensions && isPdfRendered) {
      renderFieldsOnCanvas();
    }
  }, [pdfDimensions, scale, renderFieldsOnCanvas, isPdfRendered, fields]);
  // Handle PDF page change and canvas resize
  const handlePageRenderSuccess = useCallback(
    (pageData: any) => {

      // Try different ways to access the viewport
      let viewport = null;

      // Method 1: Direct viewport property
      if (pageData?.viewport) {
        viewport = pageData.viewport;
      }
      // Method 2: _proxy._viewport (react-pdf specific)
      else if (pageData?._proxy?._viewport) {
        viewport = pageData._proxy._viewport;
      }
      // Method 3: getViewport method
      else if (pageData?.getViewport) {
        viewport = pageData.getViewport({ scale: 1 });
      }
      // Method 4: Check if pageData itself is the viewport
      else if (pageData?.width && pageData?.height) {
        viewport = pageData;
      }


      if (!viewport || !viewport.width || !viewport.height) {
        console.error("No valid viewport found!");
        console.error(
          "Page data structure:",
          JSON.stringify(pageData, null, 2)
        );
        return;
      }

      const dimensions = {
        width: viewport.width,
        height: viewport.height,
      };

      setPdfDimensions(dimensions);
      dimensionsSetRef.current = true;

      // Mark PDF as rendered
      setIsPdfRendered(true);

      // If canvas already exists, update its dimensions
      if (fabricCanvasRef.current) {
        if (DEBUG)
          console.log(
            "Updating canvas dimensions:",
            viewport.width * scale,
            viewport.height * scale
          );

        fabricCanvasRef.current.setDimensions({
          width: viewport.width * scale,
          height: viewport.height * scale,
        });
        fabricCanvasRef.current.setZoom(scale);

        // Defer field rendering to ensure canvas is ready
        setTimeout(() => {
          renderFieldsOnCanvas();
        }, 50);
      }
    },
    [renderFieldsOnCanvas]
  );

  // Handle adding new field
  const handleAddField = useCallback(
    (fieldType: string, x: number, y: number) => {

      if (!fabricCanvasRef.current) {
        console.error("Fabric canvas not initialized!");
        toast.error("Canvas not ready. Please wait a moment and try again.");
        return;
      }

      const defaultDimensions =
        DEFAULT_FIELD_DIMENSIONS[
          fieldType as keyof typeof DEFAULT_FIELD_DIMENSIONS
        ];

      if (fieldType === "signature") {
        setSignatureDialog({
          displayName: "Signature Field",
          recipient: "",
          actionAs: "signer",
          x: x / scale,
          y: y / scale,
          isEditing: false,
        });
        return;
      }

      if (
        !defaultDimensions ||
        !defaultDimensions.width ||
        !defaultDimensions.height
      ) {
        console.error("Invalid default dimensions:", defaultDimensions);
        toast.error("Invalid field dimensions");
        return;
      }

      const newField: PDFFormField = {
        id: `field_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 11)}`,
        type: fieldType as PDFFormField["type"],
        x: x / scale,
        y: y / scale,
        width: defaultDimensions.width,
        height: defaultDimensions.height,
        page: currentPage,
        label:
          fieldType === "text"
            ? "Sample Text"
            : `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
        required: false,
        value: fieldType === "text" ? "Sample Text" : undefined,
        color: selectedColor, // Add selected color to new fields
      };


      const updatedFields = [...fields, newField];
      setFields(updatedFields);
      onFieldsChange(updatedFields);

      // Mark this new field as selected so selection persists after re-render
      setSelectedFieldId(newField.id);

      try {
        const obj = createFieldObject(newField);

        if (!fabricCanvasRef.current) {
          console.error("Canvas reference lost!");
          toast.error("Canvas not ready");
          return;
        }

        fabricCanvasRef.current.add(obj);

        // If this is a checkmark or strikethrough field, move it above text fields
        if (newField.type === "checkmark" || newField.type === "strikethrough") {
          bringImageAboveTextFields(fabricCanvasRef.current, obj);
        }

        fabricCanvasRef.current.setActiveObject(obj);

        fabricCanvasRef.current.renderAll();

      } catch (error) {
        console.error("Error adding field to canvas:", error);
        toast.error("Failed to add field");
      }

      toast.success(
        `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} field added`
      );
    },
    [
      currentPage,
      fields,
      onFieldsChange,
      createFieldObject,
      scale,
      pdfDimensions,
    ]
  );

  // Save field metadata
  const handleSaveMetadata = useCallback(async () => {
    if (!formId) {
      toast.error("Form ID is required to save field metadata");
      return;
    }

    setIsSaving(true);
    try {
      await savePdfFieldMetadata(formId, fields);
      if (onSave) {
        await onSave(fields);
      }
      toast.success("Form field metadata saved successfully!");

      // Re-render fields on canvas after save to ensure they remain visible
      if (fabricCanvasRef.current) {
        // Use setTimeout to ensure state updates have been processed
        setTimeout(() => {
          renderFieldsOnCanvas();
        }, 100);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Failed to save form fields: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [fields, onSave, formId, renderFieldsOnCanvas]);

  // Autosave function (without re-rendering)
  const handleAutoSave = useCallback(async () => {
    if (!formId || fields.length === 0 || !effectiveCanEdit) {
      return;
    }

    setIsSavingAuto(true);
    try {
      await savePdfFieldMetadata(formId, fields);
      setLastSavedTime(new Date());
      // No toast notification for autosave to avoid spam
      // No re-rendering of fields
    } catch (error) {
      console.error("Autosave failed:", error);
      // Silent failure for autosave
    } finally {
      setIsSavingAuto(false);
    }
  }, [fields, formId, effectiveCanEdit]);

  // Set up autosave interval
  useEffect(() => {
    if (!effectiveCanEdit || !formId) {
      return;
    }

    const interval = setInterval(() => {
      handleAutoSave();
    }, 10000); // Save every 10 seconds

    return () => clearInterval(interval);
  }, [handleAutoSave, effectiveCanEdit, formId]);

  // Handle signature dialog submit
  const handleSignatureDialogSubmit = useCallback(() => {
    
    if (
      !signatureDialog ||
      !signatureDialog.displayName ||
      !signatureDialog.recipient
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    const selectedClient = dealClients.find(
      (client) => client.id === signatureDialog.recipient
    );
    const recipientValue = selectedClient?.party_email || signatureDialog.recipient;

    if (signatureDialog.isEditing && signatureDialog.fieldId) {
      // Update existing field
      const updatedFields = fields.map((field) => {
        if (field.id === signatureDialog.fieldId) {
          return {
            ...field,
            displayName: signatureDialog.displayName,
            email: recipientValue,
            actionAs: signatureDialog.actionAs,
            label: signatureDialog.displayName,
          };
        }
        return field;
      });

      setFields(updatedFields);
      onFieldsChange(updatedFields);

      // Update the canvas object
      renderFieldsOnCanvas();

      toast.success("Signature field updated");
    } else {
      // Create new field
      const defaultDimensions = DEFAULT_FIELD_DIMENSIONS.signature;
      const newField: PDFFormField = {
        id: `field_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 11)}`,
        type: "signature",
        x: signatureDialog.x,
        y: signatureDialog.y,
        width: defaultDimensions.width,
        height: defaultDimensions.height,
        page: currentPage,
        label: signatureDialog.displayName,
        required: false,
        email: recipientValue,
        displayName: signatureDialog.displayName,
        actionAs: signatureDialog.actionAs,
      };

      const updatedFields = [...fields, newField];
      setFields(updatedFields);
      onFieldsChange(updatedFields);

      const obj = createFieldObject(newField);
      fabricCanvasRef.current?.add(obj);
      fabricCanvasRef.current?.setActiveObject(obj);
      fabricCanvasRef.current?.renderAll();

      toast.success("Signature field added");
    }

    setSignatureDialog(null);
  }, [
    signatureDialog,
    currentPage,
    dealClients,
    fields,
    onFieldsChange,
    createFieldObject,
    renderFieldsOnCanvas,
  ]);

  // Generate PDF with overlays using frontend PDF generation
  const handleGeneratePdf = useCallback(async () => {
    if (DEBUG) {
    }

    if (!formId) {
      toast.error("Form ID is required to generate PDF");
      return;
    }

    setIsGeneratingPdf(true);

    try {
      // First, save the current field metadata to ensure it's persisted
      await handleSaveMetadata();

      // Load the metadata back to ensure we're using the exact same data
      const savedFields = await loadPdfFieldMetadata(formId);

      if (!savedFields || savedFields.length === 0) {
        toast.error("No fields to apply to PDF");
        return;
      }

      // Convert PDFFormField to PDFGeneratorField format
      const generatorFields: PDFGeneratorField[] = savedFields.map(
        (field: PDFFormField) => ({
          id: field.id,
          type: field.type,
          x: field.x,
          y: field.y,
          width: field.width,
          height: field.height,
          page: field.page,
          value: field.value,
          color: field.color,
          label: field.label,
          email: field.email,
          displayName: field.displayName,
          actionAs: field.actionAs,
        })
      );

      // Apply fields to PDF using frontend generation
      const { pdfBlob } = await applyFieldsToPDF(pdfUrl, generatorFields, {
        onSchemaUpdate: async (signatureFields: SchemaItem[]) => {
          try {
            await updateFormCustomSchema(formId, signatureFields, savedFields);
          } catch (error) {
            console.error(
              "[SCHEMA-UPDATE] Failed to update custom schema:",
              error
            );
            // Don't throw here - let PDF generation continue even if schema update fails
          }
        },
      });

      // Upload the generated PDF to Supabase
      // const uploadResult = await uploadGeneratedPDF(pdfBlob, formId);
      const uploadResult = await uploadGeneratedPDF(pdfBlob, formId);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload PDF");
      }


      // Update local state
      setIsPdfLocked(true);

      // Call the parent's callback if provided
      if (onSaveWithOverlays && uploadResult.pdfUrl) {
        await onSaveWithOverlays(uploadResult.pdfUrl, formId);
      }

      toast.success("PDF generated and locked successfully!");
    } catch (error) {
      console.error("[PDF-GEN] PDF generation failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [fields, onSaveWithOverlays, pdfUrl, formId, handleSaveMetadata]);

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
    <TooltipProvider>
      <>
        <div className="w-full h-full flex">
          {/* Sidebar */}
          {effectiveCanEdit && (
            <div className="w-64 bg-gray-50 border-r p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Form Fields</h3>
                <p className="text-xs text-gray-500">
                  {!pdfDimensions ? "Loading PDF..." : "Click to add to PDF"}
                </p>
                {!pdfDimensions && (
                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    PDF is loading. Fields will be available once the PDF is
                    rendered.
                  </div>
                )}
                <div className="grid grid-cols-1 gap-2">
                  {FIELD_TYPES.map(({ type, icon: Icon, label }) => (
                    <Button
                      key={type}
                      variant="outline"
                      className="justify-start"
                      disabled={!pdfDimensions || !isPdfRendered}
                      onClick={() => {

                        if (!pdfDimensions) {
                          console.error("PDF dimensions not available");
                          toast.error("Please wait for PDF to load");
                          return;
                        }

                        const fieldDimensions =
                          DEFAULT_FIELD_DIMENSIONS[
                            type as keyof typeof DEFAULT_FIELD_DIMENSIONS
                          ];

                        if (!fieldDimensions) {
                          console.error(
                            "No default dimensions for field type:",
                            type
                          );
                          return;
                        }

                        const centerX =
                          pdfDimensions.width / 2 - fieldDimensions.width / 2;
                        const centerY =
                          pdfDimensions.height / 2 - fieldDimensions.height / 2;


                        handleAddField(type, centerX, centerY);
                      }}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Controls</h3>
                <div className="flex flex-col gap-2">
                  <div>
                    <Label htmlFor="colorPicker" className="text-xs">
                      Field Color
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        id="colorPicker"
                        type="color"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-full h-10 border rounded cursor-pointer"
                        title="Choose color for text and checkmarks"
                      />
                      <span className="text-xs text-gray-600 min-w-[60px]">
                        {selectedColor}
                      </span>
                    </div>
                  </div>

                  {selectedFieldId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const updatedFields = fields.map((field) => {
                          if (field.id === selectedFieldId) {
                            return { ...field, color: selectedColor };
                          }
                          return field;
                        });
                        setFields(updatedFields);
                        onFieldsChange(updatedFields);
                        renderFieldsOnCanvas();
                        toast.success("Field color updated");
                      }}
                      className="w-full justify-start"
                    >
                      Apply Color to Selected
                    </Button>
                  )}

                  {selectedFieldId && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={deleteSelectedField}
                      className="w-full justify-start"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Actions</h3>

                {/* Autosave Status Indicator */}
                <div className="text-xs p-2 bg-gray-100 rounded-md flex items-center justify-between">
                  <span className="text-gray-600">Autosave:</span>
                  <span
                    className={`flex items-center gap-1 ${
                      isSavingAuto
                        ? "text-blue-600"
                        : lastSavedTime
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {isSavingAuto ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        Saving...
                      </>
                    ) : lastSavedTime ? (
                      <>
                        <Check className="w-3 h-3" />
                        Saved {new Date(lastSavedTime).toLocaleTimeString()}
                      </>
                    ) : (
                      "Not saved yet"
                    )}
                  </span>
                </div>

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
                  disabled={isGeneratingPdf || isPdfLocked}
                  className="w-full"
                >
                  {isGeneratingPdf ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating PDF...
                    </>
                  ) : isPdfLocked ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      PDF is Locked
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      {formId
                        ? "Prepare for Signatures"
                        : "Generate PDF with Fields"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Main canvas area */}
          <div className="flex-1 flex flex-col">
            {/* Lock status banner */}
            {isPdfLocked && (
              <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span className="text-sm text-amber-800 font-medium">
                    This PDF has been locked. Only signature fields can be
                    viewed and signed.
                  </span>
                </div>
              </div>
            )}

            {/* Page navigation */}
            <div className="bg-white border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                  }}
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
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, numPages));
                  }}
                  disabled={currentPage >= numPages}
                >
                  Next
                </Button>
              </div>

              <div className="text-sm text-gray-600">
                {fields.filter((f) => f.page === currentPage).length} field
                {fields.filter((f) => f.page === currentPage).length !== 1
                  ? "s"
                  : ""}{" "}
                on this page
              </div>
            </div>

            {/* PDF and Canvas container */}
            <div className="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center">
              <div
                className="pdf-container"
                ref={pdfContainerRef}
                style={{
                  position: "relative",
                  display: "inline-block",
                  lineHeight: 0,
                  backgroundColor: "white",
                  boxShadow:
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    lineHeight: 0,
                  }}
                >
                  {/* PDF Layer */}
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={async (pdf) => {
                      setNumPages(pdf.numPages);
                      setIsPdfLoaded(true);

                      // Try to get page dimensions from the first page
                      try {
                        const firstPage = await pdf.getPage(1);

                        if (firstPage) {
                          // Use the official PDF.js API, which avoids accessing non-typed properties
                          const viewport = firstPage.getViewport({ scale: 1 });

                          if (viewport && !dimensionsSetRef.current) {
                            const dimensions = {
                              width: viewport.width,
                              height: viewport.height,
                            };
                            setPdfDimensions(dimensions);
                            dimensionsSetRef.current = true;
                          }
                        }
                      } catch (error) {
                        console.error("Error getting first page:", error);
                        // Don't throw, just log the error
                      }
                    }}
                    onLoadError={(error) => {
                      console.error("=== PDF Load Error ===", error);
                    }}
                    className="pdf-document"
                    options={pdfOptions}
                  >
                    <Page
                      pageNumber={currentPage}
                      scale={scale}
                      onRenderSuccess={(event) => {
                        handlePageRenderSuccess(event);
                      }}
                      onRenderError={(error) => {
                        console.error("=== PDF Page Render Error ===", error);
                      }}
                      onLoadSuccess={(page) => {

                        // Try to get dimensions from onLoadSuccess as well
                        if (page && !dimensionsSetRef.current) {
                          try {
                            // Use the official PDF.js API, which avoids accessing non-typed properties
                            const viewport = page.getViewport?.({ scale: 1 });
                            if (viewport?.width && viewport?.height) {
                              setPdfDimensions({
                                width: viewport.width,
                                height: viewport.height,
                              });
                              dimensionsSetRef.current = true;
                              setIsPdfRendered(true);
                            }
                          } catch (error) {
                            console.error(
                              "Error extracting viewport from page:",
                              error
                            );
                            // Don't throw, just log the error
                          }
                        }
                      }}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>

                  {/* Fabric Canvas Overlay - Inside the same container */}
                  {isPdfLoaded && pdfDimensions && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: pdfDimensions.width * scale,
                        height: pdfDimensions.height * scale,
                        pointerEvents: effectiveCanEdit ? "auto" : "none",
                        zIndex: 100,
                      }}
                    >
                      <canvas
                        ref={canvasRef}
                        width={pdfDimensions.width * scale}
                        height={pdfDimensions.height * scale}
                        className="fabric-overlay"
                        style={{
                          display: "block",
                          border: DEBUG ? "2px solid red" : "none",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

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
              {/* <div>
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
              </div> */}
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
                    {(() => {
                      return null;
                    })()}
                    {isLoadingClients ? (
                      <SelectItem value="loading" disabled>
                        Loading clients...
                      </SelectItem>
                    ) : (
                      <>
                        {dealClients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.party_role} ({client.party_email})
                          </SelectItem>
                        ))}
                        <div className="border-t mt-1 pt-1">
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-sm py-1.5 px-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none cursor-default"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              // Save the current signature dialog state
                              if (signatureDialog) {
                                signatureDialogBeforeAddParty.current = {
                                  ...signatureDialog,
                                };
                              }

                              // Use setTimeout to ensure the select dropdown closes properly before opening the new modal
                              setTimeout(() => {
                                setSignatureDialog(null);
                                setIsAddPartyModalOpen(true);
                              }, 0);
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
              <Button
                variant="outline"
                onClick={() => setSignatureDialog(null)}
              >
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
          existingEmails={dealClients.map(client => client.party_email)}
          onClose={() => {
            setIsAddPartyModalOpen(false);
            // Restore signature dialog if it was open before
            if (signatureDialogBeforeAddParty.current) {
              const dialogToRestore = {
                ...signatureDialogBeforeAddParty.current,
              };
              signatureDialogBeforeAddParty.current = null;
              setTimeout(() => {
                setSignatureDialog(dialogToRestore);
              }, 100);
            }
          }}
          onPartyAdded={async () => {
            setIsAddPartyModalOpen(false);
            await fetchDealClients();
            toast.success("Party added successfully");

            // Use setTimeout to ensure modal closes before reopening signature dialog
            if (signatureDialogBeforeAddParty.current) {
              const dialogToRestore = {
                ...signatureDialogBeforeAddParty.current,
              };
              signatureDialogBeforeAddParty.current = null;
              setTimeout(() => {
                setSignatureDialog(dialogToRestore);
              }, 100);
            }
          }}
          dealId={dealId}
          dealSide={dealSide}
          dealOptionName={dealOptionName}
        />

        {/* Tooltip for truncated signature fields */}
        {hoveredField && (
          <div
            style={{
              position: "fixed",
              left: hoveredField.x,
              top: hoveredField.y,
              transform: "translateX(-50%)",
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            <Tooltip open={true}>
              <TooltipTrigger asChild>
                <div />
              </TooltipTrigger>
              <TooltipContent>
                <p className="whitespace-pre-line">{hoveredField.text}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </>
    </TooltipProvider>
  );
}
