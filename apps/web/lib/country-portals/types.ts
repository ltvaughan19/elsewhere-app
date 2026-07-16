export const COUNTRY_PORTAL_SLUGS = [
  "philippines",
  "thailand",
  "mexico",
] as const;

export type CountryPortalSlug = (typeof COUNTRY_PORTAL_SLUGS)[number];

export type PortalSectionDisplay = "content" | "source_ledger";

export interface PortalSectionAction {
  label: string;
  href: string;
}

export interface PortalSectionDefinition {
  slug: string;
  title: string;
  description: string;
  display: PortalSectionDisplay;
  actions?: readonly PortalSectionAction[];
}

export const PORTAL_SECTION_DEFINITIONS: readonly PortalSectionDefinition[] = [
  {
    slug: "overview",
    title: "Overview and fit",
    description:
      "Start with fit, major watchouts, and the safest next research step.",
    display: "content",
    actions: [{ label: "Start the Fit Quiz", href: "/app/onboarding" }],
  },
  {
    slug: "entry-and-stay",
    title: "Entry and legal stay",
    description:
      "Understand applicable entry rules and lawful long-stay research paths.",
    display: "content",
    actions: [{ label: "Open Visa Compass", href: "/visa-compass" }],
  },
  {
    slug: "money",
    title: "Money and affordability",
    description: "Build a sourced budget and prepare for local money setup.",
    display: "content",
    actions: [
      { label: "Build a planning budget", href: "/budget-calculator" },
    ],
  },
  {
    slug: "cities",
    title: "Cities, climate, and daily life",
    description: "Compare possible bases against the way you want to live.",
    display: "content",
    actions: [{ label: "Compare destinations", href: "/compare" }],
  },
  {
    slug: "housing",
    title: "Housing",
    description:
      "Research rentals, contracts, deposits, utilities, and common warning signs.",
    display: "content",
    actions: [{ label: "Open the housing guide", href: "/housing" }],
  },
  {
    slug: "healthcare",
    title: "Healthcare and insurance",
    description:
      "Plan access, coverage, medications, and emergency contingencies.",
    display: "content",
    actions: [{ label: "Open the insurance guide", href: "/insurance" }],
  },
  {
    slug: "work-and-tax",
    title: "Work, business, and tax cautions",
    description:
      "Keep immigration, work-right, business, and tax questions separate.",
    display: "content",
  },
  {
    slug: "safety",
    title: "Safety, laws, hazards, and scams",
    description:
      "Prepare for destination-specific risks, local laws, and avoidable scams.",
    display: "content",
  },
  {
    slug: "moving-and-arrival",
    title: "Moving and arrival",
    description: "Turn reviewed research into a practical arrival sequence.",
    display: "content",
    actions: [
      { label: "Start the passport checklist", href: "/passport-checklist" },
    ],
  },
  {
    slug: "living-and-renewals",
    title: "Living, renewals, and long-term settlement",
    description:
      "Maintain your plan after arrival and prepare for recurring obligations.",
    display: "content",
  },
  {
    slug: "sources-and-changes",
    title: "Sources, corrections, and change history",
    description:
      "Inspect evidence, freshness, corrections, and the current release.",
    display: "source_ledger",
    actions: [{ label: "Read the trust model", href: "/trust" }],
  },
] as const;

export type PortalPublicationState = "preview" | "published";
export type PortalSectionStatus = "in_review" | "partial" | "published";

export interface PortalCitation {
  id: string;
  role: "primary" | "supporting" | "context" | "conflicting";
  sourceId: string;
  sourceTitle: string;
  publisher: string;
  authorityLevel: string;
  canonicalUrl: string;
  exactLocator?: string;
  supportNote?: string;
  lastVerifiedAt?: string;
}

export interface PortalSource {
  id: string;
  title: string;
  publisher: string;
  authorityLevel: string;
  canonicalUrl: string;
  lastVerifiedAt?: string;
}

export interface PortalClaim {
  id: string;
  slug: string;
  versionId: string;
  versionNumber: number;
  summary: string;
  userMeaning?: string;
  applicability: Record<string, unknown>;
  confidenceLevel: "low" | "medium" | "high";
  riskLevel: "low" | "medium" | "high" | "critical";
  requiresProfessionalReview: boolean;
  reviewDueAt?: string;
  citations: PortalCitation[];
}

export interface PortalContentBlock {
  id: string;
  slug: string;
  versionId: string;
  versionNumber: number;
  kind: string;
  title?: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  body: Record<string, unknown>;
  claimVersionIds: string[];
}

export interface CountryPortalSection extends PortalSectionDefinition {
  status: PortalSectionStatus;
  claims: PortalClaim[];
  blocks: PortalContentBlock[];
}

export interface CountryPortal {
  slug: string;
  isoCode: string;
  name: string;
  flagEmoji: string;
  region?: string;
  summary: string;
  overview: string;
  coverageLevel: "preview" | "core" | "deep";
  publicationState: PortalPublicationState;
  releaseId?: string;
  releaseNumber?: number;
  publishedAt?: string;
  reviewedAt?: string;
  audienceScope: Record<string, unknown>;
  sections: CountryPortalSection[];
  sources: PortalSource[];
}

export interface CountryPortalCardData {
  slug: string;
  isoCode: string;
  name: string;
  flagEmoji: string;
  summary: string;
  publicationState: PortalPublicationState;
  coverageLevel: "preview" | "core" | "deep";
  releaseNumber?: number;
  publishedAt?: string;
}
