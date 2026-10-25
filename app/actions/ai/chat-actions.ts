"use server";

import { ChatResponse } from "@/components/ai/types";
import { AIConnectionTether, RealtorPageNavigation } from "@/components/files/types/realtor";
import { getAuthToken } from "../general";
import { ChatMessage } from "@/components/ai/types";

// Helper function to convert RealtorPageNavigation to URL path
function navigationToPath(nav: RealtorPageNavigation): string {
  if (nav.area === "workspace") {
    return "/realtor/workspace";
  }
  
  if (nav.area === "crm") {
    return "/realtor/crm";
  }
  
  if (nav.area === "templates") {
    if (nav.templates?.tab) {
      const params = new URLSearchParams();
      if (nav.templates.tab === "create") {
        params.set("mode", "create");
        return `/realtor/templates?${params.toString()}`;
      } else if (nav.templates.tab === "modify") {
        if (nav.templates.modify?.templateId) {
          if (nav.templates.modify.type === "transaction_forms") {
            return `/realtor/workspace/templates/modify/transaction-form/${nav.templates.modify.templateId}`;
          } else if (nav.templates.modify.type === "client_intake") {
            return `/realtor/workspace/templates/modify/client-intake/${nav.templates.modify.templateId}`;
          }
        } else {
          params.set("mode", "modify");
          if (nav.templates.modify?.type === "transaction_forms") {
            params.set("type", "transaction_forms");
          } else if (nav.templates.modify?.type === "client_intake") {
            params.set("type", "client_intake");
          }
          return `/realtor/templates?${params.toString()}`;
        }
      }
    }
    return "/realtor/workspace/templates";
  }
  
  if (nav.area === "help-docs") {
    const params = new URLSearchParams();
    const helpTab = nav.help_docs?.tab || "getting-started";
    params.set("tab", helpTab);
    return `/realtor/help-docs?${params.toString()}`;
  }
  
  if (nav.area === "inside_deal") {
    if (!nav.deal?.dealId) {
      return "/realtor/workspace"; // Fallback if no dealId
    }
    
    const baseUrl = `/realtor/workspace/${nav.deal.dealId}`;
    const tab = nav.deal.tab || "timeline";
    
    // Build query params for deal navigation
    const params = new URLSearchParams();
    params.set("tab", tab);
    
    if (tab === "clients" && nav.deal.clients) {
      if (nav.deal.clients.clientTab)   params.set("clientTab", nav.deal.clients.clientTab);
      // if (nav.deal.clients.clientSection) params.set("clientSection", nav.deal.clients.clientSection);
      if (nav.deal.clients.editingIntake) params.set("editingIntake", nav.deal.clients.editingIntake);
      if (nav.deal.clients.viewingResponses) params.set("viewingResponses", nav.deal.clients.viewingResponses);
      if (nav.deal.clients.previewingIntake) params.set("previewingIntake", nav.deal.clients.previewingIntake);
      if (nav.deal.clients.selectedClientIntakeId) params.set("selectedClientIntakeId", nav.deal.clients.selectedClientIntakeId);
    }
    
    if (tab === "forms" && nav.deal.forms) {
      if (nav.deal.forms.viewMode)  {
        params.set("viewMode", nav.deal.forms.viewMode); 

        if (nav.deal.forms.viewMode === "form-editor" || nav.deal.forms.viewMode === "preview" || nav.deal.forms.viewMode === "finalized") {
          if (nav.deal.forms.selectedFormId) params.set("selectedFormId", nav.deal.forms.selectedFormId);
        }
        else if (nav.deal.forms.viewMode === "property-editor") {
          if (nav.deal.forms.selectedPropertyId) params.set("selectedPropertyId", nav.deal.forms.selectedPropertyId);
        }
      }
      else {
        params.set("viewMode", "list");
      }    
    }
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  if (nav.area === "first-sign-in") {
    return "/realtor/onboarding";
  }
  
  // Default fallback
  return "/realtor/workspace";
}

export async function sendMessage(
  message: string, 
  pastMessages: ChatMessage[],
  pageNavigation: RealtorPageNavigation,
  files?: File[]
): Promise<ChatResponse & { navigation?: string }> {
  "use server";
  

  try {
       // Add the current message to the conversation
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: message,
      timestamp: new Date()
    };
    const fullConversation = [...pastMessages, newMessage];

    // Create AIConnectionTether object matching backend expectations
    const aiTether: AIConnectionTether = {
      role: 'realtor',
      pageNavigation: pageNavigation,
      fullConversation: fullConversation
    };


    // Create form data with the aiTether as a JSON string
    const formData = new FormData();
    formData.append("aiTether", JSON.stringify(aiTether));

    if (files && files.length > 0) {
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    }
    const token = await getAuthToken(); 

    const response = await fetch(`${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });

    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI chat error response:", errorText);
      return { error: `Ora ran into a technical hiccup. Let's try that again!` };
    }

    // Check if we received SSE content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/event-stream')) {
      console.error("Unexpected content-type:", contentType);
      return { error: "Ora received something unexpected. Let me reconnect!" };
    }

    // Stream the SSE response in real-time while checking for navigation
    let shouldRedirect: string | undefined = undefined;
    let eventCounter = 0;
    
    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        
        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || "";
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    eventCounter++;
                    const timestamp = new Date().toISOString();
                    
                    // Log every event with timestamp and event number
                    
                    if (data.type === 'text_chunk') {
                      controller.enqueue(new TextEncoder().encode(data.text));
                      
                    } else if (data.type === 'navigation') {
                      
                      if (data.navigationData) {
                        shouldRedirect = navigationToPath(data.navigationData);
                        controller.enqueue(new TextEncoder().encode(`[NAVIGATE:${shouldRedirect}]`));
                      } else {
                        console.warn(`   [NAVIGATION WARNING #${eventCounter}] navigationData property missing!`);
                        console.warn(`   Available properties:`, Object.keys(data));
                      }
                      
                    } else if (data.type === 'tool_calls_complete') {
                      
                    } else if (data.type === 'tool_execution_progress') {
                      
                      if (data.toolName && data.toolName.startsWith('navigate')) {
                      }
                      
                      // Stream progress messages in real-time
                      controller.enqueue(new TextEncoder().encode(`[TOOL_PROGRESS:${JSON.stringify(data)}]`));
                      
                    } else if (data.type === 'stream_complete') {
                      
                    } else if (data.type === 'error') {
                      console.error(`   [ERROR #${eventCounter}] Error message: ${data.message}`);
                      controller.enqueue(new TextEncoder().encode(`Oopsiees! Ora encountered: ${data.message}`));
                      
                    } else {
                    }
                  } catch (e) {
                    console.error(`   [PARSE_ERROR #${eventCounter}] Failed to parse SSE data:`, e);
                    console.error(`   Raw line: "${line}"`);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Stream processing error:', error);
          } finally {
            controller.close();
          }
        };
        
        processStream();
      }
    });
    
    return {
      stream,
      toolCalls: [],
      navigation: shouldRedirect
    };
  } catch (error) {
    // Check if this is a Next.js redirect error - if so, re-throw it
    if (error instanceof Error && (
      error.message === 'NEXT_REDIRECT' || 
      (error as any).digest?.startsWith('NEXT_REDIRECT')
    )) {
      throw error;
    }
    
    console.error("AI chat error:", error);
    return { error: "Oh no! Ora had trouble processing that potentially sensitive request. Can you try again?" };
  }
}


