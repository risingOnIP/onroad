"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Users, 
  Calendar, 
  DollarSign, 
  Home,
  ArrowRight,
  Check,
  Clock,
  Edit,
  Eye,
  Share
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface DealResultProps {
  deal: {
    id: string;
    property_address: string;
    city?: string;
    state?: string;
    zip_code?: string;
    price?: number;
    status: "active" | "pending" | "closed" | "cancelled";
    created_at: string;
    closing_date?: string;
    buyers?: Array<{ name: string; email: string }>;
    sellers?: Array<{ name: string; email: string }>;
    forms?: Array<{ id: string; name: string; status: string }>;
    progress?: number;
  };
  action?: "created" | "updated" | "found";
  onNavigate?: (url: string) => void;
  onAction?: (action: string, dealId: string) => void;
}

export function DealResult({ deal, action = "found", onNavigate, onAction }: DealResultProps) {
  const [isExpanded, setIsExpanded] = useState(action === "created");

  const statusColors = {
    active: "bg-green-500/10 text-green-600 border-green-500/30",
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    closed: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/30"
  };

  const actionIcons = {
    created: <Check className="size-4" />,
    updated: <Edit className="size-4" />,
    found: <Eye className="size-4" />
  };

  const actionColors = {
    created: "bg-green-500/10 text-green-600",
    updated: "bg-blue-500/10 text-blue-600",
    found: "bg-gray-500/10 text-gray-600"
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

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
                <Home className="size-4 text-muted-foreground" />
                <CardTitle className="text-lg">
                  {deal.property_address}
                  {(deal.city || deal.state) && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      {[deal.city, deal.state, deal.zip_code].filter(Boolean).join(", ")}
                    </span>
                  )}
                </CardTitle>
              </div>
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  Created {format(new Date(deal.created_at), "MMM d, yyyy")}
                </span>
                {deal.closing_date && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    Closing {format(new Date(deal.closing_date), "MMM d, yyyy")}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("gap-1", actionColors[action])}>
                {actionIcons[action]}
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </Badge>
              <Badge className={cn(statusColors[deal.status])}>
                {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Price and Progress */}
          <div className="flex items-center justify-between">
            {deal.price && (
              <div className="flex items-center gap-2">
                <DollarSign className="size-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  ${deal.price.toLocaleString()}
                </span>
              </div>
            )}
            {deal.progress !== undefined && (
              <div className="flex-1 max-w-xs ml-auto">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{deal.progress}%</span>
                </div>
                <Progress value={deal.progress} className="h-2" />
              </div>
            )}
          </div>

          {/* Expandable Details */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <Separator />
              
              {/* Parties */}
              {(deal.buyers?.length || deal.sellers?.length) && (
                <div className="grid grid-cols-2 gap-4">
                  {deal.buyers && deal.buyers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 text-sm font-medium mb-2">
                        <Users className="size-3" />
                        Buyers
                      </div>
                      <div className="space-y-1">
                        {deal.buyers.map((buyer, idx) => (
                          <div key={idx} className="text-sm text-muted-foreground">
                            {buyer.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {deal.sellers && deal.sellers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 text-sm font-medium mb-2">
                        <Users className="size-3" />
                        Sellers
                      </div>
                      <div className="space-y-1">
                        {deal.sellers.map((seller, idx) => (
                          <div key={idx} className="text-sm text-muted-foreground">
                            {seller.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Forms */}
              {deal.forms && deal.forms.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-sm font-medium mb-2">
                    <FileText className="size-3" />
                    Forms ({deal.forms.length})
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {deal.forms.slice(0, 4).map((form) => (
                      <div key={form.id} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {form.status}
                        </Badge>
                        <span className="text-muted-foreground truncate">{form.name}</span>
                      </div>
                    ))}
                    {deal.forms.length > 4 && (
                      <div className="text-sm text-muted-foreground">
                        +{deal.forms.length - 4} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="gap-1"
              onClick={() => handleNavigate(`/workflow/realtor/deals/${deal.id}`)}
            >
              View Deal
              <ArrowRight className="size-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show Less" : "Show More"}
            </Button>
            {onAction && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAction("edit", deal.id)}
                >
                  <Edit className="size-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAction("share", deal.id)}
                >
                  <Share className="size-3" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}