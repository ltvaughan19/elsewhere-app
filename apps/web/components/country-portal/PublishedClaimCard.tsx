import type { PortalClaim } from "@/lib/country-portals/types";

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

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

function scopeTags(applicability: Record<string, unknown>): string[] {
  const fields: Array<[string, unknown]> = [
    ["Citizenship", applicability.citizenshipCountryCodes],
    ["Residence", applicability.residenceCountryCodes],
    ["Purpose", applicability.purposes],
    ["Duration", applicability.durationBands],
    ["Household", applicability.householdTags],
  ];

  return fields.flatMap(([label, value]) => {
    if (!Array.isArray(value)) return [];
    const entries = value.filter(
      (item): item is string => typeof item === "string" && Boolean(item.trim()),
    );
    return entries.length
      ? [`${label}: ${entries.map(humanize).join(", ")}`]
      : [];
  });
}

export function PublishedClaimCard({ claim }: { claim: PortalClaim }) {
  const applicabilityTags = scopeTags(claim.applicability);
  const primaryCitation =
    claim.citations.find((citation) => citation.role === "primary") ??
    claim.citations[0];
  const checkedDate = formatDate(primaryCitation?.lastVerifiedAt);
  const isHighImpact =
    claim.riskLevel === "high" || claim.riskLevel === "critical";

  return (
    <article className="border-y border-sand-200 bg-void-card px-5 py-6 sm:px-7 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-xs">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-navy-800">
          <span className="inline-flex items-center gap-2 font-medium text-cream">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />
            Official evidence
          </span>
          {checkedDate ? <span>· Checked {checkedDate}</span> : null}
          {primaryCitation ? <span>· {primaryCitation.publisher}</span> : null}
        </p>
        <p className={isHighImpact ? "font-medium text-danger" : "text-soft"}>
          {isHighImpact ? "Verify before acting" : `${claim.confidenceLevel} confidence`}
          {claim.requiresProfessionalReview ? " · Professionally reviewed" : ""}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-soft">
          Published guidance
        </p>
        <p className="text-lg leading-8 text-cream">{claim.summary}</p>
      </div>

      {claim.userMeaning ? (
        <div className="mt-6 grid gap-3 border-l-2 border-accent-cool pl-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-6 sm:pl-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-soft">
            Planning meaning
          </p>
          <p className="text-sm leading-7 text-navy-800">
            {claim.userMeaning}
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-soft">
          Who this covers
        </p>
        {applicabilityTags.length ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {applicabilityTags.map((tag) => (
              <li
                key={tag}
                className="border-b border-sand-300 pb-1 text-xs text-navy-800"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs leading-5 text-navy-800">
            No narrower audience tags are attached to this claim. That does not
            mean the claim applies to every person or situation.
          </p>
        )}
      </div>

      <details className="group mt-7 border-y border-sand-200">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-cream marker:hidden">
          <span>
            View official evidence
            <span className="ml-2 font-normal text-soft">
              {claim.citations.length} {claim.citations.length === 1 ? "source" : "sources"}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="text-lg text-accent-cool transition-transform duration-[180ms] group-open:rotate-45"
          >
            +
          </span>
        </summary>
        <ul className="space-y-4 border-t border-sand-200 py-5">
          {claim.citations.map((citation) => {
            const verifiedDate = formatDate(citation.lastVerifiedAt);
            return (
              <li
                key={citation.id}
                className="grid gap-1 text-sm leading-6 text-navy-800 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6"
              >
                <span className="text-xs capitalize text-soft">
                  {humanize(citation.role)} source
                </span>
                <span>
                  <a
                    href={citation.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent-cool underline decoration-accent-cool/40 underline-offset-4"
                  >
                    {citation.sourceTitle}
                  </a>
                  <span className="mt-0.5 block text-xs text-soft">
                    {citation.publisher}, {humanize(citation.authorityLevel)}
                    {verifiedDate ? `, verified ${verifiedDate}` : ""}
                    {citation.exactLocator ? `, ${citation.exactLocator}` : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </details>

      <div className="mt-5 grid gap-4 sm:grid-cols-[8.5rem_minmax(0,1fr)_auto] sm:items-start sm:gap-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-soft">
          Next action
        </p>
        <p className="max-w-2xl text-xs leading-5 text-navy-800">
          Open the cited source and confirm the rule for your passport, current
          residence, purpose, and timing before acting.
        </p>
        <a
          href="#report-outdated"
          className="inline-flex min-h-11 items-center text-xs font-medium text-accent-cool underline decoration-accent-cool/40 underline-offset-4 sm:-mt-3"
        >
          Flag a problem
        </a>
      </div>
    </article>
  );
}
