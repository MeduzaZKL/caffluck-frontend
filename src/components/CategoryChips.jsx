export default function CategoryChips({ chips, active, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Menu categories"
      className="no-scrollbar flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 py-1"
    >
      {chips.map((chip) => {
        const isActive = chip.key === active;
        return (
          <button
            key={chip.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(chip.key)}
            className={`shrink-0 snap-start whitespace-nowrap rounded-full bg-crisp px-4 py-2 text-sm font-semibold text-forest shadow-sm ring-2 transition ${
              isActive ? 'ring-mint' : 'ring-transparent hover:ring-mint/40'
            }`}
          >
            {chip.emoji} {chip.label} ({chip.count} {chip.count === 1 ? "Menu" : "Menus"})
          </button>
        );
      })}
    </div>
  );
}
