# Elsewhere — Current state (start here)

**Updated:** 2026-07-24 (home handoff — mid PH capture)  
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

**Codex:** idle until Cursor pastes a new unit. Do **not** invent PH claim text.

---

## North star (locked)

> **“I’m actually going — and I know the one thing to do before Sunday.”**

Leaving is the metric. Every builder response includes a **`CEO Message:`**. Veto failure-shaped work (tool sprawl, vanity engagement, premature ecosystem, fake authority). See `.cursor/rules/ceo-north-star.mdc`.

---

## Tell Cursor at home (copy-paste)

```
Read docs/CURRENT.md. Continue PH v1 human capture from where we left off:
PH-IMM-001 done; next is PH-IMM-003 then 010 using the paste files in
outputs/ph-v1-evidence/. Walk me click-by-click on
https://elsewhereplan.com/admin/content/philippines — exact UI labels only.
```

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

## Session wrap — 2026-07-24 (office → home)

### Human progress (production admin)
- Staff admin works for Google user `brenden@elsewhereplan.com` (Admin + **MFA Active** / AAL2 confirmed in screenshot)
- `/admin/content/philippines` open and usable
- **Create missing source drafts** already done → **Package sources: 3 draft / 0 verified**
- **PH-IMM-001 captured** → badge **Snapshot present**; **Required snapshots: 1 of 3 captured**
- Red banner **“That exact evidence is already captured for this source.”** = re-paste of 001 (safe to ignore; do not re-capture 001)
- **PH-IMM-003** and **PH-IMM-010** still **Capture needed**
- Claims / next action / release still **Blocked** (expected until 3 snapshots + drafts + approvals)
- Release row shows **Release 1 / draft** (empty/open draft exists — do not publish yet)

### Paste assists ready in repo
| Ledger | File | Status |
|--------|------|--------|
| PH-IMM-001 | `outputs/ph-v1-evidence/PH-IMM-001.capture-paste.txt` | **Already attested in admin** — keep for audit; do not re-submit |
| PH-IMM-003 | `outputs/ph-v1-evidence/PH-IMM-003.capture-paste.txt` | **Next paste** |
| PH-IMM-010 | `outputs/ph-v1-evidence/PH-IMM-010.capture-paste.txt` | After 003 |

AI may fetch/copy for paste assist. **Human must skim live URL, paste, click Retain.** That is attestation, not authorship.

### Exact admin UI labels (do not hunt)
Page: https://elsewhereplan.com/admin/content/philippines  
Title: **Philippines editorial workspace**  
Top card: **Operator readiness** (eyebrow **PH v1 Entry/Stay**)

Nav chips: **`1. Sources`** · **`2. Claims`** · **`3. Page content`** · **`4. Releases`**

**Capture form** (right card under Sources — ignore left **Register a source document**):

| On-screen label | What to do |
|-----------------|------------|
| Card title | **Capture reviewed evidence** |
| **Source document** | Dropdown (exact option text below) |
| **Capture label** | Short note e.g. `BI visa-waiver page, reviewed July 2026` |
| **Exact reviewed text** | Paste from matching `.capture-paste.txt` |
| Submit button | **`Retain exact evidence`** |

**Dropdown option strings** (`publisher — title`):
- 001 (done): `Department of Foreign Affairs — DFA Philippine eVisa — visa-free entry policy`
- 003 (next): `Bureau of Immigration — Bureau of Immigration — Temporary Visitor Visa / visa waiver`
- 010: `Bureau of Immigration — Bureau of Immigration — e-Services`

Success banner: **Exact evidence retained privately with a SHA-256 fingerprint for reproducible review.**

### Resume order at home (tight)

1. `git pull origin main` on canonical clone
2. Sign in → https://elsewhereplan.com/app/settings → **Verify this session** if AAL1 → AAL2
3. Confirm `/admin` shows Admin + MFA Active
4. Open philippines workspace → confirm **PH-IMM-001 Snapshot present** / **1 of 3**
5. **Capture PH-IMM-003** (nav **1. Sources** → Capture reviewed evidence → dropdown for 003 → paste file → **Retain exact evidence**)
6. Confirm **2 of 3** and **PH-IMM-003 Snapshot present**
7. **Capture PH-IMM-010** same way with its paste file → **3 of 3**
8. Only then: nav **`2. Claims`** → use **Load Claim A / PH-IMM-001**, then B, then C (helpers unlock per snapshot)
9. Each claim: review prefilled text → **Save claim and citation draft** (do not invent eligibility)
10. Nav **`3. Page content`** → **Load PH v1 next-action draft** → **Save content draft**
11. Nav **`4. Releases`** → pin claim versions + next_action → review → MFA publish
12. Smoke https://elsewhereplan.com/countries/philippines

**Do not** click **Create missing source drafts** again unless a source shows **Source draft missing**.  
**Do not** invent `.gov.ph` facts or say “you qualify.”  
Hard holds: DNV, work-rights, stale fees as current gospel.

Official URLs:

| ID | URL |
|----|-----|
| PH-IMM-001 | https://evisa.gov.ph/page/policy?l2=Free+to+enter+the+Philippines+without+Visa |
| PH-IMM-003 | https://immigration.gov.ph/visas/visa-waiver/ |
| PH-IMM-010 | https://e-services.immigration.gov.ph/ |

Package: `docs/operations/PH_V1_ENTRY_STAY_RELEASE.md`

### Claim helper unlock text (after snapshots)
Under **Snapshot-gated PH v1 helpers**:
- Unlocked link looks like: **Load Claim A / PH-IMM-001**
- Locked span looks like: **Claim B locked / capture PH-IMM-003**

Submit on claim form: **Save claim and citation draft**

---

## Session wrap — 2026-07-23 (prior)

### Human progress
- **MFA enrolled** on `brenden@elsewhereplan.com` (Google Authenticator)
- After logout/login, session starts **AAL1** → Settings “Verify this session” → **AAL2**

### Shipped on `main` (still true)
- `7c51974` — Fix `/admin`↔`/login` redirect loop
- `bfbccf4` — MFA success/notice contrast
- Prior: Phase A PH admin tooling, MFA UI, strategic edge docs

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
| Admin access (no redirect loop) | Live |
| PH admin Phase A operator tools | Live |
| PH capture progress | **1/3 snapshots (001 done)** |
| Country portals PH/TH/MX | Preview; **no MFA-published claims yet** |
| Editorial schema (9 migrations) | Live; worker not provisioned |
| Self-hosted Earth | Live; checksums locked |
| Corridor Brief / Resend | Live |
| Guardrails + `pnpm check:release` | Live |

---

## What is explicitly not done

1. Capture **PH-IMM-003** and **PH-IMM-010** snapshots
2. Claim A–C drafts + `next_action` draft
3. Source/claim/release reviews + MFA publish of PH Entry/Stay
4. Weekly “one thing before Sunday” on plan/dashboard (Phase B)
5. Source-monitor auto-stale worker; Apple / Facebook; TH/MX; mobile polish

---

## MFA — how it works now (already enrolled)

Factor is enrolled. **Each new login** may be AAL1 until you step up:

1. https://elsewhereplan.com/app/settings → **Verify this session** → 6-digit code → **AAL2 verified**
2. Or `/admin` step-up box if shown
3. Do **not** click Add authenticator unless rotating a compromised secret

---

## PH content autopilot (human vs AI)

**“Staff”** = you with active `staff_memberships` + MFA. Agents are not staff.

### What only a human must do
1. Step up to AAL2 each session as needed
2. Skim live official URL + paste exact text → **Retain exact evidence**
3. Approve / MFA-publish
4. Smoke the public portal

### What AI / Cursor can do
- Fetch official pages into `outputs/ph-v1-evidence/*.capture-paste.txt`
- Walk click-by-click with exact UI labels
- Prefill Claim A–C / next_action helpers after snapshots exist
- **Cannot:** invent snapshot text; skip MFA; publish; claim “you qualify”

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

1. **Human** — finish captures 003 + 010 → Claim A–C + next_action → review → MFA publish
2. Weekly next-action on plan/dashboard (“one thing before Sunday”) — Phase B, after publish
3. Source-monitor (detect/stale only) with explicit decision
4. Facebook when Meta ads start; Apple when budget allows
5. Mobile scroll retest on a real phone when available

Run `pnpm check:guardrails` during work; `pnpm check:release` before ship.

**CEO Message for next resume:** 001 is attested — capture 003 then 010 with the paste files, then unlock Claim helpers; do not reopen encyclopedia scope before first PH publish.
