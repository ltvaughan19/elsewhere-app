import Link from "next/link";
import type { CountryPortal } from "@/lib/country-portals/types";
import { ReportOutdatedForm } from "@/components/report-outdated-form";

function formatDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function SourceLedger({ portal }: { portal: CountryPortal }) {
  const isPublished = portal.publicationState === "published";

  return (
    <div className="space-y-8">
      <div className="border-y border-sand-200 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <p className="inline-flex items-center gap-2 font-medium text-cream">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                isPublished ? "bg-success" : "border border-sand-300"
              }`}
            />
            {isPublished ? "Current public release" : "No public release yet"}
          </p>
          {portal.releaseNumber ? (
            <p className="field-guide-index text-soft">
              Release {portal.releaseNumber}
            </p>
          ) : null}
        </div>
        <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-soft">
              Publication status
            </dt>
            <dd className="mt-1 font-medium text-cream">
              {isPublished ? "Published and current" : "Editorial preview"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-soft">
              Published
            </dt>
            <dd className="mt-1 font-medium text-cream">
              {formatDate(portal.publishedAt) ?? "Not yet released"}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-sm leading-7 text-navy-800">
          {isPublished
            ? "Only claims pinned to this release and backed by a current reviewed source are shown on this page."
            : "No country-specific claim or source is presented as reviewed guidance while this portal remains a preview."}
        </p>
      </div>

      {portal.sources.length ? (
        <div>
          <h3 className="font-display text-3xl text-cream">
            Sources used in this release
          </h3>
          <ul className="mt-5 divide-y divide-sand-200 border-y border-sand-200">
            {portal.sources.map((source, index) => {
              const verifiedDate = formatDate(source.lastVerifiedAt);
              return (
                <li
                  key={source.id}
                  className="grid gap-2 py-5 sm:grid-cols-[2rem_minmax(0,1fr)] sm:gap-4"
                >
                  <span className="field-guide-index pt-0.5 text-xs text-soft">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <a
                      href={source.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent-cool underline decoration-accent-cool/40 underline-offset-4"
                    >
                      {source.title}
                    </a>
                    <p className="mt-1 text-sm text-navy-800">
                      {source.publisher}, {source.authorityLevel.replaceAll("_", " ")}
                      {verifiedDate ? `, verified ${verifiedDate}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="border-l-2 border-sand-200 pl-5">
          <p className="font-medium text-cream">Source list not released</p>
          <p className="mt-2 text-sm leading-7 text-navy-800">
            Reviewed source links will appear here only after they are captured,
            reviewed, attached to a claim, and included in a public release.
          </p>
        </div>
      )}

      <div className="grid gap-4 border-t border-sand-200 pt-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <p className="max-w-xl text-sm text-navy-800">
          If a released source changes, Elsewhere routes the claim back through
          review before replacing the public release.
        </p>
        <Link
          href="/trust"
          className="inline-flex min-h-11 items-center text-sm font-medium text-accent-cool underline decoration-accent-cool/40 underline-offset-4"
        >
          How corrections work
          <span className="field-guide-link-arrow ml-2" aria-hidden="true">
            &rarr;
          </span>
        </Link>
      </div>

      {isPublished ? (
        <div id="report-outdated" className="scroll-mt-32">
          <ReportOutdatedForm
            countrySlug={portal.slug}
            countryName={portal.name}
          />
        </div>
      ) : null}
    </div>
  );
}
