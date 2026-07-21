"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { StaffSession } from "@/lib/auth/staff";
import { requireStaffSession } from "@/lib/auth/staff";
import type { Enums, Json } from "@/lib/supabase/database.types";
import { missingPhV1SourceDrafts, PH_V1_SOURCE_DRAFTS } from "@/lib/editorial/ph-v1";
import {
  AUTHORITY_LEVELS,
  AUTHOR_ROLES,
  CONFIDENCE_LEVELS,
  CONTENT_BLOCK_KINDS,
  isLaunchCountrySlug,
  PUBLISHER_ROLES,
  REVIEW_DECISIONS,
  REVIEWER_ROLES,
  RISK_LEVELS,
  type LaunchCountrySlug,
} from "./constants";

class ActionInputError extends Error {}

type DatabaseLikeError = {
  code?: string;
  message?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

function rawString(formData: FormData, name: string): string {
  const value = formData.get(name);
  if (typeof value !== "string") return "";
  return value;
}

function requiredText(
  formData: FormData,
  name: string,
  label: string,
  minLength: number,
  maxLength: number,
): string {
  const value = rawString(formData, name).trim();
  if (value.length < minLength) {
    throw new ActionInputError(`${label} must be at least ${minLength} characters.`);
  }
  if (value.length > maxLength) {
    throw new ActionInputError(`${label} must be ${maxLength} characters or fewer.`);
  }
  return value;
}

function optionalText(
  formData: FormData,
  name: string,
  label: string,
  maxLength: number,
): string | null {
  const value = rawString(formData, name).trim();
  if (!value) return null;
  if (value.length > maxLength) {
    throw new ActionInputError(`${label} must be ${maxLength} characters or fewer.`);
  }
  return value;
}

function requiredUuid(formData: FormData, name: string, label: string): string {
  const value = rawString(formData, name).trim();
  if (!UUID_PATTERN.test(value)) {
    throw new ActionInputError(`Choose a valid ${label.toLowerCase()}.`);
  }
  return value;
}

function optionalDate(formData: FormData, name: string, label: string): string | null {
  const value = rawString(formData, name).trim();
  if (!value) return null;
  if (!DATE_PATTERN.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new ActionInputError(`${label} must be a valid date.`);
  }
  return value;
}

function positiveInteger(
  formData: FormData,
  name: string,
  label: string,
  fallback: number,
  maximum: number,
): number {
  const raw = rawString(formData, name).trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new ActionInputError(`${label} must be a whole number from 0 to ${maximum}.`);
  }
  return value;
}

function checked(formData: FormData, name: string): boolean {
  return rawString(formData, name) === "on";
}

function countrySlugFrom(formData: FormData): LaunchCountrySlug {
  const value = rawString(formData, "country_slug").trim().toLowerCase();
  if (!isLaunchCountrySlug(value)) {
    throw new ActionInputError("Choose one of the three launch countries.");
  }
  return value;
}

function safeCountrySlug(formData: FormData): LaunchCountrySlug {
  const value = rawString(formData, "country_slug").trim().toLowerCase();
  return isLaunchCountrySlug(value) ? value : "philippines";
}

function normalizedSlug(formData: FormData, name: string, label: string): string {
  const value = requiredText(formData, name, label, 2, 120)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!SLUG_PATTERN.test(value)) {
    throw new ActionInputError(`${label} needs at least one letter or number.`);
  }
  return value;
}

function commaSeparatedValues(
  formData: FormData,
  name: string,
  label: string,
  maximumItems: number,
): string[] {
  const raw = rawString(formData, name).trim();
  if (!raw) return [];
  const values = [...new Set(raw.split(",").map((value) => value.trim()).filter(Boolean))];
  if (values.length > maximumItems) {
    throw new ActionInputError(`${label} can include at most ${maximumItems} entries.`);
  }
  if (values.some((value) => value.length > 80)) {
    throw new ActionInputError(`Each ${label.toLowerCase()} entry must be 80 characters or fewer.`);
  }
  return values;
}

function enumValue<T extends string>(
  formData: FormData,
  name: string,
  label: string,
  allowedValues: readonly T[],
): T {
  const value = rawString(formData, name).trim() as T;
  if (!allowedValues.includes(value)) {
    throw new ActionInputError(`Choose a valid ${label.toLowerCase()}.`);
  }
  return value;
}

function canonicalHttpsUrl(formData: FormData, name: string): string {
  const value = requiredText(formData, name, "Official source URL", 10, 2000);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ActionInputError("Official source URL must be a complete web address.");
  }
  if (url.protocol !== "https:") {
    throw new ActionInputError("Official source URL must use HTTPS.");
  }
  if (url.username || url.password) {
    throw new ActionInputError("Official source URL cannot contain embedded credentials.");
  }
  url.hash = "";
  return url.toString();
}

function countryCodes(formData: FormData): string[] {
  const codes = commaSeparatedValues(
    formData,
    "citizenship_country_codes",
    "Citizenship country codes",
    30,
  ).map((value) => value.toUpperCase());

  if (codes.some((code) => !COUNTRY_CODE_PATTERN.test(code))) {
    throw new ActionInputError(
      "Citizenship codes must be two-letter country codes separated by commas, such as US, CA.",
    );
  }
  return codes;
}

function reviewChecklist(formData: FormData): Json {
  return {
    accuracyChecked: checked(formData, "accuracy_checked"),
    sourceCurrent: checked(formData, "source_current"),
    plainLanguageChecked: checked(formData, "plain_language_checked"),
    officialSourceChecked: checked(formData, "official_source_checked"),
    linksChecked: checked(formData, "links_checked"),
  };
}

function cleanDatabaseMessage(message: string): string {
  return message.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 240);
}

function friendlyError(error: unknown): string {
  if (error instanceof ActionInputError) return error.message;

  const databaseError = error as DatabaseLikeError;
  if (databaseError?.code === "23505") {
    return "That item already exists. Use a different internal name or choose the existing item.";
  }
  if (databaseError?.code === "23503") {
    return "One of the selected records no longer exists. Refresh the page and try again.";
  }
  if (databaseError?.code === "42501") {
    return cleanDatabaseMessage(
      databaseError.message ?? "Your staff role does not allow this action.",
    );
  }
  if (databaseError?.code === "P0001" && databaseError.message) {
    return cleanDatabaseMessage(databaseError.message);
  }
  if (databaseError?.message?.includes("row-level security")) {
    return "This action is blocked by the editorial permission rules. Confirm your role and the item’s workflow state.";
  }

  console.error("Elsewhere editorial action failed", error);
  return "The change could not be saved. Nothing was published. Refresh and try again.";
}

function rethrowNavigationSignal(error: unknown): void {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    (error.digest.startsWith("NEXT_REDIRECT") || error.digest.startsWith("NEXT_NOT_FOUND"))
  ) {
    throw error;
  }
}

function redirectToWorkspace(
  countrySlug: LaunchCountrySlug,
  kind: "notice" | "error",
  message: string,
): never {
  const query = new URLSearchParams({ [kind]: message });
  redirect(`/admin/content/${countrySlug}?${query.toString()}`);
}

function revalidateCountry(countrySlug: LaunchCountrySlug) {
  revalidatePath("/admin");
  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${countrySlug}`);
  revalidatePath(`/countries/${countrySlug}`);
}

async function countryForSlug(
  supabase: StaffSession["supabase"],
  countrySlug: LaunchCountrySlug,
) {
  const { data, error } = await supabase
    .from("countries")
    .select("id, slug, visibility")
    .eq("slug", countrySlug)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ActionInputError("This country portal has not been initialized yet.");
  return data;
}

export async function createSourceDocumentAction(formData: FormData) {
  const session = await requireStaffSession(AUTHOR_ROLES);
  const fallbackSlug = safeCountrySlug(formData);

  try {
    const countrySlug = countrySlugFrom(formData);
    const country = await countryForSlug(session.supabase, countrySlug);
    const authorityLevel = enumValue(
      formData,
      "authority_level",
      "Source authority",
      AUTHORITY_LEVELS.map((item) => item.value),
    );
    const sourceLanguage = requiredText(
      formData,
      "source_language",
      "Source language",
      2,
      20,
    );
    if (!/^[A-Za-z]{2,3}(?:-[A-Za-z]{2,8})*$/.test(sourceLanguage)) {
      throw new ActionInputError("Source language should look like en, es, or en-US.");
    }
    const translationStatus = enumValue(
      formData,
      "translation_status",
      "Translation status",
      ["not_needed", "machine_draft", "human_reviewed"] as const,
    );

    const { error } = await session.supabase.from("source_documents").insert({
      authority_level: authorityLevel,
      canonical_url: canonicalHttpsUrl(formData, "canonical_url"),
      country_id: country.id,
      created_by: session.userId,
      jurisdiction: optionalText(formData, "jurisdiction", "Jurisdiction", 160),
      publication_date: optionalDate(formData, "publication_date", "Publication date"),
      publisher: requiredText(formData, "publisher", "Publisher", 2, 240),
      source_language: sourceLanguage,
      state: "draft",
      title: requiredText(formData, "title", "Source title", 4, 500),
      translation_status: translationStatus,
    });
    if (error) throw error;

    revalidateCountry(countrySlug);
    redirectToWorkspace(
      countrySlug,
      "notice",
      "Source document saved as a draft. Capture the exact evidence before asking for review.",
    );
  } catch (error) {
    rethrowNavigationSignal(error);
    redirectToWorkspace(fallbackSlug, "error", friendlyError(error));
  }
}

export async function bootstrapPhV1SourcesAction(formData: FormData) {
  const session = await requireStaffSession(AUTHOR_ROLES);
  const fallbackSlug = safeCountrySlug(formData);
  try {
    const countrySlug = countrySlugFrom(formData);
    if (countrySlug !== "philippines") {
      throw new ActionInputError("The PH v1 package is available only in the Philippines workspace.");
    }
    const country = await countryForSlug(session.supabase, countrySlug);
    const { data: existingSources, error: existingError } = await session.supabase
      .from("source_documents")
      .select("canonical_url, country_id")
      .in("canonical_url", PH_V1_SOURCE_DRAFTS.map((source) => source.canonicalUrl));
    if (existingError) throw existingError;
    if ((existingSources ?? []).some((source) => source.country_id !== country.id)) {
      throw new ActionInputError("A package URL is already assigned outside the Philippines workspace. Resolve that source record before bootstrapping.");
    }
    const missingSources = missingPhV1SourceDrafts((existingSources ?? []).map((source) => source.canonical_url));
    if (missingSources.length === 0) {
      redirectToWorkspace(countrySlug, "notice", "The three PH v1 source drafts already exist. No duplicates were created.");
    }
    const { error: insertError } = await session.supabase.from("source_documents").insert(
      missingSources.map((source) => ({ authority_level: source.authorityLevel, canonical_url: source.canonicalUrl, country_id: country.id, created_by: session.userId, jurisdiction: "Philippines", publisher: source.publisher, source_language: "en", state: "draft" as const, title: source.title, translation_status: "not_needed" as const })),
    );
    if (insertError) throw insertError;
    revalidateCountry(countrySlug);
    redirectToWorkspace(countrySlug, "notice", `${missingSources.length} PH v1 source draft${missingSources.length === 1 ? "" : "s"} created. Open each live URL and capture exact reviewed text next.`);
  } catch (error) {
    rethrowNavigationSignal(error);
    redirectToWorkspace(fallbackSlug, "error", friendlyError(error));
  }
}

export async function captureManualSnapshotAction(formData: FormData) {
  const session = await requireStaffSession(AUTHOR_ROLES);
  const fallbackSlug = safeCountrySlug(formData);

  try {
    const countrySlug = countrySlugFrom(formData);
    const country = await countryForSlug(session.supabase, countrySlug);
    const sourceDocumentId = requiredUuid(formData, "source_document_id", "Source document");
    const reviewedText = rawString(formData, "reviewed_text");
    if (reviewedText.trim().length < 20) {
      throw new ActionInputError("Paste at least 20 characters of the evidence you reviewed.");
    }
    if (reviewedText.length > 1_000_000) {
      throw new ActionInputError("Reviewed text is too large. Capture a focused page or section instead.");
    }

    const { data: source, error: sourceError } = await session.supabase
      .from("source_documents")
      .select("id, country_id")
      .eq("id", sourceDocumentId)
      .maybeSingle();
    if (sourceError) throw sourceError;
    if (!source || source.country_id !== country.id) {
      throw new ActionInputError("Choose a source from this country workspace.");
    }

    const normalizedEvidence = reviewedText.replace(/\r\n?/g, "\n");
    const contentHash = createHash("sha256")
      .update(normalizedEvidence, "utf8")
      .digest("hex");
    const storagePath = `${session.userId}/${sourceDocumentId}/${contentHash}.txt`;

    const { data: existingSnapshot, error: existingSnapshotError } =
      await session.supabase
        .from("source_snapshots")
        .select("id")
        .eq("source_document_id", sourceDocumentId)
        .eq("content_hash", contentHash)
        .maybeSingle();
    if (existingSnapshotError) throw existingSnapshotError;
    if (existingSnapshot) {
      throw new ActionInputError(
        "That exact evidence is already captured for this source.",
      );
    }

    // Remove only an unreferenced upload left by an interrupted prior attempt.
    await session.supabase.storage.from("source-evidence").remove([storagePath]);
    const evidenceBytes = Buffer.from(normalizedEvidence, "utf8");
    const { error: uploadError } = await session.supabase.storage
      .from("source-evidence")
      .upload(storagePath, evidenceBytes, {
        cacheControl: "0",
        contentType: "text/plain",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { error } = await session.supabase.from("source_snapshots").insert({
      capture_method: "manual",
      captured_by: session.userId,
      captured_title: optionalText(formData, "captured_title", "Capture label", 500),
      content_hash: contentHash,
      source_document_id: sourceDocumentId,
      storage_path: storagePath,
    });
    if (error) {
      await session.supabase.storage.from("source-evidence").remove([storagePath]);
      throw error;
    }

    revalidateCountry(countrySlug);
    redirectToWorkspace(
      countrySlug,
      "notice",
      "Exact evidence retained privately with a SHA-256 fingerprint for reproducible review.",
    );
  } catch (error) {
    rethrowNavigationSignal(error);
    redirectToWorkspace(fallbackSlug, "error", friendlyError(error));
  }
}

export async function createClaimDraftAction(formData: FormData) {
  const session = await requireStaffSession(AUTHOR_ROLES);
  const fallbackSlug = safeCountrySlug(formData);

  try {
    const countrySlug = countrySlugFrom(formData);
    const country = await countryForSlug(session.supabase, countrySlug);
    const categoryId = requiredUuid(formData, "category_id", "Claim category");
    const sectionId = requiredUuid(formData, "portal_section_id", "Portal section");
    const sourceDocumentId = requiredUuid(formData, "source_document_id", "Source document");
    const sourceSnapshotId = requiredUuid(formData, "source_snapshot_id", "Evidence snapshot");
    const riskLevel = enumValue(
      formData,
      "risk_level",
      "Risk level",
      RISK_LEVELS.map((item) => item.value),
    );
    const confidenceLevel = enumValue(
      formData,
      "confidence_level",
      "Confidence level",
      CONFIDENCE_LEVELS.map((item) => item.value),
    );
    const claimSlug = normalizedSlug(formData, "claim_slug", "Internal claim name");
    const effectiveFrom = optionalDate(formData, "effective_from", "Effective-from date");
    const effectiveUntil = optionalDate(formData, "effective_until", "Effective-until date");
    if (effectiveFrom && effectiveUntil && effectiveUntil < effectiveFrom) {
      throw new ActionInputError("Effective-until date cannot be before effective-from date.");
    }
    const locale = requiredText(formData, "locale", "Language", 2, 20);
    if (!/^[A-Za-z]{2,3}(?:-[A-Za-z]{2,8})*$/.test(locale)) {
      throw new ActionInputError("Language should look like en, es, or en-US.");
    }
    const preciseText = requiredText(formData, "precise_text", "Precise claim", 10, 10_000);
    const publicSummary = requiredText(formData, "public_summary", "Public summary", 10, 5_000);
    const userMeaning = optionalText(formData, "user_meaning", "What this means", 5_000);
    const evidenceExcerpt = optionalText(formData, "evidence_excerpt", "Evidence excerpt", 1_000);
    const exactLocator = requiredText(formData, "exact_locator", "Exact locator", 2, 500);
    const supportNote = requiredText(formData, "support_note", "Evidence boundary note", 10, 1_000);

    const [categoryResult, sectionResult, sourceResult, snapshotResult] = await Promise.all([
      session.supabase
        .from("claim_categories")
        .select("id, portal_section_slug, default_risk_level, requires_professional_review")
        .eq("id", categoryId)
        .eq("is_active", true)
        .maybeSingle(),
      session.supabase
        .from("portal_sections")
        .select("id, country_id, slug")
        .eq("id", sectionId)
        .maybeSingle(),
      session.supabase
        .from("source_documents")
        .select("id, country_id, authority_level")
        .eq("id", sourceDocumentId)
        .maybeSingle(),
      session.supabase
        .from("source_snapshots")
        .select("id, source_document_id")
        .eq("id", sourceSnapshotId)
        .maybeSingle(),
    ]);
    for (const result of [categoryResult, sectionResult, sourceResult, snapshotResult]) {
      if (result.error) throw result.error;
    }

    const category = categoryResult.data;
    const section = sectionResult.data;
    const source = sourceResult.data;
    const snapshot = snapshotResult.data;
    if (!category) throw new ActionInputError("Choose an active claim category.");
    if (!section || section.country_id !== country.id) {
      throw new ActionInputError("Choose a section from this country portal.");
    }
    if (section.slug !== category.portal_section_slug) {
      throw new ActionInputError(
        "That category belongs in a different portal section. Choose the matching section.",
      );
    }
    if (!source || (source.country_id !== country.id && source.country_id !== null)) {
      throw new ActionInputError("Choose a source that applies to this country.");
    }
    if (!snapshot || snapshot.source_document_id !== source.id) {
      throw new ActionInputError("The evidence snapshot must belong to the selected source.");
    }

    const riskRank: Record<Enums<"claim_risk_level">, number> = {
      low: 0,
      medium: 1,
      high: 2,
      critical: 3,
    };
    if (riskRank[riskLevel] < riskRank[category.default_risk_level]) {
      throw new ActionInputError(
        `This category requires at least ${category.default_risk_level} risk handling.`,
      );
    }

    const citizenshipCountryCodes = countryCodes(formData);
    const purposes = commaSeparatedValues(formData, "purposes", "Purposes", 20);
    const applicabilityNote = optionalText(
      formData,
      "applicability_note",
      "Applicability note",
      1000,
    );
    const applicability: Json = {
      schemaVersion: 1,
      citizenshipCountryCodes,
      residenceCountryCodes: [],
      purposes,
      durationBands: [],
      householdTags: [],
      ...(applicabilityNote ? { editorialNote: applicabilityNote } : {}),
    };

    const { error: createError } = await session.supabase.rpc(
      "create_claim_draft_atomic",
      {
        citation_evidence_excerpt: evidenceExcerpt,
        citation_exact_locator: exactLocator,
        citation_source_document_id: source.id,
        citation_source_snapshot_id: snapshot.id,
        citation_support_note: supportNote,
        target_category_id: category.id,
        target_claim_slug: claimSlug,
        target_country_id: country.id,
        target_portal_section_id: section.id,
        target_requires_professional_review:
          checked(formData, "requires_professional_review") ||
          category.requires_professional_review,
        target_risk_level: riskLevel,
        version_applicability: applicability,
        version_confidence_level: confidenceLevel,
        version_effective_from: effectiveFrom,
        version_effective_until: effectiveUntil,
        version_locale: locale,
        version_precise_text: preciseText,
        version_public_summary: publicSummary,
        version_user_meaning: userMeaning,
      },
    );
    if (createError) throw createError;

    revalidateCountry(countrySlug);
    redirectToWorkspace(
      countrySlug,
      "notice",
      "Claim, first version, and exact primary citation saved atomically as a draft.",
    );
  } catch (error) {
    rethrowNavigationSignal(error);
    redirectToWorkspace(fallbackSlug, "error", friendlyError(error));
  }
}

export async function createContentBlockDraftAction(formData: FormData) {
  const session = await requireStaffSession(AUTHOR_ROLES);
  const fallbackSlug = safeCountrySlug(formData);

  try {
    const countrySlug = countrySlugFrom(formData);
    const country = await countryForSlug(session.supabase, countrySlug);
    const sectionId = requiredUuid(formData, "portal_section_id", "Portal section");
    const kind = enumValue(
      formData,
      "kind",
      "Content format",
      CONTENT_BLOCK_KINDS.map((item) => item.value),
    );
    const riskLevel = enumValue(
      formData,
      "risk_level",
      "Risk level",
      RISK_LEVELS.map((item) => item.value),
    );
    const bodyText = requiredText(formData, "body_text", "Content", 10, 20_000);
    const blockSlug = normalizedSlug(formData, "block_slug", "Internal block name");
    const blockTitle = optionalText(formData, "title", "Block title", 500);
    const supportingClaimVersionId = requiredUuid(
      formData,
      "supporting_claim_version_id",
      "Supporting claim",
    );

    const { data: section, error: sectionError } = await session.supabase
      .from("portal_sections")
      .select("id, country_id")
      .eq("id", sectionId)
      .maybeSingle();
    if (sectionError) throw sectionError;
    if (!section || section.country_id !== country.id) {
      throw new ActionInputError("Choose a section from this country portal.");
    }

    const { data: supportingVersion, error: supportingError } =
      await session.supabase
        .from("claim_versions")
        .select("id, claim_id")
        .eq("id", supportingClaimVersionId)
        .maybeSingle();
    if (supportingError) throw supportingError;
    if (!supportingVersion) {
      throw new ActionInputError("Choose an existing supporting claim.");
    }
    const { data: supportingClaim, error: claimError } = await session.supabase
      .from("claims")
      .select("country_id")
      .eq("id", supportingVersion.claim_id)
      .maybeSingle();
    if (claimError) throw claimError;
    if (!supportingClaim || supportingClaim.country_id !== country.id) {
      throw new ActionInputError("Supporting claims must belong to the same country.");
    }

    const body: Json = {
      schemaVersion: 1,
      format: "plain_text",
      text: bodyText,
      paragraphs: bodyText
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
    };
    const { error: createError } = await session.supabase.rpc(
      "create_content_block_draft_atomic",
      {
        supporting_claim_version_id: supportingClaimVersionId,
        target_block_slug: blockSlug,
        target_country_id: country.id,
        target_kind: kind,
        target_portal_section_id: section.id,
        target_risk_level: riskLevel,
        version_body: body,
        version_title: blockTitle,
      },
    );
    if (createError) throw createError;

    revalidateCountry(countrySlug);
    redirectToWorkspace(
      countrySlug,
      "notice",
      "Content block, first version, and supporting claim link saved atomically.",
    );
  } catch (error) {
    rethrowNavigationSignal(error);
    redirectToWorkspace(fallbackSlug, "error", friendlyError(error));
  }
}

export async function createReleaseAction(formData: FormData) {
  const session = await requireStaffSession(AUTHOR_ROLES);
  const fallbackSlug = safeCountrySlug(formData);

  try {
    const countrySlug = countrySlugFrom(formData);
    const country = await countryForSlug(session.supabase, countrySlug);
    const { error } = await session.supabase.rpc(
      "create_country_release_draft_atomic",
      {
        target_country_id: country.id,
        target_release_notes: requiredText(
          formData,
          "release_notes",
          "Release purpose",
          10,
          2_000,
        ),
      },
    );
    if (error) throw error;

    revalidateCountry(countrySlug);
    redirectToWorkspace(
      countrySlug,
      "notice",
      "A new empty draft release was numbered and created atomically.",
    );
  } catch (error) {
    rethrowNavigationSignal(error);
    redirectToWorkspace(fallbackSlug, "error", friendlyError(error));
  }
}

export async function addReleaseItemAction(formData: FormData) {
  const session = await requireStaffSession(AUTHOR_ROLES);
  const fallbackSlug = safeCountrySlug(formData);

  try {
    const countrySlug = countrySlugFrom(formData);
    const country = await countryForSlug(session.supabase, countrySlug);
    const releaseId = requiredUuid(formData, "release_id", "Release");
    const itemType = enumValue(formData, "item_type", "Release item type", ["claim", "block"] as const);
    const versionId = requiredUuid(formData, "version_id", "Version");
    const sortOrder = positiveInteger(formData, "sort_order", "Sort order", 0, 100_000);

    const { data: release, error: releaseError } = await session.supabase
      .from("country_releases")
      .select("id, country_id, state")
      .eq("id", releaseId)
      .maybeSingle();
    if (releaseError) throw releaseError;
    if (!release || release.country_id !== country.id) {
      throw new ActionInputError("Choose a release from this country workspace.");
    }
    if (release.state !== "draft" && release.state !== "ready") {
      throw new ActionInputError("Published release history cannot be recomposed.");
    }

    if (itemType === "claim") {
      const { data: version, error: versionError } = await session.supabase
        .from("claim_versions")
        .select("id, claim_id")
        .eq("id", versionId)
        .maybeSingle();
      if (versionError) throw versionError;
      if (!version) throw new ActionInputError("Choose an existing claim version.");
      const { data: claim, error: claimError } = await session.supabase
        .from("claims")
        .select("id, country_id, portal_section_id")
        .eq("id", version.claim_id)
        .maybeSingle();
      if (claimError) throw claimError;
      if (!claim || claim.country_id !== country.id || !claim.portal_section_id) {
        throw new ActionInputError("The claim must belong to a section in this country portal.");
      }

      const { error } = await session.supabase.from("release_claim_versions").insert({
        claim_id: claim.id,
        claim_version_id: version.id,
        portal_section_id: claim.portal_section_id,
        release_id: release.id,
        sort_order: sortOrder,
      });
      if (error) throw error;
    } else {
      const { data: version, error: versionError } = await session.supabase
        .from("content_block_versions")
        .select("id, content_block_id")
        .eq("id", versionId)
        .maybeSingle();
      if (versionError) throw versionError;
      if (!version) throw new ActionInputError("Choose an existing content-block version.");
      const { data: block, error: blockError } = await session.supabase
        .from("content_blocks")
        .select("id, country_id, portal_section_id")
        .eq("id", version.content_block_id)
        .maybeSingle();
      if (blockError) throw blockError;
      if (!block || block.country_id !== country.id) {
        throw new ActionInputError("The content block must belong to this country portal.");
      }

      const { error } = await session.supabase.from("release_block_versions").insert({
        content_block_id: block.id,
        content_block_version_id: version.id,
        portal_section_id: block.portal_section_id,
        release_id: release.id,
        sort_order: sortOrder,
      });
      if (error) throw error;
    }

    revalidateCountry(countrySlug);
    redirectToWorkspace(
      countrySlug,
      "notice",
      "Exact version added to the release. Any previous release approval was reset for safety.",
    );
  } catch (error) {
    rethrowNavigationSignal(error);
    redirectToWorkspace(fallbackSlug, "error", friendlyError(error));
  }
}

export async function removeReleaseItemAction(formData: FormData) {
  const session = await requireStaffSession(PUBLISHER_ROLES);
  const fallbackSlug = safeCountrySlug(formData);

  try {
    const countrySlug = countrySlugFrom(formData);
    const country = await countryForSlug(session.supabase, countrySlug);
    const releaseId = requiredUuid(formData, "release_id", "Release");
    const itemType = enumValue(formData, "item_type", "Release item type", ["claim", "block"] as const);
    const versionId = requiredUuid(formData, "version_id", "Version");

    const { data: release, error: releaseError } = await session.supabase
      .from("country_releases")
      .select("id, country_id, state")
      .eq("id", releaseId)
      .maybeSingle();
    if (releaseError) throw releaseError;
    if (!release || release.country_id !== country.id) {
      throw new ActionInputError("Choose a release from this country workspace.");
    }
    if (release.state !== "draft" && release.state !== "ready") {
      throw new ActionInputError("Published release history cannot be recomposed.");
    }

    const result =
      itemType === "claim"
        ? await session.supabase
            .from("release_claim_versions")
            .delete()
            .eq("release_id", release.id)
            .eq("claim_version_id", versionId)
        : await session.supabase
            .from("release_block_versions")
            .delete()
            .eq("release_id", release.id)
            .eq("content_block_version_id", versionId);
    if (result.error) throw result.error;

    revalidateCountry(countrySlug);
    redirectToWorkspace(
      countrySlug,
      "notice",
      "Pinned version removed. The release returned to draft and must pass release QA again.",
    );
  } catch (error) {
    rethrowNavigationSignal(error);
    redirectToWorkspace(fallbackSlug, "error", friendlyError(error));
  }
}

export async function reviewEditorialItemAction(formData: FormData) {
  const session = await requireStaffSession(REVIEWER_ROLES);
  const fallbackSlug = safeCountrySlug(formData);

  try {
    const countrySlug = countrySlugFrom(formData);
    await countryForSlug(session.supabase, countrySlug);
    const targetType = enumValue(formData, "target_type", "Review item type", [
      "source",
      "claim",
      "block",
      "release",
    ] as const);
    const targetId = requiredUuid(formData, "target_id", "Review item");
    const decision = enumValue(
      formData,
      "review_decision",
      "Review decision",
      REVIEW_DECISIONS.map((item) => item.value),
    );
    const notes = optionalText(formData, "review_notes", "Review notes", 4_000);
    const checklist = reviewChecklist(formData);
    if (decision !== "approved" && (!notes || notes.length < 10)) {
      throw new ActionInputError(
        "Explain the requested changes or rejection in at least 10 characters.",
      );
    }
    if (decision === "approved") {
      const requiredChecks = [
        ["accuracy_checked", "accuracy"],
        ["source_current", "evidence freshness"],
        ["links_checked", "links and locators"],
      ] as const;
      for (const [field, label] of requiredChecks) {
        if (!checked(formData, field)) {
          throw new ActionInputError(`Confirm ${label} before approving.`);
        }
      }
      if (
        (targetType === "claim" || targetType === "block" || targetType === "release") &&
        !checked(formData, "plain_language_checked")
      ) {
        throw new ActionInputError("Confirm the plain-language review before approving.");
      }
      if (
        (targetType === "source" || targetType === "claim" || targetType === "release") &&
        !checked(formData, "official_source_checked")
      ) {
        throw new ActionInputError("Confirm the authority-level review before approving.");
      }
    }

    let error: DatabaseLikeError | null = null;
    if (targetType === "source") {
      ({ error } = await session.supabase.rpc("review_source_document", {
        review_checklist: checklist,
        review_decision: decision,
        review_notes: notes ?? undefined,
        target_source_document_id: targetId,
      }));
    } else if (targetType === "claim") {
      ({ error } = await session.supabase.rpc("review_claim_version", {
        review_checklist: checklist,
        review_decision: decision,
        review_notes: notes ?? undefined,
        target_claim_version_id: targetId,
      }));
    } else if (targetType === "block") {
      ({ error } = await session.supabase.rpc("review_content_block_version", {
        review_checklist: checklist,
        review_decision: decision,
        review_notes: notes ?? undefined,
        target_content_block_version_id: targetId,
      }));
    } else {
      ({ error } = await session.supabase.rpc("review_country_release", {
        review_checklist: checklist,
        review_decision: decision,
        review_notes: notes ?? undefined,
        target_release_id: targetId,
      }));
    }
    if (error) throw error;

    revalidateCountry(countrySlug);
    redirectToWorkspace(
      countrySlug,
      "notice",
      `Review recorded as ${decision.replace(/_/g, " ")}. The review event is permanent.`,
    );
  } catch (error) {
    rethrowNavigationSignal(error);
    redirectToWorkspace(fallbackSlug, "error", friendlyError(error));
  }
}

export async function publishCountryReleaseAction(formData: FormData) {
  const session = await requireStaffSession(PUBLISHER_ROLES);
  const fallbackSlug = safeCountrySlug(formData);

  try {
    const countrySlug = countrySlugFrom(formData);
    await countryForSlug(session.supabase, countrySlug);
    if (session.aal !== "aal2") {
      throw new ActionInputError(
        "Publishing requires multi-factor authentication. Complete MFA, refresh this page, and try again.",
      );
    }
    if (!checked(formData, "confirm_publish")) {
      throw new ActionInputError("Confirm that you intend to replace the current public release.");
    }

    const releaseId = requiredUuid(formData, "release_id", "Release");
    const { data: release, error: releaseError } = await session.supabase
      .from("country_releases")
      .select("id, country_id, state")
      .eq("id", releaseId)
      .maybeSingle();
    if (releaseError) throw releaseError;
    const country = await countryForSlug(session.supabase, countrySlug);
    if (!release || release.country_id !== country.id) {
      throw new ActionInputError("Choose a release from this country workspace.");
    }
    if (release.state !== "ready") {
      throw new ActionInputError("Release QA must approve this exact composition before publishing.");
    }

    const { error } = await session.supabase.rpc("publish_country_release", {
      target_release_id: release.id,
    });
    if (error) throw error;

    revalidateCountry(countrySlug);
    redirectToWorkspace(
      countrySlug,
      "notice",
      "Release published. The previous public release, if any, is preserved as immutable history.",
    );
  } catch (error) {
    rethrowNavigationSignal(error);
    redirectToWorkspace(fallbackSlug, "error", friendlyError(error));
  }
}
