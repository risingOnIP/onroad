"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Stage {
  name: string;
  color: string;
  order: number;
}

interface StageSelectorProps {
  stages: Stage[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}

export function StageSelector({
  stages,
  value,
  onChange,
  label = "Stage",
}: StageSelectorProps) {
  const formatStageName = (name: string) =>
    name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return (
    <div className="space-y-2">
      <Label htmlFor="stage-select">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="stage-select">
          <SelectValue placeholder="Select a stage" />
        </SelectTrigger>
        <SelectContent>
          {stages.map((stage) => (
            <SelectItem key={stage.name} value={stage.name}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span>{formatStageName(stage.name)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}