import Link from "next/link";
import { TrustDisclaimer } from "@expat-atlas/ui";
import { GlobeHero } from "@/components/globe-hero";

const questions = [
  "Where do I actually fit?",
  "Can I afford the first year?",
  "What visa path is realistic?",
  "What should I do next?",
];

const corridors = [
  {
    code: "PH",
    name: "Philippines",
    href: "/countries/philippines",
    note: "Warm communities · lower COL · visa research required",
  },
  {
    code: "TH",
    name: "Thailand",
    href: "/countries/thailand",
    note: "Strong expat dens · healthcare access · verify stay rules",
  },
  {
    code: "MX",
    name: "Mexico",
    href: "/countries/mexico",
    note: "Near-US corridor · rent-first culture · source every claim",
  },
];

export default function HomePage() {
  return (
    <>
      {/* First viewport: brand + one line + CTAs + Earth */}
      <section className="relative min-h-[100svh] overflow-hidden bg-void text-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cool/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent-sand/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center gap-14 px-6 py-24 lg:flex-row lg:items-center lg:gap-20">
          <div className="max-w-xl flex-1">
            <p className="font-display text-5xl tracking-tight text-cream md:text-6xl lg:text-7xl">
              Elsewhere
            </p>
            <h1 className="mt-6 font-sans text-xl font-light leading-relaxed text-cream/80 md:text-2xl">
              One calm path from pressure to a real plan abroad.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/55">
              Structure, verified research avenues, and a next step — not another
              advice feed. Planning estimates only.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/app/onboarding"
                className="rounded-md bg-accent-sand px-6 py-3 text-sm font-medium text-[#12141a] transition hover:bg-accent-sand-hover"
              >
                Start Fit Quiz
              </Link>
              <Link
                href="/corridors"
                className="rounded-md border border-cream/20 px-6 py-3 text-sm font-medium text-cream/90 transition hover:border-cream/40 hover:bg-cream/5"
              >
                See corridors
              </Link>
            </div>
            <TrustDisclaimer className="mt-8 max-w-md text-cream/45" />
          </div>

          <div className="flex flex-1 flex-col items-center gap-8">
            <GlobeHero />
            <ul className="flex flex-wrap justify-center gap-2">
              {questions.map((q) => (
                <li
                  key={q}
                  className="rounded-md border border-cream/10 bg-void-elevated/80 px-3 py-1.5 text-xs text-cream/60"
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-cream/10 bg-void-elevated py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl text-cream md:text-4xl">
            Start with three corridors
          </h2>
          <p className="mt-3 max-w-xl text-sm text-cream/55">
            US → Philippines, Thailand, Mexico. Same cost-of-living band, large
            expat communities, published as data — not vibes.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {corridors.map((c) => (
              <Link
                key={c.code}
                href={c.href}
                className="group block border-b border-cream/10 pb-6 transition hover:border-accent-sand/40"
              >
                <p className="text-xs tracking-[0.2em] text-accent-cool">
                  {c.code}
                </p>
                <p className="mt-2 font-display text-2xl text-cream group-hover:text-accent-sand">
                  {c.name}
                </p>
                <p className="mt-2 text-sm text-cream/50">{c.note}</p>
              </Link>
            ))}
          </div>
          <Link
            href="/compare"
            className="mt-10 inline-block text-sm text-accent-cool hover:underline"
          >
            Compare countries →
          </Link>
        </div>
      </section>

      <section className="bg-void py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl text-cream md:text-4xl">
            Source-backed, not guru-based
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream/55">
            Official links, last-verified dates, confidence levels, and human
            review. We never say you qualify for a visa. We show the next step to
            research.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/trust"
              className="text-sm text-accent-cool hover:underline"
            >
              How we verify information →
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-cream/50 hover:text-cream/80"
            >
              Pricing →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-cream/10 bg-void-elevated py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="font-display text-4xl text-cream">Ready when you are</p>
          <p className="mx-auto mt-4 max-w-md text-sm text-cream/55">
            Take the Fit Quiz. Get a corridor hypothesis and a checklist — then
            verify before you act.
          </p>
          <Link
            href="/app/onboarding"
            className="mt-8 inline-block rounded-md bg-accent-sand px-6 py-3 text-sm font-medium text-[#12141a] transition hover:bg-accent-sand-hover"
          >
            Start Fit Quiz
          </Link>
        </div>
      </section>
    </>
  );
}
