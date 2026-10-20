import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapView from './components/MapView';
import DetailsPanel from './components/DetailsPanel';
import TripMeta from './components/TripMeta';
import ReviewModal from './components/ReviewModal';
import StatusNotice from './components/StatusNotice';
import SkeletonPins from './components/SkeletonPins';
import FilterBar from './components/FilterBar';
import PanelToggle from './components/PanelToggle';
import { api } from './lib/api';
import { fetchRoute } from './lib/routing';
import { SEARCH_RADIUS_M } from './lib/config';
import { loadFilters, saveFilters, matchesFilters, serverFilters, activeFilterCount } from './lib/filters';
import { useGeolocation } from './hooks/useGeolocation';
import { useMediaQuery } from './hooks/useMediaQuery';
import { haptic } from './lib/links';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const geo = useGeolocation();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [shops, setShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [selected, setSelected] = useState(null); // basic shop, later merged with the full detail (menu)
  const [sheet, setSheet] = useState('closed'); // mobile bottom sheet: 'closed' | 'peek' | 'expanded'
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [visitedBusy, setVisitedBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [areaView, setAreaView] = useState(null); // map moved away from the searched area: { lat, lng, radiusM }
  const [areaBusy, setAreaBusy] = useState(false);
  const [reviewPrompt, setReviewPrompt] = useState(null); // shop to rate right after "I Already Go There"
  const [notice, setNotice] = useState(null); // { kind: 'empty'|'busy'|'error', retry: 'load'|'roll'|'area' }
  const [reloadKey, setReloadKey] = useState(0); // bump to re-run the initial café load (Retry)
  const [slow, setSlow] = useState(false); // a request is taking long (free server waking up)

  const [filters, setFiltersState] = useState(loadFilters); // remembered between visits
  const setFilters = useCallback((next) => {
    setFiltersState(next);
    saveFilters(next);
    setNotice((n) => (n?.kind === 'nomatch' ? null : n));
  }, []);

  const [rollDone, setRollDone] = useState(false); // brief "Found one!" success state on the roll button
  // Desktop side panel: slides away so only the map remains. Remembered between visits.
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem('caffluck.sidebar.v1') !== 'closed';
    } catch {
      return true;
    }
  });
  const [sidebarTip, setSidebarTip] = useState(false);
  const toggleSidebar = useCallback(() => {
    setSidebarTip(false);
    setSidebarOpen((open) => {
      try {
        localStorage.setItem('caffluck.sidebar.v1', open ? 'closed' : 'open');
        localStorage.setItem('caffluck.sidebar.tip.v1', '1');
      } catch {
        /* ignore */
      }
      return !open;
    });
  }, []);
  const [hoverId, setHoverId] = useState(null); // desktop: card hovered in the sidebar list -> pin lights up
  const [recenter, setRecenter] = useState(0); // bump to fly the map back to the user
  const [hint, setHint] = useState(false); // first-visit gesture hint (phones)

  const detailCtrl = useRef(null);
  const showToast = useCallback((message) => setToast({ id: Date.now(), message }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  // --- load pins around the user ---
  const lat = geo.pos?.lat;
  const lng = geo.pos?.lng;
  useEffect(() => {
    if (lat == null) return undefined;
    const ctrl = new AbortController();
    setShopsLoading(true);
    setNotice((n) => (n?.retry === 'load' ? null : n));
    api
      .shops(lat, lng, SEARCH_RADIUS_M, ctrl.signal)
      .then((res) => {
        setShops(res.shops);
        if (res.shops.length === 0) setNotice({ kind: res.areaStatus === 'failed' ? 'busy' : 'empty', retry: 'load' });
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setNotice({ kind: 'error', retry: 'load' });
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setShopsLoading(false);
      });
    return () => ctrl.abort();
  }, [lat, lng, reloadKey]);

  // After 8 s of waiting, explain why (free servers sleep when idle).
  useEffect(() => {
    if (!shopsLoading && !rolling) {
      setSlow(false);
      return undefined;
    }
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, [shopsLoading, rolling]);

  // --- draw a route whenever the selected shop (or the user's position) changes ---
  const selectedId = selected?.id ?? null;
  const selectedLat = selected?.lat;
  const selectedLng = selected?.lng;
  useEffect(() => {
    setRoute(null);
    if (selectedId == null || lat == null) {
      setRouteLoading(false);
      return undefined;
    }
    const ctrl = new AbortController();
    setRouteLoading(true);
    fetchRoute(
      [
        { lat, lng },
        // Intermediate waypoints can be inserted here, e.g. { lat: 14.6, lng: 121.0 }
        { lat: selectedLat, lng: selectedLng },
      ],
      { signal: ctrl.signal },
    )
      .then((r) => setRoute(r))
      .catch(() => {})
      .finally(() => {
        if (!ctrl.signal.aborted) setRouteLoading(false);
      });
    return () => ctrl.abort();
  }, [selectedId, selectedLat, selectedLng, lat, lng]);

  // One-time gesture hint on phones: shown once, gone after any interaction or 9 s.
  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem('caffluck.hint.v1') === '1';
    } catch {
      /* storage blocked: skip the hint rather than nag every visit */
    }
    if (seen || isDesktop || shopsLoading || shops.length === 0) return undefined;
    setHint(true);
    const t = setTimeout(() => setHint(false), 9000);
    return () => clearTimeout(t);
  }, [isDesktop, shopsLoading, shops.length === 0]);
  const dismissHint = useCallback(() => {
    setHint(false);
    try {
      localStorage.setItem('caffluck.hint.v1', '1');
    } catch {
      /* ignore */
    }
  }, []);

  // Pins that pass the filter bar (the open cafe always keeps its pin).
  const userPos = geo.pos;
  const visibleShops = useMemo(
    () => shops.filter((s) => s.id === selected?.id || matchesFilters(s, filters, userPos)),
    [shops, filters, userPos, selected?.id],
  );
  const filtersOn = activeFilterCount(filters) > 0;

  // --- selection helpers ---
  const deselect = useCallback(() => {
    detailCtrl.current?.abort();
    setSelected(null);
    setSheet('closed');
  }, []);

  const selectShop = useCallback(
    (id) => {
      const basic = shops.find((s) => s.id === id);
      if (!basic) return;
      setSelected(basic);
      setSheet((s) => (s === 'closed' ? 'mini' : s));
      setSidebarOpen(true);
      dismissHint();
      detailCtrl.current?.abort();
      const ctrl = new AbortController();
      detailCtrl.current = ctrl;
      api
        .shop(id, ctrl.signal)
        .then(({ shop }) => setSelected((cur) => (cur?.id === id ? { ...cur, ...shop } : cur)))
        .catch((err) => {
          if (err.name !== 'AbortError') showToast(`Couldn't load the menu: ${err.message}`);
        });
    },
    [shops, showToast, dismissHint],
  );

  // --- "Randomize Me!" ---
  const roll = async () => {
    if (!geo.pos || rolling) return;
    haptic(12);
    dismissHint();
    setRolling(true);
    setNotice(null);
    try {
      const [res] = await Promise.all([api.roll(geo.pos.lat, geo.pos.lng, SEARCH_RADIUS_M, serverFilters(filters)), sleep(600)]);
      if (res.status === 'ok') {
        detailCtrl.current?.abort();
        setShops((prev) => (prev.some((s) => s.id === res.shop.id) ? prev : [...prev, res.shop]));
        setSelected(res.shop);
        setSheet('peek');
        setSidebarOpen(true); // the result lives in the panel
        haptic([20, 40, 30]);
        setRollDone(true);
        setTimeout(() => setRollDone(false), 1400);
      } else if (res.status === 'all_visited') {
        showToast("You've been to every cafe around here! 🎉 Come back when new ones open.");
      } else if (res.status === 'no_match') {
        setNotice({ kind: 'nomatch', retry: 'clear' });
      } else if (res.status === 'unavailable') {
        setNotice({ kind: 'busy', retry: 'roll' });
      } else {
        setNotice({ kind: 'empty', retry: 'roll' });
      }
    } catch {
      setNotice({ kind: 'error', retry: 'roll' });
    } finally {
      setRolling(false);
    }
  };

  useEffect(() => {
    if (!isDesktop || !sidebarOpen || shopsLoading) return undefined;
    let seen = true;
    try {
      seen = localStorage.getItem('caffluck.sidebar.tip.v1') === '1';
    } catch {
      /* no storage: skip the tip */
    }
    if (seen) return undefined;
    const show = setTimeout(() => setSidebarTip(true), 1200);
    const hide = setTimeout(() => {
      setSidebarTip(false);
      try {
        localStorage.setItem('caffluck.sidebar.tip.v1', '1');
      } catch {
        /* ignore */
      }
    }, 9000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [isDesktop, sidebarOpen, shopsLoading]);

  // Desktop keyboard shortcuts: R = Randomize Me!, [ = hide/show the panel, Esc = back to the list. Ignored while typing or in a dialog.
  const rollRef = useRef(roll);
  rollRef.current = roll;
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        rollRef.current();
      } else if (e.key === '[') {
        toggleSidebar();
      } else if (e.key === 'Escape') {
        deselect();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deselect, toggleSidebar]);

  // --- "I Already Go There" ---
  const markVisited = async () => {
    if (!selected || visitedBusy) return;
    setVisitedBusy(true);
    try {
      await api.markVisited(selected.id);
      setShops((prev) => prev.map((s) => (s.id === selected.id ? { ...s, visited: true } : s)));
      showToast(`Saved! We won't suggest ${selected.name} again.`);
      setReviewPrompt({ id: selected.id, name: selected.name });
      deselect();
    } catch (err) {
      showToast(`Couldn't save: ${err.message}`);
    } finally {
      setVisitedBusy(false);
    }
  };

  const retry = () => {
    const what = notice?.retry;
    if (what === 'clear') setFilters({ maxWalkMin: null, openNow: false, hideVisited: false, features: [] });
    else if (what === 'roll') roll();
    else if (what === 'area') searchArea();
    else {
      setNotice(null);
      setReloadKey((k) => k + 1);
    }
  };

  // Patch a shop's rating everywhere after the user posts a review.
  const applyRating = useCallback((id, patch) => {
    setShops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setSelected((cur) => (cur?.id === id ? { ...cur, ...patch } : cur));
  }, []);

  // "Search this area": load cafes around the current map center and merge them into the pins.
  const searchArea = async () => {
    if (!areaView || areaBusy) return;
    setAreaBusy(true);
    try {
      const res = await api.shops(areaView.lat, areaView.lng, areaView.radiusM);
      setShops((prev) => {
        const keep = prev.filter((s) => s.id === selectedId); // never drop the open cafe's pin
        const merged = [...res.shops];
        for (const s of keep) if (!merged.some((m) => m.id === s.id)) merged.push(s);
        return merged;
      });
      if (res.shops.length === 0) {
        setNotice({ kind: res.areaStatus === 'failed' ? 'busy' : 'empty', retry: 'area' }); // keep areaView so Retry works
      } else {
        setNotice(null);
        setAreaView(null);
      }
    } catch {
      setNotice({ kind: 'error', retry: 'area' });
    } finally {
      setAreaBusy(false);
    }
  };

  // Keep the route clear of the bottom sheet when the map fits it into view.
  const padding = useMemo(
    () =>
      isDesktop
        ? { top: 90, right: 70, bottom: 110, left: (sidebarOpen ? (window.innerWidth >= 1024 ? 450 : 430) + 24 : 0) + 60 }
        : { top: 130, right: 28, bottom: (sheet === 'mini' ? 272 : Math.round(window.innerHeight * (sheet === 'expanded' ? 0.88 : 0.62))) + 24, left: 28 },
    [isDesktop, sheet, sidebarOpen],
  );

  if (!geo.pos) {
    return (
      <div className="app-root flex h-screen w-screen flex-col items-center justify-center gap-4 bg-cream text-forest">
        <img src="/logo-icon.svg" alt="" className="h-20 w-20 animate-bounce drop-shadow-xl" draggable="false" />
        <p className="text-sm font-semibold">Finding your location…</p>
      </div>
    );
  }

  const rollBottom = sheet === 'closed' ? 'bottom-6' : sheet === 'mini' ? 'bottom-[calc(272px+1rem)]' : 'bottom-[calc(62dvh+1rem)]';

  return (
    <div
      className="app-root relative flex h-screen w-screen flex-col overflow-hidden bg-cream font-sans md:flex-row md:[--pw:430px] lg:[--pw:450px]"
      style={{ '--sb': sidebarOpen ? 'calc(var(--pw) + 1.5rem)' : '0px' }}
    >
      <DetailsPanel
        sheet={sheet}
        onSheetChange={setSheet}
        shop={selected}
        route={route}
        routeLoading={routeLoading}
        userPos={geo.pos}
        busy={visitedBusy}
        onVisited={markVisited}
        onClose={deselect}
        onRated={applyRating}
        collapsed={isDesktop && !sidebarOpen}
        list={{
          shops: visibleShops,
          loading: shopsLoading,
          filtersOn,
          totalCount: shops.length,
          visitedCount: shops.filter((x) => x.visited).length,
          rolling,
          onRoll: roll,
          onPick: selectShop,
          onHover: setHoverId,
          onClearFilters: () => setFilters({ maxWalkMin: null, openNow: false, hideVisited: false, features: [] }),
        }}
      />

      {/* Map area: full screen on mobile, the remaining width next to the sidebar on desktop */}
      <PanelToggle open={sidebarOpen} onToggle={toggleSidebar} showTip={sidebarTip} />

      <main className="relative z-0 min-w-0 flex-1 md:absolute md:inset-0">
        <MapView
          userPos={geo.pos}
          shops={visibleShops}
          selectedId={selectedId}
          route={route}
          routeLoading={routeLoading}
          recenterSignal={recenter}
          hoverId={hoverId}
          padding={padding}
          onSelect={selectShop}
          onAreaMoved={setAreaView}
        />
        {shopsLoading && shops.length === 0 && <SkeletonPins />}

        {/* Top overlay: brand, mobile trip card, status */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-col items-start gap-2 md:left-[calc(var(--sb)+0.75rem)] md:right-16 md:transition-[left] md:duration-[560ms] md:ease-[cubic-bezier(0.22,1,0.36,1)]">
          <div className="flex w-full min-w-0 flex-col items-start gap-2 md:flex-row md:items-start">
            <span
              className={`pointer-events-auto shrink-0 items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-extrabold tracking-wide text-white shadow-lg ${
                selected ? 'hidden' : 'inline-flex'
              } md:hidden`}
            >
              <img src="/logo-mark-on-dark.svg" alt="" className="mr-2 h-6 w-auto" draggable="false" />
              Caffluck
            </span>
            <div className={`w-full min-w-0 md:flex-1 ${selected ? 'max-md:hidden' : ''}`}>
              <FilterBar filters={filters} onChange={setFilters} matching={visibleShops.length} total={shops.length} />
            </div>
          </div>

          {selected && (
            <div className="pointer-events-auto w-full md:hidden">
              <TripMeta route={route} loading={routeLoading} variant="card" />
            </div>
          )}

          {(geo.status === 'denied' || geo.status === 'unsupported') && (
            <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-crisp/95 px-3 py-2 text-xs font-medium text-forest shadow-lg backdrop-blur">
              <span>📍 Location unavailable — showing a default area.</span>
              <button onClick={geo.retry} className="rounded-full bg-mint px-2.5 py-1 font-bold text-white">
                Retry
              </button>
            </div>
          )}

          {(shopsLoading || areaBusy) && (
            <div className="pointer-events-auto rounded-2xl bg-crisp/95 px-3 py-1.5 text-xs font-semibold text-forest shadow-lg" role="status">
              {slow ? 'Still working… the free server may be waking up (up to a minute).' : 'Finding cafes nearby…'}
            </div>
          )}

          {notice && !shopsLoading && (
            <StatusNotice
              kind={notice.kind}
              retrying={rolling || areaBusy}
              onRetry={retry}
              onDismiss={() => setNotice(null)}
            />
          )}
        </div>

        {/* Google-style "Search this area" pill */}
        {areaView && !notice && (
          <div className="pointer-events-none absolute inset-x-0 top-[7.5rem] z-10 flex justify-center md:bottom-24 md:left-[var(--sb)] md:top-auto md:transition-[left] md:duration-[560ms] md:ease-[cubic-bezier(0.22,1,0.36,1)]">
            <button
              onClick={searchArea}
              disabled={areaBusy}
              className="pointer-events-auto whitespace-nowrap rounded-full bg-crisp px-4 py-2 text-sm font-bold text-forest shadow-lg ring-1 ring-forest/10 transition hover:bg-cream active:scale-95"
            >
              {areaBusy ? 'Searching…' : '↻ Search this area'}
            </button>
          </div>
        )}

        {/* Desktop: floating route summary on the map */}
        {selected && (route || routeLoading) && (
          <div className="pointer-events-auto absolute bottom-8 left-4 z-10 hidden md:left-[calc(var(--sb)+1rem)] md:block md:transition-[left] md:duration-[560ms] md:ease-[cubic-bezier(0.22,1,0.36,1)]">
            <TripMeta route={route} loading={routeLoading} variant="card" />
          </div>
        )}

        {/* First-visit gesture hint (phones) */}
        {hint && sheet === 'closed' && (
          <button
            onClick={dismissHint}
            className="caff-hint absolute bottom-[5.75rem] left-1/2 z-20 w-[min(20rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl bg-forest px-4 py-3 text-center text-sm font-semibold text-white shadow-2xl md:hidden"
          >
            👆 Tap a pin, or hit <strong>Randomize Me!</strong>
            <span className="mt-0.5 block text-xs font-medium text-white/80">Drag &amp; pinch to explore · tap to dismiss</span>
          </button>
        )}

        {/* "My location" */}
        <button
          onClick={() => {
            haptic(10);
            setRecenter((n) => n + 1);
          }}
          aria-label="Center the map on my location"
          className={`absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-crisp text-xl text-forest shadow-xl ring-1 ring-forest/15 transition-all duration-300 active:scale-90 md:bottom-32 md:right-3 md:h-10 md:w-10 md:text-base ${rollBottom} ${
            sheet === 'expanded' ? 'max-md:hidden' : ''
          }`}
        >
          ➤
        </button>

        {/* Randomize button: breathes when idle, shimmers while rolling, flashes green when it found one */}
        <div className={`pointer-events-none absolute inset-x-0 z-10 flex justify-center transition-[bottom] duration-300 md:bottom-8 md:left-[var(--sb)] md:transition-[left] md:duration-[560ms] md:ease-[cubic-bezier(0.22,1,0.36,1)] ${rollBottom} ${sheet === 'expanded' ? 'max-md:hidden' : ''}`}>
        <button
          onClick={roll}
          disabled={rolling}
          aria-live="polite"
          className={`pointer-events-auto min-h-[56px] whitespace-nowrap rounded-full bg-forest px-8 py-3.5 text-lg font-extrabold text-white shadow-xl shadow-forest/30 transition-[transform,background-color] duration-300 hover:bg-forest/90 active:scale-95 disabled:opacity-100 md:text-base ${rolling ? 'caff-cta-rolling' : rollDone ? 'caff-cta-success' : sheet === 'closed' ? 'caff-cta-idle' : ''}`}
        >
          <span className={`mr-2 inline-block ${rolling ? 'animate-spin' : ''}`}>{rollDone ? '🎯' : '🎲'}</span>
          {rolling ? (slow ? 'Waking the server…' : 'Rolling…') : rollDone ? 'Found your café!' : 'Randomize Me!'}
        </button>
        </div>
      </main>

      {reviewPrompt && (
        <ReviewModal
          shop={reviewPrompt}
          title="How was it?"
          onClose={() => setReviewPrompt(null)}
          onSaved={(res) => {
            applyRating(reviewPrompt.id, { rating: res.rating, reviewCount: res.reviewCount });
            setReviewPrompt(null);
            showToast('Thanks for your review! ⭐');
          }}
        />
      )}

      {toast && (
        <div
          key={toast.id}
          role="status"
          className="fixed left-1/2 top-[4.75rem] z-50 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-forest px-4 py-3 text-sm font-medium text-white shadow-2xl md:top-6"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
