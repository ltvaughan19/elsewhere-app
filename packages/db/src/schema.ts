import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const confidenceLevelEnum = pgEnum("confidence_level", [
  "low",
  "medium",
  "high",
]);

export const reviewStatusEnum = pgEnum("review_status", [
  "draft",
  "needs_review",
  "auto_detected",
  "human_reviewed",
  "partner_reviewed",
  "deprecated",
  "disputed",
]);

export const countries = pgTable("countries", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  region: text("region"),
  flagEmoji: text("flag_emoji"),
  summary: text("summary"),
  isPublished: boolean("is_published").default(false),
  demoData: boolean("demo_data").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sourceClaims = pgTable("source_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryId: uuid("country_id").references(() => countries.id),
  category: text("category").notNull(),
  claimText: text("claim_text").notNull(),
  plainEnglishSummary: text("plain_english_summary").notNull(),
  sourceUrl: text("source_url"),
  sourceType: text("source_type").notNull(),
  sourceName: text("source_name"),
  lastVerifiedAt: timestamp("last_verified_at"),
  confidenceLevel: confidenceLevelEnum("confidence_level").default("low"),
  reviewStatus: reviewStatusEnum("review_status").default("needs_review"),
  riskLevel: text("risk_level").default("medium"),
  isUserVisible: boolean("is_user_visible").default(false),
  requiresProfessionalReview: boolean("requires_professional_review").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * A corridor is origin → destination configuration.
 * Never hardcode country names in application logic — use corridor rows.
 */
export const corridors = pgTable("corridors", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  originCountryCode: text("origin_country_code").notNull(),
  destinationCountryId: uuid("destination_country_id").references(
    () => countries.id,
  ),
  name: text("name").notNull(),
  summary: text("summary"),
  isPublished: boolean("is_published").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Versioned research path for a corridor (e.g. tourist research, remote income research).
 * Quiz scoring and Path UI read packs — not country-specific if/else branches.
 */
export const pathPacks = pgTable("path_packs", {
  id: uuid("id").primaryKey().defaultRandom(),
  corridorId: uuid("corridor_id").references(() => corridors.id),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  audienceTags: jsonb("audience_tags").$type<string[]>().default([]),
  overview: text("overview").notNull(),
  bestIf: jsonb("best_if").$type<string[]>().default([]),
  checklist: jsonb("checklist").$type<{ id: string; title: string }[]>().default([]),
  claimIds: jsonb("claim_ids").$type<string[]>().default([]),
  lastReviewedAt: timestamp("last_reviewed_at"),
  reviewStatus: reviewStatusEnum("review_status").default("needs_review"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const partnerApplications = pgTable("partner_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  website: text("website"),
  countriesServed: jsonb("countries_served").$type<string[]>().default([]),
  serviceCategory: text("service_category").notNull(),
  description: text("description").notNull(),
  status: text("status").default("pending_verification"),
  consentToVerification: boolean("consent_to_verification").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leadRequests = pgTable("lead_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  email: text("email"),
  corridorSlug: text("corridor_slug"),
  needType: text("need_type").notNull(),
  message: text("message"),
  consentToShare: boolean("consent_to_share").default(false),
  status: text("status").default("queued"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  citizenshipCountryCode: text("citizenship_country_code"),
  role: text("role").default("user"),
  planTier: text("plan_tier").default("free"),
  readinessScore: integer("readiness_score"),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  preferredCorridorSlug: text("preferred_corridor_slug"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Country = typeof countries.$inferSelect;
export type SourceClaim = typeof sourceClaims.$inferSelect;
export type Corridor = typeof corridors.$inferSelect;
export type PathPack = typeof pathPacks.$inferSelect;
