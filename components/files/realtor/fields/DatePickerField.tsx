import React, { useCallback, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SchemaItem } from "../../types/realtor";

interface DatePickerFieldProps {
  schema: SchemaItem;
  value: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
  disabled?: boolean;
  shouldDisableForClientIntake?: boolean;
}

const DatePickerField = React.memo<DatePickerFieldProps>(
  ({
    schema,
    value,
    onChange,
    onBlur,
    disabled = false,
    shouldDisableForClientIntake = false,
  }) => {
    const [open, setOpen] = useState(false);

    // Parse the date value
    const dateValue = value ? new Date(value) : undefined;

    // Track the current month for the calendar navigation
    const [month, setMonth] = useState<Date>(dateValue || new Date());

    const handleSelect = useCallback(
      (date: Date | undefined) => {
        if (date) {
          // Format as MM/DD/YYYY
          const formattedDate = format(date, "MM/dd/yyyy");
          onChange(formattedDate);
          setOpen(false);
        }
      },
      [onChange]
    );

    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        // Only call onChange to trigger the save through the parent's handleFieldChange
        onChange("");
      },
      [onChange]
    );

    const { placeholder } = schema.display_attributes;

    return (
      <div className="relative w-full">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                value && !disabled && !shouldDisableForClientIntake && "pr-10",
                !value && "text-muted-foreground",
                shouldDisableForClientIntake
                  ? "bg-blue-50 border-blue-200 cursor-not-allowed"
                  : "bg-white"
              )}
              disabled={disabled || shouldDisableForClientIntake}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? value : placeholder || "MM/DD/YYYY"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleSelect}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              fromYear={1900}
              toYear={2100}
              autoFocus
            />
          </PopoverContent>
        </Popover>
        {value && !disabled && !shouldDisableForClientIntake && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            onClick={handleClear}
            aria-label="Clear date"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>
    );
  }
);

DatePickerField.displayName = "DatePickerField";

export default DatePickerField;
