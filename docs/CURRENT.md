# Elsewhere — Current state (start here)

**Updated:** 2026-07-23 (handoff)  
**Repo:** https://github.com/ltvaughan19/elsewhere-app  
**Production:** https://elsewhereplan.com  
**Local folder name may still be:** `expat-atlas`

This is the **only** day-to-day handoff. Older dated notes live in `docs/archive/` for history.

**Canonical clone:** `C:\Users\brenden.vaughan\expat-atlas`  
Ignore `Documents\Codex\**\elsewhere-app` worktrees.

**Cursor = control tower.** Codex = briefed build bursts only. Grok = casual talk only.

**Strategic edge (do not reopen):** `docs/plans/PRODUCT_CLARITY_MAP.md` §0
“Strategic edge” — Sunday Action pattern; corridors not brochures; reality moat;
solo MFA publisher (not hired newsroom); sequence A→B→C.

**Codex:** idle until Cursor pastes a new unit. Next candidates (later): Sunday
Action UI, or source-monitor worker — **not** inventing PH claim text.

---

## North star (locked)

> **“I’m actually going — and I know the one thing to do before Sunday.”**

Leaving is the metric. Every builder response includes a **`CEO Message:`**. Veto failure-shaped work (tool sprawl, vanity engagement, premature ecosystem, fake authority). See `.cursor/rules/ceo-north-star.mdc`.

---

## Home PC — start here

```powershell
cd C:\Users\brenden.vaughan\expat-atlas
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
4. `/app/settings` — Account security; TOTP enrolled; step up to AAL2 after login if needed
5. `/admin` — staff only; should load (no login↔admin loop); MFA badge / step-up if AAL1

**Ignore** any `Documents\Codex\...\elsewhere-app` folders.

End of session: `git status` → commit (never `.env.local`) → `git push origin main` → update **this file**.

---

## Session wrap — 2026-07-23

### Human progress
- **MFA enrolled** on `brenden@elsewhereplan.com` (Google Authenticator, factor verified)
- After logout/login, session starts **AAL1** → use Settings “Verify this session” (or admin step-up) to reach **AAL2**
- Owner confirmed AAL2 badge after code entry

### Shipped on `main` today / recently
- `7c51974` — Fix `/admin`↔`/login` redirect loop (getUser for identity; signed-in-not-staff → dashboard)
- `bfbccf4` — MFA success/notice contrast on dark theme (`text-success` not raw emerald)
- Prior: Phase A PH admin tooling (`63c229d`), MFA UI (`14c4b20`), strategic edge docs (`ce7eb69`)

### Still true
- PH portal still **preview**; no MFA-published claims yet
- Capture = witness official pages (not authorship); URLs locked in package below
- Codex idle unless Cursor pastes a unit

### Parked
- Mobile scroll / Earth markers / Cursor↔Codex auto-loop / Phase B weekly habit /
  Apple·Facebook / source-monitor worker / TH·MX deep content

---

## What is live

| Area | Status |
|------|--------|
| One Next site + one Supabase | Live |
| Auth continuity across shells | Live |
| Email + Google login | Live |
| Staff MFA enroll + AAL2 step-up | **Live — owner enrolled** |
| Admin access (no redirect loop) | Live on `main` |
| PH admin Phase A operator tools | Live |
| Country portals PH/TH/MX | Preview; **no MFA-published claims yet** |
| Editorial schema (9 migrations) | Live; worker not provisioned |
| Self-hosted Earth | Live; checksums locked |
| Corridor Brief / Resend | Live |
| Guardrails + `pnpm check:release` | Live |

---

## What is explicitly not done

1. **Confirm `/admin` loads cleanly** after AAL2 (if any glitch: logout → login → Settings step-up → `/admin`)
2. **Human live capture** — PH-IMM-001, 003, 010 exact text into admin snapshots
3. **Human review + MFA publish** of PH Entry/Stay release
4. Weekly “one thing before Sunday” on plan/dashboard (Phase B)
5. Source-monitor auto-stale worker; Apple / Facebook; TH/MX; mobile polish

---

## MFA — how it works now (already enrolled)

Factor is enrolled. **Each new login** may be AAL1 until you step up:

1. https://elsewhereplan.com/app/settings → **Verify this session** → 6-digit code → **AAL2 verified**
2. Or `/admin` step-up box if shown
3. Do **not** click Add authenticator unless rotating a compromised secret

Optional later: Remove + re-enroll if the secret was ever shared in a screenshot.

---

## Resume next — PH capture (human-first)

Cursor walks click-by-click. Do **not** invent `.gov.ph` text. Codex stays idle unless pasted a unit.

1. `git pull origin main` on `C:\Users\brenden.vaughan\expat-atlas`
2. Sign in → Settings step-up to **AAL2** if needed
3. Confirm https://elsewhereplan.com/admin loads (MFA badge OK)
4. `/admin/content/philippines` → readiness panel → **Bootstrap draft sources**
5. For each ledger URL: open live page → paste **exact text you see** into Capture manual snapshot
6. Claim A–C / `next_action` helpers **only after** matching snapshot exists
7. Approve source → claim → block → release QA → MFA-publish
8. Smoke https://elsewhereplan.com/countries/philippines

Package: `docs/operations/PH_V1_ENTRY_STAY_RELEASE.md`  
Hard holds: DNV claims, work-rights, stale fees, “you qualify.”

Tell Cursor: **“walk me through PH capture”** or **“admin MFA looks good”**.

---

## PH content autopilot (human vs AI)

**“Staff”** = you with active `staff_memberships` + MFA. Not a hired newsroom.
Agents are not staff.

**Official listings for PH v1 are already chosen** (do not re-hunt randomly):

| ID | URL |
|----|-----|
| PH-IMM-001 | https://evisa.gov.ph/page/policy?l2=Free+to+enter+the+Philippines+without+Visa |
| PH-IMM-003 | https://immigration.gov.ph/visas/visa-waiver/ |
| PH-IMM-010 | https://e-services.immigration.gov.ph/ |

Full package: `docs/operations/PH_V1_ENTRY_STAY_RELEASE.md`.

### What only a human must do (attestation, not authorship)
1. Keep MFA usable (step up to AAL2 each session as needed)
2. Open each live official URL and paste the **exact text you see** into Capture
   (this is witnessing the page — not writing an article)
3. Approve / MFA-publish
4. Smoke the public portal

### What AI / Cursor can do
- Find and list official URLs; design Sunday Action UX; draft claim helpers from
  the package; coach click-by-click; later build source-monitor (detect change →
  mark stale → human re-approve)
- **Cannot:** invent snapshot text; skip MFA; publish; claim “you qualify”;
  treat forum scrape as legal authority

**Auto-update (high value, after first publish):** worker fetches official URLs,
diffs hashes, marks claims stale, opens review. Humans never “rewrite policy” —
they re-attest the live page. Schema exists; worker not provisioned yet.

Staging aids only: `outputs/ph-v1-evidence/`.

---

## Login methods (locked)

Email + Google + Apple + Facebook only. Buttons only when that provider is enabled in Supabase.

---

## Earth / Spline

- Runtime: `@splinetool/runtime` (npm)
- Scene: **self-hosted** `/earth/scene.splinecode` (Logo = false)
- Camera + glare: `apps/web/lib/marketing/splineScene.js` — do not casual-edit
- Guardrails lock JS checksum + binary checksum + `logo === false`
- Locked JS hash (2026-07-21): `92a444e69083a8846d0c495f64e091dac3bd41e30db5c6478ee8cfbc7c1cbd79`

---

## Doc map (keep clean)

| Path | Role |
|------|------|
| **`docs/CURRENT.md`** | **Start here — current truth** |
| `docs/operations/CODEX_PH_V1_BUILD_PACKET.md` | Codex Phase A brief |
| `docs/operations/PH_V1_ENTRY_STAY_RELEASE.md` | PH Entry/Stay package |
| `docs/operations/*` | Gates, social login, source monitor |
| `docs/plans/PRODUCT_CLARITY_MAP.md` | North star + product picture |
| `docs/plans/ONE_SITE_ONE_AUTH.md` | Auth architecture lock |
| `docs/archive/` | Superseded notes only |
| `HANDOFF.md` | Thin pointer + dual-PC rule |

**Rule:** Do not create new `*-handoff-YYYY-MM-DD.md` for routine work. Update this file.

---

## Next build order

1. **Human** — AAL2 → `/admin` OK → live capture IMM-001/003/010 → review → MFA publish
2. Weekly next-action on plan/dashboard (“one thing before Sunday”) — Phase B, after publish
3. Source-monitor (detect/stale only) with explicit decision
4. Facebook when Meta ads start; Apple when budget allows
5. Mobile scroll retest on a real phone when available

Run `pnpm check:guardrails` during work; `pnpm check:release` before ship.

**CEO Message for next resume:** MFA is done — open `/admin` at AAL2 and witness the three official PH pages so the first Sunday Action can ship.
