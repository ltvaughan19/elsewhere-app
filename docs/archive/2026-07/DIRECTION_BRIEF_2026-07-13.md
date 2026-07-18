# Direction Brief — Expat Atlas × Elsewhere × GStack

**Date:** 2026-07-13  
**Mode:** Discovery → Office Hours (before Autoplan)  
**Author:** Cursor + browser QA + local/Grok artifact review

---

## What exists (3 surfaces)

| Surface | URL | Local path | Role |
|---------|-----|------------|------|
| **Elsewhere marketing** | https://elsewhere-mu.vercel.app | `C:\Users\brenden.vaughan\Elsewhere` | Cinematic 3D landing (Grok Builder + Spline Earth) |
| **Elsewhere app (quiz sample)** | https://elsewhere-app-theta.vercel.app | *Not on this PC* (Vercel-only; GitHub private/missing) | Fit quiz → path → checklist → vault |
| **Expat Atlas** | https://expat-atlas-web.vercel.app | `C:\Users\brenden.vaughan\expat-atlas` | Full OS monorepo + planning docs + tools |

**GitHub (public API):** only `ltvaughan19/expat-atlas` is public.  
**Elsewhere** remote exists (`github.com/ltvaughan19/Elsewhere`) but API returns 404 → **private repo**.  
**elsewhere-app** has **no public GitHub repo** found — source lives on Vercel deploy only (created ~Jul 9).

---

## Browser QA — Elsewhere marketing

**Verdict:** Strong emotional brand. This is the premium face.

- Hero: Spline Earth + floating anxious question tags → clarity on scroll
- Copy tone: warm, adult, “pressure to move,” not bro-nomad
- CTA: waitlist only (Phase 0 marketing)
- Stack: Vite + Spline + Three.js + GSAP + Lenis
- Constraint locked in `NOTES.md`: **do not break Spline Earth materials**
- Mobile: Earth-first, then fade in copy; glass navbar; docked question cycle

**Gaps:** No product behind CTA yet; waitlist is localStorage (+ optional webhook).

---

## Browser QA — Elsewhere app (quiz sample)

**Verdict:** Correct wedge shape. Calm UX. Single corridor. Keep this product logic.

Flow:
1. **Quiz** — calm multi-step (motive → income type → budget → timeline → household)
2. **Path** — recommends a research route (e.g. D7 for PT); labeled as map, not guarantee
3. **Checklist** + **Vault** — act layer
4. Corridor hardcoded: **US → Portugal**
5. Trust language is solid (“not legal advice,” pack last reviewed date)

**Gaps:** Source not on this machine; needs cloning into monorepo; no multi-country; no Expat Atlas tools wired in.

---

## Browser QA — Expat Atlas (live)

**Verdict:** Broader OS skeleton; weaker cinematic brand; production lagging local work.

Live now:
- Landing, countries, compare, visa compass, pricing, tools
- Trust/legal pages
- Signup still shows **“Coming in Phase 1” stub** on production (Phase 2 app shell exists locally but **unpushed**)

Local (unpushed) value:
- `/app/onboarding` readiness quiz (PH/TH/MX corridor)
- Dashboard, my-plan, budget, passport, saved, settings
- Education pages, partner form, CI workflow
- Planning docs: trust system, schema, roadmap, risk register

---

## Value to keep (merge map)

| Keep from Elsewhere marketing | Keep from Elsewhere app | Keep from Expat Atlas |
|------------------------------|-------------------------|------------------------|
| Brand name “Elsewhere” (or decide) | Fit quiz UX + calm copy | Monorepo + Next.js architecture |
| Spline Earth hero + question tags | Path recommendation pattern | Source verification system |
| Dark premium visual language | Checklist / vault skeleton | Compare, budget, passport tools |
| Waitlist CTA pattern | Single-corridor discipline | Types, Zod, Drizzle starter |
| Instrument Serif / Outfit feel | Trust disclaimers | Country seeds + visa cards |

---

## Core conflict (must resolve in Office Hours)

1. **Name:** Elsewhere vs Expat Atlas vs FarHome  
2. **First corridor:** US→Portugal (Elsewhere app) vs US→PH/TH/MX (Expat Atlas)  
3. **Architecture:** One repo vs two (marketing Vite + app Next)  
4. **Homepage:** Cinematic Elsewhere vs functional Expat Atlas OS landing  
5. **Scope:** Ship one corridor end-to-end vs multi-country OS first  

**GStack CEO HOLD SCOPE default recommendation (to stress-test):**

> **Brand:** Elsewhere (emotional)  
> **Product OS:** Expat Atlas architecture underneath  
> **Wedge:** Fit quiz → one corridor path → checklist (from elsewhere-app)  
> **Face:** Elsewhere cinematic landing as marketing site  
> **Corridor:** Pick **one** for 30 days (PT *or* PH — not both)  
> **Defer:** Multi-country depth, live Stripe, AI coach, fake partners  

---

## GStack suite — proposed sequence

1. **`office-hours`** — force name + corridor + wedge (this doc feeds it)  
2. **`plan-ceo-review`** — HOLD SCOPE: merge vs rebuild  
3. **`plan-design-review`** — port Elsewhere visual language into Next.js app shell  
4. **`plan-eng-review`** — monorepo layout: `apps/marketing` (Vite/Elsewhere) + `apps/web` (Next) *or* unify  
5. **`autoplan`** — execution plan for merge sprint  
6. **`qa`** — after first merged deploy  
7. **`ship`** — PR + release notes  

---

## Immediate blockers

1. Get **elsewhere-app source** onto this PC (Vercel pull needs approval, or clone if private GitHub exists)  
2. Push or discard **unpushed Expat Atlas Phase 2** local work  
3. User answers Office Hours questions below  

---

*Discovery complete. Ready for GStack Office Hours.*
