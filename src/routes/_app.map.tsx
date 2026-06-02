import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/map")({
  component: MapPage,
});

function MapPage() {
  const { snackbars } = useAuth();
  return (
    <div className="px-5 pt-8">
      <h1 className="text-xl font-bold">Mapa</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Visualização simulada das lanchonetes próximas
      </p>

      <div className="mt-5 overflow-hidden rounded-3xl bg-surface text-surface-foreground shadow-card">
        <div
          className="relative h-64 w-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80)",
          }}
        >
          <div className="absolute inset-0 bg-brand-soft" />
          {snackbars.slice(0, 4).map((s, i) => (
            <div
              key={s.id}
              className="absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-white shadow-glow"
              style={{
                top: `${20 + (i % 2) * 40}%`,
                left: `${20 + i * 18}%`,
              }}
            >
              <MapPin size={16} />
            </div>
          ))}
        </div>
        <ul className="divide-y divide-border">
          {snackbars.map((s) => (
            <li key={s.id} className="flex items-center gap-3 p-3">
              <MapPin size={16} className="text-brand" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.location}
                </p>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                ⭐ {s.rating.toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
