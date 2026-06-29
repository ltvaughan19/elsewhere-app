import Link from "next/link";
import { CountryCard } from "@expat-atlas/ui";
import { SEED_COUNTRIES } from "@/lib/seed-countries";

export default function CountriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl text-navy-950">Country explorer</h1>
      <p className="mt-4 max-w-2xl text-navy-800/80">
        Compare destinations by cost, visa complexity, lifestyle fit, and
        long-stay potential. All figures are planning estimates.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {SEED_COUNTRIES.map((country) => (
          <Link key={country.slug} href={`/countries/${country.slug}`}>
            <CountryCard country={country} />
          </Link>
        ))}
      </div>
    </div>
  );
}
