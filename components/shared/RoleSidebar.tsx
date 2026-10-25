"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Building2,
  Users,
  FileText,
  Calendar,
  Settings,
  LogOut,
  Briefcase,
  Search,
  LifeBuoy,
  ClipboardList,
  LayoutTemplate,
} from "lucide-react";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface RoleSidebarProps {
  role: "client" | "broker" | "realtor";
  userName?: string;
  userEmail?: string;
  className?: string;
}

const sidebarConfig: Record<string, SidebarItem[]> = {
  client: [
    { name: "Property Search", href: "/client/search", icon: Search },
    { name: "My Documents", href: "/client/documents", icon: FileText },
    { name: "Calendar", href: "/client/calendar", icon: Calendar },
    { name: "Market Insights", href: "/client/market", icon: Building2 },
    { name: "Support", href: "/client/support", icon: LifeBuoy },
  ],
  broker: [
    { name: "Agents", href: "/broker/agents", icon: Users },
    { name: "Approvals", href: "/broker/approvals", icon: ClipboardList },
    { name: "Templates", href: "/broker/templates", icon: LayoutTemplate },
    { name: "Reports", href: "/broker/reports", icon: FileText },
    { name: "Settings", href: "/broker/settings", icon: Settings },
  ],
  realtor: [
    { name: "Workspace", href: "/realtor/workspace", icon: Briefcase },
    { name: "CRM", href: "/realtor/workspace/crm", icon: Users },
    { name: "Templates", href: "/realtor/workspace/templates", icon: LayoutTemplate },
    { name: "Support", href: "/realtor/support", icon: LifeBuoy },
  ],
};

const roleDisplayNames = {
  client: "Client",
  broker: "Broker",
  realtor: "Realtor",
};

export const RoleSidebar: React.FC<RoleSidebarProps> = ({
  role,
  userName = "User",
  userEmail,
  className,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const sidebarItems = sidebarConfig[role] || [];
  const roleDisplayName = roleDisplayNames[role];

  const handleLogout = async () => {
    // Add logout logic here
    router.push("/auth/login");
  };

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", className)}>
      {/* User Profile Section */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{userName}</p>
            {userEmail && (
              <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
            )}
            <p className="text-xs text-muted-foreground">{roleDisplayName}</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {React.createElement(Icon, { className: "w-4 h-4", "aria-hidden": "true" })}
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={() => router.push("/settings")}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};