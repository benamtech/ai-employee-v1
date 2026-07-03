# Phase 2 — Runtime & Scheduler Productionization

Status: source-wired

## Goal / Module

Move from the demo/dev runtime assumptions to **first-pilot operations**: Docker-default containment
for employee runtimes and a real scheduled-job runner replacing direct `scheduler:tick` tool calls.

## Depends on

- Phase 1 (a live runtime host exists and is reachable with proof).

## Surface (code + schema)

- Runtime backend selection: `docker` is the default for production, VPS deployment, and production-like local testing; `local` is explicit dev/demo only.
- Hermes Jobs (or equivalent runner) enters through protected Manager scheduler endpoint `/manager/scheduler/run`.
- `hermes_job_runs` writes scheduler proof rows with runner metadata.
- `runtime_health_checks` stores runtime health snapshots surfaced to Manager/admin.
- Env: `HERMES_BACKEND_TYPE=docker`, Hermes job/event config.

## Build tasks

- Make `docker` the default first-pilot backend; document `local` as dev/demo only. **Source-wired.**
- Configure Hermes Jobs (or equivalent) to run the scheduled tasks through `/manager/scheduler/run`; keep `scheduler:tick` as a fallback only. **Source-wired.**
- Record scheduler proof in `hermes_job_runs`. **Source-wired** for Manager/fallback/Hermes Jobs entrypoints; **runtime acceptance pending** real Hermes job ids.
- Add runtime health snapshots and expose them to the Manager/admin read model. **Source-wired.**

## Acceptance proof

- `runtime-accepted`: runtime health and **real job-run proof** (Hermes run/job ids) are visible to
  Manager/admin for at least one full scheduled cycle (reminder dispatch + watch renewal + daily brief).
- Containment is `docker` (not `local`) for the pilot runtime.

## Seam handed forward

A reliable scheduled-runner + runtime-health signal that Phase 4 (live wake path) and Phase 10
(admin provisioning/runtime health surfaces) build on.

## Status

`source-wired` — local code, migration, scripts, and tests are present. Live `runtime-accepted` gate
remains `pending` until Docker-backed Hermes runtime health and real Hermes job/run ids are captured
for at least one full scheduled cycle.
