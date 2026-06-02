import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { SnackBarCard } from "@/components/SnackBarCard";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/search")({
  component: SearchPage,
});

function SearchPage() {
  const { snackbars } = useAuth();
  const [q, setQ] = useState("");

  const term = q.trim().toLowerCase();
  const filtered = term
    ? snackbars.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.menu_items.some((m) => m.name.toLowerCase().includes(term)),
      )
    : snackbars;

  return (
    <div className="px-5 pt-8">
      <h1 className="text-xl font-bold">Buscar</h1>
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 shadow-card">
        <Search size={16} className="text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar lanchonetes ou comidas..."
          className="w-full bg-transparent text-sm text-surface-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {filtered.length} resultado(s)
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 pb-6">
        {filtered.map((s) => (
          <SnackBarCard key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
}
