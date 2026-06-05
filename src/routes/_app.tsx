import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { OwnerBottomNav } from "@/components/OwnerBottomNav";
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

  const isOwner = user.role === "owner";

  return (
    <div
      className={`mx-auto min-h-screen max-w-md pb-20 ${
        isOwner ? "bg-neutral-950 text-neutral-100" : ""
      }`}
    >
      <Outlet />
      {isOwner ? <OwnerBottomNav /> : <BottomNav />}
    </div>
  );
}
