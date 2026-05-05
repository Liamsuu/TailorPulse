import { createFileRoute } from "@tanstack/react-router";
import SideBarLayout from "@/components/SideBarLayout";

export const Route = createFileRoute("/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SideBarLayout></SideBarLayout>;
}
