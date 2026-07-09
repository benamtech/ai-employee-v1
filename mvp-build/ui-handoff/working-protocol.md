# Working Protocol For UI Contributors

Status: active

This protocol is for a UI-focused contributor working in parallel with ongoing MVP functionality work.

## Collaboration Goal

The UI contributor should be able to improve the product surface without blocking the founder's work on runtime/provider/MVP functionality.

Default split:

- UI contributor owns browser-facing layout, component structure, responsive behavior, owner copy, visual hierarchy, empty states, and UI tests.
- Founder/functionality work owns Manager runtime, provider integrations, Hermes/tool behavior, database migrations, acceptance proof, and production gates.

When in doubt, preserve contracts and make the UI layer better around them.

## Read And Write Discipline

Before changing UI, read:

1. `../identity.md`.
2. `../CODEGRAPH.md`.
3. `mvp-build/CODEGRAPH.md`.
4. `mvp-build/memory/MEMORY.md` and newest relevant handoff.
5. `mvp-build/second-half-plan/README.md`.
6. `mvp-build/second-half-plan/phase-02-owner-work-surface-redesign.md`.
7. `mvp-build/ui-handoff/product-grounding.md`.
8. This folder.

Before changing any backend-facing contract, also read:

- `packages/shared/src/resource-payload.ts`;
- `packages/shared/src/work-events.ts`;
- `apps/manager/src/lib/employee-stream.ts`;
- `apps/manager/src/server.ts`;
- relevant unit tests.

## Memory And Handoff Rules

Follow `mvp-build/memory/MEMORY.md`.

Write/update a dated memory handoff:

- after substantial multi-file UI work;
- after changing a major UI architecture or component boundary;
- after implementing a phase or meaningful slice of a phase;
- after making a design/product decision that future agents must inherit;
- whenever a live/browser gate is attempted, passes, or is blocked.

File format:

- name: `YYYY-MM-DD-HHMM-<kebab-slug>.md`;
- include Date, Status, Scope;
- sections: What changed, Why, Current status, Files/seams touched, Carry-forward/next, Verification.

Always update `mvp-build/memory/MEMORY.md` newest-first index when adding a memory file.

Use the acceptance vocabulary:

- `source-wired`;
- `provider-accepted`;
- `runtime-accepted`;
- `planned`;
- `pending`;
- `blocked`.

Never claim browser/live/provider/runtime proof unless it actually ran and produced proof. Mock data, screenshots against static fixtures, or local component tests are useful, but they are not provider/runtime acceptance.

## Status In The Overall Plan

Current forward plan:

- `mvp-build/second-half-plan/`.

Current UI-related phase status:

- Phase 1: source/static gates complete; live gate blocked by model/provider availability.
- Phase 2: web Work Surface source-wired; browser/live acceptance pending.
- Phase 3: planned SMS ambient inbox and signed previews.
- Phase 4: planned generic materialization/capability/renderer contracts.
- Phase 5: planned trial ops/admin/billing surfaces.
- Phase 6: planned free trial and paid pilot readiness gate.

UI work should explicitly say which phase it supports. A visual cleanup to `AgentClient.tsx` likely supports Phase 2. A signed mobile approval preview likely supports Phase 3. Generic schema/table/action components likely support Phase 4.

## Safe Development Workflow

From `mvp-build/`:

```bash
npm run ui:dev
npm run ui:browser
npm run ui:test
npm run ui:test:headed
npm run web:dev
npm run typecheck
npm run test:unit
npm run lint
npm run build
```

Use `ui:*` for UI-only work:

- `npm run ui:dev` starts the web app with fixture data on port 3000.
- `npm run ui:browser` starts a fixture server on port 3200 and opens a headed browser.
- `npm run ui:test` runs a headless Playwright smoke with representative fixture data.
- `npm run ui:test:headed` runs the same smoke visibly.

The fixture browser runner binds to loopback, warms the Work Surface route, and writes desktop/mobile screenshots under `infra/.local/ui-fixtures/`. A cold Next dev server may take a minute or more before the first assertions run.

These commands intentionally avoid Manager, Supabase, Docker, Hermes containers, provider credentials, and model calls. They are for UI development and screenshots, not live acceptance.

Use targeted tests during iteration:

```bash
npm run test:unit -- tests/unit/work-surface-model.test.ts
npm run test:unit -- tests/unit/group-by-job.test.ts
npm run test:unit -- tests/unit/work-events.test.ts
```

Run full gates before handoff or commit:

```bash
npm run typecheck
npm run test:unit
npm run lint
npm run build
```

If a dev server is started, record the URL and whether it is still running. If screenshots or browser checks were not possible, say why.

## Contract Boundaries

UI can usually change:

- component layout;
- CSS/styling;
- local view state;
- responsive behavior;
- copy;
- empty/loading/error/degraded states;
- client-side grouping and preview selection helpers;
- UI-only tests and fixtures.

Coordinate before changing:

- `packages/shared/src/resource-payload.ts`;
- `packages/shared/src/work-events.ts`;
- Manager API route shapes;
- database migrations;
- approval resolution behavior;
- signed-link scope;
- artifact security;
- employee runtime/message delivery;
- provider webhook semantics.

If a UI improvement needs new data, prefer:

1. document the needed field and why;
2. add a backward-compatible optional field to the shared contract;
3. derive it in `buildEmployeeSnapshot`;
4. add focused unit tests;
5. avoid migrations unless the data must be durable.

## UI Copy And Vocabulary

Owner-facing copy should generally use:

- employee;
- work;
- task;
- output;
- draft;
- proof;
- connected account;
- ability;
- waiting for you;
- needs connection;
- recurring work;
- sent/delivered/paid/synced.

Avoid in normal owner UI:

- MCP;
- API;
- bearer/token;
- runtime;
- config;
- stack trace;
- JSON;
- schema;
- toolset;
- raw provider payload;
- service role.

Admin/operator UI may expose technical terms when needed, but it should still separate raw provenance from owner-facing views.

## Current Non-Goals For A UI Contributor

Do not spend UI cycles trying to make the temporary model bridge production-grade. The bridge is a local stand-in that routes to the founder's Claude account and will be replaced by real provider credits/accounting.

Do not rebuild Hermes. AMTECH packages and materializes Hermes.

Do not create one-off connector dashboards if the same state can be expressed as a connected account, ability, task, output, action, or proof.

Do not turn this folder into strict visual rules. The app still needs purposeful design exploration.

## Handoff Template

Use this for UI handoffs in `mvp-build/memory/`:

```md
# <Title>

Date: YYYY-MM-DD HH:MM

Status: source-wired | planned | pending | blocked

Scope: <one-line summary>

## What changed

- <files and behavior>

## Why

- <product/design reason>

## Current status

- <what is done>
- <what is not proven>

## Files / seams touched

- <paths>

## Carry-forward / next

- <specific next UI/backend asks>

## Verification

- `npm run typecheck` — pass/fail/not run, why.
- `npm run test:unit` — pass/fail/not run, why.
- `npm run lint` — pass/fail/not run, why.
- `npm run build` — pass/fail/not run, why.
- Browser/dev-server checks — pass/fail/not run, why.
```
