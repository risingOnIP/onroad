"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Zap,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Step {
  id: string;
  label: string;
  description?: string;
  status: "pending" | "active" | "completed" | "error";
  icon?: any;
  duration?: number; // in ms
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep?: string;
  variant?: "linear" | "circular" | "steps";
  showDetails?: boolean;
  className?: string;
}

export function ProgressIndicator({
  steps,
  currentStep,
  variant = "linear",
  showDetails = true,
  className
}: ProgressIndicatorProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const completedSteps = steps.filter(s => s.status === "completed").length;
  const progress = (completedSteps / steps.length) * 100;

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 100);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  if (variant === "steps") {
    return (
      <div className={cn("space-y-4", className)}>
        {steps.map((step, idx) => {
          const Icon = step.icon || FileText;
          const isActive = step.id === currentStep;
          const isCompleted = step.status === "completed";
          const isError = step.status === "error";

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                isActive && "bg-primary/5 border border-primary/20",
                isCompleted && "opacity-70"
              )}>
                <div className={cn(
                  "p-2 rounded-full transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && "bg-green-500 text-white",
                  isError && "bg-destructive text-destructive-foreground",
                  !isActive && !isCompleted && !isError && "bg-muted"
                )}>
                  {isActive && <Loader2 className="size-4 animate-spin" />}
                  {isCompleted && <CheckCircle className="size-4" />}
                  {isError && <AlertCircle className="size-4" />}
                  {!isActive && !isCompleted && !isError && <Icon className="size-4" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={cn(
                      "font-medium text-sm",
                      isActive && "text-primary"
                    )}>
                      {step.label}
                    </h4>
                    {isActive && step.duration && (
                      <span className="text-xs text-muted-foreground">
                        Est. {formatTime(step.duration)}
                      </span>
                    )}
                  </div>
                  {step.description && showDetails && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                  {isActive && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: step.duration ? step.duration / 1000 : 2 }}
                      className="h-1 bg-primary rounded-full mt-2"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  if (variant === "circular") {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="relative">
          <svg className="size-32 -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <motion.circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-primary"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default linear variant
  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentStepIndex >= 0 && steps[currentStepIndex]?.icon && (() => {
              const Icon = steps[currentStepIndex].icon;
              return <Icon className="size-4 text-primary" />;
            })()}
            <h4 className="text-sm font-medium">
              {currentStepIndex >= 0 ? steps[currentStepIndex].label : "Processing"}
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {formatTime(elapsedTime)}
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{completedSteps} of {steps.length} steps</span>
          <span>{Math.round(progress)}% complete</span>
        </div>

        {showDetails && currentStepIndex >= 0 && steps[currentStepIndex]?.description && (
          <p className="text-xs text-muted-foreground">
            {steps[currentStepIndex].description}
          </p>
        )}
      </div>
    </Card>
  );
}

// Animated Progress Bar Component
interface AnimatedProgressProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  color?: "primary" | "success" | "warning" | "destructive";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function AnimatedProgress({
  value,
  label,
  showPercentage = true,
  color = "primary",
  size = "default",
  className
}: AnimatedProgressProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const sizeClasses = {
    sm: "h-1",
    default: "h-2",
    lg: "h-3"
  };

  const colorClasses = {
    primary: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    destructive: "bg-destructive"
  };

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercentage && (
            <span className="font-medium">{Math.round(displayValue)}%</span>
          )}
        </div>
      )}
      <div className={cn("bg-secondary rounded-full overflow-hidden", sizeClasses[size])}>
        <motion.div
          className={cn("h-full", colorClasses[color])}
          initial={{ width: 0 }}
          animate={{ width: `${displayValue}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// Multi-Step Wizard Progress
interface WizardProgressProps {
  steps: Array<{
    id: string;
    label: string;
    icon?: any;
  }>;
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export function WizardProgress({
  steps,
  currentStep,
  onStepClick,
  className
}: WizardProgressProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {steps.map((step, idx) => {
        const Icon = step.icon || Zap;
        const isActive = step.id === currentStep;
        const isCompleted = idx < currentIndex;
        const isClickable = onStepClick && (isCompleted || isActive);

        return (
          <div key={step.id} className="flex items-center flex-1">
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg transition-colors",
                isClickable && "cursor-pointer hover:bg-accent",
                !isClickable && "cursor-default"
              )}
            >
              <div className={cn(
                "size-10 rounded-full flex items-center justify-center transition-colors",
                isActive && "bg-primary text-primary-foreground",
                isCompleted && "bg-primary/20 text-primary",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}>
                {isCompleted ? (
                  <CheckCircle className="size-5" />
                ) : (
                  <Icon className="size-5" />
                )}
              </div>
              <span className={cn(
                "text-sm font-medium hidden sm:block",
                isActive && "text-primary",
                !isActive && !isCompleted && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </button>

            {idx < steps.length - 1 && (
              <div className="flex-1 mx-2">
                <div className={cn(
                  "h-0.5 transition-colors",
                  isCompleted ? "bg-primary" : "bg-muted"
                )} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}