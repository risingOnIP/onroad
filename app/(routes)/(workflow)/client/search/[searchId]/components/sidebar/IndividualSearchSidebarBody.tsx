'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  FileText,
  PenLine,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const IndividualSearchSidebarBody = () => {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const searchIndex = segments.indexOf('search');
  const searchId = segments[searchIndex + 1];

  return (
    <div className="flex flex-col h-full py-4">
      {/* Search Links Section */}
      <SidebarGroup>
        <SidebarGroupLabel className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Search Links
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <div className="space-y-1 px-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors w-full justify-start"
                >
                  <Link
                    href={`/client/search/${searchId}/`}
                    className="flex items-center gap-3 w-full"
                  >
                    <LayoutDashboard className="h-5 w-5 text-gray-500" />
                    <span>Search Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors w-full justify-start"
                >
                  <Link
                    href={`/client/search/${searchId}/intake`}
                    className="flex items-center gap-3 w-full"
                  >
                    <FileText className="h-5 w-5 text-gray-500" />
                    <span>Intake Form</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors w-full justify-start"
                >
                  <Link
                    href={`/client/search/${searchId}/signatures`}
                    className="flex items-center gap-3 w-full"
                  >
                    <PenLine className="h-5 w-5 text-gray-500" />
                    <span>Signatures</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </div>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  );
};

export default IndividualSearchSidebarBody;
