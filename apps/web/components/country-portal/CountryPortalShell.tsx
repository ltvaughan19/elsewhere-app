import Link from "next/link";
import { TrustDisclaimer } from "@expat-atlas/ui";
import type { CountryPortal } from "@/lib/country-portals/types";
import { CountryIdentityMark } from "@/components/country-portal/CountryIdentityMark";
import { PortalSection } from "@/components/country-portal/PortalSection";
import { PortalSectionNav } from "@/components/country-portal/PortalSectionNav";

const previewStages = [
  {
    title: "Enter and stay",
    description: "Entry documents, legal stay pathways, residency, work rules, and family circumstances.",
  },
  {
    title: "Settle the essentials",
    description: "Healthcare, housing, banking, communications, transportation, and official contacts.",
  },
  {
    title: "Understand the real cost",
    description: "Taxes, recurring expenses, realistic budgets, and the money decisions that need verification.",
  },
  {
    title: "Live well day to day",
    description: "Safety, culture, pets, local routines, recent changes, and clear next actions.",
  },
];

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

function CountryPortalPreview({ portal }: { portal: CountryPortal }) {
  const previewPurpose =
    portal.slug === "philippines"
      ? "Use one organized guide to map the questions that shape a move to the Philippines."
      : portal.slug === "thailand"
        ? "Use one organized guide to map the questions that shape a move to Thailand."
        : "Use one organized guide to map the questions that shape a move to Mexico.";

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-7 sm:px-6 sm:pb-24 sm:pt-10">
      <nav aria-label="Breadcrumb" className="text-sm text-soft">
        <ol className="flex min-h-11 items-center gap-2">
          <li>
            <Link href="/countries" className="inline-flex min-h-11 items-center transition-colors duration-150 hover:text-cream">
              Countries
            </Link>
          </li>
          <li aria-hidden="true" className="text-sand-300">/</li>
          <li aria-current="page" className="text-muted">{portal.name}</li>
        </ol>
      </nav>

      <header className="mt-6 grid gap-9 border-y border-sand-200 py-9 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end lg:gap-16 sm:py-12">
        <div>
          <div className="flex items-center gap-5 sm:gap-7">
            <CountryIdentityMark isoCode={portal.isoCode} countryName={portal.name} />
            <div className="min-w-0">
              <p className="elsewhere-eyebrow">Country guide · {portal.isoCode}</p>
              <h1 className="mt-2 font-display text-5xl leading-none text-cream sm:text-6xl">{portal.name}</h1>
            </div>
          </div>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-cream">{previewPurpose}</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            The outline connects entry, long stays, money, healthcare, housing, work, safety, and arrival planning. Country-specific answers remain unavailable until reviewed evidence is released.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-6">
            <Link
              href={`/app/onboarding?destination=${portal.slug}`}
              className="inline-flex min-h-12 items-center rounded-md bg-accent-sand px-5 text-sm font-medium text-accent-ink hover:bg-accent-sand-hover"
            >
              Add {portal.name} to my plan
            </Link>
            <Link
              href={`/compare?country=${portal.slug}`}
              className="inline-flex min-h-12 items-center px-1 text-sm font-medium text-accent-cool hover:text-cream"
            >
              Compare countries <span aria-hidden="true" className="ml-2">&rarr;</span>
            </Link>
          </div>
        </div>

        <aside className="border-l border-sand-200 pl-5 text-sm leading-6 text-muted">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-soft">Portal preview</p>
          <p className="mt-3 font-medium text-cream">Research outline available</p>
          <p className="mt-2">
            No country guidance has been released yet. The outline below shows what Elsewhere is preparing without presenting unreviewed claims as advice.
          </p>
          <Link href="/trust" className="mt-3 inline-flex min-h-11 items-center font-medium text-accent-cool hover:text-cream">
            How release review works <span aria-hidden="true" className="ml-2">&rarr;</span>
          </Link>
        </aside>
      </header>

      <div className="mt-10 max-w-4xl">
        <div className="min-w-0">
          <header className="border-b border-sand-200 pb-7">
            <p className="elsewhere-eyebrow">Research outline</p>
            <h2 className="mt-3 text-2xl font-medium text-cream">What this guide will help you work through</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              Use this as a question map for now. Factual answers will appear only as reviewed guidance with source dates and applicability.
            </p>
          </header>

          <ol className="mt-2">
            {previewStages.map((stage, index) => (
              <li key={stage.title}>
                <section className="border-b border-sand-200 py-6 sm:py-7">
                  <div className="grid gap-3 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-start sm:gap-5">
                    <span className="field-guide-index pt-1 text-xs text-soft" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-lg font-medium text-cream">{stage.title}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{stage.description}</p>
                    </div>
                  </div>
                </section>
              </li>
            ))}
          </ol>

          <section className="mt-10 border-l-2 border-accent-sand pl-5">
            <h2 className="text-xl font-medium text-cream">Need a plan before the guide is released?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
              Elsewhere can organize your documents, timing, budget, and research questions without inventing destination requirements.
            </p>
            <Link
              href={`/app/onboarding?destination=${portal.slug}`}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-accent-cool hover:text-cream"
            >
              Start a personal plan <span aria-hidden="true" className="ml-2">&rarr;</span>
            </Link>
          </section>

          <TrustDisclaimer className="mt-10 max-w-3xl" />
        </div>
      </div>
    </div>
  );
}

export function CountryPortalShell({ portal }: { portal: CountryPortal }) {
  const isPublished = portal.publicationState === "published";
  if (!isPublished) return <CountryPortalPreview portal={portal} />;
  const releasedDate = formatDate(portal.publishedAt);
  const reviewedSectionCount = portal.sections.filter(
    (section) => section.status === "published",
  ).length;
  const completion = Math.round(
    (reviewedSectionCount / Math.max(portal.sections.length, 1)) * 100,
  );

  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-7 sm:px-6 sm:pb-28 sm:pt-10">
      <nav aria-label="Breadcrumb" className="text-sm text-soft">
        <ol className="flex items-center gap-2">
          <li>
            <Link
              href="/countries"
              className="transition-colors duration-[180ms] hover:text-cream"
            >
              Country field guides
            </Link>
          </li>
          <li aria-hidden="true" className="text-sand-300">
            /
          </li>
          <li aria-current="page" className="text-navy-800">
            {portal.name}
          </li>
        </ol>
      </nav>

      <header className="field-guide-masthead mt-7 rounded-[1.25rem]">
        <div className="grid gap-10 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end lg:gap-14 lg:px-10 lg:py-12">
          <div>
            <div className="flex items-center gap-5 sm:gap-7">
              <CountryIdentityMark
                isoCode={portal.isoCode}
                countryName={portal.name}
              />
              <div className="min-w-0">
                <p className="elsewhere-eyebrow">
                  Country dossier · {portal.isoCode}
                </p>
                <h1 className="mt-2 font-display text-5xl leading-none text-cream sm:text-6xl">
                  {portal.name}
                </h1>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-navy-800">
              <span className="inline-flex items-center gap-2 font-medium text-cream">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${
                    isPublished ? "bg-success" : "border border-sand-300"
                  }`}
                />
                {isPublished ? "Reviewed public release" : "Portal preview"}
              </span>
              <span aria-hidden="true" className="text-sand-300">
                ·
              </span>
              <span className="capitalize">{portal.coverageLevel} coverage</span>
              {portal.releaseNumber ? (
                <>
                  <span aria-hidden="true" className="text-sand-300">
                    ·
                  </span>
                  <span>Release {portal.releaseNumber}</span>
                </>
              ) : null}
            </div>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-cream">
              {portal.summary}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-navy-800">
              {portal.overview}
            </p>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3">
              <Link
                href={`/app/onboarding?destination=${portal.slug}`}
                className="inline-flex min-h-11 items-center rounded-lg bg-accent-sand px-5 text-sm font-medium text-accent-ink transition-colors duration-[180ms] hover:bg-accent-sand-hover"
              >
                Build my planning path
              </Link>
              <Link
                href={`/compare?country=${portal.slug}`}
                className="inline-flex min-h-11 items-center rounded-lg border border-sand-300 px-5 text-sm font-medium text-cream transition-colors duration-[180ms] hover:bg-void-elevated"
              >
                Compare destinations
              </Link>
              <a
                href="#sources-and-changes"
                className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-accent-cool underline decoration-accent-cool/40 underline-offset-4"
              >
                Inspect evidence
              </a>
            </div>
          </div>

          <aside
            className="border-t border-sand-200 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0"
            aria-label="Portal trust status"
          >
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-soft">
              What is public
            </p>
            <p className="mt-3 text-sm leading-6 text-navy-800">
              {isPublished
                ? "Visible guidance is pinned to the current reviewed release. Each claim keeps its official source beside it."
                : "This page exposes structure only. It contains no released country guidance, prices, eligibility claims, or source endorsements."}
            </p>
            <div className="mt-5" aria-label={`${completion}% of sections released`}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="text-soft">Sections released</span>
                <span className="field-guide-index font-medium text-cream">
                  {reviewedSectionCount} / {portal.sections.length}
                </span>
              </div>
              <div className="mt-2 h-px overflow-hidden bg-sand-200">
                <div
                  className="h-full bg-accent-cool"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-sand-200 pt-4 text-xs">
              <div>
                <dt className="text-soft">Published</dt>
                <dd className="mt-1 font-medium text-cream">
                  {releasedDate ?? "Not yet"}
                </dd>
              </div>
              <div>
                <dt className="text-soft">Sources shown</dt>
                <dd className="mt-1 font-medium text-cream">
                  {portal.sources.length || "None yet"}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </header>

      <section
        className="mt-6 grid gap-4 border-y border-sand-200 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
        aria-labelledby="viewer-context-title"
      >
        <div className="grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-5">
          <p
            id="viewer-context-title"
            className="text-xs font-medium uppercase tracking-[0.14em] text-soft"
          >
            Planning lens
          </p>
          <div>
            <p className="text-sm font-medium text-cream">
              General international planning · Personal context not set
            </p>
            <p className="mt-1 text-xs leading-5 text-soft">
              Passport, current residence, purpose, household, and duration can
              change which guidance is relevant.
            </p>
          </div>
        </div>
        <Link
          href={`/app/onboarding?destination=${portal.slug}`}
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-accent-cool underline decoration-accent-cool/40 underline-offset-4"
        >
          Personalize this guide
          <span className="field-guide-link-arrow ml-2" aria-hidden="true">
            &rarr;
          </span>
        </Link>
      </section>

      <div className="mt-8 grid gap-x-8 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_16rem] xl:gap-x-10">
        <PortalSectionNav sections={portal.sections} />

        <div className="min-w-0">
          {portal.sections.map((section, index) => (
            <PortalSection
              key={section.slug}
              portal={portal}
              section={section}
              position={index + 1}
            />
          ))}

          <section className="mt-14 border-y border-sand-200 py-9 sm:py-11">
            <p className="elsewhere-eyebrow">Your next step</p>
            <div className="mt-3 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div>
                <h2 className="max-w-xl font-display text-3xl text-cream sm:text-4xl">
                  Turn research into your own sequence.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-navy-800">
                  Add your passport, timing, budget, household, and purpose
                  before treating country guidance as relevant to your move.
                </p>
              </div>
              <Link
                href={`/app/onboarding?destination=${portal.slug}`}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent-sand px-5 text-sm font-medium text-accent-ink transition-colors duration-[180ms] hover:bg-accent-sand-hover"
              >
                Start my planning path
              </Link>
            </div>
          </section>

          <TrustDisclaimer className="mt-8 max-w-3xl" />
        </div>

        <aside className="hidden xl:block" aria-label="How to use this guide">
          <div className="sticky top-24 space-y-7">
            <section className="border-t border-sand-200 pt-5">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-soft">
                Read it in layers
              </p>
              <ol className="mt-4 space-y-4 text-sm text-navy-800">
                {[
                  "Understand the public rule",
                  "Check who it applies to",
                  "Open the official evidence",
                  "Add the action to your plan",
                ].map((step, index) => (
                  <li key={step} className="grid grid-cols-[1.5rem_1fr] gap-2">
                    <span className="field-guide-index text-[0.68rem] text-soft">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="border-t border-sand-200 pt-5">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-soft">
                Evidence promise
              </p>
              <p className="mt-3 text-sm leading-6 text-navy-800">
                No country claim becomes guidance merely because it was found
                online. Public claims must be cited, reviewed, and released.
              </p>
              <Link
                href="/trust"
                className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-accent-cool underline decoration-accent-cool/40 underline-offset-4"
              >
                See the trust model
              </Link>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
