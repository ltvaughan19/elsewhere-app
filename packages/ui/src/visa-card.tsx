import type { VisaCardData } from "@expat-atlas/types";
import { Badge } from "./badge";
import { cn } from "./utils";

const riskVariant = {
  low: "success" as const,
  medium: "demo" as const,
  high: "risk" as const,
};

export function VisaCard({
  visa,
  className,
}: {
  visa: VisaCardData;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border border-sand-200 bg-void-card p-6 shadow-ea",
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm text-navy-800">
            {visa.flagEmoji} {visa.countryName}
          </p>
          <h3 className="font-display text-xl text-navy-950">{visa.name}</h3>
          <p className="text-xs text-navy-800">{visa.category}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="demo">Needs verification</Badge>
          <Badge variant={riskVariant[visa.riskLevel]}>
            {visa.riskLevel} risk
          </Badge>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-navy-800">{visa.overview}</p>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-navy-800">Typical stay</dt>
          <dd className="text-navy-950">{visa.typicalStay}</dd>
        </div>
        <div>
          <dt className="text-navy-800">Estimated fees</dt>
          <dd className="text-navy-950">{visa.estimatedFees}</dd>
        </div>
        {visa.sourceName ? (
          <div>
            <dt className="text-navy-800">Source</dt>
            <dd className="text-navy-950">{visa.sourceName}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-4 text-xs text-navy-800">
        Based on your profile, this may be worth researching — not a qualification
        determination.
      </p>
    </article>
  );
}
