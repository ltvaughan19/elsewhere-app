import Link from "next/link";
import type {
  CountryPortal,
  CountryPortalSection,
} from "@/lib/country-portals/types";
import { PortalContentBlock } from "@/components/country-portal/PortalContentBlock";
import { PublishedClaimCard } from "@/components/country-portal/PublishedClaimCard";
import { SourceLedger } from "@/components/country-portal/SourceLedger";

function statusLabel(status: CountryPortalSection["status"]): string {
  if (status === "published") return "Reviewed content";
  if (status === "partial") return "Partial coverage";
  return "In review";
}

export function PortalSection({
  portal,
  section,
  position,
}: {
  portal: CountryPortal;
  section: CountryPortalSection;
  position: number;
}) {
  const hasReleasedContent =
    section.blocks.length > 0 || section.claims.length > 0;

  return (
    <section
      id={section.slug}
      className="scroll-mt-32 border-b border-sand-200 py-12 first:pt-2 sm:py-16"
      aria-labelledby={`${section.slug}-title`}
    >
      <div className="grid gap-5 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-5">
        <p className="field-guide-index pt-1 text-xs text-soft" aria-hidden="true">
          {String(position).padStart(2, "0")}
        </p>
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="elsewhere-eyebrow">Field guide</p>
            <span aria-hidden="true" className="text-sand-300">
              ·
            </span>
            <p className="inline-flex items-center gap-2 text-xs text-soft">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  section.status === "published"
                    ? "bg-success"
                    : "border border-sand-300"
                }`}
              />
              {statusLabel(section.status)}
            </p>
          </div>
          <h2
            id={`${section.slug}-title`}
            className="mt-3 font-display text-3xl text-cream sm:text-4xl"
          >
            {section.title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-navy-800">
            {section.description}
          </p>
        </div>
      </div>

      {section.actions?.length ? (
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 sm:ml-[4rem]">
          {section.actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex min-h-11 items-center text-sm font-medium text-accent-cool underline decoration-accent-cool/40 underline-offset-4"
            >
              {action.label}
              <span className="field-guide-link-arrow ml-2" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-8 space-y-6 sm:ml-[4rem]">
        {section.blocks.map((block) => (
          <PortalContentBlock key={block.versionId} block={block} />
        ))}
        {section.claims.map((claim) => (
          <PublishedClaimCard key={claim.versionId} claim={claim} />
        ))}

        {section.display === "source_ledger" ? (
          <SourceLedger portal={portal} />
        ) : null}

        {!hasReleasedContent && section.display === "content" ? (
          <div className="border-l-2 border-sand-200 pl-4 sm:pl-5">
            <p className="text-sm font-medium text-cream">
              Waiting for a reviewed release
            </p>
            <p className="mt-2 max-w-xl text-sm leading-7 text-navy-800">
              The heading shows planned coverage, not an answer. Elsewhere will
              add guidance only after official-source capture, human review,
              and release approval.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
