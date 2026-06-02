import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  Heart,
  LogOut,
  Settings,
  Star,
  Store,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, logout, becomeOwner, snackbars } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const favs = snackbars.filter((s) => user.favorites.includes(s.id));

  const onBecomeOwner = () => {
    becomeOwner();
    navigate({ to: "/owner" });
  };

  return (
    <div className="px-5 pt-8">
      <header className="flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-brand text-lg font-bold text-primary-foreground shadow-glow">
          {user.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-lg font-bold">{user.name}</h1>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-surface-foreground">
            {user.role === "owner" ? "Proprietário" : "Consumidor"}
          </span>
        </div>
      </header>

      <section className="mt-6 rounded-2xl bg-surface text-surface-foreground shadow-card">
        <Row icon={<Heart size={16} />} label={`Meus favoritos (${favs.length})`} />
        <Row icon={<Star size={16} />} label="Histórico de avaliações" />
        <Row icon={<Settings size={16} />} label="Configurações" />
      </section>

      {user.role === "user" && (
        <section className="mt-6 rounded-2xl bg-brand p-5 text-white shadow-glow">
          <Store size={22} />
          <h3 className="mt-2 text-base font-bold">
            Deseja divulgar sua lanchonete?
          </h3>
          <p className="mt-1 text-xs text-white/85">
            Torne-se dono de lanchonete no UniPetit e alcance novos clientes.
          </p>
          <button
            onClick={onBecomeOwner}
            className="mt-4 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-surface-foreground"
          >
            Tornar-se Dono de Lanchonete
          </button>
        </section>
      )}

      {user.role === "owner" && (
        <Link
          to="/owner"
          className="mt-6 flex items-center justify-between rounded-2xl bg-surface px-4 py-4 text-surface-foreground shadow-card"
        >
          <span className="flex items-center gap-2 font-semibold">
            <Store size={16} /> Ir para o painel do proprietário
          </span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </Link>
      )}

      <button
        onClick={() => {
          logout();
          navigate({ to: "/" });
        }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-transparent py-3 text-sm font-semibold text-foreground"
      >
        <LogOut size={16} /> Sair
      </button>
    </div>
  );
}

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex w-full items-center justify-between border-b border-border px-4 py-3.5 text-left last:border-0">
      <span className="flex items-center gap-3 text-sm">
        <span className="text-brand">{icon}</span>
        {label}
      </span>
      <ChevronRight size={16} className="text-muted-foreground" />
    </button>
  );
}
