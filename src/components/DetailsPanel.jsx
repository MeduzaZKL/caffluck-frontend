import { useRef } from 'react';
import ShopDetails from './ShopDetails';

/**
 * ONE <aside> that is two layouts, switched purely by Tailwind breakpoints:
 *
 *  < md  (mobile)   fixed bottom sheet. Slides up/down with translate-y, height = 50dvh (peek) or 88dvh (expanded).
 *  >= md (desktop)  static 420–450px sidebar on the left; the map fills the rest of the row.
 *
 * `md:` utilities override the mobile ones (position, height, transform, radius, background),
 * so no JS and no duplicated markup is needed to switch between the two.
 */
export default function DetailsPanel({ sheet, onSheetChange, shop, route, routeLoading, busy, onVisited, onClose, onRated }) {
  const touchY = useRef(null);
  const open = sheet !== 'closed';
  const height = sheet === 'expanded' ? 'h-[88dvh]' : 'h-[50dvh]';

  const toggle = () => onSheetChange(sheet === 'expanded' ? 'peek' : 'expanded');
  const onTouchEnd = (e) => {
    if (touchY.current == null) return;
    const dy = e.changedTouches[0].clientY - touchY.current;
    touchY.current = null;
    if (dy < -40) onSheetChange('expanded');
    else if (dy > 40) (sheet === 'expanded' ? onSheetChange('peek') : onClose());
  };

  return (
    <aside
      aria-label="Coffee shop details"
      className={`fixed inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-3xl bg-forest shadow-2xl transition-[height,transform] duration-300 ease-out ${height} ${
        open ? 'translate-y-0' : 'translate-y-full'
      } md:static md:z-10 md:h-full md:w-[420px] md:shrink-0 md:translate-y-0 md:rounded-none md:bg-cream md:shadow-xl lg:w-[450px]`}
    >
      {/* Drag handle — bottom sheet only */}
      <button
        onClick={toggle}
        onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
        onTouchEnd={onTouchEnd}
        aria-label={sheet === 'expanded' ? 'Collapse details' : 'Expand details'}
        className="flex w-full shrink-0 justify-center bg-forest pb-1.5 pt-3 md:hidden"
      >
        <span className="h-1.5 w-12 rounded-full bg-white/40" />
      </button>

      {shop ? (
        <div className="min-h-0 flex-1">
          <ShopDetails
            key={shop.id}
            shop={shop}
            route={route}
            routeLoading={routeLoading}
            busy={busy}
            onVisited={onVisited}
            onClose={onClose}
            onRated={onRated}
          />
        </div>
      ) : (
        // Desktop empty state (the mobile sheet is closed when nothing is selected)
        <div className="hidden flex-1 flex-col items-center justify-center gap-3 px-10 text-center md:flex">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-forest text-4xl shadow-lg">☕</div>
          <h2 className="text-2xl font-extrabold text-forest">Caffluck</h2>
          <p className="text-sm text-forest/70">
            Can't decide where to get coffee? Hit <strong>Randomize Me!</strong> or pick a pin on the map to see the
            menu and the route.
          </p>
        </div>
      )}
    </aside>
  );
}
