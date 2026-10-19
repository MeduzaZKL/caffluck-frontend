import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LABEL_ZOOM = 15; // name labels + rating bubbles appear from this zoom, like Google Maps

/** Builds the pin with DOM APIs (textContent), so cafe names from OpenStreetMap can never inject HTML. */
function pinIcon(shop, cls, showLabel) {
  const root = document.createElement('div');
  root.className = `caff-pin ${cls}`;
  const cup = document.createElement('span');
  cup.textContent = '☕';
  root.append(cup);

  const hasRating = shop.rating != null;
  if (hasRating) {
    const bubble = document.createElement('i');
    bubble.className = 'caff-bubble';
    bubble.textContent = `${Number(shop.rating).toFixed(1)}★`;
    root.append(bubble);
  }
  if (showLabel) {
    const label = document.createElement('b');
    label.className = 'caff-label';
    label.textContent = shop.name;
    root.append(label);
  }
  return L.divIcon({ className: '', html: root, iconSize: [36, 46], iconAnchor: [18, 45] });
}

const userIcon = L.divIcon({
  className: '',
  html: '<div class="caff-user"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/**
 * Leaflet map that fills whatever box it is given (full screen on mobile, the area next to
 * the sidebar on desktop). A ResizeObserver calls invalidateSize() so the map re-adapts
 * whenever the layout changes (rotation, window resize, sidebar <-> bottom-sheet switch).
 *
 * Props
 *  - userPos:    { lat, lng }
 *  - shops:      [{ id, lat, lng, visited }]
 *  - selectedId: number | null
 *  - route:      { path: [lat,lng][], approx } | null  -> drawn as the navigation polyline
 *  - padding:    { top, right, bottom, left } px kept clear (e.g. under the bottom sheet) when fitting the route
 */
export default function MapView({ userPos, shops, selectedId, route, padding, onSelect, onAreaMoved }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const markersRef = useRef(new Map()); // shopId -> { marker, cls }
  const routeLayerRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const paddingRef = useRef(padding);
  const onAreaMovedRef = useRef(onAreaMoved);
  const quietUntilRef = useRef(Date.now() + 2000); // ignore moves the app makes itself (fitBounds, setView)
  const searchedRef = useRef(null); // center of the last searched area
  const labelsRef = useRef(false);
  const [labels, setLabels] = useState(false);
  onSelectRef.current = onSelect;
  onAreaMovedRef.current = onAreaMoved;
  paddingRef.current = padding;

  // --- create / destroy the map ---
  useEffect(() => {
    const map = L.map(elRef.current, { zoomControl: false }).setView([userPos.lat, userPos.lng], 15);
    searchedRef.current = L.latLng(userPos.lat, userPos.lng);
    labelsRef.current = map.getZoom() >= LABEL_ZOOM;
    setLabels(labelsRef.current);
    map.on('zoomend', () => {
      const on = map.getZoom() >= LABEL_ZOOM;
      if (on !== labelsRef.current) {
        labelsRef.current = on;
        setLabels(on);
      }
    });
    map.on('moveend', () => {
      if (Date.now() < quietUntilRef.current) return;
      const c = map.getCenter();
      if (c.distanceTo(searchedRef.current) < 400) return;
      const b = map.getBounds();
      const radiusM = Math.min(10000, Math.max(500, Math.round(c.distanceTo(b.getNorthEast()))));
      searchedRef.current = c;
      onAreaMovedRef.current?.({ lat: c.lat, lng: c.lng, radiusM });
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(elRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      routeLayerRef.current = null;
      markersRef.current = new Map();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- the user's position ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon: userIcon, zIndexOffset: 1000, interactive: false }).addTo(map);
      quietUntilRef.current = Date.now() + 1500;
      map.setView([userPos.lat, userPos.lng], map.getZoom());
      searchedRef.current = L.latLng(userPos.lat, userPos.lng);
    } else {
      userMarkerRef.current.setLatLng([userPos.lat, userPos.lng]);
    }
  }, [userPos.lat, userPos.lng]);

  // --- shop pins (diffed so selecting a shop does not rebuild every marker) ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = markersRef.current;
    const live = new Set(shops.map((s) => s.id));

    for (const [id, entry] of markers) {
      if (!live.has(id)) {
        entry.marker.remove();
        markers.delete(id);
      }
    }
    for (const shop of shops) {
      const cls = shop.id === selectedId ? 'is-selected' : shop.visited ? 'is-visited' : '';
      const sig = `${cls}|${labels}|${shop.rating}|${shop.reviewCount}`;
      const existing = markers.get(shop.id);
      if (!existing) {
        const marker = L.marker([shop.lat, shop.lng], { icon: pinIcon(shop, cls, labels), zIndexOffset: cls === 'is-selected' ? 500 : 0 }).addTo(map);
        marker.on('click', () => onSelectRef.current(shop.id));
        markers.set(shop.id, { marker, sig });
      } else if (existing.sig !== sig) {
        existing.marker.setIcon(pinIcon(shop, cls, labels));
        existing.marker.setZIndexOffset(cls === 'is-selected' ? 500 : 0);
        existing.sig = sig;
      }
    }
  }, [shops, selectedId, labels]);

  // --- the waypoint route polyline ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    if (!route || route.path.length < 2) return;

    const casing = L.polyline(route.path, { color: '#ffffff', weight: 10, opacity: 0.95, lineCap: 'round', lineJoin: 'round' });
    const line = L.polyline(route.path, {
      color: '#004B34',
      weight: 5,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: route.approx ? '2 10' : undefined,
    });
    routeLayerRef.current = L.layerGroup([casing, line]).addTo(map);

    quietUntilRef.current = Date.now() + 1500;
    const p = paddingRef.current;
    map.fitBounds(L.latLngBounds(route.path), {
      paddingTopLeft: [p.left, p.top],
      paddingBottomRight: [p.right, p.bottom],
      maxZoom: 17,
      animate: true,
    });
  }, [route]);

  // relative + z-0 gives Leaflet its own stacking context, so its internal z-indexes
  // (panes 200-700, controls 1000) can never paint over the app's floating UI.
  return <div ref={elRef} className="relative z-0 h-full w-full" />;
}
