import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "./ui/sidebar";
import { Separator } from "./ui/separator";

import { Link, useLocation } from "@tanstack/react-router";

function SideBarLayout({}) {
  const { pathname } = useLocation();

  const isActive = (to: string, exact = false) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>TailorPulse</SidebarHeader>
        <Separator />
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem key={1}>
              <SidebarMenuButton asChild isActive={isActive("/", true)}>
                <Link to="/">Overview</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem key={2}>
              <SidebarMenuButton asChild isActive={isActive("/history")}>
                <Link to="/history">History</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}

export default SideBarLayout;
