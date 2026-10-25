"use client";

import { ChatMessage } from "@/components/ai/types";

// Client-side localStorage functions
export async function getPastMessages(): Promise<ChatMessage[]> {
  // Check if we're in the browser
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem('ai-chat-messages');
    if (stored) {
      const messages = JSON.parse(stored);
      // Convert timestamp strings back to Date objects and ensure content is not undefined
      return messages
        .filter((msg: any) => msg.content !== undefined && msg.content !== null)
        .map((msg: any) => ({
          ...msg,
          content: msg.content || "",
          timestamp: new Date(msg.timestamp)
        }));
    }
    return [
      {
        id: "1",
        role: "assistant" as const,
        content: "Hello! How can I help you today?",
        timestamp: new Date()
      },
    ];
  } catch (error) {
    console.error("Failed to get past messages from localStorage:", error);
    return [
      {
        id: "1",
        role: "assistant" as const,
        content: "How can I assist you today?",
        timestamp: new Date()
      },
    ];
  }
}

export async function addMessages(messages: ChatMessage[]): Promise<void> {
  // Check if we're in the browser
  if (typeof window === 'undefined') {
    console.warn("addMessages called on server side, skipping localStorage save");
    return;
  }
  
  try {
    // Filter out messages with undefined or null content before saving
    const validMessages = messages.filter(msg => 
      msg.content !== undefined && 
      msg.content !== null && 
      msg.content.trim().length > 0
    );
    localStorage.setItem('ai-chat-messages', JSON.stringify(validMessages));
    validMessages.forEach(msg => {
    });
  } catch (error) {
    console.error("Failed to save messages to localStorage:", error);
    throw error;
  }
}

export function clearMessages(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem('ai-chat-messages');
  } catch (error) {
    console.error("Failed to clear messages from localStorage:", error);
  }
} 