import { CountryCompare } from "@/components/country-compare";

const supportedCountries = new Set(["philippines", "thailand", "mexico"]);

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country } = await searchParams;
  const initialCountry = country && supportedCountries.has(country) ? country : undefined;
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl text-navy-950">Compare countries</h1>
      <p className="mt-4 max-w-2xl text-navy-800/80">
        Side-by-side comparison of cost, visa complexity, lifestyle scores, and
        long-stay potential. All figures are planning estimates.
      </p>
      <div className="mt-10">
        <CountryCompare initialCountry={initialCountry} />
      </div>
    </div>
  );
}
