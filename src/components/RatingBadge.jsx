export default function RatingBadge({ rating, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-white shadow-lg shadow-accent/30 ${className}`}
      aria-label={`Rating ${rating.toFixed(1)} out of 5`}
    >
      <span aria-hidden="true">⭐</span> {rating.toFixed(1)}
    </span>
  );
}
