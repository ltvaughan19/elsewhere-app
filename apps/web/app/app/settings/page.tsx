"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { UserPlan } from "@expat-atlas/types";
import { clearPlan, resolvePlan } from "@/lib/plan-store";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuthSession } from "@/components/auth-session-provider";

interface AccountSummary {
  email: string;
  planTier: string | null;
}

async function loadAccountSummary(): Promise<AccountSummary | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profileResult = await supabase
    .from("profiles")
    .select("email,plan_tier")
    .eq("id", user.id)
    .maybeSingle();

  return {
    email: profileResult.data?.email ?? user.email ?? "",
    planTier: profileResult.data?.plan_tier ?? null,
  };
}

export default function SettingsPage() {
  const { status, signOut } = useAuthSession();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [accountLoaded, setAccountLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [resolvedPlan, accountSummary] = await Promise.all([
        resolvePlan(),
        loadAccountSummary(),
      ]);
      if (!cancelled) {
        setPlan(resolvedPlan);
        setAccount(accountSummary);
        setAccountLoaded(true);
      }
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

  const logOut = async () => {
    await signOut();
    window.location.assign("/");
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl text-navy-950">Settings</h1>
      <dl className="mt-8 space-y-4 rounded-xl border border-sand-200 bg-white p-6 text-sm">
        <div>
          <dt className="text-navy-800/60">Email</dt>
          <dd className="text-navy-950">
            {account?.email || plan?.email || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-navy-800/60">Plan tier</dt>
          <dd className="capitalize text-navy-950">
            {!accountLoaded
              ? "Loading…"
              : account?.planTier
                ? account.planTier.replaceAll("_", " ")
                : "Sign in to view"}
          </dd>
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
        {status === "authenticated" ? (
          <button
            type="button"
            onClick={() => void logOut()}
            className="rounded-full border border-sand-300 px-4 py-2 text-sm text-navy-950"
          >
            Log out on this device
          </button>
        ) : null}
      </div>
    </div>
  );
}
