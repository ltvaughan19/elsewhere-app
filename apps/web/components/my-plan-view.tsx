"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { UserPlan } from "@expat-atlas/types";
import { loadPlan } from "@/lib/plan-store";
import { SEED_COUNTRIES } from "@/lib/seed-countries";

const PLAN_TEMPLATE = [
  { week: "Week 1", tasks: ["Confirm passport timeline", "Set monthly savings target", "Read visa overview for best-fit country"] },
  { week: "Week 2", tasks: ["Run budget calculator with real numbers", "List official sources to verify", "Join waitlist if you need concierge help"] },
  { week: "Week 3", tasks: ["Compare backup countries", "Research housing neighborhoods (rent first)", "Check health insurance categories"] },
  { week: "Week 4", tasks: ["Draft 90-day outline", "Identify blockers needing professional help", "Set a realistic departure research date"] },
];

export function MyPlanView() {
  const [plan, setPlan] = useState<UserPlan | null>(null);

  useEffect(() => {
    setPlan(loadPlan());
  }, []);

  const best = plan?.readiness
    ? SEED_COUNTRIES.find((c) => c.slug === plan.readiness!.bestFitSlug)
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl text-navy-950">My 30-day plan</h1>
      <p className="mt-2 text-navy-800/70">
        A structured starting outline — customize with your own deadlines.
      </p>
      {best ? (
        <p className="mt-4 rounded-xl border border-sand-200 bg-white p-4 text-sm">
          Focus corridor: <strong>{best.flagEmoji} {best.name}</strong> (planning estimate, verify before acting)
        </p>
      ) : (
        <p className="mt-4 text-sm">
          <Link href="/app/onboarding" className="text-jungle-600">
            Complete the readiness quiz
          </Link>{" "}
          to personalize this plan.
        </p>
      )}
      <div className="mt-8 space-y-4">
        {PLAN_TEMPLATE.map((block) => (
          <section
            key={block.week}
            className="rounded-xl border border-sand-200 bg-white p-5"
          >
            <h2 className="font-medium text-navy-950">{block.week}</h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-navy-800/80">
              {block.tasks.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
