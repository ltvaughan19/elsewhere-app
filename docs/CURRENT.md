# Elsewhere — Current state (start here)

**Updated:** 2026-07-31 (handoff — Release 1 QA then MFA publish)  
**Repo:** https://github.com/ltvaughan19/elsewhere-app  
**Production:** https://elsewhereplan.com  
**Canonical clone:** `C:\Users\brenden.vaughan\expat-atlas`

Cursor = control tower. Codex = idle unless pasted a unit. Do not invent `.gov.ph` text.

---

## Tell Cursor (copy-paste)

```
Read docs/CURRENT.md. Resume PH v1 at Release 1 QA:
Sources verified, claims A–C + next_action approved and pinned.
Next: Approve Release 1 (notes required) → state ready → MFA Publish exact
release → smoke /countries/philippines. Exact UI labels only. Always require
Review notes on Approve.
```

---

## North star

> **“I’m actually going — and I know the one thing to do before Sunday.”**

Include **`CEO Message:`** every response. Veto encyclopedia / fake authority / tool sprawl before first PH publish.

---

## Home / next machine start

```powershell
cd C:\Users\brenden.vaughan\expat-atlas
git pull origin main
pnpm install
# recreate apps/web/.env.local from password manager if needed
pnpm --filter @expat-atlas/web dev
```

Ignore `Documents\Codex\**\elsewhere-app`.

Smoke after publish: https://elsewhereplan.com/countries/philippines

---

## Live board (browser-verified 2026-07-31 ~22:00 UTC)

https://elsewhereplan.com/admin/content/philippines

| Check | Status |
|-------|--------|
| Staff | admin can draft |
| MFA | **AAL2 ready** |
| Package sources | **0 draft / 3 verified** |
| Required snapshots | **3 of 3 captured** |
| Approved claims pinned | **3 approved versions in open releases** |
| Approved next action | **Pinned to open release** |
| Release checklist | ✓ Claim versions approved · ✓ Content versions approved |
| Release state | **Release 1 / draft** ← next human action |
| Publish UI | Not shown until release is **ready** |

### What’s done
- PH-IMM-001 / 003 / 010 sources drafted, snapshots captured, **verified** (admin self-attest migration live)
- Claims A–C drafted, approved, pinned to Release 1
- `start-with-official-entry-and-stay-channels` next_action drafted, approved, pinned
- Snapshot dropdown UX improved (ledger + title + capture label + hash)
- Claim C helper risk fixed to `critical` (stay-options floor)
- Process rule: **always fill Review notes on Approve** (even if UI allows empty)

### Snapshot hashes (paste assists)
| Ledger | Hash prefix | File |
|--------|-------------|------|
| PH-IMM-001 | `9dd656c35c` | `outputs/ph-v1-evidence/PH-IMM-001.capture-paste.txt` |
| PH-IMM-003 | `da668e376b` | `outputs/ph-v1-evidence/PH-IMM-003.capture-paste.txt` |
| PH-IMM-010 | `eb6f4697ac` | `outputs/ph-v1-evidence/PH-IMM-010.capture-paste.txt` |

---

## Exact next clicks

### 1) Approve Release 1
Nav **`4. Releases`** → **Release 1** → review form at bottom.

| Field | Value |
|-------|-------|
| **Review decision** | **`Approve`** |
| **Review notes** | paste block below |

```
Release QA: 3 verified PH sources with snapshots; claims A–C and next_action approved and pinned; wording stays within official-channel bounds; no eligibility/fee gospel; ready for MFA publish.
```

Check all five: Accuracy · Evidence is current · Links and locators · Plain language · Authority level.

**`Record permanent review`**

Success: Release 1 state → **ready**; publish box appears.

### 2) MFA publish
Confirm session still **AAL2** (Settings → Verify this session if needed).

On Release 1 publish form:
- Check: **I understand this replaces the current public release while preserving its immutable history.**
- **`Publish exact release`**

Success notice should confirm publish. Smoke: https://elsewhereplan.com/countries/philippines

### If publish errors
Paste the **exact red banner** into Cursor. Common causes: release not `ready`, AAL1 session, source verification freshness, policy checks on citations.

Hard holds: no DNV, no “you qualify,” no stale fees as gospel.

---

## Shipped on `main` this arc (keep)

| Commit | What |
|--------|------|
| `f866230` | Admin source self-attest migration + CURRENT |
| `4ec5f90` | Claim C risk → critical; snapshot labels; mid-capture handoff |
| `43967cd` | Capture paste assists 001/003/010 |

Migration applied to production: `20260731143000_admin_source_self_attest`  
(Non-admin authors still cannot approve their own sources; admins can; audit `selfAttestedByAdmin`.)

---

## Do not reopen

- Encyclopedia / peer-review catalog before first PH publish
- Skool / community / Stage 1 ads before free wedge is used
- Fake second reviewer
- Re-capturing 001/003/010 unless source goes stale
- Re-approving claims that already show **Approved**

---

## After first publish (Phase B — parked until smoke passes)

1. Warm users try Sunday Action / official next step
2. Weekly habit on plan/dashboard
3. Source-monitor worker (detect → stale → re-attest)
4. TH/MX later

Codex: idle unless Cursor pastes a unit.

---

## Doc map

| Path | Role |
|------|------|
| **`docs/CURRENT.md`** | **This file — start here** |
| `HANDOFF.md` | Thin dual-PC pointer |
| `docs/operations/PH_V1_ENTRY_STAY_RELEASE.md` | Claim package wording |
| `docs/plans/PRODUCT_CLARITY_MAP.md` | North star + strategic edge |

**CEO Message for resume:** Release QA with notes, then MFA publish — the free wedge is one Approve away from public.
