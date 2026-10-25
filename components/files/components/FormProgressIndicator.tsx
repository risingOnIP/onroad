"use client";

import React from "react";
import { Check, AlertCircle, Info } from "lucide-react";
import clsx from "clsx";
import { FormProgress } from "../utils/formProgress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FormProgressIndicatorProps {
  progress: FormProgress;
  title?: string;
  showMissingFields?: boolean;
  className?: string;
}



export const FormProgressIndicator: React.FC<FormProgressIndicatorProps> = ({
  progress,
  title = "Form Progress",
  showMissingFields = false,
  className,
}) => {

  function capitalizeFirstLetter(str: string) {
    if (typeof str !== 'string' || str.length === 0) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  const getProgressColor = () => {
    if (progress.isComplete) return "bg-green-600";
    if (progress.percentage >= 75) return "bg-blue-600";
    if (progress.percentage >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getProgressIcon = () => {
    if (progress.isComplete) {
      return <Check className="w-4 h-4 text-green-600" />;
    }
    if (progress.percentage < 50) {
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
    return null;
  };

  return (
    <div className={clsx("w-full", className)}>
      <div className="pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {progress.completed} of {progress.total} required
            </span>
            <div className="flex items-center gap-1">
              {getProgressIcon()}
              {showMissingFields && progress.missingFields.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-1">
                      <Info className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Missing Required Fields
                      </DialogTitle>
                      <DialogDescription>
                        Complete these fields to submit your form.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <ul className="space-y-2">
                        {progress.missingFields.map((field) => (
                          <li
                            key={field.unique_id}
                            className="flex items-start gap-2"
                          >
                            <span className="text-orange-500 text-sm">•</span>
                            <span className="text-sm text-foreground">
                              {field.display_attributes.display_name || (`${capitalizeFirstLetter(field.display_attributes.input_type)} in ${field.display_attributes.block}`)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={clsx(
              "h-2 rounded-full transition-all duration-300",
              getProgressColor()
            )}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {progress.percentage}% complete
          </span>
          {progress.isComplete && (
            <span className="text-xs text-green-600 font-medium">Complete</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormProgressIndicator;
