# Elsewhere — Handoff Notes (Work ↔ Home)

**Last updated:** 2026-07-13 (work PC end-of-day)  
**Brand:** Elsewhere (public) · local folder still `expat-atlas`  
**Repo (GitHub):** https://github.com/ltvaughan19/elsewhere-app  
**Live (Vercel):** https://expat-atlas-web.vercel.app  
**Also live (legacy Vite landing):** https://elsewhere-mu.vercel.app — archive after Next landing parity  
**Quiz prototype:** https://elsewhere-app-theta.vercel.app — merge into this monorepo (source not on work PC)

---

## Dual-PC rule (non-negotiable)

You build from **work** and **home**. End of every session:

1. Commit meaningful work  
2. **Push to `origin/main`** (or your feature branch)  
3. Update this file’s “Last session” section if anything non-obvious happened  

Next machine: `git pull origin main` before coding.

Do **not** leave unpushed work on either PC overnight.

---

## Last session (2026-07-13 — work)

### Shipped / committed in this push

- Elsewhere foundation docs (`docs/plans/*`)
- Dark design tokens + Instrument Serif / Outfit
- User-facing rebrand Expat Atlas → Elsewhere
- New cinematic `/` landing (brand-first, Fit Quiz CTA, PH/TH/MX corridors)
- **Spline Earth** on `/` (locked scene URL from Vite Elsewhere; idle spin; CSS globe if reduced-motion/fail)
- App shell demo: `/app/*` (onboarding quiz, dashboard, plan, etc.) — localStorage, no Supabase yet
- Corridors page + source claim UI pieces
- CI workflow `.github/workflows/ci.yml`
- Partner application form, report outdated stub, sticky mobile CTA
- **GitHub rename approved** — YOU rename in Settings (steps in YOUR queue)

### Package names

Still `@expat-atlas/*` internally. Rename to `@elsewhere/*` later with GitHub repo rename.

### Not done yet

- [ ] Scroll-scrub cinematic camera (port rest of Vite `splineScene.js`)
- [ ] Port elsewhere-app Fit Quiz / Path / Checklist source into Next
- [ ] Supabase project + real auth
- [x] GitHub rename `expat-atlas` → `elsewhere-app` (YOU chose this name)  
- [ ] Single Vercel project + production domain
- [ ] Update GitHub repo description/README residual “Expat Atlas” copy on GitHub

---

## Start-of-day checklist (either PC)

```powershell
# Work PC Path bootstrap (if needed)
$env:Path += ";$env:USERPROFILE\.local\node\node-v24.18.0-win-x64"
$env:Path += ";$env:USERPROFILE\AppData\Local\Programs\Git\cmd"

cd C:\Users\brenden.vaughan\expat-atlas   # adjust home path
git pull origin main
pnpm.cmd install                          # or pnpm install on home
pnpm.cmd dev
```

Open http://localhost:3000 — confirm Elsewhere landing + Start Fit Quiz.

---

## End-of-day checklist (either PC)

```powershell
cd C:\Users\brenden.vaughan\expat-atlas
git status
git add -A
# write a clear message, then:
git commit -m "your message"
git push origin main
```

If you cannot push (auth), leave a note in chat and retry — do not assume the other PC has your files.

Update **Last session** above when the day ends with unfinished context.

---

## Dev commands

### Work PC (PowerShell — use `.cmd` launchers)

```powershell
cd C:\Users\brenden.vaughan\expat-atlas
$env:Path += ";$env:USERPROFILE\.local\node\node-v24.18.0-win-x64"
$env:Path += ";$env:USERPROFILE\AppData\Local\Programs\Git\cmd"

pnpm.cmd install
pnpm.cmd dev
pnpm.cmd --filter @expat-atlas/web build
```

### Home PC

```bash
cd expat-atlas   # or wherever cloned
git pull origin main
pnpm install
pnpm dev
pnpm --filter @expat-atlas/web build
```

### E2E

```powershell
cd apps\web
$env:PORT = "3005"
pnpm.cmd dev   # terminal 1

# terminal 2
$env:PLAYWRIGHT_SKIP_WEBSERVER = "1"
$env:PLAYWRIGHT_BASE_URL = "http://localhost:3005"
pnpm.cmd exec playwright test
```

---

## Work-PC caveats

| Issue | Workaround |
|-------|------------|
| `npm` / `pnpm` PSSecurityException | Use `npm.cmd` and `pnpm.cmd` |
| Node not on PATH | Portable Node at `~/.local/node/node-v24.18.0-win-x64` |
| Git not on PATH | `AppData\Local\Programs\Git\cmd` |
| Wrong directory | Repo is `...\expat-atlas` — **not** `.cursor\projects\...` |
| Port 3000 busy | `$env:PORT = "3005"` |

---

## Key product locks

| Decision | Value |
|----------|--------|
| Brand | Elsewhere |
| Surfaces | One web site · one mobile app (later) · one monorepo |
| v1 corridors | US → PH, TH, MX |
| Trust | No fake partners; no “you qualify”; source claims |
| Strategy | Wide data model, narrow published content, freemium |

Docs: `docs/plans/ELSEWHERE_FOUNDATION.md`, `BUSINESS_PLAN_AND_LAUNCH_REPORT.md`, `BUILD_CHECKLIST.md`, `STYLING_RULES.md`, `REPO_CONSOLIDATION.md`

---

## YOUR queue (blocking / external)

1. Choose production domain  
2. Create Supabase project when ready for real auth  
3. Grant elsewhere-app source access for quiz port  
4. GitHub rename (`expat-atlas` → **`elsewhere-app`**) — **done**  
5. Official immigration URLs for PH / TH / MX claims  
6. Skim Privacy / Terms before real users  

### GitHub remote (both PCs after rename)

Repo is now: **https://github.com/ltvaughan19/elsewhere-app**

```powershell
cd C:\Users\brenden.vaughan\expat-atlas
git remote set-url origin https://github.com/ltvaughan19/elsewhere-app.git
git remote -v
git pull origin main
```

Local folder can stay `expat-atlas` until you rename it.  
Do not confuse with the Vite marketing repo `ltvaughan19/Elsewhere` or the Vercel quiz `elsewhere-app-theta`.
---

## Vercel

- Root Directory = `apps/web`  
- Push to `main` deploys  
- After this push: verify `/`, `/app/onboarding`, `/corridors`, `/compare`

---

## Next coding priority (home or work)

1. Pull this push  
2. Port cinematic Earth (Spline) from Vite Elsewhere if available on that PC  
3. Or: wire Fit Quiz persistence toward corridors scoring  
4. Or: Supabase + auth scaffold  
