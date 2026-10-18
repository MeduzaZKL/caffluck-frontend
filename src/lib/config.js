export const SEARCH_RADIUS_M = Number(import.meta.env.VITE_SEARCH_RADIUS_M) || 5000;

// Used only when the browser denies (or lacks) GPS. Defaults to Manila.
export const DEFAULT_POS = {
  lat: Number(import.meta.env.VITE_DEFAULT_LAT) || 14.5995,
  lng: Number(import.meta.env.VITE_DEFAULT_LNG) || 120.9842,
};
