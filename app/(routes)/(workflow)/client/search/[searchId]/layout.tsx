// app/(workflow)/client/(homepages)/dashboard/layout.tsx
import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { IndividualSearchSidebar } from "./components/sidebar/IndividualSearchSidebar";

export default function Client({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen max-h-screen">
        {/* Sidebar */}
        <div className="bg-white border-r border-gray-200">
          <IndividualSearchSidebar />
        </div>

        {/* Main content */}
        <div className="flex-1 w-full bg-gray-100 relative">
          {/* Top trigger bar */}
          <div className="bg-white py-2 px-4 flex items-center shadow-sm absolute top-0 left-0 right-0 z-10 h-10">
            <SidebarTrigger className="ml-1" />
          </div>

          <div className="pt-14 px-8 pb-8 overflow-auto h-screen">
            <div className="flex-1 w-full min-w-0 flex flex-col space-y-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
