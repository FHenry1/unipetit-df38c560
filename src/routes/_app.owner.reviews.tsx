import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownUp, MessageCircle, MessageCircleOff, Reply, Sparkles, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { OwnerHeader } from "@/components/OwnerHeader";
import { useAuth, type Review } from "@/lib/auth";

export const Route = createFileRoute("/_app/owner/reviews")({
  component: OwnerReviews,
});

type StarFilter = "all" | 5 | 4 | 3 | 2 | 1;
type ReplyFilter = "all" | "replied" | "unreplied";
type SortBy = "recent" | "rating-desc" | "rating-asc";

function OwnerReviews() {
  const { mySnackbar, reviews, replyToReview, markOwnerReviewsSeen } = useAuth();
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [starFilter, setStarFilter] = useState<StarFilter>("all");
  const [replyFilter, setReplyFilter] = useState<ReplyFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");

  const myReviews = useMemo(
    () => (mySnackbar ? reviews.filter((r) => r.snackbar_id === mySnackbar.id) : []),
    [reviews, mySnackbar],
  );

  const filteredReviews = useMemo(() => {
    let list = myReviews;
    if (starFilter !== "all") list = list.filter((r) => r.rating === starFilter);
    if (replyFilter === "replied") list = list.filter((r) => !!r.owner_reply);
    if (replyFilter === "unreplied") list = list.filter((r) => !r.owner_reply);
    const sorted = [...list];
    if (sortBy === "recent") {
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else if (sortBy === "rating-desc") {
      sorted.sort((a, b) => b.rating - a.rating);
    } else {
      sorted.sort((a, b) => a.rating - b.rating);
    }
    return sorted;
  }, [myReviews, starFilter, replyFilter, sortBy]);

  const unseenCount = myReviews.filter((r) => !r.owner_seen).length;
  const unrepliedCount = myReviews.filter((r) => !r.owner_reply).length;

  useEffect(() => {
    if (!mySnackbar || unseenCount === 0) return;
    const t = setTimeout(() => {
      markOwnerReviewsSeen();
    }, 1500);
    return () => clearTimeout(t);
  }, [mySnackbar, unseenCount, markOwnerReviewsSeen]);

  if (!mySnackbar) {
    return <div className="px-5 pt-10 text-sm text-neutral-400">Sem lanchonete.</div>;
  }

  const avg =
    myReviews.length > 0
      ? myReviews.reduce((a, r) => a + r.rating, 0) / myReviews.length
      : 0;

  const openReply = (r: Review) => {
    setReplyingId(r.id);
    setReplyDraft(r.owner_reply ?? "");
  };

  const submitReply = async () => {
    if (!replyingId) return;
    setSending(true);
    await replyToReview(replyingId, replyDraft);
    setSending(false);
    setReplyingId(null);
    setReplyDraft("");
  };

  return (
    <div className="pb-6">
      <OwnerHeader
        title="Avaliações"
        subtitle={`${myReviews.length} comentários${
          unseenCount > 0 ? ` · ${unseenCount} novos` : ""
        }`}
      />

      <div className="px-5 -mt-6 space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#5d0a1a] to-[#3a0612] p-5 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Média geral</p>
          <div className="mt-2 flex items-end gap-2">
            <p className="text-4xl font-extrabold">{avg.toFixed(1)}</p>
            <Stars value={Math.round(avg)} />
          </div>
          <p className="mt-1 text-[11px] text-white/60">
            {unrepliedCount > 0
              ? `${unrepliedCount} avaliação${unrepliedCount > 1 ? "ões" : ""} sem resposta`
              : "Tudo respondido — ótimo trabalho!"}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Chip active={starFilter === "all"} onClick={() => setStarFilter("all")}>
              Todas
            </Chip>
            {([5, 4, 3, 2, 1] as const).map((n) => (
              <Chip
                key={n}
                active={starFilter === n}
                onClick={() => setStarFilter(n)}
              >
                {n} <Star size={10} className="fill-amber-400 text-amber-400" />
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <Chip
              active={replyFilter === "all"}
              onClick={() => setReplyFilter("all")}
            >
              Todas
            </Chip>
            <Chip
              active={replyFilter === "unreplied"}
              onClick={() => setReplyFilter("unreplied")}
            >
              <MessageCircleOff size={11} /> Sem resposta
            </Chip>
            <Chip
              active={replyFilter === "replied"}
              onClick={() => setReplyFilter("replied")}
            >
              <MessageCircle size={11} /> Respondidas
            </Chip>
            <div className="ml-auto">
              <label className="flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] text-neutral-400">
                <ArrowDownUp size={11} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="bg-transparent text-white focus:outline-none"
                >
                  <option className="bg-neutral-900" value="recent">Mais recentes</option>
                  <option className="bg-neutral-900" value="rating-desc">Maior nota</option>
                  <option className="bg-neutral-900" value="rating-asc">Menor nota</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredReviews.length === 0 && (
            <div className="rounded-xl border border-dashed border-neutral-800 p-8 text-center text-xs text-neutral-500">
              {myReviews.length === 0
                ? "Nenhuma avaliação ainda."
                : "Nenhuma avaliação corresponde aos filtros."}
            </div>
          )}
          {filteredReviews.map((r) => {

            const isNew = !r.owner_seen;
            return (
              <article
                key={r.id}
                className={`rounded-2xl border p-4 transition ${
                  isNew
                    ? "bg-[#5d0a1a]/15 border-[#5d0a1a] shadow-[0_8px_24px_-12px_rgba(232,93,117,0.5)]"
                    : "bg-neutral-900 border-neutral-800"
                }`}
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#5d0a1a] text-white font-bold">
                      {r.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                        {r.user_name}
                        {isNew && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#e85d75] px-1.5 py-0.5 text-[9px] font-bold text-white">
                            <Sparkles size={9} /> NOVO
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <Stars value={r.rating} />
                </header>

                {r.comment && (
                  <p className="mt-3 text-sm text-white leading-relaxed">
                    {r.comment}
                  </p>
                )}

                {r.owner_reply && (
                  <div className="mt-3 rounded-xl border-l-2 border-[#e85d75] bg-neutral-950 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#e85d75] font-semibold">
                      Sua resposta
                    </p>
                    <p className="mt-1 text-sm text-white">{r.owner_reply}</p>
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => openReply(r)}
                    className="flex items-center gap-1 rounded-full border border-neutral-700 px-3 py-1 text-xs font-semibold text-neutral-300 hover:border-[#e85d75] hover:text-[#e85d75]"
                  >
                    <Reply size={12} />
                    {r.owner_reply ? "Editar resposta" : "Responder"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {replyingId && (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-black/60 sm:place-items-center sm:p-6"
          onClick={() => setReplyingId(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-neutral-900 border border-neutral-800 p-5 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Responder avaliação</h3>
              <button
                onClick={() => setReplyingId(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Agradeça o feedback ou explique como vai melhorar…"
              className="w-full resize-none rounded-lg bg-neutral-950 border border-neutral-800 p-3 text-sm text-white focus:border-[#e85d75] focus:outline-none"
            />
            <p className="mt-1 text-right text-[10px] text-neutral-500">
              {replyDraft.length}/500
            </p>
            <button
              onClick={submitReply}
              disabled={sending}
              className="mt-3 w-full rounded-xl bg-[#5d0a1a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {sending ? "Enviando…" : "Publicar resposta"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          className={n <= value ? "fill-amber-400 text-amber-400" : "text-neutral-700"}
        />
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
        active
          ? "border-[#e85d75] bg-[#5d0a1a] text-white"
          : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

