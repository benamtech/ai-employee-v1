# Handoff — Phase 2 runtime/scheduler source-wired

Date: 2026-06-30 01:46
Status: Phase 2 `source-wired`; live runtime gate `pending`
Scope: new-era Phase 2 runtime/scheduler productionization + Phase 1 harness hardening

## What changed

- Docker is now the default runtime backend for production, VPS deployment, and production-like local
  testing. `local` is explicit dev/demo only.
- Provisioning resolves backend policy through `apps/manager/src/lib/runtime-backend.ts`, passes
  `runtime_backend` into profile build params, and persists the resolved backend in
  `runtime_endpoints.backend_type`.
- `packages/agent-template/config.yaml` renders `terminal.backend: "{{RUNTIME_BACKEND}}"`.
- Added protected scheduler boundary `POST /manager/scheduler/run`, implemented by
  `apps/manager/src/lib/scheduler-runner.ts`.
- Scheduler jobs now write `hermes_job_runs` proof rows for reminder dispatch, Gmail watch renewal,
  daily briefs, and runtime health checks.
- Added runtime health snapshot library `apps/manager/src/lib/runtime-health.ts` and migration
  `packages/db/migrations/0008_phase2_runtime_scheduler.sql`.
- `infra/scripts/scheduler-tick.mjs` now calls the scheduler boundary as `runner_type=scheduler_tick`.
  New `infra/scripts/hermes-jobs-runner.mjs` is the production-oriented Hermes Jobs entrypoint.
- `infra/scripts/healthcheck.mjs` writes `runtime_health_checks` and updates `runtime_endpoints.health`.
- Phase 1 hardening: `run6-reminder.mjs` now orders `hermes_job_runs` by `started_at`, and the
  acceptance docs use canonical `TWILIO_FRONTDOOR_NUMBER`.
- Number-pool decision recorded: `number_pool` remains active source of truth now; Phase 10
  `number_assignments` is future additive assignment history.

## Why

The old source had scheduler seams but no single production scheduler boundary and no durable
scheduled-job proof writes. Phase 2 needed a production-shaped path that works with Hermes Jobs later
and still lets local/manual testing exercise the same Manager boundary without claiming runtime
acceptance. Docker had to become the default because `local` profile isolation is not process
containment.

## Current status

- Phase 0 baseline: `source-wired`.
- Phase 1 acceptance harness: `source-wired`; live gate `pending`.
- Phase 2 runtime/scheduler: `source-wired`; live `runtime-accepted` gate `pending`.
- Phases 3–13: `planned`.

## Files / seams touched

- Runtime/backend: `apps/manager/src/lib/runtime-backend.ts`, `apps/manager/src/tools/provisioning.stub.ts`,
  `apps/manager/src/lib/profile-renderer.ts`, `packages/shared/src/profile-package.ts`,
  `packages/agent-template/config.yaml`.
- Scheduler/health: `apps/manager/src/lib/scheduler-runner.ts`, `apps/manager/src/lib/runtime-health.ts`,
  `apps/manager/src/server.ts`, `infra/scripts/scheduler-tick.mjs`, `infra/scripts/hermes-jobs-runner.mjs`,
  `infra/scripts/healthcheck.mjs`.
- Schema: `packages/db/migrations/0008_phase2_runtime_scheduler.sql`.
- Tests: `tests/unit/runtime-backend.test.ts`, `tests/unit/scheduler-runner.test.ts`.
- Records: `../wiki/MVP/implementation-records/2026-06-30-phase-02-runtime-scheduler-record.md`.

## Carry-forward / next

- Live Phase 1 still needs real Supabase/Twilio/Hermes/Gmail/Stripe credentials and host proof.
- Live Phase 2 runtime acceptance needs migrations through `0008`, a Docker-backed employee runtime,
  and real Hermes Jobs external ids written to `hermes_job_runs` for a full scheduled cycle.
- `scheduler:tick` rows are useful local proof but **not** runtime acceptance; only
  `runner_type=hermes_jobs` with real external job ids can upgrade Phase 2.
- Phase 3 generic ingress, Phase 6 metering foundation, and Phase 9 admin foundations remain the next
  independent planned modules after live acceptance posture is available.

## Verification

- `npm run typecheck` — pass.
- `npm run test:unit` — pass, **25 files / 124 tests**.
- `npm run build` — pass.
- `npm run lint` — pass.
- `npm run test:integration` — skips cleanly, 4 env-gated tests skipped.
- `npm run acceptance:preflight` — all 8 runs blocked by missing env; exit 1.
- `npm run acceptance:report` — 0 pass / 0 fail / 8 not-run; no fabricated acceptance.
