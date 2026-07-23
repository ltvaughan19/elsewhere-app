# Elsewhere Project Guidance

## North star (locked 2026-07-17)

> **“I’m actually going — and I know the one thing to do before Sunday.”**

Leaving is the metric. Features must serve a weekly leaving habit (one next
action → optional official-source touch → optional human signal). Do not
prioritize ecosystem, Meta, or more tools until that habit is proven with real
users. Full statement: `docs/plans/PRODUCT_CLARITY_MAP.md` §0 (including
Strategic edge / Sunday Action).

Every response must include a concise **`CEO Message:`** applying the permanent
internal CEO lens. Veto and rework failure-shaped directions; do not merely
comply. See `.cursor/rules/ceo-north-star.mdc`.

## Design System

Always read `DESIGN.md` before making visual or UI decisions.

All typography, color, spacing, layout, motion, evidence-display, accessibility, internationalization, and responsive rules are defined there. Do not deviate without explicit owner approval.

The existing Spline Earth scene and loading screen are locked. The Earth binary is
self-hosted at `apps/web/public/earth/scene.splinecode`. Do not switch back to
`prod.spline.design`, alter camera motion, or change illumination behavior without
explicit owner approval.

In QA and review work, flag code that does not match `DESIGN.md`.

## Current handoff and release gates

Before changing the product, read `docs/CURRENT.md` and `docs/operations/QUALITY_GATES.md`.

Every meaningful change must preserve one continuous account state across marketing, research, and planner routes. Never render a static “Log in” state in a global shell without checking the shared Supabase session.

Run `pnpm check:guardrails` during development and `pnpm check:release` before shipping. Do not bypass a failed guardrail. The protected Earth checksums (JS + self-hosted binary) may change only after explicit owner approval.
