# Agent Skills Inventory — Expat Atlas

Last updated: 2026-06-29

## Installation Summary

| Category | Status | Notes |
|----------|--------|-------|
| GStack workflow | Installed | 53 skills copied to `~/.cursor/skills/` from `~/.claude/skills/gstack` |
| Core (skills.sh) | Installed | 22 skills copied from `~/.codex/skills/` to `~/.cursor/skills/` |
| Node.js / skills CLI | Pending | Node LTS install cancelled (admin UAC). Use `npx skills add` after Node is installed |
| Git | Pending | Required for repo init, gstack `./setup --host cursor`, and CI |

## Installed Skills (Cursor: `~/.cursor/skills/`)

### Core — Product, Backend, QA, Deploy

| Skill | Source | Purpose |
|-------|--------|---------|
| `gstack` | garrytan/gstack | Virtual engineering team: plan, review, QA, ship |
| `gstack-office-hours` | gstack | Product interrogation |
| `gstack-plan-ceo-review` | gstack | Strategic scope challenge |
| `gstack-plan-eng-review` | gstack | Architecture lock |
| `gstack-plan-design-review` | gstack | Design critique |
| `gstack-review` | gstack | Code review |
| `gstack-qa` / `gstack-qa-only` | gstack | Browser QA |
| `gstack-ship` | gstack | PR and release |
| `gstack-autoplan` | gstack | End-to-end planning |
| `deploy-to-vercel` | vercel-labs/agent-skills | Vercel deployment |
| `react-best-practices` | vercel-labs/vercel-plugin | Next.js/React performance |
| `supabase-postgres-best-practices` | supabase/agent-skills | Postgres/RLS patterns |
| `playwright-best-practices` | 0xbigboss/claude-code | E2E testing |
| `requesting-code-review` | obra/superpowers | Review workflow |

### Design & Motion

| Skill | Purpose |
|-------|---------|
| `frontend-design` | High-end UI direction |
| `theme-factory` | Design tokens and themes |
| `brand-guidelines` | Brand consistency |
| `algorithmic-art` | Generative visual accents |
| `gsap-scrolltrigger` | Scroll-driven animation |
| `scroll-experience` | Cinematic scroll sections |
| `threejs-interaction` | 3D globe / map interactions |
| `3d-web-experience` | Three.js hero patterns |
| `taste-skill` | Design taste and polish |

### Video / Media (Phase 2+)

| Skill | Purpose |
|-------|---------|
| `remotion` | Programmatic video |
| `hyperframes` | Video frame tooling |
| `slack-gif-creator` | Social/share assets |

### API / Utility

| Skill | Purpose |
|-------|---------|
| `claude-api` | AI Coach integration patterns |
| `mcp-builder` | MCP server scaffolding |
| `canvas-design` | Visual asset generation |
| `web-artifacts-builder` | Interactive prototypes |
| `webapp-testing` | Browser QA flows |

## Recommended GStack Workflow for This Project

1. `/office-hours` — refine product scope before each major phase
2. `/autoplan` — generate implementation plan per phase
3. `/plan-ceo-review` — challenge scope on monetization and trust features
4. `/plan-design-review` — landing page and dashboard UX
5. `/review` — before merging each phase
6. `/qa` — after staging deploy
7. `/ship` — PR creation and release notes

## Post-Setup Commands (after Node + Git installed)

```bash
# Refresh skills via skills.sh CLI
npx skills add vercel-labs/agent-skills -a cursor -g -y --copy
npx skills add vercel-labs/vercel-plugin -a cursor -g -y --copy -s react-best-practices
npx skills add supabase/agent-skills -a cursor -g -y --copy -s supabase-postgres-best-practices
npx skills add obra/superpowers -a cursor -g -y --copy -s requesting-code-review

# GStack Cursor registration (requires Bun + Git Bash on Windows)
cd ~/.claude/skills/gstack && ./setup --host cursor
```

## Skills Not Installed (manual / deferred)

| Item | Reason |
|------|--------|
| SEO / marketing copy skill | No single canonical skills.sh package identified; use editorial guidelines in `PROJECT_BRIEF.md` |
| Analytics tracking skill | Implement PostHog event plan in `ARCHITECTURE.md`; no dedicated skill required |
| Accessibility skill | Use Playwright + axe in Phase 7; consider `skills find accessibility` after Node install |
| Security review | Use `gstack-cso` and `gstack-guard` from GStack |
