import Link from "next/link";
import { TrustDisclaimer } from "@expat-atlas/ui";
import { NewsletterForm } from "@/components/newsletter-form";

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
 * Product hub — operational entry after marketing `/`.
 * Auth and plan always stay on this same origin (one Supabase project).
 */
export default function StartPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:py-20">
      <p className="elsewhere-eyebrow">Elsewhere product</p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-cream md:text-5xl">
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
          className="rounded-md bg-accent-sand px-5 py-3 text-sm font-medium text-accent-ink shadow-ea transition hover:bg-accent-sand-hover"
        >
          Start Fit Quiz
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-sand-300 bg-void-card px-5 py-3 text-sm font-medium text-cream shadow-ea transition hover:bg-void-elevated"
        >
          Log in
        </Link>
        <Link
          href="/app/dashboard"
          className="rounded-md border border-sand-200 px-5 py-3 text-sm font-medium text-navy-800 transition hover:text-cream"
        >
          Dashboard
        </Link>
      </div>

      <TrustDisclaimer className="mt-6 max-w-xl" />

      <section className="mt-14">
        <h2 className="font-display text-2xl text-cream">What to do next</h2>
        <ul className="mt-6 overflow-hidden rounded-xl border border-sand-200 bg-void-card shadow-ea">
          {tools.map((tool, i) => (
            <li
              key={tool.href}
              className={i > 0 ? "border-t border-sand-200" : undefined}
            >
              <Link
                href={tool.href}
                className="elsewhere-row flex flex-col gap-1 px-5 py-4 md:flex-row md:items-baseline md:justify-between md:gap-8"
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

      <section className="mt-16 rounded-xl border border-sand-200 bg-void-card px-6 py-10 text-center shadow-ea">
        <h2 className="font-display text-2xl text-cream">Corridor Brief</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-navy-800">
          Rare free emails when sourced notes change. The full paid digest is
          included with Explorer — same account as the app.
        </p>
        <NewsletterForm source="product-hub" />
      </section>
    </div>
  );
}
