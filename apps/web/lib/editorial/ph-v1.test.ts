import { describe, expect, it } from "vitest";
import { evaluatePhV1Readiness, missingPhV1SourceDrafts, PH_V1_SOURCE_DRAFTS } from "./ph-v1";

describe("PH v1 source bootstrap", () => {
  it("returns all three drafts for an empty workspace", () => {
    expect(missingPhV1SourceDrafts([])).toEqual(PH_V1_SOURCE_DRAFTS);
  });

  it("is idempotent when all URLs exist", () => {
    expect(missingPhV1SourceDrafts(PH_V1_SOURCE_DRAFTS.map((source) => source.canonicalUrl))).toEqual([]);
  });

  it("returns only missing sources", () => {
    const existing = [PH_V1_SOURCE_DRAFTS[0].canonicalUrl, PH_V1_SOURCE_DRAFTS[2].canonicalUrl];
    expect(missingPhV1SourceDrafts(existing).map((source) => source.ledgerId)).toEqual(["PH-IMM-003"]);
  });
});

describe("PH v1 readiness", () => {
  it("reports missing MFA and snapshots as hard blockers", () => {
    expect(evaluatePhV1Readiness({
      canAuthor: true,
      aal: "aal1",
      sourceCount: 3,
      snapshotCount: 0,
      approvedPinnedClaimCount: 0,
      approvedNextActionPinned: false,
      releaseState: "draft",
    })).toEqual({
      staffRole: true,
      mfa: false,
      sources: true,
      snapshots: false,
      claims: false,
      nextAction: false,
      release: false,
    });
  });
});
