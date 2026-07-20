# AMTECH Web Design System

**Status:** canonical  
**Scope:** All public and product AMTECH web applications and surfaces: owner web, front door, onboarding, dashboard, signed Review, estimator, marketing, admin/operator, generated work objects, AG-UI components, and MCP Apps.  
**Companion standards:** `AMTECH_AGENT_INTERFACE_STANDARD.md`, `AMTECH_UI_VALIDATION_STANDARD.md`

## Authority order

1. This file controls visual language.
2. `AMTECH_AGENT_INTERFACE_STANDARD.md` controls agent state, interaction, evidence, AG-UI, and MCP Apps.
3. `AMTECH_UI_VALIDATION_STANDARD.md` controls pass/fail evidence.
4. Implementation trackers and handoffs report status only. They cannot redefine the system.
5. Historical 369, sharp-corner, 3px-grid, black-panel, or ink/white/red-only doctrines are non-canonical.

Any deviation requires a change to this file with rationale, evidence, and reviewer sign-off. Downstream code or documentation cannot create an exception by repetition.

## Goal

Premium, modern B2B software: clear, restrained, operational, trustworthy, and ready for sustained office work. Not decorative. Not a generic AI chat skin.

## Palette

| Token | Hex | Usage |
|---|---:|---|
| `ink` | `#111111` | Primary text, high-contrast elements |
| `white` | `#FFFFFF` | Base backgrounds, cards, glass |
| `canvas` | `#F7F9FC` | Page backgrounds, subtle containers |
| `red` | `#E11D2A` | Brand, primary CTA, active navigation, destructive |
| `blue` | `#2563EB` | Product/data accents, informational and working states |
| `cyan` | `#DFF6FF` | Cool highlights and subtle emphasis |
| `green` | `#168A57` | Success, rewards, verified states |

Semantic alpha variants may be derived from these tokens. Do not introduce a competing named accent.

**Forbidden:** orange, amber, yellow-as-status, gold, beige, purple, violet, rainbow palettes, dark mode, or near-black page/panel backgrounds.

## Surfaces

- **Base:** `white` or `canvas`, with subtle blue/red-tinted radial or linear gradients.
- **Glass:** `rgba(255,255,255,.70-.88)`, `backdrop-blur: 24-40px`, `1px` black at 6–8%.
- **Cards:** 16–24px radius, thin border, restrained soft shadow, generous padding.
- **Nested controls:** 12–16px radius when visually subordinate.
- **Pill controls:** reserved for buttons, compact status, and explicit filters—not general containers.
- **Hover:** slight border/shadow/translate change only.
- **Dark surfaces:** never used.

## Typography

- **Family:** `Inter, system-ui, sans-serif`.
- **Hierarchy:** large bold headlines; compact body; high contrast; tabular numerals for operational data.
- **Labels:** small uppercase or letter-spaced eyebrow in the same family. Monospace is not part of the canonical product UI.
- **Rule:** one eyebrow maximum per section. No redundant pills, subtitles, or stacked headings.
- **Measure:** body copy normally 45–75 characters per line.

## Layout

- **Grid:** wide centered container; strong alignment; responsive one-to-three-column grids.
- **Density:** information-rich but uncluttered.
- **Rhythm:** 8px spacing scale. Use 4px only for tightly coupled inline detail.
- **Hierarchy:** state and next action before secondary metadata.
- **Mobile:** mobile-first; clean stacking; preserved hierarchy; no hidden critical actions; no unintended horizontal overflow.
- **Focus mode:** one primary work object may expand while surrounding information quiets down.

## Components

### Navigation

White/glass shell. AMTECH red indicates the active state or primary action. Navigation labels name owner goals, not internal services.

### Buttons

- **Primary:** red fill, white text, pill radius.
- **Secondary:** white/glass or soft neutral, ink text.
- **Information:** blue only when the action is system-oriented and not the page’s primary conversion.
- **Success:** green for confirmed or verified state, not the default CTA.
- **Destructive:** red with explicit consequence.
- **Targets:** production target of at least 44px.

### Forms

Large controls, persistent explicit labels, visible field validation, short steps, preserved input, and secure fields outside conversation transcripts. Placeholder text is supplementary, never the only label.

### Tables and lists

Quiet borders, strong headers, tabular values, grouped row actions, responsive overflow, and a meaningful empty state.

### Dashboards

Prioritize:

1. current operating state;
2. what needs the owner;
3. work in progress;
4. completed outcomes and proof;
5. connections and recovery.

Avoid undifferentiated metric-card walls.

### Agent work objects

Every object shows goal/state, relevant inputs, work or proposed effect, owner decision when required, proof, next action, and recovery. The visual component may vary; the semantic contract cannot.

### Status

- `blue`: working, informational, scheduled.
- `green`: verified, accepted, completed.
- `red`: destructive, denied, failed, revoked.
- `ink/neutral`: idle, unavailable, unknown, secondary.

Never use amber as a warning shortcut. Explain the state in text.

## Visual rules

1. Use red for brand/action, blue for systems/data, and green for verified success.
2. Prefer cool gradients, glass, thin borders, and restrained shadows.
3. Avoid ornamental UI, excessive badges, floating pills, fake metrics, generic AI copy, and decorative icons.
4. Every element must support hierarchy, comprehension, trust, action, recovery, or proof.
5. Use icons only when they materially improve scanning; include accessible text.
6. Animation is subtle opacity/translate/scale, 180–300ms; no bouncing, spectacle, or continuous ambient motion.
7. Respect `prefers-reduced-motion`.
8. Fixture or demonstration data is visibly labeled.

## Copy

- **Tone:** direct, concrete, confident, human.
- **Structure:** outcome → capability → operational detail → proof/action.
- **Agent state:** say what is happening, what is held, what is needed, and what happens next.
- **Avoid:** repetition, vague superlatives, “unlock,” “empower,” “revolutionize,” unnecessary headings, anthropomorphic theatrics, or unexplained technical terms.

## Accessibility

WCAG 2.2 AA is the minimum target. Focus must be visible and unobscured. Controls must be keyboard operable. Forms use labels and field errors. Live state is announced without token-by-token noise. Authentication avoids cognitive-function tests and redundant entry.

## Enforcement

The source validator, UI unit contracts, production build, fixture browser matrix, accessibility review, and fixture-free acceptance packet determine conformance. A surface is not compliant merely because its colors look close.
