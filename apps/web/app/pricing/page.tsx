import Link from "next/link";
import { PricingGrid } from "@/components/pricing-grid";
import {
  LATER_PRICING_TIERS,
  PRIMARY_PRICING_TIERS,
} from "@/lib/pricing-tiers";
import { TrustDisclaimer } from "@expat-atlas/ui";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl text-navy-950">Pricing</h1>
      <p className="mt-4 max-w-2xl text-navy-800/80">
        Free keeps the Sunday Action un-gated. Explorer adds continuity and depth
        for the Philippines proof corridor. Serious Move is a one-time 30/60/90
        pack that stacks with Free or Explorer.
      </p>
      <div className="mt-10">
        <PricingGrid tiers={PRIMARY_PRICING_TIERS} laterTiers={LATER_PRICING_TIERS} />
      </div>
      <p className="mt-8 text-center text-sm text-navy-800/70">
        Prefer the free research signal first?{" "}
        <Link href="/#begin" className="text-jungle-600 underline">
          Get the Corridor Brief
        </Link>
        {" · "}
        <Link href="/signup" className="text-jungle-600 underline">
          Create an account
        </Link>
      </p>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
