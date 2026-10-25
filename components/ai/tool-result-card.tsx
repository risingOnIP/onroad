"use client";

import { Card } from "@/components/ui/card";
import { DealResult } from "./results/deal-result";
import { FormResult } from "./results/form-result";
import { SearchResults } from "./results/search-results";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  Home,
  Users,
  Plus,
  Trash,
  Send,
  Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ToolCall {
  name: string;
  arguments?: any;
  result?: any;
  status: "pending" | "success" | "error";
  error?: string;
}

interface ToolResultCardProps {
  toolCall: ToolCall;
  onAction?: (action: string, data: any) => void;
  onNavigate?: (url: string) => void;
}

export function ToolResultCard({ toolCall, onAction, onNavigate }: ToolResultCardProps) {
  const getToolIcon = (toolName: string) => {
    const icons: Record<string, any> = {
      add_deal: Home,
      create_deal: Home,
      add_form_to_deal_option: FileText,
      create_form: FileText,
      add_deal_option: Plus,
      create_deal_client: Users,
      delete_deal: Trash,
      delete_form: Trash,
      create_signature_request: Send,
      navigation: Navigation,
    };
    return icons[toolName] || FileText;
  };

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case "pending":
        return <Loader2 className="size-4 animate-spin" />;
      case "success":
        return <CheckCircle className="size-4 text-green-600" />;
      case "error":
        return <XCircle className="size-4 text-red-600" />;
    }
  };

  const getToolLabel = (toolName: string) => {
    const labels: Record<string, string> = {
      add_deal: "Create Deal",
      create_deal: "Create Deal",
      add_form_to_deal_option: "Add Form",
      create_form: "Create Form",
      add_deal_option: "Add Property",
      create_deal_client: "Add Client",
      delete_deal: "Delete Deal",
      delete_form: "Delete Form",
      create_signature_request: "Send for Signature",
      view_deal_details: "View Deal Details",
      search_deals: "Search Deals",
      navigation: "Navigate"
    };
    return labels[toolName] || toolName.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderToolResult = () => {
    if (toolCall.status === "error") {
      return (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="size-4" />
          <span className="text-sm">{toolCall.error || "An error occurred"}</span>
        </div>
      );
    }

    if (toolCall.status === "pending") {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Processing...</span>
        </div>
      );
    }

    // Render specific result types based on tool name and result structure
    const result = toolCall.result;
    
    switch (toolCall.name) {
      case "add_deal":
      case "create_deal":
        if (result?.deal_id) {
          return (
            <DealResult
              deal={{
                id: result.deal_id,
                property_address: result.deal_name || "New Deal",
                status: "active",
                created_at: new Date().toISOString(),
                buyers: result.client ? [{
                  name: result.client.name,
                  email: result.client.email
                }] : []
              }}
              action="created"
              onNavigate={onNavigate}
              onAction={onAction}
            />
          );
        }
        break;

      case "add_form_to_deal_option":
      case "create_form":
        if (result?.form_id) {
          return (
            <FormResult
              form={{
                id: result.form_id,
                name: result.form_name || toolCall.arguments?.form_name || "New Form",
                status: "draft",
                type: "traditional",
                fields: []
              }}
              action="created"
              onAction={onAction}
              editable={true}
            />
          );
        }
        break;

      case "search_deals":
        if (result?.deals) {
          return (
            <SearchResults
              query={toolCall.arguments?.search_term || ""}
              results={result.deals.map((deal: any) => ({
                id: deal.id,
                type: "deal" as const,
                title: deal.name,
                subtitle: `${deal.side} • ${deal.active ? "Active" : "Inactive"}`,
                status: deal.active ? "active" : "inactive",
                metadata: {
                  date: deal.created_at,
                  parties: deal.parties?.length || 0
                }
              }))}
              totalCount={result.total_results}
              onItemClick={(item) => onNavigate?.(`/workflow/realtor/deals/${item.id}`)}
            />
          );
        }
        break;

      case "view_deal_details":
        if (result?.deal) {
          return (
            <div className="space-y-4">
              <DealResult
                deal={{
                  id: result.deal.id,
                  property_address: result.deal.name,
                  status: result.deal.active ? "active" : "closed",
                  created_at: result.deal.created_at,
                  progress: Math.round((result.summary.total_forms / 10) * 100)
                }}
                action="found"
                onNavigate={onNavigate}
                onAction={onAction}
              />
              
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-3">
                  <div className="text-2xl font-bold">{result.summary.total_parties}</div>
                  <div className="text-sm text-muted-foreground">Parties</div>
                </Card>
                <Card className="p-3">
                  <div className="text-2xl font-bold">{result.summary.total_deal_options}</div>
                  <div className="text-sm text-muted-foreground">Properties</div>
                </Card>
                <Card className="p-3">
                  <div className="text-2xl font-bold">{result.summary.total_forms}</div>
                  <div className="text-sm text-muted-foreground">Forms</div>
                </Card>
              </div>
            </div>
          );
        }
        break;

      case "navigation":
        if (result?.location) {
          return (
            <div className="flex items-center gap-2 text-primary">
              <Navigation className="size-4" />
              <span className="text-sm">Navigating to {result.location}</span>
            </div>
          );
        }
        break;
    }

    // Default result display
    if (result?.message) {
      return (
        <div className="text-sm text-muted-foreground">
          {result.message}
        </div>
      );
    }

    return null;
  };

  const Icon = getToolIcon(toolCall.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "overflow-hidden",
        toolCall.status === "error" && "border-destructive/50"
      )}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1.5 rounded-md",
                toolCall.status === "success" && "bg-green-50 text-green-600",
                toolCall.status === "error" && "bg-red-50 text-red-600",
                toolCall.status === "pending" && "bg-gray-50 text-gray-600"
              )}>
                <Icon className="size-4" />
              </div>
              <span className="font-medium text-sm">{getToolLabel(toolCall.name)}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge variant={toolCall.status === "error" ? "destructive" : "secondary"} className="text-xs">
                {toolCall.status}
              </Badge>
            </div>
          </div>
          
          <div className="mt-3">
            {renderToolResult()}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}