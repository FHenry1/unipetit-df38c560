import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import type { SnackBar } from "@/lib/auth";
import { useUserLocation } from "@/hooks/use-user-location";
import { distanceKm, formatDistance, isSnackbarOpen } from "@/lib/utils";

export function SnackBarCard({
  s,
  isFav,
  onFav,
}: {
  s: SnackBar;
  isFav?: boolean;
  onFav?: (id: string) => Promise<void>;
}) {
  const userPos = useUserLocation();
  const openState = isSnackbarOpen(s.opening_time, s.closing_time);
  const dist =
    userPos && s.lat != null && s.lng != null
      ? distanceKm(userPos.lat, userPos.lng, s.lat, s.lng)
      : null;

  return (
    <Link
      to="/snackbar/$id"
      params={{ id: s.id }}
      className="group relative block overflow-hidden rounded-2xl bg-surface text-surface-foreground shadow-card transition active:scale-[0.99]"
    >
      <div
        className="h-32 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${s.cover})` }}
      />
      {onFav && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onFav(s.id);
          }}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 backdrop-blur transition active:scale-90"
          aria-label="Favoritar"
        >
          <Heart
            size={14}
            className={isFav ? "fill-[#5d0a1a] text-[#5d0a1a]" : "text-muted-foreground"}
          />
        </button>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight">{s.name}</h3>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-surface-foreground">
            <Star size={11} className="fill-current text-amber-500" />
            {s.rating.toFixed(1)}
          </div>
        </div>
        {(openState !== null || dist !== null) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
            {openState === true && (
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700">
                ● Aberto
              </span>
            )}
            {openState === false && (
              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-700">
                ● Fechado
              </span>
            )}
            {dist !== null && (
              <span className="text-muted-foreground">📍 {formatDistance(dist)}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
