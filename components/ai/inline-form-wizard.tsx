"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight,
  X,
  AlertCircle,
  Loader2,
  Send,
  FileText,
  DollarSign,
  MapPin,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FormField {
  id: string;
  type: "text" | "email" | "number" | "select" | "radio" | "checkbox" | "textarea" | "date";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: any) => string | null;
  icon?: any;
}

interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  icon?: any;
}

interface InlineFormWizardProps {
  steps: FormStep[];
  onComplete: (data: Record<string, any>) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  className?: string;
}

export function InlineFormWizard({
  steps,
  onComplete,
  onCancel,
  title = "Quick Form",
  description,
  submitLabel = "Submit",
  className
}: InlineFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    const stepFields = currentStepData.fields;

    stepFields.forEach(field => {
      const value = formData[field.id];
      
      // Required field validation
      if (field.required && !value) {
        newErrors[field.id] = `${field.label} is required`;
      }
      
      // Custom validation
      if (field.validation && value) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.id] = error;
        }
      }
      
      // Type-specific validation
      if (field.type === "email" && value && !value.includes("@")) {
        newErrors[field.id] = "Please enter a valid email";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (isLastStep) {
        handleSubmit();
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(formData);
    } finally {
      setIsSubmitting(false);
    }
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

  const renderField = (field: FormField) => {
    const error = errors[field.id];
    const value = formData[field.id] || "";
    const Icon = field.icon;

    const fieldWrapper = (children: React.ReactNode) => (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id} className={cn(
          "flex items-center gap-2",
          field.required && "after:content-['*'] after:text-destructive after:ml-0.5"
        )}>
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          {field.label}
        </Label>
        {children}
        {error && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="size-3" />
            {error}
          </div>
        )}
      </div>
    );

    switch (field.type) {
      case "text":
      case "email":
      case "number":
      case "date":
        return fieldWrapper(
          <Input
            id={field.id}
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={cn(error && "border-destructive")}
          />
        );

      case "textarea":
        return fieldWrapper(
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={cn(error && "border-destructive")}
            rows={3}
          />
        );

      case "select":
        return fieldWrapper(
          <Select
            value={value}
            onValueChange={(val) => handleFieldChange(field.id, val)}
          >
            <SelectTrigger className={cn(error && "border-destructive")}>
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
        );

      case "radio":
        return fieldWrapper(
          <RadioGroup
            value={value}
            onValueChange={(val) => handleFieldChange(field.id, val)}
          >
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                <Label htmlFor={`${field.id}-${option.value}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkbox":
        return fieldWrapper(
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <Label htmlFor={field.id} className="font-normal">
              {field.placeholder || "Check this option"}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  const StepIcon = currentStepData.icon || FileText;

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <StepIcon className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription className="text-sm">{description}</CardDescription>
              )}
            </div>
          </div>
          {onCancel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="size-8"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="font-medium">{currentStepData.title}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {currentStepData.description && (
              <p className="text-sm text-muted-foreground">
                {currentStepData.description}
              </p>
            )}
            
            <div className="space-y-4">
              {currentStepData.fields.map(field => renderField(field))}
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="gap-1"
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "size-2 rounded-full transition-colors",
                idx === currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className="gap-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Processing...
            </>
          ) : isLastStep ? (
            <>
              <Send className="size-4" />
              {submitLabel}
            </>
          ) : (
            <>
              Next
              <ChevronRight className="size-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Pre-configured wizards for common tasks
export const DealCreationWizard = ({ onComplete, onCancel }: { 
  onComplete: (data: any) => void; 
  onCancel?: () => void;
}) => {
  const steps: FormStep[] = [
    {
      id: "basic",
      title: "Basic Information",
      description: "Let's start with the deal basics",
      icon: FileText,
      fields: [
        {
          id: "dealName",
          type: "text",
          label: "Deal Name",
          placeholder: "e.g., Smith Family Home Purchase",
          required: true,
          icon: FileText
        },
        {
          id: "dealSide",
          type: "radio",
          label: "Transaction Type",
          required: true,
          options: [
            { value: "buy", label: "Buy" },
            { value: "sell", label: "Sell" },
            { value: "rent", label: "Rent" },
            { value: "lease", label: "Lease" }
          ]
        }
      ]
    },
    {
      id: "client",
      title: "Client Information",
      description: "Add the primary client details",
      icon: Users,
      fields: [
        {
          id: "clientName",
          type: "text",
          label: "Client Name",
          placeholder: "John Smith",
          required: true,
          icon: Users
        },
        {
          id: "clientEmail",
          type: "email",
          label: "Client Email",
          placeholder: "john@example.com",
          required: true
        },
        {
          id: "clientPhone",
          type: "text",
          label: "Phone Number",
          placeholder: "(555) 123-4567"
        }
      ]
    },
    {
      id: "property",
      title: "Property Details",
      description: "Add initial property information",
      icon: MapPin,
      fields: [
        {
          id: "propertyAddress",
          type: "text",
          label: "Property Address",
          placeholder: "123 Main St",
          icon: MapPin
        },
        {
          id: "propertyCity",
          type: "text",
          label: "City",
          placeholder: "Austin"
        },
        {
          id: "propertyPrice",
          type: "number",
          label: "Price",
          placeholder: "450000",
          icon: DollarSign
        }
      ]
    }
  ];

  return (
    <InlineFormWizard
      title="Create New Deal"
      description="Quick setup for a new real estate transaction"
      steps={steps}
      onComplete={onComplete}
      onCancel={onCancel}
      submitLabel="Create Deal"
    />
  );
};