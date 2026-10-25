import React, { useCallback, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SchemaItem } from "../../types/realtor";

interface MonthYearFieldProps {
  schema: SchemaItem;
  value: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
  disabled?: boolean;
  shouldDisableForClientIntake?: boolean;
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MonthYearField = React.memo<MonthYearFieldProps>(
  ({
    schema,
    value,
    onChange,
    disabled = false,
    shouldDisableForClientIntake = false,
  }) => {
    const [open, setOpen] = useState(false);

    // Parse the value (expected format: "January 2025")
    const parseValue = (val: string) => {
      if (!val) return { month: "", year: "" };
      const parts = val.split(" ");
      if (parts.length === 2) {
        return { month: parts[0], year: parts[1] };
      }
      return { month: "", year: "" };
    };

    const { month: selectedMonth, year: selectedYear } = parseValue(value);

    // Generate year options (current year +/- 10 years)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 21 }, (_, i) => 
      (currentYear - 10 + i).toString()
    );

    const handleMonthChange = useCallback(
      (newMonth: string) => {
        if (selectedYear) {
          const newValue = `${newMonth} ${selectedYear}`;
          onChange(newValue);
        } else {
          // If no year selected yet, default to current year
          const newValue = `${newMonth} ${currentYear}`;
          onChange(newValue);
        }
      },
      [selectedYear, currentYear, onChange]
    );

    const handleYearChange = useCallback(
      (newYear: string) => {
        if (selectedMonth) {
          const newValue = `${selectedMonth} ${newYear}`;
          onChange(newValue);
        } else {
          // If no month selected yet, default to January
          const newValue = `January ${newYear}`;
          onChange(newValue);
        }
      },
      [selectedMonth, onChange]
    );

    const handleClear = useCallback(() => {
      onChange("");
      setOpen(false);
    }, [onChange]);

    const { placeholder } = schema.display_attributes;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              shouldDisableForClientIntake
                ? "bg-blue-50 border-blue-200 cursor-not-allowed"
                : "bg-white"
            )}
            disabled={disabled || shouldDisableForClientIntake}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? value : placeholder || "Select month and year"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select
                value={selectedMonth}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select
                value={selectedYear}
                onValueChange={handleYearChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                type="button"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setOpen(false)}
                type="button"
                disabled={!selectedMonth || !selectedYear}
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

MonthYearField.displayName = "MonthYearField";

export default MonthYearField;