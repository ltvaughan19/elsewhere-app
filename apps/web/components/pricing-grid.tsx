"use client";

import Link from "next/link";
import { useState } from "react";
import type { PricingTier } from "@expat-atlas/types";
import { Badge, cn } from "@expat-atlas/ui";
import { useAuthSession } from "@/components/auth-session-provider";

async function startCheckout(product: "explorer" | "serious_move"): Promise<void> {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product }),
  });
  const payload = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || "Checkout could not start.");
  }
  window.location.assign(payload.url);
}

function TierCta({ tier }: { tier: PricingTier }) {
  const { status } = useAuthSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (tier.comingLater) {
    return (
      <span
        className={cn(
          "mt-6 block rounded-full px-4 py-2.5 text-center text-sm font-medium opacity-60",
          tier.highlighted ? "bg-white/10 text-ivory-50" : "bg-sand-100 text-navy-800",
        )}
      >
        {tier.cta}
      </span>
    );
  }

  if (tier.id === "free") {
    return (
      <Link
        href="/signup"
        className={cn(
          "mt-6 block rounded-full px-4 py-2.5 text-center text-sm font-medium transition",
          "bg-sand-100 text-navy-950 hover:bg-sand-200",
        )}
      >
        {tier.cta}
      </Link>
    );
  }

  if (tier.id !== "explorer" && tier.id !== "serious_move") {
    return null;
  }

  const product = tier.id;
  const loginHref = `/login?next=${encodeURIComponent("/pricing")}`;

  if (status !== "authenticated") {
    return (
      <Link
        href={loginHref}
        className={cn(
          "mt-6 block rounded-full px-4 py-2.5 text-center text-sm font-medium transition",
          tier.highlighted
            ? "bg-jungle-600 text-white hover:bg-jungle-500"
            : "bg-sand-100 text-navy-950 hover:bg-sand-200",
        )}
      >
        Sign in to {tier.cta.toLowerCase()}
      </Link>
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setError("");
          setBusy(true);
          void startCheckout(product)
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Checkout failed.");
            })
            .finally(() => setBusy(false));
        }}
        className={cn(
          "block w-full rounded-full px-4 py-2.5 text-center text-sm font-medium transition disabled:cursor-wait disabled:opacity-60",
          tier.highlighted
            ? "bg-jungle-600 text-white hover:bg-jungle-500"
            : "bg-sand-100 text-navy-950 hover:bg-sand-200",
        )}
      >
        {busy ? "Redirecting…" : tier.cta}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TierCard({ tier, muted }: { tier: PricingTier; muted?: boolean }) {
  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border p-6",
        muted
          ? "border-sand-200/70 bg-sand-50/50 text-navy-800/70"
          : tier.highlighted
            ? "border-jungle-600 bg-navy-950 text-ivory-50 shadow-lg"
            : "border-sand-200 bg-white text-navy-950 shadow-sm",
      )}
    >
      {tier.highlighted && !muted ? (
        <Badge variant="success" className="mb-3 w-fit">
          Most popular
        </Badge>
      ) : null}
      <h3 className="font-display text-2xl">{tier.name}</h3>
      <p
        className={cn(
          "mt-1 text-sm",
          muted
            ? "text-navy-800/50"
            : tier.highlighted
              ? "text-ivory-50/70"
              : "text-navy-800/70",
        )}
      >
        {tier.description}
      </p>
      <p className="mt-4 text-3xl font-semibold">
        {tier.price}
        {tier.period ? (
          <span className="text-base font-normal opacity-70"> {tier.period}</span>
        ) : null}
      </p>
      <ul
        className={cn(
          "mt-6 flex-1 space-y-2 text-sm",
          muted
            ? "text-navy-800/50"
            : tier.highlighted
              ? "text-ivory-50/90"
              : "text-navy-800/80",
        )}
      >
        {tier.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span aria-hidden>✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <TierCta tier={tier} />
    </article>
  );
}

export function PricingGrid({
  tiers,
  laterTiers = [],
}: {
  tiers: PricingTier[];
  laterTiers?: PricingTier[];
}) {
  return (
    <div className="space-y-10">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <TierCard key={tier.id} tier={tier} />
        ))}
      </div>
      {laterTiers.length > 0 ? (
        <div>
          <p className="mb-4 text-sm font-medium text-navy-800/60">Coming later</p>
          <div className="grid gap-6 md:grid-cols-2">
            {laterTiers.map((tier) => (
              <TierCard key={tier.id} tier={tier} muted />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
