// components/Sidebar.tsx
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import HomepageSidebarBody from "./HomepageSidebarBody";
import SidebarTop from "@/components/files/realtor/SidebarTop";
import SidebarBottom from "@/components/files/realtor/SidebarBottom";

export function ClientHomePageSidebar() {
  return (
    <Sidebar>
      <SidebarTop display="Client Dashboard" />
      <SidebarContent>
        <HomepageSidebarBody />
      </SidebarContent>
      <SidebarFooter>
        <SidebarBottom />
      </SidebarFooter>
    </Sidebar>
  );
}
