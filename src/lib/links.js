/** Google Maps turn-by-turn link (no API key). Starts from the user's current location; walking matches the walk time shown. */
export const googleDirectionsUrl = (shop) =>
  `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}&travelmode=walking`;

/** Opens the cafe's Google listing (ratings, photos, menu, reviews). */
export const googleListingUrl = (shop) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${shop.lat},${shop.lng}`)}`;

/** Tiny haptic tick on phones that support it; silently does nothing elsewhere. */
export const haptic = (ms = 12) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
};
