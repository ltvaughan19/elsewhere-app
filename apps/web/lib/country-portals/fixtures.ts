import {
  PORTAL_SECTION_DEFINITIONS,
  type CountryPortal,
  type CountryPortalCardData,
  type CountryPortalSlug,
} from "./types";

interface PreviewCountryIdentity {
  slug: CountryPortalSlug;
  isoCode: string;
  name: string;
  flagEmoji: string;
}

const PREVIEW_COUNTRIES: readonly PreviewCountryIdentity[] = [
  {
    slug: "philippines",
    isoCode: "PH",
    name: "Philippines",
    flagEmoji: "\uD83C\uDDF5\uD83C\uDDED",
  },
  {
    slug: "thailand",
    isoCode: "TH",
    name: "Thailand",
    flagEmoji: "\uD83C\uDDF9\uD83C\uDDED",
  },
  {
    slug: "mexico",
    isoCode: "MX",
    name: "Mexico",
    flagEmoji: "\uD83C\uDDF2\uD83C\uDDFD",
  },
] as const;

const PREVIEW_SUMMARY =
  "A source-reviewed country portal is being assembled. Its structure is visible now; guidance remains unpublished until it passes Elsewhere's release checks.";

const PREVIEW_OVERVIEW =
  "Use this preview to see what Elsewhere will research. It does not yet contain country-specific instructions, prices, scores, or eligibility guidance.";

export function getPreviewPortal(slug: string): CountryPortal | null {
  const country = PREVIEW_COUNTRIES.find((item) => item.slug === slug);
  if (!country) return null;

  return {
    ...country,
    summary: PREVIEW_SUMMARY,
    overview: PREVIEW_OVERVIEW,
    coverageLevel: "preview",
    publicationState: "preview",
    audienceScope: {
      schemaVersion: 1,
      citizenshipCountryCodes: [],
      residenceCountryCodes: [],
      purposes: [],
      durationBands: [],
      householdTags: [],
    },
    sections: PORTAL_SECTION_DEFINITIONS.map((section) => ({
      ...section,
      status: "in_review" as const,
      claims: [],
      blocks: [],
    })),
    sources: [],
  };
}

export function getPreviewPortalCards(): CountryPortalCardData[] {
  return PREVIEW_COUNTRIES.map((country) => ({
    slug: country.slug,
    isoCode: country.isoCode,
    name: country.name,
    flagEmoji: country.flagEmoji,
    summary: PREVIEW_SUMMARY,
    publicationState: "preview",
    coverageLevel: "preview",
  }));
}
