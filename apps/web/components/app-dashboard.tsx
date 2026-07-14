"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { UserPlan } from "@expat-atlas/types";
import { Badge } from "@expat-atlas/ui";
import { SEED_COUNTRIES } from "@/lib/seed-countries";
import { resolvePlan } from "@/lib/plan-store";

export function AppDashboard() {
  const router = useRouter();
  const [plan, setPlan] = useState<UserPlan | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const p = await resolvePlan();
      if (cancelled) return;
      if (!p) {
        router.replace("/signup");
        return;
      }
      if (!p.onboardingCompleted) {
        router.replace("/app/onboarding");
        return;
      }
      setPlan(p);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!plan?.readiness) {
    return <p className="text-sm text-navy-800/70">Loading your plan…</p>;
  }

  const best = SEED_COUNTRIES.find((c) => c.slug === plan.readiness!.bestFitSlug);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-navy-800/60">
        Welcome back, {plan.displayName || "planner"}
      </p>
      <h1 className="mt-1 font-display text-4xl text-navy-950">Your dashboard</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-sand-200 bg-white p-6">
          <p className="text-xs uppercase text-navy-800/60">Readiness score</p>
          <p className="mt-2 font-display text-4xl text-jungle-600">
            {plan.readiness.score}%
          </p>
          <Badge variant="demo" className="mt-2">
            Planning estimate
          </Badge>
        </div>
        <div className="rounded-xl border border-sand-200 bg-white p-6">
          <p className="text-xs uppercase text-navy-800/60">Best fit (research)</p>
          <p className="mt-2 text-2xl">
            {best?.flagEmoji} {best?.name ?? plan.readiness.bestFitSlug}
          </p>
          <Link
            href={`/countries/${plan.readiness.bestFitSlug}`}
            className="mt-2 inline-block text-sm text-jungle-600"
          >
            View country →
          </Link>
        </div>
        <div className="rounded-xl border border-sand-200 bg-white p-6 sm:col-span-2">
          <p className="text-xs uppercase text-navy-800/60">Your next step</p>
          <p className="mt-2 text-lg text-navy-950">{plan.readiness.nextStep}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/app/path"
              className="rounded-full bg-jungle-600 px-4 py-2 text-sm text-accent-ink"
            >
              Open research path
            </Link>
            <Link
              href="/app/passport"
              className="rounded-full border border-sand-200 px-4 py-2 text-sm"
            >
              Passport checklist
            </Link>
            <Link
              href="/app/budget"
              className="rounded-full border border-sand-200 px-4 py-2 text-sm"
            >
              Budget calculator
            </Link>
            <Link
              href="/compare"
              className="rounded-full border border-sand-200 px-4 py-2 text-sm"
            >
              Compare countries
            </Link>
          </div>
        </div>
      </div>
      {plan.readiness.warningFlags.length > 0 ? (
        <ul className="mt-6 space-y-2 rounded-xl border border-gold-400/30 bg-gold-400/10 p-4 text-sm text-navy-900">
          {plan.readiness.warningFlags.map((w) => (
            <li key={w}>• {w}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
