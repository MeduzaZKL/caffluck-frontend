import { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api';

/** Star picker + short comment. Portaled to <body> like the other modals. */
export default function ReviewModal({ shop, onClose, onSaved, title = 'Rate this cafe' }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (rating < 1 || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.postReview(shop.id, { rating, comment: comment.trim() });
      onSaved(res);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-3xl bg-crisp p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-extrabold text-forest">{title}</h2>
        <p className="text-sm text-forest/75">{shop.name}</p>

        <div className="mt-4 flex justify-center gap-1" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onClick={() => setRating(n)}
              className={`text-4xl leading-none transition active:scale-90 ${n <= rating ? 'text-accent' : 'text-forest/20'}`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 280))}
          rows={3}
          placeholder="Share a short note (optional)"
          className="mt-4 w-full resize-none rounded-xl border border-forest/15 bg-cream p-3 text-sm text-forest outline-none focus:border-mint"
        />
        <div className="text-right text-xs text-forest/70">{comment.length}/280</div>
        {error && <p className="mt-1 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-3 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl bg-cream py-3 text-sm font-bold text-forest">
            Skip
          </button>
          <button
            onClick={submit}
            disabled={rating < 1 || busy}
            className="flex-1 rounded-xl bg-forest py-3 text-sm font-bold text-white transition disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Post review'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
