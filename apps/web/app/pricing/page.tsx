import Link from "next/link";
import { PricingGrid } from "@/components/pricing-grid";
import { PRICING_TIERS } from "@/lib/pricing-tiers";
import { TrustDisclaimer } from "@expat-atlas/ui";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl text-navy-950">Pricing</h1>
      <p className="mt-4 max-w-2xl text-navy-800/80">
        Start free. Upgrade when you are ready to build a real plan. Checkout is
        not live yet — sign up to get notified when subscriptions launch.
      </p>
      <div className="mt-10">
        <PricingGrid tiers={PRICING_TIERS} />
      </div>
      <p className="mt-8 text-center text-sm text-navy-800/70">
        Concierge and partner-assisted planning are waitlist-only at launch.{" "}
        <Link href="/signup" className="text-jungle-600 underline">
          Join the waitlist
        </Link>
      </p>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
