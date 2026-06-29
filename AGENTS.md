# Expat Atlas — Agent Instructions

This file guides AI agents (Cursor, GStack, Codex) working on **Expat Atlas**.

---

## Project Identity

- **Name:** Expat Atlas (codename: FarHome)
- **Type:** Expat transition operating system — not a travel blog
- **Phase:** 0 complete; begin Phase 1 only after reading planning docs

---

## Required Reading (before coding)

1. `PROJECT_BRIEF.md` — positioning, personas, principles
2. `ARCHITECTURE.md` — stack, monorepo, routes
3. `DATABASE_SCHEMA.md` — data model
4. `DESIGN_SYSTEM.md` — tokens, components, motion
5. `SOURCE_VERIFICATION_SYSTEM.md` — trust layer (mandatory)
6. `PARTNER_STRATEGY.md` — no fake partners
7. `ROADMAP.md` — phase order
8. `RISK_REGISTER.md` — legal/safety constraints

---

## Absolute Rules

### Trust & Legal
- Never provide legal, immigration, tax, insurance, medical, or investment advice as final authority
- Never say: "you qualify," "guaranteed visa," "approved," "safe investment," "best attorney"
- Always label: planning estimates, affiliate links, sponsored placements, demo data
- Every visa/legal/property claim needs source metadata (or `needs_review` state)

### Partners
- Never invent real attorneys, landlords, insurers, or sponsors
- Use statuses: `draft`, `pending_verification`, `verified`, `rejected`, `suspended`, `sponsored`, `demo`
- UI labels: "Demo listing," "Partner verification pending," "Verified partners coming soon"

### Data & Privacy
- MVP: no passport/ID file storage — checklist metadata only
- Document vault requires encryption architecture (not MVP)

### Build Order
Follow `ROADMAP.md` phases. Do not skip admin tooling or source verification for landing page polish.

---

## Tech Conventions

| Area | Standard |
|------|----------|
| Monorepo | pnpm + Turborepo |
| Web | Next.js App Router, TypeScript, Tailwind, shadcn/ui |
| DB | Supabase Postgres + Drizzle + RLS |
| Validation | Zod in `packages/validation` |
| Shared UI | `packages/ui` |
| Scoring/source | `packages/source-engine` |
| Forms | React Hook Form |
| Motion | Framer Motion; Three.js lazy-loaded; respect `prefers-reduced-motion` |
| Tests | Playwright (E2E), Vitest (unit) |

---

## GStack Workflow (when installed)

Use these slash commands at phase boundaries:

| Command | When |
|---------|------|
| `/office-hours` | New feature or phase kickoff |
| `/autoplan` | Before implementing a phase |
| `/plan-ceo-review` | Monetization, trust, scope decisions |
| `/plan-design-review` | Landing page, dashboard UX |
| `/review` | Before merge |
| `/qa` | After deploy to staging |
| `/ship` | PR + release notes |
| `/cso` | Security review before production |

Skills live in `~/.cursor/skills/` (see `SKILLS_INVENTORY.md`).

---

## Copy Tone

Calm, direct, human, trustworthy. Answer: **"What do I do next?"**

Examples:
- "Here is the safer next step."
- "This may be worth researching."
- "Verify before acting."
- "Rent first. Buy later."

---

## Component Checklist (new UI)

Every user-facing module should include where applicable:

- [ ] Trust disclaimer
- [ ] Source/confidence badges
- [ ] "Report outdated info" (if factual)
- [ ] Empty state with next action
- [ ] Mobile responsive layout
- [ ] Reduced-motion fallback

---

## File Naming

- Routes: `apps/web/app/(marketing)/countries/[slug]/page.tsx`
- Components: PascalCase in `components/`
- DB schema: `packages/db/src/schema/`
- Seeds: `supabase/seed.sql` + `packages/db/src/seed/`

---

## Environment

See `ARCHITECTURE.md` for env vars. Never commit secrets.

---

## When Uncertain

1. Prefer structure over fake content
2. Prefer `needs_review` over invented facts
3. Prefer demo labels over implied real partnerships
4. Ask user only for blocking product decisions — not for permission on trust rules
