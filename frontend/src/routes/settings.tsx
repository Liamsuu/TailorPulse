import SideBarLayout from "@/components/SideBarLayout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SideBarLayout></SideBarLayout>;
}
