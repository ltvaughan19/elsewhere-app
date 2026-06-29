# Expat Atlas — Handoff Notes

**Last updated:** 2026-06-29  
**Repo:** `C:\Users\brenden.vaughan\expat-atlas`  
**GitHub:** https://github.com/ltvaughan19/expat-atlas  
**Live (Vercel):** https://expat-atlas-web.vercel.app

---

## What shipped (Phase 1 / GStack Sprint 2)

| Route / feature | Status |
|-----------------|--------|
| `/compare` | Functional side-by-side country picker |
| `/visa-compass` | Seed visa cards with trust badges |
| `/pricing` | Tier UI (no Stripe) |
| `/housing`, `/property`, `/insurance`, `/community`, `/blog` | Marketing stubs |
| `not-found.tsx` | Custom 404 |
| Budget + passport tools | Interactive (localStorage for passport) |
| Monorepo packages | `types`, `ui` (VisaCard), `db`, `source-engine` |
| SEO | `robots.ts`, `sitemap.ts` (25 routes) |
| Tests | 6 Playwright smoke tests in `apps/web/e2e/` |

**Build:** `pnpm --filter @expat-atlas/web build` — 25 static routes, passes.

---

## Dev commands

### Work PC (PowerShell — use `.cmd` launchers)

```powershell
cd C:\Users\brenden.vaughan\expat-atlas
$env:Path += ";$env:USERPROFILE\.local\node\node-v24.18.0-win-x64"
$env:Path += ";$env:USERPROFILE\AppData\Local\Programs\Git\cmd"

pnpm.cmd install
pnpm.cmd dev                              # from repo root → http://localhost:3000
pnpm.cmd --filter @expat-atlas/web build  # production build check
```

### E2E tests (dev server must be running)

```powershell
cd apps\web
$env:PORT = "3005"
pnpm.cmd dev   # in one terminal

# second terminal:
$env:PLAYWRIGHT_SKIP_WEBSERVER = "1"
$env:PLAYWRIGHT_BASE_URL = "http://localhost:3005"
pnpm.cmd exec playwright test
```

### Home PC (normal Node/Git install)

```bash
cd expat-atlas
pnpm install
pnpm dev
pnpm --filter @expat-atlas/web build
cd apps/web && pnpm test:e2e
```

---

## Work-PC caveats

| Issue | Workaround |
|-------|------------|
| `npm` / `pnpm` PSSecurityException | Use `npm.cmd` and `pnpm.cmd` |
| Node not on PATH | Portable Node at `~/.local/node/node-v24.18.0-win-x64` — add to user PATH or prepend per session |
| Git not on PATH | `AppData\Local\Programs\Git\cmd` |
| Wrong directory | Always `cd` to `C:\Users\brenden.vaughan\expat-atlas` — **not** the Cursor metadata folder under `.cursor\projects\` |
| `next start` error | Use `pnpm dev` for local preview; Vercel handles production |
| Port 3000 busy | Set `$env:PORT = "3005"` before `pnpm.cmd dev` |

---

## Vercel deploy checklist

1. **Root Directory** in Vercel project settings = `apps/web`
2. **Build config** lives in `apps/web/vercel.json`:
   - `installCommand`: `cd ../.. && pnpm install`
   - `buildCommand`: `cd ../.. && pnpm turbo build --filter=@expat-atlas/web`
3. **Root `vercel.json` removed** — it caused failed builds from repo root
4. **Git push to `main`** triggers auto-deploy via GitHub integration
5. After deploy, verify:
   - https://expat-atlas-web.vercel.app/compare — country picker (not "Coming in Phase 1" stub)
   - `/visa-compass` — visa cards with "Needs verification" badges
   - `/pricing` — Free / Explorer / Builder tiers

### If deploy fails

- Confirm Vercel is linked to `ltvaughan19/expat-atlas` and branch `main`
- Check build logs for missing workspace packages (monorepo install must run from root)
- Env vars: none required for Phase 1 public site

---

## Phase 2 kickoff (GStack: autoplan → execute)

**Goal:** Authenticated app shell — users sign up, complete readiness quiz, see dashboard.

| Step | Task |
|------|------|
| 1 | Create Supabase project; add env vars to Vercel + `.env.local` |
| 2 | Drizzle migrations from `packages/db` |
| 3 | Supabase Auth (email magic link or password) |
| 4 | `/app/onboarding` — readiness quiz |
| 5 | `/app/dashboard`, `/app/my-plan`, persisted budget + passport |
| 6 | Feature gates by plan tier (metadata only; no live Stripe) |

**GStack commands:** `office-hours` (if wedge changes) → `autoplan` → `plan-eng-review` → build → `review` → `qa` → `ship`

**CEO HOLD SCOPE (unchanged):** No fake partners, no live payments, no AI visa advice until RAG + source claims.

---

## Key docs

- `ROADMAP.md` — phase progress
- `docs/plans/GSTACK_EXECUTION_PLAN.md` — GStack decisions
- `AGENTS.md` — trust rules for AI agents
- `ARCHITECTURE.md` — stack and routes

---

## When you're home

1. Pull latest: `git pull origin main`
2. Open https://expat-atlas-web.vercel.app/compare — confirm Sprint 2 is live
3. Install Node LTS + pnpm normally if you want faster dev (optional)
4. Run `pnpm dev` and click through `/compare`, `/visa-compass`, `/pricing`
5. Start Phase 2: create Supabase project, copy connection string to `.env.local`
6. In Cursor, say: **"Use gstack autoplan for Phase 2 — Supabase auth and /app shell"**
