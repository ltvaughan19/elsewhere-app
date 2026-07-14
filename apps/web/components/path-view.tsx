"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { UserPlan } from "@expat-atlas/types";
import { Badge, SourceClaimCard, TrustDisclaimer } from "@expat-atlas/ui";
import {
  claimsForPathPack,
  corridorSlugForDestination,
  pathPackForDestination,
} from "@/lib/corridor-path";
import { loadPlan } from "@/lib/plan-store";
import { LAUNCH_CORRIDORS } from "@/lib/seed-corridors";
import { SEED_COUNTRIES } from "@/lib/seed-countries";

const CHECKLIST_KEY = "elsewhere-path-checklist";

function loadChecks(packId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${CHECKLIST_KEY}:${packId}`);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveChecks(packId: string, checks: Record<string, boolean>) {
  localStorage.setItem(`${CHECKLIST_KEY}:${packId}`, JSON.stringify(checks));
}

export function PathView() {
  const router = useRouter();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const p = loadPlan();
    if (!p) {
      router.replace("/app/onboarding");
      return;
    }
    if (!p.onboardingCompleted || !p.readiness) {
      router.replace("/app/onboarding");
      return;
    }
    setPlan(p);
    const pack = pathPackForDestination(p.readiness.bestFitSlug);
    if (pack) setChecks(loadChecks(pack.id));
  }, [router]);

  if (!plan?.readiness) {
    return <p className="text-sm text-navy-800">Loading your path…</p>;
  }

  const bestSlug = plan.readiness.bestFitSlug;
  const best = SEED_COUNTRIES.find((c) => c.slug === bestSlug);
  const corridorSlug = corridorSlugForDestination(bestSlug);
  const corridor = LAUNCH_CORRIDORS.find((c) => c.slug === corridorSlug);
  const pack = pathPackForDestination(bestSlug);
  const claims = pack ? claimsForPathPack(pack) : [];
  const doneCount = pack
    ? pack.checklist.filter((item) => checks[item.id]).length
    : 0;

  const toggle = (id: string) => {
    if (!pack) return;
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    saveChecks(pack.id, next);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <p className="elsewhere-eyebrow">Your research path</p>
      <h1 className="mt-2 font-display text-4xl text-cream">
        {best?.flagEmoji} {pack?.name ?? `${best?.name ?? bestSlug} path`}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy-800">
        {pack?.overview ??
          "A calm research sequence for your top corridor hypothesis. Not a visa application or approval."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="demo">Planning estimate</Badge>
        <Badge variant="demo">Needs verification</Badge>
        {corridor ? (
          <Badge variant="default">{corridor.name}</Badge>
        ) : null}
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="border border-cream/10 bg-void-elevated p-5">
          <p className="text-xs uppercase text-navy-800">Readiness</p>
          <p className="mt-2 font-display text-3xl text-accent-sand">
            {plan.readiness.score}%
          </p>
        </div>
        <div className="border border-cream/10 bg-void-elevated p-5 sm:col-span-2">
          <p className="text-xs uppercase text-navy-800">Safer next step</p>
          <p className="mt-2 text-sm text-cream">{plan.readiness.nextStep}</p>
        </div>
      </section>

      {plan.readiness.warningFlags.length > 0 ? (
        <ul className="mt-6 space-y-2 border border-accent-sand/25 bg-accent-sand/10 p-4 text-sm text-cream">
          {plan.readiness.warningFlags.map((w) => (
            <li key={w}>• {w}</li>
          ))}
        </ul>
      ) : null}

      {pack ? (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-2xl text-cream">Checklist</h2>
            <p className="text-xs text-navy-800">
              {doneCount} / {pack.checklist.length} started
            </p>
          </div>
          <p className="mt-2 text-sm text-navy-800">
            Metadata only — no document uploads in MVP. Check items as you research.
          </p>
          <ul className="mt-6 space-y-3">
            {pack.checklist.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-start gap-3 border border-cream/10 bg-void-elevated px-4 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(checks[item.id])}
                    onChange={() => toggle(item.id)}
                    className="mt-1"
                  />
                  <span className="text-sm text-cream">{item.title}</span>
                </label>
              </li>
            ))}
          </ul>
          {pack.bestIf.length > 0 ? (
            <div className="mt-6">
              <p className="elsewhere-eyebrow">Best if</p>
              <ul className="mt-2 list-inside list-disc text-sm text-navy-800">
                {pack.bestIf.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="font-display text-2xl text-cream">Source notes</h2>
        <p className="mt-2 text-sm text-navy-800">
          Low confidence until official URLs are verified. We never say you qualify.
        </p>
        <div className="mt-6 space-y-4">
          {claims.map((claim) => (
            <SourceClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-cream">Also research</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {plan.readiness.backupSlugs.map((slug) => {
            const c = SEED_COUNTRIES.find((x) => x.slug === slug);
            return (
              <Link
                key={slug}
                href={`/countries/${slug}`}
                className="border border-sand-200 px-4 py-2 text-sm text-cream hover:border-accent-sand/40"
              >
                {c?.flagEmoji} {c?.name ?? slug}
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/app/dashboard"
          className="rounded-md bg-accent-sand px-5 py-2.5 text-sm font-medium text-accent-ink"
        >
          Go to dashboard
        </Link>
        <Link
          href={`/countries/${bestSlug}`}
          className="rounded-md border border-sand-300 px-5 py-2.5 text-sm text-cream"
        >
          Country notes
        </Link>
        <Link
          href="/app/onboarding"
          className="rounded-md border border-sand-200 px-5 py-2.5 text-sm text-navy-800"
        >
          Retake Fit Quiz
        </Link>
      </div>

      <TrustDisclaimer className="mt-10" />
    </div>
  );
}
