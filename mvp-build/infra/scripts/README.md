# infra/scripts

Operational + acceptance scripts.

## Ops scripts

| Script | Status | Purpose |
|---|---|---|
| `hermes-smoke.mjs` | done (P0) | Verify Hermes/Twilio env + print the manual smoke-test steps. |
| `provisioner-health.mjs` | done (P1) | Verify the provisioner HTTP boundary is reachable (`/provision/health`). |
| `profile-validate.mjs` | done (P1) | Generated Hermes profile validation hook (required files + unresolved tokens). |
| `number-pool.mjs` | done (P1) | Audit the 10DLC `number_pool` vs Twilio; enforce front-door reserved + ≥`NUMBER_POOL_MIN_FREE` free; `--sync`, `--top-up=N --confirm-purchase`. |
| `healthcheck.mjs` | done (P2) | Per-employee runtime health; writes `runtime_health_checks` snapshots, updates `runtime_endpoints.health`, and prints SMS/provisioning/connector/artifact state. |
| `repair.mjs` | done (P1) | Repair-command dispatcher → Manager tools (`/manager/tools/:name`); `list` to see commands. Money commands need `--confirm`; some are host actions. |
| `scheduler-tick.mjs` | done (P2 fallback) | Dev/manual fallback that calls `/manager/scheduler/run` and records `hermes_job_runs` proof as `runner_type=scheduler_tick`. |
| `hermes-jobs-runner.mjs` | done (P2) | Production-oriented Hermes Jobs entrypoint; calls `/manager/scheduler/run` with `runner_type=hermes_jobs` and optional `--external-job-id`. |
| `local/check.mjs` | local | Host/env readiness check for Docker, buildx, Caddy, `.env`, Supabase keys, and runtime command. |
| `local/build-hermes-image.mjs` | local | Builds the `hermes-agent` Docker image from `~/.hermes/hermes-agent` using buildx. |
| `local/start-hermes-container.sh` | local | Runtime command invoked by the provisioner from a rendered profile; starts one Dockerized Hermes gateway/API server per employee. |
| `local/bootstrap.mjs` | local | No-SMS local bootstrap: inserts a service-role verified phone, then calls real Manager `create_account` + `provision_employee`; requires `PROVISIONER_SKIP_SMS=1`. |
| `local/chat.mjs` | local | Sends a web-chat owner turn to the employee created by `local/bootstrap.mjs`. |

Repair commands map 1:1 to `wiki/MVP/old-build-plan/10-security-ops-observability.md` "Repair Commands".
They are the sanctioned path for privileged ops — not ad-hoc shell/SQL.

## Acceptance harness — `acceptance/`

The Phase 1 live provider/runtime acceptance system (spec:
`wiki/MVP/build-plan-current/phases/phase-01-provider-runtime-acceptance.md` and
`../03-provider-runtime-acceptance-plan.md`). Nothing here injects synthetic provider results — a run
is `pass` only when real proof ids exist in the live environment.

| File | Command | Purpose |
|---|---|---|
| `acceptance/preflight.mjs` | `npm run acceptance:preflight` | Runnable/blocked matrix for the 8 runs; names missing env. No secrets printed. |
| `acceptance/run1-db-rls.mjs` … `run8-security.mjs` | `node infra/scripts/acceptance/runN-*.mjs` | Per-run verifiers; assert the doc-03 proof ids. `run8` is a live forged-request probe. |
| `acceptance/report.mjs` | `npm run acceptance:report` | Runs all 8, writes `infra/acceptance/reports/phase01-<ts>.json|md`, marks pass/fail/not-run. |
| `acceptance/_env.mjs` | — | Shared env matrix + Supabase client + result helpers. |

Run order: `acceptance:preflight` → fill `.env` for blocked runs → execute the golden-path runbooks
(`tests/golden-path/step1..7*.md`) which produce real proof → `acceptance:report`. The deterministic
security boundary (no creds) is `npm run test:unit` (`tests/unit/forged-requests.test.ts`); live
Supabase pieces are `npm run test:integration`.

For production-like local/tunnel use, set `PROFILE_VALIDATION_COMMAND` to
`node infra/scripts/profile-validate.mjs .` so the provisioner validates generated profiles before
starting a runtime.

## Local no-SMS loop

For the local VPS-faithful loop before Twilio is in the path:

```bash
cp .env.local.example .env
set -a && source .env && set +a
npm run local:check
npm run local:build-hermes
npm run local:browser-install
npm run db:migrate
npm run manager:dev
npm run local:bootstrap
npm run local:chat -- "Can you help price a small interior paint job?"
```

`PROVISIONER_SKIP_SMS=1` skips only Twilio webhook assignment and the first outbound SMS. The provisioner
still renders the employee profile, writes Caddy config, starts a per-employee Dockerized Hermes runtime,
and writes `runtime_endpoints` + sealed runtime secret. It fails closed in production and does not count as
Twilio provider acceptance.

## Scheduler runner — Phase 2

Production-like scheduling enters through the protected Manager endpoint:

```text
POST /manager/scheduler/run
Authorization: Bearer $MANAGER_INTERNAL_TOKEN
```

Body:

```json
{ "job_key": "all", "runner_type": "hermes_jobs", "external_job_id": "hj_..." }
```

`job_key` may be `all`, `dispatch_due_reminders`, `renew_expiring_watches`,
`dispatch_daily_briefs`, or `runtime_health_checks`. Each job writes a `hermes_job_runs` row.
`npm run scheduler:tick` is only the dev/manual fallback and records `runner_type=scheduler_tick`.
