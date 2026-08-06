# Philippines Overview thin release (Release 2 candidate)

**Status:** Operator package ready — human admin walk required before MFA publish  
**Date:** 2026-08-05  
**Country:** Philippines (`philippines`)  
**Portal section:** `overview`  
**Depends on:** PH Release 1 Entry/Stay (PH-IMM-001 snapshot already attested)

This package does **not** invent new `.gov.ph` text. It reuses the attested DFA eVisa
policy evidence (PH-IMM-001) for one Overview watchout claim + one watchouts CTA
block that points to Sunday Action and the Fit Quiz.

---

## Free-product intent

Overview should orient, then send the user to the published Entry/Stay Sunday Action.
Do not publish a fake fit score or eligibility language.

---

## Admin sequence

1. Sign in as staff with AAL2 available → `/admin/content/philippines`
2. Confirm **PH Overview thin / Release 2 readiness** shows PH-IMM-001 snapshot present
3. Claims → **Load Overview watchout / PH-IMM-001** → Save claim and citation draft
4. Review → Approve with **Review notes** filled → pin to an open draft release
5. Content → **Load Overview watchouts draft** → Save content draft
6. Approve block → pin to the same release
7. Release QA → MFA **Publish exact release**
8. Smoke `/countries/philippines#overview` — Overview shows Reviewed content; Entry/Stay unchanged

---

## Claim + block (helpers)

| Piece | Slug | Section | Notes |
|-------|------|---------|-------|
| Claim | `verify-entry-before-treating-fit-as-settled` | `overview` / `editorial-context` | Cites PH-IMM-001 |
| Block | `orient-then-verify-official-entry` | `overview` / `watchouts` | Links habit to Entry/Stay + Fit Quiz |

Source code: `apps/web/lib/editorial/ph-overview-v1.ts`

---

## Hard holds

- Do not invent nationality lists, stay lengths, fees, or “you qualify”
- Do not bulk-fill Money/Housing in the same release
- Do not publish Overview before warm users have seen Entry/Stay Sunday Action (product gate; tech allows draft anytime)

**CEO Message:** Overview is a thin on-ramp to the leaving habit — not a second encyclopedia shelf.
