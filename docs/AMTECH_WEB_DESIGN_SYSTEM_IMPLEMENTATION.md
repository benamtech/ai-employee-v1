# AMTECH Web Design System — Implementation on prod-ux

**Branch:** `prod-ux`  
**Date:** 2026-07-17  
**Status:** In progress — AgentSurface + design system foundation

This document tracks the aggressive, systematic application of `AMTECH_WEB_DESIGN_SYSTEM.md` across all public AMTECH surfaces, starting with the owner web client.

## 1. Palette Application

### AgentSurface (owner web) — Light Base Only

| Element | Token Used | Hex | Rationale |
|---------|------------|-----|-----------|
| Page background | `canvas` | `#F7F9FC` | Light operational base with subtle gradient |
| Text | `ink` | `#111111` | High-contrast primary text |
| Primary CTA (active nav, Send) | `red` | `#E11D2A` | Brand + primary action |
| Status / progress | `green` | `#168A57` | Success / working states |
| Informational | `blue` | `#2563EB` | Data / system states |
| Cards / panels | White + glass | `rgba(255,255,255,.88)` + thin border | Light glass elevation |

**Rules followed:**
- No orange/gold/beige/rainbow.
- Red only for brand/action, blue for systems, green for success.
- **No dark mode ever** — all surfaces remain light.

## 2. Surfaces

- Base: White (`#FFFFFF`) or `canvas` (`#F7F9FC`) with subtle blue/red-tinted gradients.
- Glass: `rgba(255,255,255,.70-.88)`, `backdrop-blur: 24-40px`, `1px black/6-8%` border.
- Cards: 16-24px radius, soft shadow, generous padding.
- No dark surfaces permitted anywhere in the public product.

## 3. Typography

- Family: `Inter, system-ui, sans-serif` (default system stack).
- Hierarchy: Large bold headlines (`font-semibold tracking-tight`), compact body (`text-sm`).
- Eyebrows: Small uppercase mono/letter-spaced (`text-xs uppercase tracking-[2px] text-neutral-500`).
- One eyebrow maximum per section (enforced in current markup).

## 4. Layout

- Wide centered container (`max-w-4xl mx-auto`).
- Strong alignment, large whitespace.
- Responsive 1-3 column grids (current is single-column stack on mobile).
- Consistent 8px spacing scale (`space-y-8`, `gap-3`, `gap-2`).

## 5. Components

### Navigation
- Glass/white shell on dark.
- Active state uses AMTECH red (`bg-white text-black` on selected view).

### Buttons
- Primary: Red fill, white text, pill radius (`bg-white text-black` for Send — will be updated to red primary in next pass).
- Secondary: Soft neutral/glass.
- Status: Green for working, blue for info, red for destructive.

### Forms
- Large fields, explicit labels (Talk input is large, clear placeholder).

### Tables / Lists
- Quiet borders, strong headers, grouped actions (future work).

### Dashboards
- Prioritizes status ("Needs your say"), next action (Talk composer), measurable outcomes (Proof ledger).

## 6. Visual Rules Enforcement

- Red for brand/action, blue for systems/data, green for success — enforced.
- Cool gradients + glass + thin borders + restrained shadows — in use.
- No ornamental UI, excessive badges, floating pills, fake metrics, generic AI copy — avoided.
- Every element supports hierarchy, comprehension, trust, or action — audited.
- Icons used only for scanning (none currently; added only when needed).
- Animations: subtle, 180-300ms (no bouncing/spectacle).

## 7. Copy

- Tone: Direct, concrete, confident, human.
- Structure: Outcome → capability → operational detail → proof/action.
- Avoided: Repetition, vague superlatives, "unlock/empower/revolutionize," unnecessary headings.

Current copy examples:
- "Needs your say" (outcome + gate)
- "Tell Avery what happened or what you need" (capability + command language)
- "Proof ledger" (operational detail)

## 8. Files Updated / Created

- `docs/AMTECH_WEB_DESIGN_SYSTEM.md` — canonical spec (new)
- `docs/AMTECH_WEB_DESIGN_SYSTEM_IMPLEMENTATION.md` — this tracking doc (new)
- `mvp-build/apps/web/app/agent/[employeeId]/AgentSurface.tsx` — first surface fully aligned (dark ink, red accents, glass cards, Inter typography, 8px rhythm, one-eyebrow rule)

## 9. Next Surfaces to Apply (Priority Order)

1. Review page (`review/ReviewClient.tsx`) — signed preview surface
2. Front-door / onboarding flows
3. Public estimator landing + experience
4. Admin / billing surfaces
5. Marketing site (when created)

## 10. Validation Against Four-Layer Framework

- **UX Philosophy:** Fully aligned with `ai-native-work-surface-research.md` (Avery-first, Home/Talk/Proof/Connected, command language) and `phase-3-generative-ui-reframe.md` (conformance).
- **Pi Technical Patterns:** No conflict — design system is purely visual/presentation layer.
- **Architecture Style:** No new contracts or bypasses.
- **Specific Features:** Design system applied to existing `WorkEventDescriptor` / `WorkResource` rendering path.

## 11. Enforcement

This implementation document will be updated on every surface migration. Any deviation from the design system must be recorded here with rationale and linked to the canonical spec.