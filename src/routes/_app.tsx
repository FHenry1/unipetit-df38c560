import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

function AppShell() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="mx-auto min-h-screen max-w-md pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
}
