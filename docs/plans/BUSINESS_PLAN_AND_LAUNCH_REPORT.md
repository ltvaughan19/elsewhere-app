# Elsewhere — Business Plan & Launch Report

**Brand:** Elsewhere  
**Date:** 2026-07-13  
**Companion docs:** `ELSEWHERE_FOUNDATION.md`, `BUILD_CHECKLIST.md`  
**Launch corridors (v1):** Philippines · Thailand · Mexico (US citizen → destination)

---

## Executive summary

Elsewhere is a trust-first **expat transition operating system**. We help people under pressure to move abroad turn overwhelm into a clear next step — without acting as lawyers, accountants, or immigration consultants.

**Strategy:** Build a **wide, scalable platform** (corridors, path packs, source claims, partners as data). **Publish narrow, deep content** first so users get real value and we never fake authority.

**Lead with value:** Free tools that reduce fear and chaos. Monetize structure, depth, and verified pathways — never “approvals” or invented partners.

---

## 1. What the full product is (top-down scope)

### North-star user outcomes

A first-time planner should be able to:

| # | Capability | v1 (now) | Later |
|---|------------|----------|-------|
| 1 | Feel understood (pressure → calm path) | Marketing + Fit Quiz | — |
| 2 | See best-fit corridor among seed destinations | Quiz → Path | More corridors |
| 3 | Compare countries on cost / lifestyle / complexity | Compare tool | Live DB scores |
| 4 | Research visas with **source-backed** cards | Visa Compass + claim badges | Full claim ledger |
| 5 | Track passport + budget runway | Checklists / calculator | Cloud sync |
| 6 | Follow a 30/60/90-day action plan | My Plan template | Personalized packs |
| 7 | Report outdated info | Intake form | Admin queue |
| 8 | Save destinations & return | Local / account | Sync |
| 9 | Join waitlists (partners, concierge) | Forms | CRM |
| 10 | Talk to verified experts | Placeholders only | Verified partners |
| 11 | Housing / insurance education | Education pages | Affiliates + verified dirs |
| 12 | Community without chaos | Waitlist cohorts | Moderated |
| 13 | Mobile app | Responsive web | Expo |
| 14 | Document vault | Metadata only | Encrypted vault |

**Narrow offer for launch:** Items 1–8 for corridors **PH / TH / MX**, with honest `needs_review` where unverified.

---

## 2. Why these three countries

| Country | Why it’s a hotspot | Fit with PH |
|---------|-------------------|-------------|
| **Philippines** | Large US expat / retiree presence; English widespread; strong remittance + lifestyle communities; approachable COL | Anchor |
| **Thailand** | Massive digital nomad / long-stay scene; clear tourist vs long-stay research paths; similar COL band vs US | SEA peer |
| **Mexico** | Closest major US corridor; huge expat cities (CDMX, Mérida, etc.); similar “affordable abroad” math | Americas peer |

**Not Portugal for v1** — strong product later, but different FX / Europe complexity / cost band. Architecture still supports adding PT as a corridor row with zero schema rewrite.

**Exchange / opportunity lens (planning estimates, not forecasts):** All three sit in a band where many US remote/savings users can research multi-month stays without EU-tier rents — large existing communities mean user education content and future partners can compound.

---

## 3. Offer architecture — lead with value

### Public promise (marketing)

> **One calm path abroad.** Structure, verified research avenues, and a clear next step — not forty tabs.

### Value ladder (what users get before they pay)

```
FREE (lead magnets — no credit card)
├── Cinematic landing + waitlist
├── Fit Quiz → sample corridor path
├── Country browse + compare (seed)
├── Passport checklist (local save)
├── Budget calculator (planning estimate)
└── Visa overview cards (labeled confidence)

PAID STRUCTURE (when live — metadata ready now)
├── Explorer — saved plans, full compare, alerts
├── Builder — personalized roadmap, housing/insurance hubs
└── Serious Move — one-time 30/60/90 plan pack

WAITLIST / LATER
├── Concierge (human-assisted intake)
└── Verified partner referrals
```

**Principle:** Free must be genuinely useful. Paid unlocks **persistence, depth, personalization, and priority** — never “you are approved for a visa.”

---

## 4. Launch model recommendation

### Recommended: **Freemium + waitlist paid tiers** (not paid-only)

| Model | Pros | Cons | Verdict |
|-------|------|------|---------|
| Paid-only at launch | Revenue early | Kills trust + sampling; wrong for new brand | Reject |
| Free forever only | Growth | No path to partner diligence costs | Incomplete |
| **Freemium + soft paywall** | Lead with value; monetize structure | Need clear tier boundaries | **Choose** |
| Free + add-ons ala carte | Flexible | Fragmented UX; harder messaging | Later option |

### Launch sequence

1. **Soft launch:** Marketing site + waitlist + free tools (no paywall)  
2. **App foundation:** Fit Quiz → Path → Checklist for PH/TH/MX  
3. **Trust labels live:** Every claim shows confidence / last verified / report  
4. **Invite Explorer beta** (still free or $0 trial) while Stripe stays off  
5. **Paid Explorer/Builder** after 25–50 completed plans + privacy counsel pass  

### Membership tiers (product metadata — checkout later)

| Tier | Price (planned) | Limits (design now) |
|------|-----------------|---------------------|
| Free | $0 | 1 active plan, basic quiz, tools, limited country depth |
| Explorer | ~$12/mo | Full compare, saved countries, alerts stub, quiz retakes |
| Builder | ~$29/mo | Personalized roadmap, housing/insurance modules, cohorts waitlist |
| Serious Move | ~$149 one-time | Fixed 30/60/90 pack for one corridor |
| Concierge | Waitlist | Human intake; licensed referrals only |

**Launch pricing is provisional.** Keep `plan_tier` on profiles from day one; feature gates as config.

---

## 5. Limitations, bottlenecks, hosting cost reality

### What we cannot / will not offer

| Limit | Why |
|-------|-----|
| Legal / immigration / tax advice as authority | Liability + ethics |
| Guaranteed visas / “you qualify” | False certainty |
| Fake verified attorneys / landlords | Brand death |
| Passport/ID file storage (MVP) | Security architecture incomplete |
| Scraped-only visa truth | Trust requires review workflow |
| Unmoderated stranger matching | Safety |

### Operational bottlenecks (watch these)

| Bottleneck | Why expensive / hard | Mitigation |
|------------|----------------------|------------|
| **Human claim verification** | Founder time; every new corridor | Path packs + `needs_review`; prioritize top claims only |
| **Partner verification** | Credential checks | Status machine; slow onboarding |
| **Support for anxious users** | High emotion volume | Strong self-serve next steps; FAQ; no AI “legal answers” |
| **Keeping sources fresh** | Rules change | Watchlist + user reports + re-review dates |
| **Content authorship** | Deep corridors cost weeks | Template packs; don’t publish hollow pages |

### Hosting / infra cost bands (order of magnitude)

| Stage | Stack | Est. monthly (USD) | Notes |
|-------|-------|--------------------|-------|
| Soft launch | Vercel hobby/pro + no DB | $0–20 | Marketing + static/seed tools |
| App + Auth | Vercel Pro + Supabase free/pro | $20–75 | Auth, Postgres, RLS |
| Growth | Vercel + Supabase Pro + PostHog | $75–250 | Bandwidth, DB size, analytics |
| Scale content | + storage, email (Resend), uptime | $250–800+ | Claim volume, backups |
| Vault / docs (future) | Encrypted object storage + KMS | **Material jump** | Defer until architecture + budget |
| AI coach (future) | RAG + tokens | Variable, can spike | Only over verified claims |

**Most expensive early risks:** premature document vault, AI token burn, buying content breadth before verification capacity.

---

## 6. Official source information — display framework

### Product rule

Every material claim (visa length, fees, ownership, tax residency, health access) must support:

1. Plain-English summary  
2. Official / named source link  
3. Source type badge  
4. Confidence badge (`low` / `medium` / `high`)  
5. Last verified date (or “Not yet verified”)  
6. Review status (user sees risk-appropriate labels)  
7. “Report outdated”  
8. Optional: “May need professional review”

### User-visible states

| Backend status | User sees |
|----------------|-----------|
| `human_reviewed` + high confidence | Source chip + date + calm wording |
| `needs_review` / low confidence | “Planning estimate · Needs verification” |
| `disputed` | Warning banner + both views |
| Hidden (`is_user_visible=false`) | Not shown (or “Coming soon”) |

### Framework in code (this sprint)

- Schema: countries, corridors, path_packs, source_claims (expandable)  
- UI: `SourceClaimCard` / claim badge helpers  
- Seed: sample claims for PH / TH / MX labeled honestly  

See `SOURCE_VERIFICATION_SYSTEM.md` + `packages/source-engine` + UI components.

---

## 7. Partner & relationship strategy

### Goal

Build a **pipeline for value to users** without inventing trust.

### Relationship stages

```
Outreach → Application → Credential review → pending_verification
  → verified (directory) → optional sponsored placement
  → lead requests (with disclosure) → performance review / suspend
```

### Who we court first (by corridor)

| Category | PH / TH / MX priority | Launch posture |
|----------|----------------------|----------------|
| Immigration attorney / accredited advisor | High | Waitlist / apply only |
| Tax advisor (cross-border) | High | Education + waitlist |
| Expat health insurance brokers | Medium | Affiliate-ready later; labeled |
| Relocation consultants | Medium | Apply form |
| Serviced apartments / reputable rentals | Medium | Education; no fake listings |
| Coworking / community orgs | Low–Med | Directory later |

### How we “hand off” value to partners

1. User reaches a step needing a professional (“taxes,” “visa appointment”)  
2. UI shows **Get expert review (waitlist)** or verified card if exists  
3. Lead request captures consent + corridor + need type  
4. Partner receives lead only if `verified`  
5. Elsewhere discloses if sponsored; never ranks pay-to-play above fit  

### What partners get

- Qualified leads from people mid-plan (not cold tourists)  
- Brand association with a calm, ethical product  
- Clear status — they are never “verified” until you say so  

### What we never do

- Invent named lawyers for homepage credibility  
- Sell “guaranteed approvals” through partners  
- Hide sponsored placements  

---

## 8. Go-to-market & launch plan

### Phase A — Brand soft launch (marketing)

- Elsewhere cinematic site live  
- Waitlist (email + consent)  
- Link to free tools  

**You do:** Domain, brand assets, waitlist webhook or ESP (Resend/Mailchimp), approve copy  

### Phase B — Product soft launch

- Fit Quiz + Path for PH/TH/MX  
- Free tools + source-labeled visa/country pages  
- Demo account or Supabase Auth  

**You do:** Create Supabase project, add env keys, privacy/terms counsel skim  

### Phase C — Trust launch

- Admin claim review for top 10 claims per corridor  
- Report-outdated → email/queue  
- Partner application open (pending only)  

**You do:** Verify first official URLs yourself or with a licensed advisor; decide first partner categories  

### Phase D — Monetization test

- Explorer tier gates (even if payment stubbed)  
- Then Stripe live  

**You do:** Business entity, Stripe account, pricing final call  

---

## 9. Prerequisites (must exist before “real users with accounts”)

| Prerequisite | Owner | Status target |
|--------------|-------|---------------|
| Brand name locked: Elsewhere | You ✅ | Done |
| Foundation + this report in repo | Agent | Done this pass |
| Privacy Policy + Terms accurate enough for waitlist | You + counsel | Before email list ads |
| Supabase project + Auth | You create / Agent wire | Before real accounts |
| Env secrets not in git | Both | Continuous |
| Source claim UI framework | Agent | This pass |
| Corridor seed PH/TH/MX | Agent | This pass |
| No fake partners | Product rule | Locked |
| Build checklist tracking | Both | This pass |

---

## 10. Financial sketch (founder’s planning, not a forecast)

| Cost center | Soft launch | App live | Growth |
|-------------|-------------|----------|--------|
| Hosting | Low | Low–med | Med |
| Email / analytics | Low | Low | Med |
| Your time (content verify) | **Highest** | Highest | Hire/contractor |
| Legal counsel retainers | — | As needed | Ongoing |
| Partner commissions | — | — | % of leads |
| Ads | Optional later | Optional | Only after trust UX |

**Elsewhere wins or loses on verification capacity**, not on server bills — until vault/AI.

---

## 11. Risks to re-read

See `RISK_REGISTER.md`. Top three for launch:

1. Users treat us as legal authority → disclaimers + never “qualify”  
2. Outdated visa info → claim statuses + report flow  
3. Fake trust → partner status enum only  

---

## 12. Decision log (this report)

| Decision | Choice |
|----------|--------|
| Launch corridors | **Philippines, Thailand, Mexico** |
| Launch commercial model | **Freemium; paid later** |
| Document vault | Deferred |
| Portugal | Later corridor (data, not rewrite) |
| Lead motion | **Value-first free tools → quiz → path** |
| Partners | Pipeline now; verified humans later |

---

*Update this report when pricing, entity, or corridor set changes.*
