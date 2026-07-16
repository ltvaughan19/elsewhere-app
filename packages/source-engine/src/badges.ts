import type {
  ConfidenceLevel,
  ReviewStatus,
  SourceType,
} from "@expat-atlas/types";

export interface ClaimDisplayMeta {
  confidenceLevel: ConfidenceLevel;
  reviewStatus: ReviewStatus;
  lastVerifiedAt?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceType?: SourceType;
  requiresProfessionalReview?: boolean;
}

export function getClaimBadgeVariant(
  meta: ClaimDisplayMeta,
): "official" | "demo" | "risk" | "default" {
  const reviewed =
    meta.reviewStatus === "human_reviewed" ||
    meta.reviewStatus === "partner_reviewed";
  const hasEvidence = Boolean(
    meta.sourceName && meta.sourceUrl && meta.lastVerifiedAt,
  );

  if (!reviewed || !hasEvidence || meta.confidenceLevel === "low") {
    return "demo";
  }
  if (meta.requiresProfessionalReview) return "risk";
  if (
    meta.sourceType === "official_government" ||
    meta.sourceType === "embassy_consulate" ||
    meta.sourceType === "immigration_authority"
  ) {
    return "official";
  }
  return "default";
}

export function formatVerificationLabel(meta: ClaimDisplayMeta): string {
  if (
    meta.reviewStatus !== "human_reviewed" &&
    meta.reviewStatus !== "partner_reviewed"
  ) {
    return "Needs verification";
  }
  if (!meta.sourceUrl || !meta.lastVerifiedAt) return "Evidence incomplete";
  const date = new Date(meta.lastVerifiedAt);
  return `Last verified ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

export const MANUAL_ADAPTER = "manual" as const;
