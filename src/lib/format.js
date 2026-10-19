/** Philippine pesos: 120 -> "₱120", 135.5 -> "₱135.50" */
export function formatPrice(n) {
  const v = Number(n);
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(v);
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

export function formatReviewDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
