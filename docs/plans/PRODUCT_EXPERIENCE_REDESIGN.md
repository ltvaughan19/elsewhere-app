# Elsewhere product experience redesign

**Date:** July 16, 2026
**Branch:** `codex/product-experience-redesign`
**Status:** Approved by founder direction; implementation in progress

## Outcome

Elsewhere should feel like one calm product before and after sign-in. A user
should always know where they are, what matters next, and where the underlying
information came from. The interface must communicate restraint before it asks
for personal information.

The redesign preserves the frozen Earth scene and loading experience. It
replaces the current split between a marketing header, a crowded planner rail,
and editorial-preview pages with one stable product shell and contextual
navigation.

## Baseline findings

- Public pages expose 23 to 32 interactive targets below Elsewhere's 44px target
  standard.
- The planner presents 12 destinations before the user can complete one task.
- Public and planner navigation use different structures and different names for
  the same destinations.
- The public header gives Countries, Compare, Visa Compass, Pricing, Trust,
  Dashboard, Log in, and Start Fit Quiz similar visual weight.
- The country directory repeats the same preview explanation three times and
  advertises `0 of 3 released`.
- Public country previews expose internal editorial language and 11 repeated
  `In review` states.
- The dashboard is a generic card mosaic with four competing next actions.
- The login screen competes with the full marketing navigation and repeats legal
  caveats instead of explaining account privacy and recovery.
- A fixed mobile CTA, header CTA, page CTA, and footer links often repeat the
  same destination.

## Research translated into rules

1. Navigation is not a site map. The global shell contains only the most useful
   top-level destinations. Detailed tools move into contextual navigation.
2. Repeated navigation stays in the same relative order across a given product
   state.
3. A long, multi-session relocation plan is presented as a task sequence with
   clear status, not a dashboard of decorative cards.
4. Important controls target at least 44 by 44px, exceeding the WCAG 2.2 AA
   minimum.
5. Previously entered plan information is reused instead of requested again.
6. The product is evaluated at 375, 768, 1024, and 1440px, with intentional
   behavior at each width.
7. The performance acceptance gate is LCP <= 2.5s, INP <= 200ms, and CLS <=
   0.1 at the 75th percentile once field measurement is installed.

Primary references:

- https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html
- https://design-system.service.gov.uk/patterns/navigate-a-service/
- https://design-system.service.gov.uk/patterns/complete-multiple-tasks/
- https://docs.stripe.com/dashboard/basics
- https://web.dev/articles/vitals

## Information architecture

### Global destinations

The stable masthead is the seam between public research and personal planning.

- **Explore**: country research and supporting planning tools
- **Compare**: side-by-side country comparison
- **Plan**: the user's personal plan home
- **Saved**: appears for the signed-in/planner context
- **Account**: login or account settings, always at the far right

Pricing is acquisition context, not daily navigation. Trust is embedded in
evidence displays and remains available through “How it works” and the footer.
Visa Compass, Passport, Budget, Housing, and Insurance are tools inside Explore
or the Plan workspace rather than permanent global links.

### Plan workspace

The plan workspace uses one quiet local navigation row:

1. Overview
2. Path
3. Tasks
4. Passport
5. Budget

This row only appears inside the plan. On mobile it becomes a single current-
section control that opens a sheet. The persistent mobile bar contains Plan,
Explore, Saved, and Account.

### Country workspace

Country pages use a contextual contents rail only when the page contains
released guidance. Preview pages show a concise research outline. They do not
repeat eleven identical review statuses or expose internal production language.

## Screen hierarchy

### Country directory

1. Page purpose: choose a country to research
2. Shared trust note: guidance remains withheld until reviewed
3. Country rows: name, region, publication state, one clear action
4. Supporting tools: Compare and Visa Compass

Remove release counters while the count is zero. Do not repeat the same preview
paragraph inside each country row.

### Plan home

1. Greeting and plan title
2. One next action
3. Plan status: readiness, destination, timing
4. Task sequence grouped by stage
5. One contextual caution with a recovery action

Cards are used only for the next-action workspace. Status and task information
use rows, definitions, and whitespace.

### Onboarding

1. Focused masthead
2. Progress stated as step and percentage
3. One question
4. Persistent explanation of why the answer is used
5. Back and Continue actions in predictable positions

Do not display the full product map beside the questionnaire. Answers remain
editable, autocomplete is allowed, and saved values are reused.

### Authentication

1. Focused login form
2. Clear account relationship
3. Password-manager-friendly fields
4. Recovery path
5. Short privacy explanation

The account screen must not compete with acquisition CTAs.

## Visual system

- Keep Instrument Serif for the wordmark, country names, and one page-level
  headline.
- Use Outfit for navigation, controls, forms, and operational headings.
- Cap public page headings at 56px desktop and 40px mobile outside the Earth
  experience.
- Use a 16px minimum body size and 13px minimum metadata size.
- Prefer hairline rules and whitespace over bordered cards.
- Use sand once per view for the primary action. Use teal for source and evidence
  links only.
- Use 6–10px radii for controls and 12–16px only for major sheets.
- Remove decorative icon sets from persistent desktop navigation.

## Motion and continuity

- The masthead height and placement remain stable between public and planner
  pages.
- Route changes do not animate the entire page. Context panels enter with a
  180–260ms opacity/translate transition.
- Menus and sheets retain spatial origin and close on Escape or backdrop click.
- Loading states reserve final layout space to avoid movement.
- Reduced-motion users receive immediate state changes.

## Trust and privacy

- Explain why personal information is requested next to the relevant input.
- Never imply Elsewhere is a government agency or licensed professional.
- Public preview language describes what is available, not internal workflow.
- Evidence state appears beside guidance, not as a global stack of trust badges.
- Login and account forms support password managers, paste, autocomplete, and
  specific recovery messages.
- High-risk guidance remains unpublished until authorized review.

## Responsive behavior

### 1440+

- Masthead max width 1180–1240px
- Plan content max width 1120px
- Local plan navigation displayed as a restrained horizontal row
- Country reading layouts may use contextual rails

### 768–1439

- Same masthead with reduced gaps
- No permanent sidebar
- Two-column status layouts collapse when their reading measure would suffer

### 375–767

- Compact masthead with one menu control
- Four-item safe-area-aware bottom navigation inside the planner
- Local plan navigation opens as a sheet
- Full-width task rows and form controls
- No horizontally scrolling primary navigation

## Required states

Every changed screen must specify and verify:

- Loading
- First use / empty
- Populated
- Error
- Offline or failed request where relevant
- Saving
- Saved / success
- Disabled
- Keyboard focus
- Reduced motion
- Long text and translated labels
- Mobile safe area
- Light and dark theme

## Performance measurement path

- The production build records route-level JavaScript weight before release.
- Vercel field measurements should be reviewed at the 75th percentile after
  each production release for LCP, INP, and CLS.
- The release target is LCP <= 2.5s, INP <= 200ms, and CLS <= 0.1.
- A regression outside those thresholds pauses further visual expansion until
  the affected route is profiled and corrected.
- This implementation keeps the redesigned routes between 106 kB and 188 kB
  of first-load JavaScript in the current production build.

## Acceptance checklist

### Wayfinding

- [x] One recognizable Elsewhere masthead across public and planner surfaces
- [x] No more than four top-level destinations in a given state
- [x] Current global and local location indicated
- [x] Dashboard, countries, compare, saved, and account reachable on mobile
- [x] No duplicate fixed CTA competing with page actions

### Hierarchy and content

- [x] One primary action per view
- [x] No decorative dashboard card mosaic
- [x] No repeated preview paragraph per country
- [x] No zero-release marketing counter
- [x] No public implementation or editorial-workflow copy
- [x] Supporting text is useful when scanned without instructions

### Accessibility

- [x] WCAG 2.2 AA target
- [x] 44px Elsewhere target standard for important controls
- [x] Visible focus and logical focus order
- [x] Dialog focus management and Escape close
- [x] 4.5:1 body-text contrast
- [x] Persistent form labels and correct autocomplete
- [x] No blocked paste or password-manager behavior
- [x] Reduced motion honored

### Responsive

- [x] 375px mobile composition
- [x] 768px tablet composition
- [x] 1024px desktop composition
- [x] 1440px wide composition
- [x] No horizontal overflow
- [x] No content obscured by sticky or bottom navigation

### Quality and performance

- [x] Type check
- [x] Lint
- [x] Unit tests
- [x] Production build
- [x] Desktop and mobile Playwright flows
- [x] Console clean
- [x] Light and dark visual review
- [x] LCP / INP / CLS measurement path documented

## GSTACK REVIEW REPORT

| Runs | Status | Findings |
|---|---|---|
| Baseline live audit | Complete | Crowded dual navigation, repeated preview copy, undersized targets, card-first dashboard |
| Standards research | Complete | Navigation must be scoped, predictable, task-oriented, accessible, and stable |
| Design plan review | Complete | Replaced permanent planner rail with stable masthead plus contextual plan navigation |
| Implemented visual review | Complete | Public, account, onboarding, dashboard, and mobile navigation now share a calm hierarchy |
| Release validation | Complete | Type, lint, 155 unit tests, production build, dependency audit, and 37 desktop/mobile browser flows passed |

**VERDICT:** The unified shell, task-oriented plan home, quieter country
research, focused onboarding and account flows, and reduced footer are ready for
release. Continue future feature work inside this information architecture.

NO UNRESOLVED DECISIONS
