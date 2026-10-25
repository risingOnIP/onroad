"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MoreHorizontal,
  Plus,
  Edit,
  Trash,
  Copy,
  Share,
  Download,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  FileText,
  Users,
  Home,
  Eye,
  Mail,
  Calendar,
  DollarSign,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ActionButtonsProps {
  entityType: "deal" | "form" | "client" | "property";
  entityId: string;
  entityName?: string;
  onAction: (action: string, data?: any) => void;
  availableActions?: string[];
  className?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export function ActionButtons({
  entityType,
  entityId,
  entityName,
  onAction,
  availableActions,
  className,
  size = "sm",
  variant = "outline"
}: ActionButtonsProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: string;
    title: string;
    description: string;
  }>({
    isOpen: false,
    action: "",
    title: "",
    description: ""
  });

  const allActions = {
    deal: [
      { id: "view", label: "View Deal", icon: Eye, primary: true },
      { id: "add-form", label: "Add Form", icon: Plus },
      { id: "add-client", label: "Add Client", icon: Users },
      { id: "add-property", label: "Add Property", icon: Home },
      { id: "edit", label: "Edit Deal", icon: Edit },
      { id: "share", label: "Share Deal", icon: Share },
      { id: "duplicate", label: "Duplicate", icon: Copy },
      { id: "archive", label: "Archive", icon: XCircle, danger: true },
      { id: "delete", label: "Delete", icon: Trash, danger: true }
    ],
    form: [
      { id: "fill", label: "Fill Form", icon: Edit, primary: true },
      { id: "preview", label: "Preview", icon: Eye },
      { id: "send", label: "Send for Signature", icon: Send },
      { id: "download", label: "Download PDF", icon: Download },
      { id: "duplicate", label: "Duplicate", icon: Copy },
      { id: "delete", label: "Delete", icon: Trash, danger: true }
    ],
    client: [
      { id: "view", label: "View Profile", icon: Eye, primary: true },
      { id: "send-form", label: "Send Form", icon: FileText },
      { id: "schedule", label: "Schedule Meeting", icon: Calendar },
      { id: "email", label: "Send Email", icon: Mail },
      { id: "edit", label: "Edit Client", icon: Edit },
      { id: "remove", label: "Remove from Deal", icon: XCircle, danger: true }
    ],
    property: [
      { id: "view", label: "View Property", icon: Eye, primary: true },
      { id: "estimate", label: "Get Estimate", icon: DollarSign },
      { id: "schedule-viewing", label: "Schedule Viewing", icon: Calendar },
      { id: "add-form", label: "Add Form", icon: FileText },
      { id: "edit", label: "Edit Property", icon: Edit },
      { id: "remove", label: "Remove", icon: Trash, danger: true }
    ]
  };

  const actions = allActions[entityType].filter(
    action => !availableActions || availableActions.includes(action.id)
  );

  const primaryActions = actions.filter(a => a.primary);
  const secondaryActions = actions.filter(a => !a.primary);

  const handleAction = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    
    // Show confirmation for dangerous actions
    if (action?.danger) {
      setConfirmDialog({
        isOpen: true,
        action: actionId,
        title: `Confirm ${action.label}`,
        description: `Are you sure you want to ${action.label.toLowerCase()} "${entityName || entityId}"? This action cannot be undone.`
      });
    } else {
      onAction(actionId);
    }
  };

  const confirmAction = () => {
    onAction(confirmDialog.action);
    setConfirmDialog({ ...confirmDialog, isOpen: false });
  };

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        {/* Primary Actions */}
        {primaryActions.map(action => (
          <motion.div
            key={action.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              size={size}
              variant={variant}
              onClick={() => handleAction(action.id)}
              className="gap-1"
            >
              <action.icon className="size-3" />
              {action.label}
            </Button>
          </motion.div>
        ))}

        {/* Secondary Actions Dropdown */}
        {secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={variant} size={size === "sm" ? "icon" : size}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {secondaryActions.map((action, idx) => (
                <div key={action.id}>
                  {idx > 0 && action.danger && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => handleAction(action.id)}
                    className={cn(
                      "gap-2",
                      action.danger && "text-destructive focus:text-destructive"
                    )}
                  >
                    <action.icon className="size-4" />
                    {action.label}
                  </DropdownMenuItem>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => 
        setConfirmDialog({ ...confirmDialog, isOpen: open })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmAction}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Quick Action Buttons Component
interface QuickActionButtonsProps {
  suggestions: Array<{
    id: string;
    label: string;
    icon?: any;
    description?: string;
    action: () => void;
  }>;
  className?: string;
}

export function QuickActionButtons({ suggestions, className }: QuickActionButtonsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {suggestions.map((suggestion) => (
        <motion.div
          key={suggestion.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={suggestion.action}
            className="gap-2 h-auto py-2 px-3"
          >
            {suggestion.icon && <suggestion.icon className="size-4" />}
            <div className="text-left">
              <div className="font-medium">{suggestion.label}</div>
              {suggestion.description && (
                <div className="text-xs text-muted-foreground">{suggestion.description}</div>
              )}
            </div>
            <ArrowRight className="size-3 ml-2" />
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

// Contextual Action Bar Component
interface ContextualActionBarProps {
  context: {
    type: "deal" | "form" | "bulk";
    count?: number;
    status?: string;
  };
  actions: Array<{
    id: string;
    label: string;
    icon: any;
    onClick: () => void;
    variant?: "default" | "outline" | "destructive";
  }>;
  onClose?: () => void;
  className?: string;
}

export function ContextualActionBar({ 
  context, 
  actions, 
  onClose,
  className 
}: ContextualActionBarProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "bg-background border rounded-lg shadow-lg p-4",
        "flex items-center gap-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {context.type === "bulk" && (
          <div className="flex items-center gap-2">
            <CheckCircle className="size-5 text-primary" />
            <span className="text-sm font-medium">{context.count} selected</span>
          </div>
        )}
        
        {context.status && (
          <Badge variant="outline">{context.status}</Badge>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-2">
        {actions.map(action => (
          <Button
            key={action.id}
            variant={action.variant || "outline"}
            size="sm"
            onClick={action.onClick}
            className="gap-1"
          >
            <action.icon className="size-3" />
            {action.label}
          </Button>
        ))}
      </div>

      {onClose && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8"
          >
            <X className="size-4" />
          </Button>
        </>
      )}
    </motion.div>
  );
}

// Smart Action Recommendations
interface SmartActionsProps {
  entityType: "deal" | "form" | "client";
  entityStatus?: string;
  onAction: (action: string) => void;
  className?: string;
}

export function SmartActions({ 
  entityType, 
  entityStatus,
  onAction,
  className 
}: SmartActionsProps) {
  const getRecommendations = () => {
    switch (entityType) {
      case "deal":
        if (entityStatus === "new") {
          return [
            { id: "add-client", label: "Add Client", icon: Users, tip: "Start by adding client details" },
            { id: "add-property", label: "Add Property", icon: Home, tip: "Add properties to this deal" },
            { id: "use-template", label: "Use Template", icon: Zap, tip: "Speed up with templates" }
          ];
        } else if (entityStatus === "active") {
          return [
            { id: "add-form", label: "Add Form", icon: FileText, tip: "Add required forms" },
            { id: "send-signature", label: "Send for Signature", icon: Send, tip: "Get documents signed" },
            { id: "track-progress", label: "Track Progress", icon: CheckCircle, tip: "Monitor deal status" }
          ];
        }
        break;
      case "form":
        if (entityStatus === "incomplete") {
          return [
            { id: "fill-form", label: "Complete Form", icon: Edit, tip: "Fill in missing fields" },
            { id: "import-data", label: "Import Data", icon: Download, tip: "Import from previous forms" }
          ];
        } else if (entityStatus === "complete") {
          return [
            { id: "send-signature", label: "Send for Signature", icon: Send, tip: "Get it signed" },
            { id: "download-pdf", label: "Download PDF", icon: Download, tip: "Save a copy" }
          ];
        }
        break;
      case "client":
        return [
          { id: "send-forms", label: "Send Forms", icon: FileText, tip: "Send required documents" },
          { id: "schedule-meeting", label: "Schedule Meeting", icon: Calendar, tip: "Book a consultation" },
          { id: "view-activity", label: "View Activity", icon: Eye, tip: "See client history" }
        ];
    }
    return [];
  };

  const recommendations = getRecommendations();

  if (recommendations.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium text-muted-foreground">Recommended Actions</h4>
      <div className="grid gap-2">
        {recommendations.map(rec => (
          <motion.button
            key={rec.id}
            whileHover={{ x: 4 }}
            onClick={() => onAction(rec.id)}
            className="flex items-center justify-between p-3 text-left rounded-lg border bg-card hover:bg-accent transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <rec.icon className="size-4" />
              </div>
              <div>
                <div className="font-medium text-sm">{rec.label}</div>
                <div className="text-xs text-muted-foreground">{rec.tip}</div>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Add missing imports
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";