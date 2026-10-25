"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Filter,
  ChevronRight,
  FileText,
  Home,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  Clock,
  MoreVertical,
  Grid,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ResultType = "deal" | "form" | "client" | "property" | "document";

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  metadata?: Record<string, any>;
  relevance?: number;
  highlight?: string;
}

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  totalCount?: number;
  isLoading?: boolean;
  onItemClick?: (item: SearchResult) => void;
  onFilter?: (filters: any) => void;
  onSort?: (sortBy: string) => void;
  viewMode?: "list" | "grid";
}

export function SearchResults({
  query,
  results,
  totalCount,
  isLoading = false,
  onItemClick,
  viewMode: initialViewMode = "list"
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">(initialViewMode);
  const [selectedTypes, setSelectedTypes] = useState<ResultType[]>([]);
  const [searchFilter, setSearchFilter] = useState("");

  const typeConfig: Record<ResultType, { icon: any; color: string; label: string }> = {
    deal: { icon: Home, color: "text-blue-600 bg-blue-50", label: "Deal" },
    form: { icon: FileText, color: "text-green-600 bg-green-50", label: "Form" },
    client: { icon: Users, color: "text-purple-600 bg-purple-50", label: "Client" },
    property: { icon: MapPin, color: "text-orange-600 bg-orange-50", label: "Property" },
    document: { icon: FileText, color: "text-gray-600 bg-gray-50", label: "Document" }
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-600",
    pending: "bg-yellow-500/10 text-yellow-600",
    completed: "bg-blue-500/10 text-blue-600",
    draft: "bg-gray-500/10 text-gray-600"
  };

  const filteredResults = results.filter(result => {
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(result.type);
    const matchesSearch = !searchFilter || 
      result.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      result.subtitle?.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesType && matchesSearch;
  });

  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<ResultType, SearchResult[]>);

  const toggleTypeFilter = (type: ResultType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const renderListItem = (result: SearchResult) => {
    const config = typeConfig[result.type];
    const Icon = config.icon;

    return (
      <motion.div
        key={result.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className="hover:shadow-md transition-all duration-200 cursor-pointer group"
          onClick={() => onItemClick?.(result)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn("p-2 rounded-lg", config.color)}>
                <Icon className="size-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                      {result.title}
                    </h4>
                    {result.subtitle && (
                      <p className="text-sm text-muted-foreground mt-0.5">{result.subtitle}</p>
                    )}
                    {result.highlight && (
                      <p className="text-xs text-muted-foreground mt-1" 
                         dangerouslySetInnerHTML={{ __html: result.highlight }} />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {result.status && (
                      <Badge variant="secondary" className={cn("text-xs", statusColors[result.status])}>
                        {result.status}
                      </Badge>
                    )}
                    {result.relevance && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="size-3" />
                        {Math.round(result.relevance * 100)}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                {result.metadata && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {result.metadata.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {result.metadata.location}
                      </span>
                    )}
                    {result.metadata.price && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="size-3" />
                        ${result.metadata.price.toLocaleString()}
                      </span>
                    )}
                    {result.metadata.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {result.metadata.date}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderGridItem = (result: SearchResult) => {
    const config = typeConfig[result.type];
    const Icon = config.icon;

    return (
      <motion.div
        key={result.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className="hover:shadow-md transition-all duration-200 cursor-pointer group h-full"
          onClick={() => onItemClick?.(result)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className={cn("p-2 rounded-lg", config.color)}>
                <Icon className="size-4" />
              </div>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
              {result.title}
            </h4>
            {result.subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-2">{result.subtitle}</p>
            )}
            {result.status && (
              <Badge variant="secondary" className={cn("text-xs", statusColors[result.status])}>
                {result.status}
              </Badge>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Search Results</h3>
          <p className="text-sm text-muted-foreground">
            {totalCount !== undefined ? (
              <>Found {totalCount} results for &quot;{query}&quot;</>
            ) : (
              <>Showing {filteredResults.length} results</>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("list")}
            className={cn(viewMode === "list" && "bg-secondary")}
          >
            <List className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={cn(viewMode === "grid" && "bg-secondary")}
          >
            <Grid className="size-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Filter results..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="size-4" />
          </Button>
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(typeConfig).map(([type, config]) => (
            <Badge
              key={type}
              variant={selectedTypes.includes(type as ResultType) ? "default" : "outline"}
              className="cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => toggleTypeFilter(type as ResultType)}
            >
              <config.icon className="size-3 mr-1" />
              {config.label}
              {groupedResults[type as ResultType]?.length > 0 && (
                <span className="ml-1">({groupedResults[type as ResultType].length})</span>
              )}
            </Badge>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-24 animate-pulse">
              <CardContent className="p-4">
                <div className="h-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredResults.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="size-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-1">No results found</h4>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search terms
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          {viewMode === "list" ? (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredResults.map(result => renderListItem(result))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredResults.map(result => renderGridItem(result))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      )}

      {/* Load more */}
      {totalCount && filteredResults.length < totalCount && (
        <div className="text-center pt-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Clock className="size-3" />
            Load more results
          </Button>
        </div>
      )}
    </div>
  );
}