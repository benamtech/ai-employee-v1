# AMTECH UI Documentation Index

Status: active router  
Updated: 2026-07-22

This file routes contributors to current UI doctrine, architecture, UI Lab workflow, source, tests, and evidence. Older screenshots, handoffs, fixed-tab plans, single-theme assumptions, and speculative research remain historical unless promoted into the current files below.

## Read first

1. [`../AMTECH_WEB_DESIGN_SYSTEM.md`](../AMTECH_WEB_DESIGN_SYSTEM.md) — shared visual foundations and tokens.
2. [`../AMTECH_AGENT_INTERFACE_STANDARD.md`](../AMTECH_AGENT_INTERFACE_STANDARD.md) — employee operating-interface primitives and behavior.
3. [`../AMTECH_UI_VALIDATION_STANDARD.md`](../AMTECH_UI_VALIDATION_STANDARD.md) — release, browser, accessibility, and evidence requirements.
4. [`../../mvp-build/docs/ux/02-current-ux-system-map.md`](../../mvp-build/docs/ux/02-current-ux-system-map.md) — current surface and adapter topology.
5. [`../../mvp-build/docs/ux/10-ui-lab-live-workbench.md`](../../mvp-build/docs/ux/10-ui-lab-live-workbench.md) — live design workbench, preset lifecycle, promotion, and second/third-order effects.
6. [`../../mvp-build/ui-lab/README.md`](../../mvp-build/ui-lab/README.md) — collaborator operating manual.
7. [`../../mvp-build/ui-lab/AGENTS.md`](../../mvp-build/ui-lab/AGENTS.md) — dedicated coding-agent onboarding.
8. [`../../mvp-build/docs/adr/ADR-010-employee-ui-port-and-web-presentation-adapters.md`](../../mvp-build/docs/adr/ADR-010-employee-ui-port-and-web-presentation-adapters.md) — port, adapter, strategy, preset, and assignment boundary.
9. [`../../mvp-build/decision/trace012/research-and-decision-record.md`](../../mvp-build/decision/trace012/research-and-decision-record.md) — research, rejected alternatives, decisions, validation space, and effects.
10. [`AMTECH_AI_EMPLOYEE_UI_RUNTIME_DEEP_DIVE_2026-07-19.md`](AMTECH_AI_EMPLOYEE_UI_RUNTIME_DEEP_DIVE_2026-07-19.md) — dated runtime review; informative where not superseded by current source and maps.

## Current architecture in one view

```text
employee UI port
├─ owner_web adapter
├─ public_form adapter
└─ boundless_website adapter

adapter presentation
├─ theme
├─ layout
├─ component set
├─ density
└─ brand tokens

UI Lab
├─ production-faithful Next workbench
├─ isolated same-origin preview canvas
├─ deterministic fixture scenarios
├─ immutable Git-backed presets
├─ exact-source browser evidence
├─ human review
└─ approved profile/business/employee assignments
```

A palette or layout is not an adapter. A preset is not a React page fork. UI Lab is not a production runtime.

## Authority rules

- Current executable source and exact-head tests outrank prose about what the UI supposedly does.
- The first three documents above remain UI doctrine and validation authority.
- `mvp-build/docs/ux/02-current-ux-system-map.md` is the active topology map.
- `mvp-build/docs/ux/10-ui-lab-live-workbench.md` is the active UI Lab architecture and lifecycle guide.
- `mvp-build/ui-lab/AGENTS.md` governs contributor and coding-agent workflow in the UI Lab scope.
- `mvp-build/decision/trace012/**` records the current UI Lab decision, vectors, affected files, and scripts; it does not replace executable proof.
- Hermes-derived documents constrain runtime presentation but do not override AMTECH Web architecture.
- Historical fixed-tab, Home/Talk/Proof/Connected, black-shell, square-corner, single-palette, screenshot-only, or production-rebuild-per-edit guidance is superseded.
- Fixture rendering, compiled-browser evidence, human visual approval, live observation, and production acceptance remain separate evidence classes.

## Active source map

| Concern | Source |
|---|---|
| employee presentation contracts and resolver | `mvp-build/packages/shared/src/employee-ui-presentation.ts` |
| preset and assignment schemas | `mvp-build/packages/shared/src/ui-lab-preset.ts` |
| approved assignment resolution | `mvp-build/packages/shared/src/ui-lab-assignment-resolution.ts` |
| generated runtime assignments | `mvp-build/packages/shared/src/ui-lab-runtime-registry.generated.ts` |
| React port host | `mvp-build/apps/web/app/_components/employee-ui/EmployeeUiPort.tsx` |
| owner client | `mvp-build/apps/web/app/agent/[employeeId]/**` |
| public-form adapter | `mvp-build/apps/web/app/free-estimator/**` |
| UI Lab workbench | `mvp-build/apps/web/app/ui-lab/[scenario]/UiLabWorkbenchClient.tsx` |
| isolated preview route | `mvp-build/apps/web/app/ui-lab/preview/[scenario]/page.tsx` |
| production fixture preview | `mvp-build/apps/web/app/ui-lab/[scenario]/ProductionFixtureLabClient.tsx` |
| bounded draft API | `mvp-build/apps/web/app/api/ui-lab/presets/route.ts` |
| preset filesystem registry | `mvp-build/apps/web/app/_lib/ui-lab-registry.server.ts` |
| canonical preset versions | `mvp-build/ui-lab/presets/**` |
| approved assignments | `mvp-build/ui-lab/assignments.json` |

## Standard scripts

| Command | Purpose |
|---|---|
| `npm run ui:lab:doctor` | verify collaborator environment |
| `npm run ui:lab` | start Fast Refresh workbench, shared watch, and Web type watch |
| `npm run ui:lab:presets` | list immutable versions |
| `npm run ui:lab:registry:validate` | validate versions, provenance, assignments, and generated parity |
| `npm run ui:lab:registry:generate` | regenerate runtime assignment registry |
| `npm run ui:lab:promote -- ...` | create a human-approved reproducible version and assignment |
| `npm run ui:lab:assign -- ...` | assign an approved version to additional selectors |
| `npm run ui:lab:test` | run preset-aware browser evidence |
| `npm run test:ui:contracts` | run focused UI source/unit contracts |
| `node scripts/verify-ui-architecture.mjs` | verify workbench, canvas, renderer reuse, and promotion boundaries |
| `npm run ui:validate` | validate UI source and preset registry |

The machine-readable script inventory is `mvp-build/decision/trace012/script-inventory.json`.

## Active validation and evidence

- `mvp-build/decision/trace012/validation-vectors.json` — UI Lab pass/fail matrix.
- `mvp-build/decision/trace012/affected-files.json` — complete impact ledger.
- `mvp-build/tests/unit/ui-lab-registry.test.ts` — immutable version and assignment contracts.
- `mvp-build/tests/unit/ui-lab-workbench-contract.test.ts` — workbench, preview, and write-guard contracts.
- `mvp-build/tests/unit/ui-architecture-fitness.test.ts` — executable topology verifier.
- `mvp-build/infra/scripts/ui/fixture-browser-v2.mjs` — screenshots, interactions, viewport and provenance evidence.
- `mvp-build/scripts/generate-ui-coverage.mjs` — constrained presentation coverage generation.

## Current evidence boundary

Source, unit, fixture-render, compiled-browser, and human-review evidence can be established in this program. Managed database, live provider, target host, production performance, deployment, pilot, and production acceptance remain distinct.

A dirty draft is useful for comparison but is not assignable. An approved preset must identify clean exact source, a passing validation run, and a human reviewer.

## Historical material

Dated handoffs and archived design packets remain useful for archaeology. When they conflict with current source or the active documents above, treat them as superseded history. Do not rewrite historical evidence to look current; update the active router and add explicit supersession notes where confusion is likely.
