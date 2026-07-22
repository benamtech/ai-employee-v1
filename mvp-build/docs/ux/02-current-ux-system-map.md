# Current UX System Map

Status: active  
Updated: 2026-07-22  
Purpose: map current UX surfaces, presentation adapters, UI Lab, contracts, evidence level, and release boundaries

## Employee UI presentation architecture

AMTECH now separates one employee UI port from high-level Web adapters and presentation strategies:

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
```

A theme, palette, card style, density, or region ordering is a strategy, not an adapter. Approved UI Lab presets can select those strategies for profile, business-kind, or employee-type selectors without changing the loaded employee payload.

Primary contracts:

- `packages/shared/src/employee-ui-presentation.ts`;
- `packages/shared/src/ui-lab-preset.ts`;
- `packages/shared/src/ui-lab-assignment-resolution.ts`;
- `apps/web/app/_components/employee-ui/EmployeeUiPort.tsx`.

## Authenticated owner Web adapter

The current owner route is `/agent/[employeeId]`. `LiveEmployeeOperatingShell` provides a Talk-first client and `AgentSurface` provides the richer Workspace. Both consume the existing production projection/controller path.

The operating experience may include:

- guidance;
- owner attention and decisions;
- persistent work loops;
- active saves with return conditions;
- meaningful system changes;
- bounded delegated work;
- evidence and outcomes;
- connected systems that materially affect work;
- inspectable owner-safe context and layout rationale;
- contextual command.

The browser consumes typed resource, operating-state, layout, work-resource, action, connection, capability, and resurface contracts. Presentation presets may change visual identity, density, layout, component variants, labels, and prioritization. They do not require a separate page fork per employee type.

## Public-form adapter

The existing `/free-estimator` route is wrapped by the `public_form` adapter as a non-canonical acquisition and regression surface. It demonstrates a bounded conversational employee workflow and may seed future multimodal estimator products.

It remains distinct from the authenticated owner client and does not define the canonical production employee experience.

## Boundless-website adapter

`boundless_website` is the high-level adapter for an employee-dominant public website. It is registered and exercisable in UI Lab. A production public employee homepage remains a separate product and deployment decision.

## UI Lab live workbench

`/ui-lab` is the standard development and review environment for employee Web presentation.

```text
/ui-lab/[scenario]
└─ workbench chrome
   ├─ scenario and fixture controls
   ├─ adapter and presentation controls
   ├─ viewport controls
   ├─ immutable preset/version browser
   ├─ local draft capture
   └─ same-origin iframe
      └─ /ui-lab/preview/[scenario]
         └─ production employee components + deterministic fixture data
```

The workbench runs under the real Next development application. `npm run ui:lab` starts shared/Web type watchers and Next Fast Refresh, so ordinary UI edits do not require a production rebuild.

UI Lab fixture scenarios currently include contractor operations, employee-as-website, multi-role office, personal operating brain, research, and clothing/e-commerce operations.

UI Lab can simulate deterministic work, decisions, saves, runtime projection changes, heartbeat gaps, stalled state, recovery without intent replay, and fixture commands. Evidence remains fixture-render or compiled-browser evidence, never live-provider or production acceptance.

Canonical UI Lab files:

- `ui-lab/README.md`;
- `ui-lab/AGENTS.md`;
- `docs/ux/10-ui-lab-live-workbench.md`;
- `decision/trace012/**`;
- `scripts/ui-lab-dev.mjs`;
- `scripts/ui-lab-registry.mjs`;
- `infra/scripts/ui/fixture-browser-v2.mjs`.

## UI preset and assignment lifecycle

Presets are immutable JSON versions under `ui-lab/presets/<id>/vNNNN.json`.

A draft may record dirty source for comparison. An approved preset requires clean exact Git provenance, passing evidence, and deliberate human review. Approved presets may be assigned through `ui-lab/assignments.json`; a generated TypeScript registry makes the selected presentation available to the production resolver without runtime filesystem reads.

## Signed mobile Review

`/agent/[employeeId]/review?t=...` is the scoped no-login review surface. It renders one exact work resource and remains separate from the owner client and UI Lab. Presentation alignment does not change its resource or action scope.

## Hermes stream boundary

The owner stream vocabulary remains snapshot, work event, work progress, approval update, and run completed. Heartbeat projections indicate liveness only and do not prove correctness, completion, external effect, or durable receipt.

Raw tool logs, private context, credentials, low-level runtime process data, and unrestricted recovery controls remain outside ordinary owner presentation.

## Admin/operator

`/admin` is operator-facing. It may expose readiness, repairs, proof, support actions, and diagnostics under separate authorization. It may be denser than owner UI and should not be treated as another theme of the owner adapter.

## Generated and embedded views

Manager can compile typed work views into sandboxed `ui://` resources. These are bounded embedded views, not arbitrary model-generated DOM. The host resolves current resource/actions and handles fallback.

## Evidence classes

Use these labels:

- source-inferred;
- unit-contract verified;
- fixture-render verified;
- compiled-browser verified;
- human visually approved;
- live observed;
- production accepted.

A screenshot proves only the rendered fixture/source combination named in its metadata. A green test does not constitute aesthetic approval.

## Surfaces still needing product or acceptance work

- public front door and real create/claim/login/account flows;
- customer estimate portal;
- billing and connected-account setup;
- admin visual language;
- artifact/output HTML;
- production public employee website deployment;
- provider-backed progress and recovery;
- fixture-free browser/channel journeys;
- complete accessibility and controlled visual-regression evidence for every approved commercial preset.

## Historical guidance

Older fixed-tab, single-theme, screenshot-only, or direct fixture-lab instructions are historical when they conflict with this map, `docs/ux/10-ui-lab-live-workbench.md`, executable source, or exact-head tests. Preserve historical files for audit, but do not use them as current implementation instructions.
