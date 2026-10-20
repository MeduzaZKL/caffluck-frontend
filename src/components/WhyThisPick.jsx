import { useState } from 'react';

/**
 * "Why this café?" — shown after Randomize Me!. The pick is still random, and this says exactly
 * what it was random among and what is true about the café, using only real data.
 */
export default function WhyThisPick({ match, onOpen }) {
  const [open, setOpen] = useState(
    () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(min-width: 768px)').matches),
  );
  if (!match) return null;

  const n = match.poolSize;
  const basis = `Random pick from ${n} café${n === 1 ? '' : 's'} you haven’t visited${match.filtered ? ' that match your filters' : ''}${match.openNow === true ? ' — open ones first' : ''}.`;

  return (
    <section className="mx-5 mb-3 rounded-2xl bg-crisp p-3.5 text-forest shadow-sm" aria-label="Why this café">
      <button
        onClick={() => {
          if (!open) onOpen?.(); // on phones, opening the reasons lifts the sheet to full height
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="flex w-full items-start gap-2 text-left"
      >
        <span className="text-lg leading-none" aria-hidden="true">🎯</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold">Why this café?</span>
          <span className="block text-xs text-forest/65">{basis}</span>
        </span>
        <span className="mt-0.5 text-xs font-bold text-mint" aria-hidden="true">{open ? 'Hide ▴' : 'Show ▾'}</span>
      </button>
      {open && (
        <ul className="mt-2.5 space-y-1.5 border-t border-forest/10 pt-2.5">
          {match.reasons.map((r) => (
            <li key={r.text} className="flex gap-2 text-[13px] font-medium leading-snug">
              <span aria-hidden="true">{r.emoji}</span>
              <span>{r.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
