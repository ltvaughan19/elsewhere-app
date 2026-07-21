# Codex build packet — PH v1 Entry/Stay

**Updated:** 2026-07-21  
**Owner direction:** Plan here in Cursor; Codex executes this packet.  
**North star:** *“I’m actually going — and I know the one thing to do before Sunday.”* Leaving is the metric.

---

## Paste this into Codex first (verbatim)

```
Read these files in order before changing anything, then follow the build scope below:

1. docs/CURRENT.md
2. docs/operations/CODEX_PH_V1_BUILD_PACKET.md  (this file — authoritative for this build)
3. docs/operations/PH_V1_ENTRY_STAY_RELEASE.md
4. docs/plans/PRODUCT_CLARITY_MAP.md §0 (north star only)
5. apps/web/app/admin/content/actions.ts
6. apps/web/app/admin/content/[countrySlug]/page.tsx
7. apps/web/lib/auth/staff.ts

Rules you must not break:
- Never invent .gov.ph page text, nationality lists, stay lengths, fees, or “you qualify.”
- Never bypass MFA, review checklists, or publish gates.
- Never treat outputs/ph-v1-evidence as published truth (staging aids only).
- Do not casual-edit Earth/Spline camera or scene binary.
- Update docs/CURRENT.md when you finish a meaningful unit.

Then implement Phase A in this packet. Stop for human capture/MFA before any publish attempt.
```

After every meaningful unit of work, re-read `docs/CURRENT.md` and this packet before continuing.

---

## Where we are (truth)

| Fact | Status |
|------|--------|
| Repo / production | `elsewhereplan.com` · GitHub `ltvaughan19/elsewhere-app` · local folder often `expat-atlas` |
| Architecture | One Next app + one Supabase · auth continuity live · Google login live |
| Earth | Self-hosted `/earth/scene.splinecode` · logo false · locked · leave alone |
| Mobile scroll | Improved, still imperfect · **parked** · do not reopen |
| Editorial schema | 9 migrations applied in production |
| Philippines public portal | **Preview** — structure live, **no MFA-published claims** |
| Production PH content rows (2026-07-21 read) | **0 sources, 0 claims, 0 blocks** · draft release #1 empty |
| Staff | One active `admin` membership exists · **no verified MFA factor yet** |
| Weekly “one thing before Sunday” | **Not built** · dashboard uses quiz `nextStep`, not published `next_action` |

Canonical day-to-day handoff: **`docs/CURRENT.md`**. Do not invent competing handoff files.

---

## What recently changed (do not redo)

- Self-hosted Earth + logo lock + guardrails
- Question-tag late scroll fade
- Native mobile scroll / WebGL sleep past hero
- Docs cleanup → `docs/CURRENT.md` + `docs/archive/2026-07/`

---

## Direction for this Codex build

### Phase A — Make PH v1 publishable for a solo operator (build this)

Goal: Brenden can move from empty preview → MFA-published Entry/Stay claims **without Codex inventing facts**.

Build extensively around the **existing** admin workflow at `/admin/content/philippines`. Do **not** replace the publish RPC or weaken gates.

#### A1. Operator readiness surface (admin)

On `/admin` and/or `/admin/content/philippines`, add a clear **PH v1 Entry/Stay readiness panel** that shows live checks:

1. Staff role present
2. MFA / `aal2` ready (or explicit “enable MFA before publish”)
3. Count of draft/approved sources for PH
4. Snapshots present per required ledger ID
5. Approved claim versions pinned to a draft/ready release
6. Approved `next_action` block pinned
7. Release state (`draft` / `ready` / published)

Use existing tables/actions; prefer read-only SQL via the signed-in staff client.

#### A2. Package bootstrap (draft only)

Add an admin action (staff author role) that creates **draft** `source_documents` for:

| Ledger | Title | URL | Authority |
|--------|-------|-----|-----------|
| PH-IMM-001 | DFA Philippine eVisa — visa-free entry policy | `https://evisa.gov.ph/page/policy?l2=Free+to+enter+the+Philippines+without+Visa` | `official_government` |
| PH-IMM-003 | Bureau of Immigration — Temporary Visitor Visa / visa waiver | `https://immigration.gov.ph/visas/visa-waiver/` | `immigration_authority` |
| PH-IMM-010 | Bureau of Immigration — e-Services | `https://e-services.immigration.gov.ph/` | `immigration_authority` |

Rules:

- Insert **draft** only; never mark reviewed/approved.
- Idempotent (do not duplicate if same canonical URL already exists for PH).
- Do **not** upload snapshots or invent `reviewed_text`.

#### A3. Claim / block draft helpers (after snapshot exists)

After a human captures a snapshot in admin:

- Prefill claim forms from `PH_V1_ENTRY_STAY_RELEASE.md` Claims A–C first (minimum viable release).
- Claims D–F only if PH-IMM-010 snapshot exists and wording stays within “page lists X” bounds.
- Prefill one `next_action` content block from that doc.
- Every claim must require: source + snapshot + exact locator + support_note of what evidence does **not** support.
- Never auto-approve.

#### A4. Human gates stay hard

Keep / document in UI:

1. Human opens live URL and pastes exact reviewed text → `captureManualSnapshotAction`
2. Reviewer/admin approves source / claim / block / release via existing review RPCs
3. Publisher/admin with **MFA (`aal2`)** runs `publishCountryReleaseAction`

Codex may improve copy, validation messages, and empty states — not skip steps.

#### A5. Public preview honesty

If still unpublished: Philippines portal must remain clearly **preview / research leads**, not implied verified claims. Fix any wording that overstates readiness.

#### A6. Tests

Add focused tests where cheap:

- Bootstrap creates 3 drafts and is idempotent
- Readiness panel reflects missing MFA / missing snapshots
- Publish action still rejects `aal1`
- Guardrails still pass (`pnpm check:guardrails`)

### Phase B — Deferred until Phase A publish works

**Do not start unless owner explicitly says so.**

- Weekly dashboard habit UI (“one thing before Sunday”)
- Auto-wiring published `next_action` into `/app/dashboard` (schemas are currently disconnected: portal releases vs `user_plans` JSON)
- TH/MX content
- Source-monitor worker
- Apple / Facebook enablement
- Mobile scroll further tuning
- Earth markers / Earth camera edits

---

## Exact files to treat as source of truth

| Area | Path |
|------|------|
| Handoff | `docs/CURRENT.md` |
| This packet | `docs/operations/CODEX_PH_V1_BUILD_PACKET.md` |
| PH package | `docs/operations/PH_V1_ENTRY_STAY_RELEASE.md` |
| Staging aids only | `outputs/ph-v1-evidence/*` |
| Admin UI | `apps/web/app/admin/content/[countrySlug]/page.tsx` |
| Admin actions | `apps/web/app/admin/content/actions.ts` |
| Roles | `apps/web/app/admin/content/constants.ts` |
| Staff gate | `apps/web/lib/auth/staff.ts` |
| Public portal queries | `apps/web/lib/country-portals/queries.ts` |
| Publish RPC | migrations / `publish_country_release` |

---

## Human checklist (owner — Codex cannot finish this alone)

- [ ] Enable MFA on the staff admin account in Supabase Auth
- [ ] Open PH-IMM-001 / 003 / 010 live in a browser and capture exact text in admin
- [ ] Approve sources → claims → next_action block → release QA
- [ ] MFA publish
- [ ] Smoke `https://elsewhereplan.com/countries/philippines`

Hard holds forever for this release: Digital Nomad Visa claims, work-rights claims, stale fee tables, “you qualify.”

---

## Definition of done (Phase A)

- [ ] Readiness panel shows real blockers (especially MFA + missing snapshots)
- [ ] One staff action bootstraps the three draft sources without inventing evidence
- [ ] Claim/block helpers only unlock after a real snapshot is selected
- [ ] Existing review + MFA publish path unchanged and still enforced
- [ ] `pnpm check:guardrails` passes
- [ ] `docs/CURRENT.md` updated with what shipped and what remains human

---

## Working agreement (Cursor ↔ Codex)

1. Cursor owns product direction and updates this packet / `CURRENT.md`.
2. Codex builds Phase A extensively, then stops at human capture/MFA.
3. If Codex discovers a trust-gate bug, **fix the gate to be clearer**, never weaker.
4. If scope creeps toward dashboard weekly habit, park it and ask — that is Phase B.
