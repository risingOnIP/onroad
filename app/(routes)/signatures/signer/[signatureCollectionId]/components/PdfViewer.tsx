import React, { useRef } from "react";
import { Document, Page } from "react-pdf";
import { pdfScale, deepClone } from "../utils/pdf-utils";
import { toast } from "sonner";

interface SigningWidget {
  displayName: string;
  unique_id: string;
  fields: Array<{
    pageNum: number;
    x: number;
    y: number;
    w: number;
    h: number;
    width?: number;
    height?: number;
    formfield_name?: string;
    unique_id?: string;
    mappingDetails: any;
    signaturePng: string | null;
  }>;
}

interface ActiveTarget {
  widgetIdx: number;
  fieldIdx: number;
}

interface PdfViewerProps {
  pdfUrl: string;
  numPages: number;
  signingWidgets: SigningWidget[];
  submitted: boolean;
  onActiveTargetChange: (target: ActiveTarget | null) => void;
  onSigningWidgetsChange: (widgets: SigningWidget[]) => void;
  onLoadError: (error: any) => void;
  onLoadSuccess: (data: { numPages: number }) => void;
  scrollPosition: { x: number; y: number };
  onScrollPositionChange: (position: { x: number; y: number }) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfUrl,
  numPages,
  signingWidgets,
  submitted,
  onActiveTargetChange,
  onSigningWidgetsChange,
  onLoadError,
  onLoadSuccess,
  scrollPosition,
  onScrollPositionChange,
}) => {
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const saveScrollPosition = () => {
    if (pdfContainerRef.current) {
      onScrollPositionChange({
        x: Math.round(pdfContainerRef.current.scrollLeft),
        y: Math.round(pdfContainerRef.current.scrollTop),
      });
    }
  };

  const restoreScrollPosition = () => {
    if (pdfContainerRef.current && (scrollPosition.x || scrollPosition.y)) {
      [0, 100, 300].forEach((delay) =>
        setTimeout(() => {
          if (pdfContainerRef.current) {
            pdfContainerRef.current.scrollLeft = scrollPosition.x;
            pdfContainerRef.current.scrollTop = scrollPosition.y;
          }
        }, delay)
      );
    }
  };

  const handleLoadError = (e: any) => {
    if (e.message.includes("worker is being destroyed")) {
      // Handle PDF worker destruction error
      const tmp = pdfUrl;
      setTimeout(() => onLoadError(null), 0);
      setTimeout(() => onLoadError(tmp), 50);
    }
    console.error(e);
    toast.error("Could not load PDF preview");
  };

  return (
    <div
      ref={pdfContainerRef}
      className="flex-1 bg-card rounded-lg shadow-sm p-4 flex justify-center overflow-y-auto"
      onScroll={saveScrollPosition}
    >
      <Document
        key={pdfUrl}
        file={pdfUrl}
        onLoadError={handleLoadError}
        onLoadSuccess={(data) => {
          onLoadSuccess(data);
          requestAnimationFrame(restoreScrollPosition);
        }}
        loading={
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        }
        className="flex flex-col items-center"
      >
        {Array.from({ length: numPages }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              pageRefs.current[i] = el;
            }}
            className="relative inline-block mx-auto mb-8"
          >
            <Page
              pageNumber={i + 1}
              scale={pdfScale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg"
            />

            {/* UNSIGNED FIELDS */}
            {signingWidgets.flatMap((w, widgetIdx) =>
              w.fields
                .filter(
                  (f) =>
                    f.pageNum === i + 1 &&
                    !f.signaturePng &&
                    !submitted
                )
                .map((f, fieldIdx) => (
                  <button
                    key={`${f.formfield_name || f.unique_id || 'field'}-unsigned`}
                    onClick={() =>
                      onActiveTargetChange({ widgetIdx, fieldIdx })
                    }
                    className="absolute cursor-pointer transition-all duration-200 hover:bg-info/10"
                    style={{
                      left: f.x * (1 / pdfScale),
                      top: f.y * (1 / pdfScale),
                      width: (f.width || f.w) * (1 / pdfScale),
                      height: (f.height || f.h) * (1 / pdfScale),
                      background: "#EFF6FF",
                      border: "2px dashed #3b82f6",
                      zIndex: 10,
                    }}
                  />
                ))
            )}

            {/* SIGNED (editable) */}
            {signingWidgets.flatMap((w, widgetIdx) =>
              w.fields
                .filter(
                  (f) =>
                    f.pageNum === i + 1 &&
                    f.signaturePng &&
                    !submitted
                )
                .map((f, fieldIdx) => (
                  <div
                    key={`${f.unique_id || f.formfield_name || 'field'}-signed`}
                    className="absolute"
                    style={{
                      left: f.x * (1 / pdfScale),
                      top: f.y * (1 / pdfScale),
                      width: f.w * (1 / pdfScale),
                      height: f.h * (1 / pdfScale),
                      zIndex: 10,
                    }}
                  >
                    <button
                      onClick={() => {
                        const copy = deepClone(signingWidgets);
                        copy[widgetIdx].fields[fieldIdx].signaturePng = "";
                        onSigningWidgetsChange(copy);
                      }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 text-destructive text-lg cursor-pointer"
                      style={{ zIndex: 11 }}
                    >
                      ×
                    </button>
                  </div>
                ))
            )}
          </div>
        ))}
      </Document>
    </div>
  );
};