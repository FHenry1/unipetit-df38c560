import { createFileRoute } from "@tanstack/react-router";
import { Reply, Sparkles, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { OwnerHeader } from "@/components/OwnerHeader";
import { useAuth, type Review } from "@/lib/auth";

export const Route = createFileRoute("/_app/owner/reviews")({
  component: OwnerReviews,
});

function OwnerReviews() {
  const { mySnackbar, reviews, replyToReview, markOwnerReviewsSeen } = useAuth();
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [sending, setSending] = useState(false);

  const myReviews = useMemo(
    () => (mySnackbar ? reviews.filter((r) => r.snackbar_id === mySnackbar.id) : []),
    [reviews, mySnackbar],
  );
  const unseenCount = myReviews.filter((r) => !r.owner_seen).length;

  // Mark all as seen after a short delay (gives the "NEW" badge time to be visible)
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
            Atualizada automaticamente a cada avaliação
          </p>
        </div>

        <div className="space-y-3">
          {myReviews.length === 0 && (
            <div className="rounded-xl border border-dashed border-neutral-800 p-8 text-center text-xs text-neutral-500">
              Nenhuma avaliação ainda.
            </div>
          )}
          {myReviews.map((r) => {
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
                  <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
                    {r.comment}
                  </p>
                )}

                {r.owner_reply && (
                  <div className="mt-3 rounded-xl border-l-2 border-[#e85d75] bg-neutral-950 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#e85d75] font-semibold">
                      Sua resposta
                    </p>
                    <p className="mt-1 text-sm text-neutral-200">{r.owner_reply}</p>
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
