# Handoff — Local No-SMS Bootstrap Restored

Date: 2026-07-04 00:43
Status: source-wired; live provider/runtime proof pending
Scope: Restore interrupted local infra work so the MVP can be exercised against the real Manager/provisioner path before Twilio SMS is required.

## What changed

- `apps/manager/src/provisioner.ts` now supports `PROVISIONER_SKIP_SMS=1|true` for local development. It skips Twilio webhook assignment and first outbound SMS, records `sms:skipped`, and fails closed if enabled with `NODE_ENV=production`.
- `apps/manager/src/tools/provisioning.stub.ts` now preserves a true no-SMS local runtime endpoint instead of backfilling `TWILIO_TEST_NUMBER`, and returns local-appropriate owner-facing hints.
- `.env.local.example` was added at the build root with the Supabase project URL for `amtech-ai-employee-mvp` (`uxuruijrgghshfwnaagb`) and the no-SMS local stack variables.
- `apps/web/.env.local.example` was added for the local web proxy env.
- `infra/scripts/local/bootstrap.mjs` was added. It inserts a service-role `verified_phones` row as the only local shortcut, then calls the real Manager `create_account` and `provision_employee` tools.
- `infra/scripts/local/chat.mjs` was added. It sends a web owner-turn through `/manager/employee/:employeeId/message` using the bootstrap state.
- `infra/scripts/local/check.mjs`, `build-hermes-image.mjs`, and `start-hermes-container.sh` were added for host readiness, Hermes image build, and one Dockerized Hermes gateway/API-server container per employee.
- `infra/scripts/local/acceptance/` was added with runnable checks for env, Manager/Web services, runtime endpoint + Docker container + Hermes health/capabilities, Manager webchat, and browser-driven Work Surface chat.
- `.devcontainer/` was added with Docker-outside-of-Docker as the default operator workspace. Employee runtimes remain sibling containers on the host daemon.
- `package.json`, `.gitignore`, and `infra/scripts/README.md` now expose and document `npm run local:check`, `local:build-hermes`, `local:bootstrap`, `local:chat`, `local:acceptance:*`, and `local:browser-install`.
- `packages/db/migrations/0002_rls.sql` was corrected so RLS policies match the actual schema: direct `account_id` owner tables, employee-owned tables via `employees`, and `stripe_invoices` via `stripe_connections`.

## Why

The prior agent's interrupted work had created local no-SMS bootstrap scripts, but they were absent from the current worktree. The immediate goal is to test the real Manager/provisioning/web-chat path locally while Twilio/A2P and SMS acceptance stay out of the critical path.

## Current status

- Local no-SMS provisioning path: `source-wired`.
- Provider acceptance remains `pending`; no Twilio proof is claimed by this path.
- Runtime acceptance remains `pending`; the local path starts real Dockerized Hermes containers, but no live run proof was captured by this agent because this process still lacks the refreshed Docker group.
- Docker, Caddy, buildx, Playwright package, and Chromium are installed. Docker commands must be run from a shell where `id -nG` includes `docker`.
- `.env` and `apps/web/.env.local` were materialized locally and are gitignored. `.env` has Supabase URL + publishable/service-role keys; the direct `db.<ref>.supabase.co` `DATABASE_URL` path is not usable from this IPv4-only local network because Supabase direct DB hosts can be IPv6-only without the paid IPv4 path. The Supabase shared pooler URI is now configured and verified.
- Supabase migrations `0001`-`0015` are applied on project `uxuruijrgghshfwnaagb`. `0002_rls.sql` initially failed because it assumed `account_id` on tables that scope through related rows; the migration file is patched and replay from `0002` succeeded.

## Files / seams touched

- Provisioning boundary: `apps/manager/src/provisioner.ts`, `apps/manager/src/tools/provisioning.stub.ts`.
- Local scripts: `infra/scripts/local/bootstrap.mjs`, `chat.mjs`, `check.mjs`, `build-hermes-image.mjs`, `start-hermes-container.sh`, `acceptance/*.mjs`.
- Env/docs/scripts: `.env.local.example`, `apps/web/.env.local.example`, `.env.example`, `.devcontainer/`, `infra/local/RUNBOOK.md`, `infra/caddy/local.Caddyfile`, `infra/scripts/README.md`, `package.json`, `.gitignore`, `mvp-build/.gitignore`.

## Carry-forward / next

- From a refreshed docker-group shell, run `npm run local:check`, `npm run local:build-hermes`, migrations, Manager/Web, then `npm run local:acceptance`.
- Capture runtime proof after bootstrap: Docker container id/name, `/health`, `/v1/capabilities`, and one web-chat turn through Manager -> Hermes -> Work Surface.
- Dev-container decision: Docker-outside-of-Docker is the default so the dev workspace is reproducible while per-client employee runtimes are host-sibling containers. Docker-in-Docker remains a CI-style fallback, not the local MVP parity path.

## Verification

- `npm run typecheck` — pass.
- `npm run test:unit -- tests/unit/hermes-client.test.ts tests/unit/scheduler-runner.test.ts tests/unit/run-id-chain.test.ts` — pass, 3 files / 29 tests.
- `npm run test:unit` — pass, 38 files / 223 tests.
- `npm run lint` — pass.
- `npm run build` — pass.
- `npm run local:browser-install` — pass after network escalation; Chromium installed with fallback ubuntu24.04 build.
- `node --check infra/scripts/local/bootstrap.mjs` — pass.
- `node --check infra/scripts/local/chat.mjs` — pass.
- `node --check infra/scripts/local/check.mjs` — pass.
- `node --check infra/scripts/local/build-hermes-image.mjs` — pass.
- `node --check infra/scripts/local/acceptance/*.mjs` — pass.
- `bash -n infra/scripts/local/start-hermes-container.sh` — pass.
- `.devcontainer/devcontainer.json` JSON parse — pass.
- `npm run local:acceptance:env` — runs; passes configured Supabase URL/publishable/service-role keys, `DATABASE_URL` presence, and local settings; fails expected on this agent shell's stale Docker group.
- `npm run local:db-setup` — pass through Supabase shared pooler; applied `0002_rls.sql` through `0015_hermes_runs_capabilities_alignment.sql`.
- `set -a && source .env && set +a && npm run db:status` — pass; all migrations `0001`-`0015` reported applied.
- `set -a && source .env && set +a && npm run local:check` — env, Caddy, and buildx pass; blocked on Docker socket because this agent process still lacks the refreshed `docker` group; Hermes image not yet built in this process.
