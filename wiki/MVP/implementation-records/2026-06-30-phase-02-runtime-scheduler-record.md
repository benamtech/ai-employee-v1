# Phase 2 — Runtime/Scheduler Productionization (record)

Status: active

Date: 2026-06-30

This record is **factual**. It documents the new-era Phase 2 runtime/scheduler source wiring in
[`../../../mvp-build/`](../../../mvp-build/). It does **not** claim live runtime acceptance: no live
Docker/Hermes host or real Hermes Jobs run id was available in this environment, so the live gate
remains pending.

Spec: [`../build-plan-current/phases/phase-02-runtime-scheduler-productionization.md`](../build-plan-current/phases/phase-02-runtime-scheduler-productionization.md).

## What was built (source-wired)

- **Docker-first runtime backend policy** — unset `HERMES_BACKEND_TYPE` now resolves to `docker`;
  explicit `local` remains allowed only as dev/demo. Unknown backend values fail closed.
- **Profile rendering backend token** — profile build params now include `runtime_backend`; the Hermes
  profile template renders `terminal.backend: "{{RUNTIME_BACKEND}}"` instead of hard-coded `local`.
- **Protected Manager scheduler runner** — `POST /manager/scheduler/run` runs one job or the full
  scheduled cycle: `dispatch_due_reminders`, `renew_expiring_watches`, `dispatch_daily_briefs`, and
  `runtime_health_checks`.
- **Job-run proof writes** — every scheduler job writes `hermes_job_runs` with runner metadata,
  `started_at`/`finished_at`, status, proof JSON, optional external job id, and safe error text.
- **Runtime health snapshots** — additive migration `0008_phase2_runtime_scheduler.sql` adds
  `runtime_health_checks` and job-run metadata columns. Health checks snapshot backend type, webchat
  reachability, SMS number presence, provisioning state, and safe details.
- **Ops scripts** — `scheduler-tick.mjs` now calls the Manager scheduler boundary as
  `runner_type=scheduler_tick`; `hermes-jobs-runner.mjs` is the production-oriented Hermes Jobs entry;
  `healthcheck.mjs` persists `runtime_health_checks` and updates `runtime_endpoints.health`.
- **Phase 1 hardening** — acceptance run 6 now queries `hermes_job_runs.started_at` instead of the
  nonexistent `created_at` column, and the acceptance docs use canonical `TWILIO_FRONTDOOR_NUMBER`.
- **Number inventory decision** — `number_pool` remains the active Phase 1/2 source of truth; future
  Phase 10 `number_assignments` is additive admin assignment history, not a replacement in this phase.

## Local verification (proof that was actually run)

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run test:unit` | **25 files / 124 tests pass** |
| `npm run build` | pass |
| `npm run lint` | pass |
| `npm run test:integration` | **skips cleanly** (4 tests skipped: env-gated Supabase/security) |
| `npm run acceptance:preflight` | all 8 runs **BLOCKED** with precise missing vars; exit 1 |
| `npm run acceptance:report` | 0 pass · 0 fail · **8 not-run**; "NOT yet accepted"; report file written; exit 0 |

## Status

- Phase 2 source: `source-wired`.
- Phase 2 live runtime gate: `pending` — requires Docker-backed runtime health and real Hermes
  job/run ids for at least one full scheduled cycle.
- Phase 1 live provider/runtime gate: still `pending` — no live provider proof ids captured.

## What live execution requires

1. Apply migrations through `0008_phase2_runtime_scheduler.sql`.
2. Provision or select a Docker-backed employee runtime (`runtime_endpoints.backend_type=docker`).
3. Run Hermes Jobs via `npm run scheduler:hermes-jobs -- --job=<job> --external-job-id=<real-id>`
   for reminder dispatch, watch renewal, daily briefs, and runtime health checks.
4. Capture `hermes_job_runs.external_job_id`, `runtime_health_checks` rows, and runtime health proof in
   the next implementation record before marking Phase 2 `runtime-accepted`.
