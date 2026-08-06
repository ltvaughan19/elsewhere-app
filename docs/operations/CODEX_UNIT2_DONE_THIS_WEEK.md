# Codex brief — Unit 2: Done this week persist

**Status:** Implemented in Cursor (2026-08-05). Keep this brief for audit / follow-up only.  
**Control tower:** Cursor. Codex: idle unless pasted a delta unit.  
**North star:** *“I’m actually going — and I know the one thing to do before Sunday.”*

---

## Goal

Persist “Done this week?” for authenticated users with the **smallest schema**:
optional fields inside existing `user_plans.plan` JSON (no new table).

## Acceptance (done when)

- [x] `SundayActionProgress` on `UserPlan` (`completedWeekKey`, `completedAt`, `actionSlug`, `countrySlug`)
- [x] ISO week key helper (`apps/web/lib/sunday-week.ts`)
- [x] Dashboard button marks current week + current action slug
- [x] Saves via existing `persistPlan` → localStorage + `user_plans` upsert when authed
- [x] Shows “Done this week” when week key + action slug match
- [x] Guests: local only (same persist path; cloud no-ops without session)

## Files in scope

- `packages/types/src/index.ts`
- `apps/web/lib/sunday-week.ts`
- `apps/web/components/app-dashboard.tsx`
- `apps/web/lib/plan-store.ts` (reuse only — no schema migration)

## Out of scope

Streak history UI, paid continuity features, push notifications, new DB tables.

## Stop

No migrations unless Cursor explicitly expands scope. Update `docs/CURRENT.md` if behavior changes.
