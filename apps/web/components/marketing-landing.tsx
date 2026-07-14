"use client";

import Link from "next/link";
import { EarthSplineLazy } from "@/components/earth-spline-lazy";
import { WaitlistForm } from "@/components/waitlist-form";
import "./marketing-landing.css";

const wins = [
  {
    title: "Cost of real life",
    body: "Rent, groceries, and breathing room that match your reality — not a highlight reel.",
  },
  {
    title: "Housing that exists",
    body: "What “affordable” actually looks like in cities people live in, with eyes open.",
  },
  {
    title: "Movement that works",
    body: "Flights, visas, and corridors that are reachable — the world as a network, not a maze.",
  },
  {
    title: "Daily life quality",
    body: "Walkable days, slower mornings, a table where work and life can coexist.",
  },
];

const clarity = [
  { line: "Your situation → a clear corridor", tag: "Path" },
  { line: "Steps, docs, and timing in order", tag: "Plan" },
  { line: "Opportunities surfaced, not dumped", tag: "Signal" },
];

/**
 * Cinematic marketing surface — forced dark brand night.
 * Product OS lives under /app and /start. Auth always completes on this same origin.
 */
export function MarketingLanding() {
  return (
    <div className="marketing-root">
      <div className="marketing-earth" aria-hidden>
        <EarthSplineLazy className="marketing-earth-inner" fill />
      </div>
      <div className="marketing-veil" aria-hidden />

      <header className="marketing-header">
        <a className="marketing-logo" href="#top">
          Elsewhere
        </a>
        <nav className="marketing-nav" aria-label="Primary">
          <a href="#shift">The shift</a>
          <a href="#wins">Why move</a>
          <Link href="/login">Log in</Link>
          <Link className="marketing-nav-cta" href="/app/onboarding">
            Start Fit Quiz
          </Link>
        </nav>
      </header>

      <main id="top">
        <section className="marketing-panel marketing-hero" id="hero">
          <div className="marketing-copy">
            <p className="marketing-eyebrow">For people ready to leave — not tour</p>
            <h1>
              The world is closer than it feels.
              <br />
              <em>You need one calm path.</em>
            </h1>
            <p className="marketing-lede">
              When pressure says “go,” research multiplies into forty tabs.
              Elsewhere is the quiet center: structure, verified avenues, and room
              to breathe.
            </p>
            <div className="marketing-actions">
              <a className="marketing-btn primary" href="#begin">
                Join the waitlist
              </a>
              <Link className="marketing-btn ghost" href="/app/onboarding">
                Start Fit Quiz
              </Link>
              <Link className="marketing-btn ghost" href="/start">
                Open the app
              </Link>
            </div>
            <p className="marketing-fine">
              Planning estimates only — not legal or immigration advice. Log in and
              your plan live on this same site (one account, one Supabase project).
            </p>
          </div>
        </section>

        <section className="marketing-panel" id="shift">
          <div className="marketing-copy left">
            <p className="marketing-eyebrow">The shift</p>
            <h2>That feeling isn’t restlessness. It’s readiness.</h2>
            <p>
              Burned out. Priced out. Or simply done waiting for “someday.” You’re
              not chasing a fantasy vacation — you’re looking for a life that fits.
              The hard part is not possibility. It’s finding a clear way through
              the noise.
            </p>
          </div>
        </section>

        <section className="marketing-panel" id="wins">
          <div className="marketing-copy right wide">
            <p className="marketing-eyebrow">Real wins</p>
            <h2>Practical advantages. Human relief.</h2>
            <p>
              Moving abroad isn’t about collecting stamps. It’s about the math of
              daily life — and the feeling that the world is open again.
            </p>
            <div className="marketing-wins">
              {wins.map((w) => (
                <article key={w.title}>
                  <h3>{w.title}</h3>
                  <p>{w.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-panel" id="problem">
          <div className="marketing-copy left">
            <p className="marketing-eyebrow">The problem</p>
            <h2>Forty tabs. Contradicting forums. No one sequence.</h2>
            <p>
              Official sites bury the point. Reddit argues with itself. Consultants
              sell urgency. You educate yourself harder — and feel less sure. The
              cost isn’t only time. It’s the quiet fear that you’ll choose wrong,
              or never choose at all.
            </p>
          </div>
        </section>

        <section className="marketing-panel" id="solution">
          <div className="marketing-copy right">
            <p className="marketing-eyebrow">The solution</p>
            <h2>One calm path. Real opportunities, when you’re ready.</h2>
            <p>
              Elsewhere is not a travel agent. It’s the quiet manager for people
              under pressure to move: structure, verified pathways, honest costs,
              and — when the time comes — housing leads and community without the
              circus.
            </p>
            <ul className="marketing-clarity">
              {clarity.map((c) => (
                <li key={c.tag}>
                  <span>{c.line}</span>
                  <span className="tag">{c.tag}</span>
                </li>
              ))}
            </ul>
            <p className="marketing-fine">
              Guidance and organization — not legal advice. You stay in control.
            </p>
          </div>
        </section>

        <section className="marketing-panel marketing-finale" id="begin">
          <div className="marketing-copy center">
            <p className="marketing-eyebrow">Start your path</p>
            <h2>
              Be first when Elsewhere opens.
              <br />
              <em>Calmly.</em>
            </h2>
            <p>
              Join the waitlist, or start the Fit Quiz now on the same site you’ll
              use after you log in.
            </p>
            <div className="marketing-actions center">
              <Link className="marketing-btn primary" href="/app/onboarding">
                Start Fit Quiz
              </Link>
              <Link className="marketing-btn ghost" href="/login">
                Log in
              </Link>
            </div>
            <WaitlistForm />
            <p className="marketing-footnote">
              Elsewhere — warm, adult, quietly ambitious. For the move that matters.
            </p>
          </div>
        </section>
      </main>

      <footer className="marketing-footer">
        <span>© {new Date().getFullYear()} Elsewhere</span>
        <span>Not legal advice · Guidance &amp; structure</span>
        <nav>
          <Link href="/trust">Trust</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/start">App</Link>
        </nav>
      </footer>
    </div>
  );
}
