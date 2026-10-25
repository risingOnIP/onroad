"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Send, Paperclip, X, Sparkles, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CommandSuggestions, InlineAutocomplete } from "./smart-suggestions";

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  suggestions?: string[];
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  userRole?: "realtor" | "client" | "broker";
}

export function ChatInput({ 
  onSendMessage, 
  suggestions = [], 
  isLoading = false,
  placeholder = "Type your message...",
  className,
  userRole = "realtor"
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandSuggestions, setCommandSuggestions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Command suggestions based on input
  useEffect(() => {
    if (message.startsWith("/")) {
      const query = message.slice(1).toLowerCase();
      const commands = getCommandSuggestions(userRole, query);
      setCommandSuggestions(commands);
      setShowCommandPalette(commands.length > 0);
    } else {
      setShowCommandPalette(false);
    }
  }, [message, userRole]);

  const getCommandSuggestions = (role: string, query: string) => {
    const allCommands = {
      realtor: [
        { id: "deal", command: "/deal", description: "Create a new deal", shortcut: "⌘D" },
        { id: "form", command: "/form", description: "Add a form to current deal", shortcut: "⌘F" },
        { id: "client", command: "/client", description: "Add client to deal", shortcut: "⌘C" },
        { id: "property", command: "/property", description: "Add property to deal", shortcut: "⌘P" },
        { id: "signature", command: "/signature", description: "Send for signature", shortcut: "⌘S" },
        { id: "search", command: "/search", description: "Search deals or forms", shortcut: "⌘K" }
      ],
      client: [
        { id: "properties", command: "/properties", description: "View available properties" },
        { id: "documents", command: "/documents", description: "Check document status" },
        { id: "schedule", command: "/schedule", description: "Schedule a viewing" }
      ],
      broker: [
        { id: "review", command: "/review", description: "Review pending deals" },
        { id: "performance", command: "/performance", description: "View agent performance" },
        { id: "templates", command: "/templates", description: "Manage templates" }
      ]
    };

    const commands = allCommands[role as keyof typeof allCommands] || [];
    return commands.filter(cmd => 
      cmd.command.includes(query) || 
      cmd.description.toLowerCase().includes(query)
    );
  };

  const handleSend = () => {
    if (message.trim() || files.length > 0) {
      onSendMessage(message, files);
      setMessage("");
      setFiles([]);
      setShowSuggestions(false);
      setShowCommandPalette(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle command palette navigation
    if (showCommandPalette) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        return; // Let CommandSuggestions handle it
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowCommandPalette(false);
        return;
      }
    }

    // Handle inline autocomplete
    if (e.key === "Tab" && message && suggestions.length > 0) {
      e.preventDefault();
      const match = suggestions.find(s => 
        s.toLowerCase().startsWith(message.toLowerCase())
      );
      if (match) {
        setMessage(match);
      }
      return;
    }

    // Regular send on Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleCommandSelect = (command: any) => {
    setMessage(command.command + " ");
    setShowCommandPalette(false);
    textareaRef.current?.focus();
  };

  // Get inline autocomplete suggestions
  const inlineSuggestions = message && !message.startsWith("/") ? suggestions : [];

  return (
    <div className={cn("space-y-2 relative", className)}>
      {/* Command Palette */}
      <AnimatePresence>
        {showCommandPalette && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 left-0 right-0 z-50"
          >
            <CommandSuggestions
              query={message.slice(1)}
              suggestions={commandSuggestions}
              onSelect={handleCommandSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Suggestions */}
      {showSuggestions && suggestions.length > 0 && message.length === 0 && !isLoading && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="size-3" />
            Suggestions:
          </span>
          {suggestions.slice(0, 4).map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 hover:bg-primary/10 max-w-[150px] truncate"
                onClick={() => handleSuggestionClick(suggestion)}
                title={suggestion}
              >
                {suggestion}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* File attachments */}
      {files.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-wrap gap-2 p-2 bg-muted rounded-md"
        >
          {files.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-background rounded text-xs min-w-0"
            >
              <Paperclip className="size-3 shrink-0" />
              <span className="max-w-[120px] truncate" title={file.name}>{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-4 ml-1 hover:bg-destructive/20 shrink-0"
                onClick={() => removeFile(index)}
              >
                <X className="size-3" />
              </Button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (e.target.value.length > 0) {
                setShowSuggestions(false);
              } else {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className={cn(
              "min-h-[60px] max-h-[120px] pr-20 resize-none break-words overflow-wrap-anywhere",
              message.startsWith("/") && "font-mono"
            )}
            rows={1}
          />
          
          {/* Inline autocomplete preview */}
          {inlineSuggestions.length > 0 && (
            <div className="absolute inset-0 pointer-events-none p-3 overflow-hidden">
              <span className="invisible break-words">{message}</span>
              <InlineAutocomplete
                value={message}
                suggestions={inlineSuggestions}
                onAccept={() => {}}
              />
            </div>
          )}
          
          <div className="absolute bottom-1 right-1 flex items-center gap-1">
            {message.startsWith("/") && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Command className="size-3" />
                Command
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="size-4" />
            </Button>
          </div>
        </div>
        
        <Button
          onClick={handleSend}
          disabled={isLoading || (!message.trim() && files.length === 0)}
          size="icon"
          className="size-10 shrink-0"
        >
          <Send className="size-4" />
        </Button>
      </div>

      {/* Help text */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span>Type / for commands</span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
      />
    </div>
  );
}