import React from "react";
import { Button } from "@/components/ui/button";
import { SaveHeaderProps } from "../types";

export const SaveHeader: React.FC<SaveHeaderProps> = ({
  title,
  isSaving,
  lastSaved,
  hasUnsavedChanges,
  error,
  onSave,
  disabled = false,
}) => {
  return (
    <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isSaving && (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Saving...</span>
            </>
          )}
          {!isSaving && lastSaved && (
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          )}
          {!isSaving && hasUnsavedChanges && (
            <span className="text-orange-600">Unsaved changes</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {error && <span className="text-red-600 text-sm">{error}</span>}
        <Button
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges || disabled}
          className="bg-blue-600 hover:bg-blue-700"
          title={disabled ? "Cannot save published forms" : undefined}
        >
          {isSaving ? "Saving..." : "Save Form"}
        </Button>
      </div>
    </div>
  );
}; 