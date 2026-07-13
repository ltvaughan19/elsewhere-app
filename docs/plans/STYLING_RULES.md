# Elsewhere — Styling Rules

**Brand:** Elsewhere  
**Feel:** Warm night sky · calm adult · cinematic then operational  
**Date:** 2026-07-13  
**Surfaces:** One web site (landing + product) · one mobile app (later)  

This document is the **source of truth** for visual design. Older “Expat Atlas / Atlas Calm” cream-and-ivory marketing look is **retired** for user-facing UI.

---

## 1. Design principles

1. **Brand first on marketing** — Elsewhere name is a hero-level signal on the landing page, not just nav text.
2. **Calm over hype** — No neon glows, no purple SaaS defaults, no bro-nomad energy.
3. **Trust is visible** — Badges, sources, and disclaimers are first-class UI, not footnotes.
4. **One composition per viewport (marketing)** — Landing first screen: brand, one headline, one supporting line, one CTA group, one dominant visual (Earth).
5. **Tools feel like tools (app)** — App screens optimize for reading and tasks; less cinema, same palette.
6. **Motion earns its place** — Cinematic on landing; subtle in app; always honor `prefers-reduced-motion`.
7. **Mobile is not an afterthought** — Earth/visual can lead; copy must remain readable.

---

## 2. Surfaces & modes

| Surface | Mode | Purpose |
|---------|------|---------|
| **Landing** (`/`) | Dark cinematic | Emotion + waitlist / Start Fit Quiz |
| **Marketing pages** | Dark editorial | Trust, pricing, about, education |
| **Product app** (`/app/*`, quiz, path) | Dark operational | Dashboards, forms, checklists |
| **Mobile app** | Dark operational | Same tokens; denser spacing |

**Rule:** Do not split into a light public site and a dark app of unrelated brands. Light ink-on-paper “ivory” is **not** the default. Soft light *cards* on dark chrome are OK.

---

## 3. Color tokens

### Core palette (CSS variables)

```css
:root {
  /* Foundations */
  --bg: #07090d;
  --bg-elevated: #0e1218;
  --bg-card: #12161e;
  --fg: #f4f1ea;
  --muted: rgba(244, 241, 234, 0.64);
  --soft: rgba(244, 241, 234, 0.4);
  --border: rgba(244, 241, 234, 0.12);
  --border-strong: rgba(244, 241, 234, 0.22);

  /* Accents */
  --accent: #c8b48a;          /* warm sand / gold — primary CTA fill */
  --accent-hover: #d4c49a;
  --accent-ink: #12141a;      /* text on accent buttons */
  --accent-2: #7eb8c9;        /* cool secondary / links */
  --glow: rgba(126, 184, 201, 0.28);

  /* Semantic */
  --success: #3d8f6e;
  --warning: #c9a227;
  --danger: #c45c4a;
  --info: #7eb8c9;

  /* Trust badges */
  --badge-official: rgba(126, 184, 201, 0.18);
  --badge-demo: rgba(244, 241, 234, 0.08);
  --badge-risk: rgba(196, 92, 74, 0.2);
  --badge-sponsored: rgba(200, 180, 138, 0.2);
}
```

### Usage rules

| Token | Use for |
|-------|---------|
| `--accent` | Primary buttons, key progress marks, quiet highlights |
| `--accent-2` | Links, secondary focus, “official source” chill |
| `--fg` | Headings and primary body |
| `--muted` | Supporting copy |
| `--border` | Cards, inputs, dividers — keep hairline, not heavy boxes |
| `--bg-card` | Interactive containers only — default is not “cards everywhere” |

### Forbidden defaults (AI / SaaS clichés)

- Purple-on-white / indigo gradients  
- Flat cream `#F4F1EA` full-page backgrounds as brand default  
- Neon glow stacks, rainbow gradients  
- Emoji as primary UI  
- Rounded-full pill *clusters* that compete with the headline  

---

## 4. Typography

| Role | Font | Weight | Use |
|------|------|--------|-----|
| Display / brand | **Instrument Serif** | 400 (italic for emphasis) | Logo wordmark, H1, section titles |
| Body / UI | **Outfit** | 300–500 | Body, nav, buttons, forms |
| Mono (rare) | JetBrains Mono or system mono | 400 | Codes, claim IDs, admin |

### Scale (web)

| Token | Size | Notes |
|-------|------|-------|
| `display` | clamp(2.5rem, 6vw, 3.75rem) | Landing H1 |
| `h1` | 2.25–2.75rem | Page titles in app |
| `h2` | 1.75–2rem | Sections |
| `h3` | 1.25–1.5rem | Cards / steps |
| `body` | 1rem / 1.55 | Default |
| `sm` | 0.875rem | Meta, badges |
| `eyebrow` | 0.72rem + tracking 0.16em | Uppercase section labels |

### Type rules

- One em accent per headline max (`You need one calm path.`).  
- Body never compete with Earth on first paint — lighter weight, muted color.  
- App: prefer Outfit for dense UI; reserve Instrument Serif for titles.

---

## 5. Layout & composition

### Landing (marketing)

- Max content width: ~1120–1280px.  
- Hero: **full-bleed** Earth / space field — not an inset card collage.  
- First viewport budget: **brand + 1 headline + 1 sentence + 1 CTA group + Earth**. No stats strip, no partner logos, no pricing tiles in hero.  
- No floating promo stickers on hero media.  
- Scroll story sections: one purpose, one headline, one short body each.

### App / tools

- Max reading width: ~720–768px for quiz/path.  
- Dashboard: ~960–1120px.  
- Sidebar or top tabs on desktop; horizontal scroll nav on mobile.  
- Cards only for **interactive** units (quiz options, saved countries, claim blocks).

### Spacing

Base **4px**. Prefer generous vertical rhythm on marketing (48–96px sections); tighter in app (16–32px).

---

## 6. Components

### Buttons

| Type | Style |
|------|-------|
| Primary | Pill / fully rounded · `--accent` fill · `--accent-ink` text |
| Ghost | Transparent · 1px `--border` · `--fg` text |
| Danger | Outline or soft `--danger` fill · use sparingly |

Never: flat Material rectangles as primary brand CTA.

### Badges (trust)

- Demo / needs verification → dashed or muted badge  
- Official / verified claim → cool `--accent-2` tint  
- Sponsored → warm `--accent` tint + explicit “Sponsored” label  
- Risk → `--danger` tint  

### Forms

- Dark inputs: `--bg-elevated`, light text, clear focus ring (`--accent-2`)  
- Large tap targets (≥44px) on mobile  
- Errors in `--danger`, helper text in `--muted`

### Claims / source display

Always show: summary · source name/link · confidence · verification label · disclaimer fragment.  
Use `SourceClaimCard` pattern — do not invent unverified “official” chrome.

---

## 7. Motion

| Context | Allowed |
|---------|---------|
| Landing Earth | Slow camera scrub with scroll; soft question-tag orbit |
| Marketing sections | Fade/slide in on enter (subtle) |
| App | Progress bars, quiz step transitions ≤ 200–300ms |
| Reduced motion | Static Earth frame; no orbit; instant section visibility |

Ease: `cubic-bezier(0.22, 1, 0.36, 1)` (Elsewhere ease).

---

## 8. Imagery & 3D

- **Locked visual:** Spline Earth scene used on marketing hero (do not rematerialize Earth textures casually — see Elsewhere `NOTES.md`).  
- Question tags: anxious human questions → fade as clarity arrives.  
- Lifestyle photography (later): warm natural light, real places — not stock “laptop beach bro.”  
- Lazy-load heavy 3D; provide dark CSS fallback globe if WebGL fails.

---

## 9. Marketing vs app density

| | Marketing | App |
|--|-----------|-----|
| Chrome | Minimal transparent / soft glass nav | Sticky, denser nav |
| Copy | Emotional, short | Instructional, scannable |
| Accent usage | Sparse, high impact | Used for progress + CTAs |
| Earth / 3D | Hero dominant | Rare or absent |

Same **tokens**, different **density**.

---

## 10. Mobile app (future Expo)

- Import tokens from `packages/ui` / shared CSS variables mirrored in RN theme.  
- Outfit + Instrument Serif via expo-font.  
- Prefer native stack headers in dark theme matching `--bg` / `--fg`.  
- No separate “light brand” for mobile.

---

## 11. Accessibility

- Body text contrast ≥ WCAG AA on `--bg`.  
- Do not rely on color alone for claim status — include text labels.  
- Focus visible on all interactive elements.  
- Hit areas ≥ 44×44px on touch.

---

## 12. Implementation map

| File / package | Role |
|----------------|------|
| `apps/web/app/globals.css` | Token source for Next |
| `packages/ui` | Shared Badge, SourceClaimCard, buttons later |
| Marketing landing | Port from `Elsewhere/` Spline + tags into Next `/` |
| This doc | Rules; win conflicts with old DESIGN_SYSTEM |

When Tailwind classes conflict with these tokens, **tokens win** — migrate class names over time.

---

## 13. Quick “brand test”

Remove the nav. If the first viewport could belong to any SaaS, branding is too weak.  
Elsewhere must still read as **Elsewhere**: wordmark + Earth + calm headline.
