# Elsewhere — Dual-PC handoff

**Canonical current state:** [`docs/CURRENT.md`](./docs/CURRENT.md)  
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

**2026-07-21 resume:** MFA enroll UI should be on `main`. First human steps =
Account security on `/app/settings` → enroll Google Authenticator → AAL2 on
`/admin` → PH capture. Cursor is the control tower; Codex only for briefed builds.

---

## Ignore on this PC

- `Documents\Codex\**\elsewhere-app` — stale Codex worktrees, not the product
- Any second clone that is not tracking `origin/main`

---

## Ops deep-dives

| Need | Doc |
|------|-----|
| Release checks | `docs/operations/QUALITY_GATES.md` |
| Apple / Facebook enable | `docs/operations/SOCIAL_LOGIN_ACTIVATION.md` |
| PH first claims | `docs/operations/PH_V1_ENTRY_STAY_RELEASE.md` |
| Codex PH build brief | `docs/operations/CODEX_PH_V1_BUILD_PACKET.md` |
| Source monitor | `docs/operations/SOURCE_MONITOR_RUNBOOK.md` |
