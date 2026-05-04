import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy_notice")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/privacy_notice"!</div>;
}
