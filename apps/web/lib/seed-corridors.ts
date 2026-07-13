import type {
  CorridorSeed,
  PathPackSeed,
  SourceClaimDisplay,
} from "@expat-atlas/types";

/**
 * Launch corridors — US citizen → hotspot destinations.
 * Architecture stays corridor-agnostic; this is content seed only.
 */
export const LAUNCH_CORRIDORS: CorridorSeed[] = [
  {
    slug: "us-philippines",
    originCountryCode: "US",
    destinationSlug: "philippines",
    name: "United States → Philippines",
    summary:
      "English-friendly long-stay research corridor with large existing expat communities and approachable cost-of-living bands (planning estimates).",
    isPublished: true,
    sortOrder: 1,
  },
  {
    slug: "us-thailand",
    originCountryCode: "US",
    destinationSlug: "thailand",
    name: "United States → Thailand",
    summary:
      "Major digital nomad and long-stay hotspot. Strong community density; visa paths require careful official research.",
    isPublished: true,
    sortOrder: 2,
  },
  {
    slug: "us-mexico",
    originCountryCode: "US",
    destinationSlug: "mexico",
    name: "United States → Mexico",
    summary:
      "Closest major US corridor with large expat cities and familiar travel patterns — still verify immigration and tax rules.",
    isPublished: true,
    sortOrder: 3,
  },
];

/** Sample claims — all needs_review until human confirms official URLs */
export const SEED_CLAIMS: SourceClaimDisplay[] = [
  {
    id: "ph-entry-research",
    countrySlug: "philippines",
    category: "visa_stay_length",
    plainEnglishSummary:
      "Many visitors research short tourist entry and possible extensions. Rules vary by nationality and change — treat stay lengths as planning estimates until verified on the official immigration site.",
    sourceType: "immigration_authority",
    sourceName: "Philippines immigration (verify official site)",
    confidenceLevel: "low",
    reviewStatus: "needs_review",
    riskLevel: "high",
    requiresProfessionalReview: true,
  },
  {
    id: "th-entry-research",
    countrySlug: "thailand",
    category: "visa_stay_length",
    plainEnglishSummary:
      "Tourist exemption / tourist visa options are commonly researched for first stays. Duration and eligibility depend on passport and entry type — confirm with Thai immigration / embassy before travel.",
    sourceType: "immigration_authority",
    sourceName: "Thai immigration (verify official site)",
    confidenceLevel: "low",
    reviewStatus: "needs_review",
    riskLevel: "high",
    requiresProfessionalReview: true,
  },
  {
    id: "mx-entry-research",
    countrySlug: "mexico",
    category: "visa_stay_length",
    plainEnglishSummary:
      "US citizens often research visa-free tourist stays and longer temporary resident options. FMM / residency rules and income requirements change — verify with official Mexican immigration guidance.",
    sourceType: "immigration_authority",
    sourceName: "Mexican immigration (verify official site)",
    confidenceLevel: "low",
    reviewStatus: "needs_review",
    riskLevel: "high",
    requiresProfessionalReview: true,
  },
  {
    id: "ph-col-band",
    countrySlug: "philippines",
    category: "cost_of_living",
    plainEnglishSummary:
      "Planning estimate for a modest lifestyle often cited in the roughly $1,200–$1,800 / month band depending on city and habits — not a quote. Build your own budget with local research.",
    sourceType: "editorial",
    sourceName: "Elsewhere planning estimate",
    confidenceLevel: "low",
    reviewStatus: "needs_review",
    riskLevel: "medium",
  },
  {
    id: "th-col-band",
    countrySlug: "thailand",
    category: "cost_of_living",
    plainEnglishSummary:
      "Planning estimate for many long-stay researchers sits roughly $1,400–$2,200 / month depending on city (Bangkok vs secondary) — verify with current local prices.",
    sourceType: "editorial",
    sourceName: "Elsewhere planning estimate",
    confidenceLevel: "low",
    reviewStatus: "needs_review",
    riskLevel: "medium",
  },
  {
    id: "mx-col-band",
    countrySlug: "mexico",
    category: "cost_of_living",
    plainEnglishSummary:
      "Planning estimate for many US remote workers exploring Mexico often sits roughly $1,500–$2,500 / month depending on city — not a guarantee of lifestyle.",
    sourceType: "editorial",
    sourceName: "Elsewhere planning estimate",
    confidenceLevel: "low",
    reviewStatus: "needs_review",
    riskLevel: "medium",
  },
];

export const SEED_PATH_PACKS: PathPackSeed[] = [
  {
    id: "us-ph-research",
    corridorSlug: "us-philippines",
    slug: "long-stay-research",
    name: "Philippines long-stay research path",
    audienceTags: ["remote", "cost", "community"],
    overview:
      "A calm sequence to research legality, money, and first-housing strategy for a Philippines long stay. Not a visa application service.",
    bestIf: [
      "You want English-friendly daily life",
      "Cost of living is a top priority",
      "You can verify rules with official sources before acting",
    ],
    checklist: [
      { id: "passport", title: "Confirm passport validity 6+ months" },
      { id: "budget", title: "Run budget calculator with real numbers" },
      { id: "visa", title: "Read official immigration guidance for your nationality" },
      { id: "housing", title: "Plan rent-first first 90 days (no large wires to strangers)" },
      { id: "health", title: "List health coverage questions for brokers / insurers" },
    ],
    claimIds: ["ph-entry-research", "ph-col-band"],
    reviewStatus: "needs_review",
  },
  {
    id: "us-th-research",
    corridorSlug: "us-thailand",
    slug: "long-stay-research",
    name: "Thailand long-stay research path",
    audienceTags: ["remote", "nature", "visa_ease"],
    overview:
      "Research tourist entry limits, longer-stay options, and city fit. Rules differ by passport — start with official sources.",
    bestIf: [
      "You’re drawn to strong nomad infrastructure",
      "You’re willing to track visa timelines carefully",
      "You want dense peer communities",
    ],
    checklist: [
      { id: "passport", title: "Confirm passport validity 6+ months" },
      { id: "entry", title: "Verify current entry / exemption rules for your passport" },
      { id: "budget", title: "Model Bangkok vs secondary city costs" },
      { id: "insurance", title: "Compare international vs local health coverage categories" },
      { id: "extend", title: "Document how extensions work (official only)" },
    ],
    claimIds: ["th-entry-research", "th-col-band"],
    reviewStatus: "needs_review",
  },
  {
    id: "us-mx-research",
    corridorSlug: "us-mexico",
    slug: "long-stay-research",
    name: "Mexico long-stay research path",
    audienceTags: ["remote", "community", "cost"],
    overview:
      "Explore tourist stays vs temporary residency research for US citizens. Tax and immigration are separate tracks — use professionals when needed.",
    bestIf: [
      "You want proximity to the US",
      "You’re comparing specific cities with large expat scenes",
      "You can separate lifestyle research from immigration filings",
    ],
    checklist: [
      { id: "passport", title: "Confirm passport validity" },
      { id: "entry", title: "Verify tourist stay rules and required documents" },
      { id: "residency", title: "If staying long, research temporary resident criteria (official)" },
      { id: "budget", title: "Budget for city-specific rent and healthcare" },
      { id: "tax", title: "Note tax questions for a licensed advisor — we don’t determine residency" },
    ],
    claimIds: ["mx-entry-research", "mx-col-band"],
    reviewStatus: "needs_review",
  },
];

export function claimsForCountry(slug: string): SourceClaimDisplay[] {
  return SEED_CLAIMS.filter((c) => c.countrySlug === slug);
}

export function pathPackForCorridor(corridorSlug: string): PathPackSeed | undefined {
  return SEED_PATH_PACKS.find((p) => p.corridorSlug === corridorSlug);
}
