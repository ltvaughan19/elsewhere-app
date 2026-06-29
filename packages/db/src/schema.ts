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

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  citizenshipCountryCode: text("citizenship_country_code"),
  role: text("role").default("user"),
  planTier: text("plan_tier").default("free"),
  readinessScore: integer("readiness_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Country = typeof countries.$inferSelect;
export type SourceClaim = typeof sourceClaims.$inferSelect;
