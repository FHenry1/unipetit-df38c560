import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/owner")({
  component: OwnerLayout,
});

function OwnerLayout() {
  return <Outlet />;
}