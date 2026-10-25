"use client";

import React, { useContext } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DealPageContext } from '../DealPageContext';

interface BackButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  className = "", 
  variant = "outline", 
  size = "sm",
  children 
}) => {
  const { goBack } = useContext(DealPageContext);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={goBack}
      className={`flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {children || "Back"}
    </Button>
  );
};

export default BackButton;