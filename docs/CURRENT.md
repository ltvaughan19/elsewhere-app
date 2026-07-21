# Elsewhere — Current state (start here)

**Updated:** 2026-07-21 (end-of-day office → home handoff)  
**Repo:** https://github.com/ltvaughan19/elsewhere-app  
**Production:** https://elsewhereplan.com  
**Local folder name may still be:** `expat-atlas`

This is the **only** day-to-day handoff. Older dated notes live in `docs/archive/` for history.

**Canonical clone (both machines):** `C:\Users\brenden.vaughan\expat-atlas`  
Ignore `Documents\Codex\**\elsewhere-app` worktrees — they are not product truth.

**Cursor is the control tower.** Codex (Sol Ultra) is for short, briefed build bursts only. Do not burn Sol on vague chats. Grok is for casual talk only — not PH/admin/trust work.

**Codex / Sol Ultra:** paste starters from
`docs/operations/CODEX_PH_V1_BUILD_PACKET.md`. Skill:
`.cursor/skills/elsewhere-codex-brief/SKILL.md`. Always re-read this file +
the packet before continuing after each unit.

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

## Resume at home — exact next steps (human-first)

Cursor walks these click-by-click. Do **not** invent `.gov.ph` text. Do **not** ask Codex to publish.

1. `git pull origin main` on the shared `expat-atlas` clone
2. Start local (or use production if preferred for staff admin)
3. Sign in as the staff account
4. **Enroll MFA:** `/app/settings` → Account security → add authenticator → scan QR → confirm code
5. Open `/admin` → enter code if step-up shown → badge should show MFA active / AAL2
6. Go to `/admin/content/philippines`
7. Use readiness panel + **Bootstrap draft sources** (idempotent)
8. For each ledger URL: open live page in browser → paste exact reviewed text into Capture manual snapshot
9. Use Claim A–C / next_action helpers **only after** the matching snapshot exists
10. Approve source → claim → block → release QA
11. MFA-publish
12. Smoke `https://elsewhereplan.com/countries/philippines`

Package: `docs/operations/PH_V1_ENTRY_STAY_RELEASE.md`  
Hard holds: DNV claims, work-rights, stale fees, “you qualify.”

---

## PH content autopilot (human vs AI)

**“Staff”** = Supabase user with active `staff_memberships`. Agents are not staff.

### What only a human must do
1. Enroll + use MFA (AAL2)
2. Open live official URLs and paste exact reviewed text
3. Approve / publish honestly
4. Smoke the public portal after publish

### What AI builders can speed up
- Click-by-click coaching
- Draft claim wording from the ops package (never as published truth)
- Fix admin UI / action blockers
- Keep this file current
- **Cannot:** invent snapshot text; skip MFA; claim “you qualify.”

Staging aids only: `outputs/ph-v1-evidence/` — not the system of record.

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

**CEO Message for home resume:** The tooling is ready; the only thing between Elsewhere and a real Philippines next-action is your authenticator enroll plus three honest live captures — not another feature.
