/**
 * Thin PH Overview package — Release 2 candidate.
 * Reuses already-attested PH-IMM-001 evidence. Does not invent new .gov.ph text.
 * Human must still draft → review → pin → MFA publish via admin.
 */

import type { Enums } from "@/lib/supabase/database.types";
import { PH_V1_SOURCE_DRAFTS } from "./ph-v1";

/** Overview reuses the Entry/Stay DFA ledger — no new source invent. */
export const PH_OVERVIEW_LEDGER_ID = "PH-IMM-001" as const;

export const PH_OVERVIEW_SOURCE =
  PH_V1_SOURCE_DRAFTS.find((source) => source.ledgerId === PH_OVERVIEW_LEDGER_ID)!;

export const PH_OVERVIEW_CLAIM = {
  ledgerId: PH_OVERVIEW_LEDGER_ID,
  claimSlug: "verify-entry-before-treating-fit-as-settled",
  categorySlug: "editorial-context",
  riskLevel: "low" as Enums<"claim_risk_level">,
  preciseText:
    "Destination fit research does not replace nationality-specific entry rules. The Department of Foreign Affairs Philippine eVisa site publishes a policy page describing entry without a visa for listed nationalities; permitted stay length and purpose are nationality-specific and must be verified on that official page before treating a Philippines move plan as settled.",
  publicSummary:
    "Fit and overview research is not a substitute for checking your passport’s current entry rule on the official DFA eVisa policy page before you treat the Philippines as a settled destination.",
  userMeaning:
    "Use Overview to orient, then complete the Entry and legal stay Sunday Action on the official pages. Elsewhere does not decide eligibility or that a destination “fits” you legally.",
  exactLocator: "Policy page heading and nationality list section shown in the snapshot",
  supportNote:
    "Supports the planning sequence (verify official entry rules before treating fit as settled) using the attested DFA policy page. It does not support individual eligibility, a universal stay length, work authorization, or that the Fit Quiz is legal advice.",
} as const;

export const PH_OVERVIEW_WATCHOUTS = {
  blockSlug: "orient-then-verify-official-entry",
  kind: "watchouts" as const,
  title: "Orient, then verify official entry",
  riskLevel: "low" as Enums<"claim_risk_level">,
  body: `Start with Overview only long enough to decide whether the Philippines is worth deeper research this week.

Then open Entry and legal stay and complete the published Sunday Action on official DFA and Bureau of Immigration channels.

Optional: run the Fit Quiz to capture preferences — it does not decide eligibility or replace official instructions.

Elsewhere saves research and plans. It does not file applications or replace official instructions.`,
} as const;

export function isPhOverviewClaimTemplate(value: string | undefined): boolean {
  return value === "overview_watchout";
}

export function isPhOverviewBlockTemplate(value: string | undefined): boolean {
  return value === "overview_watchouts";
}

export type PhOverviewReadinessInput = {
  canAuthor: boolean;
  aal: "aal1" | "aal2";
  sourceHasSnapshot: boolean;
  overviewClaimApprovedPinned: boolean;
  overviewWatchoutsApprovedPinned: boolean;
  releaseState?: string;
};

export function evaluatePhOverviewReadiness(input: PhOverviewReadinessInput) {
  return {
    staffRole: input.canAuthor,
    mfa: input.aal === "aal2",
    sourceSnapshot: input.sourceHasSnapshot,
    claim: input.overviewClaimApprovedPinned,
    watchouts: input.overviewWatchoutsApprovedPinned,
    release: input.releaseState === "ready" || input.releaseState === "published",
  } as const;
}
