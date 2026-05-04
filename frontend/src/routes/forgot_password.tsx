import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot_password")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/forgot_password"!</div>;
}
