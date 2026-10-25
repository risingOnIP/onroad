"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Client {
  id?: string;
  realtor_id?: string;
  created_at?: Date;
  full_name: string;
  email: string;
  phone_number: string;
  current_transaction_status: "lead" | "searching" | "under_contract" | "closed" | "cancelled";
  form_information: JSON;
  notes: string;
}

interface ClientFormProps {
  initial?: Client;
  onSave: (data: Omit<Client, "id" | "realtor_id" | "created_at">) => void;
  onCancel: () => void;
}

// Add status colors mapping
const statusColors: Record<Client["current_transaction_status"], string> = {
  lead: "bg-blue-100 text-blue-800",
  searching: "bg-yellow-100 text-yellow-800",
  under_contract: "bg-orange-100 text-orange-800",
  closed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function ClientForm({
  initial,
  onSave,
  onCancel,
}: ClientFormProps) {
  const [fullName, setFullName] = useState(initial?.full_name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(initial?.phone_number || "");
  const [currentStatus, setCurrentStatus] = useState<
    "lead" | "searching" | "under_contract" | "closed" | "cancelled"
  >(initial?.current_transaction_status || "lead");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        current_transaction_status: currentStatus,
        form_information: {} as JSON,
        notes,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Full Name*</label>
          <Input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            disabled={isSaving}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email*</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
            disabled={isSaving}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Phone Number
          </label>
          <Input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="(555) 123-4567"
            disabled={isSaving}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Current Status
          </label>
          <Select
            value={currentStatus}
            onValueChange={(value) =>
              setCurrentStatus(value as Client["current_transaction_status"])
            }
            disabled={isSaving}
          >
            <SelectTrigger
              className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[currentStatus]}`}
            >
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead" className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
                Lead
              </SelectItem>
              <SelectItem value="searching" className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-600" />
                Searching
              </SelectItem>
              <SelectItem
                value="under_contract"
                className="flex items-center gap-2"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-orange-600" />
                Under Contract
              </SelectItem>
              <SelectItem value="closed" className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-600" />
                Closed
              </SelectItem>
              <SelectItem value="cancelled" className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-600" />
                Cancelled
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Notes</label>
          <Textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes"
            disabled={isSaving}
            className="w-full resize-none"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
