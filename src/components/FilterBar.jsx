import { WALK_OPTIONS, FEATURE_FILTERS, activeFilterCount } from '../lib/filters';

const chip =
  'pointer-events-auto inline-flex shrink-0 items-center gap-1 whitespace-nowrap min-h-[44px] rounded-full px-4 py-2 text-[13px] font-bold shadow-md ring-1 transition active:scale-95 md:min-h-0 md:px-3.5 md:text-xs';
const off = 'bg-crisp text-forest ring-forest/20 hover:bg-cream';
const on = 'bg-forest text-white ring-forest';

/**
 * A small premium filter bar. Filters narrow both the map pins and "Randomize Me!".
 * Only things backed by real data: walking time, open now, OpenStreetMap vibe tags, and visited.
 */
export default function FilterBar({ filters, onChange, matching, total }) {
  const count = activeFilterCount(filters);
  const set = (patch) => onChange({ ...filters, ...patch });
  const toggleFeature = (key) =>
    set({ features: filters.features.includes(key) ? filters.features.filter((k) => k !== key) : [...filters.features, key] });

  return (
    <div role="group" aria-label="Filters" className="no-scrollbar pointer-events-auto flex w-full min-w-0 items-center gap-2 overflow-x-auto py-1 pr-2 md:flex-wrap md:overflow-visible">
      <label className={`${chip} ${filters.maxWalkMin ? on : off} relative cursor-pointer`}>
        <span aria-hidden="true">🚶</span>
        <span>{filters.maxWalkMin ? `Under ${filters.maxWalkMin} min` : 'Any distance'}</span>
        <span aria-hidden="true" className="opacity-60">▾</span>
        <select
          aria-label="Maximum walking time"
          value={filters.maxWalkMin ?? ''}
          onChange={(e) => set({ maxWalkMin: e.target.value ? Number(e.target.value) : null })}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          <option value="">Any distance</option>
          {WALK_OPTIONS.map((m) => (
            <option key={m} value={m}>
              Under {m} min walk
            </option>
          ))}
        </select>
      </label>

      <button aria-pressed={filters.openNow} onClick={() => set({ openNow: !filters.openNow })} className={`${chip} ${filters.openNow ? on : off}`}>
        🟢 Open now
      </button>

      {FEATURE_FILTERS.map((f) => (
        <button key={f.key} aria-pressed={filters.features.includes(f.key)} onClick={() => toggleFeature(f.key)} className={`${chip} ${filters.features.includes(f.key) ? on : off}`}>
          <span aria-hidden="true">{f.emoji}</span> {f.label}
        </button>
      ))}

      <button aria-pressed={filters.hideVisited} onClick={() => set({ hideVisited: !filters.hideVisited })} className={`${chip} ${filters.hideVisited ? on : off}`}>
        🙈 Hide visited
      </button>

      {count > 0 && (
        <>
          <span className={`${chip} bg-mint text-white ring-mint`} role="status">
            {matching} of {total} match
          </span>
          <button onClick={() => onChange({ maxWalkMin: null, openNow: false, hideVisited: false, features: [] })} className={`${chip} ${off}`}>
            ✕ Clear
          </button>
        </>
      )}
    </div>
  );
}
