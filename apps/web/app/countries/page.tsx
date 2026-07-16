import type { Metadata } from "next";
import { CountryPortalCard } from "@/components/country-portal/CountryPortalCard";
import { getCountryPortalCards } from "@/lib/country-portals/queries";

export const metadata: Metadata = {
  title: "Country portals | Elsewhere",
  description:
    "Explore Elsewhere's country portal foundation for the Philippines, Thailand, and Mexico, with reviewed releases replacing clearly labeled previews.",
  alternates: { canonical: "https://elsewhereplan.com/countries" },
};

export const revalidate = 3600;

export default async function CountriesPage() {
  const portals = await getCountryPortalCards();
  const publishedCount = portals.filter(
    (portal) => portal.publicationState === "published",
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-20">
      <header className="grid gap-12 border-b border-sand-200 pb-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end lg:gap-20 sm:pb-16">
        <div className="max-w-3xl">
          <p className="elsewhere-eyebrow">Country field guides</p>
          <h1 className="mt-5 max-w-2xl font-display text-5xl leading-[0.98] text-cream sm:text-7xl">
            One portal for the whole move.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-navy-800">
            Entry, money, housing, healthcare, work, safety, arrival, and
            long-term living—organized into one calm sequence with the source
            beside the guidance.
          </p>
        </div>

        <section
          aria-label="Portal publication status"
          className="border-l border-sand-200 pl-5 text-sm"
        >
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-soft">
            Library status
          </p>
          <p className="mt-3 font-display text-4xl text-cream">
            {publishedCount}
            <span className="ml-2 font-sans text-sm text-soft">
              of {portals.length} released
            </span>
          </p>
          <p className="mt-3 leading-6 text-navy-800">
            Built for international readers, with personal context layered in
            before guidance is treated as relevant.
          </p>
        </section>
      </header>

      <div className="mt-8" aria-label="Country dossiers">
        {portals.map((portal) => (
          <CountryPortalCard key={portal.slug} portal={portal} />
        ))}
      </div>

      <aside className="mt-12 grid gap-3 border-l-2 border-accent-cool pl-5 text-sm leading-7 text-navy-800 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <strong className="font-medium text-cream">Why previews stay sparse</strong>
        <p className="max-w-3xl">
          Elsewhere does not fill gaps with uncited prices, rankings, or visa
          summaries. A dossier becomes public only after its guidance, sources,
          professional checks where required, and page composition pass review.
        </p>
      </aside>
    </div>
  );
}
