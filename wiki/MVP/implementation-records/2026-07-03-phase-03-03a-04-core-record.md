# Implementation Record — Phase 3 / 3A / 4-Core Live Employee

Status: source-wired; live runtime/provider proof pending

Date: 2026-07-03

## What is wired

- Real Hermes API Server client for `GET /health`, `GET /v1/capabilities`, `POST /api/sessions`, and
  `POST /api/sessions/{id}/chat`.
- DB-backed per-employee turn queue/lease tables and helpers for serialized Hermes turns.
- Provisioning now renders per-profile API server env and stores the sealed API key reference in a private runtime
  secret table, not owner-readable `runtime_endpoints`.
- Generic ingress is now the hot path for Gmail, Stripe, and Manager events.
- Minimal Channel/Session/Presence router records `delivery_decisions`, uses web heartbeat/SMS presence, and routes
  employee-initiated intents with active-web-wins behavior.
- Gmail replies can wake Hermes, parse a JSON descriptor, stamp identity, validate, bind approvals, and route.

## Local proof

- `npm run typecheck` — pass.
- `npm run test:unit` — 26 files / 128 tests pass.
- `npm run build` — pass.
- `npm run lint` — pass.
- `npm run test:integration` — pass with 4 env-gated tests skipped.

## Pending live proof

- Real Hermes gateway health/capabilities/session/chat proof.
- Real Twilio inbound/reply/ambient push SIDs.
- Real Gmail Pub/Sub message id and Gmail message id through generic ingress.
- Real Stripe test event id through generic ingress.

Use `tests/golden-path/live-employee-wake.md` and `npm run smoke:live-employee` as the acceptance hook.
