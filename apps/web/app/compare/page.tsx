import { CountryCompare } from "@/components/country-compare";

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl text-navy-950">Compare countries</h1>
      <p className="mt-4 max-w-2xl text-navy-800/80">
        Side-by-side comparison of cost, visa complexity, lifestyle scores, and
        long-stay potential. All figures are planning estimates.
      </p>
      <div className="mt-10">
        <CountryCompare />
      </div>
    </div>
  );
}
