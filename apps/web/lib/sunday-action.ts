import "server-only";

import { getCountryPortal } from "@/lib/country-portals/queries";
import type { PortalCitation, PortalContentBlock } from "@/lib/country-portals/types";
import type { SundayActionView } from "@/lib/sunday-action-types";

export type { SundayActionView };

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === "string" && Boolean(item.trim()),
  );
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function paragraphsFromBlock(block: PortalContentBlock): string[] {
  const paragraphs = stringList(block.body.paragraphs);
  if (paragraphs.length) return paragraphs;
  const text =
    stringValue(block.body.lede) ??
    stringValue(block.body.summary) ??
    stringValue(block.body.text) ??
    stringValue(block.body.description);
  return text ? [text] : [];
}

function pickPrimaryCitation(citations: PortalCitation[]): PortalCitation | undefined {
  return (
    citations.find((citation) => citation.role === "primary") ?? citations[0]
  );
}

/**
 * Load the published Philippines Sunday Action (Entry/Stay next_action) when released.
 * Preview portals are ignored — Free habit surfaces only published content.
 */
export async function getPublishedPhilippinesSundayAction(): Promise<SundayActionView | null> {
  const portal = await getCountryPortal("philippines");
  if (!portal || portal.publicationState !== "published") return null;

  const entryStay = portal.sections.find((section) => section.slug === "entry-and-stay");
  const nextAction = entryStay?.blocks.find((block) => block.kind === "next_action");
  if (!nextAction) return null;

  const paragraphs = paragraphsFromBlock(nextAction);
  if (!nextAction.title && paragraphs.length === 0) return null;

  const claim =
    entryStay?.claims.find((item) =>
      nextAction.claimVersionIds.includes(item.versionId),
    ) ?? entryStay?.claims[0];
  const citation = claim ? pickPrimaryCitation(claim.citations) : undefined;
  const fallbackSource = portal.sources[0];

  return {
    countrySlug: portal.slug,
    countryName: portal.name,
    blockSlug: nextAction.slug,
    title: nextAction.title ?? "This week’s next step",
    paragraphs,
    portalHref: `/countries/${portal.slug}#entry-and-stay`,
    publishedAt: portal.publishedAt,
    releaseNumber: portal.releaseNumber,
    sourceTitle: citation?.sourceTitle ?? fallbackSource?.title,
    sourceUrl: citation?.canonicalUrl ?? fallbackSource?.canonicalUrl,
    lastVerifiedAt: citation?.lastVerifiedAt ?? fallbackSource?.lastVerifiedAt,
  };
}

export { isoWeekKey } from "@/lib/sunday-week";
