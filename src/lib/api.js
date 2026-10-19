import { getUserId } from './uid';

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, { method = 'GET', body, signal } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    signal,
    headers: { 'Content-Type': 'application/json', 'x-caffluck-uid': getUserId() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      message = (await res.json()).message || message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  shops: (lat, lng, radius, signal) => request(`/shops?lat=${lat}&lng=${lng}&radius=${radius}`, { signal }),
  shop: (id, signal) => request(`/shops/${id}`, { signal }),
  roll: (lat, lng, radius) => request('/roll', { method: 'POST', body: { lat, lng, radius } }),
  reviews: (shopId, signal) => request(`/shops/${shopId}/reviews`, { signal }),
  postReview: (shopId, body) => request(`/shops/${shopId}/reviews`, { method: 'POST', body }),
  visited: () => request('/visited'),
  markVisited: (shopId) => request('/visited', { method: 'POST', body: { shopId } }),
};
