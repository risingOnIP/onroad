"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { sendMessage } from "@/app/actions/ai/chat-actions";
import { ChatMessage, ToolExecutionProgressMessage } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getPastMessages,
  addMessages,
  clearMessages,
} from "@/app/utils/chat-storage";
import { RealtorPageNavigation } from "../files/types/realtor";

interface ChatSidebarProps {
  userRole: "realtor" | "client" | "broker";
  dealId?: string;
  pageNavigation: RealtorPageNavigation;
}

export function ChatSidebar({
  userRole,
  dealId,
  pageNavigation,
}: ChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [isCleared, setIsCleared] = useState(false);
  const [toolProgress, setToolProgress] = useState<ToolExecutionProgressMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;


    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
      files: files?.map((f) => ({ name: f.name, type: f.type, size: f.size })),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingMessage("");

    try {

      const response = await sendMessage(content, messages, pageNavigation, files);


      // Handle case where response is undefined or null
      if (!response) {
        console.error("ChatSidebar - No response received from sendMessage");
        throw new Error("No response received from chat service");
      }

      if (response.error) {
        console.error("ChatSidebar - Error in response:", response.error);
        throw new Error(response.error);
      }

      // Handle client-side navigation if present
      if ((response as any).navigation) {
        router.push((response as any).navigation);
      }

      // Handle streaming response
      if (response.stream) {
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
          timestamp: new Date(),
          toolCalls: response.toolCalls || [],
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Process the stream
        const reader = response.stream.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let chunkCounter = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          chunkCounter++;
          const chunk = decoder.decode(value);
          const chunkTimestamp = new Date().toISOString();
          
          // Check for navigation commands
          if (chunk.includes('[NAVIGATE:')) {
            const navigationMatch = chunk.match(/\[NAVIGATE:([^\]]+)\]/);
            if (navigationMatch) {
              const navigateTo = navigationMatch[1];
              
              // Navigate immediately for better UX
              router.push(navigateTo);
              
              // Remove navigation marker from content
              const cleanChunk = chunk.replace(/\[NAVIGATE:[^\]]+\]/g, '');
              fullContent += cleanChunk;
            } else {
              console.warn(`[CHAT-SIDEBAR NAV] Found [NAVIGATE: but couldn't extract URL`);
              fullContent += chunk;
            }
          }
          // Check for tool progress marker
          else if (chunk.includes('[TOOL_PROGRESS:')) {
            const toolProgressMatch = chunk.match(/\[TOOL_PROGRESS:(.*?)\]/);
            if (toolProgressMatch) {
              try {
                const progressData = JSON.parse(toolProgressMatch[1]) as ToolExecutionProgressMessage;
                setToolProgress(progressData);
                
                // If tool is completed, clear progress after a short delay
                if (progressData.status === 'completed') {
                  setTimeout(() => setToolProgress(null), 1000);
                }
              } catch (e) {
                console.error(`[CHAT-SIDEBAR TOOL] Failed to parse tool progress:`, e);
              }
            }
            // Remove tool progress marker from content
            const cleanChunk = chunk.replace(/\[TOOL_PROGRESS:.*?\]/g, '');
            fullContent += cleanChunk;
          } else {
            // Regular text chunk
            fullContent += chunk;
          }

          // Update the message with accumulated content
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: fullContent }
                : msg
            )
          );
        }
      } else if (response.message) {
        // Non-streaming response with a message
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.message,
          timestamp: new Date(),
          toolCalls: response.toolCalls,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Oh no! Ora encountered an error processing your request. Please try again!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingMessage("");
    }
  };

  const getSuggestions = () => {
    const suggestions = {
      realtor: [
        "Create new deal",
        "Add form to deal",
        "Search deals",
        "Add client",
      ],
      client: [
        "View my documents",
        "Check signature status",
        "Contact realtor",
      ],
      broker: [
        "Review pending approvals",
        "Check agent performance",
        "Run compliance audit",
      ],
    };
    return suggestions[userRole] || [];
  };

  return (
    <div
      className={("h-full flex flex-col bg-background border-l overflow-hidden")}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <img src="/Ora.png" alt="Ora" className="size-8 object-contain" />
          <h3 className="font-semibold">Pick Ora&apos;s Brain</h3>
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
            <Trash2
              className={cn(
                "size-4",
                isCleared ? "text-green-600" : "text-gray-500"
              )}
            />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <HelpCircle className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-2">
                <h4 className="font-medium">Quick Help</h4>
                <p className="text-sm text-muted-foreground">
                  Hi! I&apos;m Ora, your OnRoad assistant. Ask me anything about
                  your workflow!
                </p>
                <div className="space-y-1 text-sm">
                  <div className="font-medium">Try these:</div>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {userRole === "realtor" && (
                      <>
                        <li>&quot;Create a new deal&quot;</li>
                        <li>&quot;Add forms to this deal&quot;</li>
                        <li>&quot;Show my active deals&quot;</li>
                      </>
                    )}
                    {userRole === "client" && (
                      <>
                        <li>&quot;Show my documents&quot;</li>
                        <li>&quot;What needs my signature?&quot;</li>
                        <li>&quot;Contact my realtor&quot;</li>
                      </>
                    )}
                    {userRole === "broker" && (
                      <>
                        <li>&quot;Show pending approvals&quot;</li>
                        <li>&quot;Review agent performance&quot;</li>
                        <li>&quot;Run compliance check&quot;</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Messages Area with ScrollArea */}
      <ScrollArea className="flex-1 overflow-y-auto min-h-0" ref={scrollAreaRef}>
        <div className="p-4 pb-0 min-h-0">
          <MessageList
            messages={messages}
            streamingMessage={streamingMessage}
            isLoading={isLoading}
            toolProgress={toolProgress}
          />
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          suggestions={getSuggestions()}
          isLoading={isLoading}
          placeholder="Ask Ora anything..."
          userRole={userRole}
        />
      </div>
    </div>
  );
}
