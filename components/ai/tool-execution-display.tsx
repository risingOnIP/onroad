"use client";

import { useState, memo } from "react";
import { ChevronDown, ChevronUp, Zap, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ToolCall } from "./types";
import { motion, AnimatePresence } from "framer-motion";

interface ToolExecutionDisplayProps {
  toolCalls: ToolCall[];
  className?: string;
}

export const ToolExecutionDisplay = memo(function ToolExecutionDisplay({ toolCalls, className }: ToolExecutionDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (toolCalls.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mt-2 rounded-md border bg-muted/50 text-xs overflow-hidden", className)}
    >
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between h-8 px-2 hover:bg-muted/70"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1">
          <Zap className="size-3 text-primary" />
          <span className="font-medium">{toolCalls.length} action{toolCalls.length > 1 ? 's' : ''} performed</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="size-3" />
        </motion.div>
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 space-y-1">
              {toolCalls.map((tool, index) => (
                <ToolCallItem key={index} tool={tool} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

interface ToolCallItemProps {
  tool: ToolCall;
  index: number;
}

function ToolCallItem({ tool, index }: ToolCallItemProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getIcon = () => {
    switch (tool.status) {
      case "success":
        return <CheckCircle className="size-3 text-green-600" />;
      case "error":
        return <XCircle className="size-3 text-destructive" />;
      case "pending":
        return <Loader2 className="size-3 animate-spin text-blue-500" />;
      default:
        return <Loader2 className="size-3 animate-spin text-blue-500" />;
    }
  };

  const getToolDisplayName = (name: string): string => {
    const displayNames: Record<string, string> = {
      navigation: "Navigate",
      form_update: "Update Form",
      request_form: "Get Form Details",
      add_deal: "Create Deal",
      add_form_to_deal_option: "Add Form",
      delete_deal: "Delete Deal",
      create_deal_client: "Add Client",
      search_deals: "Search Deals",
      get_available_forms: "List Available Forms",
      create_signature_request: "Request Signature",
      request_all_deals: "Load All Deals",
      request_deal: "Get Deal Details",
      add_deal_option: "Add Property Option",
      request_all_deal_options_in_deal: "Load Property Options",
      get_all_form_templates: "Load Form Templates"
    };
    return displayNames[name] || name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getToolDescription = (tool: ToolCall): string => {
    switch (tool.name) {
      case "navigation":
        return `Navigating to ${tool.arguments?.location}`;
      case "form_update":
        return `Updated ${tool.arguments?.field_name} in form`;
      case "add_deal":
        return `Created deal "${tool.arguments?.deal_name}"`;
      case "add_form_to_deal_option":
        return `Added ${tool.arguments?.form_name} form`;
      case "search_deals":
        return `Searched for "${tool.arguments?.search_term}"`;
      case "request_all_deals":
        return "Loading all deals";
      case "get_available_forms":
        return "Loading available forms";
      default:
        return "Action completed";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="pl-4 space-y-1"
    >
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-background/50 rounded px-2 py-1 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        {getIcon()}
        <span className="font-medium text-xs">{getToolDisplayName(tool.name)}</span>
        <span className="text-muted-foreground text-xs">- {getToolDescription(tool)}</span>
        <motion.div
          animate={{ rotate: showDetails ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-auto"
        >
          <ChevronDown className="size-3" />
        </motion.div>
      </div>

      <AnimatePresence>
        {showDetails && tool.result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-5 p-2 bg-background/50 rounded text-xs font-mono border border-muted">
              <pre className="whitespace-pre-wrap text-xs">
                {typeof tool.result === "string" 
                  ? tool.result 
                  : JSON.stringify(tool.result, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}