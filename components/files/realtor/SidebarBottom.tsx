"use client";

import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  CircleUser,
  SwitchCamera,
  ChartArea,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Profile } from "../types/realtor";
import { getProfile } from "@/app/actions/realtor/profile-actions";
import { usePathname } from "next/navigation";

const SidebarBottom = () => {
  const { isMobile } = useSidebar();
  const [profile, setProfile] = useState<Profile>();
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const role = segments[0];

  useEffect(() => {
    const gettingProfile = async () => {
      const myProfile = await getProfile(role);
      setProfile(myProfile);
    };
    gettingProfile();
  }, [role]);

  return (
    <SidebarFooter className="border-t py-2">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="w-full cursor-pointer transition-colors hover:bg-muted/50 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
              >
                <Avatar className="h-10 w-10 rounded-xl">
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="User profile"
                  />
                  <AvatarFallback className="rounded-xl bg-muted">
                    CN
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {profile?.firstName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {profile?.email}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl bg-white shadow-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
              alignOffset={8}
              avoidCollisions={true}
              collisionPadding={16}
            >
              <div className="flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10 rounded-xl">
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="User profile"
                  />
                  <AvatarFallback className="rounded-xl bg-muted">
                    CN
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left">
                  <span className="truncate font-semibold">
                    {profile?.firstName}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {profile?.email}
                  </span>
                </div>
              </div>

              <DropdownMenuGroup className="p-1">
                <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted/50">
                  <CircleUser className="h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuGroup className="p-1">
                <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted/50">
                  <BadgeCheck className="h-4 w-4" />
                  <span>Tethers</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted/50">
                  <ChartArea className="h-4 w-4" />
                  <span>Stats</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted/50">
                  <SwitchCamera className="h-4 w-4" />
                  <span>Switch Role</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuGroup className="p-1">
                <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-500 hover:bg-muted/50 hover:text-red-600 focus:text-red-500">
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};

export default SidebarBottom;
