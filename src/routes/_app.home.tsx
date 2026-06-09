import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Star, Heart, Flame, X } from "lucide-react";
import { useAuth, type SnackBar } from "@/lib/auth";
import {
  EMPTY_FILTERS,
  FilterSheet,
  applyFilters,
  filtersActiveCount,
  type SnackFilters,
} from "@/components/FilterSheet";
import { useUserLocation, distanceKm, formatDistance } from "@/hooks/use-user-location";
import { isSnackbarOpen } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "Todos", emoji: "✨" },
  { id: "burger", label: "Hambúrguer", emoji: "🍔" },
  { id: "hotdog", label: "Hot Dog", emoji: "🌭" },
  { id: "pastel", label: "Pastel", emoji: "🥟" },
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "drinks", label: "Bebidas", emoji: "🥤" },
  { id: "sweets", label: "Doces", emoji: "🍩" },
];

export const Route = createFileRoute("/_app/home")({
  component: HomePage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function HomePage() {
  const { user, snackbars, toggleFavorite } = useAuth();
  const userPos = useUserLocation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [filters, setFilters] = useState<SnackFilters>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = snackbars.filter((s) => {
      if (category !== "all" && !s.categories.includes(category)) return false;
      if (q) {
        const hay = (s.name + " " + s.description + " " + s.location).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return applyFilters(list, filters);
  }, [snackbars, query, category, filters]);

  const featured = useMemo(
    () => [...snackbars].sort((a, b) => b.rating - a.rating).slice(0, 5),
    [snackbars],
  );

  const activeFiltersCount = filtersActiveCount(filters) + (category !== "all" ? 1 : 0);

  return (
    <div className="min-h-screen bg-white pb-6">
      {/* Banner */}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-brand px-5 pb-8 pt-10 text-primary-foreground">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">{greeting()},</p>
            <h1 className="text-2xl font-bold leading-tight">
              {user?.name.split(" ")[0] ?? "amigo"} 👋
            </h1>
          </div>
          <Link
            to="/profile"
            className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-base font-bold backdrop-blur transition active:scale-95"
          >
            {user?.name.charAt(0) ?? "U"}
          </Link>
        </div>

        <div className="relative mt-6 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white/95 px-4 py-3 text-sm text-foreground shadow-card">
            <Search size={16} className="text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar lanchonete ou prato..."
              className="flex-1 bg-transparent text-black placeholder:text-muted-foreground focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Limpar">
                <X size={14} className="text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur transition active:scale-95"
            aria-label="Filtros"
          >
            <SlidersHorizontal size={18} />
            {activeFiltersCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-[10px] font-bold text-[#5d0a1a]">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Categories */}
      <section className="mt-6 px-5">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => {
            const active = c.id === category;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-brand text-primary-foreground shadow-glow"
                    : "bg-neutral-100 text-neutral-700 shadow-card"
                }`}
              >
                <span className="text-base">{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured carousel */}
      {!query && category === "all" && featured.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between px-5">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-neutral-900">
              <Flame size={14} className="text-[#5d0a1a]" /> Em destaque
            </h2>
            <span className="text-xs text-neutral-500">Top da semana</span>
          </div>
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featured.map((s) => (
              <FeaturedCard
                key={s.id}
                s={s}
                isFav={!!user?.favorites.includes(s.id)}
                onFav={toggleFavorite}
                userPos={userPos}
              />
            ))}
          </div>
        </section>
      )}

      {/* List */}
      <section className="mt-6 px-5">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-bold text-neutral-900">
            {query || category !== "all" ? "Resultados" : "Para você"}
          </h2>
          <span className="text-xs text-neutral-500">
            {filtered.length} {filtered.length === 1 ? "lugar" : "lugares"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-neutral-50 p-8 text-center shadow-card">
            <p className="text-3xl">🔍</p>
            <p className="mt-2 text-sm font-medium text-neutral-800">Nada por aqui</p>
            <p className="mt-1 text-xs text-neutral-500">
              Tente ajustar os filtros ou a busca.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((s) => (
              <SnackCard
                key={s.id}
                s={s}
                isFav={!!user?.favorites.includes(s.id)}
                onFav={toggleFavorite}
                userPos={userPos}
              />
            ))}
          </div>
        )}
      </section>

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

function MetaRow({
  s,
  userPos,
}: {
  s: SnackBar;
  userPos: { lat: number; lng: number } | null;
}) {
  const open = isSnackbarOpen(s.opening_time, s.closing_time);
  const dist =
    userPos && s.lat != null && s.lng != null
      ? distanceKm(userPos.lat, userPos.lng, s.lat, s.lng)
      : null;
  if (open === null && dist === null) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
      {open !== null && (
        <span
          className={`inline-flex items-center gap-1 font-semibold ${
            open ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {open ? "Aberto" : "Fechado"}
        </span>
      )}
      {dist !== null && (
        <span className="text-neutral-500">📍 {formatDistance(dist)}</span>
      )}
    </div>
  );
}

function FeaturedCard({
  s,
  isFav,
  onFav,
  userPos,
}: {
  s: SnackBar;
  isFav: boolean;
  onFav: (id: string) => Promise<void>;
  userPos: { lat: number; lng: number } | null;
}) {
  const open = isSnackbarOpen(s.opening_time, s.closing_time);
  const dist =
    userPos && s.lat != null && s.lng != null
      ? distanceKm(userPos.lat, userPos.lng, s.lat, s.lng)
      : null;
  return (
    <Link
      to="/snackbar/$id"
      params={{ id: s.id }}
      className="group relative block w-64 shrink-0 overflow-hidden rounded-2xl shadow-card transition active:scale-[0.99]"
    >
      <div
        className="h-36 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${s.cover})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <button
        onClick={(e) => {
          e.preventDefault();
          void onFav(s.id);
        }}
        className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 backdrop-blur transition active:scale-90"
        aria-label="Favoritar"
      >
        <Heart size={14} className={isFav ? "fill-[#5d0a1a] text-[#5d0a1a]" : "text-muted-foreground"} />
      </button>
      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <div className="flex items-center gap-1 text-[11px] font-semibold">
          <Star size={11} className="fill-amber-400 text-amber-400" />
          {s.rating.toFixed(1)}
          {open !== null && (
            <span
              className={`ml-2 font-semibold ${
                open ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              ● {open ? "Aberto" : "Fechado"}
            </span>
          )}
          {dist !== null && (
            <span className="opacity-80">· {formatDistance(dist)}</span>
          )}
        </div>
        <h3 className="mt-0.5 text-sm font-bold leading-tight">{s.name}</h3>
      </div>
    </Link>
  );
}

function SnackCard({
  s,
  isFav,
  onFav,
  userPos,
}: {
  s: SnackBar;
  isFav: boolean;
  onFav: (id: string) => Promise<void>;
  userPos: { lat: number; lng: number } | null;
}) {
  return (
    <Link
      to="/snackbar/$id"
      params={{ id: s.id }}
      className="group relative flex overflow-hidden rounded-2xl bg-white text-neutral-900 shadow-card ring-1 ring-neutral-100 transition active:scale-[0.99] sm:flex-col"
    >
      <div
        className="h-24 w-28 shrink-0 bg-cover bg-center sm:h-32 sm:w-full"
        style={{ backgroundImage: `url(${s.cover})` }}
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          void onFav(s.id);
        }}
        className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 backdrop-blur transition active:scale-90"
        aria-label="Favoritar"
      >
        <Heart size={14} className={isFav ? "fill-[#5d0a1a] text-[#5d0a1a]" : "text-neutral-500"} />
      </button>
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-tight text-white">{s.name}</h3>
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold">
              <Star size={11} className="fill-amber-500 text-amber-500" />
              {s.rating.toFixed(1)}
            </div>
          </div>
          <MetaRow s={s} userPos={userPos} />
        </div>
      </div>
    </Link>
  );
}
