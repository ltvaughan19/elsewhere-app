import { describe, expect, it } from "vitest";
import { formatVerificationLabel, getClaimBadgeVariant } from "./badges";

const reviewedOfficial = {
  confidenceLevel: "high" as const,
  reviewStatus: "human_reviewed" as const,
  lastVerifiedAt: "2026-07-15T00:00:00.000Z",
  sourceName: "Immigration authority",
  sourceUrl: "https://example.gov/requirements",
  sourceType: "immigration_authority" as const,
};

describe("getClaimBadgeVariant", () => {
  it("never calls an unreviewed claim official", () => {
    expect(
      getClaimBadgeVariant({
        ...reviewedOfficial,
        reviewStatus: "needs_review",
      }),
    ).toBe("demo");
  });

  it("never calls a claim official when evidence metadata is incomplete", () => {
    expect(
      getClaimBadgeVariant({ ...reviewedOfficial, sourceUrl: undefined }),
    ).toBe("demo");
  });

  it("reserves the official badge for reviewed authority sources", () => {
    expect(getClaimBadgeVariant(reviewedOfficial)).toBe("official");
    expect(
      getClaimBadgeVariant({ ...reviewedOfficial, sourceType: "editorial" }),
    ).toBe("default");
  });

  it("surfaces professional-review risk even when evidence is complete", () => {
    expect(
      getClaimBadgeVariant({
        ...reviewedOfficial,
        requiresProfessionalReview: true,
      }),
    ).toBe("risk");
  });
});

describe("formatVerificationLabel", () => {
  it("calls missing evidence incomplete", () => {
    expect(
      formatVerificationLabel({ ...reviewedOfficial, sourceUrl: undefined }),
    ).toBe("Evidence incomplete");
  });

  it("labels drafts as needing verification", () => {
    expect(
      formatVerificationLabel({ ...reviewedOfficial, reviewStatus: "draft" }),
    ).toBe("Needs verification");
  });
});
