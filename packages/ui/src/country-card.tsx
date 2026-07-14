import type { CountryCardData } from "@expat-atlas/types";
import { Badge } from "./badge";
import { ScoreBar } from "./score-bar";
import { cn } from "./utils";

export function CountryCard({
  country,
  className,
}: {
  country: CountryCardData;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group rounded-xl border border-sand-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl">{country.flagEmoji}</p>
          <h3 className="font-display text-xl text-navy-950">{country.name}</h3>
          <p className="text-sm text-navy-800">
            {country.monthlyCostEstimate} / mo · Visa: {country.visaComplexity}
          </p>
        </div>
        {country.demoData ? <Badge variant="demo">Planning estimate</Badge> : null}
      </div>
      <div className="space-y-2">
        <ScoreBar label="Nature" value={country.natureScore} />
        <ScoreBar label="Social" value={country.socialScore} />
        <ScoreBar label="Healthcare" value={country.healthcareScore} />
        <ScoreBar label="Internet" value={country.internetScore} />
      </div>
      <p className="mt-4 text-xs text-navy-800">
        Property: {country.propertyComplexity} · Long-stay:{" "}
        {country.longStayPotential}
      </p>
    </article>
  );
}
