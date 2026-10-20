/**
 * Desktop handle on the edge of the side panel. It rides along with the panel as it slides, and stays on
 * screen at the left edge when the panel is hidden so it can always be brought back.
 * Hover expands it into a labelled pill; the chevron flips direction.
 */
export default function PanelToggle({ open, onToggle, showTip }) {
  return (
    <div
      className="pointer-events-none absolute top-1/2 z-30 hidden -translate-y-1/2 md:block"
      style={{
        left: open ? 'calc(var(--pw) + 0.75rem - 1.375rem)' : '0.75rem',
        transition: 'left 560ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <button
        onClick={onToggle}
        aria-label={open ? 'Hide side panel' : 'Show side panel'}
        aria-expanded={open}
        aria-keyshortcuts="["
        className="group pointer-events-auto flex h-11 w-11 items-center overflow-hidden rounded-full bg-crisp text-forest shadow-[0_8px_24px_-4px_rgba(0,50,34,0.45)] ring-1 ring-forest/15 transition-[width,background-color,transform] duration-300 ease-out hover:w-[7.25rem] hover:bg-forest hover:text-white active:scale-95"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? '' : 'rotate-180'}`}
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </span>
        <span className="whitespace-nowrap pr-4 text-xs font-bold opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {open ? 'Hide panel' : 'Show panel'}
        </span>
      </button>
      {showTip && open && (
        <div className="caff-tip pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-forest px-3 py-2 text-xs font-semibold text-white shadow-xl">
          See only the map — click, or press <kbd className="rounded bg-white/20 px-1.5 font-bold">[</kbd>
        </div>
      )}
    </div>
  );
}
