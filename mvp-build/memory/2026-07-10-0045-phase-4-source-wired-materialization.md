# Phase 4 source-wired materialization

Date: 2026-07-10 00:45
Status: source-wired local/static proof only
Scope: second-half Phase 4 production-shaped capability/materialization layer plus deferred Phase 1-3 hardening seams

## What changed

- Added shared Phase 4 contracts in `packages/shared/src/materialization.ts` and extended `ResourcePayload` with `capabilities` and `surface_envelopes`; added ID prefixes for `surfaceEnvelope`, `workResource`, `workAction`, `capabilityNode`, and `surfaceReceipt`.
- Added Manager capability/materialization source modules:
  - `apps/manager/src/lib/capability-registry.ts` builds owner-language `CapabilityGraphNode`s from Manager tool schemas/MCP, connector state, runtime health, and policy, then backfills legacy `abilities`.
  - `apps/manager/src/lib/materialization.ts` projects current snapshot rows into `SurfaceEnvelope`, `WorkResource`, and `WorkAction` lists with safety/render/proof metadata.
- Extended `buildEmployeeSnapshot` to emit `capabilities` and `surface_envelopes` while preserving existing `abilities`, `outputs`, and `tasks`.
- Extended Manager MCP in `apps/manager/src/lib/mcp-server.ts` with read-only `resources/list` and `resources/read` for business brain, connector status, artifacts, approvals, work queue, runtime health, and capability registry. Reads require bound MCP identity and redact secret refs.
- Added internal `/manager/materialization/diagnostics` in `apps/manager/src/server.ts` for future admin diagnostics: redacted latest envelopes/resources/actions, proof ids, delivery receipts, render errors, and repair hints.
- Added migration `packages/db/migrations/0022_phase4_materialization.sql` with Manager-only tables, atomic signed-link counter RPCs, and direct-read tightening for secret-reference connector tables.
- Closed hardening seams:
  - `fetchWorkEventsSince` now uses stable `(created_at,id)` cursors and `cursorFromSnapshot`.
  - SSE progress/snapshot/delta writes are serialized; write failures close the loop visibly.
  - signed artifact/preview access counters use atomic RPC calls instead of app read-modify-write.
  - turn drain fails and notifies on over-budget queued owner turns.
  - `isRealMcpToolExecutionResult` distinguishes real MCP structured tool results from JSON emitted as plain text.

## Why

Phase 4 needed to become the generic source-wired layer that lets Hermes/Manager/provider work materialize across web, SMS previews, and future admin without bespoke connector UI. The acceptance bar for this pass was intentionally local/static only; live Hermes/provider proof remains separate.

## Current status

`source-wired`. Do not claim `provider-accepted` or `runtime-accepted` from this pass.

Live gaps still open:

- Real Hermes model/tool execution loop. The temporary bridge can still emit tool-call JSON as text without executing the MCP tool loop.
- Live provider/runtime proof for Phase 3 SMS previews and Phase 4 materialized envelopes.
- Live DB migration/advisor proof for `0022`.
- Admin UI/billing/platform roles remain Phase 5+, not implemented here.

## Files / seams touched

- Shared contracts: `packages/shared/src/materialization.ts`, `resource-payload.ts`, `ids.ts`, generated `packages/shared/dist/*`.
- Manager source: `employee-stream.ts`, `capability-registry.ts`, `materialization.ts`, `mcp-server.ts`, `server.ts`, `turn-drain.ts`.
- DB: `packages/db/migrations/0022_phase4_materialization.sql`.
- Tests: `employee-stream`, `materialization`, `mcp-server`, `mcp-resources`, `artifact-resolve`, `preview-resolve`, `turn-drain`, fake Supabase RPC shim.
- Docs: root `CODEGRAPH.md`, `mvp-build/CODEGRAPH.md`, Phase 4 plan, memory index.

## Carry-forward / next

1. Apply/migrate `0022` against live Supabase and run advisors/privilege checks.
2. Close the real Hermes tool-execution gate with a model/provider path that executes MCP tool calls, not JSON text.
3. Provider-prove Phase 3 and Phase 4 with real Gmail/Stripe/Twilio events and Hermes capability/toolset discovery.
4. Use the diagnostics endpoint as the Phase 5 admin seam; do not build admin UI until the live proof path is stable.

## Verification

- `npm run typecheck` — passed.
- `npm run test:unit` — passed, 61 files / 373 tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `npm run ui:test` — passed, fixture smoke at `http://127.0.0.1:3200/agent/emp_ui_fixture`.
- `npm run test:integration` — ran; 5 integration files / 10 tests skipped by env gates. No live DB/Hermes/provider proof claimed.
