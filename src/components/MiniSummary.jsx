import { walkInfo } from './PickSignals';
import { formatDistance } from '../lib/format';
import { googleDirectionsUrl, haptic } from '../lib/links';

/**
 * Mobile-only compact "selected café" card. It appears the moment a pin is tapped — before the route
 * has been drawn — so people always know what they picked, what is happening, and what to do next.
 */
export default function MiniSummary({ shop, route, routeLoading, userPos, onDetails, onClose }) {
  const walk = walkInfo(shop, route, userPos);
  const hours = shop.hours;

  let routeState;
  if (routeLoading) {
    routeState = (
      <span className="inline-flex items-center gap-2 text-sm font-bold text-mint" role="status">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-mint border-t-transparent" aria-hidden="true" />
        Plotting your route…
      </span>
    );
  } else if (route && !route.approx) {
    routeState = <span className="text-sm font-bold text-mint">✓ Route ready on the map</span>;
  } else if (route) {
    routeState = <span className="text-sm font-bold text-amber-300">Straight-line preview · route service is busy</span>;
  }

  return (
    <div className="flex h-full flex-col px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 text-white">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-mint">Selected café</p>
          <h2 className="truncate text-xl font-extrabold leading-tight">{shop.name}</h2>
          <p className="truncate text-sm text-white/85">{shop.address}</p>
        </div>
        {shop.rating != null && (
          <span className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-sm font-bold shadow-lg shadow-accent/30">⭐ {shop.rating.toFixed(1)}</span>
        )}
        <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-base active:scale-90">
          ✕
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {walk && (
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
            🚶 {walk.approx ? '~' : ''}
            {formatDistance(walk.distanceM)} · {walk.approx ? '~' : ''}
            {walk.minutes} min
          </span>
        )}
        {hours && hours.openNow != null && (
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${hours.openNow ? 'bg-mint' : 'bg-red-500'}`}>
            {hours.openNow ? '🟢' : '🔴'} {hours.label}
          </span>
        )}
        {routeState}
      </div>

      <div className="mt-auto flex gap-3 pt-3">
        <a
          href={googleDirectionsUrl(shop)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => haptic(15)}
          className="flex min-h-[52px] flex-[1.3] items-center justify-center rounded-2xl bg-mint text-base font-extrabold text-white shadow-lg shadow-black/20 transition active:scale-95"
        >
          ➤ Directions
        </a>
        <button
          onClick={() => {
            haptic(10);
            onDetails();
          }}
          className="flex min-h-[52px] flex-1 items-center justify-center gap-1 rounded-2xl bg-white/15 text-base font-bold text-white ring-1 ring-white/25 transition active:scale-95"
        >
          Details <span aria-hidden="true" className="animate-bounce">⌃</span>
        </button>
      </div>
      <p className="pt-2 text-center text-[11px] font-medium text-white/70">Swipe up for menu, photos &amp; reviews</p>
    </div>
  );
}
