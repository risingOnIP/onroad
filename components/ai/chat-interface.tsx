"use client";

import { useState, useEffect } from "react";
import { X, Minimize2, Maximize2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sendMessage } from "@/app/actions/ai/chat-actions";
import { ChatMessage, ToolExecutionProgressMessage } from "./types";
import { getPastMessages, addMessages, clearMessages } from "@/app/utils/chat-storage";
import { RealtorPageNavigation } from "../files/types/realtor";

interface ChatInterfaceProps {
  userRole: "realtor" | "client" | "broker";
  pageNavigation: RealtorPageNavigation;
  className?: string;
}

export function ChatInterface({ userRole, pageNavigation, className }: ChatInterfaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isCleared, setIsCleared] = useState(false);
  const [toolProgress, setToolProgress] = useState<ToolExecutionProgressMessage | null>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const storedMessages = await getPastMessages();
        setMessages(storedMessages);
      } catch (error) {
        console.error("Failed to load messages from localStorage:", error);
      }
    };
    
    loadMessages();
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    const saveMessages = async () => {
      if (messages.length > 0) {
        try {
          await addMessages(messages);
        } catch (error) {
          console.error("Failed to save messages to localStorage:", error);
        }
      }
    };
    
    saveMessages();
  }, [messages]);

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
      files: files?.map(f => ({ name: f.name, type: f.type }))
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingMessage("");

    try {
      // Call server action
      const response = await sendMessage(content, messages, pageNavigation, files);

      // Handle case where response is undefined or null
      if (!response) {
        console.error("ChatInterface - No response received from sendMessage");
        throw new Error("No response received from chat service");
      }

      if (response.error) {
        throw new Error(response.error);
      }

      // Handle client-side navigation if present
      if ((response as any).navigation) {
        window.location.href = (response as any).navigation;
      }

      // Handle streaming response
      if (response.stream) {
        const reader = response.stream.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = "";

        let navigation: string | null = null;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          
          // Check for navigation marker (both old and new formats)
          const navigationMatch = chunk.match(/\[NAVIGATE:(.*?)\]/) || chunk.match(/\[NAVIGATION:(.*?)\]/);
          if (navigationMatch) {
            navigation = navigationMatch[1];
            // Remove navigation marker from message
            assistantMessage += chunk.replace(/\[NAVIGATE:.*?\]/, '').replace(/\[NAVIGATION:.*?\]/, '');
          }
          // Check for tool progress marker
          else if (chunk.includes('[TOOL_PROGRESS:')) {
            const toolProgressMatch = chunk.match(/\[TOOL_PROGRESS:(.*?)\]/);
            if (toolProgressMatch) {
              try {
                const progressData = JSON.parse(toolProgressMatch[1]) as ToolExecutionProgressMessage;
                setToolProgress(progressData);
                
                // If tool is completed or errored, clear progress after a short delay
                if (progressData.status === 'completed') {
                  setTimeout(() => setToolProgress(null), 1500);
                } else if (progressData.status === 'error') {
                  setTimeout(() => setToolProgress(null), 2000);
                }
              } catch (e) {
                console.error('Failed to parse tool progress data:', e, 'Raw match:', toolProgressMatch[1]);
              }
            }
            // Remove tool progress marker from message
            assistantMessage += chunk.replace(/\[TOOL_PROGRESS:.*?\]/, '');
          } else {
            assistantMessage += chunk;
          }
          
          setStreamingMessage(assistantMessage);
        }

        // Add complete assistant message
        const finalMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: assistantMessage.trim(),
          timestamp: new Date(),
          toolCalls: response.toolCalls
        };
        
        const updatedMessages = [...messages, finalMessage];
        setMessages(updatedMessages);
        setStreamingMessage("");

        // Handle navigation AFTER ensuring message is saved
        if (navigation) {
          
          try {
            // Force immediate save to localStorage before navigation
            await addMessages(updatedMessages);
            window.location.href = navigation;
          } catch (error) {
            console.error('[FRONTEND] Failed to save message before navigation:', error);
            // Navigate anyway to avoid user being stuck
            window.location.href = navigation;
          }
        } else {
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Oh no! Ora encountered an error processing your request. Please try again!",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    try {
      setMessages([]);
      clearMessages();
      setIsCleared(true);
      // Reset the success message after 2 seconds
      setTimeout(() => setIsCleared(false), 2000);
    } catch (error) {
      console.error("Failed to clear chat messages:", error);
    }
  };

  const getSuggestions = () => {
    switch (userRole) {
      case "realtor":
        return [
          "Create a new deal",
          "Add a form to my current deal",
          "Update client information",
          "Show me all active deals"
        ];
      case "client":
        return [
          "Show me available properties",
          "View my documents",
          "Check signature status",
          "Schedule a viewing"
        ];
      case "broker":
        return [
          "Review pending approvals",
          "View agent performance",
          "Manage templates",
          "Check compliance status"
        ];
      default:
        return [];
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 size-14 rounded-full shadow-lg z-50",
          "bg-primary hover:bg-primary/90",
          className
        )}
        size="icon"
      >
        <img src="/Ora.png" alt="Ora" className="size-8 object-contain" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 z-50 shadow-2xl transition-all duration-200",
      isMinimized ? "w-80 h-14" : "w-96 h-[600px]",
      "flex flex-col overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <img src="/Ora.png" alt="Ora" className="size-8 object-contain" />
          <h3 className="font-semibold">Chat with Ora</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleClearChat}
            disabled={messages.length === 0}
            title="Clear chat history"
          >
            <Trash2 className={cn("size-4", isCleared ? "text-green-600" : "text-gray-500")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="size-4" /> : <Minimize2 className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Chat Content */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <MessageList 
              messages={messages} 
              streamingMessage={streamingMessage}
              isLoading={isLoading}
              toolProgress={toolProgress}
            />
          </div>

          <div className="border-t p-4 shrink-0">
            <ChatInput
              onSendMessage={handleSendMessage}
              suggestions={getSuggestions()}
              isLoading={isLoading}
              placeholder="Ask Ora anything..."
            />
          </div>
        </>
      )}
    </Card>
  );
}