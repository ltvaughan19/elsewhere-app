import Link from "next/link";
import type { CountryPortalCardData } from "@/lib/country-portals/types";
import { CountryIdentityMark } from "@/components/country-portal/CountryIdentityMark";

const countryContext: Record<string, { region: string; scope: string }> = {
  philippines: {
    region: "Southeast Asia",
    scope: "Entry, long-stay pathways, money, healthcare, housing, and arrival planning",
  },
  thailand: {
    region: "Southeast Asia",
    scope: "Entry, long stays, work, healthcare, housing, and daily-life planning",
  },
  mexico: {
    region: "North America",
    scope: "Entry, residency, money, healthcare, housing, and cross-border planning",
  },
};

export function CountryPortalCard({ portal }: { portal: CountryPortalCardData }) {
  const isPublished = portal.publicationState === "published";
  const context = countryContext[portal.slug] ?? {
    region: "Country guide",
    scope: "Practical research for entry, money, healthcare, housing, and daily life",
  };

  return (
    <article className="group border-b border-sand-200 py-7 sm:py-9">
      <div className="grid gap-5 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-7">
        <CountryIdentityMark isoCode={portal.isoCode} countryName={portal.name} size="small" />

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="font-display text-3xl text-cream sm:text-4xl">{portal.name}</h2>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-soft">
              {isPublished ? "Reviewed guide" : "Preview available"}
            </p>
          </div>
          <p className="mt-2 text-sm text-soft">{context.region}</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
            {context.scope}
          </p>
        </div>

        <Link
          href={`/countries/${portal.slug}`}
          className="inline-flex min-h-11 items-center justify-self-start text-sm font-medium text-accent-cool underline decoration-accent-cool/40 underline-offset-4 sm:justify-self-end"
          aria-label={`View guide: ${portal.name}`}
        >
          View guide
          <span className="field-guide-link-arrow ml-2" aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </article>
  );
}
