# Elsewhere — Current state (start here)

**Updated:** 2026-07-31 (admin source self-attest live; resume source Approve)  
**Repo:** https://github.com/ltvaughan19/elsewhere-app  
**Production:** https://elsewhereplan.com  
**Canonical clone:** `C:\Users\brenden.vaughan\expat-atlas`

Cursor = control tower. Codex = idle unless pasted a unit. Do not invent `.gov.ph` text.

---

## Tell Cursor (copy-paste)

```
Read docs/CURRENT.md. Resume PH v1: approve 3 sources (admin self-attest
migration is live), then approve claim A/B/C versions, next_action block,
then Release 1 → MFA publish. Exact UI labels only.
```

---

## 2026-07-31 — admin source self-attest

**Decision:** Option A — solo MFA publisher may self-approve sources as **admin**.

**Shipped:** migration `20260731143000_admin_source_self_attest` applied to production.
- Non-admins still cannot approve sources they authored.
- Admins can; audit sets `selfAttestedByAdmin: true`.

**Board now:** Claim C exists + pinned (Release 1 = 3 claims + next_action).  
**Next:** Approve three sources → claims → block → release → MFA publish.

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

---

## DB-verified board (2026-07-28 evening)

Queried production Supabase (`kjrmtklvfecvzlhlzuaf`). Do not trust memory over this table.

### Sources (all draft, all have 1 snapshot)

| Ledger | Title | Snapshot hash (prefix) |
|--------|-------|------------------------|
| PH-IMM-001 | DFA Philippine eVisa — visa-free entry policy | `9dd656c35c` |
| PH-IMM-003 | BI Temporary Visitor Visa / visa waiver | `da668e376b` |
| PH-IMM-010 | BI e-Services | `eb6f4697ac` |

### Claims

| Slug | Exists? | State |
|------|---------|-------|
| `dfa-visa-free-policy-page` | **Yes** | draft v1 |
| `bi-temporary-visitor-visa-waiver-page` | **Yes** | draft v1 |
| `bi-official-online-services-channel` | **NO — never saved** | — |

### Content

| Slug | Exists? |
|------|---------|
| `start-with-official-entry-and-stay-channels` (next_action) | **Yes** draft v1 |

### Release 1

- State: **draft**
- Notes: `Initial source-backed portal release.`
- Pinned claims: **2** (A + B only)
- Pinned blocks: **1** (next_action)
- Approved: **0 / 0**

### Operator readiness (expected UI)

- Package sources: Ready (3 draft / 0 verified)
- Required snapshots: Ready (3 of 3)
- Approved claims pinned: Blocked
- Approved next action: Blocked
- Release state: Blocked (Release 1 / draft)
- MFA: was AAL2 when last confirmed

### Postgres log clue

Repeated: `duplicate key value violates unique constraint "release_claim_versions_pkey"` — user re-pinned A/B while Claim C missing. Harmless; ignore if red banner mentions duplicate.

---

## Root cause — Claim C save failure (locked)

`claim_categories.stay-options` has `default_risk_level = critical`.

`createClaimDraftAction` rejects any risk **below** category default:

> "This category requires at least critical risk handling."

Claim C helper previously set `riskLevel: "high"`. Form looked filled; Save redirected with error (easy to miss). **Claim C never entered DB.**

**Code fix (local / to ship):** `apps/web/lib/editorial/ph-v1.ts` Claim C `riskLevel` → `"critical"`.

**Until production deploy:** on the Claim C form set **Risk** dropdown to **`Critical impact`** (not High impact), then Save.

Also note: `US, CA, GB` / `tourism, retirement` on Citizenship / Purposes are **HTML placeholders**, not values. Leave empty.

Snapshot dropdown (pre-label-fix deploy): pick hash **`eb6f4697ac`** for Claim C.

---

## Exact next clicks (do in order)

### 1) Create Claim C (blocked step)

1. https://elsewhereplan.com/admin/content/philippines  
2. AAL2 if needed (Settings → Verify this session)  
3. Nav **`2. Claims`** → **`Load Claim C / PH-IMM-010`**  
4. Set required dropdowns:

| Field | Value |
|-------|-------|
| **Claim category** | `Legal stay options · entry-and-stay` |
| **Matching portal section** | `Entry and legal stay` |
| **Risk** | **`Critical impact`** ← mandatory |
| **Confidence** | `Low — unresolved or incomplete` |
| **Primary source** | `Bureau of Immigration — Bureau of Immigration — e-Services · draft` |
| **Exact retained evidence** | ends with **`eb6f4697ac`** |
| **Exact locator** | `"Welcome to Bureau of Immigration Online Services" and service list` |
| **Evidence boundary note** | helper text about official channel only / not every visa type |

5. Leave citizenship + purposes empty (placeholder ghosts OK)  
6. **`Save claim and citation draft`**  
7. Success banner must say: **Claim, first version, and exact primary citation saved atomically as a draft.**  
8. Card appears: **`bi-official-online-services-channel`**

If red banner: **copy the exact text** into Cursor.

### 2) Pin Claim C to Release 1

Nav **`4. Releases`** → **Add a claim version**:

| Field | Value |
|-------|-------|
| **Draft release** | `Release 1 · draft` |
| **Exact claim version** | `bi-official-online-services-channel · v1 · draft` |
| **Sort order** | `30` |

**`Pin claim version`** → Release 1 **Claims** counter = **3**.

Do **not** create a new release.

### 3) Reviews (after Claims = 3)

Approve in this order (each uses **Review decision** + checkboxes + **Record permanent review**):

1. Three sources (under **1. Sources**) → approve / verify per ReviewForm  
2. Three claim versions (under each claim card) → approve  
3. next_action block version → approve  
4. Release 1 review → approve / mark ready  

Exact decision labels: see `REVIEW_DECISIONS` in `apps/web/app/admin/content/constants.ts`.

### 4) MFA publish (last)

Only when Release 1 is **ready** and session is **AAL2**:

- Checkbox: confirm replace public release  
- **`Publish exact release`**  
- Smoke: https://elsewhereplan.com/countries/philippines  

Hard holds: no DNV claims, no “you qualify,” no stale fees as gospel.

---

## Paste assists (repo)

| File | Status |
|------|--------|
| `outputs/ph-v1-evidence/PH-IMM-001.capture-paste.txt` | Attested (hash `9dd656c35c`) |
| `outputs/ph-v1-evidence/PH-IMM-003.capture-paste.txt` | Attested (`da668e376b`) |
| `outputs/ph-v1-evidence/PH-IMM-010.capture-paste.txt` | Attested (`eb6f4697ac`) |

---

## Code / UX fixes in flight (not required to unblock Claim C manually)

1. Claim C helper risk → `critical` (`ph-v1.ts`) — **must commit/deploy**  
2. Snapshot option labels include ledger + title + capture label (`[countrySlug]/page.tsx`) — local; deploy when shipping  
3. Optional later: surface server action errors more visibly; filter snapshot dropdown by selected primary source

---

## What is live / not done

| Area | Status |
|------|--------|
| MFA + staff admin | Live |
| PH sources + 3 snapshots | Live |
| Claims A + B + next_action | Draft |
| Claim C | **Missing — create with Critical risk** |
| Release 1 pin complete | No (2/3 claims) |
| Reviews + MFA publish | Not started |
| Phase B Sunday habit UI | Parked |
| Codex | Idle |

---

## Doc map

| Path | Role |
|------|------|
| **`docs/CURRENT.md`** | **This file — start here** |
| `docs/operations/PH_V1_ENTRY_STAY_RELEASE.md` | Claim package wording |
| `HANDOFF.md` | Thin dual-PC pointer |
| `docs/plans/PRODUCT_CLARITY_MAP.md` | North star + strategic edge |

**CEO Message for resume:** Claim C failed on risk floor (High &lt; Critical for stay-options) — set Critical, save, pin to Release 1, then review/publish; do not reopen scope.
