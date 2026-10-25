"use client";

import { TextChunk } from "./TextChunk";
import { ActionButtons } from "./ActionButtons";
import { StatusUpdate } from "./StatusUpdate";

interface TextChunkMessage {
  type: "text_chunk";
  text: string;
}

interface ActionButtonMessage {
  type: "action_button";
  buttons: Array<{
    label: string;
    action: string;
    style?: "primary" | "secondary" | "danger";
  }>;
}

interface NavigationMessage {
  type: "navigation";
  location: string;
}

interface StatusUpdateMessage {
  type: "status_update";
  status: string;
  progress?: number;
  loading?: boolean;
}

type AIMessage = TextChunkMessage | ActionButtonMessage | NavigationMessage | StatusUpdateMessage;

interface AIMessageRendererProps {
  message: AIMessage;
  onButtonClick?: (action: string) => void;
  onNavigation?: (location: string) => void;
}

export function AIMessageRenderer({ message, onButtonClick, onNavigation }: AIMessageRendererProps) {
  switch (message.type) {
    case "text_chunk":
      return <TextChunk text={message.text} />;
      
    case "action_button":
      return (
        <ActionButtons 
          buttons={message.buttons} 
          onButtonClick={onButtonClick || (() => {})} 
        />
      );
      
    case "navigation":
      // Handle navigation automatically
      if (onNavigation) {
        onNavigation(message.location);
      } else {
        window.location.href = message.location;
      }
      return null;
      
    case "status_update":
      return (
        <StatusUpdate 
          status={message.status}
          progress={message.progress}
          loading={message.loading}
        />
      );
      
    default:
      return null;
  }
}