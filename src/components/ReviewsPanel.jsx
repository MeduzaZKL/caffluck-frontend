import { formatReviewDate } from '../lib/format';

function Stars({ value }) {
  return (
    <span className="text-sm tracking-tight" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? 'text-accent' : 'text-forest/20'}>★</span>
      ))}
    </span>
  );
}

/** Reviews tab: summary, "write a review" button and the list. `reviews` is null while loading. */
export default function ReviewsPanel({ shop, reviews, onWrite }) {
  return (
    <div className="px-5 pb-6 pt-4">
      <div className="flex items-center justify-between rounded-2xl bg-crisp p-4 shadow-sm">
        <div>
          {shop.reviewCount > 0 ? (
            <>
              <div className="text-3xl font-extrabold text-forest">{shop.rating.toFixed(1)}</div>
              <Stars value={Math.round(shop.rating)} />
              <div className="text-xs text-forest/60">
                {shop.reviewCount} review{shop.reviewCount === 1 ? '' : 's'}
              </div>
            </>
          ) : (
            <p className="max-w-[12rem] text-sm text-forest/70">No reviews yet. Be the first to rate this cafe!</p>
          )}
        </div>
        <button onClick={onWrite} className="rounded-xl bg-mint px-4 py-2.5 text-sm font-bold text-white">
          ✍️ {reviews?.some((r) => r.mine) ? 'Edit yours' : 'Write a review'}
        </button>
      </div>

      {reviews === null ? (
        <div className="mt-3 h-20 animate-pulse rounded-2xl bg-crisp/60" aria-busy="true" />
      ) : (
        <ul className="mt-3 space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl bg-crisp p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                <span className="text-xs text-forest/50">
                  {r.mine ? 'You · ' : ''}
                  {formatReviewDate(r.createdAt)}
                </span>
              </div>
              {r.comment && <p className="mt-1.5 text-sm text-forest">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
