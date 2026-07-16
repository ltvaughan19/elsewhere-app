import Link from "next/link";
import type { CountryPortalCardData } from "@/lib/country-portals/types";
import { CountryIdentityMark } from "@/components/country-portal/CountryIdentityMark";

export function CountryPortalCard({
  portal,
}: {
  portal: CountryPortalCardData;
}) {
  const isPublished = portal.publicationState === "published";

  return (
    <article className="group border-t border-sand-200 py-7 last:border-b sm:py-9">
      <div className="grid gap-5 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-7">
        <CountryIdentityMark
          isoCode={portal.isoCode}
          countryName={portal.name}
          size="small"
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="font-display text-3xl text-cream sm:text-4xl">
              {portal.name}
            </h2>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-soft">
              {isPublished
                ? `Release ${portal.releaseNumber ?? "current"}`
                : "Editorial preview"}
            </p>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-navy-800 sm:text-base">
            {portal.summary}
          </p>
          <p className="mt-3 text-xs leading-5 text-soft">
            {isPublished
              ? "Reviewed guidance and direct citations are available."
              : "Coverage is visible. Country guidance remains withheld until review."}
          </p>
        </div>

        <Link
          href={`/countries/${portal.slug}`}
          className="inline-flex min-h-11 items-center justify-self-start text-sm font-medium text-accent-cool underline decoration-accent-cool/40 underline-offset-4 sm:justify-self-end"
          aria-label={`Open the ${portal.name} country portal`}
        >
          Open dossier
          <span className="field-guide-link-arrow ml-2" aria-hidden="true">
            &rarr;
          </span>
        </Link>
      </div>
    </article>
  );
}
