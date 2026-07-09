# Next Session: Phase 1/2 State And Functional MVP Roadmap

Date: 2026-07-09 11:45

Status: handoff; Phase 1/2 source-wired, UI fixture browser smoke passing, live/runtime/provider acceptance still pending

Scope: Summarize the Phase 1 and Phase 2 work completed on branch `worktree-mcp-server-toolsets-descriptor`, where the MVP functionally stands, and the best next steps.

## What changed

Recent commits now pushed to `origin/worktree-mcp-server-toolsets-descriptor`:

- `4d5649b phase 1 artifact fallback`
- `bc6edd2 phase 2 owner work surface`
- `d0d2fbe add ui handoff packet`

Phase 1 preservation and cleanup:

- Preserved Manager MCP identity injection:
  - `account_id` / `employee_id` are bound by Manager/MCP server-side identity, not model-fillable tool inputs.
  - MCP `tools/list` hides internal identity fields from model schemas.
  - MCP `tools/call` injects bound identity before validation/dispatch.
- Preserved Docker/local profile-rendering fixes:
  - Docker employees reach Manager through a container-reachable origin such as `host.docker.internal` or explicit override.
  - Local loopback behavior remains normal for local/non-container paths.
  - Hermes `terminal.backend` defaults to in-container `local` even when Manager runtime isolation is Docker.
- Preserved broad employee persona:
  - employee is a helpful small-business employee, not estimate-only;
  - approval gates remain for money, customer-facing sends, dangerous/external changes, credentials, and destructive classes.
- Preserved the temporary local model bridge behavior, but did not spend product effort on it:
  - it is only a stand-in for a real model subscription/provider;
  - current live path is blocked because the founder's Claude subscription/bridge route is at its limit.
- Wired `apps/manager/src/lib/artifact-view.ts` as a generic structured artifact fallback:
  - payload-only artifacts can render escaped safe HTML;
  - web artifact route can render Manager-provided fallback HTML;
  - access count for signed artifact links increments only after successful resolve/render;
  - fallback HTML route now sends restrictive browser headers.
- Fixed an SSE delta bug:
  - `fetchWorkEventsSince` now advances the stream cursor when only approvals are new, avoiding repeated approval deltas.

Phase 2 web Work Surface:

- Expanded `packages/shared/src/resource-payload.ts` with owner-safe employee/runtime/abilities/outputs/tasks fields.
- Rebuilt `apps/manager/src/lib/employee-stream.ts` into a stronger Manager read model:
  - employee summary;
  - latest runtime health summary;
  - derived outputs from artifacts/invoices/message receipts;
  - derived tasks from approvals/work events/runtime/connector/reminder/job state;
  - temporary abilities summary from Manager policy, runtime, connectors, and payment/email state.
- Rebuilt `apps/web/app/agent/[employeeId]/AgentClient.tsx`:
  - left nav + center views + right preview pane;
  - Today, Chat, Jobs, Tasks, Outputs, Connected, Abilities, Activity, Settings-lite;
  - persisted `employee_messages` as chat source of truth with short-lived optimistic pending state;
  - selected-preview model for approvals, work events, jobs, outputs, tasks, connectors, abilities, and messages;
  - SSE/poll fallback retained;
  - existing approval cards, work cards, daily brief, job folder, output route, and approval route reused.
- Added `apps/web/app/agent/[employeeId]/lib/surface-model.ts`:
  - nav counts;
  - default preview selection;
  - preview routing;
  - owner-facing connector labels;
  - status tone mapping.
- Added/expanded tests:
  - `tests/unit/employee-stream.test.ts`
  - `tests/unit/artifact-resolve.test.ts`
  - `tests/unit/work-surface-model.test.ts`

UI handoff packet:

- Added `mvp-build/ui-handoff/` so a business partner/UI agent can work on owner-facing UI while functionality work continues.
- Packet includes:
  - product grounding and the true power of the product;
  - wiki-vs-`mvp-build` distinction;
  - current UI source map;
  - Hermes GUI and generative UI research index;
  - experimental future surfaces backlog for SMS signed previews, preview thumbnails, image/video/media artifacts, task progress, reports, and cross-surface representations;
  - working protocol and durable memory rules.
- Root `README.md`, `mvp-build/README.md`, and `mvp-build/CODEGRAPH.md` now point to the UI handoff packet.

UI-only fixture workflow added after the initial handoff:

- `apps/web/app/agent/[employeeId]/fixtures.ts` provides representative local Work Surface data.
- `AgentClient.tsx` can run in fixture mode with `NEXT_PUBLIC_AMTECH_UI_FIXTURES=1`, skipping API calls, heartbeat, and EventSource while preserving the real component tree.
- The output route returns local fixture artifact previews in fixture mode.
- `infra/scripts/ui/fixture-browser.mjs` starts a fixture-backed Next dev server on loopback, warms `/agent/emp_ui_fixture`, runs headed/headless Playwright checks, and writes desktop/mobile screenshots under `infra/.local/ui-fixtures/`.
- New scripts in `package.json`:
  - `npm run ui:dev`
  - `npm run ui:browser`
  - `npm run ui:test`
  - `npm run ui:test:headed`
- Root README, MVP README, root `CODEGRAPH.md`, MVP `CODEGRAPH.md`, and `ui-handoff/` docs explain that this is for UI work only, not runtime/provider acceptance.

## Why

The second-half plan is no longer "finish an estimate app." The backend is ahead of the owner product. AMTECH needs to become the small-business materialization layer over Hermes: one employee, many surfaces, same underlying work state.

Phase 1 had to protect the live tool-enabled employee path before UI refactors. Phase 2 had to turn the sparse web page into the first credible employee desk. The UI handoff packet lets a partner push interface quality while the founder/implementation agents keep closing MVP functionality.

## Current functional MVP state

What is meaningfully source-wired:

- Manager backend control plane.
- Hermes profile rendering and runtime endpoint model.
- Manager-as-MCP server.
- Schema-first Manager tools.
- Artifact storage/links/fallback rendering.
- Approval records and approval resolution route.
- Owner web session/resource/message routes.
- Work Surface snapshot and SSE-shaped stream.
- Gmail/Stripe/Twilio/Supabase/scheduler/event/metering seams in source.
- Turn queue, channel router, runtime health, scheduler lanes, repair/metering groundwork.
- Local live-test tooling.
- Phase 2 web Work Surface read model and UI shell.
- UI-only fixture mode for headed/headless browser work without Manager/Supabase/Docker/Hermes/provider/model infrastructure.

What is not trial-ready:

- Live browser/runtime acceptance is not currently proven for this latest Phase 1/2 tree.
- Temporary Claude-account model bridge is blocked by subscription limit; a real provider route or funded account is needed.
- Web Work Surface is source-wired and has a UI-only fixture smoke/screenshot path, but still needs serious real-data browser QA, visual refinement, mobile proof, and owner-language polish.
- SMS is not yet a complete owner surface with signed previews/actions.
- Generic `SurfaceEnvelope` / `WorkResource` / `WorkAction` / `EmployeeEventStream` contracts are not implemented yet; current Phase 2 fields are groundwork, not the final materialization layer.
- Capabilities/abilities are temporary derived summaries, not a true capability graph from Hermes + Manager MCP + connectors + entitlements + policy.
- Admin/operator surfaces, billing, trial policy, support repair UI, cost visibility, and launch readiness gates remain planned.
- Onboarding/login/front door still need trial-grade UX and proof.

Bottom line: the MVP is much more than scaffolding now. The backend has real seams and the web desk has a credible source-wired shape. But there is still a good amount of work before free trials or paid pilots: live proof, SMS/previews, generic materialization, admin/ops/billing, browser QA, and UI polish.

## Files / seams touched

Representative source/docs from this work:

- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/mcp-server.ts`
- `apps/manager/src/lib/employee-stream.ts`
- `apps/manager/src/lib/artifact-view.ts`
- `apps/manager/src/server.ts`
- `apps/web/app/agent/[employeeId]/AgentClient.tsx`
- `apps/web/app/agent/[employeeId]/fixtures.ts`
- `apps/web/app/agent/[employeeId]/lib/surface-model.ts`
- `apps/web/app/agent/[employeeId]/output/[artifactId]/route.ts`
- `apps/web/app/agent/[employeeId]/surface-types.ts`
- `packages/shared/src/resource-payload.ts`
- `packages/agent-template/config.yaml`
- `packages/agent-template/SOUL.md`
- `packages/agent-template/workspace/AGENTS.md`
- `packages/agent-template/workspace/manager-tools.md`
- `tests/unit/employee-stream.test.ts`
- `tests/unit/artifact-resolve.test.ts`
- `tests/unit/work-surface-model.test.ts`
- `second-half-plan/phase-02-owner-work-surface-redesign.md`
- `ui-handoff/`
- `infra/scripts/ui/fixture-browser.mjs`
- `package.json`
- `README.md`
- `mvp-build/README.md`
- `mvp-build/CODEGRAPH.md`

## Best next steps

1. Close the live/browser/runtime gate when model/provider capacity is available.
   - Use the local live-test toolkit.
   - Reprovision an employee.
   - Verify runtime `/health`, `/v1/capabilities`, `/v1/toolsets`.
   - Verify Manager MCP tool registration.
   - Drive an owner request requiring a Manager tool.
   - Verify `audit_log` row with `actor=employee`.
   - Verify one created artifact id.
   - Verify Work Surface resource snapshot loads and renders the created work.
   - Record account id, employee id, runtime id/port, Hermes session/run/message ids if available, audit ids, artifact ids, and blockers.

2. Browser QA the Phase 2 Work Surface.
   - Start local Manager/web when env allows.
   - Capture desktop and mobile screenshots.
   - Verify persisted chat after refresh.
   - Verify approval preview/resolve.
   - Verify output library and payload-only artifact fallback.
   - Verify empty/loading/degraded states.
   - Use `ui-handoff/` for partner/UI-agent orientation.

3. Start Phase 3: SMS ambient inbox and signed mobile previews.
   - Do not build an estimate-only signed page.
   - Create signed, scoped, expiring preview/action links for approval, artifact/output, work event, task, connector, and job preview.
   - Render previews from the same state the web desk uses.
   - Add SMS copy/action tests for notify/question/review/failure/receipt and deliverable/resource types.

4. Start Phase 4 groundwork after or alongside Phase 3.
   - Promote temporary Phase 2 derived fields toward `SurfaceEnvelope`, `WorkResource`, `WorkAction`, and `EmployeeEventStream`.
   - Build the capability registry/cache from Hermes `/v1/capabilities`, `/v1/skills`, `/v1/toolsets`, Manager MCP tools/resources, connector state, runtime health, entitlements, and policy.
   - Keep owner renderers generic: schema/table/list/form/diff/schedule/artifact fallback before bespoke connector pages.

5. Continue UI polish in parallel.
   - Web desk is first priority.
   - Preview pane/output library/task progress should be designed so they can later become SMS signed previews, media previews, admin inspection, and optional desktop right rails.
   - Current styles are scaffolding, not brand law.

6. Plan Phase 5/6 operational work.
   - Trial policy.
   - Admin/fleet health.
   - Support repair actions.
   - Billing/payment status.
   - Metering/cost visibility.
   - Launch checklist and explicit waiver process for anything not proven before trials.

## Verification

Phase 1/2 source verification already run before commits:

- `npm run typecheck` — pass.
- `npm run test:unit` — pass, 53 files / 315 tests.
- `npm run lint` — pass.
- `npm run build` — pass.
- `git diff --check` for UI handoff docs — pass.

UI-only fixture verification added after the initial handoff:

- `npm run ui:test` — pass on 2026-07-09 after route warmup/readiness fixes.
- Screenshots written:
  - `infra/.local/ui-fixtures/work-surface-desktop.png`
  - `infra/.local/ui-fixtures/work-surface-mobile.png`
- This proof only covers the representative local web UI fixture path. It does not prove Manager, Supabase, Docker, Hermes, Gmail, Stripe, Twilio, provider credentials, or real model calls.

Live/runtime/provider proof:

- Not run after Phase 2 because the temporary local model bridge depends on the founder's Claude account and is currently blocked by subscription limit.
- No new account/employee/runtime/Hermes/audit/artifact proof ids claimed in this handoff.

Git state at handoff creation:

- Branch: `worktree-mcp-server-toolsets-descriptor`.
- Latest pushed commits before this note:
  - `d0d2fbe add ui handoff packet`
  - `bc6edd2 phase 2 owner work surface`
  - `4d5649b phase 1 artifact fallback`
- Worktree was clean before adding this handoff note.
