"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import "@/components/marketing/elsewhere-mu.css";

/**
 * Exact behavioral port of elsewhere-mu (Vite): Spline Earth camera scrub,
 * floating question tags, Lenis + GSAP panels. Same DOM/CSS class names.
 */
export function MarketingLanding() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("elsewhere-mu-active");
    // Lock dark marketing look — ThemeProvider must not flip to light on `/`.
    html.setAttribute("data-theme", "dark");
    body.style.background = "#07090d";
    // Drop product surface glow so it cannot wash transparent WebGL pixels.
    body.classList.remove("elsewhere-surface");

    let cancelled = false;
    let handle: { destroy: () => void } | null = null;

    void (async () => {
      const { bootMarketingExperience } = await import("@/lib/marketing/bootMarketing");
      if (cancelled || !rootRef.current) return;
      const next = await bootMarketingExperience(rootRef.current);
      // Strict Mode: effect may clean up while Spline is still loading.
      // Always destroy orphaned boots so we never stack two Applications
      // (double glare softens / fights over the canvas = lighting mismatch).
      if (cancelled) {
        next.destroy();
        return;
      }
      handle = next;
    })();

    // Re-assert dark if ThemeProvider applies a stored/system light theme.
    const lockDark = () => {
      if (!html.classList.contains("elsewhere-mu-active")) return;
      if (html.getAttribute("data-theme") !== "dark") {
        html.setAttribute("data-theme", "dark");
      }
      body.style.background = "#07090d";
      body.classList.remove("elsewhere-surface");
    };
    const themeObserver = new MutationObserver(lockDark);
    themeObserver.observe(html, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => {
      cancelled = true;
      themeObserver.disconnect();
      handle?.destroy();
      html.classList.remove("elsewhere-mu-active");
      body.style.background = "";
      body.classList.add("elsewhere-surface");
      html.classList.remove("lenis", "lenis-smooth", "lenis-scrolling", "lenis-stopped");
    };
  }, []);

  return (
    <div ref={rootRef} className="elsewhere-mu-root">
      <div id="loader" className="loader" aria-live="polite">
        <div className="loader-mark">Elsewhere</div>
        <div className="loader-bar">
          <span />
        </div>
        <p className="loader-copy">Loading…</p>
      </div>

      <canvas id="webgl" aria-hidden="true" />
      <canvas id="arcs" aria-hidden="true" />

      <div id="question-tags" className="question-tags" aria-hidden="true" />

      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <header className="site-header">
        <a className="logo" href="#top">
          Elsewhere
        </a>
        <nav className="nav" aria-label="Primary">
          <a href="#shift">The shift</a>
          <a href="#wins">Why move</a>
          <Link href="/login">Log in</Link>
          <Link className="nav-cta" href="/app/onboarding">
            Start Fit Quiz
          </Link>
        </nav>
      </header>
      <div className="nav-threshold" id="nav-threshold" aria-hidden="true" />

      <div className="progress-rail" aria-hidden="true">
        <div className="progress-fill" id="progress-fill" />
      </div>

      <main id="top">
        <section className="panel hero" id="hero">
          <div className="panel-inner hero-copy">
            <p className="eyebrow">For people ready to leave — not tour</p>
            <h1>
              The world is closer than it feels.
              <br />
              <em>You need one calm path.</em>
            </h1>
            <p className="lede">
              When pressure says “go,” research multiplies into forty tabs.
              Elsewhere is the quiet center: structure, verified avenues, and room
              to breathe.
            </p>
            <div className="hero-actions">
              <Link className="btn primary" href="/app/onboarding">
                Start Fit Quiz
              </Link>
              <a className="btn ghost" href="#shift">
                See how it works
              </a>
            </div>
            <div className="scroll-hint">
              <span className="scroll-hint-line" />
              <span>Scroll</span>
            </div>
          </div>
        </section>

        <section className="panel" id="shift">
          <div className="panel-inner left">
            <p className="eyebrow">The shift</p>
            <h2>That feeling isn’t restlessness. It’s readiness.</h2>
            <p className="body">
              Burned out. Priced out. Or simply done waiting for “someday.” You’re
              not chasing a fantasy vacation — you’re looking for a life that
              fits. The planet is more connected than any generation before us.
              The hard part is not possibility. It’s finding a clear way through
              the noise.
            </p>
          </div>
        </section>

        <section className="panel" id="wins">
          <div className="panel-inner right wide">
            <p className="eyebrow">Real wins</p>
            <h2>Practical advantages. Human relief.</h2>
            <p className="body intro-body">
              Moving abroad isn’t about collecting stamps. It’s about the math of
              daily life — and the feeling that the world is open again.
            </p>
            <div className="wins-grid">
              <article className="win-card">
                <h3>Cost of real life</h3>
                <p>
                  Rent, groceries, and breathing room that match your reality —
                  not a highlight reel.
                </p>
              </article>
              <article className="win-card">
                <h3>Housing that exists</h3>
                <p>
                  What “affordable” actually looks like in cities people live in,
                  with eyes open.
                </p>
              </article>
              <article className="win-card">
                <h3>Movement that works</h3>
                <p>
                  Flights, visas, and corridors that are reachable — the world as
                  a network, not a maze.
                </p>
              </article>
              <article className="win-card">
                <h3>Daily life quality</h3>
                <p>
                  Walkable days, slower mornings, a table where work and life can
                  coexist.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="panel" id="problem">
          <div className="panel-inner left">
            <p className="eyebrow">The problem</p>
            <h2>Forty tabs. Contradicting forums. No one sequence.</h2>
            <p className="body">
              Official sites bury the point. Reddit argues with itself. Consultants
              sell urgency. You educate yourself harder — and feel less sure. The
              cost isn’t only time. It’s the quiet fear that you’ll choose wrong,
              or never choose at all.
            </p>
          </div>
        </section>

        <section className="panel" id="solution">
          <div className="panel-inner right">
            <p className="eyebrow">The solution</p>
            <h2>One calm path. Real opportunities, when you’re ready.</h2>
            <p className="body">
              Elsewhere is not a travel agent. It’s the quiet manager for people
              under pressure to move: a single place for structure, verified
              pathways, honest costs, and — when the time comes — housing leads,
              practical hacks, and community without the circus.
            </p>
            <ul className="clarity-list">
              <li>
                <span>Your situation → a clear corridor</span>
                <span className="tag">Path</span>
              </li>
              <li>
                <span>Steps, docs, and timing in order</span>
                <span className="tag">Plan</span>
              </li>
              <li>
                <span>Opportunities surfaced, not dumped</span>
                <span className="tag">Signal</span>
              </li>
            </ul>
            <p className="fineprint">
              Guidance and organization — not legal advice. You stay in control.
            </p>
            <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
              <Link className="btn primary" href="/app/onboarding">
                Start Fit Quiz
              </Link>
              <Link className="btn ghost" href="/start">
                Open the app
              </Link>
            </div>
          </div>
        </section>

        <section className="panel finale" id="begin">
          <div className="panel-inner center">
            <p className="eyebrow">Begin</p>
            <h2>
              Start with clarity.
              <br />
              <em>Not a countdown.</em>
            </h2>
            <p className="body">
              Run the Fit Quiz and get a research path for Philippines, Thailand,
              or Mexico. Planning estimates only — you verify before you act.
            </p>
            <div className="hero-actions" style={{ marginBottom: "2rem" }}>
              <Link className="btn primary" href="/app/onboarding">
                Start Fit Quiz
              </Link>
              <Link className="btn ghost" href="/pricing">
                See Explorer
              </Link>
            </div>

            <p className="eyebrow">Corridor Brief</p>
            <h2>
              Stay informed without the noise.
              <br />
              <em>Rarely.</em>
            </h2>
            <p className="body">
              Opt in for a free brief when sourced corridor notes actually change.
              The full paid digest ships with Explorer — same account, no second
              Substack bill.
            </p>

            <form className="waitlist" id="newsletter" noValidate>
              <label className="sr-only" htmlFor="email">
                Email
              </label>
              <div className="waitlist-row">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  required
                />
                <button type="submit" className="btn primary">
                  Get the Brief
                </button>
              </div>
              <p className="waitlist-note" id="newsletter-note">
                Unsubscribe anytime. Not legal advice — research signals only.
              </p>
            </form>

            <p className="footnote">
              Elsewhere — warm, adult, quietly ambitious. For the move that
              matters.
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>
          © <span id="year" /> Elsewhere
        </span>
        <span className="footer-tag">Not legal advice · Guidance &amp; structure</span>
      </footer>
    </div>
  );
}
