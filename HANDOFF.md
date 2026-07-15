# Elsewhere — Handoff Notes (Work ↔ Home)

**Last updated:** 2026-07-15 (session end — Earth markers WIP, wrap in ~13 min)  
**Brand:** Elsewhere (public)  
**Local folder:** often still `expat-atlas`  
**Repo (GitHub):** https://github.com/ltvaughan19/elsewhere-app  
**Live (Vercel):** https://expat-atlas-web.vercel.app  
**Domain:** **elsewhereplan.com** (Squarespace DNS → Vercel) + Workspace `brenden@elsewhereplan.com`  
**Legacy Vite landing:** https://elsewhere-mu.vercel.app — retire when ready  
**Quiz prototype:** https://elsewhere-app-theta.vercel.app — absorb polish later  

**Start here if context is fuzzy:** [`docs/plans/PRODUCT_CLARITY_MAP.md`](./docs/plans/PRODUCT_CLARITY_MAP.md)  
**One site / one auth:** [`docs/plans/ONE_SITE_ONE_AUTH.md`](./docs/plans/ONE_SITE_ONE_AUTH.md)  
**Email + Supabase:** [`docs/plans/EMAIL_AND_SUPABASE.md`](./docs/plans/EMAIL_AND_SUPABASE.md)  
**Earth markers:** [`docs/plans/EARTH_MARKERS.md`](./docs/plans/EARTH_MARKERS.md)

---

## Dual-PC rule (non-negotiable)

End of every session:

1. Commit meaningful work  
2. **Push the branch you’re on** (feature branch OK — do not force-merge broken markers to `main`)  
3. Update this file’s “Last session”

Next machine: **`git pull`** on the branch named below first.

---

## 🔴 LAST SESSION (2026-07-15) — START HERE

### Active branch (NOT merged to main)

```
feat/earth-destination-markers
```

Commits on remote (known):
- `0497678` — initial markers (Three meshes — invisible; keep for history)
- `1829db1` — switch to **DOM overlay** projection (visible but geo wrong)
- *(this wrap)* — radius / canvas / occlusion / glow calibration pass — **unverified in browser**

**Do not merge to `main` until pins sit on PH / TH / MX correctly.**

### What is broken (user screenshots)

Pins appear, but:
1. **Wrong geography** — PH/TH often in Pacific; MX in South Atlantic; sometimes clustered near disk center  
2. **Style** looked like flat black pills (now restyled to glow core + pulse ring — confirm after pull)  
3. **Far-side ghosting** — pins showing through ocean when on back of globe  

Root diagnosis we locked:
- **Earth radius was too small** (`dist * 0.155`) → all pins pile near visual center  
- Projection overlay used `position: fixed` without aligning to canvas bounds  
- Spline’s Three ≠ app `three` → injected meshes never drew → DOM overlay is the right approach  

### What was changed today (uncommitted → should be in latest commit on branch)

| File | Change |
|------|--------|
| `apps/web/lib/marketing/earthMarkers.js` | Better radius helper, canvas-bounded overlay, stricter far-side hide, glow pin CSS, `MARKER_CALIBRATION` |
| `apps/web/lib/marketing/splineScene.js` | `measureEarthRadius` + remeasure @800ms, pass `earthCenter` + `fovDeg` |
| `docs/plans/EARTH_MARKERS.md` | Calibration symptom guide |

### Calibration knobs (next agent: tune these first)

In `MARKER_CALIBRATION` (`earthMarkers.js`):

| Knob | Meaning |
|------|---------|
| `lngOffsetDeg` | Meridian shift if on wrong ocean |
| `latOffsetDeg` | N/S nudge |
| `spinSign` | `1` or `-1` if pins drift opposite land |
| `radiusScale` | Slightly above surface (~1.02) |

Console on load:
```
[Elsewhere] Measured earth radius ~
[Elsewhere] Earth markers ready: ph, th, mx
```

If radius still looks tiny vs globe silhouette → raise fallback in `measureEarthRadius` (currently `dist * 0.34`).

### Destinations

- PH 12.8797, 121.774  
- TH 15.8700, 100.9925  
- MX 23.6345, -102.5528  

### Kill switches

```
NEXT_PUBLIC_EARTH_MARKERS=0   # instant off
git checkout main            # leave feature entirely
```

### How to resume (5 min)

```powershell
cd C:\Users\brenden.vaughan\expat-atlas
git fetch origin
git checkout feat/earth-destination-markers
git pull
pnpm install
pnpm --filter @expat-atlas/web dev
```

Open **http://localhost:3001** if 3000 is busy. Hard refresh. Watch globe spin:
- Asia facing → TH + PH on SE Asia land; MX hidden  
- Americas facing → MX on Mexico; TH/PH hidden  

**Acceptance:** locked to land as spin + scroll camera move; glow dots not black pills; no Earth texture edits; never merge until user says OK.

### Do NOT

- Re-touch Earth materials / night texture / glare soften for markers  
- Re-add travel arcs until pins are stable  
- Merge this branch to `main` while geo is wrong  
- Invent partner / visa claims  

### Transcript for full context

Agent chat: [Earth markers session](ba159b93-8b61-40b4-8251-e380b6893939)

---

## Priority queue (after markers or if abandoning)

1. ✅ Domain → Vercel + Supabase redirects (elsewhereplan.com)  
2. ✅ Resend Elsewhere account + branded Corridor Brief welcome  
3. ✅ Privacy/Terms email consent  
4. **YOU / next:** official immigration source URLs for **PH / TH / MX** claims  
5. Retire elsewhere-mu redirect when `/` trusted  
6. Stripe Explorer checkout (later)  

If markers stall >1 focused hour: leave branch open, set `NEXT_PUBLIC_EARTH_MARKERS=0` on main, move to source URLs.

---

## Already shipped on main (stable)

- Next `/` marketing = Spline Earth + scroll camera + question tags  
- Waitlist removed; CTA = Fit Quiz; email = Corridor Brief  
- Supabase `kjrmtklvfecvzlhlzuaf`: `email_subscribers`, `profiles`, `user_plans`  
- Auth (`@supabase/ssr`); Fit Quiz cloud sync for logged-in users  
- Resend welcome email HTML; domain verified  

### Key commits on main

- Auth + Corridor Brief: ~`226e8cf`  
- Plan sync: `5070617`  
- Handoff/docs: `bd6ddbe`  
- Resend + privacy: `4d4fa43`, `72a3eb1`  

---

## Env (never commit)

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://kjrmtklvfecvzlhlzuaf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=Elsewhere <hello@elsewhereplan.com>
RESEND_AUDIENCE_ID=
# optional kill switch:
# NEXT_PUBLIC_EARTH_MARKERS=0
```

Home PC: recreate `.env.local` from password manager / dashboards.

---

## Architecture locks

- One Next origin: `/` · `/start` · `/app/*`  
- One Supabase project  
- Fit Quiz primary; Corridor Brief secondary; paid digest = Explorer  
- No fake partners; no “you qualify”; claims need sources  
- V1 corridors: US → PH, TH, MX  

---

## Dashboards

| System | Link |
|--------|------|
| GitHub | https://github.com/ltvaughan19/elsewhere-app |
| Vercel | https://expat-atlas-web.vercel.app |
| Supabase | https://supabase.com/dashboard/project/kjrmtklvfecvzlhlzuaf |
| Resend | (Elsewhere account — not VSL) |

---

## SQL in repo (already applied live)

| File | Purpose |
|------|---------|
| `supabase/seed-elsewhere-v1.sql` | subscribers + profiles trigger |
| `supabase/user-plans.sql` | Fit Quiz cloud sync + RLS |

---

*Next machine: `git checkout feat/earth-destination-markers && git pull` — finish pin geo, then merge only when pins look right.*
