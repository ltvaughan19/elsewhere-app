# Elsewhere — Current state (start here)

**Updated:** 2026-08-06 (Paid Step 1 Stripe + proof-scope lock + FX decision)  
**Repo:** https://github.com/ltvaughan19/elsewhere-app  
**Production:** https://elsewhereplan.com  
**Canonical clone:** `C:\Users\brenden.vaughan\expat-atlas`

Cursor = control tower. Codex = idle unless pasted a unit. Do not invent `.gov.ph` text.  
**Lengthy handoff:** [`docs/operations/HANDOFF_2026-08-06.md`](./operations/HANDOFF_2026-08-06.md)

---

## Tell Cursor (copy-paste)

```
Read docs/CURRENT.md and docs/operations/HANDOFF_2026-08-06.md.
Proof scope: PH only; no TH/MX deepen; no extra portal sections; no AI/vault/partners/community.
Stripe Step 1 is in code — finish test keys + Checkout smoke, then Step 2 feature gates only.
Free Sunday Action stays un-gated. Corridor-agnostic FX rates are decided (scheduled API) —
build after Stripe Step 1–2, not instead of them. Never commit .env.local.
```

---

## North star

> **“I’m actually going — and I know the one thing to do before Sunday.”**

Include **`CEO Message:`** every response. Veto encyclopedia shelves / vanity
engagement / premature ecosystem before the weekly leaving habit is proven.

---

## Proof scope (locked 2026-08-06)

- Philippines corridor only  
- Do not fill additional portal sections  
- Do not build AI coach, document vault, partner directory, or community  
- Never paywall Free Sunday Action  

---

## Free vs paid (proof ladder)

**Free:** Fit Quiz → path; PH Entry/Stay + Sunday Action + trust strip + done this week; passport; basic budget; compare (published data); dashboard next action.

**Explorer $19/mo:** history/streak, multi-device sync, living roadmap, PH source-change alerts, deeper budget/progress summary.

**Serious Move $149 one-time:** 30/60/90 from quiz/plan + published PH claims; regenerable; stacks via `serious_move_purchased_at`.

**Entitlements:** `plan_tier` = `free`|`explorer`; Serious Move = `serious_move_purchased_at`.

---

## Home / next machine start

```powershell
cd C:\Users\brenden.vaughan\expat-atlas
git pull origin main
pnpm install
pnpm --filter @expat-atlas/web dev
```

Ignore `Documents\Codex\**\elsewhere-app`. Never commit `apps/web/.env.local`.

---

## SHIPPED

| When | What |
|------|------|
| 2026-08-05 | PH Release 1 public Entry/Stay |
| 2026-08-05 | Free habit: Settings staff-gate, dashboard Sunday Action, done-this-week |
| 2026-08-06 | Stripe Step 1 code + migration on Supabase; pricing Free/$19/$149 |
| 2026-08-06 | Business plan + technical architecture docs |

Migration: `supabase/migrations/20260806120000_profiles_stripe_entitlements.sql` (applied on Elsewhere project).

---

## Next (ordered)

1. Human: Stripe test products + fill `apps/web/.env.local` + webhook listen + smoke Checkout  
2. Step 2: feature gates (paid only; Free Sunday Action untouched)  
3. Steps 3–5: roadmap JSON UI → Serious Move generator → PH alerts MVP  
4. **Later:** Corridor-agnostic FX (scheduled Open Exchange Rates / ECB / similar) — strategic placement on budget + corridor money surfaces  

Parked: Overview MFA publish until habit feedback; TH/MX; Money/Housing bulk fill.

---

## Doc map

| Path | Role |
|------|------|
| **`docs/CURRENT.md`** | **This file — start here** |
| `docs/operations/HANDOFF_2026-08-06.md` | Lengthy decision + Stripe + FX handoff |
| `HANDOFF.md` | Thin dual-PC pointer |
| `docs/plans/ELSEWHERE_FULL_BUSINESS_PLAN.md` | Full business plan |
| `docs/plans/ELSEWHERE_TECHNICAL_ARCHITECTURE.md` | Full tech architecture |
| `docs/plans/PRODUCT_CLARITY_MAP.md` | North star + strategic edge |

**CEO Message for resume:** Finish Stripe smoke, then gates — FX is a platform add after paid proof, not a content shelf.
