# Local onboarding harness (bypass vs real-user) + live Twilio creds wired

Date: 2026-07-04 19:12 EDT

Status: source-wired; real-user live path gated only on a funded orchestrator model key

Scope: browser/API onboarding test harness, gated dev phone-verify bypass, varied fixtures, live Twilio env.

## What changed

- Built the practical onboarding test harness the `2026-07-04-1840` handoff asked for, on branch
  `worktree-live-onboard-harness` (draft PR to `main`). See
  `wiki/MVP/implementation-records/2026-07-04-local-onboarding-harness-record.md` for the full file list.
  - `infra/scripts/local/contractor-fixtures.mjs` — 5 varied beachhead trades; `ONBOARD_FIXTURE` pins one.
  - `infra/scripts/local/onboard.mjs` (`npm run local:onboard`) — REAL front-door path, fixture-driven.
  - `infra/scripts/local/acceptance/06-browser-onboard.mjs` — Playwright drives the real form.
  - Gated dev phone-verify bypass in `twilio.ts` + `identity.stub.ts` (fail-closed in prod).
  - `bootstrap.mjs` now fixture-varied (bypass path); RUNBOOK §6 documents both paths.
- Wired the founder's live Twilio trial creds into the gitignored `mvp-build/.env` (never committed):
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_TEST_NUMBER` (+18883295911),
  `TWILIO_TEST_TO_PHONE` (Ben's phone), `TWILIO_VERIFY_SERVICE_SID` (VA…, "tester"),
  `TWILIO_VERIFY_DEV_BYPASS=1`, `TWILIO_VERIFY_DEV_CODE=000000`. Committed `.env.example`/
  `.env.local.example` got documented **placeholders only** (no secrets/PII).

## Why

Live-feedback testing needs a real front door a coding agent can drive with varied input. The dev bypass
is the "missing route" that lets the real verify path run locally without SMS; it mirrors
`PROVISIONER_SKIP_SMS` and fails closed in production. Fixtures stop onboarding assumptions hiding behind
one copy-pasted business.

## Current status

- `source-wired`: typecheck/lint/build pass; unit **46 files / 263 tests** (+9). No faked live proof.
- **The one hard blocker for the full live loop is a funded orchestrator model key**
  (`ORCHESTRATOR_API_KEY` / `XAI_API_KEY` / `OPENAI_API_KEY`, all absent in `.env`). It blocks the
  onboarding conversation AND the Hermes employee chat/`/v1/runs` (Phase 5 runtime gate) — same key.
- Twilio is now fully configured (account/token/number/verify-service/test-recipient), so real Verify and
  the dev bypass both work locally. Bypass path (bootstrap → provision → Docker → `/health` +
  `/v1/capabilities`) runs with no model key.

## Files / seams touched

`apps/manager/src/lib/twilio.ts`, `apps/manager/src/tools/identity.stub.ts`,
`infra/scripts/local/{contractor-fixtures,onboard,bootstrap}.mjs`,
`infra/scripts/local/acceptance/06-browser-onboard.mjs`, `tests/unit/{phone-verify-dev-bypass,contractor-fixtures}.test.ts`,
`package.json`, `infra/local/RUNBOOK.md`, `.env.example`, `.env.local.example`.

## Carry-forward / next

1. Add a funded model key to `.env`, then run `local:onboard` → `local:acceptance:runtime` →
   `local:chat` → capture `/v1/runs/{id}/events` transcript + external run id → Phase 5 `runtime-accepted`.
2. Then **Phase 7 metering instrumentation** — make `/manager/tools/:name` the universal metering+audit
   chokepoint and capture model cost in `callOpenAiCompatibleModel`; prove one `run_id` chain
   (Gmail reply → Stripe invoice → reminder) is queryable end-to-end. See
   `wiki/MVP/build-plan-current/phases/phase-07-metering-instrumentation.md`.

## Verification

- `npm run typecheck` pass; `npm run lint` clean; `npm run build` pass.
- `npm run test:unit` — 46 files / 263 tests pass (incl. new dev-bypass + fixtures tests).
- `node --check` clean on all new `.mjs`; `npm run local:fixture` prints a varied sample.
