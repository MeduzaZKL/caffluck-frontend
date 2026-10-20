/**
 * A persistent status card (not a disappearing toast) for empty and error states.
 * kind: 'empty' | 'busy' | 'error'. Always offers a Retry button so nothing fails silently.
 */
const COPY = {
  empty: { icon: '🔍', title: 'No cafés found nearby', body: 'We couldn’t find any cafés in this area on OpenStreetMap. Try moving the map and using “Search this area”.' },
  busy: { icon: '⏳', title: 'Café data is busy', body: 'The free map-data service is slow right now. Give it a moment and try again.' },
  nomatch: { icon: '🎛️', title: 'No café matches your filters', body: 'There are cafés nearby, but none fit every filter you picked. Loosen a filter and roll again.', action: '✕ Clear filters' },
  error: { icon: '📡', title: 'API unavailable — try again', body: 'We couldn’t reach the Caffluck server. Check your connection, then retry. The first request after a while can take up to a minute.' },
};

export default function StatusNotice({ kind, onRetry, onDismiss, retrying = false }) {
  const c = COPY[kind] ?? COPY.error;
  return (
    <div role="alert" className="pointer-events-auto w-full rounded-2xl bg-crisp p-4 shadow-xl ring-1 ring-forest/10 md:max-w-sm">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">{c.icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold text-forest">{c.title}</h2>
          <p className="mt-0.5 text-xs text-forest/80">{c.body}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} aria-label="Dismiss" className="flex h-10 w-10 items-center justify-center rounded-full text-forest/60 hover:text-forest active:scale-90">✕</button>
        )}
      </div>
      <button
        onClick={onRetry}
        disabled={retrying}
        className="mt-3 w-full min-h-[48px] rounded-xl bg-forest py-2.5 text-sm font-bold text-white transition hover:bg-forest/90 active:scale-95 disabled:opacity-60"
      >
        {retrying ? 'Working…' : (c.action ?? '↻ Retry')}
      </button>
    </div>
  );
}
