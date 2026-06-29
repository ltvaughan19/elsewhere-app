import Link from "next/link";
import type { PricingTier } from "@expat-atlas/types";
import { Badge, cn } from "@expat-atlas/ui";

export function PricingGrid({ tiers }: { tiers: PricingTier[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tiers.map((tier) => (
        <article
          key={tier.id}
          className={cn(
            "flex flex-col rounded-2xl border p-6",
            tier.highlighted
              ? "border-jungle-600 bg-navy-950 text-ivory-50 shadow-lg"
              : "border-sand-200 bg-white text-navy-950 shadow-sm",
          )}
        >
          {tier.highlighted ? (
            <Badge variant="success" className="mb-3 w-fit">
              Most popular
            </Badge>
          ) : null}
          <h3 className="font-display text-2xl">{tier.name}</h3>
          <p
            className={cn(
              "mt-1 text-sm",
              tier.highlighted ? "text-ivory-50/70" : "text-navy-800/70",
            )}
          >
            {tier.description}
          </p>
          <p className="mt-4 text-3xl font-semibold">
            {tier.price}
            {tier.period ? (
              <span className="text-base font-normal opacity-70">
                {" "}
                {tier.period}
              </span>
            ) : null}
          </p>
          <ul
            className={cn(
              "mt-6 flex-1 space-y-2 text-sm",
              tier.highlighted ? "text-ivory-50/90" : "text-navy-800/80",
            )}
          >
            {tier.features.map((f) => (
              <li key={f} className="flex gap-2">
                <span aria-hidden>✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href={tier.id === "concierge" ? "/signup" : "/signup"}
            className={cn(
              "mt-6 block rounded-full px-4 py-2.5 text-center text-sm font-medium transition",
              tier.highlighted
                ? "bg-jungle-600 text-white hover:bg-jungle-500"
                : "bg-sand-100 text-navy-950 hover:bg-sand-200",
            )}
          >
            {tier.cta}
          </Link>
        </article>
      ))}
    </div>
  );
}
