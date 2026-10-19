// Pulsing placeholder pins shown over the map while cafés are loading.
const SPOTS = [
  ['22%', '30%'], ['58%', '24%'], ['40%', '46%'], ['72%', '52%'], ['28%', '66%'], ['62%', '72%'], ['48%', '34%'],
];

export default function SkeletonPins() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">
      {SPOTS.map(([left, top], i) => (
        <div key={i} className="absolute animate-pulse" style={{ left, top, animationDelay: `${i * 120}ms` }}>
          <div className="h-9 w-9 rounded-full border-[3px] border-white bg-forest/25 shadow" />
          <div className="mx-auto -mt-0.5 h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-forest/25" />
          <div className="mt-1 h-2.5 w-14 rounded-full bg-forest/15" />
        </div>
      ))}
    </div>
  );
}
