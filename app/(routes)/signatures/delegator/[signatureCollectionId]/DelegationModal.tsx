"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface DelegationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFields: Array<{
    unique_id: string;
    displayName: string;
    formfield_name: string;
  }>;
  onConfirm: (email: string) => void;
}

const DelegationModal = ({
  isOpen,
  onOpenChange,
  selectedFields,
  onConfirm,
}: DelegationModalProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    onConfirm(email);
    setEmail("");
    setError("");
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delegate Signature Fields</DialogTitle>
          <DialogDescription>
            Enter the email address of the person you want to delegate these signature fields to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {selectedFields.length > 0 && (
            <div className="rounded-lg bg-muted p-3 space-y-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Selected fields ({selectedFields.length}):
              </p>
              <div className="space-y-1">
                {selectedFields.map((field, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground">
                    • {field.displayName} ({field.formfield_name})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!email}
            className="cursor-pointer"
          >
            Delegate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DelegationModal;