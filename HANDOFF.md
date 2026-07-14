# Elsewhere — Handoff Notes (Work ↔ Home)

**Last updated:** 2026-07-14 (work PC — Supabase live + domain)  
**Brand:** Elsewhere (public) · product URL brand can stay Elsewhere; domain is **elsewhereplan.com**  
**Local folder:** often still `expat-atlas`  
**Repo (GitHub):** https://github.com/ltvaughan19/elsewhere-app  
**Live (Vercel):** https://expat-atlas-web.vercel.app  
**Domain (Squarespace):** **elsewhereplan.com** + Google Workspace `brenden@elsewhereplan.com` (logged in / activated)  
**Legacy Vite landing:** https://elsewhere-mu.vercel.app — retire when Next `/` is trusted forever  
**Quiz prototype:** https://elsewhere-app-theta.vercel.app — absorb polish later  

**Start here if context is fuzzy:** [`docs/plans/PRODUCT_CLARITY_MAP.md`](./docs/plans/PRODUCT_CLARITY_MAP.md)  
**One site / one auth:** [`docs/plans/ONE_SITE_ONE_AUTH.md`](./docs/plans/ONE_SITE_ONE_AUTH.md)  
**Email + Supabase decisions:** [`docs/plans/EMAIL_AND_SUPABASE.md`](./docs/plans/EMAIL_AND_SUPABASE.md)

---

## Dual-PC rule (non-negotiable)

End of every session:

1. Commit meaningful work  
2. **Push to `origin/main`**  
3. Update this file’s “Last session” if anything non-obvious happened  

Next machine: **`git pull origin main` first.**

---

## Last session (2026-07-14 — work PC)

### Shipped / done

- Next `/` matches elsewhere-mu behavior (Spline camera, question tags, Lenis/GSAP) — see recent commits  
- **Waitlist removed.** Primary CTA = **Start Fit Quiz**. Email = free **Corridor Brief**; paid digest = Explorer perk  
- `/api/newsletter` (+ waitlist shim); forms wired  
- **Supabase project live:** `kjrmtklvfecvzlhlzuaf`  
  - URL: `https://kjrmtklvfecvzlhlzuaf.supabase.co`  
  - Tables: `email_subscribers`, `profiles`, `user_plans` (SQL in `supabase/`)  
  - Auth: email/password; Confirm email **OFF** for now  
  - Redirects include localhost + `https://expat-atlas-web.vercel.app/**`  
- Next auth wired (`@supabase/ssr`, middleware, login/signup, callback)  
- Fit Quiz **cloud sync** for logged-in users (`user_plans`) — verified: quiz saved  
- Vercel Production + Preview env: Supabase keys + `NEXT_PUBLIC_APP_URL`  
- Domain purchased: **elsewhereplan.com** (Squarespace)  
- Google Workspace: **`brenden@elsewhereplan.com`** — account activated / logged in  

### Commits to know

- Auth + Corridor Brief CTA era: around `226e8cf`  
- Plan sync: `5070617` (`user_plans`)  
- Pull `main` for latest  

### NOT done / next priority order

1. [ ] Point **elsewhereplan.com** DNS → Vercel (`expat-atlas-web`); update Supabase Site URL + redirects  
2. [ ] **Resend:** account + API key + verify `elsewhereplan.com` for sending Corridor Brief  
3. [ ] YOU: official immigration URLs for **PH / TH / MX** (source claims)  
4. [ ] Privacy/Terms mention email consent before promoting the list  
5. [ ] Stripe Explorer checkout (after quiz loop is sticky)  
6. [ ] Retire elsewhere-mu redirect  

### Env on each PC

Copy secrets into `apps/web/.env.local` (never commit):

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://kjrmtklvfecvzlhlzuaf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # from Supabase API settings
SUPABASE_SERVICE_ROLE_KEY=       # secret — from Supabase API settings
# Resend — when ready
RESEND_API_KEY=
RESEND_FROM_EMAIL=Elsewhere <hello@elsewhereplan.com>
RESEND_AUDIENCE_ID=
```

Home PC: pull code, then **recreate `.env.local`** from Supabase dashboard keys (or password manager). Do not rely on work PC’s local file.

### Domain / email facts

| Item | Value |
|------|--------|
| Domain | elsewhereplan.com |
| Registrar | Squarespace |
| Workspace admin / inbox | brenden@elsewhereplan.com |
| Product name in UI | Elsewhere (domain ≠ rename) |
| Avoided | elsewhere.com (Activision), travel* domains |

---

## Home PC — start here tonight

```powershell
cd C:\Users\brenden.vaughan\expat-atlas   # or your home clone path
git pull origin main
pnpm install
# create apps/web/.env.local with Supabase keys (see above)
pnpm --filter @expat-atlas/web dev
```

Smoke:
1. http://localhost:3000 — Fit Quiz CTA  
2. Login with test / Workspace-related account if desired  
3. `/app/onboarding` → complete → confirm `user_plans` row in Supabase  

Best next coding block at home: **Vercel custom domain `elsewhereplan.com`** + Supabase redirect update, then Resend domain verify.

---

## Start-of-day checklist (either PC)

```powershell
$env:Path += ";$env:USERPROFILE\.local\node\node-v24.18.0-win-x64"
$env:Path += ";$env:USERPROFILE\AppData\Local\Programs\Git\cmd"

cd C:\Users\brenden.vaughan\expat-atlas
git pull origin main
pnpm.cmd install
pnpm.cmd --filter @expat-atlas/web dev
```

Open http://localhost:3000 — Elsewhere + Start Fit Quiz.

---

## End-of-day checklist

```powershell
cd C:\Users\brenden.vaughan\expat-atlas
git status
git add -A
# never stage .env.local
git commit -m "your message"
git push origin main
```

Update **Last session** when unfinished context matters.

---

## Dev commands

### Work PC

```powershell
cd C:\Users\brenden.vaughan\expat-atlas
$env:Path += ";$env:USERPROFILE\.local\node\node-v24.18.0-win-x64"
$env:Path += ";$env:USERPROFILE\AppData\Local\Programs\Git\cmd"
pnpm.cmd install
pnpm.cmd --filter @expat-atlas/web dev
pnpm.cmd --filter @expat-atlas/web build
```

### Home PC

```bash
cd expat-atlas
git pull origin main
pnpm install
pnpm --filter @expat-atlas/web dev
```

---

## Architecture locks (do not reopen casually)

- One Next origin: `/` marketing · `/start` hub · `/app/*` OS  
- One Supabase project for everything  
- No waitlist hype — Fit Quiz primary; Corridor Brief email secondary  
- Paid newsletter = Explorer entitlement (not a second Substack bill)  
- No fake partners; no “you qualify”; claims need sources / `needs_review`  
- V1 corridors: US → Philippines, Thailand, Mexico  

---

## Useful dashboards

| System | Link |
|--------|------|
| GitHub | https://github.com/ltvaughan19/elsewhere-app |
| Vercel app | https://expat-atlas-web.vercel.app |
| Supabase | https://supabase.com/dashboard/project/kjrmtklvfecvzlhlzuaf |
| Auth users | …/auth/users |
| SQL new | …/sql/new |
| Google Admin | https://admin.google.com (as brenden@elsewhereplan.com) |
| Squarespace domains | Squarespace → Domains for elsewhereplan.com |

---

## SQL files in repo

| File | Purpose |
|------|---------|
| `supabase/seed-elsewhere-v1.sql` | `email_subscribers` + `profiles` + signup trigger |
| `supabase/user-plans.sql` | `user_plans` + RLS (Fit Quiz cloud sync) |

Both already run on the live project as of 2026-07-14.

---

*Handoff written for home PC continuation — pull main first.*
