import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, GripVertical, MoreHorizontal, Trash2 } from "lucide-react";
import { Form, TemplateForm } from "../types/realtor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SortableFormItemProps {
  form: Form | TemplateForm;
  activeFormId: string | null;
  handleFormClick: (formId: string) => void;
  beautifyFormType: (formType: string) => string;
  onFormDeleted?: (formId: string) => void;
}

export function SortableFormItem({
  form,
  activeFormId,
  handleFormClick,
  beautifyFormType,
  onFormDeleted,
}: SortableFormItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: form.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
       flex w-full items-center gap-2 rounded-md px-2 py-1.5
       text-sm touch-none group ${
         // touch-none is important for mobile
         form.id === activeFormId
           ? "bg-muted text-foreground"
           : "text-muted-foreground hover:bg-muted"
       }
      `}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 -m-0.5 hover:bg-muted-foreground/10 rounded"
      >
        <GripVertical className="h-3 w-3 shrink-0" />
      </div>
      <button
        className="flex items-center gap-2 flex-1 text-left"
        onClick={() => handleFormClick(form.id)}
      >
        <FileText className="h-4 w-4 shrink-0" />
        {beautifyFormType(form.form_type)}
      </button>
      {onFormDeleted && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
              onClick={(e) => e.stopPropagation()}
              title="More options"
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50"
            sideOffset={5}
          >
            <DropdownMenuItem
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer bg-white text-red-600 hover:bg-red-100 hover:text-red-700 focus:bg-red-100 focus:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onFormDeleted(form.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete Form
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
