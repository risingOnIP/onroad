import React from "react";
import { EyeIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VisibilityCondition, VisibilityModalProps } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const VisibilityModal: React.FC<VisibilityModalProps> = ({
  isOpen,
  itemId,
  currentVisibility = [],
  availableItems,
  onClose,
  onSave,
}) => {
  const [conditions, setConditions] = React.useState<VisibilityCondition[]>([]);
  const [dependsOnField, setDependsOnField] = React.useState<string>("");
  const [operator, setOperator] = React.useState<string>("==");
  const [value, setValue] = React.useState<string>("");

  React.useEffect(() => {
    if (isOpen) {
      setConditions(currentVisibility || []);
      setDependsOnField("");
      setOperator("==");
      setValue("");
    }
  }, [isOpen, currentVisibility]);

  const handleAddCondition = () => {
    if (!dependsOnField || !value.trim()) return;
    
    const newCondition: VisibilityCondition = {
      dependsOnField,
      operator,
      value: value.trim(),
    };
    
    setConditions((prev) => [...prev, newCondition]);
    setDependsOnField("");
    setOperator("==");
    setValue("");
  };

  const handleRemoveCondition = (idx: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onSave(conditions);
    onClose();
  };

  const isAddButtonDisabled = !dependsOnField || !value.trim();

  // Helper to get operator display text
  const getOperatorText = (op: string) => {
    switch (op) {
      case "==": return "equals";
      case "!=": return "does not equal";
      case ">": return "greater than";
      case "<": return "less than";
      default: return op;
    }
  };

  // Helper to get field name
  const getFieldName = (fieldId: string) => {
    const field = availableItems.find((f) => f.id === fieldId);
    return field?.label || fieldId;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <EyeIcon className="w-6 h-6 text-indigo-600" />
            Configure Conditional Visibility
          </DialogTitle>
          <DialogDescription>
            Set conditions to control when this form item should be visible to users.
            The item will only appear when all conditions are met.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section for adding a new condition */}
          <Card className="bg-slate-50/50 p-4">
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-2 block font-semibold">
                    1. Select Field
                  </Label>
                  <Select value={dependsOnField} onValueChange={setDependsOnField}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableItems
                        .filter((f) => f.id !== itemId)
                        .map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block font-semibold">
                    2. Select Condition
                  </Label>
                  <Select value={operator} onValueChange={setOperator}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="==">equals</SelectItem>
                      <SelectItem value="!=">does not equal</SelectItem>
                      <SelectItem value=">">greater than</SelectItem>
                      <SelectItem value="<">less than</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block font-semibold">
                    3. Enter Value
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter value..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleAddCondition}
                  disabled={isAddButtonDisabled}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Condition
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section for displaying current conditions */}
          {conditions.length > 0 && (
            <div>
              <Label className="mb-3 block text-lg font-semibold">
                Current Conditions
              </Label>
              <div className="space-y-2 rounded-lg border bg-white p-3">
                {conditions.map((cond, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-md bg-slate-50 p-2 transition-all"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{getFieldName(cond.dependsOnField)}</Badge>
                      <span className="text-slate-500">→</span>
                      <span className="font-medium text-slate-800">
                        {getOperatorText(cond.operator)} &quot;{cond.value}&quot;
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-100 hover:text-red-600 h-8 w-8"
                      onClick={() => handleRemoveCondition(idx)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={conditions.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Save Conditions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
