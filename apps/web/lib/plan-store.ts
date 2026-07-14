"use client";

import type { OnboardingAnswers, ReadinessResult, UserPlan } from "@expat-atlas/types";
import { computeReadiness } from "@/lib/readiness-score";

const STORAGE_KEY = "expat-atlas-user-plan";

const DEFAULT_PLAN: UserPlan = {
  email: "",
  displayName: "",
  planTier: "free",
  onboardingCompleted: false,
  answers: null,
  readiness: null,
  savedCountrySlugs: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function loadPlan(): UserPlan | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserPlan;
  } catch {
    return null;
  }
}

export function savePlan(plan: UserPlan): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...plan, updatedAt: new Date().toISOString() }),
  );
}

export function createDemoAccount(email: string, displayName: string): UserPlan {
  const plan: UserPlan = {
    ...DEFAULT_PLAN,
    email,
    displayName: displayName || email.split("@")[0] || "Planner",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  savePlan(plan);
  return plan;
}

export function ensureGuestPlan(): UserPlan {
  const existing = loadPlan();
  if (existing) return existing;
  return createDemoAccount("guest@elsewhere.local", "Guest");
}

export function completeOnboarding(answers: OnboardingAnswers): UserPlan {
  const existing = loadPlan() ?? ensureGuestPlan();
  const readiness = computeReadiness(answers);
  const plan: UserPlan = {
    ...existing,
    answers,
    readiness,
    onboardingCompleted: true,
    savedCountrySlugs: [
      readiness.bestFitSlug,
      ...readiness.backupSlugs.slice(0, 2),
    ].filter((slug, i, arr) => arr.indexOf(slug) === i),
    updatedAt: new Date().toISOString(),
  };
  savePlan(plan);
  return plan;
}

export function updateSavedCountries(slugs: string[]): UserPlan | null {
  const plan = loadPlan();
  if (!plan) return null;
  const updated = { ...plan, savedCountrySlugs: slugs };
  savePlan(updated);
  return updated;
}

export function clearPlan(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getReadinessForPlan(plan: UserPlan | null): ReadinessResult | null {
  if (!plan?.readiness) return null;
  return plan.readiness;
}
