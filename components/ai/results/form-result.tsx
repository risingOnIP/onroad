"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Edit3,
  Check,
  X,
  Save,
  Send,
  Clock,
  ChevronDown,
  ChevronUp,
  FileSignature,
  Download,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FormField {
  id: string;
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "select" | "radio" | "checkbox" | "signature";
  required: boolean;
  value?: any;
  options?: { label: string; value: string }[];
  placeholder?: string;
  validation?: string;
}

interface FormResultProps {
  form: {
    id: string;
    name: string;
    description?: string;
    status: "draft" | "active" | "completed" | "archived";
    type: "traditional" | "pdf";
    fields: FormField[];
    createdAt?: string;
    completedAt?: string;
    signatures?: number;
    progress?: number;
  };
  action?: "created" | "updated" | "found" | "fill";
  onSubmit?: (formId: string, data: Record<string, any>) => void;
  onAction?: (action: string, formId: string) => void;
  editable?: boolean;
  showPreview?: boolean;
}

export function FormResult({ 
  form, 
  action = "found", 
  onSubmit, 
  onAction,
  editable = false,
  showPreview = true
}: FormResultProps) {
  const [isExpanded, setIsExpanded] = useState(action === "fill");
  const [isEditing, setIsEditing] = useState(action === "fill");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const statusColors = {
    draft: "bg-gray-500/10 text-gray-600 border-gray-500/30",
    active: "bg-green-500/10 text-green-600 border-green-500/30",
    completed: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    archived: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
  };

  const typeIcons = {
    traditional: <FileText className="size-4" />,
    pdf: <FileSignature className="size-4" />
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Clear error when field is modified
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    form.fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }
      // Add more validation based on field.validation if needed
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm() && onSubmit) {
      onSubmit(form.id, formData);
      setIsEditing(false);
    }
  };

  const renderField = (field: FormField) => {
    const error = errors[field.id];
    
    switch (field.type) {
      case "text":
      case "date":
      case "number":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className={cn(field.required && "after:content-['*'] after:text-red-500 after:ml-0.5")}>
              {field.label}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              value={formData[field.id] || ""}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              disabled={!isEditing}
              className={cn(error && "border-red-500")}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className={cn(field.required && "after:content-['*'] after:text-red-500 after:ml-0.5")}>
              {field.label}
            </Label>
            <Textarea
              id={field.id}
              value={formData[field.id] || ""}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              disabled={!isEditing}
              className={cn(error && "border-red-500")}
              rows={3}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className={cn(field.required && "after:content-['*'] after:text-red-500 after:ml-0.5")}>
              {field.label}
            </Label>
            <Select
              value={formData[field.id] || ""}
              onValueChange={(value) => handleFieldChange(field.id, value)}
              disabled={!isEditing}
            >
              <SelectTrigger className={cn(error && "border-red-500")}>
                <SelectValue placeholder={field.placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case "radio":
        return (
          <div key={field.id} className="space-y-2">
            <Label className={cn(field.required && "after:content-['*'] after:text-red-500 after:ml-0.5")}>
              {field.label}
            </Label>
            <RadioGroup
              value={formData[field.id] || ""}
              onValueChange={(value) => handleFieldChange(field.id, value)}
              disabled={!isEditing}
            >
              {field.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                  <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={formData[field.id] || false}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
              disabled={!isEditing}
            />
            <Label 
              htmlFor={field.id} 
              className={cn(
                "cursor-pointer",
                field.required && "after:content-['*'] after:text-red-500 after:ml-0.5"
              )}
            >
              {field.label}
            </Label>
            {error && <p className="text-xs text-red-500 ml-6">{error}</p>}
          </div>
        );

      case "signature":
        return (
          <div key={field.id} className="space-y-2">
            <Label className={cn(field.required && "after:content-['*'] after:text-red-500 after:ml-0.5")}>
              {field.label}
            </Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {formData[field.id] ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Check className="size-4" />
                  <span className="text-sm">Signature captured</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isEditing}
                  onClick={() => onAction?.("sign", field.id)}
                >
                  <Edit3 className="size-3 mr-1" />
                  Add Signature
                </Button>
              )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  const completedFields = Object.keys(formData).length;
  const totalFields = form.fields.length;
  const progress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {typeIcons[form.type]}
                <CardTitle className="text-lg">{form.name}</CardTitle>
              </div>
              {form.description && (
                <CardDescription>{form.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn(statusColors[form.status])}>
                {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
              </Badge>
              {form.type === "pdf" && (
                <Badge variant="outline" className="gap-1">
                  <FileSignature className="size-3" />
                  PDF
                </Badge>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          {(isExpanded || action === "fill") && progress > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <motion.div
                  className="bg-primary rounded-full h-2"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="size-3" />
              {form.fields.length} fields
            </span>
            {form.signatures && (
              <span className="flex items-center gap-1">
                <Edit3 className="size-3" />
                {form.signatures} signatures
              </span>
            )}
            {form.completedAt && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                Completed
              </span>
            )}
          </div>

          {/* Expandable Form Fields */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <Separator />
                
                <div className="grid gap-4 max-h-96 overflow-y-auto pr-2">
                  {form.fields.map(field => renderField(field))}
                </div>

                {isEditing && (
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      className="gap-1"
                    >
                      <Save className="size-3" />
                      Save Form
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({});
                        setErrors({});
                      }}
                    >
                      <X className="size-3" />
                      Cancel
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <Separator />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="size-3" />
                  Hide Fields
                </>
              ) : (
                <>
                  <ChevronDown className="size-3" />
                  Show Fields
                </>
              )}
            </Button>
            
            {!isEditing && editable && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setIsEditing(true);
                  setIsExpanded(true);
                }}
                className="gap-1"
              >
                <Edit3 className="size-3" />
                Fill Form
              </Button>
            )}

            {showPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction?.("preview", form.id)}
                className="gap-1"
              >
                <Eye className="size-3" />
                Preview
              </Button>
            )}

            {form.type === "pdf" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction?.("download", form.id)}
                className="gap-1"
              >
                <Download className="size-3" />
                Download
              </Button>
            )}

            {onAction && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction("send", form.id)}
                className="gap-1"
              >
                <Send className="size-3" />
                Send
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}