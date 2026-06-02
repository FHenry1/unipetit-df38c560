import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: user.role === "owner" ? "/owner" : "/home" });
  }, [user, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-brand p-8 shadow-card">
        <div className="flex flex-col items-center gap-8 py-6">
          <div className="grid place-items-center">
            <div className="grid h-24 w-24 place-items-center rounded-3xl bg-white/15 backdrop-blur">
              <svg viewBox="0 0 32 32" width="56" height="56" fill="none">
                <circle cx="9" cy="10" r="3" fill="white" />
                <circle cx="16" cy="7" r="3" fill="white" />
                <circle cx="23" cy="10" r="3" fill="white" />
                <circle cx="6" cy="17" r="2.5" fill="white" />
                <circle cx="26" cy="17" r="2.5" fill="white" />
                <path
                  d="M10 21c0-3.3 2.7-6 6-6s6 2.7 6 6c0 3-2.5 5-6 5s-6-2-6-5z"
                  fill="white"
                />
              </svg>
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white">
              UNIPETIT
            </h1>
            <p className="mt-1 text-center text-xs uppercase tracking-[0.2em] text-white/80">
              Seu lanche, do petit ao maxi
            </p>
          </div>

          <div className="w-full space-y-3 pt-4">
            <Link
              to="/login"
              className="block w-full rounded-xl bg-white/95 px-4 py-3 text-center text-sm font-semibold text-surface-foreground shadow-glow"
            >
              Fazer login
            </Link>
            <Link
              to="/signup"
              className="block w-full rounded-xl border border-white/60 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
