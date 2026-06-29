import Link from "next/link";
import { Badge, CountryCard, TrustDisclaimer } from "@expat-atlas/ui";
import { GlobeHero } from "@/components/globe-hero";
import { SEED_COUNTRIES } from "@/lib/seed-countries";

const painPoints = [
  "Visas are confusing",
  "Budgets are emotional",
  "Housing trust is hard",
  "Buying property abroad is risky",
  "Going alone is scary",
  "Official pages are scattered",
  "Family logistics are unclear",
  "Everyone online sounds confident",
];

const features = [
  "Readiness profile",
  "Country fit score",
  "Visa Compass",
  "Budget runway",
  "Passport checklist",
  "Housing strategy",
  "Property caution hub",
  "Insurance guide",
  "Community cohorts",
  "Official source ledger",
];

const journeySteps = [
  "Passport",
  "Budget",
  "Country fit",
  "Visa path",
  "Housing",
  "Insurance",
  "Community",
  "Departure",
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800 text-ivory-50">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-20 h-64 w-64 rounded-full bg-ocean-500/30 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-jungle-600/20 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center lg:py-32">
          <div>
            <Badge variant="official" className="mb-6">
              Expat transition operating system
            </Badge>
            <h1 className="font-display text-5xl leading-tight md:text-6xl">
              Your Life Abroad, Turned Into a Step-by-Step Plan
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ivory-50/80">
              Moving abroad should not require 200 browser tabs, outdated visa
              blogs, and blind faith. Expat Atlas helps you compare countries,
              plan your money, organize documents, and know what to do next.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-jungle-600 px-6 py-3 font-medium text-white transition hover:bg-jungle-500"
              >
                Build My Expat Plan
              </Link>
              <Link
                href="/compare"
                className="rounded-full border border-ivory-50/30 px-6 py-3 font-medium text-ivory-50 transition hover:bg-ivory-50/10"
              >
                Compare Countries
              </Link>
            </div>
            <TrustDisclaimer className="mt-6 max-w-xl text-ivory-50/60" />
          </div>
          <div className="space-y-6">
            <GlobeHero />
            <div className="rounded-2xl border border-ivory-50/10 bg-ivory-50/5 p-6 backdrop-blur-md">
              <p className="text-sm uppercase tracking-wide text-ocean-400">
                Your dashboard preview
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["Readiness Score", "62%"],
                  ["Best Fit", "Philippines"],
                  ["Savings Runway", "8.4 months"],
                  ["Next Step", "Start passport checklist"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-ivory-50/10 bg-navy-950/40 p-4"
                  >
                    <p className="text-xs text-ivory-50/60">{label}</p>
                    <p className="mt-1 font-medium">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-ivory-50/50">
                Planning estimates only · Verify before acting
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-4xl text-navy-950">
          The dream gets heavy fast
        </h2>
        <p className="mt-4 max-w-2xl text-navy-800/80">
          You start with a simple thought — then passport steps, visa rules,
          housing scams, and conflicting advice pile up.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {painPoints.map((point) => (
            <div
              key={point}
              className="rounded-xl border border-sand-200 bg-white p-5 text-sm text-navy-800 shadow-sm"
            >
              {point}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-sand-100 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-4xl text-navy-950">
            Expat Atlas turns chaos into a plan
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {features.map((feature) => (
              <div
                key={feature}
                className="rounded-xl border border-sand-200 bg-ivory-50 p-4 text-sm font-medium text-navy-900"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl text-navy-950">
              Compare places by real life fit
            </h2>
            <p className="mt-2 text-navy-800/70">
              Sample planning estimates — verify with official sources.
            </p>
          </div>
          <Link href="/countries" className="text-sm font-medium text-jungle-600">
            View all countries →
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SEED_COUNTRIES.slice(0, 6).map((country) => (
            <CountryCard key={country.slug} country={country} />
          ))}
        </div>
      </section>

      <section className="bg-navy-950 py-20 text-ivory-50">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-4xl">Your journey, step by step</h2>
          <div className="mt-10 flex flex-wrap gap-3">
            {journeySteps.map((step, i) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-full border border-ivory-50/15 px-4 py-2 text-sm"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-jungle-600 text-xs font-bold">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-4xl text-navy-950">
          Source-backed, not guru-based
        </h2>
        <p className="mt-4 max-w-2xl text-navy-800/80">
          Official links, last-verified dates, confidence levels, and human
          review workflows — not random advice.
        </p>
        <Link
          href="/trust"
          className="mt-6 inline-block text-sm font-medium text-jungle-600"
        >
          How we verify information →
        </Link>
      </section>

      <section className="bg-sand-100 py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="font-display text-4xl text-navy-950">
            Ready to build your plan?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-navy-800/80">
            You do not need to be rich, fearless, or already nomadic. Start
            with structure, realism, and a clear next step.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-jungle-600 px-6 py-3 font-medium text-white"
            >
              Build My Expat Plan
            </Link>
            <Link
              href="/passport-checklist"
              className="rounded-full border border-navy-800/20 px-6 py-3 font-medium text-navy-900"
            >
              Start Passport Checklist
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
