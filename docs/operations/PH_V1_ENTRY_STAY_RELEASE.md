# Philippines v1 Entry/Stay release package

**Status:** Editorial staging — ready for staff admin capture, review, and MFA publish  
**Date prepared:** 2026-07-17  
**Country:** Philippines (`philippines`)  
**Portal section:** `entry-and-stay`  
**Hard holds (do not include):** Digital Nomad Visa (`PH-DNV-*`), work-rights professional claims, stale BI fee tables

This package does **not** publish guidance by itself. Production publish still requires staff through `/admin/content/philippines` with source verification, claim approval, content-block approval, release QA, and MFA’d `publish_country_release`.

---

## Login policy (product lock)

Elsewhere login methods: **Email / password**, **Google** (live), **Apple**, **Facebook** (enable via `SOCIAL_LOGIN_ACTIVATION.md`). No other social providers.  
See `docs/plans/ONE_SITE_ONE_AUTH.md`.

---

## Confirmed v1 ledger IDs

| Ledger ID | Role in v1 | Canonical URL | Authority |
|-----------|------------|---------------|-----------|
| **PH-IMM-001** | Entry starting point (visa-free policy page) | `https://evisa.gov.ph/page/policy?l2=Free+to+enter+the+Philippines+without+Visa` | `official_government` |
| **PH-IMM-003** | Temporary visitor / visa-waiver pathway | `https://immigration.gov.ph/visas/visa-waiver/` | `immigration_authority` |
| **PH-IMM-010** | Official online transaction channel | `https://e-services.immigration.gov.ph/` | `immigration_authority` |

Optional contacts (only if needed for next-action block): use contact details **from the PH-IMM-010 snapshot** (not a fourth unverified URL).

---

## Snapshot capture status

| Ledger ID | Staging capture in this repo | Required before claim approval |
|-----------|------------------------------|--------------------------------|
| PH-IMM-010 | Yes — see `outputs/ph-v1-evidence/PH-IMM-010.*` (2026-07-17 agent capture) | Re-paste into admin `captureManualSnapshotAction` so evidence lives in private `source-evidence` with staff UUID path |
| PH-IMM-001 | **Blocked from this builder network** (host unreachable) | Staff must open the live URL and paste exact reviewed text into admin |
| PH-IMM-003 | **Blocked from this builder network** (host unreachable) | Staff must open the live URL and paste exact reviewed text into admin |

Builder machines that cannot reach `.gov.ph` hosts must not invent snapshot text. Only human-visible page content may enter evidence.

---

## Admin sequence (exact)

1. Sign in as staff → open `https://elsewhereplan.com/admin/content/philippines` (or local equivalent).
2. Create **three** source documents (`state: draft`), one per row above. Titles:
   - `DFA Philippine eVisa — visa-free entry policy`
   - `Bureau of Immigration — Temporary Visitor Visa / visa waiver`
   - `Bureau of Immigration — e-Services`
3. For each source: open the live URL → copy the exact text you reviewed → **Capture manual snapshot** in admin (creates private evidence + SHA-256). Prefer re-capturing PH-IMM-010 live even though a staging file exists.
4. Reviewer (different person when possible): approve each source against its snapshot (`review_source_document`).
5. Create claim drafts below (categories `entry-requirements` or `stay-options`; section `entry-and-stay`; risk `critical` for 001/003, `high` for 010 channel facts).
6. Attach primary citations with exact locator + ≤1000-char excerpt + support_note stating what the evidence does **not** support.
7. Create one content block (`next_action` or `watchouts`) that points users to verify nationality-specific rules on the official pages — never “you qualify.”
8. Compose release draft → pin claim versions + block → release QA approval → **publisher with MFA** runs publish.
9. Smoke `https://elsewhereplan.com/countries/philippines` desktop + mobile: sourced claims visible; no DNV availability claim; trust labels intact.

---

## Atomic claim drafts (paste only after matching snapshot exists)

### Claim A — PH-IMM-001 (entry-requirements)

**Statement (planning estimate / source summary):**  
The Department of Foreign Affairs Philippine eVisa site publishes a policy page describing entry to the Philippines without a visa for listed nationalities. Permitted stay length and permitted purpose are nationality-specific and must be verified on that official page for the traveler’s passport at the time of travel.

**Must not claim:** that any specific passport “qualifies,” a universal stay length, work authorization, or that tourist status permits remote work.

**Citation plan:** primary; locator = policy page heading / nationality list section as shown on the captured snapshot; support_note = “Supports existence of an official visa-free policy page and nationality-scoped rules only.”

### Claim B — PH-IMM-003 (stay-options)

**Statement:**  
The Bureau of Immigration publishes an official Temporary Visitor / visa-waiver page describing pathways related to temporary visitor status and visa waiver. Documentary requirements, permitted stay, filing location, and fees must be rechecked on that page (and related current BI materials) before acting.

**Must not claim:** current fee amounts from unrelated or dated fee pages; eligibility for a specific person; that filing online is always available.

**Citation plan:** primary; locator = page title / controlling sections in the snapshot.

### Claim C — PH-IMM-010 channel (stay-options / entry-and-stay)

**Statement:**  
The Bureau of Immigration operates an official online services dashboard at e-services.immigration.gov.ph for selected immigration transactions. Users must log in to access services. Elsewhere does not process payments or filings on behalf of users.

**Must not claim:** that every visa type is available there; that lookalike sites are official; fee amounts beyond what the current snapshot states about payment-provider surcharges.

**Citation plan:** primary; locator = “Welcome to Bureau of Immigration Online Services” / service list.

### Claim D — PH-IMM-010 tourist extension listing (stay-options)

**Statement:**  
As of the captured e-Services landing page, the dashboard lists **Tourist Visa Extension** as an online service for extending a tourist visa.

**Must not claim:** processing times, approval likelihood, or that a specific traveler may extend.

### Claim E — PH-IMM-010 visa waiver listing (stay-options)

**Statement:**  
As of the captured e-Services landing page, the dashboard lists **Visa Waiver** as an online service described there as extending a 30-day visa-free stay with a 29-day visa waiver. That description is a page listing only; travelers must confirm current eligibility and process through official BI channels before acting.

**Must not claim:** that every nationality receives a 30-day visa-free stay, or that the waiver is automatic.

### Claim F — PH-IMM-010 official contact (next-action support)

**Statement:**  
The e-Services landing page lists Bureau of Immigration customer support contact details for e-Services inquiries (direct line and email as shown on the snapshot). Prefer those contacts over unofficial third-party “processors.”

**Must not claim:** phone/email remain valid forever without a fresh snapshot.

### Content block — next action

**Title:** Start with official entry and stay channels  
**Body:** Confirm your passport’s current entry rule on the DFA eVisa policy page, then use Bureau of Immigration pages and e-Services only for the process that matches your situation. Elsewhere saves research and plans; it does not file applications or decide eligibility.

---

## Definition of done for this release

- [ ] Three sources verified with fresh snapshots in Supabase  
- [ ] Claims A–F (or a subset that has evidence) approved and pinned  
- [ ] Next-action block approved and pinned  
- [ ] MFA publish succeeded  
- [ ] Public PH page shows sourced, dated claims  
- [ ] No DNV / work / fee inventions  
- [ ] Builder handoff updated  

Until MFA publish completes, the public portal correctly remains an **editorial preview**.
