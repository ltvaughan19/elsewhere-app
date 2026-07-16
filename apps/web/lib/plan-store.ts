"use client";

import type { OnboardingAnswers, ReadinessResult, UserPlan } from "@expat-atlas/types";
import { computeReadiness } from "@/lib/readiness-score";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Json } from "@/lib/supabase/database.types";

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

function isValidPlan(value: unknown): value is UserPlan {
  if (!value || typeof value !== "object") return false;
  const p = value as UserPlan;
  return typeof p.updatedAt === "string" && typeof p.onboardingCompleted === "boolean";
}

function serializePlan(plan: UserPlan): Json {
  return JSON.parse(JSON.stringify(plan)) as Json;
}

function enrichAuthenticatedIdentity(
  plan: UserPlan,
  user: { email?: string | null; user_metadata?: Record<string, unknown> },
): UserPlan {
  const metadataName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : "";
  const emailName = user.email?.split("@")[0]?.trim() || "Planner";
  const hasGuestName =
    !plan.displayName.trim() || plan.displayName.trim().toLowerCase() === "guest";
  const hasGuestEmail =
    !plan.email.trim() || plan.email.trim().toLowerCase().endsWith("@elsewhere.local");

  return {
    ...plan,
    email: hasGuestEmail ? user.email || plan.email : plan.email,
    displayName: hasGuestName ? metadataName || emailName : plan.displayName,
  };
}

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

async function getAuthedContext() {
  if (!isSupabaseConfigured() || typeof window === "undefined") return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { supabase, user };
  } catch {
    return null;
  }
}

/** Load plan from Supabase when a session exists. */
export async function fetchCloudPlan(): Promise<UserPlan | null> {
  const ctx = await getAuthedContext();
  if (!ctx) return null;
  const { data, error } = await ctx.supabase
    .from("user_plans")
    .select("plan")
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (error || !data?.plan) return null;
  if (!isValidPlan(data.plan)) return null;
  return data.plan;
}

/** Upsert plan for the logged-in user. No-op for guests / missing config. */
export async function upsertCloudPlan(plan: UserPlan): Promise<boolean> {
  const ctx = await getAuthedContext();
  if (!ctx) return false;
  const identified = enrichAuthenticatedIdentity(plan, ctx.user);
  const stamped: UserPlan = {
    ...identified,
    updatedAt: new Date().toISOString(),
  };
  const { error } = await ctx.supabase.from("user_plans").upsert(
    {
      user_id: ctx.user.id,
      plan: serializePlan(stamped),
      updated_at: stamped.updatedAt,
    },
    { onConflict: "user_id" },
  );
  return !error;
}

/**
 * Prefer cloud plan when authed; fall back to localStorage for guests.
 * If authed with only a local completed plan, migrate it to Supabase.
 */
export async function resolvePlan(): Promise<UserPlan | null> {
  const local = loadPlan();
  const ctx = await getAuthedContext();
  if (!ctx) return local;

  const cloud = await fetchCloudPlan();
  if (cloud) {
    const identified = enrichAuthenticatedIdentity(cloud, ctx.user);
    if (
      identified.displayName !== cloud.displayName ||
      identified.email !== cloud.email
    ) {
      await upsertCloudPlan(identified);
    }
    savePlan(identified);
    return identified;
  }

  if (local) {
    const enriched = enrichAuthenticatedIdentity(local, ctx.user);
    if (enriched.onboardingCompleted) {
      await upsertCloudPlan(enriched);
    }
    savePlan(enriched);
    return enriched;
  }

  return null;
}

/** Always write localStorage; also upsert cloud when logged in. */
export async function persistPlan(plan: UserPlan): Promise<UserPlan> {
  const stamped = { ...plan, updatedAt: new Date().toISOString() };
  savePlan(stamped);
  await upsertCloudPlan(stamped);
  return stamped;
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

/** Attach account identity without discarding planning work already saved on this device. */
export function connectLocalPlanIdentity(email: string, displayName: string): UserPlan {
  const existing = loadPlan();
  if (!existing) return createDemoAccount(email, displayName);

  const existingName = existing.displayName.trim();
  const name =
    displayName.trim() ||
    (existingName && existingName.toLowerCase() !== "guest" ? existingName : "") ||
    email.split("@")[0] ||
    "Planner";
  const connected: UserPlan = {
    ...existing,
    email,
    displayName: name,
    updatedAt: new Date().toISOString(),
  };
  savePlan(connected);
  return connected;
}

export function ensureGuestPlan(): UserPlan {
  const existing = loadPlan();
  if (existing) return existing;
  return createDemoAccount("guest@elsewhere.local", "Guest");
}

export async function completeOnboarding(answers: OnboardingAnswers): Promise<UserPlan> {
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
  return persistPlan(plan);
}

export async function updateSavedCountries(slugs: string[]): Promise<UserPlan | null> {
  const plan = loadPlan();
  if (!plan) return null;
  const updated = { ...plan, savedCountrySlugs: slugs };
  return persistPlan(updated);
}

export async function clearPlan(): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  const ctx = await getAuthedContext();
  if (!ctx) return;
  await ctx.supabase.from("user_plans").delete().eq("user_id", ctx.user.id);
}

export function getReadinessForPlan(plan: UserPlan | null): ReadinessResult | null {
  if (!plan?.readiness) return null;
  return plan.readiness;
}
