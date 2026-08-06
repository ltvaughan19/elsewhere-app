import type { PricingTier } from "@expat-atlas/types";

/** Proof-scope catalog: Free, Explorer ($19), Serious Move ($149). */
export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description:
      "Enough to feel you’re actually going — one Sunday Action on published Philippines Entry & Stay.",
    features: [
      "Fit Quiz → research path",
      "Published PH Entry & legal stay + Sunday Action",
      "Trust strip + done this week",
      "Passport checklist & basic budget",
      "Compare limited to published data",
    ],
    cta: "Get started free",
  },
  {
    id: "explorer",
    name: "Explorer",
    price: "$19",
    period: "/ month",
    description:
      "Continuity and depth once the weekly leaving habit is yours — Philippines proof corridor.",
    features: [
      "Sunday Action history + streak",
      "Multi-device plan sync",
      "Living personal roadmap",
      "Lightweight source-change alerts (PH)",
      "Deeper budget / runway + progress summary",
    ],
    cta: "Start Explorer",
    highlighted: true,
  },
  {
    id: "serious_move",
    name: "Serious Move",
    price: "$149",
    period: "one-time",
    description:
      "A structured 30/60/90 action pack from your quiz/plan and published PH claims. Regenerable later.",
    features: [
      "30/60/90 pack from your plan + published PH claims",
      "Regenerate an updated pack later",
      "Stacks with Free or Explorer",
      "Keeps working if you cancel Explorer",
    ],
    cta: "Get Serious Move",
  },
  {
    id: "builder",
    name: "Builder",
    price: "—",
    period: "",
    description: "Deeper roadmap modules after this proof. Not for sale yet.",
    features: ["Coming later — not available in this proof"],
    cta: "Coming later",
    comingLater: true,
  },
  {
    id: "concierge",
    name: "Concierge",
    price: "—",
    period: "",
    description: "Human-assisted planning when verified partners exist. Not live.",
    features: ["Coming later — not available in this proof"],
    cta: "Coming later",
    comingLater: true,
  },
];

export const PRIMARY_PRICING_TIERS = PRICING_TIERS.filter(
  (tier) => tier.id === "free" || tier.id === "explorer" || tier.id === "serious_move",
);

export const LATER_PRICING_TIERS = PRICING_TIERS.filter((tier) => tier.comingLater);
