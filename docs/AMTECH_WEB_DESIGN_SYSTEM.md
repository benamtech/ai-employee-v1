# AMTECH Web Design System v1.0

**Status:** canonical · **Scope:** All public AMTECH web applications and surfaces (owner web, front-door, estimator, marketing site, admin, review pages, etc.)

**Goal:** Premium, modern B2B software — clear, restrained, operational. Not decorative.

## Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `ink` | `#111111` | Primary text, high-contrast elements |
| `white` | `#FFFFFF` | Base backgrounds, cards, glass |
| `canvas` | `#F7F9FC` | Page backgrounds, subtle containers |
| `red` | `#E11D2A` | Brand, primary CTA, active nav, destructive |
| `blue` | `#2563EB` | Product/data accents, informational states |
| `cyan` | `#DFF6FF` | Cool highlights, subtle emphasis |
| `green` | `#168A57` | Success, rewards, verified states |

**Rule:** No orange, gold, beige, rainbow palettes, or competing accent colors.

## Surfaces

- **Base:** Cool white (`canvas`) with subtle blue-tinted radial/linear gradients.
- **Glass:** `rgba(255,255,255,.70-.88)`, `backdrop-blur: 24-40px`, `1px black/6-8%` border.
- **Cards:** 16-24px radius, soft shadow, generous padding. Hover only slightly increases border/shadow.
- **Dark:** Use near-black sparingly for high-contrast feature panels.

## Typography

- **Family:** `Inter, system-ui, sans-serif`
- **Hierarchy:** Large bold headlines; compact body; strong contrast.
- **Labels:** Small uppercase mono/letter-spaced eyebrow.
- **Rule:** One eyebrow maximum per section. No redundant pills, subtitles, or stacked headings.

## Layout

- **Grid:** Wide centered container; strong alignment; large whitespace; responsive 1-3 column grids.
- **Density:** Information-rich but uncluttered.
- **Rhythm:** Clear section breaks; consistent 8px spacing scale.
- **Mobile:** Mobile-first; stack cleanly; preserve hierarchy and tap targets.

## Components

### Navigation
White/glass shell. AMTECH red for active state or primary action.

### Buttons
- **Primary:** Red fill (`#E11D2A`), white text, pill radius.
- **Secondary:** Soft neutral/glass, dark text.
- **Status:** Green (success), blue (informational), red (destructive).

### Forms
Large fields, explicit labels, visible validation, minimal steps.

### Tables
Quiet borders, strong headers, row actions grouped.

### Dashboards
Prioritize status, next action, and measurable outcomes.

## Visual Rules

1. Use red for brand/action, blue for systems/data, green for success/rewards.
2. Prefer cool gradients, glass, thin borders, and restrained shadows.
3. Avoid ornamental UI, excessive badges, floating pills, fake metrics, and generic AI copy.
4. Every element must support hierarchy, comprehension, trust, or action.
5. Use icons only when they improve scanning; never as decoration.
6. Animations: subtle opacity/translate/scale, 180-300ms; no bouncing or spectacle.

## Copy

- **Tone:** Direct, concrete, confident, human.
- **Structure:** Outcome → capability → operational detail → proof/action.
- **Avoid:** Repetition, vague superlatives, "unlock/empower/revolutionize," unnecessary headings.

---

**Enforcement:** This document is the single source of truth for all public AMTECH web surfaces. Any deviation requires an explicit update to this file with rationale and reviewer sign-off.