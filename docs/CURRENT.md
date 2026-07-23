# Elsewhere — Current state (start here)

**Updated:** 2026-07-22  
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

**Codex:** idle until Cursor pastes a new unit. Phase A tooling + MFA UI are on
`main`. Next Codex candidates (later): Sunday Action UI on portal/dashboard,
or source-monitor worker — **not** inventing PH claim text.

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
4. `/app/settings` — Account security section exists (enroll / manage TOTP)
5. `/admin` — staff only; MFA badge; step-up prompt if enrolled but still AAL1

**Ignore** any `Documents\Codex\...\elsewhere-app` folders.

End of session: `git status` → commit (never `.env.local`) → `git push origin main` → update **this file**.

---

## Session wrap — 2026-07-21 (office)

### Shipped on `main` (commit `63c229d` and follow-ups)

**Phase A — PH operator tooling (done, on GitHub):**
- Live readiness panel on `/admin/content/philippines`
- Idempotent three-source draft bootstrap (PH-IMM-001 / 003 / 010)
- Snapshot-gated Claim A–C + `next_action` draft helpers
- Required evidence-boundary (`supportNote`) on every claim
- Helpers live in `apps/web/lib/editorial/ph-v1.ts` (+ tests)
- Codex build packet + Cursor skill for always-read briefing
- Earth guardrail re-locked: `splineScene.js` hash
  `92a444e69083a8846d0c495f64e091dac3bd41e30db5c6478ee8cfbc7c1cbd79`
  (file itself unchanged; prior mobile work had left the lock stale)
- `pnpm check:guardrails` was green after re-lock

**MFA enrollment UI (Cursor-reviewed 2026-07-21, shipping this wrap):**
- App previously **checked** AAL2 but had **no enroll screen**
- Account security on `/app/settings`; admin AAL1→AAL2 step-up when enrolled;
  shared challenge form; `lib/auth/mfa.ts` helpers + tests
- Key files: `apps/web/components/account-security.tsx`,
  `admin-mfa-step-up.tsx`, `mfa-challenge-form.tsx`, `lib/auth/mfa.ts`,
  edits to `app/app/settings/page.tsx` + `app/admin/layout.tsx`
- Publish gate still requires `session.aal === "aal2"` — unchanged
- Human has **not** enrolled yet (verified factors still 0 until home session)

### Confirmed live DB (2026-07-21)
- Philippines still **preview**
- **0** PH sources / claims / blocks in production (draft release #1 empty)
- **1** active staff with publish-capable role (owner)
- **0** verified MFA factors before enrollment UI
- Supabase project TOTP MFA **enabled** (owner confirmed)
- Owner has Google Authenticator ready on phone

### Parked (do not reopen unless asked)
- Mobile scroll feel on real phones
- Earth markers / casual Earth camera edits
- Cursor↔Codex auto-orchestration loop (owner chose human control)
- Weekly dashboard “one thing before Sunday” (**Phase B** — after PH publish)
- Apple / Facebook enable, source-monitor worker, TH/MX deep content

---

## What is live

| Area | Status |
|------|--------|
| One Next site + one Supabase | Live |
| Auth continuity across shells | Live |
| Email + Google login | Live |
| Apple + Facebook login | Code-ready; deferred |
| Trusted-device cookie + logout | Live |
| Country portals PH/TH/MX | Preview structure; **no MFA-published claims yet** |
| Editorial schema (9 migrations) | Live; worker not provisioned |
| PH admin Phase A operator tools | Live in code on `main` |
| MFA enroll + AAL2 step-up UI | Live in code (enroll still human) |
| Self-hosted Earth | Live; checksums locked |
| Corridor Brief / Resend | Live |
| Guardrails + `pnpm check:release` | Live |

---

## What is explicitly not done

1. **Human MFA enroll** — open `/app/settings` → Account security → scan QR with Google Authenticator → verify 6-digit code → then step up to AAL2 on `/admin`
2. **Human live capture** — PH-IMM-001, 003, 010 exact text into admin snapshots
3. **Human review + MFA publish** of PH Entry/Stay release
4. Weekly “one thing before Sunday” on plan/dashboard (Phase B)
5. Apple / Facebook / Pro session hardening / source-monitor / TH-MX / mobile polish

---

## Session wrap — 2026-07-22

- Strategic edge baked into `docs/plans/PRODUCT_CLARITY_MAP.md` §0 (Sunday Action,
  solo MFA publisher, A→B→C). Codex idle until Cursor pastes a new unit.
- Hormozi / ChatGPT notes = reinforcement only; not a second roadmap.
- **Stopped mid MFA enroll walkthrough** — resume with the steps below.
- Official PH URLs already locked in package; capture = witness, not authorship.
- Auto-update (source-monitor) remains high-value **after** first publish.

---

## MFA enroll — click-by-click (do this first)

Use production or local with staff login. Phone: Google Authenticator ready.

**Step 1 — open settings**
1. Open https://elsewhereplan.com/app/settings  
   (or http://localhost:3000/app/settings with `.env.local`)
2. Sign in as the staff admin account
3. Scroll to **Account security / Authenticator app MFA**
4. Click **Add authenticator**
5. Stop when the **QR code** (and optional manual secret) appears

**Step 2 — verify (after QR is up)**
1. In Google Authenticator → add account → scan QR (or type manual secret)
2. Enter the current **6-digit code** in Elsewhere → Verify authenticator
3. Badge should show **AAL2 verified** (or similar)

**Step 3 — admin step-up**
1. Open https://elsewhereplan.com/admin (or local `/admin`)
2. If prompted, enter a fresh 6-digit code
3. Header badge should show MFA active / ready to publish

Then continue PH capture (below). Tell Cursor “QR is up” or “MFA enrolled” to resume coaching.

---

## Resume next — human-first sequence

Cursor walks click-by-click. Do **not** invent `.gov.ph` text. Do **not** ask Codex to publish. Codex stays idle unless Cursor pastes a unit.

1. `git pull origin main` on `C:\Users\brenden.vaughan\expat-atlas`
2. Finish **MFA enroll** (section above)
3. `/admin/content/philippines` → readiness panel → **Bootstrap draft sources**
4. For each ledger URL: open live page → paste exact text into Capture manual snapshot
5. Claim A–C / `next_action` helpers **only after** matching snapshot exists
6. Approve source → claim → block → release QA → MFA-publish
7. Smoke https://elsewhereplan.com/countries/philippines

Package: `docs/operations/PH_V1_ENTRY_STAY_RELEASE.md`  
Hard holds: DNV claims, work-rights, stale fees, “you qualify.”

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
1. Enroll + use MFA (AAL2)
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

1. **Human** — MFA enroll → AAL2 step-up → live capture IMM-001/003/010 → review → MFA publish
2. Weekly next-action on plan/dashboard (“one thing before Sunday”) — Phase B, after publish
3. Facebook when Meta ads start; Apple when budget allows
4. Source-monitor only with explicit decision
5. Mobile scroll retest on a real phone when available

Run `pnpm check:guardrails` during work; `pnpm check:release` before ship.

**CEO Message for next resume:** Finish MFA enroll from CURRENT.md, then witness
three official PH pages — that unlocks the first real Sunday Action, not more tooling.
