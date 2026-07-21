import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffSession } from "@/lib/auth/staff";
import {
  isPhV1ClaimTemplateId,
  evaluatePhV1Readiness,
  PH_V1_CLAIM_TEMPLATES,
  PH_V1_NEXT_ACTION,
  PH_V1_SOURCE_DRAFTS,
} from "@/lib/editorial/ph-v1";
import type { Json, Tables } from "@/lib/supabase/database.types";
import {
  AdminCard,
  AdminSectionHeading,
  EmptyState,
  FieldLabel,
  fieldClass,
  NoticeBanner,
  primaryButtonClass,
  quietButtonClass,
  secondaryButtonClass,
  StatusBadge,
  textareaClass,
} from "../../_components/admin-ui";
import {
  addReleaseItemAction,
  bootstrapPhV1SourcesAction,
  captureManualSnapshotAction,
  createClaimDraftAction,
  createContentBlockDraftAction,
  createReleaseAction,
  createSourceDocumentAction,
  publishCountryReleaseAction,
  removeReleaseItemAction,
  reviewEditorialItemAction,
} from "../actions";
import {
  AUTHORITY_LEVELS,
  AUTHOR_ROLES,
  CONFIDENCE_LEVELS,
  CONTENT_BLOCK_KINDS,
  hasRole,
  isLaunchCountrySlug,
  PUBLISHER_ROLES,
  REVIEW_DECISIONS,
  REVIEWER_ROLES,
  RISK_LEVELS,
  type LaunchCountrySlug,
} from "../constants";

type SourceDocument = Tables<"source_documents">;
type SourceSnapshot = Tables<"source_snapshots">;
type Claim = Tables<"claims">;
type ClaimVersion = Tables<"claim_versions">;
type Citation = Tables<"claim_version_citations">;
type ContentBlock = Tables<"content_blocks">;
type ContentBlockVersion = Tables<"content_block_versions">;
type CountryRelease = Tables<"country_releases">;
type ReleaseClaim = Tables<"release_claim_versions">;
type ReleaseBlock = Tables<"release_block_versions">;

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function shortId(value: string): string {
  return `${value.slice(0, 8)}…`;
}

function sourceLabel(source: SourceDocument): string {
  return `${source.publisher} — ${source.title}`;
}

function bodyPreview(body: Json): string {
  if (typeof body === "object" && body !== null && !Array.isArray(body)) {
    const text = body.text;
    if (typeof text === "string") return text.slice(0, 240);
  }
  return "Structured content preview is not available.";
}

function PermissionNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning">
      {children}
    </p>
  );
}

function ReviewForm({
  countrySlug,
  targetType,
  targetId,
  disabled = false,
}: {
  countrySlug: LaunchCountrySlug;
  targetType: "source" | "claim" | "block" | "release";
  targetId: string;
  disabled?: boolean;
}) {
  return (
    <form action={reviewEditorialItemAction} className="mt-4 rounded-xl border border-sand-200 bg-void-elevated p-4">
      <input type="hidden" name="country_slug" value={countrySlug} />
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <fieldset disabled={disabled} className="space-y-3 disabled:opacity-55">
        <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
          <div>
            <FieldLabel htmlFor={`decision-${targetId}`}>Review decision</FieldLabel>
            <select
              id={`decision-${targetId}`}
              name="review_decision"
              required
              defaultValue=""
              className={fieldClass}
            >
              <option value="" disabled>
                Choose…
              </option>
              {REVIEW_DECISIONS.map((decision) => (
                <option key={decision.value} value={decision.value}>
                  {decision.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor={`notes-${targetId}`} help="Required when requesting changes or rejecting.">
              Review notes
            </FieldLabel>
            <textarea
              id={`notes-${targetId}`}
              name="review_notes"
              maxLength={4000}
              className={`${textareaClass} min-h-20`}
              placeholder="What was checked, or exactly what needs to change?"
            />
          </div>
        </div>
        <div className="grid gap-2 text-xs text-muted sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["accuracy_checked", "Accuracy checked"],
            ["source_current", "Evidence is current"],
            ["links_checked", "Links and locators work"],
            ["plain_language_checked", "Plain language checked"],
            ["official_source_checked", "Authority level checked"],
          ].map(([name, label]) => (
            <label key={name} className="flex min-h-10 items-center gap-2 rounded-lg border border-sand-200 px-3 py-2">
              <input type="checkbox" name={name} className="h-4 w-4 accent-accent-sand" />
              {label}
            </label>
          ))}
        </div>
        <button type="submit" className={quietButtonClass}>
          Record permanent review
        </button>
      </fieldset>
    </form>
  );
}

export default async function CountryEditorialWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ countrySlug: string }>;
  searchParams: Promise<{ notice?: string; error?: string; claim_template?: string; block_template?: string }>;
}) {
  const [{ countrySlug: rawCountrySlug }, feedback] = await Promise.all([params, searchParams]);
  if (!isLaunchCountrySlug(rawCountrySlug)) notFound();
  const countrySlug = rawCountrySlug;
  const session = await requireStaffSession();
  const { supabase, role, aal } = session;
  const canAuthor = hasRole(role, AUTHOR_ROLES);
  const canReview = hasRole(role, REVIEWER_ROLES);
  const canPublish = hasRole(role, PUBLISHER_ROLES);

  const { data: country, error: countryError } = await supabase
    .from("countries")
    .select("id, slug, name, iso_code, region, summary, visibility")
    .eq("slug", countrySlug)
    .maybeSingle();

  if (countryError || !country) {
    return (
      <div className="space-y-6">
        <Link href="/admin/content" className="text-sm text-accent-cool hover:underline">
          ← Country publishing
        </Link>
        <EmptyState
          title="This editorial workspace is not initialized"
          description="Apply the publishing migrations and seed the launch countries before editing content. Nothing on the public country page has been changed."
        />
      </div>
    );
  }

  const [sectionResult, categoryResult, sourceResult, claimResult, blockResult, releaseResult] =
    await Promise.all([
      supabase
        .from("portal_sections")
        .select("id, country_id, slug, title, description, sort_order, is_required, is_public")
        .eq("country_id", country.id)
        .order("sort_order"),
      supabase
        .from("claim_categories")
        .select(
          "id, slug, name, portal_section_slug, default_risk_level, requires_official_source, requires_professional_review, review_interval_days",
        )
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("source_documents")
        .select("*")
        .or(`country_id.eq.${country.id},country_id.is.null`)
        .order("updated_at", { ascending: false }),
      supabase.from("claims").select("*").eq("country_id", country.id).order("created_at"),
      supabase
        .from("content_blocks")
        .select("*")
        .eq("country_id", country.id)
        .order("created_at"),
      supabase
        .from("country_releases")
        .select("*")
        .eq("country_id", country.id)
        .order("release_number", { ascending: false }),
    ]);

  const baseResults = [
    sectionResult,
    categoryResult,
    sourceResult,
    claimResult,
    blockResult,
    releaseResult,
  ];
  if (baseResults.some((result) => result.error)) {
    return (
      <div className="space-y-6">
        <Link href="/admin/content" className="text-sm text-accent-cool hover:underline">
          ← Country publishing
        </Link>
        <EmptyState
          title="The live editorial records could not be loaded"
          description="Your account reached the workspace, but at least one source or publishing table is unavailable. Refresh after the migration and staff policies have been verified."
        />
      </div>
    );
  }

  const sections = sectionResult.data ?? [];
  const categories = categoryResult.data ?? [];
  const sources = (sourceResult.data ?? []) as SourceDocument[];
  const claims = (claimResult.data ?? []) as Claim[];
  const blocks = (blockResult.data ?? []) as ContentBlock[];
  const releases = (releaseResult.data ?? []) as CountryRelease[];

  const sourceIds = sources.map((source) => source.id);
  const claimIds = claims.map((claim) => claim.id);
  const blockIds = blocks.map((block) => block.id);
  const releaseIds = releases.map((release) => release.id);

  const snapshotResult = sourceIds.length
    ? await supabase
        .from("source_snapshots")
        .select("*")
        .in("source_document_id", sourceIds)
        .order("captured_at", { ascending: false })
    : { data: [] as SourceSnapshot[], error: null };
  const claimVersionResult = claimIds.length
    ? await supabase
        .from("claim_versions")
        .select("*")
        .in("claim_id", claimIds)
        .order("version_number", { ascending: false })
    : { data: [] as ClaimVersion[], error: null };
  const blockVersionResult = blockIds.length
    ? await supabase
        .from("content_block_versions")
        .select("*")
        .in("content_block_id", blockIds)
        .order("version_number", { ascending: false })
    : { data: [] as ContentBlockVersion[], error: null };
  const releaseClaimResult = releaseIds.length
    ? await supabase.from("release_claim_versions").select("*").in("release_id", releaseIds)
    : { data: [] as ReleaseClaim[], error: null };
  const releaseBlockResult = releaseIds.length
    ? await supabase.from("release_block_versions").select("*").in("release_id", releaseIds)
    : { data: [] as ReleaseBlock[], error: null };

  const claimVersions = (claimVersionResult.data ?? []) as ClaimVersion[];
  const claimVersionIds = claimVersions.map((version) => version.id);
  const citationResult = claimVersionIds.length
    ? await supabase
        .from("claim_version_citations")
        .select("*")
        .in("claim_version_id", claimVersionIds)
        .order("sort_order")
    : { data: [] as Citation[], error: null };

  const detailResults = [
    snapshotResult,
    claimVersionResult,
    blockVersionResult,
    releaseClaimResult,
    releaseBlockResult,
    citationResult,
  ];
  const detailError = detailResults.some((result) => result.error);
  const snapshots = (snapshotResult.data ?? []) as SourceSnapshot[];
  const blockVersions = (blockVersionResult.data ?? []) as ContentBlockVersion[];
  const releaseClaims = (releaseClaimResult.data ?? []) as ReleaseClaim[];
  const releaseBlocks = (releaseBlockResult.data ?? []) as ReleaseBlock[];
  const citations = (citationResult.data ?? []) as Citation[];
  const editableReleases = releases.filter(
    (release) => release.state === "draft" || release.state === "ready",
  );
  const isPhV1 = countrySlug === "philippines";
  const phSources = PH_V1_SOURCE_DRAFTS.map((requiredSource) => {
    const source = sources.find((item) => item.canonical_url === requiredSource.canonicalUrl);
    const sourceSnapshots = source
      ? snapshots.filter((snapshot) => snapshot.source_document_id === source.id)
      : [];
    return { ...requiredSource, source, snapshots: sourceSnapshots };
  });
  const selectedTemplate =
    isPhV1 && isPhV1ClaimTemplateId(feedback.claim_template)
      ? PH_V1_CLAIM_TEMPLATES[feedback.claim_template]
      : null;
  const templateSource = selectedTemplate
    ? phSources.find((item) => item.ledgerId === selectedTemplate.ledgerId)
    : null;
  const templateSnapshot = templateSource?.snapshots[0];
  const entryStaySection = sections.find((section) => section.slug === "entry-and-stay");
  const templateCategory = selectedTemplate
    ? categories.find((category) => category.slug === selectedTemplate.categorySlug)
    : null;
  const latestOpenRelease = editableReleases[0];
  const openReleaseIds = new Set(editableReleases.map((release) => release.id));
  const approvedPinnedClaimCount = releaseClaims.filter((item) =>
    openReleaseIds.has(item.release_id) &&
    claimVersions.some((version) => version.id === item.claim_version_id && version.workflow_state === "approved"),
  ).length;
  const approvedNextActionPinned = releaseBlocks.some((item) => {
    const block = blocks.find((candidate) => candidate.id === item.content_block_id);
    const version = blockVersions.find((candidate) => candidate.id === item.content_block_version_id);
    return openReleaseIds.has(item.release_id) && block?.kind === "next_action" && version?.workflow_state === "approved";
  });
  const nextActionSupportVersion = claimVersions.find((version) => {
    const claim = claims.find((candidate) => candidate.id === version.claim_id);
    return claim?.claim_slug === PH_V1_CLAIM_TEMPLATES.C.claimSlug;
  }) ?? claimVersions[0];
  const phReadiness = evaluatePhV1Readiness({
    canAuthor,
    aal,
    sourceCount: phSources.filter((item) => item.source).length,
    snapshotCount: phSources.filter((item) => item.snapshots.length > 0).length,
    approvedPinnedClaimCount,
    approvedNextActionPinned,
    releaseState: latestOpenRelease?.state,
  });

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <Link href="/admin/content" className="text-sm text-accent-cool hover:underline">
          ← Country publishing
        </Link>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="elsewhere-eyebrow">{country.iso_code} portal</p>
              <StatusBadge value={country.visibility} />
            </div>
            <h1 className="mt-2 font-display text-4xl text-cream">{country.name} editorial workspace</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted">
              Draft and verify evidence here. A record in this workspace is not public until an exact
              release passes review and a publisher with MFA publishes it.
            </p>
          </div>
          <Link href={`/countries/${countrySlug}`} className={secondaryButtonClass}>
            View current public page
          </Link>
        </div>
        <NoticeBanner
          notice={feedback.notice?.slice(0, 300)}
          error={feedback.error?.slice(0, 300)}
        />
        {detailError ? (
          <PermissionNote>
            Some linked version details could not be loaded. Do not review or publish until the page
            refreshes without this warning.
          </PermissionNote>
        ) : null}
        {isPhV1 ? (
          <AdminCard className="border-accent-sand/35 bg-accent-sand/5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="elsewhere-eyebrow">PH v1 Entry/Stay</p>
                <h2 className="mt-2 font-display text-2xl text-cream">Operator readiness</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted">
                  Live blockers for the draft package. Draft helpers never capture evidence, approve records, or publish.
                </p>
              </div>
              {canAuthor ? (
                <form action={bootstrapPhV1SourcesAction}>
                  <input type="hidden" name="country_slug" value={countrySlug} />
                  <button type="submit" className={secondaryButtonClass}>Create missing source drafts</button>
                </form>
              ) : null}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Staff role", ready: phReadiness.staffRole, detail: canAuthor ? `${role} can draft` : `${role} cannot draft` },
                { label: "MFA for publish", ready: phReadiness.mfa, detail: aal === "aal2" ? "AAL2 ready" : "Enable MFA before publish" },
                { label: "Package sources", ready: phReadiness.sources, detail: `${phSources.filter((item) => item.source?.state === "draft").length} draft / ${phSources.filter((item) => item.source?.state === "verified").length} verified` },
                { label: "Required snapshots", ready: phReadiness.snapshots, detail: `${phSources.filter((item) => item.snapshots.length > 0).length} of 3 captured` },
                { label: "Approved claims pinned", ready: phReadiness.claims, detail: `${approvedPinnedClaimCount} approved version${approvedPinnedClaimCount === 1 ? "" : "s"} in open releases` },
                { label: "Approved next action", ready: phReadiness.nextAction, detail: approvedNextActionPinned ? "Pinned to open release" : "Missing from open release" },
                { label: "Release state", ready: phReadiness.release, detail: latestOpenRelease ? `Release ${latestOpenRelease.release_number} / ${latestOpenRelease.state}` : "No draft release" },
              ].map((check) => (
                <div key={check.label} className="rounded-xl border border-sand-200 bg-void-elevated p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-cream">{check.label}</p>
                    <StatusBadge value={check.ready ? "verified" : "changes_requested"} label={check.ready ? "Ready" : "Blocked"} />
                  </div>
                  <p className="mt-2 text-xs text-soft">{check.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {phSources.map((item) => (
                <div key={item.ledgerId} className="rounded-xl border border-sand-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs text-accent-sand">{item.ledgerId}</p>
                    <StatusBadge value={item.snapshots.length > 0 ? "verified" : "draft"} label={item.snapshots.length > 0 ? "Snapshot present" : "Capture needed"} />
                  </div>
                  <p className="mt-2 text-xs text-muted">{item.source ? item.source.title : "Source draft missing"}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-warning">Stop point: a human must open each live official URL, inspect it, and paste the exact reviewed text. MFA and all existing review gates remain required before publishing.</p>
          </AdminCard>
        ) : null}
        <nav className="flex gap-2 overflow-x-auto border-y border-sand-200 py-3 text-sm">
          {[
            ["#sources", "1. Sources"],
            ["#claims", "2. Claims"],
            ["#content", "3. Page content"],
            ["#releases", "4. Releases"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="min-h-10 shrink-0 rounded-full border border-sand-200 px-4 py-2 text-muted hover:bg-void-elevated hover:text-cream">
              {label}
            </a>
          ))}
        </nav>
      </div>

      <section id="sources" className="scroll-mt-24 space-y-5">
        <AdminSectionHeading
          eyebrow="Step 1"
          title="Source library and exact evidence"
          description="Register the canonical authority page, then retain the exact reviewed page or passage privately with a SHA-256 fingerprint. Only authorized editorial staff can access the evidence file."
        />
        {!canAuthor ? (
          <PermissionNote>Your {role} role can review evidence but cannot create or change source drafts.</PermissionNote>
        ) : null}
        <div className="grid gap-5 xl:grid-cols-2">
          <AdminCard>
            <h3 className="font-display text-xl text-cream">Register a source document</h3>
            <p className="mt-2 text-xs text-soft">
              “Official” is an authority classification, not a visual label editors can grant manually.
            </p>
            <form action={createSourceDocumentAction} className="mt-5">
              <input type="hidden" name="country_slug" value={countrySlug} />
              <fieldset disabled={!canAuthor} className="grid gap-4 disabled:opacity-55 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="source-url">Canonical HTTPS URL</FieldLabel>
                  <input id="source-url" name="canonical_url" type="url" required maxLength={2000} placeholder="https://government.example/official-page" className={fieldClass} />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="source-title">Document or page title</FieldLabel>
                  <input id="source-title" name="title" required minLength={4} maxLength={500} className={fieldClass} />
                </div>
                <div>
                  <FieldLabel htmlFor="publisher">Publishing organization</FieldLabel>
                  <input id="publisher" name="publisher" required minLength={2} maxLength={240} className={fieldClass} />
                </div>
                <div>
                  <FieldLabel htmlFor="authority">Authority level</FieldLabel>
                  <select id="authority" name="authority_level" required defaultValue="" className={fieldClass}>
                    <option value="" disabled>Choose…</option>
                    {AUTHORITY_LEVELS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="jurisdiction">Jurisdiction</FieldLabel>
                  <input id="jurisdiction" name="jurisdiction" maxLength={160} placeholder={country.name} className={fieldClass} />
                </div>
                <div>
                  <FieldLabel htmlFor="source-language">Source language</FieldLabel>
                  <input id="source-language" name="source_language" required defaultValue="en" maxLength={20} className={fieldClass} />
                </div>
                <div>
                  <FieldLabel htmlFor="translation-status">Translation status</FieldLabel>
                  <select id="translation-status" name="translation_status" required defaultValue="not_needed" className={fieldClass}>
                    <option value="not_needed">No translation needed</option>
                    <option value="machine_draft">Machine draft — not reviewed</option>
                    <option value="human_reviewed">Human-reviewed translation</option>
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="publication-date">Publication date, if shown</FieldLabel>
                  <input id="publication-date" name="publication_date" type="date" className={fieldClass} />
                </div>
                <div className="flex items-end">
                  <button type="submit" className={`${primaryButtonClass} w-full`}>Save source draft</button>
                </div>
              </fieldset>
            </form>
          </AdminCard>

          <AdminCard>
            <h3 className="font-display text-xl text-cream">Capture reviewed evidence</h3>
            <p className="mt-2 text-xs text-soft">
              Line endings are normalized, the text is hashed, and the exact evidence is retained in private immutable storage. Do not paste personal data.
            </p>
            <form action={captureManualSnapshotAction} className="mt-5">
              <input type="hidden" name="country_slug" value={countrySlug} />
              <fieldset disabled={!canAuthor || sources.length === 0} className="space-y-4 disabled:opacity-55">
                <div>
                  <FieldLabel htmlFor="snapshot-source">Source document</FieldLabel>
                  <select id="snapshot-source" name="source_document_id" required defaultValue="" className={fieldClass}>
                    <option value="" disabled>Choose…</option>
                    {sources.map((source) => (
                      <option key={source.id} value={source.id}>{sourceLabel(source)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="capture-label" help="Example: Entry requirements page, reviewed July 2026.">Capture label</FieldLabel>
                  <input id="capture-label" name="captured_title" maxLength={500} className={fieldClass} />
                </div>
                <div>
                  <FieldLabel htmlFor="reviewed-text" help="This exact text is stored privately so a later reviewer can reproduce the evidence check.">Exact reviewed text</FieldLabel>
                  <textarea id="reviewed-text" name="reviewed_text" required minLength={20} maxLength={1000000} className={`${textareaClass} min-h-48`} />
                </div>
                <button type="submit" className={primaryButtonClass}>Retain exact evidence</button>
              </fieldset>
            </form>
            {sources.length === 0 ? <p className="mt-4 text-xs text-soft">Register a source first.</p> : null}
          </AdminCard>
        </div>

        {sources.length === 0 ? (
          <EmptyState title="No sources yet" description="Start with the highest-impact official page needed for one narrow claim. Do not bulk-import unscreened links." />
        ) : (
          <div className="space-y-3">
            {sources.map((source) => {
              const sourceSnapshots = snapshots.filter((snapshot) => snapshot.source_document_id === source.id);
              const latestSnapshot = sourceSnapshots[0];
              const official = ["official_government", "embassy_consulate", "immigration_authority", "intergovernmental"].includes(source.authority_level);
              return (
                <AdminCard key={source.id} className="p-4 md:p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value={source.state} />
                        <StatusBadge value={official ? "verified" : "draft"} label={official ? "Official authority" : source.authority_level.replace(/_/g, " ")} />
                      </div>
                      <h3 className="mt-3 text-base font-medium text-cream">{source.title}</h3>
                      <p className="mt-1 text-sm text-muted">{source.publisher}</p>
                      <a href={source.canonical_url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-xs text-accent-cool hover:underline">
                        {source.canonical_url}
                      </a>
                    </div>
                    <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-xs lg:text-right">
                      <div><dt className="text-soft">Evidence</dt><dd className="text-muted">{sourceSnapshots.length} snapshot{sourceSnapshots.length === 1 ? "" : "s"}</dd></div>
                      <div><dt className="text-soft">Last verified</dt><dd className="text-muted">{formatDate(source.last_verified_at)}</dd></div>
                      <div><dt className="text-soft">Latest capture</dt><dd className="text-muted">{formatDate(latestSnapshot?.captured_at)}</dd></div>
                      <div><dt className="text-soft">Review due</dt><dd className="text-muted">{formatDate(source.review_due_at)}</dd></div>
                    </dl>
                  </div>
                  {latestSnapshot ? (
                    <p className="mt-3 font-mono text-[0.7rem] text-soft">SHA-256 {latestSnapshot.content_hash}</p>
                  ) : (
                    <p className="mt-3 text-xs text-warning">No exact snapshot yet; this source cannot be approved.</p>
                  )}
                  {canReview ? <ReviewForm countrySlug={countrySlug} targetType="source" targetId={source.id} /> : null}
                </AdminCard>
              );
            })}
          </div>
        )}
      </section>

      <section id="claims" className="scroll-mt-24 space-y-5">
        <AdminSectionHeading
          eyebrow="Step 2"
          title="Narrow, cited claims"
          description="One claim should express one fact or planning statement. The precise wording, user summary, applicability, exact source snapshot, and locator travel together as version 1."
        />
        {!canAuthor ? <PermissionNote>Your {role} role can review claim versions but cannot create them.</PermissionNote> : null}
        {isPhV1 ? (
          <AdminCard className="p-4 md:p-5">
            <h3 className="font-display text-xl text-cream">Snapshot-gated PH v1 helpers</h3>
            <p className="mt-2 text-xs text-soft">These load bounded draft wording from the reviewed release package. The matching source must have a human-captured snapshot.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(Object.keys(PH_V1_CLAIM_TEMPLATES) as Array<keyof typeof PH_V1_CLAIM_TEMPLATES>).map((templateId) => {
                const template = PH_V1_CLAIM_TEMPLATES[templateId];
                const ledger = phSources.find((item) => item.ledgerId === template.ledgerId);
                return ledger?.snapshots.length ? (
                  <Link key={templateId} href={`?claim_template=${templateId}#claims`} className={quietButtonClass}>
                    Load Claim {templateId} / {template.ledgerId}
                  </Link>
                ) : (
                  <span key={templateId} className="rounded-xl border border-sand-200 px-4 py-3 text-xs text-soft">
                    Claim {templateId} locked / capture {template.ledgerId}
                  </span>
                );
              })}
            </div>
          </AdminCard>
        ) : null}
        <AdminCard>
          <h3 className="font-display text-xl text-cream">Draft a claim with its primary citation</h3>
          <form action={createClaimDraftAction} className="mt-5">
            <input type="hidden" name="country_slug" value={countrySlug} />
            <fieldset disabled={!canAuthor || snapshots.length === 0} className="grid gap-4 disabled:opacity-55 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="claim-name" help="Internal identifier; spaces become hyphens.">Internal claim name</FieldLabel>
                <input id="claim-name" name="claim_slug" required minLength={2} maxLength={120} defaultValue={selectedTemplate?.claimSlug} placeholder="tourist-entry-duration" className={fieldClass} />
              </div>
              <div>
                <FieldLabel htmlFor="claim-category">Claim category</FieldLabel>
                <select id="claim-category" name="category_id" required defaultValue={templateCategory?.id ?? ""} className={fieldClass}>
                  <option value="" disabled>Choose…</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name} · {category.portal_section_slug}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel htmlFor="claim-section">Matching portal section</FieldLabel>
                <select id="claim-section" name="portal_section_id" required defaultValue={selectedTemplate ? entryStaySection?.id ?? "" : ""} className={fieldClass}>
                  <option value="" disabled>Choose…</option>
                  {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="claim-risk">Risk</FieldLabel>
                  <select id="claim-risk" name="risk_level" required defaultValue={selectedTemplate?.riskLevel ?? "high"} className={fieldClass}>
                    {RISK_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="claim-confidence">Confidence</FieldLabel>
                  <select id="claim-confidence" name="confidence_level" required defaultValue="low" className={fieldClass}>
                    {CONFIDENCE_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="precise-claim" help="Internal, exact wording. Avoid interpreting eligibility for an individual.">Precise factual statement</FieldLabel>
                <textarea id="precise-claim" name="precise_text" required minLength={10} maxLength={10000} defaultValue={selectedTemplate?.preciseText} className={textareaClass} />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="public-summary" help="Calm plain language; general planning only.">Public summary</FieldLabel>
                <textarea id="public-summary" name="public_summary" required minLength={10} maxLength={5000} defaultValue={selectedTemplate?.publicSummary} className={textareaClass} />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="user-meaning">What this means for a planner</FieldLabel>
                <textarea id="user-meaning" name="user_meaning" maxLength={5000} defaultValue={selectedTemplate?.userMeaning} className={textareaClass} />
              </div>
              <div>
                <FieldLabel htmlFor="citizenship-codes" help="Two-letter codes, comma separated. Leave blank if universal.">Citizenship scope</FieldLabel>
                <input id="citizenship-codes" name="citizenship_country_codes" placeholder="US, CA, GB" className={fieldClass} />
              </div>
              <div>
                <FieldLabel htmlFor="purposes" help="Short labels, comma separated.">Travel or stay purposes</FieldLabel>
                <input id="purposes" name="purposes" placeholder="tourism, retirement" className={fieldClass} />
              </div>
              <div>
                <FieldLabel htmlFor="effective-from">Effective from, if explicit</FieldLabel>
                <input id="effective-from" name="effective_from" type="date" className={fieldClass} />
              </div>
              <div>
                <FieldLabel htmlFor="effective-until">Effective until, if explicit</FieldLabel>
                <input id="effective-until" name="effective_until" type="date" className={fieldClass} />
              </div>
              <div>
                <FieldLabel htmlFor="claim-source">Primary source</FieldLabel>
                <select id="claim-source" name="source_document_id" required defaultValue={templateSource?.source?.id ?? ""} className={fieldClass}>
                  <option value="" disabled>Choose…</option>
                  {sources.map((source) => <option key={source.id} value={source.id}>{sourceLabel(source)} · {source.state}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel htmlFor="claim-snapshot">Exact retained evidence</FieldLabel>
                <select id="claim-snapshot" name="source_snapshot_id" required defaultValue={templateSnapshot?.id ?? ""} className={fieldClass}>
                  <option value="" disabled>Choose…</option>
                  {snapshots.map((snapshot) => {
                    const source = sources.find((item) => item.id === snapshot.source_document_id);
                    return <option key={snapshot.id} value={snapshot.id}>{source?.publisher ?? "Source"} · {formatDate(snapshot.captured_at)} · {snapshot.content_hash.slice(0, 10)}</option>;
                  })}
                </select>
              </div>
              <div>
                <FieldLabel htmlFor="exact-locator" help="Heading, section, article number, or page.">Exact locator</FieldLabel>
                <input id="exact-locator" name="exact_locator" required minLength={2} maxLength={500} defaultValue={selectedTemplate?.exactLocator} className={fieldClass} />
              </div>
              <div>
                <FieldLabel htmlFor="claim-locale">Claim language</FieldLabel>
                <input id="claim-locale" name="locale" required defaultValue="en" maxLength={20} className={fieldClass} />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="evidence-excerpt" help="Optional short excerpt for reviewers; maximum 1,000 characters.">Evidence excerpt</FieldLabel>
                <textarea id="evidence-excerpt" name="evidence_excerpt" maxLength={1000} className={textareaClass} />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="applicability-note">Applicability caveat</FieldLabel>
                <input id="applicability-note" name="applicability_note" maxLength={1000} placeholder="Rules may differ by nationality, residence, age, or purpose." className={fieldClass} />
              </div>
              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-sand-200 px-4 text-sm text-muted sm:col-span-2">
                <input type="checkbox" name="requires_professional_review" className="h-4 w-4 accent-accent-sand" />
                Require licensed professional review before publication
              </label>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="support-note" help="Required: say what the selected evidence does not establish.">Evidence boundary note</FieldLabel>
                <textarea id="support-note" name="support_note" required minLength={10} maxLength={1000} defaultValue={selectedTemplate?.supportNote} className={textareaClass} />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className={primaryButtonClass}>Save claim and citation draft</button>
              </div>
            </fieldset>
          </form>
          {snapshots.length === 0 ? <p className="mt-4 text-xs text-warning">Retain at least one exact evidence snapshot before drafting a claim.</p> : null}
        </AdminCard>

        {claims.length === 0 ? (
          <EmptyState title="No claims yet" description="Begin with one high-impact, well-bounded claim rather than writing an entire visa guide from memory." />
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => {
              const category = categories.find((item) => item.id === claim.category_id);
              const versions = claimVersions.filter((version) => version.claim_id === claim.id);
              return (
                <AdminCard key={claim.id} className="p-4 md:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={claim.risk_level} label={`${claim.risk_level} risk`} />
                    {claim.requires_professional_review ? <StatusBadge value="changes_requested" label="Professional review required" /> : null}
                    {claim.suppressed_at ? <StatusBadge value="disputed" label="Suppressed" /> : null}
                  </div>
                  <h3 className="mt-3 text-base font-medium text-cream">{claim.claim_slug}</h3>
                  <p className="mt-1 text-xs text-soft">{category?.name ?? "Category unavailable"} · {versions.length} version{versions.length === 1 ? "" : "s"}</p>
                  <div className="mt-4 space-y-3">
                    {versions.map((version) => {
                      const versionCitations = citations.filter((citation) => citation.claim_version_id === version.id);
                      return (
                        <div key={version.id} className="rounded-xl border border-sand-200 bg-void-elevated p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge value={version.workflow_state} />
                              <StatusBadge value={version.confidence_level} label={`${version.confidence_level} confidence`} />
                            </div>
                            <span className="font-mono text-[0.7rem] text-soft">v{version.version_number} · {shortId(version.id)}</span>
                          </div>
                          <p className="mt-3 text-sm text-cream">{version.public_summary}</p>
                          {version.user_meaning ? <p className="mt-2 text-sm text-muted">{version.user_meaning}</p> : null}
                          <p className="mt-3 text-xs text-soft">{versionCitations.length} citation{versionCitations.length === 1 ? "" : "s"} · Review due {formatDate(version.review_due_at)}</p>
                          {canReview ? <ReviewForm countrySlug={countrySlug} targetType="claim" targetId={version.id} /> : null}
                        </div>
                      );
                    })}
                    {versions.length === 0 ? <p className="text-xs text-danger">Incomplete draft: no version exists. This needs recovery before review.</p> : null}
                  </div>
                </AdminCard>
              );
            })}
          </div>
        )}
      </section>

      <section id="content" className="scroll-mt-24 space-y-5">
        <AdminSectionHeading
          eyebrow="Step 3"
          title="User-facing portal content"
          description="Content blocks organize the experience without becoming a second source of truth. Every block must point to a supporting claim version before it can be created. Plain text is stored as structured, non-HTML content."
        />
        <AdminCard>
          <h3 className="font-display text-xl text-cream">Draft a content block</h3>
          {isPhV1 ? (
            nextActionSupportVersion ? (
              <Link href="?block_template=next_action#content" className={`${quietButtonClass} mt-4`}>Load PH v1 next-action draft</Link>
            ) : (
              <p className="mt-3 text-xs text-warning">The next-action helper unlocks after a snapshot-backed PH v1 claim exists.</p>
            )
          ) : null}
          <form action={createContentBlockDraftAction} className="mt-5">
            <input type="hidden" name="country_slug" value={countrySlug} />
            <fieldset disabled={!canAuthor || claimVersions.length === 0} className="grid gap-4 disabled:opacity-55 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="block-name" help="Internal identifier; spaces become hyphens.">Internal block name</FieldLabel>
                <input id="block-name" name="block_slug" required minLength={2} maxLength={120} defaultValue={feedback.block_template === "next_action" ? PH_V1_NEXT_ACTION.blockSlug : undefined} className={fieldClass} />
              </div>
              <div>
                <FieldLabel htmlFor="block-section">Portal section</FieldLabel>
                <select id="block-section" name="portal_section_id" required defaultValue={feedback.block_template === "next_action" ? entryStaySection?.id ?? "" : ""} className={fieldClass}>
                  <option value="" disabled>Choose…</option>
                  {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel htmlFor="block-kind">Display format</FieldLabel>
                <select id="block-kind" name="kind" required defaultValue={feedback.block_template === "next_action" ? "next_action" : "rich_text"} className={fieldClass}>
                  {CONTENT_BLOCK_KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel htmlFor="block-risk">Content risk</FieldLabel>
                <select id="block-risk" name="risk_level" required defaultValue={feedback.block_template === "next_action" ? "high" : "low"} className={fieldClass}>
                  {RISK_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="block-title">Public heading</FieldLabel>
                <input id="block-title" name="title" maxLength={500} defaultValue={feedback.block_template === "next_action" ? PH_V1_NEXT_ACTION.title : undefined} className={fieldClass} />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="block-body" help="Separate paragraphs with a blank line. Do not paste HTML.">Public content</FieldLabel>
                <textarea id="block-body" name="body_text" required minLength={10} maxLength={20000} defaultValue={feedback.block_template === "next_action" ? PH_V1_NEXT_ACTION.body : undefined} className={`${textareaClass} min-h-48`} />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="supporting-claim" help="Required for traceability on every public content block.">Supporting claim version</FieldLabel>
                <select id="supporting-claim" name="supporting_claim_version_id" required defaultValue={feedback.block_template === "next_action" ? nextActionSupportVersion?.id ?? "" : ""} className={fieldClass}>
                  <option value="" disabled>Choose…</option>
                  {claimVersions.map((version) => {
                    const claim = claims.find((item) => item.id === version.claim_id);
                    return <option key={version.id} value={version.id}>{claim?.claim_slug ?? "Claim"} · v{version.version_number} · {version.workflow_state}</option>;
                  })}
                </select>
              </div>
              <div className="sm:col-span-2"><button type="submit" className={primaryButtonClass}>Save content draft</button></div>
            </fieldset>
            {claimVersions.length === 0 ? <p className="mt-4 text-xs text-warning">Create an evidence-backed claim before drafting page content.</p> : null}
          </form>
        </AdminCard>

        {blocks.length === 0 ? (
          <EmptyState title="No page content yet" description="Draft one concise overview or next-action block after its supporting facts exist." />
        ) : (
          <div className="space-y-3">
            {blocks.map((block) => {
              const section = sections.find((item) => item.id === block.portal_section_id);
              const versions = blockVersions.filter((version) => version.content_block_id === block.id);
              return (
                <AdminCard key={block.id} className="p-4 md:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={block.risk_level} label={`${block.risk_level} risk`} />
                    <StatusBadge value="draft" label={block.kind.replace(/_/g, " ")} />
                  </div>
                  <h3 className="mt-3 text-base font-medium text-cream">{block.slug}</h3>
                  <p className="mt-1 text-xs text-soft">{section?.title ?? "Section unavailable"}</p>
                  <div className="mt-4 space-y-3">
                    {versions.map((version) => (
                      <div key={version.id} className="rounded-xl border border-sand-200 bg-void-elevated p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <StatusBadge value={version.workflow_state} />
                          <span className="font-mono text-[0.7rem] text-soft">v{version.version_number} · {shortId(version.id)}</span>
                        </div>
                        {version.title ? <p className="mt-3 font-medium text-cream">{version.title}</p> : null}
                        <p className="mt-2 whitespace-pre-line text-sm text-muted">{bodyPreview(version.body)}</p>
                        {canReview ? <ReviewForm countrySlug={countrySlug} targetType="block" targetId={version.id} /> : null}
                      </div>
                    ))}
                  </div>
                </AdminCard>
              );
            })}
          </div>
        )}
      </section>

      <section id="releases" className="scroll-mt-24 space-y-5">
        <AdminSectionHeading
          eyebrow="Step 4"
          title="Compose, review, and publish a release"
          description="A release pins exact claim and content versions. Any composition change returns it to draft and invalidates earlier release QA. Publishing never edits prior public history."
        />
        <div className="grid gap-5 xl:grid-cols-3">
          <AdminCard>
            <h3 className="font-display text-xl text-cream">Start a new release</h3>
            <form action={createReleaseAction} className="mt-4 space-y-4">
              <input type="hidden" name="country_slug" value={countrySlug} />
              <fieldset disabled={!canAuthor} className="space-y-4 disabled:opacity-55">
                <div>
                  <FieldLabel htmlFor="release-notes" help="Explain the editorial purpose; this is not marketing copy.">Release purpose</FieldLabel>
                  <textarea id="release-notes" name="release_notes" required minLength={10} maxLength={2000} className={textareaClass} />
                </div>
                <button type="submit" className={primaryButtonClass}>Create empty draft</button>
              </fieldset>
            </form>
          </AdminCard>

          <AdminCard>
            <h3 className="font-display text-xl text-cream">Add a claim version</h3>
            <form action={addReleaseItemAction} className="mt-4 space-y-4">
              <input type="hidden" name="country_slug" value={countrySlug} />
              <input type="hidden" name="item_type" value="claim" />
              <fieldset disabled={!canAuthor || editableReleases.length === 0 || claimVersions.length === 0} className="space-y-4 disabled:opacity-55">
                <div><FieldLabel htmlFor="claim-release">Draft release</FieldLabel><select id="claim-release" name="release_id" required defaultValue="" className={fieldClass}><option value="" disabled>Choose…</option>{editableReleases.map((release) => <option key={release.id} value={release.id}>Release {release.release_number} · {release.state}</option>)}</select></div>
                <div><FieldLabel htmlFor="release-claim-version">Exact claim version</FieldLabel><select id="release-claim-version" name="version_id" required defaultValue="" className={fieldClass}><option value="" disabled>Choose…</option>{claimVersions.map((version) => { const claim = claims.find((item) => item.id === version.claim_id); return <option key={version.id} value={version.id}>{claim?.claim_slug ?? "Claim"} · v{version.version_number} · {version.workflow_state}</option>; })}</select></div>
                <div><FieldLabel htmlFor="claim-sort">Sort order</FieldLabel><input id="claim-sort" name="sort_order" type="number" min={0} max={100000} defaultValue={0} className={fieldClass} /></div>
                <button type="submit" className={primaryButtonClass}>Pin claim version</button>
              </fieldset>
            </form>
          </AdminCard>

          <AdminCard>
            <h3 className="font-display text-xl text-cream">Add a content version</h3>
            <form action={addReleaseItemAction} className="mt-4 space-y-4">
              <input type="hidden" name="country_slug" value={countrySlug} />
              <input type="hidden" name="item_type" value="block" />
              <fieldset disabled={!canAuthor || editableReleases.length === 0 || blockVersions.length === 0} className="space-y-4 disabled:opacity-55">
                <div><FieldLabel htmlFor="block-release">Draft release</FieldLabel><select id="block-release" name="release_id" required defaultValue="" className={fieldClass}><option value="" disabled>Choose…</option>{editableReleases.map((release) => <option key={release.id} value={release.id}>Release {release.release_number} · {release.state}</option>)}</select></div>
                <div><FieldLabel htmlFor="release-block-version">Exact content version</FieldLabel><select id="release-block-version" name="version_id" required defaultValue="" className={fieldClass}><option value="" disabled>Choose…</option>{blockVersions.map((version) => { const block = blocks.find((item) => item.id === version.content_block_id); return <option key={version.id} value={version.id}>{block?.slug ?? "Block"} · v{version.version_number} · {version.workflow_state}</option>; })}</select></div>
                <div><FieldLabel htmlFor="block-sort">Sort order</FieldLabel><input id="block-sort" name="sort_order" type="number" min={0} max={100000} defaultValue={0} className={fieldClass} /></div>
                <button type="submit" className={primaryButtonClass}>Pin content version</button>
              </fieldset>
            </form>
          </AdminCard>
        </div>

        {releases.length === 0 ? (
          <EmptyState title="No releases yet" description="Create a draft release only after at least one claim and one content block are ready to pin." />
        ) : (
          <div className="space-y-4">
            {releases.map((release) => {
              const pinnedClaims = releaseClaims.filter((item) => item.release_id === release.id);
              const pinnedBlocks = releaseBlocks.filter((item) => item.release_id === release.id);
              const approvedClaimCount = pinnedClaims.filter((item) => claimVersions.find((version) => version.id === item.claim_version_id)?.workflow_state === "approved").length;
              const approvedBlockCount = pinnedBlocks.filter((item) => blockVersions.find((version) => version.id === item.content_block_version_id)?.workflow_state === "approved").length;
              return (
                <AdminCard key={release.id}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><StatusBadge value={release.state} />{release.is_current ? <StatusBadge value="current" label="Current public release" /> : null}</div>
                      <h3 className="mt-3 font-display text-2xl text-cream">Release {release.release_number}</h3>
                      <p className="mt-2 max-w-2xl text-sm text-muted">{release.release_notes ?? "No release notes."}</p>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                      <div className="rounded-xl border border-sand-200 p-3"><dt className="text-[0.65rem] text-soft">Claims</dt><dd className="text-lg text-cream">{pinnedClaims.length}</dd></div>
                      <div className="rounded-xl border border-sand-200 p-3"><dt className="text-[0.65rem] text-soft">Approved</dt><dd className="text-lg text-cream">{approvedClaimCount}</dd></div>
                      <div className="rounded-xl border border-sand-200 p-3"><dt className="text-[0.65rem] text-soft">Blocks</dt><dd className="text-lg text-cream">{pinnedBlocks.length}</dd></div>
                      <div className="rounded-xl border border-sand-200 p-3"><dt className="text-[0.65rem] text-soft">Approved</dt><dd className="text-lg text-cream">{approvedBlockCount}</dd></div>
                    </dl>
                  </div>
                  <div className="mt-5 grid gap-2 text-xs text-muted sm:grid-cols-2 lg:grid-cols-4">
                    <p className="rounded-lg border border-sand-200 px-3 py-2">{pinnedClaims.length > 0 ? "✓" : "○"} At least one pinned claim</p>
                    <p className="rounded-lg border border-sand-200 px-3 py-2">{pinnedBlocks.length > 0 ? "✓" : "○"} At least one pinned block</p>
                    <p className="rounded-lg border border-sand-200 px-3 py-2">{approvedClaimCount === pinnedClaims.length && pinnedClaims.length > 0 ? "✓" : "○"} Claim versions approved</p>
                    <p className="rounded-lg border border-sand-200 px-3 py-2">{approvedBlockCount === pinnedBlocks.length && pinnedBlocks.length > 0 ? "✓" : "○"} Content versions approved</p>
                  </div>
                  {(pinnedClaims.length > 0 || pinnedBlocks.length > 0) ? (
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl border border-sand-200 bg-void-elevated p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-soft">Pinned claims</p>
                        <div className="mt-3 space-y-2">
                          {pinnedClaims.map((item) => {
                            const version = claimVersions.find((candidate) => candidate.id === item.claim_version_id);
                            const claim = claims.find((candidate) => candidate.id === item.claim_id);
                            return (
                              <div key={item.claim_version_id} className="flex items-center justify-between gap-3 rounded-lg border border-sand-200 px-3 py-2 text-xs">
                                <span className="min-w-0 truncate text-muted">{claim?.claim_slug ?? "Claim"} · v{version?.version_number ?? "?"}</span>
                                {canPublish && (release.state === "draft" || release.state === "ready") ? (
                                  <form action={removeReleaseItemAction}>
                                    <input type="hidden" name="country_slug" value={countrySlug} />
                                    <input type="hidden" name="release_id" value={release.id} />
                                    <input type="hidden" name="item_type" value="claim" />
                                    <input type="hidden" name="version_id" value={item.claim_version_id} />
                                    <button type="submit" className="text-danger hover:underline">Remove</button>
                                  </form>
                                ) : null}
                              </div>
                            );
                          })}
                          {pinnedClaims.length === 0 ? <p className="text-xs text-soft">None pinned.</p> : null}
                        </div>
                      </div>
                      <div className="rounded-xl border border-sand-200 bg-void-elevated p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-soft">Pinned content</p>
                        <div className="mt-3 space-y-2">
                          {pinnedBlocks.map((item) => {
                            const version = blockVersions.find((candidate) => candidate.id === item.content_block_version_id);
                            const block = blocks.find((candidate) => candidate.id === item.content_block_id);
                            return (
                              <div key={item.content_block_version_id} className="flex items-center justify-between gap-3 rounded-lg border border-sand-200 px-3 py-2 text-xs">
                                <span className="min-w-0 truncate text-muted">{block?.slug ?? "Content"} · v{version?.version_number ?? "?"}</span>
                                {canPublish && (release.state === "draft" || release.state === "ready") ? (
                                  <form action={removeReleaseItemAction}>
                                    <input type="hidden" name="country_slug" value={countrySlug} />
                                    <input type="hidden" name="release_id" value={release.id} />
                                    <input type="hidden" name="item_type" value="block" />
                                    <input type="hidden" name="version_id" value={item.content_block_version_id} />
                                    <button type="submit" className="text-danger hover:underline">Remove</button>
                                  </form>
                                ) : null}
                              </div>
                            );
                          })}
                          {pinnedBlocks.length === 0 ? <p className="text-xs text-soft">None pinned.</p> : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <p className="mt-3 text-xs text-soft">The database also checks current verified primary snapshots, review freshness, effective dates, official-source policy, professional review, and release QA at publish time.</p>
                  {canReview && (release.state === "draft" || release.state === "ready") ? <ReviewForm countrySlug={countrySlug} targetType="release" targetId={release.id} /> : null}
                  {canPublish && release.state === "ready" ? (
                    <form action={publishCountryReleaseAction} className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-4">
                      <input type="hidden" name="country_slug" value={countrySlug} />
                      <input type="hidden" name="release_id" value={release.id} />
                      <fieldset disabled={aal !== "aal2"} className="space-y-3 disabled:opacity-55">
                        <p className="text-sm font-medium text-cream">Make this the public {country.name} release</p>
                        <label className="flex items-start gap-3 text-xs text-muted"><input type="checkbox" name="confirm_publish" className="mt-0.5 h-4 w-4 accent-accent-sand" />I understand this replaces the current public release while preserving its immutable history.</label>
                        <button type="submit" className={primaryButtonClass}>Publish exact release</button>
                      </fieldset>
                      {aal !== "aal2" ? <p className="mt-3 text-xs text-danger">MFA is required before this publishing action can run.</p> : null}
                    </form>
                  ) : null}
                </AdminCard>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
