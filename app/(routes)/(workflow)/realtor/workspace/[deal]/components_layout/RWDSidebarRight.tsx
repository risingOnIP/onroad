"use client";

import * as React from "react";
import { useContext, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  HelpCircle,
  Download,
} from "lucide-react";
import { DealPageContext } from "../DealPageContext";

// Import components for integrated functionality
import FormDealOptions from "../forms/FormDealOptions";
import DealSignaturePanel from "./DealSignaturePanel";
import DealReviewPanel from "./DealReviewPanel";
import DownloadFormsModal from "./DownloadFormsModal";
import SendActionsDropdown from "../components/SendActionsDropdown";
import ClientSidebar from "../client/ClientSidebar";

interface RWDSidebarRightProps {
  dealId: string;
  dealSide: string;
}

export function RWDSidebarRight({
  dealId,
  dealSide,
  ...props
}: React.ComponentProps<typeof Sidebar> & RWDSidebarRightProps) {
  const [isSignaturePanelOpen, setIsSignaturePanelOpen] = useState(false);
  const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const { state } = useContext(DealPageContext);

  const getTitle = () => {
    switch (state.currentTab) {
      case "timeline":
        return "Deal Tools";
      case "forms":
        return "Forms";
      case "clients":
        return "Client Management";
      case "settings":
        return "Settings Tools";
      default:
        return "Deal Tools";
    }
  };

  const renderContent = () => {
    switch (state.currentTab) {
      case "timeline":
        return (
          <>
            {/* General Deal Tools */}

            {/* Quick Actions */}
            <SidebarGroup>
              <SidebarGroupLabel>Support</SidebarGroupLabel>
              <SidebarGroupContent className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/realtor/help-docs">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Help & Docs
                  </Link>
                </Button>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        );

      case "forms":
        return (
          <>
            {/* Forms Management */}
            <SidebarGroup>
              <SidebarGroupLabel>Actions</SidebarGroupLabel>
              <SidebarGroupContent className="space-y-3">
                <div className="w-full">
                  <SendActionsDropdown
                    onSendSignatures={() => setIsSignaturePanelOpen(true)}
                    onSendForReview={() => setIsReviewPanelOpen(true)}
                    showReviewOption={true}
                    className="w-full"
                  />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Deal Options & Forms */}
            <SidebarGroup className="flex-grow">
              <SidebarGroupContent>
                <FormDealOptions dealId={dealId} dealSide={dealSide} />
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        );

      case "clients":
        return (
          <>
            {/* Client Navigation */}
           

            {/* Client List */}
            <SidebarGroup className="flex-grow">
              <SidebarGroupContent>
                <ClientSidebar dealId={dealId} />
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        );

    
      case "settings":
        return (
          <>
            {/* Settings Actions */}
            <SidebarGroup>
              <SidebarGroupLabel>Support</SidebarGroupLabel>
              <SidebarGroupContent className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/realtor/help-docs">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Help & Docs
                  </Link>
                </Button>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Settings Info */}
            <SidebarGroup>
              <SidebarGroupLabel>Settings Overview</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="text-xs text-muted-foreground space-y-2">
                  <p>• Edit deal information</p>
                  <p>• Manage clients</p>
                  <p>• Update templates</p>
                  <p>• Configure preferences</p>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Sidebar collapsible="none" className="hidden flex-1 md:flex" {...props}>
      <SidebarHeader className="gap-3.5 border-b p-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-base font-medium text-foreground">
            {getTitle()}
          </div>
          <Button
            variant="default"
            size="sm"
            className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsDownloadModalOpen(true)}
          >
            <Download className="h-4 w-4 text-white" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-grow flex flex-col">
        {renderContent()}
      </SidebarContent>

      {/* Signature Panel Modal */}
      <DealSignaturePanel
        dealId={dealId}
        isOpen={isSignaturePanelOpen}
        onClose={() => setIsSignaturePanelOpen(false)}
      />

      {/* Review Panel Modal */}
      <DealReviewPanel
        dealId={dealId}
        isOpen={isReviewPanelOpen}
        onClose={() => setIsReviewPanelOpen(false)}
      />

      {/* Download Forms Modal */}
      <DownloadFormsModal
        dealId={dealId}
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </Sidebar>
  );
}
