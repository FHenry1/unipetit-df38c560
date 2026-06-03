import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  Heart,
  LogOut,
  Settings,
  Sparkles,
  Star,
  Store,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, logout, becomeOwner, snackbars } = useAuth();
  const navigate = useNavigate();
  const [loadingOwner, setLoadingOwner] = useState(false);
  if (!user) return null;

  const favs = snackbars.filter((s) => user.favorites.includes(s.id));

  const onBecomeOwner = async () => {
    if (loadingOwner) return;
    setLoadingOwner(true);
    try {
      await becomeOwner();
      navigate({ to: "/owner" });
    } finally {
      setLoadingOwner(false);
    }
  };

  return (
    <div className="pb-8">
      {/* Hero header */}
      <div className="relative overflow-hidden px-5 pt-10 pb-16">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,0.12), transparent 60%)",
          }}
        />
        <div className="flex flex-col items-center text-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-3xl font-extrabold text-[#5d0a1a] shadow-glow ring-4 ring-white/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-white">{user.name}</h1>
          <p className="mt-0.5 text-xs text-white/70">{user.email}</p>
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
            <Sparkles size={12} />
            {user.role === "owner" ? "Proprietário" : "Consumidor"}
          </span>
        </div>
      </div>

      <div className="-mt-10 px-5">
        {/* Stats */}
        <section className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Heart size={16} className="text-rose-500" />}
            label="Favoritos"
            value={favs.length}
          />
          <StatCard
            icon={<Star size={16} className="text-amber-500" />}
            label="Avaliações"
            value={0}
          />
        </section>

        {/* Menu list */}
        <section className="mt-5 overflow-hidden rounded-2xl bg-surface text-surface-foreground shadow-card">
          <Row
            icon={<Heart size={16} />}
            label="Meus favoritos"
            hint={`${favs.length}`}
          />
          <Row icon={<Star size={16} />} label="Histórico de avaliações" />
          <Row icon={<Settings size={16} />} label="Configurações" />
        </section>

        {/* Become owner */}
        {user.role === "user" && (
          <section
            className="relative mt-5 overflow-hidden rounded-2xl p-5 text-white shadow-glow"
            style={{
              background:
                "linear-gradient(135deg,#7a1228 0%,#5d0a1a 55%,#3a0510 100%)",
            }}
          >
            <div
              aria-hidden
              className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
            />
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                  <Store size={18} />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3a0510]">
                  <TrendingUp size={10} /> Novo
                </span>
              </div>
              <h3 className="mt-3 text-base font-extrabold">
                Deseja divulgar sua lanchonete?
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-white/85">
                Torne-se dono no UniPetit, cadastre seu menu e alcance novos
                clientes na universidade.
              </p>
              <button
                onClick={onBecomeOwner}
                disabled={loadingOwner}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#5d0a1a] transition active:scale-[0.98] disabled:opacity-70"
              >
                {loadingOwner ? "Ativando..." : "Tornar-se Dono de Lanchonete"}
                <ChevronRight size={16} />
              </button>
            </div>
          </section>
        )}

        {user.role === "owner" && (
          <Link
            to="/owner"
            className="mt-5 flex items-center justify-between rounded-2xl bg-surface px-4 py-4 text-surface-foreground shadow-card"
          >
            <span className="flex items-center gap-2 font-semibold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                <Store size={16} />
              </span>
              Ir para o painel do proprietário
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Link>
        )}

        <button
          onClick={async () => {
            await logout();
            navigate({ to: "/" });
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10"
        >
          <LogOut size={16} /> Sair
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4 text-surface-foreground shadow-card">
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted">
          {icon}
        </span>
        <span className="text-2xl font-extrabold">{value}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <button className="flex w-full items-center justify-between border-b border-border px-4 py-3.5 text-left last:border-0 hover:bg-muted/40">
      <span className="flex items-center gap-3 text-sm font-medium">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand">
          {icon}
        </span>
        {label}
      </span>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        {hint}
        <ChevronRight size={16} />
      </span>
    </button>
  );
}
