import { useState } from 'react';
import { formatPrice } from '../lib/format';

/**
 * One food/drink. When the cafe has a real photo of it, the photo leads the card;
 * otherwise (or if the image fails to load) we fall back to the emoji tile.
 */
export default function MenuCard({ item, line, onChange, onPhoto }) {
  const [imgFailed, setImgFailed] = useState(false);
  const size = line?.size ?? item.sizes[0].name;
  const qty = line?.qty ?? 0;
  const extra = item.sizes.find((s) => s.name === size)?.extra ?? 0;
  const hasPhoto = Boolean(item.imageUrl) && !imgFailed;

  const title = (
    <>
      <h3 className="min-w-0 flex-1 text-[15px] font-bold leading-tight text-forest">{item.name}</h3>
      <span className="shrink-0 rounded-full bg-mint px-3 py-1 text-sm font-bold text-white">
        {formatPrice(item.price + extra)}
      </span>
    </>
  );

  return (
    <article className="overflow-hidden rounded-2xl bg-crisp shadow-sm">
      {hasPhoto && (
        <button
          onClick={() => onPhoto({ src: item.imageUrl, title: item.name })}
          aria-label={`View photo of ${item.name}`}
          className="block h-40 w-full bg-cream"
        >
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        </button>
      )}

      <div className="p-3">
        {hasPhoto ? (
          <div className="flex items-center gap-3">{title}</div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-cream text-3xl" aria-hidden="true">
              {item.emoji}
            </div>
            {title}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex rounded-full bg-cream p-1" role="radiogroup" aria-label={`Size for ${item.name}`}>
            {item.sizes.map((s) => (
              <button
                key={s.name}
                role="radio"
                aria-checked={s.name === size}
                onClick={() => onChange({ size: s.name })}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  s.name === size ? 'bg-forest text-white' : 'text-forest/70 hover:text-forest'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onChange({ qty: Math.max(0, qty - 1) })}
              disabled={qty === 0}
              aria-label={`Remove one ${item.name}`}
              className="h-10 w-10 rounded-full bg-cream text-xl font-bold leading-none text-forest transition active:scale-90 enabled:hover:bg-forest/10 disabled:opacity-40"
            >
              −
            </button>
            <span className="w-5 text-center text-sm font-bold tabular-nums text-forest" aria-live="polite">
              {qty}
            </span>
            <button
              onClick={() => onChange({ qty: qty + 1 })}
              aria-label={`Add one ${item.name}`}
              className="h-10 w-10 rounded-full bg-forest text-xl font-bold leading-none text-white transition active:scale-90 hover:bg-forest/90"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
