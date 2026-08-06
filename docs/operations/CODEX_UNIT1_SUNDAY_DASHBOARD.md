# Codex brief — Unit 1: Dashboard Sunday Action

**Status:** Implemented in Cursor (2026-08-05). Keep this brief for audit / follow-up only.  
**Control tower:** Cursor. Codex: idle unless pasted a delta unit.  
**North star:** *“I’m actually going — and I know the one thing to do before Sunday.”*

---

## Goal

Wire `/app/dashboard` so signed-in Free users see the published Philippines
`next_action` (Entry/Stay), not only quiz `readiness.nextStep`.

## Acceptance (done when)

- [x] Server loads published PH portal only (`publicationState === "published"`)
- [x] Hero shows next_action title + paragraphs
- [x] Trust strip: source / freshness / not legal advice
- [x] Evidence boundary copy present
- [x] CTA to `/countries/philippines#entry-and-stay`
- [x] Falls back to quiz nextStep if no published next_action
- [x] No invented official copy

## Files in scope

- `apps/web/lib/sunday-action.ts` (+ `sunday-action-types.ts`)
- `apps/web/app/app/dashboard/page.tsx`
- `apps/web/components/app-dashboard.tsx`

## Out of scope

Paid gates, streaks history UI, TH/MX, inventing claims, Earth/Spline changes.

## Stop

Do not publish content. Do not weaken MFA. Update `docs/CURRENT.md` if you change behavior.
