import { useRef } from 'react';
import ShopDetails from './ShopDetails';
import MiniSummary from './MiniSummary';

/**
 * ONE <aside> that is two layouts, switched purely by Tailwind breakpoints:
 *
 *  < md  (mobile)   fixed bottom sheet. Slides up/down with translate-y, height = 50dvh (peek) or 88dvh (expanded).
 *  >= md (desktop)  static 420–450px sidebar on the left; the map fills the rest of the row.
 *
 * `md:` utilities override the mobile ones (position, height, transform, radius, background),
 * so no JS and no duplicated markup is needed to switch between the two.
 */
export default function DetailsPanel({ sheet, onSheetChange, shop, route, routeLoading, userPos, busy, onVisited, onClose, onRated }) {
  const touchY = useRef(null);
  const open = sheet !== 'closed';
  const mini = sheet === 'mini';
  const height = sheet === 'expanded' ? 'h-[88dvh]' : mini ? 'h-[272px]' : 'h-[62dvh]';

  const toggle = () => onSheetChange(sheet === 'expanded' ? 'peek' : sheet === 'mini' ? 'peek' : 'expanded');
  const onTouchEnd = (e) => {
    if (touchY.current == null) return;
    const dy = e.changedTouches[0].clientY - touchY.current;
    touchY.current = null;
    if (dy < -40) onSheetChange(sheet === 'mini' ? 'peek' : 'expanded');
    else if (dy > 40) {
      if (sheet === 'expanded') onSheetChange('peek');
      else if (sheet === 'peek') onSheetChange('mini');
      else onClose();
    }
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
        className="flex h-9 w-full shrink-0 items-center justify-center bg-forest md:hidden"
      >
        <span className="h-1.5 w-14 rounded-full bg-white/60" />
      </button>

      {shop ? (
        <div className="min-h-0 flex-1">
          {mini && (
            <div className="h-full md:hidden">
              <MiniSummary
                shop={shop}
                route={route}
                routeLoading={routeLoading}
                userPos={userPos}
                onDetails={() => onSheetChange('peek')}
                onClose={onClose}
              />
            </div>
          )}
          <div className={`h-full ${mini ? 'max-md:hidden' : ''}`}>
          <ShopDetails
            key={shop.id}
            shop={shop}
            route={route}
            routeLoading={routeLoading}
            userPos={userPos}
            onExpand={() => onSheetChange('expanded')}
            busy={busy}
            onVisited={onVisited}
            onClose={onClose}
            onRated={onRated}
          />
          </div>
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
