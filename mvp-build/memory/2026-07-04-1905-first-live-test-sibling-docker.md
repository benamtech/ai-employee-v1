# 2026-07-04 19:05 — First live test on the sibling-Docker Hermes stack

Date: 2026-07-04 19:05
Status: live-test note
Scope: record the first local end-to-end run against live Supabase + Manager/Web + sibling Hermes

## What changed

- Brought up the local stack with the repo's real scripts: `local:check`, `local:build-hermes`,
  `db:migrate`, `manager:dev`, `web:dev`, and `local:bootstrap`.
- Provisioned a real account and employee through Manager, with `PROVISIONER_SKIP_SMS=1` so the
  no-SMS path stayed deliberate.
- Started a sibling Docker Hermes container for the employee and confirmed it was mapped to a
  localhost port.
- Tried the first owner chat through `npm run local:chat`.

## What happened

- `local:check` passed once run with the right Docker socket permissions.
- `db:migrate` reported the live Supabase database already up to date through `0016`.
- `local:bootstrap` succeeded and wrote `infra/.local/state.json` with the new account, employee,
  owner session token, and web route.
- The Hermes container came up, but the first chat failed with `runtime_unreachable`.
- Runtime probing showed the container's API server was listening on `127.0.0.1:8972` inside the
  container, so host-side requests to the published port were being reset instead of reaching the API
  server.

## Why

- This was the first real local proof attempt for the Phase 5 runtime gate, not a source-level or unit
  test surrogate.
- The failure is useful because it narrows the remaining blocker to Hermes API-server reachability,
  not Manager provisioning or Supabase wiring.

## Current status

- Phase 5 local onboarding/provisioning path: working.
- Phase 5 live Hermes runtime proof: pending.
- Hermes chat/API reachability: blocked by the container-bound API server bind/address behavior.

## Files / seams touched

- [infra/local/RUNBOOK.md](/home/georgej/AMTECH/GTM-RESEARCH/mvp-build/infra/local/RUNBOOK.md)
- [infra/scripts/local/bootstrap.mjs](/home/georgej/AMTECH/GTM-RESEARCH/mvp-build/infra/scripts/local/bootstrap.mjs)
- [infra/scripts/local/start-hermes-container.sh](/home/georgej/AMTECH/GTM-RESEARCH/mvp-build/infra/scripts/local/start-hermes-container.sh)
- [apps/manager/src/lib/hermes-client.ts](/home/georgej/AMTECH/GTM-RESEARCH/mvp-build/apps/manager/src/lib/hermes-client.ts)
- [wiki/MVP/implementation-records/2026-07-04-phase-05-record.md](/home/georgej/AMTECH/GTM-RESEARCH/mvp-build/../wiki/MVP/implementation-records/2026-07-04-phase-05-record.md)

## Carry-forward / next

- Fix the Hermes API-server bind so the host can reach `/health`, `/v1/capabilities`, and
  `/v1/runs/{id}/events` through the container's published port.
- Re-run `local:chat`, `local:acceptance:runtime`, and the browser Work Surface flow once the runtime
  responds from the host side.
- Keep OpenRouter separate from this note: the blocker here was runtime reachability before any model
  credit path mattered.

## Verification

- `npm run local:check` passed with escalated Docker access.
- `npm run local:build-hermes` completed and loaded `hermes-agent:latest`.
- `npm run db:migrate && npm run db:status` reported the live Supabase database already up to date
  through `0016`.
- `npm run local:bootstrap` succeeded and started the sibling Hermes container.
- `npm run local:chat -- "Can you help price a small interior repaint?"` failed with
  `runtime_unreachable`.
- Host probes to `http://localhost:8972/health` and `http://127.0.0.1:8972/health` reset, while the
  container logs showed the API server binding to `127.0.0.1:8972` internally.
