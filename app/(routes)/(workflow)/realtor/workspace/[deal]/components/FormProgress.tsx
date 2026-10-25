"use client";

import React, { useState } from "react";
import { Check, AlertCircle, Info } from "lucide-react";
import clsx from "clsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SchemaItem } from "@/components/files/types/realtor";

interface FormProgressProps {
  completed: number;
  total: number;
  percentage: number;
  isComplete: boolean;
  missingFields?: SchemaItem[];
  className?: string;
}

export const FormProgress: React.FC<FormProgressProps> = ({
  completed,
  total,
  percentage,
  isComplete,
  missingFields = [],
  className,
}) => {
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  // Calculate RGB values for smooth color transition with muted tones
  const getProgressGradient = () => {
    // Muted Red to Muted Yellow (0-50%)
    // Muted Yellow to Muted Green (50-100%)
    
    let r, g, b;
    
    if (percentage <= 50) {
      // Muted Red (220, 38, 38) to Muted Yellow (250, 204, 21)
      const progress = percentage / 50;
      r = Math.round(220 + (250 - 220) * progress);
      g = Math.round(38 + (204 - 38) * progress);
      b = Math.round(38 + (21 - 38) * progress);
    } else {
      // Muted Yellow (250, 204, 21) to Muted Green (34, 197, 94)
      const progress = (percentage - 50) / 50;
      r = Math.round(250 - (250 - 34) * progress);
      g = Math.round(204 - (204 - 197) * progress);
      b = Math.round(21 + (94 - 21) * progress);
    }
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className={clsx("w-full", className)}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs text-gray-500">Progress</span>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-600">{percentage}%</span>
          {isComplete ? (
            <Check className="w-3 h-3 text-green-600" />
          ) : (
            <>
              <span className="text-gray-500">
                ({completed}/{total})
              </span>
              {missingFields.length > 0 && (
                <button
                  onClick={() => setShowMissingFieldsModal(true)}
                  className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                  title="View missing fields"
                >
                  <Info className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-1 relative overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getProgressGradient()
          }}
        />
      </div>
      
      {/* Missing Fields Modal */}
      <Dialog open={showMissingFieldsModal} onOpenChange={setShowMissingFieldsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Missing Required Fields</DialogTitle>
            <DialogDescription>
              Please complete the following required fields to finish the form:
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
            {missingFields.map((field, index) => {
              const displayName = field.display_attributes.display_name;
              const blockName = field.display_attributes.block;
              
              return (
                <div
                  key={field.unique_id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 text-sm"
                >
                  <span className="text-gray-500 font-medium min-w-[20px]">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      {displayName || "Required field"}
                    </span>
                    {blockName && (
                      <span className="text-gray-500 text-xs block">
                        in {blockName}
                      </span>
                    )}
                    {field.display_attributes.description && (
                      <span className="text-gray-600 text-xs block mt-0.5">
                        {field.display_attributes.description}
                      </span>
                    )}
                  </div>
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMissingFieldsModal(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormProgress;