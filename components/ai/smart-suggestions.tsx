"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles,
  FileText,
  Users,
  Home,
  Send,
  Calendar,
  Clock,
  TrendingUp,
  ArrowRight,
  Lightbulb,
  Zap,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Suggestion {
  id: string;
  type: "command" | "entity" | "workflow" | "tip";
  category?: string;
  title: string;
  description?: string;
  icon?: any;
  action: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

interface SmartSuggestionsProps {
  userRole: "realtor" | "client" | "broker";
  context?: {
    currentPage?: string;
    recentActions?: string[];
    activeEntities?: Array<{ type: string; id: string; name: string }>;
  };
  onSuggestionClick: (suggestion: Suggestion) => void;
  className?: string;
}

export function SmartSuggestions({
  userRole,
  context,
  onSuggestionClick,
  className
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading suggestions based on context
    const timer = setTimeout(() => {
      setSuggestions(generateSuggestions(userRole, context));
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [userRole, context]);

  const generateSuggestions = (
    role: string,
    ctx?: typeof context
  ): Suggestion[] => {
    const baseSuggestions: Record<string, Suggestion[]> = {
      realtor: [
        {
          id: "create-deal",
          type: "command",
          category: "Quick Actions",
          title: "Create New Deal",
          description: "Start a new real estate transaction",
          icon: Home,
          action: "create_deal",
          confidence: 0.9
        },
        {
          id: "add-form",
          type: "command",
          category: "Forms",
          title: "Add Form to Current Deal",
          description: "Add required forms to active deal",
          icon: FileText,
          action: "add_form",
          confidence: 0.85
        },
        {
          id: "send-signature",
          type: "workflow",
          category: "Workflows",
          title: "Send for Signature",
          description: "Get documents signed electronically",
          icon: Send,
          action: "create_signature_request",
          confidence: 0.8
        },
        {
          id: "schedule-showing",
          type: "command",
          category: "Scheduling",
          title: "Schedule Property Showing",
          description: "Book a time to show properties",
          icon: Calendar,
          action: "schedule_showing",
          confidence: 0.75
        }
      ],
      client: [
        {
          id: "view-properties",
          type: "command",
          category: "Browse",
          title: "View Available Properties",
          description: "Browse properties matching your criteria",
          icon: Home,
          action: "search_properties",
          confidence: 0.9
        },
        {
          id: "check-documents",
          type: "command",
          category: "Documents",
          title: "Check Document Status",
          description: "View status of your paperwork",
          icon: FileText,
          action: "view_documents",
          confidence: 0.85
        }
      ],
      broker: [
        {
          id: "review-deals",
          type: "command",
          category: "Management",
          title: "Review Pending Deals",
          description: "Approve or review agent deals",
          icon: CheckCircle,
          action: "review_deals",
          confidence: 0.9
        },
        {
          id: "agent-performance",
          type: "command",
          category: "Analytics",
          title: "View Agent Performance",
          description: "Check team metrics and KPIs",
          icon: TrendingUp,
          action: "view_performance",
          confidence: 0.85
        }
      ]
    };

    const suggestions = baseSuggestions[role] || [];

    // Add contextual suggestions based on recent actions
    if (ctx?.recentActions?.includes("create_deal")) {
      suggestions.push({
        id: "add-client-to-deal",
        type: "workflow",
        category: "Next Steps",
        title: "Add Client to New Deal",
        description: "Add buyer or seller information",
        icon: Users,
        action: "add_client",
        confidence: 0.95
      });
    }

    // Add entity-based suggestions
    if (ctx?.activeEntities?.length) {
      const activeEntity = ctx.activeEntities[0];
      if (activeEntity.type === "deal") {
        suggestions.push({
          id: `complete-${activeEntity.id}`,
          type: "entity",
          category: "Active Deal",
          title: `Complete "${activeEntity.name}"`,
          description: "Add missing forms and information",
          icon: CheckCircle,
          action: `complete_deal:${activeEntity.id}`,
          confidence: 0.88,
          metadata: { dealId: activeEntity.id }
        });
      }
    }

    // Add time-based suggestions
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      suggestions.push({
        id: "daily-summary",
        type: "tip",
        category: "Insights",
        title: "View Daily Summary",
        description: "Check today's activities and pending tasks",
        icon: Clock,
        action: "view_summary",
        confidence: 0.7
      });
    }

    return suggestions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  };

  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    const category = suggestion.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(suggestion);
    return acc;
  }, {} as Record<string, Suggestion[]>);

  if (isLoading) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h3 className="font-semibold">Smart Suggestions</h3>
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-4 pr-4">
          <AnimatePresence>
            {Object.entries(groupedSuggestions).map(([category, items]) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                <div className="space-y-2">
                  {items.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onClick={() => onSuggestionClick(suggestion)}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

// Individual Suggestion Card
interface SuggestionCardProps {
  suggestion: Suggestion;
  onClick: () => void;
}

function SuggestionCard({ suggestion, onClick }: SuggestionCardProps) {
  const Icon = suggestion.icon || Lightbulb;
  
  const typeColors = {
    command: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    entity: "bg-green-50 text-green-600 hover:bg-green-100",
    workflow: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    tip: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg border text-left transition-all",
        "hover:shadow-sm hover:border-primary/20",
        "group"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-md transition-colors",
          typeColors[suggestion.type]
        )}>
          <Icon className="size-4" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-sm group-hover:text-primary transition-colors">
              {suggestion.title}
            </h5>
            {suggestion.confidence && suggestion.confidence > 0.8 && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="size-3 mr-1" />
                Recommended
              </Badge>
            )}
          </div>
          {suggestion.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {suggestion.description}
            </p>
          )}
        </div>
        
        <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </motion.button>
  );
}

// Command Palette Style Suggestions
interface CommandSuggestionsProps {
  query: string;
  suggestions: Array<{
    id: string;
    command: string;
    description: string;
    icon?: any;
    shortcut?: string;
  }>;
  onSelect: (suggestion: any) => void;
  className?: string;
}

export function CommandSuggestions({
  query,
  suggestions,
  onSelect,
  className
}: CommandSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[selectedIndex]) {
        onSelect(suggestions[selectedIndex]);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, suggestions]);

  if (suggestions.length === 0) return null;

  return (
    <Card className={cn("p-2", className)}>
      <div className="space-y-1">
        {suggestions.map((suggestion, idx) => {
          const Icon = suggestion.icon || FileText;
          const isSelected = idx === selectedIndex;
          
          return (
            <button
              key={suggestion.id}
              onClick={() => onSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left",
                isSelected && "bg-accent"
              )}
            >
              <Icon className="size-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium text-sm">{suggestion.command}</div>
                <div className="text-xs text-muted-foreground">{suggestion.description}</div>
              </div>
              {suggestion.shortcut && (
                <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {suggestion.shortcut}
                </kbd>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// Inline Autocomplete Component
interface InlineAutocompleteProps {
  value: string;
  suggestions: string[];
  onAccept: (suggestion: string) => void;
  className?: string;
}

export function InlineAutocomplete({
  value,
  suggestions,
  className
}: InlineAutocompleteProps) {
  const [activeSuggestion, setActiveSuggestion] = useState<string>("");

  useEffect(() => {
    if (value && suggestions.length > 0) {
      const match = suggestions.find(s => 
        s.toLowerCase().startsWith(value.toLowerCase())
      );
      setActiveSuggestion(match || "");
    } else {
      setActiveSuggestion("");
    }
  }, [value, suggestions]);

  if (!activeSuggestion || value === activeSuggestion) return null;

  const remainingText = activeSuggestion.slice(value.length);

  return (
    <span className={cn("text-muted-foreground", className)}>
      {remainingText}
      <span className="text-xs ml-2">
        Press <kbd className="bg-muted px-1 py-0.5 rounded text-xs">Tab</kbd> to accept
      </span>
    </span>
  );
}