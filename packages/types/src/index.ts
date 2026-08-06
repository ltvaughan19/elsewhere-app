export type PlanTier = "free" | "explorer";

/** Product card ids on /pricing — not all map 1:1 to plan_tier. */
export type PricingProductId =
  | PlanTier
  | "serious_move"
  | "builder"
  | "concierge";

export type PartnerStatus =
  | "draft"
  | "pending_verification"
  | "verified"
  | "rejected"
  | "suspended"
  | "sponsored"
  | "demo";

export type ConfidenceLevel = "low" | "medium" | "high";

export type ReviewStatus =
  | "draft"
  | "needs_review"
  | "auto_detected"
  | "human_reviewed"
  | "partner_reviewed"
  | "deprecated"
  | "disputed";

export interface CountryCardData {
  slug: string;
  name: string;
  flagEmoji: string;
  monthlyCostEstimate: string;
  visaComplexity: string;
  natureScore: number;
  socialScore: number;
  healthcareScore: number;
  internetScore: number;
  propertyComplexity: string;
  longStayPotential: string;
  demoData?: boolean;
}

export interface VisaCardData {
  id: string;
  countrySlug: string;
  countryName: string;
  flagEmoji: string;
  name: string;
  category: string;
  overview: string;
  typicalStay: string;
  estimatedFees: string;
  riskLevel: "low" | "medium" | "high";
  reviewStatus: ReviewStatus;
  confidenceLevel: ConfidenceLevel;
  sourceName?: string;
}

export interface PricingTier {
  id: PricingProductId;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  /** When true, CTA is not a purchase path (proof scope). */
  comingLater?: boolean;
}

export type ReadinessBlocker =
  | "passport"
  | "savings"
  | "visa_research"
  | "housing"
  | "health"
  | "family"
  | "remote_income";

export interface OnboardingAnswers {
  hasValidPassport: "yes" | "no" | "expiring_soon";
  monthlySavingsUsd: number;
  monthlyIncomeUsd: number;
  targetMoveMonths: number;
  priority: "cost" | "community" | "nature" | "healthcare" | "visa_ease";
  remoteWork: "yes" | "no" | "planning";
  travelingWithFamily: boolean;
  priorTravelAbroad: boolean;
  riskTolerance: "low" | "medium" | "high";
  preferredCorridor: "philippines" | "thailand" | "mexico" | "open";
}

export interface ReadinessResult {
  score: number;
  bestFitSlug: string;
  backupSlugs: string[];
  blockers: ReadinessBlocker[];
  nextStep: string;
  warningFlags: string[];
}

/** Minimal Free-habit progress — lives inside user_plans.plan JSON (no new table). */
export interface SundayActionProgress {
  /** ISO week key, e.g. 2026-W32 */
  completedWeekKey?: string;
  completedAt?: string;
  /** Published next_action block slug when marked done */
  actionSlug?: string;
  countrySlug?: string;
}

export interface UserPlan {
  email: string;
  displayName: string;
  planTier: PlanTier;
  onboardingCompleted: boolean;
  answers: OnboardingAnswers | null;
  readiness: ReadinessResult | null;
  savedCountrySlugs: string[];
  sundayActionProgress?: SundayActionProgress;
  createdAt: string;
  updatedAt: string;
}

export type SourceType =
  | "official_government"
  | "embassy_consulate"
  | "immigration_authority"
  | "licensed_professional"
  | "partner_provided"
  | "third_party_data"
  | "editorial"
  | "user_report";

/** User-facing claim block — always render with honesty badges */
export interface SourceClaimDisplay {
  id: string;
  countrySlug: string;
  category: string;
  plainEnglishSummary: string;
  sourceUrl?: string;
  sourceType: SourceType;
  sourceName?: string;
  lastVerifiedAt?: string;
  confidenceLevel: ConfidenceLevel;
  reviewStatus: ReviewStatus;
  riskLevel: "low" | "medium" | "high";
  requiresProfessionalReview?: boolean;
}

export interface CorridorSeed {
  slug: string;
  originCountryCode: string;
  destinationSlug: string;
  name: string;
  summary: string;
  isPublished: boolean;
  sortOrder: number;
}

export interface PathPackSeed {
  id: string;
  corridorSlug: string;
  slug: string;
  name: string;
  audienceTags: string[];
  overview: string;
  bestIf: string[];
  checklist: { id: string; title: string }[];
  claimIds: string[];
  reviewStatus: ReviewStatus;
  lastReviewedAt?: string;
}
