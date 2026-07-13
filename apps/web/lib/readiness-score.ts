import type { OnboardingAnswers, ReadinessResult } from "@expat-atlas/types";
import { SEED_COUNTRIES } from "@/lib/seed-countries";

const CORRIDOR = ["philippines", "thailand", "mexico"] as const;

function scoreCountry(
  slug: string,
  answers: OnboardingAnswers,
): number {
  const country = SEED_COUNTRIES.find((c) => c.slug === slug);
  if (!country) return 0;

  let score = 50;

  if (answers.priority === "cost") {
    score += slug === "philippines" ? 15 : slug === "mexico" ? 8 : 5;
  }
  if (answers.priority === "community") {
    score += country.socialScore / 10;
  }
  if (answers.priority === "nature") {
    score += country.natureScore / 10;
  }
  if (answers.priority === "healthcare") {
    score += country.healthcareScore / 10;
  }
  if (answers.priority === "visa_ease") {
    score += country.visaComplexity === "Moderate" ? 10 : 4;
  }

  if (answers.remoteWork === "yes" && country.internetScore >= 75) score += 8;
  if (answers.monthlySavingsUsd >= 1500) score += 5;
  if (answers.riskTolerance === "low" && country.visaComplexity !== "Higher") {
    score += 5;
  }

  if (answers.preferredCorridor !== "open" && answers.preferredCorridor === slug) {
    score += 12;
  }

  return Math.min(100, Math.round(score));
}

export function computeReadiness(answers: OnboardingAnswers): ReadinessResult {
  const blockers: ReadinessResult["blockers"] = [];
  const warningFlags: string[] = [];

  if (answers.hasValidPassport === "no") blockers.push("passport");
  if (answers.hasValidPassport === "expiring_soon") {
    warningFlags.push("Passport may expire before your target move date — verify renewal timelines.");
  }

  const runwayMonths =
    answers.monthlyIncomeUsd > 0
      ? answers.monthlySavingsUsd / Math.max(answers.monthlyIncomeUsd * 0.6, 500)
      : answers.monthlySavingsUsd / 1200;

  if (runwayMonths < 3) {
    blockers.push("savings");
    warningFlags.push("Savings runway looks short for a move — consider extending your timeline.");
  }

  if (answers.remoteWork === "no") {
    warningFlags.push("Income abroad may require local compliance — research before relying on tourism stays.");
  }

  if (answers.travelingWithFamily) blockers.push("family");

  const ranked = [...CORRIDOR]
    .map((slug) => ({ slug, fit: scoreCountry(slug, answers) }))
    .sort((a, b) => b.fit - a.fit);

  const baseScore =
    40 +
    (answers.hasValidPassport === "yes" ? 15 : 0) +
    Math.min(20, Math.round(runwayMonths * 2)) +
    (answers.priorTravelAbroad ? 5 : 0) +
    (answers.remoteWork === "yes" ? 10 : 0);

  const blockerPenalty = blockers.length * 8;
  const score = Math.max(15, Math.min(95, baseScore - blockerPenalty));

  let nextStep = "Compare your top country fits and start visa research.";
  if (blockers.includes("passport")) {
    nextStep = "Start your passport checklist before researching visas.";
  } else if (blockers.includes("savings")) {
    nextStep = "Run the budget calculator and set a savings target date.";
  } else if (blockers.includes("family")) {
    nextStep = "List family logistics (schools, dependents, insurance) before choosing a country.";
  }

  return {
    score,
    bestFitSlug: ranked[0]?.slug ?? "philippines",
    backupSlugs: ranked.slice(1).map((r) => r.slug),
    blockers,
    nextStep,
    warningFlags,
  };
}
