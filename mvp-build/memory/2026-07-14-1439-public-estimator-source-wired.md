# Public Estimator Employee Source-Wired

Date: 2026-07-14 14:39 EDT
Status: source-wired; provider/runtime turn proof pending LLM provider credentials
Scope: Public `/free-estimator` acquisition surface backed by one AMTECH-provisioned estimator employee.

## What changed

- Added migration `0031_public_estimator.sql` for Manager-only public estimator sessions, messages, artifact mappings, funnel events, and Resend email attempts.
- Added Manager public estimator services/routes:
  - anonymous visitor token hash/resume/expiry and funnel-event recording;
  - visitor-scoped current-draft lookup and copy/download actions;
  - per-visitor runtime adapter over the same employee runtime with overridden Hermes transcript/session key;
  - Resend direct HTTP wrapper and draft-email persistence/failure recording.
- Added web public estimator API proxies and `/free-estimator` UI: chat-first estimator workspace, draft preview, copy/download, visitor email, and free-trial CTA.
- Updated the estimate skill wording so public website sessions produce structured drafts first and do not imply PDF/customer sends.
- Added focused unit tests plus a real Supabase integration test for Manager-only RLS, visitor artifact isolation, and email idempotency.

## Why

The GTM path needs a public materialization of a real AMTECH estimator employee, not a standalone calculator or generic chatbot. The missing primitive was one employee with many anonymous visitor transcript ids, scoped messages/artifacts/funnel state, and production-close DB proof.

## Current status

- `source-wired`: yes. Code, migration, unit tests, build, lint, and real Supabase integration are green.
- `provider-accepted`: no. Resend live send proof ID not captured.
- `runtime-accepted`: no new proof. Hermes infrastructure is available, but live public estimator turns still need a provider-backed LLM credential and captured Hermes run id.

## Files / seams touched

- Schema: `packages/db/migrations/0031_public_estimator.sql`.
- Manager: `apps/manager/src/public-estimator.ts`, `lib/public-estimator*.ts`, `lib/resend-client.ts`, `lib/turn-queue.ts`, `server.ts`.
- Web: `apps/web/app/free-estimator/`, `apps/web/app/api/public-estimator/`, root page link.
- Contracts/tests: `packages/shared/src/ids.ts`, fake Supabase uniques, public estimator unit/integration tests.

## Carry-forward / next

- Fill live env gates: `PUBLIC_ESTIMATOR_EMPLOYEE_ID`, `PUBLIC_ESTIMATOR_ACCOUNT_ID`, Resend env, and provider-backed Hermes LLM credentials.
- Capture proof IDs for one real public estimator turn: visitor session id, employee id, Hermes run id, artifact id, funnel event rows.
- Capture a real Resend message id from `mail.amtechleads.com`; until then email remains source-wired/provider-pending.
- Optional next hardening: add founder/admin read model for public estimator sessions and follow-up queue.

## Verification

- `set -a && source .env && set +a && npm run db:migrate` — applied `0031_public_estimator.sql`.
- `npm run typecheck` — pass.
- `npm run test:unit` — pass, 93 files / 585 tests.
- `set -a && source .env && set +a && npm run test:integration` — pass with network access, 6 files passed / 13 tests passed, Hermes contract skipped due missing `HERMES_CONTRACT_*` env.
- `npm run build` — pass.
- `npm run lint` — pass.
- Local server smoke: built Manager started on `:8080` with `PUBLIC_ESTIMATOR_EMPLOYEE_ID=emp_5omv4ihbvggc8ibe31nj43` and `PUBLIC_ESTIMATOR_ACCOUNT_ID=acct_x7kt6lu4hjl0r9fzjj5q3b`; Next dev server on `:3000`; `GET /free-estimator` returned 200 and `POST /api/public-estimator/session` returned 200 with a visitor session. This proves route/session wiring only, not a provider-backed LLM turn.
