"use client";

import { ChatSidebar } from "@/components/ai/chat-sidebar";
import { useContext } from "react";
import { DealPageContext, DealPageContextType } from "../../[deal]/DealPageContext";
import { RealtorPageNavigation } from "@/components/files/types/realtor";

export default function SidebarChat() {
  const dealPageContext: DealPageContextType = useContext(DealPageContext);


  // Create the realtorPageNavigation object from the context
  const realtorPageNavigation: RealtorPageNavigation = {
    area: "inside_deal",
    deal: {
      dealId: dealPageContext.dealId,
      tab: dealPageContext.state.currentTab || 'timeline',
      clients: dealPageContext.state.clientSection ? {
        clientTab: dealPageContext.state.clientTab || "all",
        clientSection: dealPageContext.state.clientSection || "management",
        editingIntake: dealPageContext.state.editingIntake,
        viewingResponses: dealPageContext.state.viewingResponses,
        previewingIntake: dealPageContext.state.previewingIntake,
        selectedClientIntakeId: dealPageContext.state.selectedClientIntakeId,
      } : undefined,
      forms: dealPageContext.state.currentTab === 'forms' ? {
        viewMode: (dealPageContext.state.viewMode === 'client-editor' ? "list" : dealPageContext.state.viewMode)|| "list",
        selectedFormId: dealPageContext.state.selectedFormId,
        selectedPropertyId: dealPageContext.state.selectedPropertyId,
      } : undefined
    }
  };
  
  return (
    <div className="relative h-full w-full">
      {/* Chat Sidebar - always visible, responsive width */}
      <div 
        className="h-full w-full bg-sidebar text-sidebar-foreground border-l border-sidebar-border"
      >
        {/* AI Chat takes full area */}
        <div className="h-full w-full">
          <ChatSidebar 
            userRole="realtor"
            dealId={dealPageContext.dealId}
            pageNavigation={realtorPageNavigation}
          />
        </div>
      </div>
    </div>
  );
}