"use client";

import dynamic from "next/dynamic";

const EarthSpline = dynamic(
  () =>
    import("@/components/earth-spline").then((m) => ({ default: m.EarthSpline })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] items-center justify-center text-xs text-cream/40 md:min-h-[420px]">
        Loading Earth…
      </div>
    ),
  },
);

export function EarthSplineLazy({ className }: { className?: string }) {
  return <EarthSpline className={className} />;
}
