import { useRef } from 'react';
import ShopDetails from './ShopDetails';
import MiniSummary from './MiniSummary';
import NearbyList from './NearbyList';

/**
 * ONE <aside> that is two layouts, switched purely by Tailwind breakpoints:
 *
 *  < md  (mobile)   fixed bottom sheet. Slides up/down with translate-y, height = 50dvh (peek) or 88dvh (expanded).
 *  >= md (desktop)  static 420–450px sidebar on the left; the map fills the rest of the row.
 *
 * `md:` utilities override the mobile ones (position, height, transform, radius, background),
 * so no JS and no duplicated markup is needed to switch between the two.
 */
export default function DetailsPanel({ sheet, onSheetChange, shop, route, routeLoading, userPos, busy, onVisited, onClose, onRated, list, collapsed = false }) {
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
      aria-hidden={collapsed || undefined}
      inert={collapsed || undefined}
      className={`fixed inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-3xl bg-forest shadow-2xl transition-[height,transform] duration-300 ease-out ${height} ${
        open ? 'translate-y-0' : 'translate-y-full'
      } md:absolute md:inset-x-auto md:bottom-3 md:left-3 md:top-3 md:z-20 md:h-auto md:w-[var(--pw)] md:translate-y-0 md:rounded-3xl md:bg-cream md:shadow-[0_28px_70px_-14px_rgba(0,50,34,0.5)] md:ring-1 md:ring-white/70 md:transition-[transform,opacity] md:duration-[560ms] md:ease-[cubic-bezier(0.22,1,0.36,1)] md:will-change-transform ${
        collapsed ? 'md:pointer-events-none md:-translate-x-[calc(100%+1.5rem)] md:opacity-0' : 'md:translate-x-0 md:opacity-100'
      }`}
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
        // Desktop home: nearby cafés (the mobile sheet stays closed when nothing is selected)
        <div className="hidden min-h-0 flex-1 md:block">
          <NearbyList userPos={userPos} {...list} />
        </div>
      )}
    </aside>
  );
}
