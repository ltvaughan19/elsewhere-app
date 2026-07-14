"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { UserPlan } from "@expat-atlas/types";
import { clearPlan, resolvePlan } from "@/lib/plan-store";

export default function SettingsPage() {
  const [plan, setPlan] = useState<UserPlan | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const p = await resolvePlan();
      if (!cancelled) setPlan(p);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const reset = () => {
    if (confirm("Clear your saved plan on this device and (if logged in) in the cloud?")) {
      void clearPlan().then(() => {
        window.location.href = "/signup";
      });
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl text-navy-950">Settings</h1>
      <dl className="mt-8 space-y-4 rounded-xl border border-sand-200 bg-white p-6 text-sm">
        <div>
          <dt className="text-navy-800/60">Email</dt>
          <dd className="text-navy-950">{plan?.email || "—"}</dd>
        </div>
        <div>
          <dt className="text-navy-800/60">Plan tier</dt>
          <dd className="capitalize text-navy-950">{plan?.planTier ?? "free"}</dd>
        </div>
        <div>
          <dt className="text-navy-800/60">Onboarding</dt>
          <dd className="text-navy-950">
            {plan?.onboardingCompleted ? "Complete" : "Not started"}
          </dd>
        </div>
      </dl>
      <p className="mt-6 text-sm text-navy-800/70">
        When you are logged in, your Fit Quiz plan syncs to your Elsewhere account.
        Guests keep a device-only copy until signup.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/app/onboarding"
          className="rounded-full border border-sand-200 px-4 py-2 text-sm"
        >
          Retake quiz
        </Link>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-800"
        >
          Clear saved plan
        </button>
      </div>
    </div>
  );
}
