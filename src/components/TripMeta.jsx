import { etaRange, formatDistance } from '../lib/format';

/**
 * Travel metrics for the active route.
 *  variant="card"   -> floating white card (mobile, top of the map)
 *  variant="inline" -> translucent pills for the dark sidebar header (desktop)
 */
export default function TripMeta({ route, loading, variant = 'card' }) {
  const card = variant === 'card';
  const pill = card ? 'bg-mint/10 text-forest' : 'bg-white/10 text-white';
  const wrapper = card
    ? 'flex flex-wrap items-center gap-2 rounded-2xl bg-crisp/95 px-3 py-2.5 shadow-lg backdrop-blur'
    : 'flex flex-wrap items-center gap-2';

  if (loading) {
    return (
      <div className={wrapper} role="status">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pill}`}>Calculating route…</span>
      </div>
    );
  }
  if (!route) return null;

  const approx = route.approx ? '~' : '';
  return (
    <div className={wrapper}>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pill}`}>
        ⏱ Estimated Time: {approx}
        {etaRange(route.durationS)}
      </span>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pill}`}>
        📍 {approx}
        {formatDistance(route.distanceM)}
      </span>
      {route.approx && (
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${card ? 'text-forest/60' : 'text-white/60'}`}>
          straight-line estimate
        </span>
      )}
    </div>
  );
}
