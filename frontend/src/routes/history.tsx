import SideBarLayout from "@/components/SideBarLayout";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/history")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <SideBarLayout />
    </div>
  );
}
