import Link from "next/link";
import { PricingGrid } from "@/components/pricing-grid";
import { PRICING_TIERS } from "@/lib/pricing-tiers";
import { TrustDisclaimer } from "@expat-atlas/ui";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl text-navy-950">Pricing</h1>
      <p className="mt-4 max-w-2xl text-navy-800/80">
        Start free with the Fit Quiz. Upgrade to Explorer for the full Corridor
        Digest and deeper planning tools. Checkout is not live yet — create an
        account so you’re ready when it opens.
      </p>
      <div className="mt-10">
        <PricingGrid tiers={PRICING_TIERS} />
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
