# Elsewhere

**One calm path from pressure to a real plan abroad.**

Public brand: **Elsewhere**. GitHub repo: [`ltvaughan19/elsewhere-app`](https://github.com/ltvaughan19/elsewhere-app). Local folder may still be `expat-atlas`; packages remain `@expat-atlas/*` for now.

Expat transition OS for first-time movers — structure, corridors (US → PH / TH / MX), and a next step. Not a travel blog.

> General planning information only. Always verify legal, visa, tax, insurance, and property decisions with official sources or licensed professionals.

**Work ↔ home:** End every session with `git push`. Start with `git pull`. See [HANDOFF.md](./HANDOFF.md).

---

## Status

| Phase | State |
|-------|-------|
| Phase 0 — Planning | ✅ Complete |
| Phase 1 — Public site | ✅ Scaffold + Elsewhere landing |
| Phase 2 — App shell | 🚧 Demo `/app/*` (localStorage; Supabase next) |
| Docs / consolidation | See `docs/plans/` |

Run `pnpm dev` → http://localhost:3000

---

## Work PC note (PowerShell)

If `npm` fails with a script execution policy error, use:

```powershell
npm.cmd install -g pnpm
pnpm.cmd install
pnpm.cmd dev
```

Node portable path (if needed per session):

```powershell
$env:Path += ";$env:USERPROFILE\.local\node\node-v24.18.0-win-x64"
```

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) | Product vision, personas, principles |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Tech stack, monorepo, deployment |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Postgres schema |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Colors, typography, components |
| [SOURCE_VERIFICATION_SYSTEM.md](./SOURCE_VERIFICATION_SYSTEM.md) | Trust/source claims |
| [PARTNER_STRATEGY.md](./PARTNER_STRATEGY.md) | Partner/sponsor model |
| [ROADMAP.md](./ROADMAP.md) | Implementation phases |
| [RISK_REGISTER.md](./RISK_REGISTER.md) | Legal/operational risks |
| [AGENTS.md](./AGENTS.md) | AI agent instructions |
| [SKILLS_INVENTORY.md](./SKILLS_INVENTORY.md) | Installed Cursor/GStack skills |
| [Current state](./docs/CURRENT.md) | What is live, next work, home-PC start |
| [Quality gates](./docs/operations/QUALITY_GATES.md) | Permanent auth, trust, design, and release checks |

---

## Prerequisites (dev setup)

Install before Phase 1 scaffold:

1. **Node.js LTS** (24+) — [nodejs.org](https://nodejs.org/) or `winget install OpenJS.NodeJS.LTS`
2. **Git** — `winget install Git.Git`
3. **pnpm** — `npm install -g pnpm` (after Node)
4. **Supabase CLI** (optional local) — [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)

> Node install may require administrator approval on Windows.

---

## Quick Start

```bash
cd expat-atlas
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

On Windows work PCs use `pnpm.cmd` if `pnpm` is not recognized.

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

See `ARCHITECTURE.md` for full list including Stripe and maps.

---

## Scripts (planned)

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start web app |
| `pnpm build` | Production build |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright E2E |
| `pnpm db:migrate` | Drizzle migrations |
| `pnpm db:seed` | Seed countries/demo data |
| `pnpm lint` | ESLint |

---

## Admin Setup (planned)

1. Create user via signup
2. Set `user_profiles.role = 'admin'` in Supabase dashboard
3. Access `/admin`

---

## Deployment

- **Web:** Vercel (use `deploy-to-vercel` skill)
- **Database:** Supabase hosted Postgres
- **Mobile:** Expo EAS (Phase 6)

---

## Known Limitations (MVP)

- Demo/needs-review data for visa and costs
- No verified partners or live sponsorships
- No passport document storage
- AI Coach = rules-based until RAG ships
- Git repo not yet initialized (install Git first)

---

## License

TBD — proprietary until stated otherwise.
