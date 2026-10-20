import { haversine } from '../lib/routing';
import { formatDistance, formatPrice } from '../lib/format';

const WALK_M_PER_MIN = 80; // ~4.8 km/h

/** Walking distance + minutes. Uses the real road route when we have one, else a padded straight line. */
export function walkInfo(shop, route, userPos) {
  if (route && !route.approx && route.distanceM > 0) {
    return { distanceM: route.distanceM, minutes: Math.max(1, Math.round(route.distanceM / WALK_M_PER_MIN)), approx: false };
  }
  if (!userPos) return null;
  const d = haversine(userPos, { lat: shop.lat, lng: shop.lng });
  return { distanceM: d, minutes: Math.max(1, Math.round((d * 1.25) / WALK_M_PER_MIN)), approx: true };
}

const pill = 'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold';
const neutral = `${pill} bg-white/15 text-white md:bg-crisp md:text-forest md:shadow-sm`;

/**
 * One scannable row that answers "is this a good pick?": distance + walking time, open/closed,
 * price level, rating, and the vibe tags. Every chip is real data; a chip with no data is simply not shown.
 */
export default function PickSignals({ shop, route, userPos, onRate }) {
  const walk = walkInfo(shop, route, userPos);
  const detailLoaded = shop.hours !== undefined; // hours/features/price arrive with the full detail
  const hours = shop.hours;

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3" aria-label="Quick facts">
      {walk && (
        <span className={neutral}>
          <span aria-hidden="true">🚶</span>
          {walk.approx ? '~' : ''}
          {formatDistance(walk.distanceM)} · {walk.approx ? '~' : ''}
          {walk.minutes} min walk
        </span>
      )}

      {detailLoaded &&
        (hours && hours.openNow != null ? (
          <span className={`${pill} ${hours.openNow ? 'bg-mint text-white' : 'bg-red-500 text-white'}`}>
            <span aria-hidden="true">{hours.openNow ? '🟢' : '🔴'}</span>
            {hours.label}
          </span>
        ) : (
          <span className={`${neutral} opacity-80`}>🕒 Hours not listed</span>
        ))}

      {/* The numeric rating already shows as the orange badge in the header; here we only invite the first one. */}
      {shop.rating == null && detailLoaded && (
        <button onClick={onRate} className={`${neutral} underline decoration-dotted underline-offset-2`}>
          ★ No ratings yet · be the first
        </button>
      )}

      {shop.price && (
        <span className={neutral} title={shop.price.label}>
          <span className="text-mint md:text-mint">{shop.price.symbols}</span>
          <span className="opacity-70">{'₱'.repeat(3 - shop.price.level)}</span>
          <span className="font-semibold opacity-90">· drinks ~{formatPrice(shop.price.avgDrink)}</span>
        </span>
      )}

      {(shop.features ?? []).map((f) => (
        <span key={f.key} className={neutral}>
          <span aria-hidden="true">{f.emoji}</span>
          {f.label}
        </span>
      ))}
    </div>
  );
}
