# Working Protocol For UI Contributors

Status: archived reference

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
6. Whichever phase doc matches the surface you're touching: `phase-02-owner-work-surface-redesign.md` (web desk), `phase-03-sms-ambient-inbox-and-link-previews.md` (Review/SMS), `phase-04-tool-agnostic-capability-and-renderer-layer.md` (materialization/capabilities), `phase-05-trial-operations-admin-billing.md` (Admin console).
7. `mvp-build/ui-handoff/product-grounding.md`.
8. `mvp-build/ui-handoff/data-catalog.md` — the data/surface/route inventory; read before assuming a field or surface doesn't exist.
9. This folder.

Before changing any backend-facing contract, also read:

- `packages/shared/src/resource-payload.ts`;
- `packages/shared/src/work-events.ts`;
- `packages/shared/src/preview-links.ts` (the `WorkResource`/`WorkAction` contract; Review/SMS-preview surfaces);
- `packages/shared/src/materialization.ts` (`SurfaceEnvelope`/`CapabilityGraphNode`; Phase 4 contract);
- `packages/shared/src/admin.ts` (Admin console contracts);
- `apps/manager/src/lib/employee-stream.ts`;
- `apps/manager/src/lib/preview-render.ts` (if touching Review/SMS preview data);
- `apps/manager/src/lib/admin.ts` (if touching the Admin console);
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

Current UI-related phase status (see `mvp-build/CODEGRAPH.md` §3 for the authoritative version):

- Phase 1: source/static gates complete; live gate blocked by model/provider availability.
- Phase 2: web Work Surface `source-wired`; browser/live acceptance pending.
- Phase 3: `source-wired`. SMS ambient inbox + signed mobile preview/action surface (`/agent/[employeeId]/review`) exist and render a real `WorkResource`; live SMS/tool-loop proof pending.
- Phase 4: `source-wired`. `SurfaceEnvelope`/`CapabilityGraphNode`/materialization/capability registry exist; the web Work Surface doesn't fully render from them yet; live provider/runtime proof pending.
- Phase 5: `source-wired`. An internal `/admin` console (dashboard/accounts/provisioning/repairs/providers/billing-scaffold/support actions/readiness) exists; live operator proof pending.
- Phase 6: planned free trial and paid pilot readiness gate.

UI work should explicitly say which phase it supports. A visual cleanup to `AgentClient.tsx` supports Phase 2. Polish on `ReviewClient.tsx`/the signed preview page supports Phase 3. Wiring more Work Surface views through `SurfaceEnvelope`/`CapabilityGraphNode` instead of the older derived `ResourcePayload` fields supports Phase 4. Polish or new views on the `/admin` console support Phase 5. None of these are "future" surfaces to design from a blank page — see `data-catalog.md` for what already exists in each.

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
- `packages/shared/src/preview-links.ts` / `packages/shared/src/materialization.ts` (`WorkResource`/`WorkAction`/`SurfaceEnvelope`/`CapabilityGraphNode`);
- `packages/shared/src/admin.ts` and Admin console platform-role/redaction behavior;
- Manager API route shapes;
- database migrations;
- approval resolution behavior;
- signed-link scope (both artifact links and preview/review links);
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
