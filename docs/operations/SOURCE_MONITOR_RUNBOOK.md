# Elsewhere official-source monitor

## Purpose

The monitor checks only explicitly approved official URLs. It records bounded
metadata and cryptographic hashes, never a response body. A first baseline,
meaningful content change, URL change, document-type change, normalization
change, or repeated fetch failure pauses affected guidance until a human review
is completed.

The network worker cannot author, review, resolve impacts, suppress claims, or
publish a country release. Those powers remain in the credentialed human
workflow.

## Production configuration

Vercel needs these server-only variables:

- `CRON_SECRET`: at least 32 random characters. Vercel sends it in the daily
  cron request's bearer header.
- `SUPABASE_SOURCE_MONITOR_WORKER_JWT`: an expiring Supabase JWT whose `role`
  claim is exactly `source_monitor_worker`.
- `SOURCE_MONITOR_BATCH_SIZE`: optional, from 1 through 10; defaults to 5.

The worker JWT must be minted only after the monitoring migration has created
the narrow database role. Store it in Vercel, not in the repository. Rotate it
before expiration. Never substitute the Supabase secret/service-role key: the
route rejects any token whose role is not exactly `source_monitor_worker`, and
the database grants that role only the claim-job and complete-job functions.

## Daily operation

Vercel calls `/api/cron/source-monitor` each day. One run:

1. Authenticates the Vercel cron request.
2. Claims a small leased batch from the database.
3. Resolves and pins each approved hostname to public network addresses.
4. Fetches bounded HTML, text, or PDF responses without executing page code.
5. Submits hashes and response metadata to the database.
6. Lets the database derive `baseline`, `unchanged`, or `changed` and create
   immutable claim-impact records where needed.

If the worker crashes after claiming a job, the lease expires and the database
records the missed completion as a monitored failure. A failed completion is
never silently treated as fresh evidence.

## Safe rollout

1. Apply the reviewed migrations in a non-production or rolled-back validation
   transaction first.
2. Mint the narrow, expiring worker JWT and add the three Vercel variables.
3. Configure monitoring for one harmless official source.
4. Trigger the route manually with the cron bearer secret.
5. Confirm one baseline job and its human-review impact before adding sources.
6. Test a controlled URL or content change and verify that publication remains
   blocked until an authorized human resolves the impact.

Do not enable broad monitoring until the baseline and change drills pass.

