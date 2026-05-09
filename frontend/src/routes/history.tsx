import SideBarLayout from "@/components/SideBarLayout";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/history")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SideBarLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold">History</h1>
      </div>
    </SideBarLayout>
  );
}
