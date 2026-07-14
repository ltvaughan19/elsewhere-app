import Link from "next/link";
import { TrustDisclaimer } from "@expat-atlas/ui";
import { WaitlistForm } from "@/components/waitlist-form";

const tools = [
  {
    href: "/app/onboarding",
    title: "Fit Quiz",
    body: "Answer a short readiness quiz and get a research path for PH, TH, or MX.",
    primary: true,
  },
  {
    href: "/app/dashboard",
    title: "Your plan",
    body: "Readiness score, next step, and saved corridors — once you’ve started.",
  },
  {
    href: "/compare",
    title: "Compare",
    body: "Side-by-side country notes for planning estimates.",
  },
  {
    href: "/visa-compass",
    title: "Visa Compass",
    body: "Research avenues with confidence labels — never “you qualify.”",
  },
  {
    href: "/corridors",
    title: "Corridors",
    body: "US → Philippines, Thailand, Mexico — the v1 published set.",
  },
  {
    href: "/passport-checklist",
    title: "Passport",
    body: "Checklist metadata only. No ID uploads in MVP.",
  },
];

/**
 * Product home — not the cinematic marketing landing (that’s elsewhere-mu).
 * Optimized for “what do I do next?” and future mobile shell.
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:py-20">
      <p className="elsewhere-eyebrow">Elsewhere product</p>
      <h1 className="mt-3 font-display text-4xl text-cream md:text-5xl">
        Your move plan
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-navy-800">
        Structure for relocating abroad: fit quiz, corridor path, budget and
        passport checklists, and source-backed research notes. Planning estimates
        only — verify before you act.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/app/onboarding"
          className="rounded-md bg-accent-sand px-5 py-3 text-sm font-medium text-accent-ink hover:bg-accent-sand-hover"
        >
          Start Fit Quiz
        </Link>
        <Link
          href="/app/dashboard"
          className="rounded-md border border-sand-300 px-5 py-3 text-sm font-medium text-cream hover:bg-void-elevated"
        >
          Open dashboard
        </Link>
      </div>

      <TrustDisclaimer className="mt-6 max-w-xl" />

      <section className="mt-14">
        <h2 className="font-display text-2xl text-cream">What to do next</h2>
        <ul className="mt-6 divide-y divide-sand-200 border-y border-sand-200">
          {tools.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="flex flex-col gap-1 py-5 transition hover:bg-void-elevated/80 md:flex-row md:items-baseline md:justify-between md:gap-8"
              >
                <span
                  className={
                    tool.primary
                      ? "text-base font-medium text-accent-sand"
                      : "text-base font-medium text-cream"
                  }
                >
                  {tool.title}
                </span>
                <span className="max-w-md text-sm leading-relaxed text-navy-800 md:text-right">
                  {tool.body}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 border-t border-sand-200 pt-12 text-center">
        <h2 className="font-display text-2xl text-cream">Early access</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-navy-800">
          Join the waitlist for corridor openings. Demo capture on-device until
          email is connected.
        </p>
        <WaitlistForm />
      </section>
    </div>
  );
}
