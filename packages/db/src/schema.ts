import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  pgView,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * This file mirrors the deployed public schema. Migrations remain authoritative
 * for RLS policies, grants, triggers, functions, seed rows, and view SQL.
 *
 * Supabase owns auth.users. The private declaration lets public-table foreign
 * keys retain their real target without exporting auth as application-owned
 * schema.
 */
const auth = pgSchema("auth");
const authUsers = auth.table("users", {
  id: uuid("id").primaryKey(),
});

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export interface AudienceScope extends JsonObject {
  schemaVersion: number;
  citizenshipCountryCodes: string[];
  residenceCountryCodes: string[];
  purposes: string[];
  durationBands: string[];
  householdTags: string[];
}

export interface PublishedCitation extends JsonObject {
  citationId: string;
  role: CitationRole;
  sourceId: string;
  sourceTitle: string;
  publisher: string;
  authorityLevel: SourceAuthorityLevel;
  canonicalUrl: string;
  exactLocator: string | null;
  supportNote: string | null;
  lastVerifiedAt: string | null;
}

const emptyAudienceScope = sql`'{"schemaVersion":1,"citizenshipCountryCodes":[],"residenceCountryCodes":[],"purposes":[],"durationBands":[],"householdTags":[]}'::jsonb`;

export const staffRoleEnum = pgEnum("staff_role", [
  "editor",
  "reviewer",
  "publisher",
  "admin",
]);

export const countryVisibilityEnum = pgEnum("country_visibility", [
  "draft",
  "preview",
  "published",
  "retired",
]);

export const portalCoverageLevelEnum = pgEnum("portal_coverage_level", [
  "preview",
  "core",
  "deep",
]);

export const sourceAuthorityLevelEnum = pgEnum("source_authority_level", [
  "official_government",
  "embassy_consulate",
  "immigration_authority",
  "intergovernmental",
  "licensed_professional",
  "reputable_institution",
  "editorial",
  "community",
]);

export const sourceDocumentStateEnum = pgEnum("source_document_state", [
  "draft",
  "verified",
  "superseded",
  "unavailable",
  "disputed",
]);

export const claimRiskLevelEnum = pgEnum("claim_risk_level", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const claimConfidenceLevelEnum = pgEnum("claim_confidence_level", [
  "low",
  "medium",
  "high",
]);

export const editorialWorkflowStateEnum = pgEnum(
  "editorial_workflow_state",
  [
    "draft",
    "in_review",
    "approved",
    "changes_requested",
    "deprecated",
    "disputed",
  ],
);

export const citationRoleEnum = pgEnum("citation_role", [
  "primary",
  "supporting",
  "context",
  "conflicting",
]);

export const contentBlockKindEnum = pgEnum("content_block_kind", [
  "rich_text",
  "key_facts",
  "claim_list",
  "steps",
  "watchouts",
  "stay_path_matrix",
  "city_grid",
  "budget_embed",
  "source_list",
  "change_log",
  "next_action",
]);

export const countryReleaseStateEnum = pgEnum("country_release_state", [
  "draft",
  "ready",
  "published",
  "superseded",
  "withdrawn",
]);

export const editorialReviewKindEnum = pgEnum("editorial_review_kind", [
  "editorial",
  "source_verification",
  "professional",
  "release_qa",
]);

export const editorialReviewDecisionEnum = pgEnum(
  "editorial_review_decision",
  ["approved", "changes_requested", "rejected"],
);

export const outdatedReportStatusEnum = pgEnum("outdated_report_status", [
  "open",
  "triaged",
  "investigating",
  "resolved",
  "rejected",
]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    email: text("email"),
    planTier: text("plan_tier").notNull().default("free"),
    digestOptIn: boolean("digest_opt_in").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "profiles_plan_tier_check",
      sql`${table.planTier} in ('free', 'explorer', 'builder', 'serious_move')`,
    ),
  ],
);

export const userPlans = pgTable("user_plans", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  plan: jsonb("plan").$type<JsonObject>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emailSubscribers = pgTable("email_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("marketing"),
  consentAt: timestamp("consent_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  freeBrief: boolean("free_brief").notNull().default(true),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const staffMemberships = pgTable(
  "staff_memberships",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: staffRoleEnum("role").notNull(),
    active: boolean("active").notNull().default(true),
    grantedBy: uuid("granted_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("staff_memberships_granted_by_idx").on(table.grantedBy),
  ],
);

export const claimCategories = pgTable("claim_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  portalSectionSlug: text("portal_section_slug").notNull(),
  defaultRiskLevel: claimRiskLevelEnum("default_risk_level")
    .notNull()
    .default("medium"),
  requiresOfficialSource: boolean("requires_official_source")
    .notNull()
    .default(false),
  requiresProfessionalReview: boolean("requires_professional_review")
    .notNull()
    .default(false),
  reviewIntervalDays: integer("review_interval_days").notNull().default(180),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  check("claim_categories_slug_check", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
  check("claim_categories_review_interval_days_check", sql`${table.reviewIntervalDays} between 1 and 730`),
]);

export const countries = pgTable(
  "countries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    isoCode: char("iso_code", { length: 2 }).notNull().unique(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    region: text("region"),
    flagEmoji: text("flag_emoji"),
    summary: text("summary"),
    visibility: countryVisibilityEnum("visibility").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("countries_iso_code_check", sql`${table.isoCode} = upper(${table.isoCode})`),
    check("countries_slug_check", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
  ],
);

export const countryPortals = pgTable(
  "country_portals",
  {
    countryId: uuid("country_id")
      .primaryKey()
      .references(() => countries.id, { onDelete: "cascade" }),
    coverageLevel: portalCoverageLevelEnum("coverage_level")
      .notNull()
      .default("preview"),
    defaultLocale: text("default_locale").notNull().default("en"),
    audienceScope: jsonb("audience_scope")
      .$type<AudienceScope>()
      .notNull()
      .default(emptyAudienceScope),
    overview: text("overview"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "country_portals_audience_scope_check",
      sql`jsonb_typeof(${table.audienceScope}) = 'object'`,
    ),
  ],
);

export const portalSections = pgTable(
  "portal_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryId: uuid("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    isRequired: boolean("is_required").notNull().default(true),
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("portal_sections_slug_check", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
    unique("portal_sections_country_id_slug_key").on(table.countryId, table.slug),
    index("portal_sections_country_sort_idx").on(table.countryId, table.sortOrder),
  ],
);

export const sourceDocuments = pgTable(
  "source_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryId: uuid("country_id").references(() => countries.id, {
      onDelete: "set null",
    }),
    canonicalUrl: text("canonical_url").notNull().unique(),
    title: text("title").notNull(),
    publisher: text("publisher").notNull(),
    authorityLevel: sourceAuthorityLevelEnum("authority_level").notNull(),
    jurisdiction: text("jurisdiction"),
    sourceLanguage: text("source_language").notNull().default("en"),
    translationStatus: text("translation_status")
      .notNull()
      .default("not_needed"),
    publicationDate: date("publication_date", { mode: "string" }),
    state: sourceDocumentStateEnum("state").notNull().default("draft"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    reviewDueAt: timestamp("review_due_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("source_documents_canonical_url_check", sql`${table.canonicalUrl} ~ '^https://'`),
    check(
      "source_documents_translation_status_check",
      sql`${table.translationStatus} in ('not_needed', 'machine_draft', 'human_reviewed')`,
    ),
    index("source_documents_country_state_idx").on(
      table.countryId,
      table.state,
      table.reviewDueAt,
    ),
    index("source_documents_created_by_idx").on(table.createdBy),
  ],
);

export const sourceSnapshots = pgTable(
  "source_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceDocumentId: uuid("source_document_id")
      .notNull()
      .references(() => sourceDocuments.id, { onDelete: "restrict" }),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    captureMethod: text("capture_method").notNull().default("manual"),
    httpStatus: integer("http_status"),
    contentHash: text("content_hash").notNull(),
    etag: text("etag"),
    lastModifiedHeader: text("last_modified_header"),
    capturedTitle: text("captured_title"),
    storagePath: text("storage_path"),
    capturedBy: uuid("captured_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "source_snapshots_capture_method_check",
      sql`${table.captureMethod} in ('manual', 'url_monitor', 'api', 'partner_feed')`,
    ),
    check(
      "source_snapshots_http_status_check",
      sql`${table.httpStatus} between 100 and 599`,
    ),
    check(
      "source_snapshots_content_hash_check",
      sql`char_length(${table.contentHash}) between 16 and 128`,
    ),
    unique("source_snapshots_source_document_id_content_hash_key").on(
      table.sourceDocumentId,
      table.contentHash,
    ),
    index("source_snapshots_source_captured_idx").on(
      table.sourceDocumentId,
      table.capturedAt.desc(),
    ),
    index("source_snapshots_captured_by_idx").on(table.capturedBy),
  ],
);

export const claims = pgTable(
  "claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryId: uuid("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => claimCategories.id, { onDelete: "restrict" }),
    portalSectionId: uuid("portal_section_id").references(
      () => portalSections.id,
      { onDelete: "set null" },
    ),
    claimSlug: text("claim_slug").notNull(),
    riskLevel: claimRiskLevelEnum("risk_level").notNull().default("medium"),
    requiresProfessionalReview: boolean("requires_professional_review")
      .notNull()
      .default(false),
    suppressedAt: timestamp("suppressed_at", { withTimezone: true }),
    suppressedReason: text("suppressed_reason"),
    createdBy: uuid("created_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("claims_claim_slug_check", sql`${table.claimSlug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
    check(
      "claims_suppression_check",
      sql`(${table.suppressedAt} is null and ${table.suppressedReason} is null) or ${table.suppressedAt} is not null`,
    ),
    unique("claims_country_id_claim_slug_key").on(table.countryId, table.claimSlug),
    index("claims_country_category_idx").on(table.countryId, table.categoryId),
    index("claims_category_idx").on(table.categoryId),
    index("claims_created_by_idx").on(table.createdBy),
    index("claims_portal_section_idx").on(table.portalSectionId),
  ],
);

export const claimVersions = pgTable(
  "claim_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    claimId: uuid("claim_id")
      .notNull()
      .references(() => claims.id, { onDelete: "restrict" }),
    versionNumber: integer("version_number").notNull(),
    preciseText: text("precise_text").notNull(),
    publicSummary: text("public_summary").notNull(),
    userMeaning: text("user_meaning"),
    applicability: jsonb("applicability")
      .$type<AudienceScope>()
      .notNull()
      .default(emptyAudienceScope),
    locale: text("locale").notNull().default("en"),
    confidenceLevel: claimConfidenceLevelEnum("confidence_level")
      .notNull()
      .default("low"),
    workflowState: editorialWorkflowStateEnum("workflow_state")
      .notNull()
      .default("draft"),
    effectiveFrom: date("effective_from", { mode: "string" }),
    effectiveUntil: date("effective_until", { mode: "string" }),
    reviewDueAt: timestamp("review_due_at", { withTimezone: true }),
    authoredBy: uuid("authored_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    changeSummary: text("change_summary"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("claim_versions_version_number_check", sql`${table.versionNumber} > 0`),
    check(
      "claim_versions_precise_text_check",
      sql`char_length(${table.preciseText}) between 10 and 10000`,
    ),
    check(
      "claim_versions_public_summary_check",
      sql`char_length(${table.publicSummary}) between 10 and 5000`,
    ),
    check(
      "claim_versions_applicability_check",
      sql`jsonb_typeof(${table.applicability}) = 'object' and ${table.applicability} ? 'schemaVersion'`,
    ),
    check(
      "claim_versions_effective_dates_check",
      sql`${table.effectiveUntil} is null or ${table.effectiveFrom} is null or ${table.effectiveUntil} >= ${table.effectiveFrom}`,
    ),
    unique("claim_versions_claim_id_version_number_key").on(
      table.claimId,
      table.versionNumber,
    ),
    index("claim_versions_claim_state_idx").on(
      table.claimId,
      table.workflowState,
      table.versionNumber.desc(),
    ),
    index("claim_versions_applicability_idx").using("gin", table.applicability),
    index("claim_versions_authored_by_idx").on(table.authoredBy),
  ],
);

export const contentBlocks = pgTable(
  "content_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryId: uuid("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    portalSectionId: uuid("portal_section_id")
      .notNull()
      .references(() => portalSections.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    kind: contentBlockKindEnum("kind").notNull(),
    riskLevel: claimRiskLevelEnum("risk_level").notNull().default("low"),
    createdBy: uuid("created_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("content_blocks_slug_check", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
    unique("content_blocks_country_id_portal_section_id_slug_key").on(
      table.countryId,
      table.portalSectionId,
      table.slug,
    ),
    index("content_blocks_created_by_idx").on(table.createdBy),
    index("content_blocks_portal_section_idx").on(table.portalSectionId),
  ],
);

export const contentBlockVersions = pgTable(
  "content_block_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentBlockId: uuid("content_block_id")
      .notNull()
      .references(() => contentBlocks.id, { onDelete: "restrict" }),
    versionNumber: integer("version_number").notNull(),
    title: text("title"),
    body: jsonb("body").$type<JsonObject>().notNull(),
    workflowState: editorialWorkflowStateEnum("workflow_state")
      .notNull()
      .default("draft"),
    authoredBy: uuid("authored_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    changeSummary: text("change_summary"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("content_block_versions_version_number_check", sql`${table.versionNumber} > 0`),
    check("content_block_versions_body_check", sql`jsonb_typeof(${table.body}) = 'object'`),
    unique("content_block_versions_content_block_id_version_number_key").on(
      table.contentBlockId,
      table.versionNumber,
    ),
    index("content_block_versions_authored_by_idx").on(table.authoredBy),
  ],
);

export const claimVersionCitations = pgTable(
  "claim_version_citations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    claimVersionId: uuid("claim_version_id")
      .notNull()
      .references(() => claimVersions.id, { onDelete: "cascade" }),
    sourceDocumentId: uuid("source_document_id")
      .notNull()
      .references(() => sourceDocuments.id, { onDelete: "restrict" }),
    sourceSnapshotId: uuid("source_snapshot_id").references(
      () => sourceSnapshots.id,
      { onDelete: "restrict" },
    ),
    role: citationRoleEnum("role").notNull().default("supporting"),
    exactLocator: text("exact_locator"),
    evidenceExcerpt: text("evidence_excerpt"),
    supportNote: text("support_note"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdBy: uuid("created_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "claim_version_citations_evidence_excerpt_check",
      sql`${table.evidenceExcerpt} is null or char_length(${table.evidenceExcerpt}) <= 1000`,
    ),
    unique("claim_version_citations_claim_version_id_source_document_id_role_key").on(
      table.claimVersionId,
      table.sourceDocumentId,
      table.role,
    ),
    index("citations_claim_version_sort_idx").on(
      table.claimVersionId,
      table.sortOrder,
    ),
    index("claim_version_citations_created_by_idx").on(table.createdBy),
    index("claim_version_citations_source_document_idx").on(
      table.sourceDocumentId,
    ),
    index("claim_version_citations_source_snapshot_idx").on(
      table.sourceSnapshotId,
    ),
  ],
);

export const contentBlockClaims = pgTable(
  "content_block_claims",
  {
    contentBlockVersionId: uuid("content_block_version_id")
      .notNull()
      .references(() => contentBlockVersions.id, { onDelete: "cascade" }),
    claimVersionId: uuid("claim_version_id")
      .notNull()
      .references(() => claimVersions.id, { onDelete: "restrict" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "content_block_claims_pkey",
      columns: [table.contentBlockVersionId, table.claimVersionId],
    }),
    index("content_block_claims_claim_version_idx").on(table.claimVersionId),
  ],
);

export const countryReleases = pgTable(
  "country_releases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryId: uuid("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "restrict" }),
    releaseNumber: integer("release_number").notNull(),
    state: countryReleaseStateEnum("state").notNull().default("draft"),
    releaseNotes: text("release_notes"),
    isCurrent: boolean("is_current").notNull().default(false),
    createdBy: uuid("created_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    publishedBy: uuid("published_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("country_releases_release_number_check", sql`${table.releaseNumber} > 0`),
    check(
      "country_releases_published_state_check",
      sql`(${table.state} = 'published' and ${table.isCurrent} and ${table.publishedAt} is not null) or ${table.state} <> 'published'`,
    ),
    unique("country_releases_country_id_release_number_key").on(
      table.countryId,
      table.releaseNumber,
    ),
    uniqueIndex("country_releases_one_current_idx")
      .on(table.countryId)
      .where(sql`${table.isCurrent} and ${table.state} = 'published'`),
    index("releases_country_state_idx").on(
      table.countryId,
      table.state,
      table.releaseNumber.desc(),
    ),
    index("country_releases_created_by_idx").on(table.createdBy),
    index("country_releases_published_by_idx").on(table.publishedBy),
  ],
);

export const releaseClaimVersions = pgTable(
  "release_claim_versions",
  {
    releaseId: uuid("release_id")
      .notNull()
      .references(() => countryReleases.id, { onDelete: "cascade" }),
    claimId: uuid("claim_id")
      .notNull()
      .references(() => claims.id, { onDelete: "restrict" }),
    claimVersionId: uuid("claim_version_id")
      .notNull()
      .references(() => claimVersions.id, { onDelete: "restrict" }),
    portalSectionId: uuid("portal_section_id")
      .notNull()
      .references(() => portalSections.id, { onDelete: "restrict" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "release_claim_versions_pkey",
      columns: [table.releaseId, table.claimId],
    }),
    unique("release_claim_versions_release_id_claim_version_id_key").on(
      table.releaseId,
      table.claimVersionId,
    ),
    index("release_claim_versions_claim_idx").on(table.claimId),
    index("release_claim_versions_claim_version_idx").on(table.claimVersionId),
    index("release_claim_versions_section_idx").on(table.portalSectionId),
  ],
);

export const releaseBlockVersions = pgTable(
  "release_block_versions",
  {
    releaseId: uuid("release_id")
      .notNull()
      .references(() => countryReleases.id, { onDelete: "cascade" }),
    contentBlockId: uuid("content_block_id")
      .notNull()
      .references(() => contentBlocks.id, { onDelete: "restrict" }),
    contentBlockVersionId: uuid("content_block_version_id")
      .notNull()
      .references(() => contentBlockVersions.id, { onDelete: "restrict" }),
    portalSectionId: uuid("portal_section_id")
      .notNull()
      .references(() => portalSections.id, { onDelete: "restrict" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "release_block_versions_pkey",
      columns: [table.releaseId, table.contentBlockId],
    }),
    unique("release_block_versions_release_id_content_block_version_id_key").on(
      table.releaseId,
      table.contentBlockVersionId,
    ),
    index("release_block_versions_block_idx").on(table.contentBlockId),
    index("release_block_versions_block_version_idx").on(
      table.contentBlockVersionId,
    ),
    index("release_block_versions_section_idx").on(table.portalSectionId),
  ],
);

export const editorialReviews = pgTable(
  "editorial_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceDocumentId: uuid("source_document_id").references(
      () => sourceDocuments.id,
      { onDelete: "restrict" },
    ),
    reviewedSnapshotId: uuid("reviewed_snapshot_id").references(
      () => sourceSnapshots.id,
      { onDelete: "restrict" },
    ),
    claimVersionId: uuid("claim_version_id").references(
      () => claimVersions.id,
      { onDelete: "restrict" },
    ),
    contentBlockVersionId: uuid("content_block_version_id").references(
      () => contentBlockVersions.id,
      { onDelete: "restrict" },
    ),
    releaseId: uuid("release_id").references(() => countryReleases.id, {
      onDelete: "restrict",
    }),
    reviewKind: editorialReviewKindEnum("review_kind").notNull(),
    decision: editorialReviewDecisionEnum("decision").notNull(),
    checklist: jsonb("checklist")
      .$type<JsonObject>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    notes: text("notes"),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("editorial_reviews_checklist_check", sql`jsonb_typeof(${table.checklist}) = 'object'`),
    check(
      "editorial_reviews_target_check",
      sql`num_nonnulls(${table.sourceDocumentId}, ${table.claimVersionId}, ${table.contentBlockVersionId}, ${table.releaseId}) = 1`,
    ),
    check(
      "editorial_reviews_snapshot_check",
      sql`${table.reviewedSnapshotId} is null or ${table.sourceDocumentId} is not null`,
    ),
    index("editorial_reviews_claim_idx")
      .on(table.claimVersionId, table.createdAt.desc())
      .where(sql`${table.claimVersionId} is not null`),
    index("editorial_reviews_source_idx")
      .on(table.sourceDocumentId, table.createdAt.desc())
      .where(sql`${table.sourceDocumentId} is not null`),
    index("editorial_reviews_release_idx")
      .on(table.releaseId, table.createdAt.desc())
      .where(sql`${table.releaseId} is not null`),
    index("editorial_reviews_block_version_idx").on(table.contentBlockVersionId),
    index("editorial_reviews_reviewed_snapshot_idx").on(table.reviewedSnapshotId),
    index("editorial_reviews_reviewer_idx").on(table.reviewerId),
  ],
);

export const editorialAuditEvents = pgTable(
  "editorial_audit_events",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    actorUserId: uuid("actor_user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    beforeData: jsonb("before_data").$type<JsonValue>(),
    afterData: jsonb("after_data").$type<JsonValue>(),
    requestId: uuid("request_id").notNull().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("editorial_audit_events_actor_idx").on(table.actorUserId),
  ],
);

export const outdatedInformationReports = pgTable(
  "outdated_information_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryId: uuid("country_id").references(() => countries.id, {
      onDelete: "set null",
    }),
    claimId: uuid("claim_id").references(() => claims.id, {
      onDelete: "set null",
    }),
    releaseId: uuid("release_id").references(() => countryReleases.id, {
      onDelete: "set null",
    }),
    pageUrl: text("page_url").notNull(),
    description: text("description").notNull(),
    suggestedSourceUrl: text("suggested_source_url"),
    reporterUserId: uuid("reporter_user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    reporterEmail: text("reporter_email"),
    status: outdatedReportStatusEnum("status").notNull().default("open"),
    resolutionNote: text("resolution_note"),
    resolvedBy: uuid("resolved_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "outdated_information_reports_page_url_check",
      sql`char_length(${table.pageUrl}) between 1 and 2048`,
    ),
    check(
      "outdated_information_reports_description_check",
      sql`char_length(${table.description}) between 10 and 5000`,
    ),
    check(
      "outdated_information_reports_suggested_source_url_check",
      sql`${table.suggestedSourceUrl} is null or ${table.suggestedSourceUrl} ~ '^https://'`,
    ),
    index("outdated_reports_status_created_idx").on(
      table.status,
      table.createdAt.desc(),
    ),
    index("outdated_reports_claim_idx").on(table.claimId),
    index("outdated_reports_country_idx").on(table.countryId),
    index("outdated_reports_release_idx").on(table.releaseId),
    index("outdated_reports_reporter_idx").on(table.reporterUserId),
    index("outdated_reports_resolved_by_idx").on(table.resolvedBy),
  ],
);

export const countriesRelations = relations(countries, ({ one, many }) => ({
  portal: one(countryPortals),
  sections: many(portalSections),
  sources: many(sourceDocuments),
  claims: many(claims),
  contentBlocks: many(contentBlocks),
  releases: many(countryReleases),
  outdatedInformationReports: many(outdatedInformationReports),
}));

export const countryPortalsRelations = relations(countryPortals, ({ one }) => ({
  country: one(countries, {
    fields: [countryPortals.countryId],
    references: [countries.id],
  }),
}));

export const portalSectionsRelations = relations(
  portalSections,
  ({ one, many }) => ({
    country: one(countries, {
      fields: [portalSections.countryId],
      references: [countries.id],
    }),
    claims: many(claims),
    contentBlocks: many(contentBlocks),
    releaseClaimVersions: many(releaseClaimVersions),
    releaseBlockVersions: many(releaseBlockVersions),
  }),
);

export const claimCategoriesRelations = relations(
  claimCategories,
  ({ many }) => ({
    claims: many(claims),
  }),
);

export const sourceDocumentsRelations = relations(
  sourceDocuments,
  ({ one, many }) => ({
    country: one(countries, {
      fields: [sourceDocuments.countryId],
      references: [countries.id],
    }),
    snapshots: many(sourceSnapshots),
    citations: many(claimVersionCitations),
    reviews: many(editorialReviews),
  }),
);

export const sourceSnapshotsRelations = relations(
  sourceSnapshots,
  ({ one, many }) => ({
    sourceDocument: one(sourceDocuments, {
      fields: [sourceSnapshots.sourceDocumentId],
      references: [sourceDocuments.id],
    }),
    citations: many(claimVersionCitations),
    reviews: many(editorialReviews),
  }),
);

export const claimsRelations = relations(claims, ({ one, many }) => ({
  country: one(countries, {
    fields: [claims.countryId],
    references: [countries.id],
  }),
  category: one(claimCategories, {
    fields: [claims.categoryId],
    references: [claimCategories.id],
  }),
  portalSection: one(portalSections, {
    fields: [claims.portalSectionId],
    references: [portalSections.id],
  }),
  versions: many(claimVersions),
  releaseClaimVersions: many(releaseClaimVersions),
  outdatedInformationReports: many(outdatedInformationReports),
}));

export const claimVersionsRelations = relations(
  claimVersions,
  ({ one, many }) => ({
    claim: one(claims, {
      fields: [claimVersions.claimId],
      references: [claims.id],
    }),
    citations: many(claimVersionCitations),
    contentBlockClaims: many(contentBlockClaims),
    releaseClaimVersions: many(releaseClaimVersions),
    reviews: many(editorialReviews),
  }),
);

export const contentBlocksRelations = relations(
  contentBlocks,
  ({ one, many }) => ({
    country: one(countries, {
      fields: [contentBlocks.countryId],
      references: [countries.id],
    }),
    portalSection: one(portalSections, {
      fields: [contentBlocks.portalSectionId],
      references: [portalSections.id],
    }),
    versions: many(contentBlockVersions),
    releaseBlockVersions: many(releaseBlockVersions),
  }),
);

export const contentBlockVersionsRelations = relations(
  contentBlockVersions,
  ({ one, many }) => ({
    contentBlock: one(contentBlocks, {
      fields: [contentBlockVersions.contentBlockId],
      references: [contentBlocks.id],
    }),
    claims: many(contentBlockClaims),
    releaseBlockVersions: many(releaseBlockVersions),
    reviews: many(editorialReviews),
  }),
);

export const claimVersionCitationsRelations = relations(
  claimVersionCitations,
  ({ one }) => ({
    claimVersion: one(claimVersions, {
      fields: [claimVersionCitations.claimVersionId],
      references: [claimVersions.id],
    }),
    sourceDocument: one(sourceDocuments, {
      fields: [claimVersionCitations.sourceDocumentId],
      references: [sourceDocuments.id],
    }),
    sourceSnapshot: one(sourceSnapshots, {
      fields: [claimVersionCitations.sourceSnapshotId],
      references: [sourceSnapshots.id],
    }),
  }),
);

export const contentBlockClaimsRelations = relations(
  contentBlockClaims,
  ({ one }) => ({
    contentBlockVersion: one(contentBlockVersions, {
      fields: [contentBlockClaims.contentBlockVersionId],
      references: [contentBlockVersions.id],
    }),
    claimVersion: one(claimVersions, {
      fields: [contentBlockClaims.claimVersionId],
      references: [claimVersions.id],
    }),
  }),
);

export const countryReleasesRelations = relations(
  countryReleases,
  ({ one, many }) => ({
    country: one(countries, {
      fields: [countryReleases.countryId],
      references: [countries.id],
    }),
    claimVersions: many(releaseClaimVersions),
    blockVersions: many(releaseBlockVersions),
    reviews: many(editorialReviews),
    outdatedInformationReports: many(outdatedInformationReports),
  }),
);

export const releaseClaimVersionsRelations = relations(
  releaseClaimVersions,
  ({ one }) => ({
    release: one(countryReleases, {
      fields: [releaseClaimVersions.releaseId],
      references: [countryReleases.id],
    }),
    claim: one(claims, {
      fields: [releaseClaimVersions.claimId],
      references: [claims.id],
    }),
    claimVersion: one(claimVersions, {
      fields: [releaseClaimVersions.claimVersionId],
      references: [claimVersions.id],
    }),
    portalSection: one(portalSections, {
      fields: [releaseClaimVersions.portalSectionId],
      references: [portalSections.id],
    }),
  }),
);

export const releaseBlockVersionsRelations = relations(
  releaseBlockVersions,
  ({ one }) => ({
    release: one(countryReleases, {
      fields: [releaseBlockVersions.releaseId],
      references: [countryReleases.id],
    }),
    contentBlock: one(contentBlocks, {
      fields: [releaseBlockVersions.contentBlockId],
      references: [contentBlocks.id],
    }),
    contentBlockVersion: one(contentBlockVersions, {
      fields: [releaseBlockVersions.contentBlockVersionId],
      references: [contentBlockVersions.id],
    }),
    portalSection: one(portalSections, {
      fields: [releaseBlockVersions.portalSectionId],
      references: [portalSections.id],
    }),
  }),
);

export const editorialReviewsRelations = relations(
  editorialReviews,
  ({ one }) => ({
    sourceDocument: one(sourceDocuments, {
      fields: [editorialReviews.sourceDocumentId],
      references: [sourceDocuments.id],
    }),
    reviewedSnapshot: one(sourceSnapshots, {
      fields: [editorialReviews.reviewedSnapshotId],
      references: [sourceSnapshots.id],
    }),
    claimVersion: one(claimVersions, {
      fields: [editorialReviews.claimVersionId],
      references: [claimVersions.id],
    }),
    contentBlockVersion: one(contentBlockVersions, {
      fields: [editorialReviews.contentBlockVersionId],
      references: [contentBlockVersions.id],
    }),
    release: one(countryReleases, {
      fields: [editorialReviews.releaseId],
      references: [countryReleases.id],
    }),
  }),
);

export const outdatedInformationReportsRelations = relations(
  outdatedInformationReports,
  ({ one }) => ({
    country: one(countries, {
      fields: [outdatedInformationReports.countryId],
      references: [countries.id],
    }),
    claim: one(claims, {
      fields: [outdatedInformationReports.claimId],
      references: [claims.id],
    }),
    release: one(countryReleases, {
      fields: [outdatedInformationReports.releaseId],
      references: [countryReleases.id],
    }),
  }),
);

/** Existing security-invoker views; their SQL definitions live in migrations. */
export const publishedCountryPortals = pgView("published_country_portals", {
  countryId: uuid("country_id"),
  isoCode: char("iso_code", { length: 2 }),
  countrySlug: text("country_slug"),
  countryName: text("country_name"),
  region: text("region"),
  flagEmoji: text("flag_emoji"),
  summary: text("summary"),
  coverageLevel: portalCoverageLevelEnum("coverage_level"),
  defaultLocale: text("default_locale"),
  audienceScope: jsonb("audience_scope").$type<AudienceScope>(),
  overview: text("overview"),
  releaseId: uuid("release_id"),
  releaseNumber: integer("release_number"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
}).existing();

export const publishedCountryClaims = pgView("published_country_claims", {
  countrySlug: text("country_slug"),
  releaseId: uuid("release_id"),
  releaseNumber: integer("release_number"),
  sectionSlug: text("section_slug"),
  sectionTitle: text("section_title"),
  sortOrder: integer("sort_order"),
  claimId: uuid("claim_id"),
  claimSlug: text("claim_slug"),
  riskLevel: claimRiskLevelEnum("risk_level"),
  requiresProfessionalReview: boolean("requires_professional_review"),
  claimVersionId: uuid("claim_version_id"),
  versionNumber: integer("version_number"),
  publicSummary: text("public_summary"),
  userMeaning: text("user_meaning"),
  applicability: jsonb("applicability").$type<AudienceScope>(),
  locale: text("locale"),
  confidenceLevel: claimConfidenceLevelEnum("confidence_level"),
  reviewDueAt: timestamp("review_due_at", { withTimezone: true }),
  citations: jsonb("citations").$type<PublishedCitation[]>(),
}).existing();

export const publishedCountryBlocks = pgView("published_country_blocks", {
  countrySlug: text("country_slug"),
  releaseId: uuid("release_id"),
  releaseNumber: integer("release_number"),
  sectionSlug: text("section_slug"),
  sectionTitle: text("section_title"),
  sortOrder: integer("sort_order"),
  contentBlockId: uuid("content_block_id"),
  contentBlockSlug: text("content_block_slug"),
  kind: contentBlockKindEnum("kind"),
  riskLevel: claimRiskLevelEnum("risk_level"),
  contentBlockVersionId: uuid("content_block_version_id"),
  versionNumber: integer("version_number"),
  title: text("title"),
  body: jsonb("body").$type<JsonObject>(),
  claimVersionIds: jsonb("claim_version_ids").$type<string[]>(),
}).existing();

export type StaffRole = (typeof staffRoleEnum.enumValues)[number];
export type CountryVisibility = (typeof countryVisibilityEnum.enumValues)[number];
export type PortalCoverageLevel = (typeof portalCoverageLevelEnum.enumValues)[number];
export type SourceAuthorityLevel = (typeof sourceAuthorityLevelEnum.enumValues)[number];
export type SourceDocumentState = (typeof sourceDocumentStateEnum.enumValues)[number];
export type ClaimRiskLevel = (typeof claimRiskLevelEnum.enumValues)[number];
export type ClaimConfidenceLevel = (typeof claimConfidenceLevelEnum.enumValues)[number];
export type EditorialWorkflowState = (typeof editorialWorkflowStateEnum.enumValues)[number];
export type CitationRole = (typeof citationRoleEnum.enumValues)[number];
export type ContentBlockKind = (typeof contentBlockKindEnum.enumValues)[number];
export type CountryReleaseState = (typeof countryReleaseStateEnum.enumValues)[number];
export type EditorialReviewKind = (typeof editorialReviewKindEnum.enumValues)[number];
export type EditorialReviewDecision = (typeof editorialReviewDecisionEnum.enumValues)[number];
export type OutdatedReportStatus = (typeof outdatedReportStatusEnum.enumValues)[number];

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type UserPlanRecord = typeof userPlans.$inferSelect;
export type NewUserPlanRecord = typeof userPlans.$inferInsert;
export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type NewEmailSubscriber = typeof emailSubscribers.$inferInsert;
export type StaffMembership = typeof staffMemberships.$inferSelect;
export type NewStaffMembership = typeof staffMemberships.$inferInsert;
export type ClaimCategory = typeof claimCategories.$inferSelect;
export type NewClaimCategory = typeof claimCategories.$inferInsert;
export type Country = typeof countries.$inferSelect;
export type NewCountry = typeof countries.$inferInsert;
export type CountryPortal = typeof countryPortals.$inferSelect;
export type NewCountryPortal = typeof countryPortals.$inferInsert;
export type PortalSection = typeof portalSections.$inferSelect;
export type NewPortalSection = typeof portalSections.$inferInsert;
export type SourceDocument = typeof sourceDocuments.$inferSelect;
export type NewSourceDocument = typeof sourceDocuments.$inferInsert;
export type SourceSnapshot = typeof sourceSnapshots.$inferSelect;
export type NewSourceSnapshot = typeof sourceSnapshots.$inferInsert;
export type Claim = typeof claims.$inferSelect;
export type NewClaim = typeof claims.$inferInsert;
export type ClaimVersion = typeof claimVersions.$inferSelect;
export type NewClaimVersion = typeof claimVersions.$inferInsert;
export type ContentBlock = typeof contentBlocks.$inferSelect;
export type NewContentBlock = typeof contentBlocks.$inferInsert;
export type ContentBlockVersion = typeof contentBlockVersions.$inferSelect;
export type NewContentBlockVersion = typeof contentBlockVersions.$inferInsert;
export type ClaimVersionCitation = typeof claimVersionCitations.$inferSelect;
export type NewClaimVersionCitation = typeof claimVersionCitations.$inferInsert;
export type ContentBlockClaim = typeof contentBlockClaims.$inferSelect;
export type NewContentBlockClaim = typeof contentBlockClaims.$inferInsert;
export type CountryRelease = typeof countryReleases.$inferSelect;
export type NewCountryRelease = typeof countryReleases.$inferInsert;
export type ReleaseClaimVersion = typeof releaseClaimVersions.$inferSelect;
export type NewReleaseClaimVersion = typeof releaseClaimVersions.$inferInsert;
export type ReleaseBlockVersion = typeof releaseBlockVersions.$inferSelect;
export type NewReleaseBlockVersion = typeof releaseBlockVersions.$inferInsert;
export type EditorialReview = typeof editorialReviews.$inferSelect;
export type NewEditorialReview = typeof editorialReviews.$inferInsert;
export type EditorialAuditEvent = typeof editorialAuditEvents.$inferSelect;
export type NewEditorialAuditEvent = typeof editorialAuditEvents.$inferInsert;
export type OutdatedInformationReport = typeof outdatedInformationReports.$inferSelect;
export type NewOutdatedInformationReport = typeof outdatedInformationReports.$inferInsert;
export type PublishedCountryPortal = typeof publishedCountryPortals.$inferSelect;
export type PublishedCountryClaim = typeof publishedCountryClaims.$inferSelect;
export type PublishedCountryBlock = typeof publishedCountryBlocks.$inferSelect;
