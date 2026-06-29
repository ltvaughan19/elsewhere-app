import type { ConfidenceLevel, ReviewStatus } from "@expat-atlas/types";

export interface ClaimDisplayMeta {
  confidenceLevel: ConfidenceLevel;
  reviewStatus: ReviewStatus;
  lastVerifiedAt?: string;
  sourceName?: string;
  sourceUrl?: string;
  requiresProfessionalReview?: boolean;
}

export function getClaimBadgeVariant(
  meta: ClaimDisplayMeta,
): "official" | "demo" | "risk" | "default" {
  if (meta.reviewStatus === "needs_review" || meta.reviewStatus === "draft") {
    return "demo";
  }
  if (meta.confidenceLevel === "low") return "demo";
  if (meta.requiresProfessionalReview) return "risk";
  return "official";
}

export function formatVerificationLabel(meta: ClaimDisplayMeta): string {
  if (meta.reviewStatus === "needs_review") return "Needs verification";
  if (!meta.lastVerifiedAt) return "Not yet verified";
  const date = new Date(meta.lastVerifiedAt);
  return `Last verified ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

export const MANUAL_ADAPTER = "manual" as const;
