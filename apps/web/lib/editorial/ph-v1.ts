import type { Enums } from "@/lib/supabase/database.types";

export const PH_V1_SOURCE_DRAFTS = [
  { ledgerId: "PH-IMM-001", title: "DFA Philippine eVisa — visa-free entry policy", canonicalUrl: "https://evisa.gov.ph/page/policy?l2=Free+to+enter+the+Philippines+without+Visa", publisher: "Department of Foreign Affairs", authorityLevel: "official_government" },
  { ledgerId: "PH-IMM-003", title: "Bureau of Immigration — Temporary Visitor Visa / visa waiver", canonicalUrl: "https://immigration.gov.ph/visas/visa-waiver/", publisher: "Bureau of Immigration", authorityLevel: "immigration_authority" },
  { ledgerId: "PH-IMM-010", title: "Bureau of Immigration — e-Services", canonicalUrl: "https://e-services.immigration.gov.ph/", publisher: "Bureau of Immigration", authorityLevel: "immigration_authority" },
] as const satisfies readonly { ledgerId: string; title: string; canonicalUrl: string; publisher: string; authorityLevel: Enums<"source_authority_level"> }[];

export type PhV1LedgerId = (typeof PH_V1_SOURCE_DRAFTS)[number]["ledgerId"];

export const PH_V1_CLAIM_TEMPLATES = {
  A: {
    ledgerId: "PH-IMM-001", claimSlug: "dfa-visa-free-policy-page", categorySlug: "entry-requirements", riskLevel: "critical",
    preciseText: "The Department of Foreign Affairs Philippine eVisa site publishes a policy page describing entry to the Philippines without a visa for listed nationalities. Permitted stay length and permitted purpose are nationality-specific and must be verified on that official page for the traveler's passport at the time of travel.",
    publicSummary: "The DFA Philippine eVisa site provides nationality-specific visa-free entry information. Verify the current rule for your passport on the official page before acting.",
    userMeaning: "Use the official nationality list as a research starting point. This does not determine whether you qualify or whether a particular stay or activity is permitted.",
    exactLocator: "Policy page heading and nationality list section shown in the snapshot",
    supportNote: "Supports existence of an official visa-free policy page and nationality-scoped rules only; it does not support individual eligibility, a universal stay length, work authorization, or remote-work permission.",
  },
  B: {
    ledgerId: "PH-IMM-003", claimSlug: "bi-temporary-visitor-visa-waiver-page", categorySlug: "stay-options", riskLevel: "critical",
    preciseText: "The Bureau of Immigration publishes an official Temporary Visitor / visa-waiver page describing pathways related to temporary visitor status and visa waiver. Documentary requirements, permitted stay, filing location, and fees must be rechecked on that page and related current BI materials before acting.",
    publicSummary: "The Bureau of Immigration publishes temporary-visitor and visa-waiver information. Recheck current requirements, permitted stay, filing location, and fees on official BI pages before acting.",
    userMeaning: "Treat this as a route to current official instructions, not a determination that a person is eligible or that online filing is available.",
    exactLocator: "Page title and controlling sections shown in the snapshot",
    supportNote: "Supports the official pathway description only; it does not support current fees from other pages, individual eligibility, or a promise that online filing is available.",
  },
  C: {
    ledgerId: "PH-IMM-010", claimSlug: "bi-official-online-services-channel", categorySlug: "stay-options", riskLevel: "high",
    preciseText: "The Bureau of Immigration operates an official online services dashboard at e-services.immigration.gov.ph for selected immigration transactions. Users must log in to access services. Elsewhere does not process payments or filings on behalf of users.",
    publicSummary: "The Bureau of Immigration operates an official online dashboard for selected immigration transactions. Confirm that the service you need is currently listed before using it.",
    userMeaning: "Use the official BI domain and verify the transaction shown there. Elsewhere does not file applications, accept government payments, or decide eligibility.",
    exactLocator: "“Welcome to Bureau of Immigration Online Services” and service list",
    supportNote: "Supports the official channel and selected service listings only; it does not support availability of every visa type, third-party lookalike sites, or unstated fees.",
  },
} as const;

export type PhV1ClaimTemplateId = keyof typeof PH_V1_CLAIM_TEMPLATES;
export const PH_V1_NEXT_ACTION = { blockSlug: "start-with-official-entry-and-stay-channels", title: "Start with official entry and stay channels", body: "Confirm your passport's current entry rule on the DFA eVisa policy page, then use Bureau of Immigration pages and e-Services only for the process that matches your situation. Elsewhere saves research and plans; it does not file applications or decide eligibility." } as const;

export function missingPhV1SourceDrafts(existingCanonicalUrls: readonly string[]) {
  const existing = new Set(existingCanonicalUrls);
  return PH_V1_SOURCE_DRAFTS.filter((source) => !existing.has(source.canonicalUrl));
}

export function isPhV1ClaimTemplateId(value: string | undefined): value is PhV1ClaimTemplateId {
  return value === "A" || value === "B" || value === "C";
}

export type PhV1ReadinessInput = {
  canAuthor: boolean;
  aal: "aal1" | "aal2";
  sourceCount: number;
  snapshotCount: number;
  approvedPinnedClaimCount: number;
  approvedNextActionPinned: boolean;
  releaseState?: string;
};

export function evaluatePhV1Readiness(input: PhV1ReadinessInput) {
  return {
    staffRole: input.canAuthor,
    mfa: input.aal === "aal2",
    sources: input.sourceCount === PH_V1_SOURCE_DRAFTS.length,
    snapshots: input.snapshotCount === PH_V1_SOURCE_DRAFTS.length,
    claims: input.approvedPinnedClaimCount >= 3,
    nextAction: input.approvedNextActionPinned,
    release: input.releaseState === "ready" || input.releaseState === "published",
  } as const;
}
