import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SnackBarCard } from "@/components/SnackBarCard";
import {
  EMPTY_FILTERS,
  FilterSheet,
  applyFilters,
  filtersActiveCount,
  type SnackFilters,
} from "@/components/FilterSheet";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/search")({
  component: SearchPage,
});

function SearchPage() {
  const { snackbars, user, toggleFavorite } = useAuth();

  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<SnackFilters>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeCount = filtersActiveCount(filters);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const byTerm = term
      ? snackbars.filter(
          (s) =>
            s.name.toLowerCase().includes(term) ||
            s.menu_items.some((m) => m.name.toLowerCase().includes(term)),
        )
      : snackbars;
    return applyFilters(byTerm, filters);
  }, [q, snackbars, filters]);

  return (
    <div className="px-5 pt-8">
      <h1 className="text-xl font-bold">Buscar</h1>

      <div className="mt-4 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-surface px-4 py-3 shadow-card">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar lanchonetes ou comidas..."
            className="w-full bg-transparent text-sm text-surface-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#5a0a1a] text-white shadow-card transition active:scale-95"
          aria-label="Abrir filtros"
        >
          <SlidersHorizontal size={18} className="text-white" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white shadow">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {activeCount > 0 && (
        <button
          onClick={() => setFilters(EMPTY_FILTERS)}
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 hover:bg-white/20"
        >
          <X size={12} /> Limpar filtros
        </button>
      )}

      <p className="mt-4 text-xs text-white/70">
        {filtered.length} resultado(s)
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 pb-6">
        {filtered.map((s) => (
          <SnackBarCard
            key={s.id}
            s={s}
            isFav={!!user?.favorites.includes(s.id)}
            onFav={toggleFavorite}
          />
        ))}

        {filtered.length === 0 && (
          <p className="col-span-2 mt-8 text-center text-sm text-white/70">
            Nenhuma lanchonete encontrada com esses filtros.
          </p>
        )}
      </div>

      <FilterSheet
        open={sheetOpen}
        initial={filters}
        onClose={() => setSheetOpen(false)}
        onApply={(f) => {
          setFilters(f);
          setSheetOpen(false);
        }}
      />
    </div>
  );
}
