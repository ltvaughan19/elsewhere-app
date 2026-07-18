# Elsewhere — Current state (start here)

**Updated:** 2026-07-17  
**Repo:** https://github.com/ltvaughan19/elsewhere-app  
**Production:** https://elsewhereplan.com  
**Local folder name may still be:** `expat-atlas`

This is the **only** day-to-day handoff. Older dated notes live in `docs/archive/` for history.

---

## North star (locked)

> **“I’m actually going — and I know the one thing to do before Sunday.”**

Leaving is the metric. Every builder response includes a **`CEO Message:`**. Veto failure-shaped work (tool sprawl, vanity engagement, premature ecosystem, fake authority). See `.cursor/rules/ceo-north-star.mdc`.

---

## Home PC — start here

```powershell
cd C:\Users\brenden.vaughan\expat-atlas   # or your home clone path
git fetch origin
git checkout main
git pull origin main
pnpm install
# Recreate apps/web/.env.local from password manager / Vercel / Supabase
# (never copy secrets through chat or commit them)
pnpm --filter @expat-atlas/web dev
```

Smoke:

1. http://localhost:3000 — Earth loads from `/earth/scene.splinecode` (not `prod.spline.design`)
2. No Spline logo; camera motion feels familiar
3. Login shows Google (and Apple/Facebook only if enabled in Supabase)
4. Signed-in header shows Account / Continue Plan across `/`, Countries, Plan

**Ignore** any `Documents\Codex\...\elsewhere-app` folders. Those are old agent worktrees, not the product. Only this git repo is truth.

End of session:

```powershell
git status
git pull
# commit if you changed anything (never .env.local)
git push origin main
```

Update **this file** (`docs/CURRENT.md`) when architecture or next priorities change.

---

## What is live

| Area | Status |
|------|--------|
| One Next site + one Supabase | Live |
| Auth continuity across shells | Live |
| Email + Google login | Live |
| Apple + Facebook login | Code-ready; enable via `docs/operations/SOCIAL_LOGIN_ACTIVATION.md` (Apple deferred financially for now) |
| Trusted-device cookie + logout | Live |
| Country portals PH/TH/MX | Preview structure live; **no MFA-published claims yet** |
| Editorial + source-monitor schema | Live (9 migrations); worker not provisioned |
| Self-hosted Earth binary | Live in repo at `apps/web/public/earth/scene.splinecode` |
| Corridor Brief / Resend | Live (Elsewhere Resend account) |
| Guardrails + `pnpm check:release` | Live |

---

## What is explicitly not done

1. **PH v1 MFA publish** — package ready: `docs/operations/PH_V1_ENTRY_STAY_RELEASE.md` (IMM-001/003/010). Staff snapshots + review + MFA still required.
2. **Weekly “one thing before Sunday”** action on the plan/dashboard (engagement loop).
3. **Apple Sign in** — deferred until budget allows Developer Program ($99/yr).
4. **Facebook Login** — code ready; enable when Meta ads are imminent (`SOCIAL_LOGIN_ACTIVATION.md`).
5. **Supabase Pro** session time-box / leaked-password — deferred.
6. **Source-monitor worker JWT + cron** — explicit rollout only.
7. **TH/MX content** — after PH v1 pattern works.
8. **Earth markers** — parked on old branch; not priority.

---

## Login methods (locked)

Email + Google + Apple + Facebook only. No other social providers.  
Buttons appear only when Supabase has that provider enabled.

---

## Earth / Spline

- Runtime: `@splinetool/runtime` (npm)
- Scene: **self-hosted** `/earth/scene.splinecode` (Logo flag false)
- Camera path + glare soften: `apps/web/lib/marketing/splineScene.js` (locked; do not casual-edit)
- Spline subscription: keep cheapest plan that allows clean exports until visually confirmed stable on production; editor `.spline` backup should live outside git in your password-manager vault / secure drive
- Guardrails lock JS checksum + binary checksum + `logo === false`

---

## Doc map (keep clean)

| Path | Role |
|------|------|
| **`docs/CURRENT.md`** | **Start here — current truth** |
| `docs/operations/*` | How to run gates, social login, PH v1, source monitor |
| `docs/plans/PRODUCT_CLARITY_MAP.md` | North star + product picture |
| `docs/plans/ONE_SITE_ONE_AUTH.md` | Auth architecture lock |
| `docs/plans/ELSEWHERE_FOUNDATION.md` | Mission / values |
| `docs/plans/BUSINESS_PLAN_AND_LAUNCH_REPORT.md` | Offer / launch economics |
| `docs/archive/` | Superseded day-plans and old handoffs — do not treat as current |
| `HANDOFF.md` | Thin pointer to this file + dual-PC rule |
| `CLAUDE.md` / `AGENTS.md` | Builder always-on rules |

**Rule:** Do not create new `*-handoff-YYYY-MM-DD.md` files for routine work. Update `docs/CURRENT.md`. Archive only when a major era ends.

---

## Next build order

1. Visual-confirm self-hosted Earth on Vercel preview/production  
2. PH v1 staff capture → MFA publish  
3. One weekly next-action on plan/dashboard  
4. Facebook when Meta ads start; Apple when budget allows  
5. Source-monitor rollout only with explicit decision  

Run `pnpm check:guardrails` during work; `pnpm check:release` before ship.
