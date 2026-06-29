import { notFound } from "next/navigation";
import { Badge, TrustDisclaimer } from "@expat-atlas/ui";
import { SEED_COUNTRIES } from "@/lib/seed-countries";

export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const country = SEED_COUNTRIES.find((c) => c.slug === slug);
  if (!country) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-4xl">{country.flagEmoji}</p>
      <h1 className="mt-2 font-display text-4xl text-navy-950">{country.name}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="demo">Planning estimate</Badge>
        <Badge variant="official">Needs verification</Badge>
      </div>
      <p className="mt-6 text-navy-800/80">
        Monthly cost estimate: {country.monthlyCostEstimate}. Visa complexity:{" "}
        {country.visaComplexity}. This page will connect to the source claims
        engine in Phase 3.
      </p>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
