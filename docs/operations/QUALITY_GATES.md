# Elsewhere quality gates

Last updated: 2026-07-16

These gates are part of the product, not optional cleanup. They exist to keep Elsewhere calm, trustworthy, and internally consistent as multiple builders work on it.

## During development

Run `pnpm check:guardrails` after changing navigation, authentication, the marketing experience, publishing logic, or project documentation.

The automated guardrail fails when:

- the locked Spline Earth source changes;
- the existing loader markup or completion behavior disappears;
- the marketing or product header stops using the shared auth session;
- trusted-device cookie behavior is removed from the browser or refresh middleware;
- the auth callback stops using the safe internal redirect allowlist;
- Google and Apple disappear from the supported provider set;
- privileged Supabase keys appear in client code; or
- the current builder handoff or this runbook disappears.

## Before a pull request or production release

Run `pnpm check:release`. It executes, in order:

1. permanent Elsewhere guardrails;
2. lint;
3. TypeScript checks;
4. unit tests;
5. the production build; and
6. desktop and mobile Playwright flows.

GitHub CI runs the same guardrail before its normal validation. A production release must not proceed with a failing step.

## Manual continuity check

Use one test account and verify this sequence on desktop and mobile:

1. Log in and choose whether the device is trusted.
2. Open Countries, Compare, the globe homepage, and Plan in turn.
3. Confirm every global shell continues to show Account/Plan rather than Log in.
4. Return to the dashboard and confirm the same plan remains available.
5. Log out from Account or the mobile drawer.
6. Confirm the public pages now show Log in and no private account state.
7. For an untrusted-device login, close the browser session and confirm a new session requires authentication.

## Social login activation check

The interface reads Supabase Auth provider settings and only renders Google or Apple when that provider is enabled. This prevents dead buttons.

Before enabling a provider:

- create and secure the OAuth application in the provider console;
- add the Supabase callback URL required by that provider;
- add `https://elsewhereplan.com/auth/callback` and approved preview/local patterns to Supabase redirect URLs;
- keep provider client secrets only in Supabase/provider configuration, never in the repository or `NEXT_PUBLIC_*` variables;
- test new-account, returning-account, same-email identity linking, cancellation, denied consent, and logout; and
- verify account recovery still works for email/password users.

Apple requires ongoing developer-account and signing-secret maintenance. Record the owner and renewal date before enabling it.

## Database and editorial release gate

Database migrations, source-monitor worker credentials, monitoring cron, country claims, DNS, and production publishing remain separate explicit rollout decisions. A passing web release does not authorize any of those actions.

For editorial changes, also follow `docs/operations/SOURCE_MONITOR_RUNBOOK.md`. Automation may detect and pause; only an authorized human may review, resolve, suppress, or publish.
