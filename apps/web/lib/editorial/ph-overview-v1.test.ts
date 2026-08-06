import { describe, expect, it } from "vitest";
import {
  evaluatePhOverviewReadiness,
  PH_OVERVIEW_CLAIM,
  PH_OVERVIEW_LEDGER_ID,
  PH_OVERVIEW_SOURCE,
  PH_OVERVIEW_WATCHOUTS,
} from "./ph-overview-v1";

describe("PH Overview thin package", () => {
  it("reuses PH-IMM-001 and never invents a new ledger URL", () => {
    expect(PH_OVERVIEW_LEDGER_ID).toBe("PH-IMM-001");
    expect(PH_OVERVIEW_SOURCE.canonicalUrl).toContain("evisa.gov.ph");
    expect(PH_OVERVIEW_CLAIM.ledgerId).toBe(PH_OVERVIEW_LEDGER_ID);
    expect(PH_OVERVIEW_CLAIM.categorySlug).toBe("editorial-context");
  });

  it("points the watchouts block at Fit Quiz + Entry/Stay without eligibility language", () => {
    expect(PH_OVERVIEW_WATCHOUTS.kind).toBe("watchouts");
    expect(PH_OVERVIEW_WATCHOUTS.body.toLowerCase()).toContain("fit quiz");
    expect(PH_OVERVIEW_WATCHOUTS.body.toLowerCase()).toContain("sunday action");
    expect(PH_OVERVIEW_WATCHOUTS.body.toLowerCase()).not.toContain("you qualify");
  });

  it("blocks publish readiness without MFA or pinned overview pieces", () => {
    expect(
      evaluatePhOverviewReadiness({
        canAuthor: true,
        aal: "aal1",
        sourceHasSnapshot: true,
        overviewClaimApprovedPinned: false,
        overviewWatchoutsApprovedPinned: false,
        releaseState: "draft",
      }),
    ).toEqual({
      staffRole: true,
      mfa: false,
      sourceSnapshot: true,
      claim: false,
      watchouts: false,
      release: false,
    });
  });
});
