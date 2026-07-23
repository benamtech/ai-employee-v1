# AGENTS.md — UI Lab contributor and coding-agent interface

Status: active for work under `mvp-build/ui-lab/`, `apps/web/app/ui-lab/`, employee presentation adapters, and UI preset promotion.

## Read order

1. `../../identity.md`
2. root `AGENTS.md`
3. `../AGENTS.md`
4. this file
5. `README.md`
6. `../docs/ux/09-ui-lab-live-workbench.md`
7. `../docs/adr/ADR-010-employee-ui-port-and-web-presentation-adapters.md`
8. `../decision/trace012/task_state.json`
9. `../decision/trace012/research-and-decision-record.md`
10. `../decision/trace012/validation-vectors.json`
11. `../decision/trace012/affected-files.json`
12. `../decision/trace012/script-inventory.json`

Then inspect only the source, fixtures, tests, scripts, presets, and docs required by the task.

## Mental model

```text
employee UI port
├─ owner_web adapter
├─ public_form adapter
└─ boundless_website adapter

adapter
└─ presentation strategy
   ├─ theme
   ├─ layout
   ├─ component set
   ├─ density
   └─ brand tokens

UI Lab
├─ production-faithful workbench
├─ isolated preview canvas
├─ deterministic fixture scenarios
├─ immutable preset versions
├─ human review and promotion
└─ approved selector assignments
```

A theme, color palette, density, or component style is not an adapter. A preset is not a component fork. UI Lab is not a production runtime.

## Start the real development loop

From `mvp-build/`:

```bash
npm run ui:lab:doctor
npm run ui:lab
```

Do not use a production build for ordinary visual iteration. Next development mode and Fast Refresh are the standard loop.

Do not start the workbench with `npm run web:dev`; it does not enable fixture and bounded draft-write settings.

## Source ownership

| Concern | Primary source |
|---|---|
| adapter and strategy schemas/resolution | `packages/shared/src/employee-ui-presentation.ts` |
| preset and assignment schemas | `packages/shared/src/ui-lab-preset.ts` |
| approved assignment resolution | `packages/shared/src/ui-lab-assignment-resolution.ts` |
| generated runtime assignments | `packages/shared/src/ui-lab-runtime-registry.generated.ts` |
| React presentation boundary | `apps/web/app/_components/employee-ui/EmployeeUiPort.tsx` |
| authenticated owner UI | `apps/web/app/agent/[employeeId]/**` |
| public-form UI | `apps/web/app/free-estimator/**` |
| workbench chrome | `apps/web/app/ui-lab/[scenario]/UiLabWorkbenchClient.tsx` and `ui-lab.css` |
| isolated preview | `apps/web/app/ui-lab/preview/[scenario]/page.tsx` and `ProductionFixtureLabClient.tsx` |
| draft read/write boundary | `apps/web/app/api/ui-lab/presets/route.ts` and `_lib/ui-lab-registry.server.ts` |
| canonical presets | `ui-lab/presets/**` |
| approved assignments | `ui-lab/assignments.json` |
| registry CLI | `scripts/ui-lab-registry.mjs` |
| development harness | `scripts/ui-lab-dev.mjs` |
| browser evidence | `infra/scripts/ui/fixture-browser-v2.mjs` |

## Required workflow for UI changes

1. Resolve the exact branch head and task scope.
2. Run `npm run ui:lab:doctor`.
3. Start `npm run ui:lab`.
4. Select a fixture scenario that exposes the intended behavior.
5. Edit normal React/CSS/shared source.
6. Check desktop, tablet, mobile, reduced-motion, empty, loading, active, blocked, reconnecting, and failure-relevant states where applicable.
7. Save a named draft preset when the version is worth comparing.
8. Record every decision, rejected alternative, and affected file in Trace012 or the next active UI trace.
9. Run focused contracts and architecture verification.
10. Run browser evidence before promotion.
11. Commit source before promotion.
12. Require a human reviewer for approval and assignment.

## Preset rules

- Versions are immutable and contiguous: `v0001.json`, `v0002.json`, and so on.
- Saving creates a new version; never overwrite an old version.
- Dirty-source drafts are allowed only as non-reproducible comparison checkpoints.
- Approved presets require clean exact Git source, passing evidence, and approving human review.
- Only approved reproducible presets may appear in `ui-lab/assignments.json`.
- Selector collisions must be resolved deterministically, not by array order accidents.
- Do not edit `ui-lab-runtime-registry.generated.ts` manually.
- Do not delete history to make the registry tidy; deprecate superseded presets.

## Repository-write boundary

The workbench POST route may create validated preset JSON only when all guards pass:

```text
fixture mode
AND development mode
AND AMTECH_UI_LAB_WRITE=1
AND loopback host
AND same-origin request
AND validated payload
AND path derived from validated preset id/version
AND exclusive create
```

Never broaden this route into arbitrary filesystem editing. Source changes belong to the coding agent/editor and Git workflow, not to the browser API.

Approval, assignment, generated registry updates, and deprecation remain CLI/review operations.

## Design implementation guidance

Prefer the smallest adequate layer:

1. brand/token change → scoped CSS custom properties;
2. spacing/density/order change → presentation strategy and scoped selectors;
3. reusable structural variant → statically registered React component set;
4. different purposeful Web experience → adapter;
5. one-off customer experiment → custom strategy or component registry entry, still behind the same port;
6. public employee-as-site → boundless adapter, not an unauthenticated owner route.

Avoid unrestricted schema-driven rendering, runtime import paths, global CSS leakage, route forks per employee, and new dependencies without evidence.

## Validation commands

Focused development:

```bash
npm run ui:lab:registry:validate
npm run test:ui:contracts
node scripts/verify-ui-architecture.mjs
npm run ui:validate
```

Browser review:

```bash
npm run ui:lab:test
npm run ui:lab:test:headed
```

Final repository gate:

```bash
npm run repo:merge:check
```

When a command fails, preserve the failing vector and repair the source or the stale verifier. Do not weaken a valid invariant merely to make the task green.

## Evidence language

Use these labels precisely:

- source-inferred;
- unit-contract verified;
- fixture-render verified;
- compiled-browser verified;
- human visually approved;
- live observed;
- production accepted.

A fixture screenshot is not live or production evidence. A green browser test is not aesthetic approval. A clean preset assignment is not proof that every employee type is visually correct.

## Finish checklist

- decisions and reasoning recorded;
- affected-file ledger updated;
- script inventory updated;
- new scripts exposed through `package.json` and verified by repository script checks;
- presets validate and generated registry is current;
- focused tests pass;
- architecture verifier passes;
- browser evidence retained with exact SHA, preset, scenario, viewport, adapter, and strategy metadata;
- human reviewer identified for promotion;
- canonical UI docs updated when topology or workflow changed;
- historical docs marked superseded rather than silently treated as current.
