import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns true if the snackbar is currently open, false if closed, or null
 * when opening/closing time is not defined.
 */
export function isSnackbarOpen(
  opening: string | null,
  closing: string | null,
): boolean | null {
  if (!opening || !closing) return null;
  const [oh, om] = opening.split(":").map(Number);
  const [ch, cm] = closing.split(":").map(Number);
  if (
    Number.isNaN(oh) ||
    Number.isNaN(om) ||
    Number.isNaN(ch) ||
    Number.isNaN(cm)
  )
    return null;
  const now = new Date();
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (closeMin > openMin) return nowMin >= openMin && nowMin < closeMin;
  return nowMin >= openMin || nowMin < closeMin; // crosses midnight
}

/** Great-circle distance in kilometers (Haversine). */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Human-friendly distance label (e.g. "230 m" or "1.4 km"). */
export function formatDistance(km: number): string {
  return km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`;
}
