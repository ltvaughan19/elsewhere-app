# Elsewhere Project Guidance

## Design System

Always read `DESIGN.md` before making visual or UI decisions.

All typography, color, spacing, layout, motion, evidence-display, accessibility, internationalization, and responsive rules are defined there. Do not deviate without explicit owner approval.

The existing Spline Earth scene and loading screen are locked. Do not modify either asset or its intended experience.

In QA and review work, flag code that does not match `DESIGN.md`.

## Current handoff and release gates

Before changing the product, read `docs/notes/2026-07-16-cursor-builder-handoff.md` and `docs/operations/QUALITY_GATES.md`.

Every meaningful change must preserve one continuous account state across marketing, research, and planner routes. Never render a static “Log in” state in a global shell without checking the shared Supabase session.

Run `pnpm check:guardrails` during development and `pnpm check:release` before shipping. Do not bypass a failed guardrail. The protected Earth checksum may change only after explicit owner approval.
