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
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${pill}`}>
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          Plotting your route…
        </span>
      </div>
    );
  }
  if (!route) return null;

  // Walking time from the real road distance (~4.8 km/h), matching the Google Maps walking directions.
  const walkS = route.distanceM / (80 / 60);
  const approx = route.approx ? '~' : '';
  return (
    <div className={wrapper}>
      {!route.approx && (
        <span className="rounded-full bg-mint px-3 py-1.5 text-xs font-bold text-white">✓ Route ready</span>
      )}
      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${pill}`}>
        🚶 {approx}
        {etaRange(walkS)} walk
      </span>
      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${pill}`}>
        📍 {approx}
        {formatDistance(route.distanceM)}
      </span>
      {route.approx && (
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${card ? 'bg-amber-100 text-amber-900' : 'bg-amber-300/20 text-amber-200'}`}>
          Straight-line preview — route service is busy
        </span>
      )}
    </div>
  );
}
