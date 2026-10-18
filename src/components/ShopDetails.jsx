import { useMemo, useState } from 'react';
import RatingBadge from './RatingBadge';
import TripMeta from './TripMeta';
import CategoryChips from './CategoryChips';
import MenuCard from './MenuCard';
import OrderModal from './OrderModal';
import PhotoLightbox from './PhotoLightbox';
import { formatPrice } from '../lib/format';

const CATEGORIES = [
  { key: 'beverage', label: 'Beverages', emoji: '☕' },
  { key: 'food', label: 'Foods', emoji: '🍰' },
];

/**
 * Everything inside the details panel: header profile, category chips, menu grid, action bar.
 * Rendered with key={shop.id} by the parent, so the cart resets whenever the shop changes.
 */
export default function ShopDetails({ shop, route, routeLoading, busy, onVisited, onClose }) {
  const menu = shop.menu ?? null; // null while the menu is still loading
  const [category, setCategory] = useState('beverage');
  const [cart, setCart] = useState({}); // itemId -> { size, qty }
  const [orderOpen, setOrderOpen] = useState(false);
  const [photo, setPhoto] = useState(null); // { src, title } shown in the lightbox
  const [boardFailed, setBoardFailed] = useState(false);

  const chips = useMemo(
    () => CATEGORIES.map((c) => ({ ...c, count: menu ? menu.filter((i) => i.category === c.key).length : 0 })),
    [menu],
  );
  const items = useMemo(() => (menu ?? []).filter((i) => i.category === category), [menu, category]);

  const updateLine = (item, patch) =>
    setCart((prev) => ({
      ...prev,
      [item.id]: { size: item.sizes[0].name, qty: 0, ...prev[item.id], ...patch },
    }));

  const lines = useMemo(
    () =>
      (menu ?? []).flatMap((item) => {
        const l = cart[item.id];
        if (!l || l.qty < 1) return [];
        const size = item.sizes.find((s) => s.name === l.size) ?? item.sizes[0];
        return [{ item, size, qty: l.qty, unit: item.price + size.extra }];
      }),
    [menu, cart],
  );
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.qty * l.unit, 0);

  const navigateUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${shop.lat}%2C${shop.lng}`;
  const navigate = () => window.open(navigateUrl, '_blank', 'noopener');

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header profile */}
      <header className="relative z-10 bg-forest px-5 pb-8 pt-1 text-white md:pt-6">
        <button
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-4 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm md:hidden"
        >
          ✕
        </button>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-mint">
          {shop.source === 'demo' ? 'Demo cafe' : 'Your pick'}
        </p>
        <h2 className="pr-24 text-2xl font-extrabold leading-tight">{shop.name}</h2>
        <p className="mt-1 pr-24 text-sm text-white/70">{shop.address}</p>
        <div className="mt-3 hidden md:block">
          <TripMeta route={route} loading={routeLoading} variant="inline" />
        </div>
        <RatingBadge rating={shop.rating} className="absolute -bottom-4 right-5" />
      </header>

      {/* Chips + menu */}
      <div className="flex min-h-0 flex-1 flex-col bg-forest pt-6 md:bg-cream">
        <CategoryChips chips={chips} active={category} onChange={setCategory} />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-4">
          {menu === null ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-crisp/60" />
              ))}
            </div>
          ) : (
            <>
              {shop.menuBoardUrl && !boardFailed && (
                <button
                  onClick={() => setPhoto({ src: shop.menuBoardUrl, title: `${shop.name} — menu` })}
                  className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-crisp p-2 text-left shadow-sm transition hover:shadow-md"
                >
                  <img
                    src={shop.menuBoardUrl}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() => setBoardFailed(true)}
                    className="h-14 w-14 shrink-0 rounded-xl bg-cream object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-forest">📋 View the menu board</span>
                    <span className="block text-xs text-forest/60">Tap to see {shop.name}'s actual menu</span>
                  </span>
                  <span className="pr-2 text-forest/40" aria-hidden="true">›</span>
                </button>
              )}

              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white md:text-forest">
                {category === 'beverage' ? 'Beverages' : 'Foods'}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1">
                {items.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    line={cart[item.id]}
                    onChange={(patch) => updateLine(item, patch)}
                    onPhoto={setPhoto}
                  />
                ))}
              </div>
              {shop.menuIsSample !== false && (
                <p className="mt-4 text-center text-xs text-white/60 md:text-forest/50">
                  Sample menu — real photos for this cafe haven't been added yet.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex gap-3 border-t border-forest/10 bg-crisp px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <button
          onClick={onVisited}
          disabled={busy || shop.visited}
          className="flex-1 rounded-xl bg-mint py-3 text-sm font-bold text-white transition enabled:hover:brightness-95 disabled:opacity-60"
        >
          {shop.visited ? '✓ Already visited' : busy ? 'Saving…' : '✓ I Already Go There'}
        </button>
        <button
          onClick={count > 0 ? () => setOrderOpen(true) : navigate}
          className="flex-[1.3] rounded-xl bg-forest py-3 text-sm font-bold text-white transition hover:bg-forest/90"
        >
          {count > 0 ? `Place Order · ${formatPrice(total)} (${count})` : 'Navigate →'}
        </button>
      </div>

      {photo && <PhotoLightbox photo={photo} onClose={() => setPhoto(null)} />}

      {orderOpen && (
        <OrderModal
          shop={shop}
          lines={lines}
          total={total}
          onClose={() => setOrderOpen(false)}
          onNavigate={() => {
            setOrderOpen(false);
            navigate();
          }}
        />
      )}
    </div>
  );
}
