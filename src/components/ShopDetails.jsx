import { useEffect, useMemo, useState } from 'react';
import RatingBadge from './RatingBadge';
import CategoryChips from './CategoryChips';
import MenuCard from './MenuCard';
import OrderModal from './OrderModal';
import PhotoLightbox from './PhotoLightbox';
import ReviewsPanel from './ReviewsPanel';
import ReviewModal from './ReviewModal';
import PickSignals from './PickSignals';
import WhyThisPick from './WhyThisPick';
import OpenWarning from './OpenWarning';
import { api } from '../lib/api';
import { formatPrice } from '../lib/format';
import { googleDirectionsUrl, googleListingUrl, haptic } from '../lib/links';

const CATEGORIES = [
  { key: 'beverage', label: 'Beverages', emoji: '☕' },
  { key: 'food', label: 'Foods', emoji: '🍰' },
];

/**
 * Everything inside the details panel: header profile, category chips, menu grid, action bar.
 * Rendered with key={shop.id} by the parent, so the cart resets whenever the shop changes.
 */
export default function ShopDetails({ shop, route, routeLoading, userPos, onExpand, busy, onVisited, onClose, onRated }) {
  const menu = shop.menu ?? null; // null while the menu is still loading
  const [category, setCategory] = useState('beverage');
  const [cart, setCart] = useState({}); // itemId -> { size, qty }
  const [orderOpen, setOrderOpen] = useState(false);
  const [photo, setPhoto] = useState(null); // { src, title } shown in the lightbox
  const [boardFailed, setBoardFailed] = useState(false);
  const [tab, setTab] = useState('menu'); // 'menu' | 'reviews'
  const [reviews, setReviews] = useState(null); // null = not loaded yet
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    if (tab !== 'reviews' || reviews !== null) return undefined;
    const ctrl = new AbortController();
    api
      .reviews(shop.id, ctrl.signal)
      .then((r) => setReviews(r.reviews))
      .catch(() => setReviews([]));
    return () => ctrl.abort();
  }, [tab, reviews, shop.id]);

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

  const navigateUrl = googleDirectionsUrl(shop);
  const googleMapsUrl = googleListingUrl(shop);
  const photos = shop.photos ?? [];
  const navigate = () => {
    haptic(15);
    window.open(navigateUrl, '_blank', 'noopener');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header profile */}
      <header className="relative z-10 bg-forest px-5 pb-8 pt-1 text-white md:pt-6">
        <button
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-3 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-base active:scale-90 md:hidden"
        >
          ✕
        </button>
        <button
          onClick={onClose}
          className="mb-3 hidden min-h-[36px] items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 md:inline-flex"
        >
          ← All cafés <kbd className="rounded bg-black/20 px-1.5 text-[10px]">Esc</kbd>
        </button>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-mint">
          {shop.match ? 'Your pick' : 'Selected café'}
        </p>
        <h2 className="pr-24 text-2xl font-extrabold leading-tight">{shop.name}</h2>
        <p className="mt-1 pr-24 text-sm text-white/85">{shop.address}</p>
        <p className="mt-1 text-xs text-white/85">
          {shop.reviewCount > 0
            ? `${shop.reviewCount} review${shop.reviewCount === 1 ? '' : 's'}`
            : 'No reviews yet'}
        </p>
        {shop.rating != null && <RatingBadge rating={shop.rating} className="absolute -bottom-4 right-5" />}
      </header>

      {/* Chips + menu */}
      <div className="flex min-h-0 flex-1 flex-col bg-forest pt-6 md:bg-cream">
        {/* Decision signals + (after Randomize Me!) why this café was picked */}
        <div className="shrink-0 pt-1">
          <PickSignals shop={shop} route={route} userPos={userPos} onRate={() => setReviewOpen(true)} />
          <WhyThisPick match={shop.match} onOpen={onExpand} />
          <OpenWarning shop={shop} />
        </div>

        {/* Google-style quick actions */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3">
          <button onClick={navigate} className="shrink-0 inline-flex min-h-[44px] items-center rounded-full bg-mint px-5 text-sm font-bold text-white shadow-sm transition active:scale-95">
            ➤ Directions
          </button>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex min-h-[44px] items-center rounded-full bg-crisp px-4 text-sm font-semibold text-forest shadow-sm transition active:scale-95"
          >
            🗺️ Google Maps
          </a>
          {shop.phone && (
            <a href={`tel:${shop.phone.replace(/[^+\d]/g, '')}`} className="shrink-0 inline-flex min-h-[44px] items-center rounded-full bg-crisp px-4 text-sm font-semibold text-forest shadow-sm transition active:scale-95">
              📞 Call
            </a>
          )}
          {shop.website && (
            <a href={shop.website} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex min-h-[44px] items-center rounded-full bg-crisp px-4 text-sm font-semibold text-forest shadow-sm transition active:scale-95">
              🌐 Website
            </a>
          )}
          <button onClick={() => setReviewOpen(true)} className="shrink-0 inline-flex min-h-[44px] items-center rounded-full bg-crisp px-4 text-sm font-semibold text-forest shadow-sm transition active:scale-95">
            ★ Rate
          </button>
        </div>

        {photos.length > 0 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3">
            {photos.map((src, i) => (
              <button key={src} onClick={() => setPhoto({ src, title: `${shop.name} — photo ${i + 1}` })} className="shrink-0">
                <img
                  src={src}
                  alt={`${shop.name} photo ${i + 1}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => (e.currentTarget.parentElement.style.display = 'none')}
                  className="h-24 w-32 rounded-xl bg-crisp object-cover"
                />
              </button>
            ))}
          </div>
        )}

        <div role="tablist" aria-label="Details" className="flex gap-6 border-b border-white/15 px-5 md:border-forest/10">
          {[
            ['menu', 'Menu'],
            ['reviews', `Reviews${shop.reviewCount > 0 ? ` (${shop.reviewCount})` : ''}`],
          ].map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 py-3 text-sm font-bold ${
                tab === key ? 'border-mint text-white md:text-forest' : 'border-transparent text-white/75 md:text-forest/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'menu' && menu !== null && menu.length > 0 && (
          <div className="pt-3">
            <CategoryChips chips={chips} active={category} onChange={setCategory} />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-4">
          {tab === 'reviews' ? (
            <div className="-mx-5 -mt-4">
              <ReviewsPanel shop={shop} reviews={reviews} onWrite={() => setReviewOpen(true)} />
            </div>
          ) : menu === null ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-crisp/60" />
              ))}
            </div>
          ) : menu.length === 0 ? (
            <div className="space-y-4">
              {shop.menuBoardUrl && !boardFailed && (
                <button
                  onClick={() => setPhoto({ src: shop.menuBoardUrl, title: `${shop.name} — menu` })}
                  className="block w-full overflow-hidden rounded-2xl bg-crisp shadow-sm"
                >
                  <img src={shop.menuBoardUrl} alt={`${shop.name} menu`} referrerPolicy="no-referrer" onError={() => setBoardFailed(true)} className="max-h-64 w-full object-cover" />
                </button>
              )}
              <div className="rounded-2xl bg-crisp p-5 text-center shadow-sm">
                <p className="text-2xl" aria-hidden="true">📋</p>
                <h3 className="mt-1 text-base font-extrabold text-forest">Menu not listed here yet</h3>
                <p className="mt-1 text-sm text-forest/70">
                  See this cafe's menu, photos and reviews on Google Maps.
                </p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block rounded-xl bg-forest px-5 py-2.5 text-sm font-bold text-white"
                >
                  🗺️ Open in Google Maps
                </a>
              </div>
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
                    <span className="block text-xs text-forest/75">Tap to see {shop.name}'s actual menu</span>
                  </span>
                  <span className="pr-2 text-forest/60" aria-hidden="true">›</span>
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
            </>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex gap-3 border-t border-forest/10 bg-crisp px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <button
          onClick={() => {
            haptic(20);
            onVisited();
          }}
          disabled={busy || shop.visited}
          className={`flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-extrabold text-white transition active:scale-95 disabled:active:scale-100 ${
            shop.visited ? 'bg-forest/70' : 'bg-mint shadow-lg shadow-mint/30 enabled:hover:brightness-95'
          } ${busy ? 'opacity-80' : ''}`}
        >
          {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />}
          {shop.visited ? '✓ Saved · won’t show again' : busy ? 'Saving…' : '✓ I Already Go There'}
        </button>
        <button
          onClick={count > 0 ? () => setOrderOpen(true) : navigate}
          className="flex min-h-[52px] flex-[1.3] items-center justify-center rounded-2xl bg-forest text-sm font-extrabold text-white shadow-lg shadow-forest/30 transition hover:bg-forest/90 active:scale-95"
        >
          {count > 0 ? `Place Order · ${formatPrice(total)} (${count})` : 'Navigate →'}
        </button>
      </div>

      {reviewOpen && (
        <ReviewModal
          shop={shop}
          onClose={() => setReviewOpen(false)}
          onSaved={(res) => {
            setReviewOpen(false);
            setReviews(res.reviews);
            setTab('reviews');
            onRated(shop.id, { rating: res.rating, reviewCount: res.reviewCount });
          }}
        />
      )}

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
