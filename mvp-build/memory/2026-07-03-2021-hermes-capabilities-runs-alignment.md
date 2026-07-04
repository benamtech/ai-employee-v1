# Handoff — Hermes Capabilities/Runs Alignment Implemented

Date: 2026-07-03 20:21
Status: source-wired; live runtime/provider proof pending
Scope: Implement the Hermes integration alignment audit fixes before Phase 5 production work.

## What changed

- `apps/manager/src/lib/hermes-client.ts` now performs a cached `/v1/capabilities` handshake, exposes capability helpers, and routes turns through Hermes Runs when advertised, with `/api/sessions/{id}/chat` as the documented synchronous fallback.
- `apps/manager/src/lib/runtime.ts`, `wake.ts`, and `turn-drain.ts` now call the shared Hermes turn executor instead of directly calling Sessions chat.
- `apps/manager/src/lib/metering.ts` can persist external Hermes run ids on Manager-owned `work_runs`; queued owner-message runs now remain open until the drain lane finishes them.
- `apps/manager/src/tools/provisioning.stub.ts` stores a strict account+employee scoped Hermes session key on new runtime endpoints.
- `packages/db/migrations/0015_hermes_runs_capabilities_alignment.sql` adds `runtime_endpoints.api_session_key` plus `work_runs.runtime_provider` / `external_runtime_run_id`.
- Tests now cover capabilities-first execution, Runs-first behavior, Sessions fallback, session-key validation, runtime-health capability failure, external Hermes run correlation, and queued-run drain closure.
- `tests/integration/hermes-contract.integration.test.ts` adds an env-gated real Hermes API Server contract scaffold.
- `infra/hermes/RUNBOOK.md`, `tests/golden-path/live-employee-wake.md`, and `CODEGRAPH.md` were updated for the new boundary and migration.

## Why

The Hermes v0.18.0 research audit found that AMTECH was API-server-first but not yet capabilities-first, did not have a `/v1/runs` production path, lacked deliberate `X-Hermes-Session-Key` scoping, and could leave queued owner-turn `work_runs` semantically stuck as started+finished.

## Current status

- Hermes runtime boundary alignment: `source-wired`.
- Phase 4 remains `source-wired`; `runtime-accepted` remains `pending` until real Hermes proof ids exist.
- Phase 6 metering foundation remains `source-wired`; it now has external Hermes run correlation fields.
- Provider/runtime acceptance remains `pending`; no live provider or Hermes proof ids were created in this session.

## Files / seams touched

- Runtime boundary: `apps/manager/src/lib/hermes-client.ts`, `runtime.ts`, `wake.ts`, `turn-drain.ts`, `runtime-health.ts`.
- Metering/schema: `apps/manager/src/lib/metering.ts`, `packages/db/migrations/0015_hermes_runs_capabilities_alignment.sql`.
- Provisioning/session scope: `apps/manager/src/tools/provisioning.stub.ts`.
- Tests: `tests/unit/hermes-client.test.ts`, `run-id-chain.test.ts`, `turn-drain.test.ts`, `scheduler-runner.test.ts`, runtime-adjacent wake/ingress/event/gmail tests, and `tests/integration/hermes-contract.integration.test.ts`.

## Carry-forward / next

- Apply migrations through `0015` before any live Hermes proof.
- Run the new Hermes contract test with `HERMES_CONTRACT_BASE_URL` and `HERMES_CONTRACT_API_TOKEN` against a real v0.18.0 profile before claiming runtime acceptance.
- Phase 5 should build streaming UI/event consumption on top of the existing Runs client, adding `/v1/runs/{run_id}/events`, stop, and approval flows as production Work Surface features.

## Verification

- `npm run test:unit -- tests/unit/hermes-client.test.ts tests/unit/wake.test.ts tests/unit/turn-drain.test.ts tests/unit/run-id-chain.test.ts tests/unit/ingress.test.ts tests/unit/event-bus.test.ts tests/unit/gmail-pubsub.test.ts tests/unit/scheduler-runner.test.ts tests/unit/metering.test.ts` — pass, 65 tests.
- `npm run typecheck` — pass.
- `npm run test:unit` — pass, 38 files / 223 tests.
- `npm run test:integration` — pass with 5 files / 10 tests skipped cleanly without live creds.
- `npm run lint` — pass.
- `npm run build` — pass.
