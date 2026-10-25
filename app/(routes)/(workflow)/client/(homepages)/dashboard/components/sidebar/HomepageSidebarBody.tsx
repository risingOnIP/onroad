import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import React from "react";
import Link from "next/link";
import { 
  Compass, 
  Home,
} from "lucide-react";

const HomepageSidebarBody = () => {
  return (
    <div className="flex flex-col h-full py-4">
      {/* Property Tools Section */}
      <SidebarGroup>
        <SidebarGroupLabel className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          The places you can go
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <div className="space-y-1 px-2">

            <SidebarMenuItem>
                <SidebarMenuButton asChild className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors w-full justify-start">
                  <Link href="/client/dashboard" className="flex items-center gap-3 w-full">
                    <Home className="h-5 w-5 text-gray-500" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors w-full justify-start">
                  <Link href="/client/search" className="flex items-center gap-3 w-full">
                    <Compass className="h-5 w-5 text-gray-500" />
                    <span>Property Searches</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {/* <SidebarMenuItem>
                <SidebarMenuButton asChild className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors w-full justify-start">
                  <Link href="/client/manage" className="flex items-center gap-3 w-full">
                    <Home className="h-5 w-5 text-gray-500" />
                    <span>Manage My Properties</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors w-full justify-start">
                  <Link href="/client/calendar" className="flex items-center gap-3 w-full">
                    <CalendarDays className="h-5 w-5 text-gray-500" />
                    <span>Calendar</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors w-full justify-start">
                  <Link href="/client/market" className="flex items-center gap-3 w-full">
                    <BarChart2 className="h-5 w-5 text-gray-500" />
                    <span>Market Analytics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem> */}
            </div>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  );
};

export default HomepageSidebarBody;