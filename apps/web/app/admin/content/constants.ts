import type { Enums } from "@/lib/supabase/database.types";

export const LAUNCH_COUNTRY_SLUGS = [
  "philippines",
  "thailand",
  "mexico",
] as const;

export type LaunchCountrySlug = (typeof LAUNCH_COUNTRY_SLUGS)[number];

export const AUTHOR_ROLES = ["editor", "publisher", "admin"] as const;
export const REVIEWER_ROLES = ["reviewer", "publisher", "admin"] as const;
export const PUBLISHER_ROLES = ["publisher", "admin"] as const;

export const AUTHORITY_LEVELS: readonly {
  value: Enums<"source_authority_level">;
  label: string;
  description: string;
}[] = [
  {
    value: "official_government",
    label: "Official government",
    description: "A ministry, department, or other government body.",
  },
  {
    value: "immigration_authority",
    label: "Immigration authority",
    description: "The agency responsible for entry, visas, or residence.",
  },
  {
    value: "embassy_consulate",
    label: "Embassy or consulate",
    description: "Official diplomatic guidance for a specific audience.",
  },
  {
    value: "intergovernmental",
    label: "Intergovernmental body",
    description: "An official multi-country institution or treaty body.",
  },
  {
    value: "licensed_professional",
    label: "Licensed professional",
    description: "A credentialed expert; credentials still require review.",
  },
  {
    value: "reputable_institution",
    label: "Reputable institution",
    description: "A university, hospital, bank, or recognized organization.",
  },
  {
    value: "editorial",
    label: "Editorial",
    description: "Context or interpretation, never a substitute for authority.",
  },
  {
    value: "community",
    label: "Community report",
    description: "Firsthand input that remains unverified until corroborated.",
  },
];

export const RISK_LEVELS: readonly {
  value: Enums<"claim_risk_level">;
  label: string;
}[] = [
  { value: "low", label: "Low impact" },
  { value: "medium", label: "Medium impact" },
  { value: "high", label: "High impact" },
  { value: "critical", label: "Critical impact" },
];

export const CONFIDENCE_LEVELS: readonly {
  value: Enums<"claim_confidence_level">;
  label: string;
}[] = [
  { value: "low", label: "Low — unresolved or incomplete" },
  { value: "medium", label: "Medium — supported, still needs care" },
  { value: "high", label: "High — strong, current evidence" },
];

export const CONTENT_BLOCK_KINDS: readonly {
  value: Enums<"content_block_kind">;
  label: string;
}[] = [
  { value: "rich_text", label: "Explainer" },
  { value: "key_facts", label: "Key facts" },
  { value: "claim_list", label: "Evidence-backed facts" },
  { value: "steps", label: "Step-by-step guidance" },
  { value: "watchouts", label: "Watchouts and cautions" },
  { value: "stay_path_matrix", label: "Stay-path comparison" },
  { value: "city_grid", label: "City comparison" },
  { value: "budget_embed", label: "Budget tool placement" },
  { value: "source_list", label: "Source list" },
  { value: "change_log", label: "Change history" },
  { value: "next_action", label: "Recommended next action" },
];

export const REVIEW_DECISIONS: readonly {
  value: Enums<"editorial_review_decision">;
  label: string;
}[] = [
  { value: "approved", label: "Approve" },
  { value: "changes_requested", label: "Request changes" },
  { value: "rejected", label: "Reject" },
];

export function isLaunchCountrySlug(value: string): value is LaunchCountrySlug {
  return LAUNCH_COUNTRY_SLUGS.includes(value as LaunchCountrySlug);
}

export function hasRole<TRole extends string>(
  role: string,
  roles: readonly TRole[],
): role is TRole {
  return roles.includes(role as TRole);
}
