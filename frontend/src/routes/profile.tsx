import { createFileRoute } from "@tanstack/react-router";
import SideBarLayout from "@/components/SideBarLayout";

export const Route = createFileRoute("/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SideBarLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>
    </SideBarLayout>
  );
}
