import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { CATEGORIES } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";
import { SnackBarCard } from "@/components/SnackBarCard";

export const Route = createFileRoute("/_app/home")({
  component: HomePage,
});

function HomePage() {
  const { user, snackbars } = useAuth();

  const top = [...snackbars].sort((a, b) => b.rating - a.rating);

  return (
    <div className="px-5 pt-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Olá,</p>
          <h1 className="text-xl font-bold">{user?.name.split(" ")[0]} 👋</h1>
        </div>
        <Link
          to="/profile"
          className="grid h-11 w-11 place-items-center rounded-full bg-brand text-sm font-bold text-primary-foreground shadow-glow"
        >
          {user?.name.charAt(0)}
        </Link>
      </header>

      <Link
        to="/search"
        className="mt-5 flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm text-muted-foreground shadow-card"
      >
        <Search size={16} />
        Pesquisar lanchonetes ou comidas...
      </Link>

      <section className="mt-7">
        <h2 className="mb-3 text-sm font-semibold">Categorias</h2>
        <div className="grid grid-cols-4 gap-3">
          {CATEGORIES.map((c) => (
            <div
              key={c.id}
              className="flex flex-col items-center gap-1 rounded-2xl bg-surface p-3 text-center text-surface-foreground shadow-card"
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-[10px] font-medium leading-tight">
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-semibold">Mais bem avaliados</h2>
          <span className="text-xs text-muted-foreground">Perto de você</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {top.map((s) => (
            <SnackBarCard key={s.id} s={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
