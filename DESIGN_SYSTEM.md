# Expat Atlas — Design System

**Codename:** Atlas Calm  
**Feel:** Trusted relocation command center × premium travel editorial × calm financial planner

---

## Design Principles

1. **Trust before beauty** — source badges, disclaimers, and clarity beat decoration
2. **Calm over hype** — reduce fear; never fearmonger
3. **Editorial hierarchy** — serif headlines, sans body, generous whitespace
4. **Operational utility** — dashboards feel like tools, not posters
5. **Progressive motion** — cinematic on capable devices; respectful of `prefers-reduced-motion`

---

## Color Tokens

```css
:root {
  /* Brand */
  --color-navy-950: #0a1628;
  --color-navy-900: #0f2140;
  --color-navy-800: #1a3358;
  --color-sand-100: #f5f0e8;
  --color-sand-200: #e8dfd2;
  --color-sand-300: #d4c4a8;
  --color-jungle-600: #2d6a4f;
  --color-jungle-500: #40916c;
  --color-ivory-50: #faf9f6;
  --color-gold-400: #c9a227;
  --color-gold-500: #b8941f;
  --color-ocean-400: #4a90a4;
  --color-ocean-500: #3a7a8c;

  /* Semantic */
  --color-background: var(--color-ivory-50);
  --color-foreground: var(--color-navy-950);
  --color-primary: var(--color-jungle-600);
  --color-primary-foreground: #ffffff;
  --color-accent: var(--color-ocean-500);
  --color-muted: var(--color-sand-200);
  --color-muted-foreground: #5c6470;
  --color-border: #e2ddd4;
  --color-card: #ffffff;
  --color-destructive: #b42318;
  --color-warning: #b54708;
  --color-success: var(--color-jungle-600);

  /* Glass (sparingly) */
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-border: rgba(255, 255, 255, 0.35);
  --glass-blur: 12px;
}
```

### Dark mode (app shell)

Navy backgrounds with sand/ivory text; jungle accents for CTAs.

---

## Typography

| Role | Font | Fallback | Usage |
|------|------|----------|-------|
| Display | Cormorant Garamond | Georgia, serif | Hero H1, section titles |
| Headline | Playfair Display | Georgia, serif | Alt display option |
| Body / UI | Manrope | Inter, system-ui | Body, labels, buttons |
| Mono | JetBrains Mono | monospace | codes, stats |

### Scale

| Token | Size | Line height |
|-------|------|-------------|
| `text-display` | 3.5rem / 56px | 1.1 |
| `text-h1` | 2.5rem | 1.15 |
| `text-h2` | 2rem | 1.2 |
| `text-h3` | 1.5rem | 1.3 |
| `text-body` | 1rem | 1.6 |
| `text-sm` | 0.875rem | 1.5 |
| `text-xs` | 0.75rem | 1.4 |

---

## Spacing & Layout

Base unit: **4px**

| Token | Value |
|-------|-------|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-12` | 48px |
| `space-16` | 64px |
| `space-24` | 96px |

**Container:** max-width 1280px marketing; 1440px landing hero; 960px reading width for trust/legal.

---

## Radius & Shadow

| Token | Value |
|-------|-------|
| `radius-sm` | 6px |
| `radius-md` | 10px |
| `radius-lg` | 16px |
| `radius-xl` | 24px |
| `radius-full` | 9999px |

| Shadow | Usage |
|--------|-------|
| `shadow-sm` | Cards at rest |
| `shadow-md` | Hover cards |
| `shadow-lg` | Modals, floating dashboard |
| `shadow-glow` | 3D globe accent (subtle) |

---

## Component Variants

### Buttons

| Variant | Style |
|---------|-------|
| `primary` | Jungle bg, white text, subtle lift on hover |
| `secondary` | Navy outline on sand |
| `ghost` | Text only |
| `gold` | Muted gold accent for premium CTAs |
| `destructive` | Red — delete/report confirm |

### Cards

| Variant | Usage |
|---------|-------|
| `default` | White, border, shadow-sm |
| `elevated` | shadow-md, hover lift |
| `glass` | Landing floating dashboard cards |
| `country` | Image header + score bars |
| `visa` | Left accent border by risk level |
| `stat` | Dashboard metric |
| `partner` | Logo slot + verification badge |

### Badges (critical for trust)

| Badge | Color | When |
|-------|-------|------|
| Official Source | ocean | Linked govt/embassy claim |
| Last Verified | jungle | Within review window |
| Needs Review | warning | Stale or unverified |
| Sponsored | gold outline | Paid placement |
| Demo Listing | muted dashed | Sample data |
| Verified Partner | jungle | Admin verified |
| Pending Verification | sand | Partner queue |
| High Risk | destructive | Legal/property caution |
| Legal Review Recommended | navy | Requires professional |
| Affiliate Link | subtle | Outbound monetized link |
| Planning Estimate | muted | Budget/cost figures |

### Score Bar

Horizontal bar 0–100 with label + tooltip explanation. Color thresholds:

- 0–39: muted/warning
- 40–69: ocean
- 70–100: jungle

### Timeline

Vertical journey steps (passport → departure) with scroll-linked active state.

### Checklist Item

States: `not_started`, `in_progress`, `done`, `blocked`, `needs_review` — each with icon + color.

---

## Landing Page Sections (visual map)

1. **Hero** — parallax layers + 3D globe + dual CTA
2. **Problem** — 8 pain cards, editorial grid
3. **Solution** — 10 feature cards
4. **First-timers** — full-bleed image + copy
5. **Country grid** — 9 cards with hover score bars
6. **Dashboard preview** — animated stat cards
7. **Source trust** — collapsing sources animation
8. **Partner slots** — empty verified slots
9. **Mobile mockup** — phone frame
10. **Pricing** — tier cards
11. **Footer** — trust links

---

## Motion Guidelines

| Effect | Library | Fallback |
|--------|---------|----------|
| Hero parallax | Framer Motion | Static layers |
| Globe | R3F (dynamic import) | Static map image |
| Journey timeline | Framer scroll | Stepped list |
| Card hover | CSS + Framer | None |
| Source collapse | Framer | Fade only |
| Reduced motion | — | All animations off |

**Rule:** No animation may block content or hurt LCP.

---

## Accessibility

- WCAG 2.1 AA contrast minimum
- Focus rings on all interactive elements
- Semantic landmarks (`header`, `main`, `nav`, `footer`)
- Skip link on marketing pages
- `aria-live` for dynamic scores
- Form labels + error associations
- Touch targets ≥ 44px on mobile

---

## shadcn/ui Mapping

Install in `packages/ui`:

- Button, Card, Badge, Dialog, Sheet, Tabs, Accordion
- Form, Input, Select, Checkbox, RadioGroup
- Tooltip, Popover, DropdownMenu
- Skeleton, Separator, Alert

Customize via CSS variables above in `globals.css`.

---

## Mobile (Expo)

Share tokens via `packages/config/tokens.ts` exported as JS objects for React Native StyleSheet or NativeWind.

Priority screens: Dashboard, My Plan, Tasks, Budget, Passport, Saved, Visa cards, Alerts.

---

## Imagery

- High-quality nature/city photography (licensed stock)
- Soft gradients navy → ocean overlays on heroes
- Subtle map textures as background patterns
- No cheesy stock “business handshake” imagery

---

## File Locations (when implemented)

```
packages/ui/
├── src/
│   ├── tokens/
│   ├── components/
│   │   ├── country-card.tsx
│   │   ├── visa-card.tsx
│   │   ├── score-bar.tsx
│   │   ├── source-claim-badge.tsx
│   │   ├── trust-disclaimer.tsx
│   │   └── ...
│   └── hooks/
└── tailwind-preset.ts
```
