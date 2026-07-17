# AMTECH Web Design System — Implementation Status

**Branch:** `research`  
**Updated:** 2026-07-17  
**Status:** canonical design system established; owner surface implemented; public website and remaining surfaces pending

This document tracks implementation of `AMTECH_WEB_DESIGN_SYSTEM.md` across public AMTECH surfaces. The canonical visual system is already established. Individual surfaces remain at different implementation and proof levels.

## Canonical rules

- Light surfaces only: white and `canvas` backgrounds with restrained cool gradients.
- `ink` for primary text and high contrast.
- AMTECH red for brand and primary action.
- Blue for systems/information.
- Green for verified/success states.
- No orange, gold, beige, rainbow palette, generic purple-AI treatment, or dark mode.
- Inter/system sans typography.
- One eyebrow maximum per section.
- Strong hierarchy, wide alignment, generous space, and an 8px rhythm.
- Glass, borders, radii, shadows, and motion remain restrained and operational.
- Every element must improve hierarchy, comprehension, trust, or action.

## Implemented owner-product direction

The owner web client established the current product grammar:

- Home / Talk / Proof / Connected;
- “Tell Avery” command language;
- “Needs your say” approval language;
- calm Working/Watching states;
- proof and work resources rather than dashboard metrics;
- light operational surfaces with red action, blue system, and green success states;
- mobile-first review and approval behavior.

Primary implementation reference:

- `mvp-build/apps/web/app/agent/[employeeId]/AgentSurface.tsx`

This source direction is current, but screenshots or local fixture output do not by themselves establish provider/runtime acceptance.

## Public website direction

The public AMTECH website should use the same visual grammar while teaching the category through concrete work rather than reproducing the internal owner application.

Product/copy brief:

- `docs/amtech-website-rewrite-brief.md`

Experimental website framework and v0.1 lab:

- `GTM-RESEARCH/website-framework/README.md`
- `GTM-RESEARCH/website-framework/07-v0.1-request-mirror-lab.md`

The first framework implementation is intentionally a plain, noindex Request Mirror Lab. Its Web-1 diagnostic appearance is an explicit research exception and must not be mistaken for the final AMTECH marketing design.

## Surface status

| Surface | Current status | Next design work |
|---|---|---|
| Owner web client | implemented direction; current acceptance depends on live product proof | Continue consistency/accessibility/performance audit as product changes. |
| Signed Review surface | source exists; current design/proof state requires direct inspection | Align with current approval/proof grammar and mobile behavior. |
| Front-door onboarding | canonical product path; design state requires direct inspection | Apply the design system without weakening the real onboarding flow. |
| Public estimator | outdated and non-canonical | Preserve only as a clearly separated regression/acquisition harness where still useful; do not redesign it as the flagship. |
| Public marketing site | implementation pending | Build from `docs/amtech-website-rewrite-brief.md` after the v0.1 framework lab proves the resolver assumptions. |
| Request Mirror Lab | specification only | Implement as an intentionally plain diagnostic surface under `GTM-RESEARCH/website-framework/`. |
| Admin/billing | internal/operator surface; not the public-site priority | Apply tokens and hierarchy where useful without confusing operator and owner audiences. |

## Component guidance

### Navigation

- White/glass shell.
- AMTECH red for the primary action or active state.
- No dark navigation treatment.

### Buttons

- Primary: red fill, white text, clear label, appropriate radius.
- Secondary: neutral/glass surface with dark text.
- Status actions use semantic green, blue, or red only when their meaning warrants it.

### Forms

- Large fields and tap targets.
- Explicit labels.
- Visible validation.
- Minimal steps.
- No ornamental form chrome.

### Work and proof surfaces

Prioritize:

1. what happened or was requested;
2. what the employee prepared;
3. what needs the owner's decision;
4. what action occurred;
5. the resulting proof.

Avoid generic KPI tiles when a concrete work object communicates more.

## Copy implementation

Required tone:

- direct;
- specific;
- calm;
- human;
- operational;
- evidence-aware.

Preferred structure:

```text
owner situation
-> work performed
-> concrete result
-> approval/control
-> proof or next action
```

Avoid “unlock,” “empower,” “revolutionize,” “AI-powered solutions,” unsupported superlatives, fake metrics, and repeated explanations of the same benefit.

## Evidence and claim rule

Visual polish must not inflate acceptance.

Every public proof object should carry one of:

- `live_production_proof`;
- `product_demonstration`;
- `source_wired_preview`;
- `concept`.

The interface must never imply that a source-wired preview or controlled demonstration is current live provider/customer proof.

## Validation expectations

For each migrated surface, record:

- exact source files;
- route and audience;
- desktop/mobile screenshots;
- keyboard and reduced-motion behavior;
- contrast/accessibility results;
- performance impact;
- copy/claim review;
- provider/runtime evidence where relevant;
- anything not run.

## Enforcement

`AMTECH_WEB_DESIGN_SYSTEM.md` remains the visual authority. This implementation-status document must be updated when a surface materially changes. Deviations require an explicit rationale, scope, and review record.