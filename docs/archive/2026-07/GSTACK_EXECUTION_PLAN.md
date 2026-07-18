# GStack Execution Plan — Expat Atlas

**Date:** 2026-06-29  
**Mode:** Office Hours → Autoplan (CEO HOLD SCOPE + Eng + Design) → Execute  
**Branch:** `main`  
**Current state:** Phase 1 scaffold live; build passes

---

## 1. Office Hours — Six Forcing Questions

### Q1: Who desperately needs this?
First-time expats and long-stay planners who have **never structured a move** — passport dreamers, isolated rebuilders, budget nomads. Not experienced nomads with a Notion system.

### Q2: What do they do today (status quo)?
200 browser tabs, Facebook groups, conflicting visa blogs, spreadsheet budgets, fear-driven procrastination. They **research forever** and never depart.

### Q3: What is the narrowest wedge?
**"Build My Expat Plan"** — readiness quiz → country fit → next 30 days → passport + budget runway. One corridor first: **U.S. citizen → Philippines / Thailand / Mexico**.

### Q4: What observation proves demand?
Search volume for "move to Philippines," "digital nomad visa," "cost of living abroad" + emotional posts about loneliness and paralysis. Users pay for **structure**, not more articles.

### Q5: Why now / why you?
AI makes content cheap; **trust is the bottleneck**. Official-source ledger + no fake partners is differentiated in a scam-heavy niche.

### Q6: 10-year fit?
Platform for verified relocation ecosystem: plans, partners, leads, subscriptions. Starts as planning OS, becomes **infrastructure for ethical expat services**.

**Office Hours verdict:** ✅ Worth building. Wedge = planning OS with trust layer, not content farm.

---

## 2. CEO Review — HOLD SCOPE (stress test)

| Challenge | Finding | Decision |
|-----------|---------|----------|
| Scope too big? | Original spec is 18-month product | **HOLD** — keep phases; ship Phase 1–2 before community/marketplace |
| Fake trust risk? | #1 company killer | **Non-negotiable:** demo labels, needs_review, no verified partners |
| Monetize too early? | Stripe before value | **Defer live payments**; pricing page = metadata only |
| AI Coach liability? | Hallucinated visa advice | **Rules-based until RAG + claims** |
| Philippines-first? | Focus beats breadth | **Yes** — seed content depth for PH, TH, MX first |
| Mobile now? | Split focus | **PWA-responsive first**; Expo Phase 6 |
| Property/housing transactions? | Legal exposure | **Education + intake only** until licensed partners |
| Community safety? | Harassment risk | **Waitlists + moderated cohorts**; no stranger matching |

**CEO stress-test failures caught:**
1. Missing **Privacy Policy / Terms** → add before public deploy
2. Missing **SEO** (sitemap, meta, structured data) → add in Phase 1
3. Missing **analytics funnel** → PostHog event plan + stub provider
4. No **CI** → GitHub Actions or Vercel-only build check
5. **Document vault** temptation → explicitly blocked in MVP

**Verdict:** Scope is correct if we **ruthlessly phase**. Do not build Phase 4–5 UI depth before Phase 3 source engine.

---

## 3. Eng Review — Locked Architecture

```mermaid
flowchart TB
  subgraph phase1 [Phase 1 — Now]
    Web[apps/web]
    UI[packages/ui]
    Types[packages/types]
    Val[packages/validation]
    DB[packages/db — Drizzle schema]
    SE[packages/source-engine — badges + adapters]
  end

  subgraph phase2 [Phase 2 — Next]
    Auth[Supabase Auth]
    App[/app/* shell]
  end

  Web --> UI
  Web --> Types
  Web --> Val
  Web --> DB
  Web --> SE
  App --> Auth
  App --> DB
```

### Eng decisions (locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ORM | Drizzle | Type-safe, portable Postgres |
| Auth timing | Phase 2 | Public tools work without login |
| Country data Phase 1 | TS seed modules | DB seed in Phase 2 with Supabase |
| 3D globe | Dynamic import + static fallback | CWV protection |
| Forms | Server Actions Phase 2 | Client calculators OK Phase 1 |
| Monorepo | pnpm + Turbo | Already scaffolded |
| RLS | Phase 2 with Supabase | |

### Edge cases to test
- User with $0 savings → budget shows "not ready" not crash
- Country slug not found → 404
- Report outdated info without auth → queue with email optional
- `prefers-reduced-motion` → no parallax/3D

---

## 4. Design Review — Scores & Fixes

| Dimension | Score | Gap | Fix |
|-----------|-------|-----|-----|
| Trust visual language | 6/10 | Badges exist but sparse | More disclaimers on tools |
| Editorial typography | 7/10 | Fonts loaded | Hero needs more breathing room |
| Cinematic landing | 4/10 | No globe, no scroll journey | Add globe + journey section |
| Dashboard preview | 7/10 | Static cards | Animate on scroll (subtle) |
| Mobile | 6/10 | Responsive grid | Test 375px nav |
| Differentiation | 5/10 | Could be travel blog | Emphasize "operating system" + source ledger |
| Conversion path | 7/10 | CTAs clear | Add sticky mobile CTA |

**Design verdict:** Functional shell; **globe + journey timeline + working calculators** unlock premium feel.

---

## 5. What You Left Out (gap analysis)

| Gap | Priority | Phase |
|-----|----------|-------|
| Privacy Policy + Terms | P0 | 1 |
| `robots.txt` + `sitemap.xml` | P0 | 1 |
| PostHog event taxonomy | P1 | 1 |
| Playwright smoke tests | P1 | 1 |
| `packages/db` Drizzle schema | P1 | 1 |
| `packages/source-engine` | P1 | 1 |
| Functional budget calculator | P0 | 1 |
| Functional passport checklist | P0 | 1 |
| Compare countries (2–3 picker) | P1 | 1 |
| Visa compass seed cards | P1 | 1 |
| About page | P2 | 1 |
| Housing/property/insurance stubs | P2 | 1 |
| Blog/SEO content hub | P2 | 3 |
| Email capture / waitlist API | P1 | 2 |
| Error boundaries + 404 polish | P2 | 1 |
| OG images | P2 | 1 |
| Admin shell route guard | P1 | 3 |

---

## 6. Execution Sprint (this session)

### Ship now
- [x] This GStack plan document
- [x] `packages/db` — Drizzle schema starter (countries, source_claims, users)
- [x] `packages/source-engine` — confidence badges + manual adapter
- [x] Functional `/budget-calculator`
- [x] Functional `/passport-checklist`
- [x] `/privacy` + `/terms`
- [x] `/about`
- [x] Globe component (lazy) on landing
- [x] PostHog provider stub + `lib/analytics.ts`
- [x] Playwright config + home smoke test
- [x] Update `ROADMAP.md` progress

### Sprint 2 (completed locally)
- [x] Compare tool (side-by-side)
- [x] Visa compass seed cards
- [x] Pricing tier UI (no Stripe)
- [x] Custom 404 page
- [x] Housing/property/insurance/community/blog stubs
- [ ] Vercel deploy (push + verify Root Directory = `apps/web`)

### Next session (Phase 2 kickoff)
- Supabase project + migrations
- Supabase Auth + `/app/onboarding` readiness quiz
- `/app/dashboard`, persisted budget/passport
- Cinematic landing polish (scroll animations, design review fixes)

---

## 7. Success Metrics (Phase 1 exit)

| Metric | Target |
|--------|--------|
| `pnpm build` | Pass |
| Lighthouse mobile | ≥ 80 |
| Public routes | 18+ with trust disclaimers |
| Working tools | Budget + passport |
| Legal pages | Privacy + Terms live |
| Fake partners | Zero |
| Source claims on country pages | Metadata structure ready |

---

## 8. GStack Commands for Ongoing Work

| When | Command |
|------|---------|
| Phase kickoff | office-hours |
| Before coding phase | autoplan |
| Scope challenge | plan-ceo-review |
| Architecture lock | plan-eng-review |
| Landing UX | plan-design-review |
| Pre-merge | review |
| After deploy | qa |
| Release | ship |
| Security | cso |

---

*Generated by GStack workflow synthesis. Decisions logged for Expat Atlas Phase 1.*
