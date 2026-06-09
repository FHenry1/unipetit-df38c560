import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clock,
  Heart,
  MapPin,
  Share2,
  Star,
  Trash2,
  MessageCircle,
  Navigation,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth, type Review } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/snackbar/$id")({
  component: SnackBarDetail,
});

function SnackBarDetail() {
  const { id } = Route.useParams();
  const { snackbars, user, toggleFavorite, reviews, upsertReview, deleteReview } =
    useAuth();
  const s = snackbars.find((x) => x.id === id);
  const [tab, setTab] = useState<"menu" | "reviews" | "info">("menu");

  useEffect(() => {
    if (!id) return;
    void supabase.rpc("increment_snackbar_views", { _id: id });
  }, [id]);


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
  const activeMenu = s.menu_items.filter((m) => m.is_active !== false);

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: s.name, text: s.description, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado");
      }
    } catch {
      /* user cancel */
    }
  };

  return (
    <div className="pb-10">
      {/* Hero */}
      <div
        className="relative h-64 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${s.banner_url ?? s.cover})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
          <Link
            to="/home"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-surface-foreground shadow-md backdrop-blur transition hover:scale-105 active:scale-95"
            aria-label="Voltar"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex gap-2">
            <button
              onClick={onShare}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-surface-foreground shadow-md transition hover:scale-105 active:scale-95"
              aria-label="Compartilhar"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={() => toggleFavorite(s.id)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-surface-foreground shadow-md transition hover:scale-105 active:scale-95"
              aria-label="Favoritar"
            >
              <Heart
                size={16}
                className={
                  isFav
                    ? "scale-110 fill-current text-rose-500 transition-transform"
                    : "transition-transform"
                }
              />
            </button>
          </div>
        </div>

        {s.logo_url && (
          <img
            src={s.logo_url}
            alt={`Logo ${s.name}`}
            className="absolute bottom-3 left-4 h-14 w-14 rounded-xl border-2 border-white/20 object-cover shadow-lg"
          />
        )}

        {/* Floating rating chip */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-surface-foreground shadow-lg">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          {s.rating.toFixed(1)}
          <span className="ml-1 font-normal text-muted-foreground">
            ({snackReviews.length})
          </span>
        </div>
      </div>

      <div className="-mt-6 rounded-t-3xl bg-surface px-5 pb-6 pt-5 text-surface-foreground">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">{s.name}</h1>
        <p className="mt-1 flex items-center gap-1 text-xs text-white">
          <MapPin size={12} /> {s.location}
        </p>

        {s.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {s.categories.map((c) => (
              <span
                key={c}
                className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <p className="mt-4 text-sm leading-relaxed text-white">
          {s.description}
        </p>

        {/* Tabs */}
        <div className="sticky top-0 z-10 -mx-5 mt-5 bg-surface px-5 pb-1 pt-2">
          <div className="grid grid-cols-3 rounded-xl bg-muted p-1 text-xs font-semibold">
            {(["menu", "reviews", "info"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg py-2 transition ${
                  tab === t
                    ? "bg-brand text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-surface-foreground"
                }`}
              >
                {t === "menu"
                  ? `Menu${activeMenu.length ? ` · ${activeMenu.length}` : ""}`
                  : t === "reviews"
                    ? `Avaliações${snackReviews.length ? ` · ${snackReviews.length}` : ""}`
                    : "Info"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 animate-fade-in" key={tab}>
          {tab === "menu" && <MenuList items={activeMenu} accentColor={s.accent_color} />}
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
          {tab === "info" && <InfoTab snackbar={s} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- MENU ---------------- */

function MenuList({
  items,
  accentColor,
}: {
  items: ReturnType<typeof useAuth>["snackbars"][number]["menu_items"];
  accentColor: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Menu ainda não cadastrado.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((m, i) => (
        <li
          key={m.id}
          className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3.5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
          style={{ animation: `fade-in 0.3s ease-out ${i * 0.04}s both` }}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{m.name}</p>
            {m.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {m.description}
              </p>
            )}
            <span
              className="mt-2 inline-block rounded-full px-3 py-1 text-sm font-extrabold text-white"
              style={{ backgroundColor: accentColor }}
            >
              R$ {m.price.toFixed(2).replace(".", ",")}
            </span>
          </div>
          {m.image_url && (
            <img
              src={m.image_url}
              alt={m.name}
              className="h-20 w-20 shrink-0 rounded-xl object-cover"
            />
          )}
        </li>
      ))}
    </ul>
  );
}

/* ---------------- REVIEWS ---------------- */

function ReviewsTab({
  snackbarId,
  reviews,
  myReview,
  canReview,
  upsertReview,
  deleteReview,
}: {
  snackbarId: string;
  reviews: Review[];
  myReview?: Review;
  canReview: boolean;
  upsertReview: ReturnType<typeof useAuth>["upsertReview"];
  deleteReview: ReturnType<typeof useAuth>["deleteReview"];
}) {
  const [rating, setRating] = useState<number>(myReview?.rating ?? 0);
  const [comment, setComment] = useState<string>(myReview?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(!myReview);

  useEffect(() => {
    setRating(myReview?.rating ?? 0);
    setComment(myReview?.comment ?? "");
    setEditing(!myReview);
  }, [myReview?.id]);

  const distribution = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0]; // index 0 = 1 star
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) buckets[r.rating - 1] += 1;
    });
    const total = reviews.length || 1;
    return buckets.map((count, i) => ({
      stars: i + 1,
      count,
      pct: (count / total) * 100,
    })).reverse();
  }, [reviews]);

  const avg = reviews.length
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : 0;

  const otherReviews = reviews.filter((r) => r.id !== myReview?.id);

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
    toast.success("Avaliação publicada");
    setEditing(false);
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      {reviews.length > 0 && (
        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-surface-foreground">
                {avg.toFixed(1)}
              </p>
              <StarRow rating={Math.round(avg)} size={12} />
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {reviews.length} avaliação{reviews.length > 1 ? "es" : ""}
              </p>
            </div>
            <div className="flex-1 space-y-1">
              {distribution.map((d) => (
                <div key={d.stars} className="flex items-center gap-2">
                  <span className="w-3 text-[10px] font-semibold text-muted-foreground">
                    {d.stars}
                  </span>
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-[10px] text-muted-foreground">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* My review form */}
      {canReview && (
        <div className="rounded-2xl border border-brand/20 bg-brand-soft/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            {myReview ? "Sua avaliação" : "Avaliar essa lanchonete"}
          </p>

          {!editing && myReview ? (
            <div className="mt-2">
              <StarRow rating={myReview.rating} size={18} />
              {myReview.comment && (
                <p className="mt-2 text-sm text-white">{myReview.comment}</p>
              )}
              {myReview.owner_reply && (
                <OwnerReplyBlock
                  reply={myReview.owner_reply}
                  at={myReview.owner_reply_at}
                />
              )}
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
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              {error && (
                <p className="animate-fade-in text-xs text-rose-500">{error}</p>
              )}
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
                    className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 active:scale-95 disabled:opacity-70"
                  >
                    {saving ? "Salvando..." : myReview ? "Atualizar" : "Publicar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List */}
      {otherReviews.length === 0 && !myReview ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhuma avaliação ainda. Seja o primeiro!
        </p>
      ) : (
        <ul className="space-y-3">
          {otherReviews.map((r, i) => (
            <li
              key={r.id}
              className="rounded-xl border border-border bg-background p-3.5"
              style={{ animation: `fade-in 0.3s ease-out ${i * 0.04}s both` }}
            >
              <ReviewCard review={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const long = review.comment.length > 180;
  const shown = expanded || !long ? review.comment : review.comment.slice(0, 180) + "…";
  const when = review.created_at
    ? formatDistanceToNow(new Date(review.created_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : "";
  const initial = (review.user_name || "?").trim().charAt(0).toUpperCase();

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-primary-foreground">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{review.user_name}</p>
          <p className="text-[10px] text-white">{when}</p>
        </div>
        <StarRow rating={review.rating} size={12} />
      </div>
      {review.comment && (
        <p className="mt-2 text-sm text-white">
          {shown}{" "}
          {long && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs font-semibold text-brand hover:underline"
            >
              {expanded ? "ver menos" : "leia mais"}
            </button>
          )}
        </p>
      )}
      {review.owner_reply && (
        <OwnerReplyBlock reply={review.owner_reply} at={review.owner_reply_at} />
      )}
    </div>
  );
}

function OwnerReplyBlock({ reply, at }: { reply: string; at: string | null }) {
  const when = at
    ? formatDistanceToNow(new Date(at), { addSuffix: true, locale: ptBR })
    : "";
  return (
    <div className="mt-3 rounded-lg border-l-2 border-brand bg-brand-soft/60 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand">
        <MessageCircle size={10} /> Resposta do dono
        {when && (
          <span className="ml-auto font-normal text-muted-foreground">{when}</span>
        )}
      </p>
      <p className="mt-1 text-sm text-white">{reply}</p>
    </div>
  );
}

/* ---------------- INFO ---------------- */

function InfoTab({ snackbar }: { snackbar: ReturnType<typeof useAuth>["snackbars"][number] }) {
  const mapSrc =
    snackbar.lat != null && snackbar.lng != null
      ? `https://www.google.com/maps?q=${snackbar.lat},${snackbar.lng}&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent(snackbar.location)}&output=embed`;

  const hours =
    snackbar.opening_time && snackbar.closing_time
      ? [
          {
            d: "Todos os dias",
            h: `${snackbar.opening_time.slice(0, 5)} – ${snackbar.closing_time.slice(0, 5)}`,
          },
        ]
      : [
          { d: "Segunda – Sexta", h: "11h – 23h" },
          { d: "Sábado", h: "11h – 00h" },
          { d: "Domingo", h: "12h – 22h" },
        ];

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-2xl border border-border bg-background p-3.5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-brand">
            <Navigation size={14} />
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">
            {snackbar.location}
          </p>
        </div>
        <iframe
          title="Localização no mapa"
          className="mt-3 w-full h-56 rounded-2xl border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapSrc}
        />
      </div>


      <div className="rounded-xl border border-border bg-background p-3.5">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white">
          <Clock size={12} /> Horário de funcionamento
        </p>
        <ul className="mt-2 divide-y divide-border text-sm">
          {hours.map((h) => (
            <li key={h.d} className="flex items-center justify-between py-2">
              <span className="text-white">{h.d}</span>
              <span className="font-semibold text-white">{h.h}</span>
            </li>
          ))}
        </ul>
      </div>

      {snackbar.categories.length > 0 && (
        <div className="rounded-xl border border-border bg-background p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Categorias
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {snackbar.categories.map((c) => (
              <span
                key={c}
                className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Stars ---------------- */

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="transition hover:scale-110 active:scale-95"
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
        >
          <Star
            size={28}
            className={
              n <= display
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
