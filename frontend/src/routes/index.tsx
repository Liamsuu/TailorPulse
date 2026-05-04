import SideBarLayout from "@/components/SideBarLayout";

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div>
      <SideBarLayout />
    </div>
  );
}
