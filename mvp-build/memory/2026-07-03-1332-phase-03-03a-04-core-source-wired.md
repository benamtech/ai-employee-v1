# Handoff — Phase 3 / 3A / 4-Core Source-Wired

Date: 2026-07-03 13:32
Status: source-wired; live runtime/provider proof pending
Scope: real Hermes Sessions runtime contract, DB-backed turn serialization, generic ingress, minimal channel router, Gmail live wake core.

## What changed

- Replaced the fictional `/messages` and `/events/work` runtime assumption with `hermes-client.ts` for real Hermes
  API Server health/capabilities/session/chat calls.
- Added migrations `0011` and `0012`: runtime API fields, private runtime endpoint secrets, DB turn jobs/locks,
  channel sessions, and delivery decisions.
- Added DB-backed turn queue helpers and routed web/SMS owner turns through the canonical Hermes session path.
- Provisioning now renders a real profile `.env` with `API_SERVER_*`, seals the API key into a private runtime secret
  row, disables Hermes SMS gateway, and removes profile cron duplication.
- Promoted generic ingress via `events/ingress.ts` and Gmail/Stripe/Manager adapters.
- Added minimal Channel/Session/Presence routing with web heartbeat, SMS presence, active-web-wins, silent records,
  dedicated sender resolution, and delivery-decision proof rows.
- Added `wake.ts`: Gmail replies can claim the inbound event, wake Hermes, parse JSON, stamp identity, validate,
  bind approvals, and route.
- Added live acceptance hook `npm run smoke:live-employee` and golden path `tests/golden-path/live-employee-wake.md`.

## Why

The July 3 architecture audit found the Manager runtime client called invented Hermes endpoints and the event bus had
a dead registry, off-rail Twilio inbound, and presence-blind delivery. This implementation makes the employee path
live-testable against Hermes Sessions while keeping provider/runtime acceptance honest.

## Current status

- Phase 3: `source-wired`, live provider proof pending.
- Phase 3A: `source-wired`, live provider proof pending.
- Phase 4 core: `source-wired`, `runtime-accepted` pending real Hermes proof.

## Files / seams touched

- Runtime: `apps/manager/src/lib/hermes-client.ts`, `runtime.ts`, `turn-queue.ts`, `wake.ts`.
- Events/router: `events/ingress.ts`, `events/adapters/*`, `employee-events.ts`, `channel-router.ts`, `sms-sender.ts`.
- Provisioning/template: `provisioning.stub.ts`, `provisioner.ts`, `profile-renderer.ts`, `packages/agent-template/*`.
- Schema: migrations `0011_phase4_hermes_runtime.sql`, `0012_phase3a_channel_router.sql`.
- Web presence: Work Surface heartbeat route and client interval.

## Carry-forward / next

- Run live proof with real Hermes gateway and provider credentials; record proof ids in implementation records.
- Build a durable background worker/drain around the turn queue if queued web/SMS turns need processing beyond
  opportunistic request-path claims.
- Phase 5 should replace one-shot SSE snapshots with live stream and implement batch digest flush through the router.

## Verification

- `npm run typecheck` — pass.
- `npm run test:unit` — 26 files / 128 tests pass.
- `npm run build` — pass.
- `npm run lint` — pass.
- `npm run test:integration` — pass with 4 env-gated tests skipped.
