export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  files?: { name: string; type: string }[];
  toolCalls?: ToolCall[];
  isError?: boolean;
}

export interface ToolCall {
  name: string;
  arguments?: Record<string, any>;
  status?: "pending" | "success" | "error";
  result?: any;
  error?: string;
}

export interface ToolExecutionProgressMessage {
  type: "tool_execution_progress";
  toolName: string;
  status: "starting" | "in_progress" | "completed" | "error";
  message?: string;
}

export interface ChatResponse {
  message?: string;
  toolCalls?: ToolCall[];
  navigation?: string;
  stream?: ReadableStream;
  error?: string;
}