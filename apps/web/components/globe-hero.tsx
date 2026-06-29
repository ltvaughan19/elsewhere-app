export function GlobeHero() {
  return (
    <div
      className="relative mx-auto flex h-64 w-64 items-center justify-center md:h-80 md:w-80"
      aria-hidden
    >
      <div className="absolute inset-0 animate-pulse rounded-full bg-ocean-500/20 blur-2xl" />
      <div className="relative h-full w-full rounded-full border border-ocean-400/30 bg-gradient-to-br from-navy-800 via-ocean-500/40 to-jungle-600/30 shadow-glow">
        <div className="absolute inset-4 rounded-full border border-ivory-50/10" />
        <div className="absolute left-1/4 top-1/3 h-16 w-24 rotate-12 rounded-full bg-jungle-600/30 blur-sm" />
        <div className="absolute bottom-1/4 right-1/4 h-12 w-20 -rotate-6 rounded-full bg-ocean-400/25 blur-sm" />
        <svg
          className="absolute inset-0 h-full w-full text-ivory-50/20"
          viewBox="0 0 200 200"
        >
          <ellipse cx="100" cy="100" rx="90" ry="90" fill="none" stroke="currentColor" />
          <path
            d="M10 100 Q100 40 190 100 Q100 160 10 100"
            fill="none"
            stroke="currentColor"
          />
          <path
            d="M100 10 Q160 100 100 190 Q40 100 100 10"
            fill="none"
            stroke="currentColor"
          />
        </svg>
      </div>
      <div className="pointer-events-none absolute -right-2 top-8 rounded-full bg-gold-400/90 px-2 py-1 text-[10px] font-medium text-navy-950">
        PH
      </div>
      <div className="pointer-events-none absolute bottom-12 -left-2 rounded-full bg-jungle-600/90 px-2 py-1 text-[10px] font-medium text-white">
        MX
      </div>
    </div>
  );
}
