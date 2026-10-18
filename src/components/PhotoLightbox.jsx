import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/** Full-screen photo viewer (menu items and the menu board). Esc, backdrop click or ✕ closes it. */
export default function PhotoLightbox({ photo, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Portaled to <body>: the details panel has a CSS transform, which would otherwise trap
  // `position: fixed` children inside the panel instead of covering the whole screen.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close photo"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg text-white"
      >
        ✕
      </button>
      <img
        src={photo.src}
        alt={photo.title}
        referrerPolicy="no-referrer"
        className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="mt-3 text-sm font-semibold text-white">{photo.title}</p>
    </div>,
    document.body,
  );
}
