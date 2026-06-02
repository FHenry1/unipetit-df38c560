import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Heart, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/snackbar/$id")({
  component: SnackBarDetail,
});

function SnackBarDetail() {
  const { id } = Route.useParams();
  const { snackbars, user, toggleFavorite } = useAuth();
  const s = snackbars.find((x) => x.id === id);
  const [tab, setTab] = useState<"menu" | "reviews" | "info">("menu");

  if (!s) {
    return (
      <div className="px-5 pt-8 text-sm text-muted-foreground">
        Lanchonete não encontrada.{" "}
        <Link to="/home" className="text-brand">
          Voltar
        </Link>
      </div>
    );
  }

  const isFav = user?.favorites.includes(s.id);

  return (
    <div>
      <div
        className="relative h-56 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${s.cover})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Link
          to="/home"
          className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-surface-foreground shadow"
        >
          <ArrowLeft size={16} />
        </Link>
        <button
          onClick={() => toggleFavorite(s.id)}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-surface-foreground shadow"
        >
          <Heart
            size={16}
            className={isFav ? "fill-current text-rose-500" : ""}
          />
        </button>
      </div>

      <div className="-mt-6 rounded-t-3xl bg-surface px-5 pb-6 pt-5 text-surface-foreground">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{s.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} /> {s.location}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold">
            <Star size={12} className="fill-current text-amber-500" />
            {s.rating.toFixed(1)}
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">{s.description}</p>

        <div className="mt-5 grid grid-cols-3 rounded-xl bg-muted p-1 text-xs font-semibold">
          {(["menu", "reviews", "info"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg py-2 transition ${
                tab === t
                  ? "bg-brand text-primary-foreground shadow"
                  : "text-muted-foreground"
              }`}
            >
              {t === "menu" ? "Menu" : t === "reviews" ? "Avaliações" : "Info"}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {tab === "menu" && (
            <ul className="space-y-3">
              {s.menu_items.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  Menu ainda não cadastrado.
                </li>
              )}
              {s.menu_items.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.description}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold">
                    R$ {m.price.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {tab === "reviews" && (
            <div className="space-y-3 text-sm">
              <Review name="Ana" rating={5} text="Atendimento ótimo, lanche delicioso!" />
              <Review name="Carlos" rating={4} text="Bom custo-benefício." />
            </div>
          )}
          {tab === "info" && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Clock size={14} /> Seg–Sáb: 11h às 23h
              </p>
              <p className="flex items-center gap-2">
                <MapPin size={14} /> {s.location}
              </p>
              <p>Categorias: {s.categories.join(", ") || "—"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Review({
  name,
  rating,
  text,
}: {
  name: string;
  rating: number;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between">
        <strong>{name}</strong>
        <span className="text-xs text-amber-500">{"⭐".repeat(rating)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
