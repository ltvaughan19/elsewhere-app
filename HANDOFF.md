# Elsewhere — Dual-PC handoff

**Canonical current state:** [`docs/CURRENT.md`](./docs/CURRENT.md)  
**Latest lengthy handoff:** [`docs/operations/HANDOFF_2026-08-06.md`](./docs/operations/HANDOFF_2026-08-06.md)  
**Do not** maintain a second competing status narrative in this file.

---

## Dual-PC rule

End of every session:

1. Commit meaningful work (never `.env.local`)
2. `git push origin main` (or the feature branch you’re on)
3. Update `docs/CURRENT.md` if priorities or architecture changed

Next machine: **`git pull origin main` first**, then read `docs/CURRENT.md`.

---

## Home PC quick start

```powershell
cd C:\Users\brenden.vaughan\expat-atlas
git pull origin main
pnpm install
pnpm --filter @expat-atlas/web dev
```

Full smoke checklist and next priorities: **`docs/CURRENT.md`**.

**2026-08-06 wrap:** Proof scope locked (PH only). Stripe Step 1 in code —
finish test keys + Checkout smoke, then feature gates. FX rates decided
(scheduled API, all corridors) — build after Stripe Steps 1–2. Say
**“continue from HANDOFF_2026-08-06”**. Cursor = control tower; Codex idle.

---

## Ignore on this PC

- `Documents\Codex\**\elsewhere-app` — stale Codex worktrees, not the product
- `apps/web/.env.local` — secrets; never commit
