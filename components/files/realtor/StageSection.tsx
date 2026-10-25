"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Form, TemplateForm } from "../types/realtor";
import { SortableFormItem } from "./SortableFormItem";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface StageSectionProps {
  stage: {
    name: string;
    color: string;
    order: number;
  };
  forms: (Form | TemplateForm)[];
  activeFormId: string | null;
  handleFormClick: (formId: string) => void;
  beautifyFormType: (formType: string) => string;
  isOver?: boolean;
}

export function StageSection({
  stage,
  forms,
  activeFormId,
  handleFormClick,
  beautifyFormType,
  isOver = false,
}: StageSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { setNodeRef } = useDroppable({
    id: `stage-${stage.name}`,
    data: {
      type: 'stage-droppable',
      stageName: stage.name,
    },
  });

  const stageDisplayName = stage.name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mb-4 rounded-lg border transition-all duration-200",
        isOver && "ring-2 ring-offset-2"
      )}
      style={{
        borderColor: stage.color,
        ...(isOver && { ringColor: stage.color }),
      }}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-left font-medium rounded-t-lg transition-colors",
          "hover:bg-opacity-10"
        )}
        style={{
          backgroundColor: `${stage.color}15`,
          color: stage.color,
        }}
      >
        <div className="flex items-center gap-2">
          <span>{stageDisplayName}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full bg-white"
            style={{ color: stage.color }}
          >
            {forms.length}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            isCollapsed && "rotate-180"
          )}
        />
      </button>

      {!isCollapsed && (
        <div className="p-2">
          {forms.length > 0 ? (
            <SortableContext
              items={forms.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {forms.map((form) => (
                <SortableFormItem
                  key={form.id}
                  form={form}
                  activeFormId={activeFormId}
                  handleFormClick={handleFormClick}
                  beautifyFormType={beautifyFormType}
                />
              ))}
            </SortableContext>
          ) : (
            <div
              className="py-8 px-4 text-center text-sm text-gray-500 border-2 border-dashed rounded-lg"
              style={{ borderColor: `${stage.color}30` }}
            >
              <p>No forms in {stageDisplayName}</p>
              <p className="text-xs mt-1">Drag forms here to add them</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}