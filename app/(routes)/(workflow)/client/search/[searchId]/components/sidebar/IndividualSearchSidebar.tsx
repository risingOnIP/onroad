// components/Sidebar.tsx
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
  } from "@/components/ui/sidebar";
  import SidebarTop from "@/components/files/realtor/SidebarTop";
  import SidebarBottom from "@/components/files/realtor/SidebarBottom";
import IndividualSearchSidebarBody from "./IndividualSearchSidebarBody";
  
  export function IndividualSearchSidebar() {
    return (
      <Sidebar>
        <SidebarTop display="Search Sidebar" />
        <SidebarContent>
        <IndividualSearchSidebarBody />
        </SidebarContent>
        <SidebarFooter>
          <SidebarBottom />
        </SidebarFooter>
      </Sidebar>
    );
  }
  