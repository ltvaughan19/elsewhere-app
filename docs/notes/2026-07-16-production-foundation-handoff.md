# Elsewhere production foundation handoff

> **Historical handoff:** This file records the pre-rollout state of the former
> `codex/production-foundation` branch. The foundation was subsequently reviewed,
> merged into `main`, migrated, and deployed on July 16, 2026. See
> [`docs/plans/PRODUCTION_STATUS_AND_NEXT_BUILD.md`](../plans/PRODUCTION_STATUS_AND_NEXT_BUILD.md)
> for the current production inventory and remaining work.

**Date:** July 16, 2026  
**Branch:** `codex/production-foundation`  
**Status:** Pushed for review; not deployed and not applied to production data

## What this branch establishes

This is the first production-shaped foundation for Elsewhere as a trust-first
relocation planning product. It goes beyond a landing page and creates the
system needed to research, review, publish, monitor, and correct country
guidance without presenting unverified material as fact.

### Premium country experience

- Reworked `/countries` into an editorial country dossier library rather than
  a generic card grid.
- Reworked country pages into responsive field guides with a masthead,
  section index, mobile contents sheet, claim cards, source ledger, update
  reporting, and clear coverage states.
- Added an understated country identity system and motion details designed to
  feel calm, premium, and useful on desktop and mobile.
- Added a favicon/app mark and broader sitemap/robots coverage.
- Preserved the existing cinematic Earth scene and loading experience. The
  protected Earth scene file has no changes in this branch.

### Trust-first editorial operation

- Added a staff-only editorial area for sources, claims, content blocks,
  reviews, releases, and outdated-information reports.
- Added atomic authoring functions so related records cannot be partially
  written.
- Added immutable release history, evidence snapshots, audit events, conflict
  checks, credential verification history, professional review assignments,
  emergency suppression, and MFA-sensitive actions.
- Tightened database privileges so human review and publishing actions are not
  intended to be available to the network worker or service automation.
- Added public rendering queries that fail closed when no eligible published
  release exists.

### Official-source monitoring

- Added a safe, server-only source fetcher with strict HTTPS URL rules, exact
  hostname allowlists, DNS pinning, private-network blocking, redirect checks,
  response-size limits, supported-type checks, validator provenance, and
  deterministic semantic hashing.
- Added monitoring state, leased jobs, backoff, immutable source-change
  impacts, human impact review, and publication freshness gates.
- Added a daily Vercel worker route that uses a dedicated
  `source_monitor_worker` JWT. The worker may claim and complete checks only;
  it cannot author, review, resolve impacts, suppress claims, or publish.
- Added a production operations runbook at
  `docs/operations/SOURCE_MONITOR_RUNBOOK.md`.

### Source research and launch scope

- Added a Philippines official-source staging ledger with 109 unique source
  records spanning immigration, retirement, work, tax, health, housing,
  safety, transport, pets, family, and related planning topics.
- The ledger is research inventory, not published country guidance. Factual
  claims remain intentionally unpublished until evidence snapshots and human
  review are completed.
- Thailand and Mexico retain honest preview coverage rather than fabricated
  depth.

### Product and platform hardening

- Consolidated Supabase configuration and generated database types.
- Added stronger authentication/session handling and staff route guards.
- Added a server-side outdated-information intake endpoint with validation,
  origin checks, a honeypot, bounded input, and rate limiting.
- Added Vitest coverage, Playwright desktop/mobile coverage, CI updates,
  security headers, package hardening, and responsive visual QA artifacts.

## Validation performed

The branch has been exercised through:

- 119 passing source-engine unit tests and source-engine type checking;
- 28 passing web unit tests and web type checking;
- repository linting and a successful Next.js 15.5.20 production build of 44
  generated/static pages;
- 26 passing Playwright smoke tests across desktop and mobile;
- direct browser checks for the country library, Philippines guide, mobile
  contents sheet, navigation, and horizontal overflow;
- whitespace/diff validation and an explicit no-diff check on the protected
  Earth scene.

The pull request notes carry the same validation record.

## Deliberate production gates

Do not treat this branch as permission to publish factual relocation guidance
or run the new database migrations automatically.

Before production activation:

1. Complete a final independent review of the two large reviewer/monitoring
   migrations and validate them transactionally against the target Supabase
   schema.
2. Apply migrations in order, verify row-level security and function grants,
   and regenerate database types from the resulting schema.
3. Provision and rotate the narrow, expiring
   `SUPABASE_SOURCE_MONITOR_WORKER_JWT`; never substitute a service-role key.
4. Run the baseline/change/failure drills in the monitoring runbook on one
   harmless official source.
5. Convert selected Philippines ledger records into evidence snapshots and
   reviewed claims. Keep everything else in preview or unpublished state.
6. Obtain a legal/privacy review before paid acquisition, partner referrals,
   or handling sensitive identity documents.

## Product locks

- Do not modify the Earth scene without Brenden's explicit instruction.
- Preserve the loading experience unless Brenden explicitly requests a change.
- Never claim that a user qualifies for a visa or relocation route.
- Never publish a material rule without traceable evidence and the review level
  required by its risk category.
- Automation detects and pauses; authorized humans decide and publish.
