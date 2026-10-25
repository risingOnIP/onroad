"use client";

import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SignatureCanvas from "react-signature-canvas";
import { RefreshCcw } from "lucide-react";

interface SignerPadProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApplySignatureClicked: (signatureData: string) => void;
  isApplyingSignature: boolean;
  options: string[] //signature png options
}

//to deploy to vercel

const SignerPad = ({
  isOpen,
  onOpenChange,
  onApplySignatureClicked,
  isApplyingSignature,
  options = [],
}: SignerPadProps) => {
  const signaturePadRef = useRef<SignatureCanvas>(null);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleEnd = () => {
    if (signaturePadRef.current) {
      const isEmpty = signaturePadRef.current.isEmpty();
    }
  };
  const handleApply = () => {
    if (!signaturePadRef.current) {
      console.error("Vercel Log: Signature pad ref is not available.");
      return;
    }

    if (typeof signaturePadRef.current.getTrimmedCanvas !== "function") {
      console.error(
        "Vercel Log: getTrimmedCanvas is NOT a function on signaturePadRef.current!"
      );
      try {
        // Attempt to use toDataURL directly as a further diagnostic
        const directDataUrl = signaturePadRef.current.toDataURL("image/png");
      } catch (e) {
        console.error("Vercel Log: Direct toDataURL call also failed:", e);
      }
      return;
    }

    const trimmedCanvas = signaturePadRef.current.getTrimmedCanvas();
    const trimmedDataUrl = trimmedCanvas.toDataURL("image/png");

    const isReallyEmpty =
      trimmedCanvas.width === 0 ||
      trimmedCanvas.height === 0 ||
      signaturePadRef.current.isEmpty();

    if (isReallyEmpty) {
      console.warn("Vercel Log: Signature is empty, not applying");
      return;
    }

    onApplySignatureClicked(trimmedDataUrl);
    onOpenChange(false);
  };

  const handleOptionClick = (signatureDataUrl: string) => {
    onApplySignatureClicked(signatureDataUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sign Document</DialogTitle>
          <DialogDescription>
            Please sign the document using the pad below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="border rounded-md bg-white mx-auto"
            style={{
              width: 500,
              height: 200,
              border: "1px solid darkblue",
              padding: 0,
              overflow: "hidden",
            }}
          >
            <SignatureCanvas
              ref={signaturePadRef}
              penColor="black"
              canvasProps={{
                width: 500,
                height: 200,
                style: {
                  touchAction: "none",
                  display: "block",
                },
              }}
              onEnd={handleEnd}
              clearOnResize={true}
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="cursor-pointer"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>

          {options.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-500"></div>
                <span className="text-sm text-gray-500 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-500"></div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Select a saved signature:</p>
                <div className="grid grid-cols-3 gap-3">
                  {options.map((signatureDataUrl, index) => (
                    <div
                      key={index}
                      onClick={() => handleOptionClick(signatureDataUrl)}
                      className="border-2 border-gray-300 rounded-md p-3 cursor-pointer hover:border-blue-500 transition-colors bg-white"
                    >
                      <img
                        src={signatureDataUrl}
                        alt={`Signature option ${index + 1}`}
                        className="h-16 w-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
            disabled={isApplyingSignature}
          >
            Cancel
          </Button>
          <Button
            className="cursor-pointer"
            onClick={handleApply}
            disabled={isApplyingSignature}
          >
            {isApplyingSignature ? "Applying..." : "Apply Signature"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignerPad;
