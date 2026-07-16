import type { Metadata } from "next";
import Link from "next/link";
import { CountryPortalCard } from "@/components/country-portal/CountryPortalCard";
import { getCountryPortalCards } from "@/lib/country-portals/queries";

export const metadata: Metadata = {
  title: "Countries | Elsewhere",
  description:
    "Research the Philippines, Thailand, and Mexico with source-aware country guides and clearly labeled publication status.",
  alternates: { canonical: "https://elsewhereplan.com/countries" },
};

export const revalidate = 3600;

export default async function CountriesPage() {
  const portals = await getCountryPortalCards();

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-16">
      <header className="grid gap-8 border-b border-sand-200 pb-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end lg:gap-16 sm:pb-12">
        <div className="max-w-3xl">
          <p className="elsewhere-eyebrow">Country research</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.02] text-cream sm:text-6xl">
            One portal for the whole move.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Start with the decisions that shape a move: entry, long stays, money, healthcare, housing, work, and daily life.
          </p>
        </div>

        <aside className="border-l border-sand-200 pl-5 text-sm leading-6 text-muted">
          <p className="font-medium text-cream">A deliberately small library</p>
          <p className="mt-2">
            Guidance stays unavailable until its sources and risk-sensitive claims pass review.
          </p>
          <Link href="/trust" className="mt-3 inline-flex min-h-11 items-center font-medium text-accent-cool hover:text-cream">
            How review works <span aria-hidden="true" className="ml-2">&rarr;</span>
          </Link>
        </aside>
      </header>

      <section className="mt-2" aria-label="Country guides">
        {portals.map((portal) => (
          <CountryPortalCard key={portal.slug} portal={portal} />
        ))}
      </section>

      <section className="mt-12 grid gap-5 border-t border-sand-200 pt-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div>
          <h2 className="text-xl font-medium text-cream">Still deciding where to begin?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Compare the initial countries side by side, or use Visa Compass to organize the questions you need to verify.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6">
          <Link href="/compare" className="inline-flex min-h-11 items-center text-sm font-medium text-accent-cool hover:text-cream">
            Compare countries <span aria-hidden="true" className="ml-2">&rarr;</span>
          </Link>
          <Link href="/visa-compass" className="inline-flex min-h-11 items-center text-sm font-medium text-accent-cool hover:text-cream">
            Open Visa Compass <span aria-hidden="true" className="ml-2">&rarr;</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
