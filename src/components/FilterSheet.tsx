import { Cookie, GlassWater, Eye, CheckCircle2, XCircle, Salad, Cake, Star } from "lucide-react";
import { useEffect, useState } from "react";

export type FilterStatus = "all" | "open" | "closed";
export type FilterPrice = "any" | "$" | "$$" | "$$$";
export type FilterDistance = "any" | "200m" | "500m" | "1km";

export interface SnackFilters {
  status: FilterStatus;
  categories: string[];
  price: FilterPrice;
  distance: FilterDistance;
  minRating: number;
}

export const EMPTY_FILTERS: SnackFilters = {
  status: "all",
  categories: [],
  price: "any",
  distance: "any",
  minRating: 0,
};

export function filtersActiveCount(f: SnackFilters): number {
  let n = 0;
  if (f.status !== "all") n++;
  if (f.categories.length) n++;
  if (f.price !== "any") n++;
  if (f.distance !== "any") n++;
  if (f.minRating > 0) n++;
  return n;
}

const CATEGORY_OPTIONS: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: "salgado", label: "Salgado", icon: <Cookie size={18} /> },
  { id: "doce", label: "Doce", icon: <Cake size={18} /> },
  { id: "bebidas", label: "Bebidas", icon: <GlassWater size={18} /> },
  { id: "fitness", label: "Fitness", icon: <Salad size={18} /> },
];

export function FilterSheet({
  open,
  initial,
  onClose,
  onApply,
}: {
  open: boolean;
  initial: SnackFilters;
  onClose: () => void;
  onApply: (f: SnackFilters) => void;
}) {
  const [f, setF] = useState<SnackFilters>(initial);

  useEffect(() => {
    if (open) setF(initial);
  }, [open, initial]);

  if (!open) return null;

  const toggleCategory = (id: string) =>
    setF((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id],
    }));

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/55 backdrop-blur-sm sm:place-items-center sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl bg-surface text-surface-foreground shadow-modal sm:rounded-3xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-5 pt-5 pb-3">
          <h2 className="text-lg font-extrabold text-brand">Filtros</h2>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-surface-foreground"
          >
            ↩ voltar
          </button>
        </div>

        <div className="px-5 pb-5 space-y-5">
          {/* Status */}
          <section>
            <h3 className="mb-2 text-sm font-semibold">Status</h3>
            <div className="grid grid-cols-3 gap-2">
              <StatusChip
                active={f.status === "all"}
                onClick={() => setF({ ...f, status: "all" })}
                icon={<Eye size={16} />}
                label="Padrão"
                tone="neutral"
              />
              <StatusChip
                active={f.status === "open"}
                onClick={() => setF({ ...f, status: "open" })}
                icon={<CheckCircle2 size={16} />}
                label="Aberto"
                tone="open"
              />
              <StatusChip
                active={f.status === "closed"}
                onClick={() => setF({ ...f, status: "closed" })}
                icon={<XCircle size={16} />}
                label="Fechado"
                tone="closed"
              />
            </div>
          </section>

          {/* Categoria */}
          <section>
            <h3 className="mb-2 text-sm font-semibold">Categoria</h3>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORY_OPTIONS.map((c) => {
                const active = f.categories.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCategory(c.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-[11px] font-semibold transition ${
                      active
                        ? "border-brand bg-brand-soft text-surface-foreground"
                        : "border-border text-muted-foreground hover:border-brand/40"
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-full ${
                        active ? "bg-brand text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {c.icon}
                    </span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Preço */}
          <section>
            <h3 className="mb-2 text-sm font-semibold">Preço</h3>
            <div className="grid grid-cols-3 gap-2">
              {(["$", "$$", "$$$"] as const).map((p) => (
                <PillChip
                  key={p}
                  active={f.price === p}
                  onClick={() =>
                    setF({ ...f, price: f.price === p ? "any" : p })
                  }
                  label={p}
                />
              ))}
            </div>
          </section>

          {/* Distância */}
          <section>
            <h3 className="mb-2 text-sm font-semibold">Distância</h3>
            <div className="grid grid-cols-3 gap-2">
              {(["200m", "500m", "1km"] as const).map((d) => (
                <PillChip
                  key={d}
                  active={f.distance === d}
                  onClick={() =>
                    setF({ ...f, distance: f.distance === d ? "any" : d })
                  }
                  label={d}
                />
              ))}
            </div>
          </section>

          {/* Avaliação mínima */}
          <section>
            <h3 className="mb-2 text-sm font-semibold">Avaliação Mínima</h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() =>
                    setF({ ...f, minRating: f.minRating === n ? 0 : n })
                  }
                  className="p-1 transition active:scale-95"
                  aria-label={`${n} estrelas ou mais`}
                >
                  <Star
                    size={28}
                    className={
                      n <= f.minRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40"
                    }
                  />
                </button>
              ))}
              {f.minRating > 0 && (
                <span className="ml-2 text-xs font-semibold text-muted-foreground">
                  {f.minRating}+ estrelas
                </span>
              )}
            </div>
          </section>

          <div className="pt-2 space-y-2">
            <button
              onClick={() => onApply(f)}
              className="w-full rounded-2xl bg-[color:var(--accent)] py-3.5 text-sm font-extrabold text-primary-foreground shadow-glow transition active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}
            >
              Aplicar Filtros
            </button>
            <button
              onClick={() => onApply(EMPTY_FILTERS)}
              className="w-full rounded-2xl border-2 border-border py-3 text-sm font-semibold text-surface-foreground hover:border-brand/40"
            >
              Limpar Tudo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusChip({
  active,
  onClick,
  icon,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: "neutral" | "open" | "closed";
}) {
  const activeColors =
    tone === "open"
      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
      : tone === "closed"
        ? "border-rose-500 bg-rose-500/10 text-rose-700"
        : "border-brand bg-brand-soft text-surface-foreground";
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2.5 text-xs font-semibold transition ${
        active ? activeColors : "border-border text-muted-foreground hover:border-brand/40"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function PillChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 py-2.5 text-sm font-bold transition ${
        active
          ? "border-orange-500 bg-orange-500/10 text-orange-600"
          : "border-border text-surface-foreground hover:border-brand/40"
      }`}
    >
      {label}
    </button>
  );
}

/* ------------ filter helpers ------------ */

export function applyFilters<
  T extends {
    rating: number;
    categories: string[];
    menu_items: { price: number }[];
  },
>(list: T[], f: SnackFilters): T[] {
  return list.filter((s) => {
    if (f.status === "closed") return false; // we treat all snackbars as open
    if (f.minRating > 0 && s.rating < f.minRating) return false;
    if (f.categories.length) {
      const sc = (s.categories ?? []).map((x) => x.toLowerCase());
      if (!f.categories.some((c) => sc.includes(c.toLowerCase()))) return false;
    }
    if (f.price !== "any") {
      const avg =
        s.menu_items.length > 0
          ? s.menu_items.reduce((a, m) => a + m.price, 0) / s.menu_items.length
          : 0;
      const tier = avg <= 10 ? "$" : avg <= 25 ? "$$" : "$$$";
      if (tier !== f.price) return false;
    }
    // Distance is illustrative only — we have no geo data yet
    return true;
  });
}
