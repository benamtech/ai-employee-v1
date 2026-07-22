# AMTECH UI Lab

UI Lab is the standard live design workbench for AMTECH employee Web experiences.

It runs the actual Next.js Web application and production employee components with deterministic fixture data. It is not a screenshot mockup, a second frontend, or a production runtime. A collaborator can edit React, TypeScript, CSS, tokens, layouts, and component registries and see most changes immediately through Next Fast Refresh.

## Start

From `mvp-build/`:

```bash
npm install
npm run local:browser-install
npm run ui:lab:open
```

The normal command is:

```bash
npm run ui:lab
```

It performs the following work:

1. verifies Node, Git, dependencies, loopback host, port, and registry files;
2. builds the shared package once;
3. validates the UI preset registry;
4. starts shared TypeScript output in watch mode;
5. starts Web TypeScript diagnostics in watch mode;
6. starts the actual Next Web application with Turbopack and Fast Refresh;
7. enables fixture routes and tightly bounded local draft-preset writes.

Open `http://127.0.0.1:3000/ui-lab` unless a different port was selected.

## What the collaborator edits

The workbench does not generate arbitrary source code. A collaborator or coding agent edits normal repository files, primarily:

- `apps/web/app/_components/employee-ui/EmployeeUiPort.tsx` for adapter and presentation strategy behavior;
- `apps/web/app/agent/[employeeId]/**` for the authenticated owner client;
- `apps/web/app/free-estimator/**` for the public-form adapter;
- `apps/web/app/ui-lab/**` for workbench-only chrome and preview controls;
- `apps/web/app/globals.css` and scoped CSS modules/styles for shared design behavior;
- `packages/shared/src/employee-ui-presentation.ts` for validated strategy keys and resolver behavior;
- statically declared component registries when a design cannot be expressed with tokens or scoped CSS.

Do not edit generated runtime registry output by hand.

## Workbench model

```text
workbench route /ui-lab/[scenario]
  ├─ scenario and runtime fixture selection
  ├─ adapter, theme, layout, component-set, density and brand controls
  ├─ viewport selection
  ├─ named preset/version browser
  ├─ draft checkpoint form
  ├─ fixture interaction controls
  └─ same-origin iframe
       └─ preview route /ui-lab/preview/[scenario]
            └─ production employee components + deterministic fixture data
```

The iframe isolates preview viewport and styling from workbench chrome while preserving the actual Next route/component environment.

## Presets

A preset is a named, immutable configuration of:

- high-level adapter;
- theme strategy;
- layout strategy;
- component-set strategy;
- density;
- brand tokens;
- intended employee/profile selectors;
- fixture scenario and review viewports;
- Git source provenance.

Canonical files live at:

```text
ui-lab/presets/<preset-id>/vNNNN.json
```

Saving from the workbench always creates a new version. Existing versions are never overwritten.

A dirty-worktree draft is allowed for comparison, but it is marked non-reproducible and cannot be assigned to employees.

## Review and promotion

The safe lifecycle is:

```text
edit source
→ Fast Refresh preview
→ save draft checkpoint
→ compare named versions and viewports
→ commit source
→ run focused validation and browser evidence
→ human review
→ promote a new approved preset version
→ assign approved preset to profile/business/employee selectors
→ regenerate and commit runtime registry
```

List and validate presets:

```bash
npm run ui:lab:presets
npm run ui:lab:registry:validate
```

Run browser evidence:

```bash
npm run ui:lab:test
```

Promotion requires a clean worktree and exact-head PASS evidence:

```bash
npm run ui:lab:promote -- \
  marketing-agency@v0001 \
  --reviewer "Benjamin" \
  --evidence infra/.local/ui-fixtures/<evidence-file>.json \
  --profile marketing_agency \
  --employee-type marketing_operator
```

Assign an already approved preset:

```bash
npm run ui:lab:assign -- \
  marketing-agency@v0002 \
  --reviewer "Benjamin" \
  --profile marketing_agency \
  --business-kind "marketing agency"
```

Use the exact CLI help emitted by `scripts/ui-lab-registry.mjs` when option syntax changes.

## Validation

During development:

```bash
npm run ui:lab:doctor
npm run ui:lab:registry:validate
npm run test:ui:contracts
node scripts/verify-ui-architecture.mjs
```

Before promotion or merge:

```bash
npm run ui:lab:test
npm run ui:validate
npm run repo:merge:check
```

Automated validation proves source contracts, routing, deterministic behavior, responsive mechanics, accessibility structure, and repeatable screenshots. It does not prove that a design is aesthetically good. Promotion therefore requires deliberate human review.

## Safety boundaries

UI Lab is available only when fixture mode is explicitly enabled. Repository writes additionally require development mode, `AMTECH_UI_LAB_WRITE=1`, a loopback host, and a same-origin request.

The browser may create only validated preset versions under `ui-lab/presets/`. It cannot approve, assign, overwrite existing versions, choose arbitrary paths, edit source files, or write to a database.

UI Lab fixtures are production-component demonstrations. They are not provider, authorization, managed database, deployment, pilot, or production evidence.

## Troubleshooting

Run:

```bash
npm run ui:lab:doctor
```

Common causes:

- dependencies were not installed from `mvp-build/`;
- Chromium was not installed for Playwright;
- port 3000 is occupied;
- the workbench was started with ordinary `web:dev` instead of `ui:lab`;
- the host is not loopback, so repository writes are deliberately disabled;
- shared generated registry output is stale after changing assignments;
- a preset was saved from a dirty worktree and is therefore not promotable.

## Deeper authority

Read:

1. `AGENTS.md` in this directory;
2. `../docs/ux/09-ui-lab-live-workbench.md`;
3. `../docs/adr/ADR-010-employee-ui-port-and-web-presentation-adapters.md`;
4. `../decision/trace012/research-and-decision-record.md`;
5. `../decision/trace012/validation-vectors.json`;
6. `../decision/trace012/affected-files.json`;
7. `../decision/trace012/script-inventory.json`.
