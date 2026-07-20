# Elsewhere — Current state (start here)

**Updated:** 2026-07-20  
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

1. http://localhost:3000 — Earth from `/earth/scene.splinecode` (not `prod.spline.design`); no Spline logo
2. Login shows Google (Apple/Facebook only if enabled in Supabase)
3. Signed-in header shows Account / Continue Plan across `/`, Countries, Plan

**Ignore** any `Documents\Codex\...\elsewhere-app` folders. Those are old agent worktrees. Only this git repo is truth.

End of session: `git status` → commit (never `.env.local`) → `git push origin main` → update **this file** if priorities changed.

---

## Session wrap — 2026-07-20

### Shipped recently
- Self-hosted Earth binary; logo flag false; guardrails lock hash
- Hero question tags hold until late scroll leave
- Mobile: native scroll (no Lenis), lighter scrub, WebGL sleeps past hero, ~0.6 canvas scale
- Docs consolidated into this file + `docs/archive/2026-07/`

### Parked
- **Mobile scroll feel** — improved but still imperfect on real phones; owner phone dead; revisit later. Do not keep tuning blindly.
- **Earth markers** — old branch; not priority.
- Casual Earth/camera edits — locked unless explicit approval.

### Next focus (content)
Get **real PH Entry/Stay claims** live via admin MFA publish. See § “PH content autopilot” below and `docs/operations/PH_V1_ENTRY_STAY_RELEASE.md`.

---

## What is live

| Area | Status |
|------|--------|
| One Next site + one Supabase | Live |
| Auth continuity across shells | Live |
| Email + Google login | Live |
| Apple + Facebook login | Code-ready; `docs/operations/SOCIAL_LOGIN_ACTIVATION.md` |
| Trusted-device cookie + logout | Live |
| Country portals PH/TH/MX | Preview structure; **no MFA-published claims yet** |
| Editorial + source-monitor schema | Live (9 migrations); worker not provisioned |
| Self-hosted Earth | Live at `apps/web/public/earth/scene.splinecode` |
| Corridor Brief / Resend | Live |
| Guardrails + `pnpm check:release` | Live |

---

## What is explicitly not done

1. **PH v1 MFA publish** — package ready (IMM-001/003/010). Needs human-visible snapshots + review + MFA.
2. **Weekly “one thing before Sunday”** on plan/dashboard.
3. **Apple Sign in** — deferred ($99/yr Developer Program).
4. **Facebook Login** — enable when Meta ads imminent.
5. **Supabase Pro** session time-box / leaked-password — deferred.
6. **Source-monitor worker** — explicit rollout only.
7. **TH/MX content** — after PH v1 pattern works.
8. **Mobile scroll polish** — parked until real-device retest.

---

## PH content autopilot (human vs AI)

**“Staff”** = a Supabase user with active `staff_memberships` (you, if admin/publisher). Not a hired newsroom. Agents are not staff and must not invent `.gov.ph` text.

### What only a human must do
1. Confirm your account is in `staff_memberships` with a role that can author (and ideally publish).
2. Enable MFA on that account before publish (aal2 required).
3. Open each live official URL in your browser and **see** the page.
4. Paste the **exact text you reviewed** into admin “Capture manual snapshot.”
5. Approve sources/claims (ideally a second person as reviewer; solo OK if honest).
6. MFA-publish the country release.
7. Smoke `https://elsewhereplan.com/countries/philippines`.

### What AI builders (Cursor / Codex) can speed up
- Walk you through `/admin/content/philippines` click-by-click.
- Pre-fill claim **draft wording** from `PH_V1_ENTRY_STAY_RELEASE.md` (never as published truth).
- Check admin UI / server actions / RLS when something blocks.
- Diff published portal vs expected trust labels.
- Keep CURRENT.md and ops docs in sync.
- **Cannot:** invent snapshot text for unreachable gov pages; skip MFA; claim “you qualify.”

### Exact package
`docs/operations/PH_V1_ENTRY_STAY_RELEASE.md`  
Ledger: **PH-IMM-001**, **PH-IMM-003**, **PH-IMM-010**.  
Hard holds: Digital Nomad Visa claims, work-rights claims, stale fee tables.

Staging files under `outputs/ph-v1-evidence/` are helpers only — evidence that counts lives in private admin storage after you capture.

---

## Login methods (locked)

Email + Google + Apple + Facebook only. Buttons only when that provider is enabled in Supabase.

---

## Earth / Spline

- Runtime: `@splinetool/runtime` (npm)
- Scene: **self-hosted** `/earth/scene.splinecode` (Logo = false)
- Camera + glare: `apps/web/lib/marketing/splineScene.js` — do not casual-edit
- Guardrails lock JS checksum + binary checksum + `logo === false`
- Free Spline plan does **not** stamp logo on the live self-hosted binary

---

## Doc map (keep clean)

| Path | Role |
|------|------|
| **`docs/CURRENT.md`** | **Start here — current truth** |
| `docs/operations/*` | Gates, social login, PH v1, source monitor |
| `docs/plans/PRODUCT_CLARITY_MAP.md` | North star + product picture |
| `docs/plans/ONE_SITE_ONE_AUTH.md` | Auth architecture lock |
| `docs/plans/ELSEWHERE_FOUNDATION.md` | Mission / values |
| `docs/archive/` | Superseded notes only |
| `HANDOFF.md` | Thin pointer + dual-PC rule |

**Rule:** Do not create new `*-handoff-YYYY-MM-DD.md` for routine work. Update this file.

---

## Next build order

1. **PH v1** — staff capture → review → MFA publish (Entry/Stay)
2. Weekly next-action on plan/dashboard (“one thing before Sunday”)
3. Facebook when Meta ads start; Apple when budget allows
4. Source-monitor only with explicit decision
5. Mobile scroll retest on a real phone when available

Run `pnpm check:guardrails` during work; `pnpm check:release` before ship.
