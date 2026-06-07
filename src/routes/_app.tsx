import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { OwnerBottomNav } from "@/components/OwnerBottomNav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

function AppShell() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/signup" });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="mx-auto grid min-h-screen max-w-md place-items-center bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-[#e85d75]" />
      </div>
    );
  }

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
