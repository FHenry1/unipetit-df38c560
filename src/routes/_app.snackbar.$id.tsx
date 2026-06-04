import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Heart, MapPin, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/snackbar/$id")({
  component: SnackBarDetail,
});

function SnackBarDetail() {
  const { id } = Route.useParams();
  const { snackbars, user, toggleFavorite, reviews, upsertReview, deleteReview } =
    useAuth();
  const s = snackbars.find((x) => x.id === id);
  const [tab, setTab] = useState<"menu" | "reviews" | "info">("menu");

  const snackReviews = useMemo(
    () => reviews.filter((r) => r.snackbar_id === id),
    [reviews, id],
  );
  const myReview = user ? snackReviews.find((r) => r.user_id === user.id) : undefined;

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
          <Heart size={16} className={isFav ? "fill-current text-rose-500" : ""} />
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
              {t === "menu"
                ? "Menu"
                : t === "reviews"
                  ? `Avaliações${snackReviews.length ? ` (${snackReviews.length})` : ""}`
                  : "Info"}
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
            <ReviewsTab
              snackbarId={s.id}
              reviews={snackReviews}
              myReview={myReview}
              canReview={!!user && user.id !== s.owner_id}
              upsertReview={upsertReview}
              deleteReview={deleteReview}
            />
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

function ReviewsTab({
  snackbarId,
  reviews,
  myReview,
  canReview,
  upsertReview,
  deleteReview,
}: {
  snackbarId: string;
  reviews: ReturnType<typeof useAuth>["reviews"];
  myReview?: ReturnType<typeof useAuth>["reviews"][number];
  canReview: boolean;
  upsertReview: ReturnType<typeof useAuth>["upsertReview"];
  deleteReview: ReturnType<typeof useAuth>["deleteReview"];
}) {
  const [rating, setRating] = useState<number>(myReview?.rating ?? 0);
  const [comment, setComment] = useState<string>(myReview?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(!myReview);

  const onSubmit = async () => {
    setError(null);
    if (rating < 1) {
      setError("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }
    setSaving(true);
    const res = await upsertReview(snackbarId, rating, comment);
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Não foi possível salvar.");
      return;
    }
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      {canReview && (
        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {myReview ? "Sua avaliação" : "Avaliar essa lanchonete"}
          </p>

          {!editing && myReview ? (
            <div className="mt-2">
              <StarRow rating={myReview.rating} size={18} />
              {myReview.comment && (
                <p className="mt-2 text-sm text-surface-foreground">
                  {myReview.comment}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-primary-foreground"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteReview(myReview.id)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-rose-500"
                  aria-label="Excluir avaliação"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              <StarPicker value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Conte como foi sua experiência (opcional)"
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
              />
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {comment.length}/500
                </span>
                <div className="flex gap-2">
                  {myReview && (
                    <button
                      onClick={() => {
                        setEditing(false);
                        setRating(myReview.rating);
                        setComment(myReview.comment);
                        setError(null);
                      }}
                      className="rounded-lg border border-border px-3 py-2 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={onSubmit}
                    disabled={saving}
                    className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-70"
                  >
                    {saving ? "Salvando..." : myReview ? "Atualizar" : "Publicar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma avaliação ainda. Seja o primeiro!
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <strong className="text-sm">{r.user_name}</strong>
                <StarRow rating={r.rating} size={12} />
              </div>
              {r.comment && (
                <p className="mt-1 text-xs text-muted-foreground">{r.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
        >
          <Star
            size={26}
            className={
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40"
            }
          />
        </button>
      ))}
    </div>
  );
}

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={
            n <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }
        />
      ))}
    </span>
  );
}
