"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface ClientIntakePreviewProps {
  intakeId: string;
  onPreview: (intakeId: string) => void;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
}

const ClientIntakePreview: React.FC<ClientIntakePreviewProps> = ({
  intakeId,
  onPreview,
  disabled = false,
  size = "sm"
}) => {
  return (
    <Button
      size={size}
      variant="outline"
      onClick={() => onPreview(intakeId)}
      disabled={disabled}
    >
      <Eye className="h-4 w-4 mr-2" />
      Preview
    </Button>
  );
};

export default ClientIntakePreview;