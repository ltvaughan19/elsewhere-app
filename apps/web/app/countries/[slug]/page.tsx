import { notFound } from "next/navigation";
import { Badge, SourceClaimCard, TrustDisclaimer } from "@expat-atlas/ui";
import { ReportOutdatedForm } from "@/components/report-outdated-form";
import { claimsForCountry, LAUNCH_CORRIDORS } from "@/lib/seed-corridors";
import { SEED_COUNTRIES } from "@/lib/seed-countries";

export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const country = SEED_COUNTRIES.find((c) => c.slug === slug);
  if (!country) notFound();

  const claims = claimsForCountry(slug);
  const corridor = LAUNCH_CORRIDORS.find((c) => c.destinationSlug === slug);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-4xl">{country.flagEmoji}</p>
      <h1 className="mt-2 font-display text-4xl text-navy-950">{country.name}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="demo">Planning estimate</Badge>
        {corridor ? (
          <Badge variant="official">Launch corridor</Badge>
        ) : (
          <Badge variant="demo">Directory listing</Badge>
        )}
      </div>
      {corridor ? (
        <p className="mt-4 text-sm text-navy-800/70">{corridor.summary}</p>
      ) : null}
      <p className="mt-6 text-navy-800/80">
        Monthly cost estimate: {country.monthlyCostEstimate}. Visa complexity:{" "}
        {country.visaComplexity}.
      </p>

      {claims.length > 0 ? (
        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl text-navy-950">
            Source-backed notes
          </h2>
          <p className="text-sm text-navy-800/70">
            These claims show confidence and review state. Low confidence or
            “needs verification” means research further before acting.
          </p>
          {claims.map((claim) => (
            <SourceClaimCard key={claim.id} claim={claim} />
          ))}
        </section>
      ) : null}

      <TrustDisclaimer className="mt-8" />
      <ReportOutdatedForm countrySlug={slug} countryName={country.name} />
    </div>
  );
}
