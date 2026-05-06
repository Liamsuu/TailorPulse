import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarHeader,
  SidebarTrigger,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "./ui/sidebar";
import { Separator } from "./ui/separator";

import { Link, useLocation } from "@tanstack/react-router";

// Icons
import { CirclePlus, FileText, User, Settings } from "lucide-react";

function SideBarLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  const isActive = (to: string, exact = false) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <SidebarProvider>
      <Sidebar variant="floating">
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <div className="p-2 text-[1.2rem]">TailorPulse</div>
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <Separator />
        <SidebarContent>
          <SidebarMenu className="flex flex-col gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/", true)}>
                <Link to="/">
                  <CirclePlus /> New Scan
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/history")}>
                <Link to="/history">
                  <FileText />
                  My CVs
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/profile", true)}>
                <Link to="/profile">
                  <User />
                  My Profile
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/settings", true)}>
                <Link to="/settings">
                  <Settings />
                  Settings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <Separator />
            <p className="pt-2 text-xs">&copy; 2026 Liam Colley</p>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarRail />

      <div className="flex items-center ml-auto mr-auto">{children}</div>
    </SidebarProvider>
  );
}

export default SideBarLayout;
