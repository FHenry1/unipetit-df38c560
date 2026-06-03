import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { SnackBar } from "@/lib/auth";

export function SnackBarCard({ s }: { s: SnackBar }) {
  return (
    <Link
      to="/snackbar/$id"
      params={{ id: s.id }}
      className="group block overflow-hidden rounded-2xl bg-surface text-surface-foreground shadow-card transition active:scale-[0.99]"
    >
      <div
        className="h-32 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${s.cover})` }}
      />
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight">{s.name}</h3>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-surface-foreground">
            <Star size={11} className="fill-current text-amber-500" />
            {s.rating.toFixed(1)}
          </div>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {s.description}
        </p>
      </div>
    </Link>
  );
}
