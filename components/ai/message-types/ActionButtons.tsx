"use client";

import { Button } from "@/components/ui/button";

interface ActionButton {
  label: string;
  action: string;
  style?: "primary" | "secondary" | "danger";
}

interface ActionButtonsProps {
  buttons: ActionButton[];
  onButtonClick: (action: string) => void;
}

export function ActionButtons({ buttons, onButtonClick }: ActionButtonsProps) {
  const getButtonVariant = (style?: string) => {
    switch (style) {
      case "primary":
        return "default";
      case "secondary":
        return "outline";
      case "danger":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="flex flex-wrap gap-2 my-2">
      {buttons.map((button, index) => (
        <Button
          key={index}
          variant={getButtonVariant(button.style)}
          size="sm"
          onClick={() => onButtonClick(button.action)}
          className="text-xs"
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
}