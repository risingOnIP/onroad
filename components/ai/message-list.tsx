"use client";

import { useEffect, useRef, memo } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Sparkles, AlertCircle, FileIcon } from "lucide-react";
import { ToolResultCard } from "./tool-result-card";
import { ToolExecutionDisplay } from "./tool-execution-display";
import { ChatMessage, ToolExecutionProgressMessage } from "./types";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessage?: string;
  isLoading?: boolean;
  toolProgress?: ToolExecutionProgressMessage | null;
}

export const MessageList = memo(function MessageList({ messages, streamingMessage, isLoading, toolProgress }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  useEffect(() => {
    if (toolProgress) {
    }
  }, [toolProgress]);

  return (
    <div 
      ref={scrollAreaRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.length === 0 && !isLoading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-muted-foreground py-8"
        >
          <motion.div 
            className="size-20 mx-auto mb-4"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <img src="/Ora.png" alt="Ora" className="w-full h-full object-contain" />
          </motion.div>
          <h3 className="text-lg font-semibold mb-2">Hi! I&apos;m Ora</h3>
          <p className="text-sm">I&apos;m here to help you create deals, manage forms, and navigate your OnRoad workflow.</p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <SuggestionChip text="Create a new deal" />
            <SuggestionChip text="Add a form" />
            <SuggestionChip text="Search properties" />
            <SuggestionChip text="Schedule a showing" />
          </div>
        </motion.div>
      )}

      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <MessageItem 
            key={message.id} 
            message={message} 
            index={index}
          />
        ))}
      </AnimatePresence>

      {streamingMessage && (
        <MessageItem 
          message={{
            id: "streaming",
            role: "assistant",
            content: streamingMessage,
            timestamp: new Date()
          }}
          isStreaming
          index={messages.length}
        />
      )}

      {/* Tool Progress Indicator */}
      {toolProgress && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex gap-3 px-4"
        >
          <Avatar className="size-6">
            <AvatarFallback className={cn(
              "p-0 transition-colors duration-200",
              toolProgress.status === 'starting' && "bg-blue-50",
              toolProgress.status === 'completed' && "bg-green-50",
              toolProgress.status === 'error' && "bg-red-50",
              !toolProgress.status && "bg-primary/10"
            )}>
              <motion.img 
                src="/Ora.png" 
                alt="Ora" 
                className="size-6 object-contain"
                animate={toolProgress.status === 'starting' ? { rotate: [0, 10, -10, 0] } : { rotate: 0 }}
                transition={{ duration: 2, repeat: toolProgress.status === 'starting' ? Infinity : 0, ease: "easeInOut" }}
              />
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 text-sm">
            {toolProgress.status === 'starting' && (
              <>
                <motion.div
                  className="w-1 h-1 bg-blue-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="w-1 h-1 bg-blue-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
                <motion.div
                  className="w-1 h-1 bg-blue-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                />
              </>
            )}
            {toolProgress.status === 'completed' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
            )}
            {toolProgress.status === 'error' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-red-500 rounded-full"
              />
            )}
            <span className={cn(
              "ml-2",
              toolProgress.status === 'starting' && "text-blue-600",
              toolProgress.status === 'completed' && "text-green-600",
              toolProgress.status === 'error' && "text-red-600",
              !toolProgress.status && "text-muted-foreground"
            )}>
              {toolProgress.message}
            </span>
          </div>
        </motion.div>
      )}

      {isLoading && !streamingMessage && !toolProgress && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 p-0">
              <motion.img 
                src="/Ora.png" 
                alt="Ora" 
                className="size-8 object-contain"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </AvatarFallback>
          </Avatar>
          <Card className="flex-1 p-4 max-w-[85%]">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-8 rounded-full bg-primary/20 animate-pulse" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
});

interface MessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
  index?: number;
}

function MessageItem({ message, isStreaming, index = 0 }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "flex gap-3",
        isUser && "flex-row-reverse"
      )}
    >
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className={cn(
          isUser ? "bg-secondary" : "bg-primary/10 p-0"
        )}>
          {isUser ? (
            <User className="size-4" />
          ) : (
            <motion.img 
              src="/Ora.png" 
              alt="Ora" 
              className="size-8 object-contain"
              animate={isStreaming ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "flex-1 space-y-2",
        isUser && "flex flex-col items-end"
      )}>
        <div className={cn(
          "rounded-lg px-4 py-3 max-w-[85%] overflow-hidden word-wrap break-words",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted",
          message.isError && "bg-destructive/10 text-destructive border border-destructive/20"
        )}>
          {!isUser && message.content && (message.content.includes("I'll help") || message.content.includes("I can")) && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
              <Sparkles className={cn(
                "size-4",
                isStreaming && "animate-pulse",
                isUser ? "text-primary-foreground" : "text-primary"
              )} />
              <span className="text-sm font-medium">
                {isStreaming ? "Ora is thinking..." : "Ora's Response"}
              </span>
            </div>
          )}
          
          {message.isError && (
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="size-4 text-destructive mt-0.5" />
              <span className="text-sm font-medium">Error</span>
            </div>
          )}
          
          <div className={cn(
            "prose prose-sm max-w-none break-words overflow-wrap-anywhere chat-message-content",
            isUser && "prose-invert",
            !isUser && "dark:prose-invert"
          )}>
            <ReactMarkdown 
              components={{
              p: ({ children }: any) => <div className="mb-2 last:mb-0 text-sm break-words overflow-wrap-anywhere">{children}</div>,
              ul: ({ children }: any) => <ul className="list-disc pl-4 mb-2 text-sm break-words overflow-wrap-anywhere">{children}</ul>,
              ol: ({ children }: any) => <ol className="list-decimal pl-4 mb-2 text-sm break-words overflow-wrap-anywhere">{children}</ol>,
              li: ({ children }: any) => <li className="mb-1 break-words overflow-wrap-anywhere">{children}</li>,
              pre: ({ children }: any) => (
                <pre className={cn(
                  "p-3 rounded text-xs overflow-x-auto font-mono mb-2 border whitespace-pre-wrap break-all max-w-full",
                  isUser 
                    ? "bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20"
                    : "bg-muted-foreground/10 border-border"
                )}>
                  <code className="break-all whitespace-pre-wrap">{children}</code>
                </pre>
              ),
              code: ({ inline, children }: any) => 
                inline ? (
                  <code className={cn(
                    "px-1.5 py-0.5 rounded text-xs font-mono break-all overflow-wrap-anywhere",
                    isUser 
                      ? "bg-primary-foreground/10 text-primary-foreground"
                      : "bg-muted-foreground/10"
                  )}>
                    {children}
                  </code>
                ) : (
                  <code className="block break-all overflow-wrap-anywhere whitespace-pre-wrap">{children}</code>
                ),
              strong: ({ children }: any) => <strong className="font-semibold break-words overflow-wrap-anywhere">{children}</strong>,
              em: ({ children }: any) => <em className="italic break-words overflow-wrap-anywhere">{children}</em>,
              blockquote: ({ children }: any) => (
                <div className={cn(
                  "border-l-4 pl-4 py-2 mb-2 text-sm italic break-words overflow-wrap-anywhere",
                  isUser 
                    ? "border-primary-foreground/40"
                    : "border-muted-foreground/40"
                )}>
                  {children}
                </div>
              ),
            }}
          >
            {message.content || ""}
          </ReactMarkdown>
          </div>
          
          {message.files && message.files.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="text-xs font-medium mb-2">Attached Files:</div>
              <div className="space-y-1">
                {message.files.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs opacity-80 min-w-0">
                    <FileIcon className="size-3 shrink-0" />
                    <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
                    <span className="text-muted-foreground shrink-0">({file.type})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tool Execution Summary */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2 max-w-[85%]">
            <ToolExecutionDisplay 
              toolCalls={message.toolCalls.map(tc => ({
                name: tc.name,
                arguments: tc.arguments,
                result: tc.result,
                status: tc.status || "success"
              }))}
              className="text-xs"
            />
            {message.toolCalls.map((toolCall, idx) => (
              <ToolResultCard 
                key={idx} 
                toolCall={{
                  name: toolCall.name,
                  arguments: toolCall.arguments,
                  result: toolCall.result,
                  status: toolCall.status || "success"
                }}
                onAction={(action, data) => {
                  // Handle tool actions
                }}
                onNavigate={(url) => {
                  window.location.href = url;
                }}
              />
            ))}
          </div>
        )}

        {!isStreaming && (
          <p className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function SuggestionChip({ text }: { text: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm cursor-pointer hover:bg-primary/20 transition-colors"
    >
      {text}
    </motion.div>
  );
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
}