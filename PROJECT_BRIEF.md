# Expat Atlas — Project Brief

**Working name:** Expat Atlas (alt: FarHome)  
**Tagline:** Stop researching forever. Build a real plan to live abroad.  
**Phase:** 0 — Planning (no application code yet)

---

## What We Are Building

Expat Atlas is an **expat transition operating system** — not a travel blog. It guides first-time expats, long-stay travelers, and remote workers from overwhelm to a structured, source-backed relocation plan.

### North Star

> **“I’m actually going — and I know the one thing to do before Sunday.”**

Leaving is the metric. The product earns repeat use by giving each person one
trustworthy action for this week—not by maximizing quizzes completed, pages
read, or tools opened.

### User Journey

**From:** “I want to live abroad but I don’t know what’s legal, safe, realistic, or affordable.”

**To:** “I know my best country options, visa path, budget, housing strategy, risk level, next steps, and where I need official or professional help.”

### Primary Promise

**Your life abroad, turned into a step-by-step plan.**

### CTAs (priority order)

1. **Build My Expat Plan** (primary)
2. **Compare Countries** (secondary)
3. **Start Passport Checklist** (tertiary)

---

## Alternative Names (for future consideration)

Continue building as **Expat Atlas** unless renamed:

| Name | Rationale |
|------|-----------|
| **FarHome** | Emotional, warm; matches “home abroad” positioning |
| **Anchor Abroad** | Stability + relocation |
| **RelocateOS** | Emphasizes operating-system metaphor |
| **Borderline Plan** | Memorable; may sound edgy |
| **Abroad Blueprint** | Clear, SEO-friendly, less distinctive |

**Recommendation:** Keep **Expat Atlas** for clarity and SEO; use FarHome as internal codename if desired.

---

## Target Personas

1. **First Passport Dreamer** — never traveled; needs passport + courage path
2. **Isolated Life Rebuilder** — stuck, lonely, wants reset + lower COL
3. **Budget-Conscious Long-Stay Traveler** — months/years abroad; visa + rent realism
4. **Future Property Buyer** — education + due diligence, not transactions
5. **Family/Marriage Planner** — dependents, schools, marriage implications
6. **Remote Worker / Digital Nomad** — internet, visa legality, tax caution

---

## Core Problem (Hidden)

Users need **confidence, structure, risk reduction, official-source clarity, financial realism, human connection, next steps, and warnings** — not more scattered blogs.

Every page must answer: **“What do I do next?”**

---

## Product Principle

> Build the house now. Worry about furniture later.

- Build complete platform structure: landing, app shell, onboarding, dashboards, admin, source DB, country pages, visa modules, budget tools, housing, partners, sponsorship slots, mobile-ready architecture.
- Do **not** fake partners, sponsorships, attorneys, agents, or official approvals.
- Use placeholder/demo data only when clearly labeled.
- Every future partnership has a clean plug-in point.

---

## Business Model (architecture-ready, not live)

| Stream | Examples |
|--------|----------|
| User revenue | Free, Explorer, Builder subs; Serious Move one-time; concierge waitlist |
| Affiliate | Insurance, eSIM, VPN, flights, banking, gear |
| Partner | Sponsored cards, directory subs, qualified leads |
| Marketplace | Bookings, consultation intake, housing leads |
| Premium services | Human-assisted planning, cohorts, expert review (future) |

---

## Legal & Trust (non-negotiable)

**Never provide** legal, immigration, tax, insurance, medical, investment, or real estate advice as final authority.

**Always use:** general planning information, verify with official sources, consult licensed professionals, last checked dates, source confidence, sponsored/affiliate labels.

**Never use:** you qualify, guaranteed visa, approved, safe investment, best attorney (unless verified).

---

## Tech Stack (approved)

| Layer | Choice |
|-------|--------|
| Web | Next.js App Router, TypeScript, Tailwind, shadcn/ui |
| Motion | Framer Motion, Three.js/R3F (lazy), GSAP if needed |
| Maps | MapLibre or Mapbox |
| Charts | Recharts or Tremor |
| Forms | React Hook Form + Zod |
| Mobile | Expo in monorepo (or PWA-first, Expo Phase 6) |
| Backend | Supabase Postgres + Auth, Drizzle ORM, RLS |
| Payments | Stripe-ready abstraction (no live keys in MVP) |
| Analytics | PostHog |
| Testing | Playwright, Vitest, RTL |
| Deploy | Vercel (web), Supabase (DB), EAS later |

### Monorepo Layout

```
expat-atlas/
├── apps/web/
├── apps/mobile/          # Phase 6
├── packages/ui/
├── packages/db/
├── packages/types/
├── packages/validation/
├── packages/config/
└── packages/source-engine/
```

---

## MVP Scope by Phase

| Phase | Focus |
|-------|-------|
| 0 | Skills, planning docs (this phase) |
| 1 | Public authority site + cinematic landing |
| 2 | Auth, onboarding, dashboard, core tools |
| 3 | Source engine + admin |
| 4 | Partner/sponsor readiness |
| 5 | Community + reviews |
| 6 | Mobile shell |
| 7 | QA, a11y, deploy |

---

## Copy Tone

Calm, direct, human, trustworthy, motivating. Not hypey, guru-ish, or fearmongering.

**Use:** “Here is the safer next step.” / “This may be worth researching.” / “Verify before acting.” / “Rent first. Buy later.”

**Avoid:** “Escape the matrix,” fake luxury nomad tone, overpromising certainty.

---

## Success Criteria

| Stakeholder | Success looks like |
|-------------|-------------------|
| User | “I finally have a real path.” |
| Founder | “I can add partnerships without rebuilding.” |
| Business | Monetization via subs, affiliates, partners, leads — without sacrificing trust |
