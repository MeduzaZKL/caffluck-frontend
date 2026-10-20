import { haversine } from './routing';

// Same meaning as backend/src/services/pick.js (the server applies these to "Randomize Me!").
export const WALK_OPTIONS = [5, 10, 15, 30];
export const FEATURE_FILTERS = [
  { key: 'wifi', emoji: '📶', label: 'Wi‑Fi' },
  { key: 'outdoorSeating', emoji: '🌿', label: 'Outdoor' },
  { key: 'pets', emoji: '🐶', label: 'Pet-friendly' },
  { key: 'specialty', emoji: '☕', label: 'Specialty' },
];

export const DEFAULT_FILTERS = { maxWalkMin: null, openNow: false, hideVisited: false, features: [] };
const STORAGE_KEY = 'caffluck.filters.v1';

/** Remembered between visits (per browser). Storage can be blocked, so every access is guarded. */
export function loadFilters() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return DEFAULT_FILTERS;
    return {
      maxWalkMin: WALK_OPTIONS.includes(raw.maxWalkMin) ? raw.maxWalkMin : null,
      openNow: raw.openNow === true,
      hideVisited: raw.hideVisited === true,
      features: Array.isArray(raw.features) ? FEATURE_FILTERS.map((f) => f.key).filter((k) => raw.features.includes(k)) : [],
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function saveFilters(filters) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    /* private mode etc.: filters just won't be remembered */
  }
}

export const activeFilterCount = (f) => (f.maxWalkMin ? 1 : 0) + (f.openNow ? 1 : 0) + (f.hideVisited ? 1 : 0) + f.features.length;

/** What the server needs for a roll (the visited list is always excluded there anyway). */
export const serverFilters = (f) => ({ maxWalkMin: f.maxWalkMin, openNow: f.openNow, features: f.features });

/** Should this map pin stay visible? Walk time uses the same 25%-padded straight line as the server. */
export function matchesFilters(shop, f, userPos) {
  if (f.hideVisited && shop.visited) return false;
  if (f.maxWalkMin && userPos) {
    const d = haversine(userPos, { lat: shop.lat, lng: shop.lng });
    if (!((d * 1.25) / 80 <= f.maxWalkMin)) return false;
  }
  if (f.openNow && shop.openNow !== true) return false;
  if (f.features.length > 0) {
    const have = new Set((shop.features ?? []).map((x) => x.key));
    if (!f.features.every((k) => have.has(k))) return false;
  }
  return true;
}
