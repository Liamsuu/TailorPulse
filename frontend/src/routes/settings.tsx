import SideBarLayout from "@/components/SideBarLayout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SideBarLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
    </SideBarLayout>
  );
}
