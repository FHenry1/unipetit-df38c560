/// <reference types="google.maps" />
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, Locate, Star, Loader2 } from "lucide-react";
import { useAuth, type SnackBar } from "@/lib/auth";
import { geocodeSnackbar } from "@/lib/maps.functions";

export const Route = createFileRoute("/_app/map")({
  component: MapPage,
});

declare global {
  interface Window {
    google?: typeof google;
    __initUnipetitMap?: () => void;
  }
}

const DEFAULT_CENTER = { lat: -23.5505, lng: -46.6333 }; // São Paulo fallback

function MapPage() {
  const { snackbars, refresh } = useAuth();
  const geocode = useServerFn(geocodeSnackbar);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  // Load Google Maps JS API once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.maps) {
      setReady(true);
      return;
    }
    const browserKey = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!browserKey) return;

    window.__initUnipetitMap = () => setReady(true);
    const existing = document.getElementById("gmaps-script");
    if (existing) return;
    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${browserKey}&loading=async&callback=__initUnipetitMap${channel ? `&channel=${channel}` : ""}`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Init map
  useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return;
    mapInstance.current = new window.google!.maps.Map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });
    infoRef.current = new window.google!.maps.InfoWindow();
  }, [ready]);

  // Geocode missing snackbars
  useEffect(() => {
    if (!ready) return;
    const missing = snackbars.filter((s) => s.lat == null || s.lng == null);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      setGeocoding(true);
      for (const s of missing) {
        if (cancelled) break;
        try {
          await geocode({ data: { id: s.id, address: s.location } });
        } catch (e) {
          console.warn("geocode failed", s.location, e);
        }
      }
      if (!cancelled) {
        await refresh();
        setGeocoding(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, snackbars, geocode, refresh]);

  // Render markers
  const placed = useMemo(
    () => snackbars.filter((s): s is SnackBar & { lat: number; lng: number } => s.lat != null && s.lng != null),
    [snackbars],
  );

  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (placed.length === 0) return;

    const bounds = new window.google!.maps.LatLngBounds();
    placed.forEach((s) => {
      const marker = new window.google!.maps.Marker({
        position: { lat: s.lat, lng: s.lng },
        map: mapInstance.current!,
        title: s.name,
        icon: {
          path: window.google!.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#5d0a1a",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => {
        setSelectedId(s.id);
        infoRef.current?.setContent(
          `<div style="font-family:system-ui;padding:4px 6px;min-width:160px">
            <div style="font-weight:600;font-size:13px;color:#111">${escapeHtml(s.name)}</div>
            <div style="font-size:11px;color:#666;margin-top:2px">⭐ ${s.rating.toFixed(1)} · ${escapeHtml(s.location)}</div>
          </div>`,
        );
        infoRef.current?.open({ map: mapInstance.current!, anchor: marker });
        mapInstance.current!.panTo({ lat: s.lat, lng: s.lng });
      });
      markersRef.current.push(marker);
      bounds.extend({ lat: s.lat, lng: s.lng });
    });
    if (!userPos) mapInstance.current.fitBounds(bounds, 60);
  }, [ready, placed, userPos]);

  const locateMe = () => {
    if (!navigator.geolocation || !mapInstance.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        mapInstance.current!.panTo(p);
        mapInstance.current!.setZoom(14);
        new window.google!.maps.Marker({
          position: p,
          map: mapInstance.current!,
          icon: {
            path: window.google!.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#3b82f6",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
      },
      (err) => console.warn(err),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const browserKey = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;

  return (
    <div className="pb-6">
      <header className="px-5 pt-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold">Mapa</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {placed.length} {placed.length === 1 ? "lanchonete" : "lanchonetes"} próximas
              {geocoding && " · localizando..."}
            </p>
          </div>
          <button
            onClick={locateMe}
            className="flex items-center gap-1.5 rounded-full bg-[#5d0a1a] px-3 py-2 text-xs font-semibold text-white shadow-md transition active:scale-95"
          >
            <Locate size={14} /> Minha posição
          </button>
        </div>
      </header>

      <div className="mt-4 px-5">
        <div className="relative h-[55vh] w-full overflow-hidden rounded-3xl bg-muted shadow-card">
          {!browserKey ? (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
              Chave do Google Maps não configurada.
            </div>
          ) : (
            <>
              <div ref={mapRef} className="h-full w-full" />
              {!ready && (
                <div className="absolute inset-0 grid place-items-center bg-muted/70">
                  <Loader2 className="animate-spin text-[#5d0a1a]" size={28} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <section className="mt-5 px-5">
        <h2 className="mb-2 text-sm font-bold">Lanchonetes</h2>
        <ul className="space-y-2">
          {snackbars.map((s) => {
            const active = s.id === selectedId;
            const has = s.lat != null && s.lng != null;
            return (
              <li
                key={s.id}
                className={`flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-card transition ${
                  active ? "ring-2 ring-[#5d0a1a]" : ""
                }`}
              >
                <button
                  onClick={() => {
                    if (!has || !mapInstance.current) return;
                    setSelectedId(s.id);
                    mapInstance.current.panTo({ lat: s.lat!, lng: s.lng! });
                    mapInstance.current.setZoom(15);
                    const marker = markersRef.current.find((m) => m.getTitle() === s.name);
                    if (marker) window.google!.maps.event.trigger(marker, "click");
                  }}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-[#5d0a1a]"
                  aria-label="Centralizar no mapa"
                >
                  <MapPin size={16} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.location}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold">
                  <Star size={11} className="fill-amber-500 text-amber-500" />
                  {s.rating.toFixed(1)}
                </span>
                <Link
                  to="/snackbar/$id"
                  params={{ id: s.id }}
                  className="rounded-full bg-[#5d0a1a] px-3 py-1.5 text-[11px] font-semibold text-white"
                >
                  Ver
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
