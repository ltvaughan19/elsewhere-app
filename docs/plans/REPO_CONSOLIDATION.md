# Elsewhere — Repo & Product Consolidation

**Date:** 2026-07-13  
**Decision:** One brand · one web site · one mobile app · one monorepo  

---

## 1. The end state (locked)

```
elsewhere/                          ← single GitHub repo (rename from expat-atlas)
├── apps/
│   ├── web/                        ← THE site (Next.js)
│   │   ├── app/(marketing)/        ← Landing + public pages
│   │   │   └── page.tsx            ← ONE cinematic landing (Spline Earth)
│   │   ├── app/app/                ← Authenticated product shell
│   │   ├── app/quiz|path|…         ← Fit quiz / path (from elsewhere-app)
│   │   └── …
│   └── mobile/                     ← THE mobile app (Expo) — Phase 6
├── packages/
│   ├── ui/                         ← Shared design system components
│   ├── types/
│   ├── validation/
│   ├── db/
│   ├── source-engine/
│   └── config/
├── docs/plans/                     ← Foundation, business, checklist, styling
└── …
```

| Surface | What it is | Repo location |
|---------|------------|---------------|
| **Landing page** | Cinematic Elsewhere homepage | `apps/web` route `/` |
| **Site** | All marketing + tools + `/app` | `apps/web` only |
| **Mobile app** | Native wrapper of core flows | `apps/mobile` (later) |

**Not kept long-term as separate products:**  
Vite-only `Elsewhere` folder, `elsewhere-app` Vercel project, or a second “Expat Atlas” marketing site.

---

## 2. What happens to `expat-atlas`

| Option | Choice |
|--------|--------|
| Delete and start over? | **No** — keep engineering value |
| Keep name `expat-atlas` forever? | **No** — confuse brand |
| **Path** | **Rename → `elsewhere`** (GitHub + local folder) when YOU approve |

### Value we keep from expat-atlas

- Monorepo + Next.js App Router + Tailwind  
- Packages: types, ui, validation, db, source-engine  
- Tools: compare, budget, passport, visa compass  
- Trust docs + claim framework + corridors PH/TH/MX  
- App shell demo (quiz → dashboard)  
- CI workflow  

### What we replace / absorb

| Current | Action |
|---------|--------|
| Expat Atlas light “ivory” landing | Replace with Elsewhere dark cinematic landing |
| `C:\Users\brenden.vaughan\Elsewhere` (Vite) | Port Spline + question tags + copy into `apps/web` `/` |
| `elsewhere-app` (Vercel quiz) | Port Fit Quiz / Path / Checklist into `apps/web` routes |
| User-facing “Expat Atlas” strings | Rebrand to **Elsewhere** |
| Vercel `expat-atlas-web` | Retarget or rename project → Elsewhere production domain |
| Vercel `elsewhere` + `elsewhere-app` | Collapse into **one** Vercel project for `apps/web` |

### Rename steps (YOU when ready)

1. Rename GitHub repo `expat-atlas` → `elsewhere` (Settings → Rename)  
2. Update local folder / Cursor workspace root  
3. Update `package.json` names `@elsewhere/*` (can be gradual)  
4. Point Vercel Root Directory at `apps/web`  
5. Archive old Vercel aliases after DNS cutover  

Until rename: keep coding in `expat-atlas` folder; public brand is already Elsewhere in docs.

---

## 3. One site architecture (web)

Single Next.js app owns everything:

```
/                     Landing (Spline Earth + waitlist / Start quiz)
/trust /pricing …     Marketing
/corridors            PH / TH / MX
/countries/[slug]     Country notes + claims
/compare              Tools
/quiz → /path         Fit flow (product)
/app/*                Logged-in plan OS
```

**Why not keep Vite marketing + Next app forever?**  
Two deploys, two design systems, duplicate nav, brand drift. One site = one CI, one domain, one analytics funnel.

**Cinematic performance:** Dynamic-import Spline / Three on `/` only; `prefers-reduced-motion` fallback.

---

## 4. One mobile app

- Scaffold `apps/mobile` when Phase 6 starts  
- Share `packages/types`, validation, scoring, (and UI primitives where possible)  
- Do **not** build a second marketing app for mobile — deep-link to web landing if needed  
- Same dark tokens as `STYLING_RULES.md`

---

## 5. Migration sequence

### Phase A — Docs & brand (now) ✅
- [x] Foundation, business plan, checklist  
- [x] Styling rules (Elsewhere)  
- [x] This consolidation plan  
- [x] Rebrand visible strings to Elsewhere  

### Phase B — Visual unification
- [x] Port `globals.css` to Elsewhere tokens  
- [x] Restyle header/footer/app shell to dark system  
- [x] Elsewhere brand-first landing on Next `/` (Spline Earth + reduced-motion fallback)  
- [x] Port Spline Earth from Vite Elsewhere into Next `/` (idle spin; scroll-camera polish next)

### Phase C — Product unification
- [ ] Port elsewhere-app quiz/path/checklist into Next  
- [ ] Wire corridor seeds to Fit Quiz output  
- [ ] Single Vercel project deploy  

### Phase D — Cleanup
- [ ] YOU: Rename GitHub repo  
- [ ] YOU: Domain DNS  
- [ ] Archive / unpublish duplicate Vercel apps after traffic moves  
- [ ] Local `Elsewhere` Vite repo → archive read-only or delete after port verified  

---

## 6. Domain & deploy targets

| Env | Suggested |
|-----|-----------|
| Production web | `elsewhere.com` or `elsewhere.app` (**YOU choose**) |
| Staging | `elsewhere-*.vercel.app` |
| Mobile | App Store / Play later |

Legacy `expat-atlas-web.vercel.app` and `elsewhere-mu.vercel.app` redirect to the single production site after cutover.

---

## 7. Decision log

| Question | Decision |
|----------|----------|
| How many landing pages? | **One** |
| How many websites? | **One** (Next.js) |
| How many mobile apps? | **One** (Expo later) |
| What about expat-atlas repo? | **Become the Elsewhere monorepo** (rename) |
| What about Vite Elsewhere? | **Source to port, then archive** |
| What about elsewhere-app? | **Merge into web, then retire** |

---

## 8. YOUR actions for this plan

1. [x] Approve: “expat-atlas repo becomes Elsewhere monorepo”  
2. [ ] Choose production domain  
3. [x] Approve when to rename GitHub — **now** (YOU: Settings → Rename → `elsewhere`)  
4. [ ] Grant elsewhere-app source access when we port the quiz  

---

*Companion: `STYLING_RULES.md`, `ELSEWHERE_FOUNDATION.md`, `BUILD_CHECKLIST.md`*
