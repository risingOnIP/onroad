"use client";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
}


// Client-side localStorage functions
export async function getPastMessages(): Promise<ChatMessage[]> {
  // Check if we're in the browser
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem('ai-chat-messages');
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      {
        id: "1",
        text: "Hello, how are you?",
        sender: "bot",
      },
    ];
  } catch (error) {
    console.error("Failed to get past messages from localStorage:", error);
    return [
      {
        id: "1",
        text: "How can I assist you today?",
        sender: "bot",
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
    localStorage.setItem('ai-chat-messages', JSON.stringify(messages));
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