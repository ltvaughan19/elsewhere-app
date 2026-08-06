"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { UserPlan } from "@expat-atlas/types";
import { clearPlan, resolvePlan } from "@/lib/plan-store";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AccountSecurity } from "@/components/account-security";
import { useAuthSession } from "@/components/auth-session-provider";

interface AccountSummary {
  email: string;
  planTier: string | null;
  seriousMovePurchasedAt: string | null;
  hasStripeCustomer: boolean;
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
    .select("email,plan_tier,serious_move_purchased_at,stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  return {
    email: profileResult.data?.email ?? user.email ?? "",
    planTier: profileResult.data?.plan_tier ?? null,
    seriousMovePurchasedAt: profileResult.data?.serious_move_purchased_at ?? null,
    hasStripeCustomer: Boolean(profileResult.data?.stripe_customer_id),
  };
}

function BillingPortalCard({
  hasStripeCustomer,
}: {
  hasStripeCustomer: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!hasStripeCustomer) {
    return (
      <section className="mt-6 rounded-xl border border-sand-200 bg-white p-5 text-sm">
        <h2 className="font-display text-xl text-navy-950">Billing</h2>
        <p className="mt-2 text-navy-800/70">
          No Stripe customer on this account yet.{" "}
          <Link href="/pricing" className="text-jungle-600 underline">
            View pricing
          </Link>{" "}
          to start Explorer or Serious Move.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-sand-200 bg-white p-5 text-sm">
      <h2 className="font-display text-xl text-navy-950">Billing</h2>
      <p className="mt-2 text-navy-800/70">
        Manage payment method, invoices, or cancel Explorer in the Stripe customer portal.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setError("");
          setBusy(true);
          void fetch("/api/stripe/portal", { method: "POST" })
            .then(async (response) => {
              const payload = (await response.json()) as { url?: string; error?: string };
              if (!response.ok || !payload.url) {
                throw new Error(payload.error || "Could not open billing portal.");
              }
              window.location.assign(payload.url);
            })
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Portal failed.");
            })
            .finally(() => setBusy(false));
        }}
        className="mt-4 min-h-11 rounded-full bg-accent-sand px-5 font-medium text-accent-ink disabled:cursor-wait disabled:opacity-50"
      >
        {busy ? "Opening…" : "Manage billing"}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}

export function SettingsPageClient({ isStaff }: { isStaff: boolean }) {
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
          <dt className="text-navy-800/60">Subscription</dt>
          <dd className="capitalize text-navy-950">
            {!accountLoaded
              ? "Loading…"
              : account?.planTier
                ? account.planTier.replaceAll("_", " ")
                : "Sign in to view"}
          </dd>
        </div>
        <div>
          <dt className="text-navy-800/60">Serious Move</dt>
          <dd className="text-navy-950">
            {!accountLoaded
              ? "Loading…"
              : account?.seriousMovePurchasedAt
                ? `Purchased ${new Date(account.seriousMovePurchasedAt).toLocaleDateString()}`
                : "Not purchased"}
          </dd>
        </div>
        <div>
          <dt className="text-navy-800/60">Onboarding</dt>
          <dd className="text-navy-950">
            {plan?.onboardingCompleted ? "Complete" : "Not started"}
          </dd>
        </div>
      </dl>
      {status === "authenticated" ? (
        <BillingPortalCard hasStripeCustomer={Boolean(account?.hasStripeCustomer)} />
      ) : null}
      {status === "authenticated" ? <AccountSecurity isStaff={isStaff} /> : null}
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
