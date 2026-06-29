import { TrustDisclaimer, VisaCard } from "@expat-atlas/ui";
import { SEED_VISAS } from "@/lib/seed-visas";

export default function VisaCompassPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl text-navy-950">Visa Compass</h1>
      <p className="mt-4 max-w-2xl text-navy-800/80">
        Research visa paths with plain-English overviews. We never tell you that
        you qualify — only what may be worth researching for your situation.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {SEED_VISAS.map((visa) => (
          <VisaCard key={visa.id} visa={visa} />
        ))}
      </div>
      <TrustDisclaimer className="mt-10" />
    </div>
  );
}
