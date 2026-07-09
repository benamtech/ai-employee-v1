# Phase 2 Work Surface Source-Wired

Date: 2026-07-09 10:50

Status: source-wired; live browser/runtime acceptance pending

Scope: Reviewed Phase 1 code, closed source-level loose ends, and implemented the Phase 2 owner Work Surface redesign with current tables/contracts.

## What changed

- Fixed Phase 1 loose ends:
  - `fetchWorkEventsSince` now advances the SSE cursor when only approvals are new, preventing repeated approval deltas.
  - artifact signed-link access counts now update only after the artifact can actually be resolved/rendered.
  - the web artifact HTML fallback now adds restrictive browser headers (`Content-Security-Policy`, `Referrer-Policy`, `X-Content-Type-Options`).
- Expanded the shared Work Surface contract:
  - `packages/shared/src/resource-payload.ts` now includes owner-safe `employee`, `runtime_health`, `abilities`, `outputs`, and `tasks` summaries.
  - no migration was added; these summaries derive from existing rows.
- Upgraded the Manager read model:
  - `buildEmployeeSnapshot` now returns employee status, latest runtime health, derived outputs, derived tasks, and ability summaries.
  - abilities currently merge Manager policy/static defaults with connector and runtime state; this is Phase 4 groundwork, not the final capability graph.
- Rebuilt the owner Work Surface:
  - `AgentClient.tsx` is now a multi-region employee desk with left navigation, center work views, and right preview pane.
  - views include Today, Chat, Jobs, Tasks, Outputs, Connected, Abilities, Activity, and Settings-lite.
  - chat renders persisted `employee_messages` as source of truth, with short-lived optimistic pending messages.
  - selected preview routing opens approvals, work events, jobs, outputs, tasks, connectors, abilities, and messages.
  - existing `ApprovalCard`, `WorkCard`, `JobFolder`, `DailyBrief`, artifact output route, approval route, SSE stream, and polling fallback are preserved.
- Added `surface-model.ts`:
  - nav counts;
  - default selection priority;
  - owner-facing connector labels;
  - status-tone mapping.
- Updated `mvp-build/CODEGRAPH.md` and marked Phase 2 as `source-wired` in the phase doc.

## Why

Phase 2 needed the web product to stop being a sparse proof surface. The owner now lands in a work desk that can show what needs attention, what has been produced, what is connected, what the employee can do, and what is happening, without exposing raw tool/API/MCP/runtime language.

## Current status

- Phase 1 source cleanup: complete.
- Phase 2 owner Work Surface: `source-wired`.
- Live/browser acceptance: pending. The local employee/model path is still blocked until there is a usable funded model/provider route or the temporary bridge can run again.
- No new runtime/provider proof ids were captured in this session.

## Files / seams touched

- `apps/manager/src/lib/employee-stream.ts`
- `apps/manager/src/server.ts`
- `apps/web/app/agent/[employeeId]/AgentClient.tsx`
- `apps/web/app/agent/[employeeId]/lib/surface-model.ts`
- `apps/web/app/agent/[employeeId]/output/[artifactId]/route.ts`
- `apps/web/app/agent/[employeeId]/surface-types.ts`
- `packages/shared/src/resource-payload.ts`
- `tests/unit/employee-stream.test.ts`
- `tests/unit/artifact-resolve.test.ts`
- `tests/unit/work-surface-model.test.ts`
- `second-half-plan/phase-02-owner-work-surface-redesign.md`
- `CODEGRAPH.md`

## Carry-forward / next

- When model/provider capacity is available, run the live browser proof:
  - `npm run live:up`
  - reprovision or use a current employee
  - verify runtime `/health`, `/v1/capabilities`, `/v1/toolsets`
  - open the Work Surface and capture desktop/mobile screenshots
  - verify persisted chat after refresh
  - verify approval preview/resolve
  - verify payload-only artifact HTML fallback
- Phase 3 should build signed SMS/mobile preview links from the same selected resource/action model.
- Phase 4 should replace the temporary ability derivation with a real capability registry/cache from Hermes, Manager MCP, connectors, entitlements, and runtime health.

## Verification

- `npm run typecheck` — pass.
- `npm run test:unit -- tests/unit/employee-stream.test.ts tests/unit/artifact-resolve.test.ts tests/unit/work-surface-model.test.ts` — pass, 3 files / 11 tests before the final empty-state assertion was added.
- `npm run lint` — pass.
- `npm run test:unit` — pass, 53 files / 315 tests.
- `npm run build` — pass.

No live runtime/provider acceptance claimed.
