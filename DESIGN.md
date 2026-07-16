# Design System: Elsewhere Field Guide

## Product Context

- **What this is:** Elsewhere is a source-backed operating system for researching, planning, and managing a move or extended stay abroad. It turns fragmented rules and anxious research into an understandable plan with clear evidence and next actions.
- **Who it is for:** First-time international movers, long-stay travelers, remote workers, families, retirees, returning citizens, and people comparing permanent relocation options. The product must support users from any origin country, not only Americans.
- **Space:** International relocation planning, government-information publishing, personal planning, and travel operations.
- **Product surfaces:** Cinematic marketing, public country field guides, a personal planner, and an internal editorial desk.
- **Memorable idea:** **Earth carries the emotion. The product carries the certainty.**

## Locked Brand Assets

The following are frozen unless the owner explicitly reverses this decision:

- The existing Spline Earth scene and its implementation.
- The existing loading screen and intended loading experience.

Do not recolor, rematerialize, reposition, replace, simplify, or otherwise modify the Earth scene. Do not redesign or remove the loading screen. Product work must be designed around these assets.

## Aesthetic Direction

- **Direction:** International field guide with editorial authority.
- **Decoration:** Intentional and restrained. Typography, rules, source annotations, maps, and useful data create character. Avoid decorative interface clutter.
- **Mood:** Calm, adult, globally literate, precise, and quietly premium. Never nomad hype, faux-government branding, or generic SaaS gloss.
- **Design posture:** The marketing surface creates aspiration. Product surfaces earn trust through clarity, evidence, and an obvious next step.

## Four Coordinated Modes

### Nocturne

The existing Earth-led marketing experience. Cinematic, dark, sparse, and emotional. This mode is frozen apart from accessibility, reliability, and performance fixes that do not alter the scene or loading experience.

### Field Guide

Public country portals, official-source explanations, comparison, alerts, and articles. It should feel like a living international dossier rather than a card catalog or travel blog.

### Planner

Onboarding, personal path, timeline, budget, saved research, watchlists, and move tasks. Lead with the next useful action and the user's time horizon.

### Editorial Desk

Internal authoring, evidence capture, reviewer assignments, source-change queues, release gates, and corrections. Prefer queues, tables, split views, diffs, and blocked-state explanations over dashboard card mosaics.

## Typography

- **Brand and editorial display:** Instrument Serif 400. Use for the Elsewhere wordmark, country mastheads, major editorial headings, and rare pull quotes.
- **Body and interface:** Outfit 400 to 500. Use for long-form reading, product headings, controls, forms, navigation, and labels.
- **Data and provenance:** JetBrains Mono 400 or IBM Plex Mono 400. Use for source IDs, hashes, release numbers, timestamps, and tabular data.
- **International scripts:** Choose locale-appropriate Noto families for Thai, Arabic, CJK, Devanagari, and other scripts. Native country names must never fall into an arbitrary browser fallback.
- **Loading:** Use `next/font` for application fonts. Keep the marketing loader behavior unchanged.

### Type Scale

| Role | Desktop | Mobile | Use |
|---|---:|---:|---|
| Country masthead | 56/58 | 40/42 | Country identity |
| Page heading | 40/44 | 32/36 | Product and editorial page title |
| Section heading | 30/36 | 26/32 | Major content section |
| Subheading | 21/28 | 20/27 | Local hierarchy |
| Long-form body | 18/28 | 17/27 | Official-source explanation |
| UI body | 16/24 | 16/24 | Controls and task content |
| Metadata | 13/19 | 13/19 | Dates, source state, provenance |

Do not render meaningful text below 12px. Instrument Serif is a brand signal, not the default for every heading.

## Color

- **Approach:** Restrained. Sand carries brand warmth. Teal identifies official sources and links. Status colors communicate operational state.
- **Rule:** Brand color and action color are separate in light mode so controls meet WCAG contrast requirements.

### Light Mode

| Token | Value | Use |
|---|---|---|
| `canvas` | `#F2F1ED` | Page background |
| `paper` | `#FBFAF7` | Reading and raised surfaces |
| `ink` | `#17191C` | Primary text |
| `text-secondary` | `#5A5650` | Supporting text |
| `text-tertiary` | `#6A655E` | Metadata on light surfaces |
| `brand-sand` | `#A58B58` | Decorative brand accent only |
| `action-primary` | `#756034` | Buttons, small accents, interactive text |
| `source-official` | `#2F6F82` | Official sources and trusted links |
| `status-verified` | `#267250` | Verified/current state |
| `status-warning` | `#8A6815` | Review due or caution |
| `status-risk` | `#9E3F35` | Suppression, error, critical risk |

### Dark Mode

Retain the current warm near-black, cream, sand, and cool teal identity where contrast is already sufficient:

- Background `#07090D`
- Raised surface `#0E1218`
- Primary text `#F2EFE8`
- Secondary text `#C5BFB1`
- Sand action `#C8B48A`
- Official-source teal `#7EB8C9`

### Naming Rule

Component code must migrate toward semantic names such as `text-primary`, `text-secondary`, `surface-raised`, `action-primary`, `source-official`, and `status-changed`. Retire visual aliases such as `navy-800`, `jungle`, and `sand-200` from new component code.

## Spacing and Density

- **Base unit:** 4px.
- **Field Guide:** Comfortable reading rhythm with 48 to 80px between major sections.
- **Planner:** 16 to 32px task rhythm.
- **Editorial Desk:** Compact but never cramped. 12 to 24px spacing with clear row grouping.
- **Touch:** Every touch target is at least 44 by 44px.
- **Page edges:** 16 to 20px on mobile, 24 to 40px on tablet, and grid-aligned gutters on desktop.

Scale: 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.

## Layout

- **Approach:** Hybrid. Editorial composition for public reading, grid discipline for tools and admin.
- **Maximum canvas:** 1280px.
- **Reading width:** 680 to 740px.
- **Dashboard width:** 1040 to 1180px.
- **Desktop country portal:** 12-column grid with a 220 to 240px contents rail, 680 to 740px reading column, and 260 to 300px context/source rail.
- **Mobile country portal:** Single reading column, 16 to 20px margins, and a contents sheet with section progress. Do not use a long horizontal row of pills as primary navigation.
- **Mobile planner navigation:** Safe-area-aware bar with Plan, Explore, Saved, Alerts, and Account.

### Radius Hierarchy

- 4 to 6px for data cells and compact controls.
- 8 to 10px for interactive panels.
- 14 to 16px for major sheets and callouts.
- Fully rounded pills only for status, toggles, and major brand calls to action.

Cards are reserved for independently actionable units. Hairline rules and whitespace should define most editorial structure.

## Evidence and Trust Display

The central information pattern is an editorial evidence annotation, not a generic claim card.

Every high-value guidance unit should answer:

1. **What the official source says**
2. **What it means for planning**
3. **Who this applies to**
4. **What to do next**

The visible status line should be concise, for example:

> Official source · Checked 14 July 2026 · Applies to tourist stays

Display the authority, direct government link, effective date, last successful check, change state, and professional-review state. Put release IDs, hashes, and deeper provenance in an expandable evidence drawer or mobile bottom sheet.

Never style Elsewhere as a government agency, law firm, medical provider, or official authority. Clear sourcing must strengthen trust without implying endorsement.

## Components

### Buttons

- Primary: solid accessible action color, clear label, 44px minimum height.
- Secondary: quiet outline or text action with visible hover and focus.
- Destructive: explicit risk color and confirmation language.
- Avoid gradient buttons and clusters of competing calls to action.

### Status

- One primary status line is preferred over a stack of badges.
- Use pills only when the shape improves scanning.
- Never rely on color alone. Include a plain-language label and, when useful, an icon.

### Forms

- Every input has a persistent visible label.
- Helper, error, and privacy text are separate from placeholders.
- Errors explain how to recover.
- Use native input semantics, autocomplete, and correct mobile keyboards.

### Country Identity

- Use a controlled country-code or vector-flag system rather than operating-system emoji as the primary visual identity.
- Native country names and local scripts are first-class content.
- Photography must be real, credited, and sparse. Do not use generic laptop-on-a-beach imagery.

## Motion

- **Approach:** Intentional and functional.
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Durations:** 120ms micro, 180ms control, 260ms panel, and 420ms only for major view transitions.
- Animate opacity and transform. Avoid `transition-all`.
- Motion should clarify source drawers, navigation position, checklist completion, and changed-information alerts.
- Honor reduced motion everywhere.
- The Earth scene and loader retain their existing motion and behavior.

## Responsive and International Requirements

- Support long translations, right-to-left layout, native scripts, locale dates, currencies, units, and names from the beginning.
- Server-render country portals and core guidance.
- Keep the Earth bundle homepage-only.
- Lazy-load maps, charts, source drawers, and non-critical media.
- On mobile, preserve safe-area padding and avoid controls hidden behind browser or device chrome.

## Accessibility and Performance

- Meet WCAG 2.2 AA in light and dark themes.
- Body and UI text require 4.5:1 contrast; large text requires 3:1.
- Fix the current light-mode sand action and opacity-stacked muted text before broad visual polish.
- Provide visible focus, visited-link states, keyboard-friendly contents navigation, and accessible dialog focus management.
- Targets: LCP under 2 seconds, INP under 200ms, CLS under 0.1 on country and product pages.

## Anti-Convergence Rules

Avoid:

- Three equal feature cards as the default answer to every layout.
- Card mosaics for dashboards and editorial queues.
- Badge stacks before the primary content.
- Uniform large radii and pill clusters.
- Purple gradients, neon glow systems, or generic stock hero imagery.
- Centered-everything composition.
- Placeholder-only labels.
- Public copy that mentions internal phases, scaffolds, repository filenames, or implementation notes.
- Decorative APIs or live data without a clear decision or action benefit.

## API Experience Rule

An API earns a place only when it helps a user decide or act. Priority experiences are:

- Official-source change alerts that say what changed, who may be affected, and what plan step to reconsider.
- A context lens for citizenship, residence, purpose, household, and intended duration.
- Time-horizon tools that turn rules into dated milestones.
- Currency views with timestamps and visible assumptions.
- Functional maps for consulates, hospitals, airports, and official hazard layers.
- Saved-source watchlists and correction notifications.

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-16 | Adopt “Elsewhere Field Guide” as the product system | The Earth already carries aspiration; product screens should differentiate through international editorial authority, useful evidence, and next actions. |
| 2026-07-16 | Freeze the Earth scene and loading experience | Direct owner requirement and established brand value. |
| 2026-07-16 | Keep Instrument Serif and Outfit with narrower roles | Preserves recognizable brand DNA while reducing template-like repetition. |
| 2026-07-16 | Separate decorative sand from accessible light-mode actions | Current light-theme action and eyebrow contrast does not meet the intended standard. |
| 2026-07-16 | Replace card-first country portals with dossier layouts | Country portals are the product's proof and need reading, evidence, context, and actions in one composition. |
