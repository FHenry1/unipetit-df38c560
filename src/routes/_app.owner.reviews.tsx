import { createFileRoute } from "@tanstack/react-router";
import { Star, Sparkles } from "lucide-react";
import { OwnerHeader } from "@/components/OwnerHeader";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/owner/reviews")({
  component: OwnerReviews,
});

function OwnerReviews() {
  const { mySnackbar, reviews } = useAuth();
  if (!mySnackbar) {
    return <div className="px-5 pt-10 text-sm text-neutral-400">Sem lanchonete.</div>;
  }

  const myReviews = reviews.filter((r) => r.snackbar_id === mySnackbar.id);
  const avg =
    myReviews.length > 0
      ? myReviews.reduce((a, r) => a + r.rating, 0) / myReviews.length
      : 0;

  return (
    <div className="pb-6">
      <OwnerHeader
        title="Avaliações"
        subtitle={`${myReviews.length} comentários`}
      />

      <div className="px-5 -mt-6 space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#5d0a1a] to-[#3a0612] p-5 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
            Média geral
          </p>
          <div className="mt-2 flex items-end gap-2">
            <p className="text-4xl font-extrabold">{avg.toFixed(1)}</p>
            <Stars value={Math.round(avg)} />
          </div>
        </div>

        <div className="space-y-3">
          {myReviews.length === 0 && (
            <div className="rounded-xl border border-dashed border-neutral-800 p-8 text-center text-xs text-neutral-500">
              Nenhuma avaliação ainda.
            </div>
          )}
          {myReviews.map((r, idx) => (
            <article
              key={r.id}
              className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4"
            >
              <header className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#5d0a1a] text-white font-bold">
                    {r.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                      {r.user_name}
                      {idx === 0 && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#5d0a1a] px-1.5 py-0.5 text-[9px] font-bold text-white">
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
            </article>
          ))}
        </div>
      </div>
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
          className={
            n <= value
              ? "fill-amber-400 text-amber-400"
              : "text-neutral-700"
          }
        />
      ))}
    </div>
  );
}
