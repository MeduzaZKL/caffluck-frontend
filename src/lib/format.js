/** 5.8 -> "$5.8", 6 -> "$6.0", 6.35 -> "$6.35" */
export function formatPrice(n) {
  const s = Number(n).toFixed(2);
  return `$${s.endsWith('0') ? s.slice(0, -1) : s}`;
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Turns a duration into a friendly range, e.g. 420 s -> "6–9 min". */
export function etaRange(seconds) {
  const m = Math.max(1, Math.round(seconds / 60));
  const lo = Math.max(1, Math.round(m * 0.8));
  const hi = Math.max(lo + 1, Math.round(m * 1.25));
  return `${lo}–${hi} min`;
}
