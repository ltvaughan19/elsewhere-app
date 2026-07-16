# Elsewhere current state and builder handoff

Prepared: 2026-07-16

Audience: Cursor, Codex, or another senior product builder

Canonical repository: `https://github.com/ltvaughan19/elsewhere-app`

Production site: `https://elsewhereplan.com`

## Read this first

Elsewhere is a trust-first operating system for researching international travel, long stays, and relocation. It is not a travel blog, a visa-answer bot, or a generic SaaS starter.

The governing principle is: **Earth carries the emotion; the product carries the certainty. Automation detects and pauses; authorized humans decide and publish.**

Before editing, read `DESIGN.md`, `CLAUDE.md`, `docs/plans/ELSEWHERE_FOUNDATION.md`, `docs/plans/BUSINESS_PLAN_AND_LAUNCH_REPORT.md`, `docs/operations/SOURCE_MONITOR_RUNBOOK.md`, and `docs/operations/QUALITY_GATES.md`.

Do not modify `apps/web/lib/marketing/splineScene.js` or remove/change the loading-screen experience. Do not apply database migrations, provision worker credentials, publish country claims, merge releases, or change DNS without an explicit rollout decision.

## Executive status

Elsewhere is now one Next.js product on one domain with one Supabase account system. The production foundation, editorial controls, source-monitor schema, country-directory experience, responsive planner, and a coherent cross-product navigation system exist.

The product is not content-ready for launch. The Philippines official-source ledger contains 109 staged government-first URLs, but the live database currently has zero source documents, zero source snapshots, zero claims, zero content blocks, and zero monitor jobs. Thailand and Mexico are deliberately honest previews. No factual country guidance should be implied from the existence of a URL or placeholder release.

The main customer-facing gap found on 2026-07-16 was account continuity. Sessions remained valid when users moved between Plan, Countries, Compare, and the globe homepage, but public headers ignored the session and displayed “Log in.” This looked like a logout and damaged trust. The current auth-continuity change fixes the shell state and adds a real trusted-device session policy.

## What changed since 2026-07-15

### Production and trust foundation

- Built a staff-only editorial workspace and a database foundation for sources, immutable snapshots, versioned claims, content blocks, reviews, country releases, audit events, outdated-information reports, professional credentials, conflicts, suppression, and publication gates.
- Added an official-source monitoring model with exact host allowlists, leased jobs, bounded retries, baseline/change/failure handling, immutable impact records, and human-only resolution.
- Hardened review freshness so claim, category, evidence, and source changes invalidate stale approvals.
- Added fail-closed publication rules and human separation between authorship, review, professional review, and publishing.
- Added 119 source-engine tests around publishing and monitoring safeguards.
- Applied and recorded nine Supabase migrations through `20260716065354_official_source_monitoring`; generated database types match that deployed schema.

### Country research product

- Built a premium country directory and responsive country field-guide framework.
- Added Philippines, Thailand, and Mexico portals with 16 shared research categories and 33 portal sections.
- Kept all three portals in preview/noindex mode while factual guidance is absent.
- Preserved the 109-record Philippines official-source ledger in `outputs/PHILIPPINES_OFFICIAL_SOURCE_LEDGER.md`; it has not been promoted into evidence or claims.
- Simplified country previews so users see the research structure, publication status, and next action without fabricated detail.

### Product experience redesign

- Unified public research and planner navigation. Countries, Compare, and Plan are available from the global header; the planner adds contextual plan navigation instead of becoming a separate-looking site.
- Rebuilt the dashboard hierarchy around readiness, current destination, next action, and warnings.
- Added a mobile navigation drawer and bottom planner navigation with keyboard focus management, escape handling, and overflow checks.
- Preserved local plans, connected them to accounts on signup/login, and hardened internal auth redirects.
- Reworked login, signup, password recovery, onboarding, directory, and country previews to reduce template-like cards, duplicate calls to action, and visual crowding.
- Preserved the locked Spline Earth and the loading experience.

### Current account-continuity release

- Added one shared `AuthSessionProvider` at the root so marketing, research, account, and planner surfaces read the same Supabase identity.
- Made the globe header, product header, mobile drawer, product hub, and account settings session-aware.
- Authenticated users now see Account and Continue Plan instead of a contradictory Log in state on public pages.
- Added explicit local-device logout in Account and the mobile drawer.
- Added “Keep me signed in on this trusted device.” Checked sessions receive persistent Supabase cookies; unchecked sessions use browser-session cookies. The policy is applied both when the browser writes tokens and when server middleware refreshes them.
- Added Google and Apple OAuth support. Buttons are discovered from Supabase Auth settings and render only for providers actually enabled, preventing dead sign-in methods.
- Preserved safe internal redirect validation through email, recovery, and OAuth callback flows.
- Added permanent guardrails and a single `pnpm check:release` command.

## Current production architecture

| Area | Current system |
|---|---|
| Web | Next.js 15 App Router, React 19, TypeScript, Tailwind 4 |
| Hosting | Vercel project `expat-atlas-web` (`prj_pMbrH6AxDABpNhvlPzVutByRo20m`) |
| Production domains | `elsewhereplan.com`, `www.elsewhereplan.com`, Vercel aliases |
| Database/Auth | Supabase project `kjrmtklvfecvzlhlzuaf`, Postgres 17, RLS enabled on product/editorial tables |
| Account methods | Email/password live; Google/Apple code-ready and runtime-gated by provider configuration |
| Plan storage | Guest device copy plus authenticated `user_plans` sync |
| Country publishing | Immutable/versioned release model; no claims or evidence promoted yet |
| Monitoring | Schema, worker code, runbook, and tests exist; no monitor state/jobs in production |
| CI | GitHub Actions: guardrails, lint, types, unit tests, build, desktop/mobile Playwright |

The auth-continuity application release is live on the production aliases from main commit `f76213313ec6dcff6b7242f9b27cd65ed5c50e01`. Its first READY production deployment was `dpl_9XssWBX5K1rXgDdzANxYnsrgAjNt`. Anonymous production canaries returned 200 for Home, Login, Countries, Compare, and Dashboard; the Home response retained the locked loader/Earth markup, and Vercel reported no new runtime errors. A later documentation-only deployment may supersede that deployment ID without changing the application runtime.

## Supabase reality

Nine production migrations are recorded:

1. `20260716025902_baseline_existing_production`
2. `20260716025918_security_hotfix`
3. `20260716031330_editorial_publishing_core`
4. `20260716031631_editorial_security_performance_hardening`
5. `20260716034915_require_claim_traceability_for_all_release_blocks`
6. `20260716035119_private_source_evidence_storage`
7. `20260716035346_atomic_editorial_authoring`
8. `20260716061645_reviewer_source_monitoring_and_suppression_hardening`
9. `20260716065354_official_source_monitoring`

Current material row counts: three countries, three portals/releases, 16 categories, 33 portal sections, one profile/user plan, one staff membership, and zero source documents, snapshots, claims, content blocks, reviews, monitor state, or jobs.

Supabase’s security advisor currently reports four warnings because signed-in users can call public `SECURITY DEFINER` editorial RPC wrappers. This is intentional exposure to authenticated staff: the underlying private functions enforce staff roles, MFA where required, deny service-role review/resolution, and fail closed. Keep the warnings documented and re-audit grants whenever these functions change. The advisor also reports leaked-password protection disabled; enable it in Supabase Auth before broader customer acquisition if the project plan supports the feature.

Performance advisor findings are informational missing-index suggestions around editorial/professional foreign keys. Add indexes based on measured query paths before the editorial dataset grows; do not churn schema solely to make an empty-database dashboard green.

## Authentication model

`AuthSessionProvider` is the single client-side identity signal. It verifies the current user, subscribes to auth changes, and supplies logout. Headers must consume it rather than infer identity from the URL.

Supabase SSR middleware refreshes sessions and writes cookies. `elsewhere_trusted_device=1` keeps refreshed auth cookies persistent for one year at the preference layer; `0` strips persistence so tokens remain browser-session cookies. Existing pre-feature sessions remain persistent until the user makes a new login choice, avoiding a surprise mass logout.

Google and Apple are not repository secrets. Enabling them requires provider-console credentials and Supabase Auth configuration. Client secrets belong only in the provider/Supabase settings. The UI checks `/auth/v1/settings` with the public Supabase key and shows only enabled providers.

Required provider tests are in `docs/operations/QUALITY_GATES.md`. Pay special attention to automatic identity linking when an OAuth identity shares a verified email with an existing password account.

## Permanent working system

- `pnpm check:guardrails` is the fast invariant check.
- `pnpm check:release` runs the entire release suite.
- GitHub CI runs the invariant check before lint, types, unit tests, build, and Playwright.
- `CLAUDE.md` points every builder to this handoff and the gates.
- The Earth source is checksum-locked.
- The loader, safe auth callback, shared session shells, trusted-device cookie path, supported OAuth providers, client secret boundary, and required project records are checked automatically.

Do not weaken a check to make a build pass. Fix the regression or obtain explicit owner approval for a genuine product-lock change.

## What remains

### Immediate: account release completion

The complete release suite and independent code review passed, and the application release is live. The remaining account work is operational verification and provider activation:

1. Test a real production email/password session across Home → Countries → Compare → Plan → Account, including an unchecked trusted-device login, a checked trusted-device login, refresh, browser restart, and explicit logout.
2. Configure Google OAuth in its provider console and Supabase, then run the new-account, returning-account, same-email, cancellation, and logout scenarios.
3. Configure Apple only after an Apple Developer owner, signing-secret rotation owner, and renewal process are recorded.
4. Decide and configure Supabase inactivity/time-box session limits at the platform level; do not simulate security timeout copy in the UI.
5. Enable leaked-password protection when available for the project plan.

### Next: monitoring activation

1. Confirm the narrow `source_monitor_worker` JWT claims and production cron secret.
2. Provision them only during an approved rollout.
3. Run the baseline, changed-source, failed-source, and recovery drills from `SOURCE_MONITOR_RUNBOOK.md` with one harmless official source.
4. Confirm the worker can fetch and report only; it must never author, review, resolve, suppress, or publish.

### Next: Philippines evidence production

1. Select a small, high-value group of Philippines ledger records: entry/passport, extension/long stay, official contacts, and a clearly bounded practical topic.
2. Capture immutable evidence snapshots with dates and exact source identity.
3. Draft atomic claims that say only what the evidence supports.
4. Perform independent source and professional review where risk requires it.
5. Compose mobile-first content blocks and run the full publication gate.
6. Publish a deliberately small, excellent first release. Do not bulk-import 109 URLs into implied guidance.

### Product roadmap after trustworthy content

- Finish saved research and cross-country comparison using reviewed data.
- Add realistic budgets with dates, currency context, and assumption controls.
- Build timeline and task planning that adapts to nationality, family, work, pets, and desired stay.
- Add change notifications tied to reviewed claim impacts, not raw scrape noise.
- Add verified professional help only after credential verification, conflicts, sponsorship disclosure, suppression, and complaint workflows are operational.
- Add paid Explorer value only after the free research-to-plan loop is reliable. Revenue should follow trust, not precede it.

## Builder definition of done

A change is not done because the page renders. It is done when:

- authenticated state is consistent across every shell;
- mobile, desktop, keyboard, reduced-motion, loading, empty, and error states are coherent;
- high-risk content remains sourced, dated, reviewable, and unpublished until approved;
- automation cannot cross into human authority;
- no secret enters client code or git;
- `pnpm check:release` passes;
- production behavior is verified after deployment; and
- this handoff is updated when architecture or rollout state materially changes.
