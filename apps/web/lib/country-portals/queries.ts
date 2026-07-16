import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import type { Database, Json } from "@/lib/supabase/database.types";
import {
  getPreviewPortal,
  getPreviewPortalCards,
} from "@/lib/country-portals/fixtures";
import {
  COUNTRY_PORTAL_SLUGS,
  PORTAL_SECTION_DEFINITIONS,
  type CountryPortal,
  type CountryPortalCardData,
  type PortalCitation,
  type PortalContentBlock,
  type PortalClaim,
  type PortalSource,
} from "@/lib/country-portals/types";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

function createPublicContentClient() {
  return createSupabaseClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function requiredString(value: unknown): string | null {
  return optionalString(value) ?? null;
}

function safeFlagEmoji(value: unknown, fallback: string): string {
  const flag = optionalString(value);
  const codePoints = flag
    ? Array.from(flag, (character) => character.codePointAt(0) ?? 0)
    : [];
  const isRegionalFlag =
    codePoints.length === 2 &&
    codePoints.every((point) => point >= 0x1f1e6 && point <= 0x1f1ff);
  if (
    !flag ||
    !isRegionalFlag ||
    /[\u00c2\u00c3\ufffd]/u.test(flag) ||
    flag.includes("\u00f0\u0178")
  ) {
    return fallback;
  }
  return flag;
}

function parseCitation(value: unknown): PortalCitation | null {
  if (!isRecord(value)) return null;

  const id = requiredString(value.citationId);
  const sourceId = requiredString(value.sourceId);
  const sourceTitle = requiredString(value.sourceTitle);
  const publisher = requiredString(value.publisher);
  const authorityLevel = requiredString(value.authorityLevel);
  const canonicalUrl = requiredString(value.canonicalUrl);
  const role = requiredString(value.role);

  if (
    !id ||
    !sourceId ||
    !sourceTitle ||
    !publisher ||
    !authorityLevel ||
    !canonicalUrl ||
    !["primary", "supporting", "context", "conflicting"].includes(role ?? "")
  ) {
    return null;
  }

  return {
    id,
    sourceId,
    sourceTitle,
    publisher,
    authorityLevel,
    canonicalUrl,
    role: role as PortalCitation["role"],
    exactLocator: optionalString(value.exactLocator),
    supportNote: optionalString(value.supportNote),
    lastVerifiedAt: optionalString(value.lastVerifiedAt),
  };
}

function parseCitations(value: Json | null): PortalCitation[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => parseCitation(item))
    .filter((item): item is PortalCitation => item !== null);
}

function parseStringArray(value: Json | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toRecord(value: Json | null): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function collectSources(claims: PortalClaim[]): PortalSource[] {
  const sources = new Map<string, PortalSource>();

  for (const claim of claims) {
    for (const citation of claim.citations) {
      if (!sources.has(citation.sourceId)) {
        sources.set(citation.sourceId, {
          id: citation.sourceId,
          title: citation.sourceTitle,
          publisher: citation.publisher,
          authorityLevel: citation.authorityLevel,
          canonicalUrl: citation.canonicalUrl,
          lastVerifiedAt: citation.lastVerifiedAt,
        });
      }
    }
  }

  return [...sources.values()].sort((a, b) =>
    a.publisher.localeCompare(b.publisher),
  );
}

async function readReleasedPortal(slug: string): Promise<CountryPortal | null> {
  if (!isSupabaseConfigured()) return null;

  const client = createPublicContentClient();
  const portalResult = await client
    .from("published_country_portals")
    .select("*")
    .eq("country_slug", slug)
    .maybeSingle();

  if (portalResult.error || !portalResult.data) return null;

  const [claimsResult, blocksResult] = await Promise.all([
    client
      .from("published_country_claims")
      .select("*")
      .eq("country_slug", slug)
      .order("sort_order", { ascending: true }),
    client
      .from("published_country_blocks")
      .select("*")
      .eq("country_slug", slug)
      .order("sort_order", { ascending: true }),
  ]);

  if (claimsResult.error || blocksResult.error) return null;

  const claims: PortalClaim[] = (claimsResult.data ?? []).flatMap((row) => {
    if (
      !row.claim_id ||
      !row.claim_slug ||
      !row.claim_version_id ||
      !row.version_number ||
      !row.public_summary ||
      !row.confidence_level ||
      !row.risk_level
    ) {
      return [];
    }

    return [
      {
        id: row.claim_id,
        slug: row.claim_slug,
        versionId: row.claim_version_id,
        versionNumber: row.version_number,
        summary: row.public_summary,
        userMeaning: row.user_meaning ?? undefined,
        applicability: toRecord(row.applicability),
        confidenceLevel: row.confidence_level,
        riskLevel: row.risk_level,
        requiresProfessionalReview:
          row.requires_professional_review ?? false,
        reviewDueAt: row.review_due_at ?? undefined,
        citations: parseCitations(row.citations),
      },
    ];
  });

  const blocks: PortalContentBlock[] = (blocksResult.data ?? []).flatMap(
    (row) => {
      if (
        !row.content_block_id ||
        !row.content_block_slug ||
        !row.content_block_version_id ||
        !row.version_number ||
        !row.kind ||
        !row.risk_level
      ) {
        return [];
      }

      return [
        {
          id: row.content_block_id,
          slug: row.content_block_slug,
          versionId: row.content_block_version_id,
          versionNumber: row.version_number,
          kind: row.kind,
          title: row.title ?? undefined,
          riskLevel: row.risk_level,
          body: toRecord(row.body),
          claimVersionIds: parseStringArray(row.claim_version_ids),
        },
      ];
    },
  );

  const claimsBySection = new Map<string, PortalClaim[]>();
  for (const row of claimsResult.data ?? []) {
    if (!row.section_slug || !row.claim_id) continue;
    const claim = claims.find((item) => item.id === row.claim_id);
    if (!claim) continue;
    const current = claimsBySection.get(row.section_slug) ?? [];
    current.push(claim);
    claimsBySection.set(row.section_slug, current);
  }

  const blocksBySection = new Map<string, PortalContentBlock[]>();
  for (const row of blocksResult.data ?? []) {
    if (!row.section_slug || !row.content_block_id) continue;
    const block = blocks.find((item) => item.id === row.content_block_id);
    if (!block) continue;
    const current = blocksBySection.get(row.section_slug) ?? [];
    current.push(block);
    blocksBySection.set(row.section_slug, current);
  }

  const portal = portalResult.data;
  if (
    !portal.country_slug ||
    !portal.country_name ||
    !portal.iso_code ||
    !portal.release_id ||
    !portal.release_number
  ) {
    return null;
  }
  const previewIdentity = getPreviewPortal(portal.country_slug);

  return {
    slug: portal.country_slug,
    isoCode: portal.iso_code,
    name: portal.country_name,
    flagEmoji: safeFlagEmoji(
      portal.flag_emoji,
      previewIdentity?.flagEmoji ?? "",
    ),
    region: portal.region ?? undefined,
    summary:
      portal.summary ??
      "A reviewed Elsewhere country portal with release-pinned guidance.",
    overview:
      portal.overview ??
      "Use the reviewed sections and cited sources below to structure further research.",
    coverageLevel: portal.coverage_level ?? "core",
    publicationState: "published",
    releaseId: portal.release_id,
    releaseNumber: portal.release_number,
    publishedAt: portal.published_at ?? undefined,
    reviewedAt: portal.reviewed_at ?? undefined,
    audienceScope: toRecord(portal.audience_scope),
    sections: PORTAL_SECTION_DEFINITIONS.map((definition) => {
      const sectionClaims = claimsBySection.get(definition.slug) ?? [];
      const sectionBlocks = blocksBySection.get(definition.slug) ?? [];
      const hasContent = sectionClaims.length > 0 || sectionBlocks.length > 0;

      return {
        ...definition,
        status: hasContent ? ("published" as const) : ("in_review" as const),
        claims: sectionClaims,
        blocks: sectionBlocks,
      };
    }),
    sources: collectSources(claims),
  };
}

export const getCountryPortal = cache(
  async (slug: string): Promise<CountryPortal | null> => {
    const released = await readReleasedPortal(slug);
    return released ?? getPreviewPortal(slug);
  },
);

export const getCountryPortalCards = cache(
  async (): Promise<CountryPortalCardData[]> => {
    const previewCards = getPreviewPortalCards();
    if (!isSupabaseConfigured()) return previewCards;

    const client = createPublicContentClient();
    const result = await client
      .from("published_country_portals")
      .select(
        "country_slug,country_name,iso_code,flag_emoji,summary,coverage_level,release_number,published_at",
      )
      .in("country_slug", [...COUNTRY_PORTAL_SLUGS]);

    if (result.error) return previewCards;

    const releasedBySlug = new Map(
      (result.data ?? []).map((row) => [row.country_slug, row]),
    );

    return previewCards.map((preview) => {
      const released = releasedBySlug.get(preview.slug);
      if (!released?.country_slug || !released.country_name) return preview;

      return {
        slug: released.country_slug,
        isoCode: released.iso_code ?? preview.isoCode,
        name: released.country_name,
        flagEmoji: safeFlagEmoji(released.flag_emoji, preview.flagEmoji),
        summary:
          released.summary ??
          "A reviewed Elsewhere country portal with release-pinned guidance.",
        publicationState: "published",
        coverageLevel: released.coverage_level ?? "core",
        releaseNumber: released.release_number ?? undefined,
        publishedAt: released.published_at ?? undefined,
      };
    });
  },
);

export const getPublishedCountrySlugs = cache(async (): Promise<string[]> => {
  if (!isSupabaseConfigured()) return [];

  const client = createPublicContentClient();
  const result = await client
    .from("published_country_portals")
    .select("country_slug")
    .in("country_slug", [...COUNTRY_PORTAL_SLUGS]);

  if (result.error) return [];
  return (result.data ?? []).flatMap((row) =>
    row.country_slug ? [row.country_slug] : [],
  );
});
