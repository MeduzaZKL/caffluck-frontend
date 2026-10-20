import { googleListingUrl, haptic } from '../lib/links';

/**
 * "Check before you go" notice. Opening hours come from OpenStreetMap volunteers, so a café can be closed
 * (or gone) even when the data says otherwise. This nudges people to confirm on Google Maps first.
 * The tone gets stronger when the café is listed as closed or has no hours at all.
 */
export default function OpenWarning({ shop }) {
  const hours = shop.hours;
  const loaded = hours !== undefined; // hours arrive with the full café details
  const closed = hours?.openNow === false;
  const unknown = loaded && (!hours || hours.openNow == null);

  let title = 'Check before you go';
  let body = 'Hours, names and locations come from OpenStreetMap volunteers — a café may have closed, moved or been renamed. Confirm on Google Maps first.';
  let tone = 'bg-amber-50 text-amber-950 ring-amber-300';
  let icon = '⚠️';
  if (closed) {
    title = 'Listed as closed right now';
    body = 'OpenStreetMap shows this café as closed (it may also have closed for good or changed its name). Check Google Maps before you head out.';
    tone = 'bg-red-50 text-red-950 ring-red-300';
    icon = '🔴';
  } else if (unknown) {
    title = 'Opening hours not listed';
    body = 'We can’t tell if this café is open, and it may have been renamed. Check Google Maps before you go.';
  }

  return (
    <section role="note" aria-label="Check opening hours" className={`mx-5 mb-3 flex items-center gap-3 rounded-2xl p-3 ring-1 ${tone}`}>
      <span className="text-xl leading-none" aria-hidden="true">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold leading-tight">{title}</p>
        <p className="mt-0.5 text-xs font-medium leading-snug opacity-90 max-md:hidden">{body}</p>
        <p className="mt-0.5 text-xs font-medium leading-snug opacity-90 md:hidden">May be closed or renamed. Confirm on Google Maps first.</p>
      </div>
      <a
        href={googleListingUrl(shop)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => haptic(10)}
        className="flex min-h-[44px] shrink-0 items-center rounded-xl bg-forest px-3 text-xs font-bold text-white transition active:scale-95"
      >
        🗺️ Check
      </a>
    </section>
  );
}
