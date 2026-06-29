export type PlanTier = "free" | "explorer" | "builder" | "serious_move";

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
