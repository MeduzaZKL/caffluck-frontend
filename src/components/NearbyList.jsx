import { useMemo } from 'react';
import { haversine } from '../lib/routing';
import { formatDistance } from '../lib/format';

const WALK_M_PER_MIN = 80;

function Row({ shop, userPos, onPick, onHover }) {
  const d = haversine(userPos, { lat: shop.lat, lng: shop.lng });
  const minutes = Math.max(1, Math.round((d * 1.25) / WALK_M_PER_MIN));
  const feats = (shop.features ?? []).slice(0, 4);
  return (
    <li>
      <button
        onClick={() => onPick(shop.id)}
        onMouseEnter={() => onHover(shop.id)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(shop.id)}
        onBlur={() => onHover(null)}
        className={`group w-full rounded-2xl bg-crisp p-4 text-left shadow-sm ring-1 ring-forest/10 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-mint/60 focus-visible:ring-2 focus-visible:ring-mint ${
          shop.visited ? 'opacity-70' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-extrabold text-forest group-hover:text-forest">{shop.name}</h3>
            <p className="truncate text-xs text-forest/75">{shop.address}</p>
          </div>
          {shop.rating != null && (
            <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white">⭐ {shop.rating.toFixed(1)}</span>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold text-forest">
            🚶 {formatDistance(d)} · ~{minutes} min
          </span>
          {shop.openNow === true && <span className="rounded-full bg-mint px-2.5 py-1 text-[11px] font-bold text-white">Open now</span>}
          {shop.openNow === false && <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">Closed</span>}
          {shop.visited && <span className="rounded-full bg-forest/10 px-2.5 py-1 text-[11px] font-bold text-forest">✓ Visited</span>}
          {feats.map((f) => (
            <span key={f.key} title={f.label} className="rounded-full bg-cream px-2 py-1 text-[11px]" aria-label={f.label}>
              {f.emoji}
            </span>
          ))}
        </div>
      </button>
    </li>
  );
}

/**
 * Desktop sidebar home: shows what is around you (closest first) so the dashboard is useful before anything is
 * selected. Hovering a card highlights its pin on the map; clicking opens it. Real data only.
 */
export default function NearbyList({ shops, userPos, loading, filtersOn, totalCount, visitedCount, rolling, onRoll, onPick, onHover, onClearFilters }) {
  const sorted = useMemo(
    () =>
      [...shops]
        .map((s) => ({ s, d: haversine(userPos, { lat: s.lat, lng: s.lng }) }))
        .sort((a, b) => a.d - b.d)
        .map((x) => x.s),
    [shops, userPos],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 bg-forest px-6 pb-6 pt-7 text-white">
        <div className="flex items-center gap-3">
          <img src="/logo-mark-on-dark.svg" alt="" className="h-14 w-auto drop-shadow-lg" draggable="false" />
          <img src="/logo-wordmark-on-dark.svg" alt="Caffluck" className="h-9 w-auto" draggable="false" />
        </div>
        <p className="mt-2 text-sm text-white/85">Can’t decide where to sip? Let fate pick.</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-2xl font-extrabold leading-none">{loading ? '…' : totalCount}</p>
            <p className="mt-1 text-xs font-semibold text-white/80">cafés nearby</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-2xl font-extrabold leading-none">{visitedCount}</p>
            <p className="mt-1 text-xs font-semibold text-white/80">already visited</p>
          </div>
        </div>

        <button
          onClick={onRoll}
          disabled={rolling}
          className={`mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-mint text-base font-extrabold text-white shadow-lg shadow-black/25 transition hover:brightness-105 active:scale-[0.98] ${
            rolling ? 'caff-cta-rolling' : ''
          }`}
        >
          <span className={rolling ? 'animate-spin' : ''}>🎲</span>
          {rolling ? 'Rolling…' : 'Randomize Me!'}
          {!rolling && <kbd className="ml-1 rounded-md bg-black/20 px-1.5 py-0.5 text-[11px] font-bold">R</kbd>}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-6 pb-2 pt-5">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-forest/75">Closest first</h2>
          <span className="text-xs font-semibold text-forest/75">
            {filtersOn ? `${shops.length} match your filters` : `${shops.length} shown`}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
          {loading && shops.length === 0 ? (
            <ul className="space-y-3" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="h-[92px] animate-pulse rounded-2xl bg-crisp/70" />
              ))}
            </ul>
          ) : sorted.length === 0 ? (
            <div className="mx-2 mt-4 rounded-2xl bg-crisp p-6 text-center shadow-sm">
              <p className="text-3xl" aria-hidden="true">{filtersOn ? '🎛️' : '🔍'}</p>
              <h3 className="mt-2 text-sm font-extrabold text-forest">{filtersOn ? 'No café matches your filters' : 'No cafés found here yet'}</h3>
              <p className="mt-1 text-xs text-forest/75">
                {filtersOn ? 'Loosen a filter to see more.' : 'Move the map and use “Search this area”.'}
              </p>
              {filtersOn && (
                <button onClick={onClearFilters} className="mt-3 min-h-[44px] rounded-xl bg-forest px-4 text-sm font-bold text-white active:scale-95">
                  ✕ Clear filters
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-3 px-0.5 pt-0.5">
              {sorted.map((s) => (
                <Row key={s.id} shop={s} userPos={userPos} onPick={onPick} onHover={onHover} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
