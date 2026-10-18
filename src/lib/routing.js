// Waypoint routing between the user and a cafe.
// Uses the public OSRM server (no API key). If it is slow/down we fall back to a straight
// line so the map still shows *something*, flagged as `approx`.

const OSRM_URL = (import.meta.env.VITE_OSRM_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
const TIMEOUT_MS = 8000;
const FALLBACK_SPEED_MS = (25 * 1000) / 3600; // 25 km/h in m/s

export function haversine(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function straightLine(points) {
  let distanceM = 0;
  for (let i = 1; i < points.length; i++) distanceM += haversine(points[i - 1], points[i]);
  return {
    path: points.map((p) => [p.lat, p.lng]),
    distanceM,
    durationS: distanceM / FALLBACK_SPEED_MS,
    approx: true,
  };
}

/**
 * @param points ordered stops: [user, ...optional waypoints, cafe], each { lat, lng }
 * @returns { path: [lat,lng][], distanceM, durationS, approx }
 */
export async function fetchRoute(points, { signal } = {}) {
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
  const url = `${OSRM_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;

  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  signal?.addEventListener('abort', onAbort);
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const data = await res.json();
    const route = data?.routes?.[0];
    if (data?.code !== 'Ok' || !route) throw new Error('No route');
    return {
      path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanceM: route.distance,
      durationS: route.duration,
      approx: false,
    };
  } catch (err) {
    if (signal?.aborted) throw err; // the caller moved on; don't fall back
    return straightLine(points);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
