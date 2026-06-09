import { MapPin, Star, X } from "lucide-react";
import { useEffect } from "react";
import type { SnackBar } from "@/lib/auth";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80";

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = "none";
}

export function MenuPreview({
  snackbar,
  open,
  onClose,
}: {
  snackbar: SnackBar;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const accent = snackbar.accent_color || "#e85d75";
  const banner = snackbar.banner_url || snackbar.cover;
  const items = snackbar.menu_items.filter((m) => m.is_active);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative flex h-[92vh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[85vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Pré-visualização ao vivo
            </p>
            <p className="text-[11px] text-neutral-400">
              Como o cliente verá seu cardápio
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable phone-like content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Hero */}
          <div
            className="relative h-52 w-full bg-cover bg-center bg-neutral-200"
            style={{
              backgroundImage: `url(${banner}), url(${FALLBACK_COVER})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            {snackbar.logo_url && (
              <img
                src={snackbar.logo_url}
                alt=""
                onError={handleImgError}
                className="absolute bottom-3 left-4 h-14 w-14 rounded-xl border-2 border-white/30 object-cover shadow-lg"
              />
            )}
            <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-neutral-900 shadow-lg">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {snackbar.rating.toFixed(1)}
            </div>
          </div>

          <div className="-mt-6 rounded-t-3xl bg-white px-5 pb-8 pt-5 text-neutral-900">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {snackbar.name}
            </h1>
            <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
              <MapPin size={12} /> {snackbar.location}
            </p>
            {snackbar.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {snackbar.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      backgroundColor: `${accent}1a`,
                      color: accent,
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
            {snackbar.description && (
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                {snackbar.description}
              </p>
            )}

            <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-neutral-500">
              Menu {items.length > 0 && `· ${items.length}`}
            </h2>

            {items.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
                Nenhum item ativo no cardápio.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {items.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {m.name}
                      </p>
                      {m.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                          {m.description}
                        </p>
                      )}
                      <span
                        className="mt-2 inline-block rounded-full px-3 py-1 text-sm font-extrabold text-white"
                        style={{ backgroundColor: accent }}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
