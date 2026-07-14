# Elsewhere — Master Build Checklist

**Purpose:** Nothing important gets missed.  
**How to use:** Check boxes as you go. Lines marked **YOU** need Brenden’s action. Lines marked **AGENT** can be done in Cursor.  
**Companions:** `PRODUCT_CLARITY_MAP.md` (start if confused), `ELSEWHERE_FOUNDATION.md`, `BUSINESS_PLAN_AND_LAUNCH_REPORT.md`

---

## Legend

| Tag | Meaning |
|-----|---------|
| **YOU** | Requires your decision, account, money, or approval |
| **AGENT** | Engineering / docs in repo |
| **BOTH** | Pair: you provide access, agent implements |
| **BLOCK** | Do not proceed to next stage until done |

---

## Stage 0 — Charter & strategy ✅

- [x] Brand = Elsewhere
- [x] Foundation charter written
- [x] Business plan + launch report written
- [x] First corridors locked: PH / TH / MX
- [x] Freemium launch model chosen
- [ ] **YOU:** Read `ELSEWHERE_FOUNDATION.md` + `BUSINESS_PLAN_AND_LAUNCH_REPORT.md` and note disagreements
- [ ] **YOU:** Confirm domain plan (elsewhere.com / elsewhere.app / other) — *write choice below*

**Domain choice (YOU):** _______________________

---

## Stage 1 — Prerequisites (accounts & legal) **BLOCK for real users**

### 1A — Accounts

- [ ] **YOU:** Create / confirm Supabase project (region: choose closest to users or US East)
- [ ] **YOU:** Copy `NEXT_PUBLIC_SUPABASE_URL` + anon key + service role (service role never in frontend)
- [ ] **BOTH:** Add keys to `apps/web/.env.local` and Vercel project env
- [ ] **YOU:** Confirm which Vercel project owns **product** production (`expat-atlas-web` today)
- [ ] **YOU:** Decide email provider for waitlist (Resend / Loops / Formspree / other)
- [ ] **YOU:** Create that email/waitlist account + webhook URL
- [ ] **AGENT:** Wire waitlist endpoint when webhook provided
- [ ] **YOU:** Install GitHub CLI or keep using GitHub website (optional)

### 1B — Legal / trust baseline

- [ ] **YOU:** Skim Privacy + Terms with counsel or trusted advisor before paid ads / large email blasts
- [ ] **AGENT:** Keep Privacy/Terms pages updated with Elsewhere brand
- [ ] **YOU:** Decide company entity name for footer (if different from brand)
- [ ] **AGENT:** Universal trust disclaimer on legal-adjacent pages (ongoing)

### 1C — Repo unification

- [x] **YOU:** Approve merge into monorepo → GitHub renamed **`elsewhere-app`**
- [ ] **YOU:** Grant quiz prototype source / Vercel access when ready to port UX polish
- [x] **AGENT:** Product lives in this monorepo; marketing Earth stays on Vite / elsewhere-mu
- [ ] **AGENT:** Optional — deep-link marketing CTA → `/app/onboarding`

**Merge strategy:** Done — stay in this repo (`elsewhere-app` on GitHub). Local folder may remain `expat-atlas`.  
**Clarity:** See [PRODUCT_CLARITY_MAP.md](./PRODUCT_CLARITY_MAP.md).

---

## Stage 2 — Platform foundation (scalable backend)

### 2A — Data model **BLOCK for multi-country claims**

- [x] **AGENT:** Countries + source_claims starter schema
- [ ] **AGENT:** Corridors table (origin → destination)
- [ ] **AGENT:** Path packs / visa packs linked to corridors + claims
- [ ] **AGENT:** Quiz answer schema (JSON, versioned)
- [ ] **AGENT:** Partner applications + status enum
- [ ] **AGENT:** Lead requests table (consent flagged)
- [ ] **AGENT:** Seed SQL / TS seeds for PH / TH / MX corridors
- [ ] **BOTH:** Run first migration against Supabase when ready

### 2B — Source display framework

- [ ] **AGENT:** Shared types for SourceClaim display
- [ ] **AGENT:** UI: confidence badge + last verified + source link
- [ ] **AGENT:** Report outdated component on country/visa pages
- [ ] **AGENT:** Never show high-confidence without metadata
- [ ] **YOU:** Provide 1–3 official URLs per corridor you personally trust (immigration/gov)

**Official URLs (YOU) — paste when ready:**

| Corridor | Official URL | Notes |
|----------|--------------|-------|
| PH | | |
| TH | | |
| MX | | |

### 2C — Security baseline **BLOCK for personal data**

- [ ] **AGENT:** Auth (magic link or password) behind feature flag if needed
- [ ] **AGENT:** RLS policies on user tables
- [ ] **AGENT:** Confirm service role only on server
- [ ] **AGENT:** No document upload endpoints
- [ ] **YOU:** Enable MFA on Supabase + Vercel + GitHub + email admin
- [ ] **AGENT/YOU:** Run `gstack-cso` threat model before vault talk

---

## Stage 3 — Product wedge (value users feel)

### 3A — Marketing surface

- [ ] **BOTH:** Deploy Elsewhere cinematic site under brand domain (or keep elsewhere-mu until DNS)
- [ ] **AGENT:** Waitlist → ESP
- [ ] **YOU:** Approve hero copy + CTA (“Join the waitlist” vs “Start Fit Quiz”)
- [ ] **AGENT:** Link marketing CTA → Fit Quiz when app ready

### 3B — Fit Quiz → Path → Checklist

- [x] **AGENT:** Fit Quiz → Path → Checklist in Next (`/app/onboarding` → `/app/path`)
- [x] **AGENT:** Quiz engine reads corridor packs (PH/TH/MX seeds)
- [x] **AGENT:** Path page shows research route + claim badges
- [x] **AGENT:** Checklist per corridor pack (localStorage)
- [x] **AGENT:** Vault UI = metadata checklist only (label “files later”)
- [ ] **YOU:** Walk the quiz once and list what feels wrong
- [ ] **AGENT:** Port elsewhere-app visual polish when source available

### 3C — Free tools (lead with value)

- [x] **AGENT:** Budget calculator (seed)
- [x] **AGENT:** Passport checklist (seed)
- [x] **AGENT:** Country compare (seed)
- [ ] **AGENT:** Apply Elsewhere dark tokens site-wide (globals + fonts)
- [x] **AGENT:** Write `STYLING_RULES.md` + `REPO_CONSOLIDATION.md`
- [x] **YOU:** Approve rename of GitHub `expat-atlas` → `elsewhere-app`
- [ ] **YOU:** Choose production domain
- [ ] **AGENT:** Port cinematic landing into Next `/` (after approval)

### 3D — Content depth PH / TH / MX

- [ ] **AGENT:** Seed path packs (tourist / remote / retirement-research) labeled `needs_review`
- [ ] **YOU:** Verify top claim per country with official site (1 evening)
- [ ] **AGENT:** Flip claim to `human_reviewed` only after you confirm
- [ ] **AGENT:** Education pages (housing / insurance / property) keep disclaimers

---

## Stage 4 — Trust operations

- [ ] **AGENT:** Admin route stub + role guard
- [ ] **AGENT:** Claim review queue UI (minimal)
- [ ] **AGENT:** Partner application → `pending_verification`
- [ ] **YOU:** Decide first partner category to accept applications from
- [ ] **YOU:** Write 3 sentences: when we hand a user to a professional
- [ ] **AGENT:** Lead request form with consent checkbox
- [ ] **AGENT:** Sponsored / affiliate disclosure components ready (even if unused)

**First partner category (YOU):** _______________________

---

## Stage 5 — Soft launch checklist

- [ ] **YOU:** Soft launch audience (friends / waitlist / public?) 
- [ ] **AGENT:** Analytics events (quiz start/complete, CTA clicks) — PostHog or stub
- [ ] **AGENT:** Playwright smoke: home, quiz, compare, report outdated
- [ ] **AGENT:** Lighthouse mobile pass attempt
- [ ] **YOU:** Confirm no “you qualify” copy anywhere
- [ ] **BOTH:** Production deploy + DNS cutover plan
- [ ] **YOU:** Announce only after Privacy/Terms feel honest

**Soft launch audience (YOU):** [ ] private  [ ] waitlist  [ ] public  

---

## Stage 6 — Monetization (after value proven)

- [ ] **YOU:** Finalize Free vs Explorer vs Builder limits
- [ ] **YOU:** Create Stripe account (or delay)
- [ ] **AGENT:** Feature gates by `plan_tier` (before live Stripe if needed)
- [ ] **AGENT:** Pricing page matches live gates
- [ ] **YOU:** First paid beta cohort size / price
- [ ] **AGENT:** Invoice/receipt + cancel path when Stripe live

---

## Stage 7 — Scale (do not start early)

- [ ] Add corridor rows only (e.g. Portugal, Colombia, Vietnam)
- [ ] Community cohorts with moderation
- [ ] Mobile Expo app from shared packages
- [ ] Document vault **after** encryption architecture + CSO
- [ ] AI coach **after** RAG over verified claims only
- [ ] Live verified partner network at meaningful scale

---

## Ongoing hygiene (every sprint)

- [ ] No fake partners introduced
- [ ] New claims have source metadata or `needs_review`
- [ ] Secrets not committed
- [ ] Build passes (`pnpm --filter @expat-atlas/web build`)
- [ ] Checklist updated when decisions change

---

## YOUR action queue (print this)

Copy this into a note and check off:

1. [ ] Read foundation + business report; send 5 bullet objections if any  
2. [ ] Choose domain  
3. [ ] Create Supabase project + paste keys (or schedule pair session)  
4. [ ] Choose waitlist/email tool + webhook  
5. [ ] Approve elsewhere-app source access (Vercel pull or GitHub)  
6. [ ] Paste 1 official immigration URL each for PH, TH, MX  
7. [ ] Enable MFA on critical accounts  
8. [ ] Walk Fit Quiz when ready and give feedback  
9. [ ] Pick soft launch audience  
10. [ ] Legal skim of Privacy/Terms before ads  

---

*Last updated: 2026-07-13*
