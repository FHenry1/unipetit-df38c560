import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Star, MapPin, Heart, Flame, X } from "lucide-react";
import { useAuth, type SnackBar } from "@/lib/auth";

const CATEGORIES = [
  { id: "all", label: "Todos", emoji: "✨" },
  { id: "burger", label: "Hambúrguer", emoji: "🍔" },
  { id: "hotdog", label: "Hot Dog", emoji: "🌭" },
  { id: "pastel", label: "Pastel", emoji: "🥟" },
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "drinks", label: "Bebidas", emoji: "🥤" },
  { id: "sweets", label: "Doces", emoji: "🍩" },
];

type SortKey = "rating" | "name";

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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("rating");
  const [minRating, setMinRating] = useState(0);
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = snackbars.filter((s) => {
      if (category !== "all" && !s.categories.includes(category)) return false;
      if (s.rating < minRating) return false;
      if (onlyFavs && !user?.favorites.includes(s.id)) return false;
      if (q) {
        const hay = (s.name + " " + s.description + " " + s.location).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) =>
      sort === "rating" ? b.rating - a.rating : a.name.localeCompare(b.name),
    );
    return list;
  }, [snackbars, query, category, sort, minRating, onlyFavs, user]);

  const featured = useMemo(
    () => [...snackbars].sort((a, b) => b.rating - a.rating).slice(0, 5),
    [snackbars],
  );

  const activeFiltersCount =
    (category !== "all" ? 1 : 0) + (minRating > 0 ? 1 : 0) + (onlyFavs ? 1 : 0) + (sort !== "rating" ? 1 : 0);

  return (
    <div className="pb-6 text-white [&_.text-muted-foreground]:text-white [&_.text-surface-foreground]:text-white">
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

        {/* Search + filter */}
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
            onClick={() => setFiltersOpen((v) => !v)}
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
                    : "bg-surface text-surface-foreground shadow-card"
                }`}
              >
                <span className="text-base">{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Advanced filters panel */}
      {filtersOpen && (
        <section className="mt-4 px-5 animate-fade-in">
          <div className="rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Filtros</h3>
              <button
                onClick={() => {
                  setCategory("all");
                  setSort("rating");
                  setMinRating(0);
                  setOnlyFavs(false);
                }}
                className="text-xs font-medium text-[#5d0a1a]"
              >
                Limpar
              </button>
            </div>

            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Ordenar por</p>
              <div className="flex gap-2">
                {(["rating", "name"] as SortKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setSort(k)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      sort === k
                        ? "bg-brand text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {k === "rating" ? "Melhor avaliados" : "A → Z"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Nota mínima: {minRating.toFixed(1)} ★
              </p>
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full accent-[#5d0a1a]"
              />
            </div>

            <label className="mt-4 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Heart size={14} className="text-[#5d0a1a]" /> Só favoritas
              </span>
              <input
                type="checkbox"
                checked={onlyFavs}
                onChange={(e) => setOnlyFavs(e.target.checked)}
                className="h-4 w-4 accent-[#5d0a1a]"
              />
            </label>
          </div>
        </section>
      )}

      {/* Featured carousel */}
      {!query && category === "all" && featured.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between px-5">
            <h2 className="flex items-center gap-1.5 text-sm font-bold">
              <Flame size={14} className="text-[#5d0a1a]" /> Em destaque
            </h2>
            <span className="text-xs text-muted-foreground">Top da semana</span>
          </div>
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featured.map((s) => (
              <FeaturedCard key={s.id} s={s} isFav={!!user?.favorites.includes(s.id)} onFav={toggleFavorite} />
            ))}
          </div>
        </section>
      )}

      {/* List */}
      <section className="mt-6 px-5">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-bold">
            {query || category !== "all" ? "Resultados" : "Para você"}
          </h2>
          <span className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "lugar" : "lugares"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
            <p className="text-3xl">🔍</p>
            <p className="mt-2 text-sm font-medium">Nada por aqui</p>
            <p className="mt-1 text-xs text-muted-foreground">
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
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FeaturedCard({
  s,
  isFav,
  onFav,
}: {
  s: SnackBar;
  isFav: boolean;
  onFav: (id: string) => Promise<void>;
}) {
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
          onFav(s.id);
        }}
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 backdrop-blur transition active:scale-90"
        aria-label="Favoritar"
      >
        <Heart size={14} className={isFav ? "fill-[#5d0a1a] text-[#5d0a1a]" : "text-muted-foreground"} />
      </button>
      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <div className="flex items-center gap-1 text-[11px] font-semibold">
          <Star size={11} className="fill-amber-400 text-amber-400" />
          {s.rating.toFixed(1)}
          <span className="opacity-70">· {s.location}</span>
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
}: {
  s: SnackBar;
  isFav: boolean;
  onFav: (id: string) => Promise<void>;
}) {
  return (
    <Link
      to="/snackbar/$id"
      params={{ id: s.id }}
      className="group relative flex overflow-hidden rounded-2xl bg-surface text-surface-foreground shadow-card transition active:scale-[0.99] sm:flex-col"
    >
      <div
        className="h-24 w-28 shrink-0 bg-cover bg-center sm:h-32 sm:w-full"
        style={{ backgroundImage: `url(${s.cover})` }}
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          onFav(s.id);
        }}
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 backdrop-blur transition active:scale-90"
        aria-label="Favoritar"
      >
        <Heart size={14} className={isFav ? "fill-[#5d0a1a] text-[#5d0a1a]" : "text-muted-foreground"} />
      </button>
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-tight">{s.name}</h3>
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold">
              <Star size={11} className="fill-amber-500 text-amber-500" />
              {s.rating.toFixed(1)}
            </div>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin size={10} /> {s.location}
        </p>
      </div>
    </Link>
  );
}
