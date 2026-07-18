# AMTECH Web Design System v1.1

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

Each token may have an OKLCH enhancement, but the exact hex value remains the compatibility fallback and brand reference.

**Rule:** No orange, gold, beige, rainbow palettes, purple AI gradients, or competing accent colors. **No dark mode ever.** Emit `color-scheme: only light`; do not generate dark-mode branches or `light-dark()` tokens.

## Surfaces

- **Base:** White (`#FFFFFF`) or `canvas` (`#F7F9FC`) with subtle blue/red-tinted radial or linear gradients.
- **Glass:** `rgba(255,255,255,.70-.88)`, `backdrop-blur: 24-40px`, `1px black/6-8%` border.
- **Cards:** 16-24px radius, soft shadow, generous padding. Hover only slightly increases border/shadow.
- **Dark surfaces:** Never used. All surfaces remain light.

## Typography

- **Family:** `Inter, system-ui, sans-serif`
- **Hierarchy:** Large bold headlines; compact body; strong contrast.
- **Labels:** Small uppercase mono/letter-spaced eyebrow.
- **Rule:** One eyebrow maximum per section. No redundant pills, subtitles, or stacked headings.
- **Modern CSS:** Use fluid `clamp()` scales and balanced headings when supported by the declared browser tier.

## Layout

- **Grid:** Wide centered container; strong alignment; large whitespace; responsive 1-3 column grids.
- **Density:** Information-rich but uncluttered.
- **Rhythm:** Clear section breaks; consistent 8px spacing scale.
- **Mobile:** Mobile-first; stack cleanly; preserve hierarchy and tap targets.
- **Components:** Prefer container-query behavior so components remain correct when composed by the page-matrix compiler.

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

### Semantic page constructors

The framework must support these registered constructors:

- hero;
- answer;
- workflow;
- proof;
- comparison;
- FAQ;
- CTA;
- instruction pointer.

Each constructor must declare supported layout roles, responsive behavior, evidence rules, accessibility assertions, performance budget, fallback, and approved variants.

## Browser and CSS contract

Before writing or generating CSS, resolve browser targets from:

1. `package.json` browserslist;
2. `.browserslistrc`;
3. Vite, Next.js, or Astro configuration;
4. the framework Tier 2 fallback.

The current public framework baseline is:

```text
Chrome 111+
Edge 111+
Firefox 113+
Safari 16.4+
iOS Safari 16.4+
```

The renderer records a 57-item modern-CSS feature decision report. Features outside the resolved tier require `@supports` fallback or are skipped. Browser compatibility is a compiler input, not an after-the-fact lint.

## Agentic developer contract

An agentic developer does not design a page from a blank prompt. It receives:

```text
page-matrix coordinate
+ vector prototype IDs and nearest neighbors
+ semantic module sequence
+ layout roles
+ evidence and canonical content
+ approved variant axes
+ browser tier
+ this design authority
```

It must return a deterministic component plan and complete static HTML/CSS. The framework rejects outputs that:

- invent colors, tokens, or component families;
- alter product facts, evidence, price, canonical intent, graph edges, or publication state;
- omit required module/layout coverage;
- require JavaScript for canonical meaning or action;
- exceed declared CSS, image, layout-shift, or interaction budgets;
- diverge under source reordering.

The supported layout archetypes are editorial, workflow-led, proof-led, comparison-led, and utility-led. Archetype selection is derived from the page matrix and information structure, not aesthetic randomness.

## Optional Three.js / R3F capability

3D is allowed only when it explains workflow, proof, system topology, or page-vector relationships better than static CSS/SVG.

Mandatory rules:

- complete static SVG or image poster first;
- equivalent semantic HTML outside canvas;
- user activation before loading the 3D island;
- one WebGL context maximum per page;
- React Three Fiber `frameloop="demand"`;
- bounded/adaptive DPR;
- shared geometry/materials and instancing where applicable;
- no postprocessing by default;
- no decorative continuous animation;
- reduced motion uses the static poster;
- no 3D asset on the critical rendering path;
- no Wasm in the graphics path without a measured end-to-end win.

A page remains visually complete and conversion-capable when WebGL, JavaScript, R3F, or the optional adapter is absent.

## Visual Rules

1. Use red for brand/action, blue for systems/data, green for success/rewards.
2. Prefer cool gradients, glass, thin borders, and restrained shadows.
3. Avoid ornamental UI, excessive badges, floating pills, fake metrics, and generic AI copy.
4. Every element must support hierarchy, comprehension, trust, or action.
5. Use icons only when they improve scanning; never as decoration.
6. Animations: subtle opacity/translate/scale, 180-300ms; no bouncing or spectacle.
7. Canonical JavaScript is zero by default; progressive enhancements load only when justified.
8. Heavy off-screen sections should use containment and content-visibility where browser targets permit.

## Copy

- **Tone:** Direct, concrete, confident, human.
- **Structure:** Outcome → capability → operational detail → proof/action.
- **Avoid:** Repetition, vague superlatives, "unlock/empower/revolutionize," unnecessary headings.

## Validation

Every generated site must produce validation, pass, and fail vectors covering:

- browser target resolution;
- CSS feature decisions;
- page-matrix and vector fidelity;
- semantic constructor and layout-role coverage;
- deterministic rendering;
- responsive, reduced-motion, no-JS, metadata, schema, and accessibility parity;
- critical CSS, layout shift, interaction, and optional 3D budgets.

Visual quality is enforced through constrained grammar and golden fixtures. The framework must not claim that arbitrary agent output is inherently beautiful without rendered review evidence.

---

**Enforcement:** This document is the single source of truth for all public AMTECH web surfaces. Any deviation requires an explicit update to this file with rationale and reviewer sign-off.
