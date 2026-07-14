import type { SourceClaimDisplay } from "@expat-atlas/types";
import { Badge } from "./badge";
import { cn } from "./utils";

function verificationLabel(claim: SourceClaimDisplay): string {
  if (claim.reviewStatus === "needs_review" || claim.reviewStatus === "draft") {
    return "Needs verification";
  }
  if (!claim.lastVerifiedAt) return "Not yet verified";
  const date = new Date(claim.lastVerifiedAt);
  return `Last verified ${date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
}

function badgeVariant(
  claim: SourceClaimDisplay,
): "official" | "demo" | "risk" | "default" {
  if (
    claim.reviewStatus === "needs_review" ||
    claim.reviewStatus === "draft" ||
    claim.confidenceLevel === "low"
  ) {
    return "demo";
  }
  if (claim.requiresProfessionalReview) return "risk";
  return "official";
}

/**
 * Canonical display for official / planning claims.
 * Never upgrade confidence without source metadata + review status.
 */
export function SourceClaimCard({
  claim,
  className,
}: {
  claim: SourceClaimDisplay;
  className?: string;
}) {
  const needsVerification =
    claim.reviewStatus === "needs_review" ||
    claim.reviewStatus === "draft" ||
    claim.confidenceLevel === "low";

  return (
    <article
      className={cn(
        "rounded-xl border border-sand-200 bg-void-card p-5 shadow-ea",
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge variant={badgeVariant(claim)}>{verificationLabel(claim)}</Badge>
        <Badge variant="default">{claim.confidenceLevel} confidence</Badge>
        {claim.requiresProfessionalReview ? (
          <Badge variant="risk">May need professional review</Badge>
        ) : null}
        {needsVerification ? (
          <Badge variant="demo">Planning estimate</Badge>
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-navy-950">{claim.plainEnglishSummary}</p>
      <dl className="mt-4 space-y-1 text-xs text-navy-800">
        {claim.sourceName ? (
          <div>
            <dt className="inline font-medium text-cream">Source: </dt>
            <dd className="inline">
              {claim.sourceUrl ? (
                <a
                  href={claim.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-cool underline"
                >
                  {claim.sourceName}
                </a>
              ) : (
                claim.sourceName
              )}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="inline font-medium text-cream">Type: </dt>
          <dd className="inline">{claim.sourceType.replaceAll("_", " ")}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-navy-800">
        General planning information only. Verify with official sources or a
        licensed professional before acting.
      </p>
    </article>
  );
}
