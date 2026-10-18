import { createPortal } from 'react-dom';
import { formatPrice } from '../lib/format';

/** Order summary shown by "Place Order". There is no payment backend: this is a pre-order summary. */
export default function OrderModal({ shop, lines, total, onClose, onNavigate }) {
  // Portaled to <body> so the overlay covers the map too (the panel's transform would trap it otherwise).
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Order summary"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-3xl bg-crisp p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-extrabold text-forest">Your order at {shop.name}</h2>
        <ul className="mt-3 max-h-60 space-y-2 overflow-y-auto">
          {lines.map(({ item, size, qty, unit }) => (
            <li key={item.id} className="flex items-start justify-between gap-3 text-sm text-forest">
              <span>
                {qty}× {item.name} <span className="text-forest/60">({size.name})</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{formatPrice(qty * unit)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-forest/10 pt-3 text-base font-extrabold text-forest">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(total)}</span>
        </div>
        <p className="mt-2 text-xs text-forest/60">Pre-order summary only — payment isn't processed in the app. Show this at the counter.</p>
        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl bg-cream py-3 text-sm font-bold text-forest">
            Back
          </button>
          <button onClick={onNavigate} className="flex-1 rounded-xl bg-forest py-3 text-sm font-bold text-white">
            Navigate →
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
