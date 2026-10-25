"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Home, LogOut, FileText, Users, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import SidebarBottom from "@/components/files/realtor/SidebarBottom";
import { DealPageContext, TabMode } from "../DealPageContext";

export function RWDSidebarLeft(props: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const { state, navigateToClients, navigateToForms, navigateToSettings, navigateToTimeline } = React.useContext(DealPageContext);

  // Navigation items for left sidebar
  const navItems = [
    {
      title: "Clients",
      tabMode: "clients" as TabMode,
      icon: Users,
    },
    {
      title: "Form Page",
      tabMode: "forms" as TabMode,
      icon: FileText,
    },
    {
      title: "Deal Settings",
      tabMode: "settings" as TabMode,
      icon: Settings,
    },
  ];

  const handleBackToWorkspace = () => {
    router.push("/realtor/workspace");
  };

  const handleTabClick = (tabMode: TabMode) => {
    switch (tabMode) {
      case 'clients':
        navigateToClients();
        break;
      case 'forms':
        navigateToForms();
        break;
      case 'settings':
        navigateToSettings();
        break;
      default:
        break;
    }
  };

  const handleTimelineClick = () => {
    navigateToTimeline();
  };

  return (
    <Sidebar
      collapsible="none"
      className="!w-[calc(var(--sidebar-width-icon)_*_1.3_+_1px)] border-r"
      {...props}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={{
                    children: "Back to All Deals",
                    hidden: false,
                  }}
                  onClick={handleBackToWorkspace}
                  className="px-2.5 md:px-2 cursor-pointer flex justify-center items-center"
                >
                  <LogOut className="text-gray-500 scale-125" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {/* Timeline Tab */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={{
                    children: "Timeline",
                    hidden: false,
                  }}
                  onClick={handleTimelineClick}
                  isActive={state.currentTab === 'timeline'}
                  className={`px-2.5 md:px-2 cursor-pointer flex justify-center items-center ${
                    state.currentTab === 'timeline'
                      ? "bg-accent border-l-2 border-l-primary text-primary font-semibold"
                      : ""
                  }`}
                >
                  <Home className={`${state.currentTab === 'timeline' ? "text-primary" : "text-gray-500"} scale-125`} />
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Navigation Tabs */}
              {navItems.map((item) => {
                const isActive = state.currentTab === item.tabMode;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => handleTabClick(item.tabMode)}
                      isActive={isActive}
                      className={`className="px-2.5 md:px-2 cursor-pointer flex justify-center items-center" ${
                        isActive
                          ? "bg-accent border-l-2 border-l-primary text-primary font-semibold"
                          : ""
                      }`}
                    >
                      <item.icon
                        className={`${isActive ? "text-primary" : "text-gray-500"} scale-125`}
                      />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarBottom />
    </Sidebar>
  );
}
