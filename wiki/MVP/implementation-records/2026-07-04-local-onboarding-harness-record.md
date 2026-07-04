# Implementation Record — Local Onboarding Harness (bypass vs real-user path)

Status: source-wired; live real-user path gated on a funded orchestrator model key

Date: 2026-07-04

Follows `2026-07-04-phase-05-record.md` and the `2026-07-04-1840` live-feedback-testing handoff.
This pass builds the practical **browser/API onboarding test harness** the handoff named as the
near-term move, and cleanly separates the two local test paths.

## What shipped

- **Varied contractor fixtures** — `infra/scripts/local/contractor-fixtures.mjs`. Five beachhead trades
  (painting, landscaping, carpentry, deck/fence, pressure-washing) with plausible owner words, workflows,
  tools, and per-run-unique email/phone. Deterministic via `ONBOARD_FIXTURE=<kind|index>`. Feeds both
  paths: `conversationTurns(fx)` (real front door) and `bypassManifest(fx)` (no-model bypass).
- **Real-user-path onboarding harness** — `infra/scripts/local/onboard.mjs` (`npm run local:onboard`).
  Drives the exact endpoints `/create-ai-employee` calls (message → send-code → check-code →
  create-account → provision), fixture-driven, writes `infra/.local/state.json`, prints **no secrets**
  (owner session token stored to the gitignored state file only), and fails with the exact remediation
  when the orchestrator model key is missing.
- **Browser real-user harness** — `infra/scripts/local/acceptance/06-browser-onboard.mjs`
  (`npm run local:acceptance:browser-onboard`). Playwright drives the real form with a varied fixture,
  then opens the Work Surface. Distinct from `05-browser.mjs`, which is the **bypass**-path Work Surface
  chat (owner-session cookie).
- **Gated dev phone-verify bypass** — `apps/manager/src/lib/twilio.ts`
  (`verifyDevBypassEnabled`/`verifyDevBypassCode`/`VERIFY_DEV_BYPASS_SID`) + wired into
  `send_phone_verification`/`check_phone_code` in `apps/manager/src/tools/identity.stub.ts`. Lets the
  **real** front-door verify path complete locally without live Twilio + a real SMS. **Fails closed in
  production** (ignored when `NODE_ENV=production`), mirroring `PROVISIONER_SKIP_SMS`. Only an attempt
  that was itself created via the bypass (`twilio_verify_sid = "dev-bypass"`) can be checked with the dev
  code — a real Twilio attempt is never bypassable.
- **Bypass bootstrap now fixture-varied** — `infra/scripts/local/bootstrap.mjs` defaults to a varied
  fixture (explicit `LOCAL_*` env still wins), so the proven no-model path stops hiding assumptions
  behind one copy-pasted business.
- **Docs/env** — RUNBOOK §6 "Two test paths"; `.env.example`/`.env.local.example` document
  `TWILIO_VERIFY_DEV_BYPASS`/`TWILIO_VERIFY_DEV_CODE` + a `TWILIO_TEST_TO_PHONE` placeholder (real values
  live only in the gitignored `.env`).

## Proof (local, deterministic)

- `npm run typecheck` — pass. `npm run lint` — clean. `npm run build` — pass (incl. Next.js web).
- `npm run test:unit` — **46 files / 263 tests** pass (was 44 / 254; +2 files, +9 tests):
  - `tests/unit/phone-verify-dev-bypass.test.ts` — send→check with dev code mints a verified phone;
    custom code honored, wrong code rejected; **fails closed in production even with the flag set**;
    no bypass when the flag is off.
  - `tests/unit/contractor-fixtures.test.ts` — trade coverage, deterministic selection, per-run-unique
    identity, real-path turns, complete bypass manifest.
- `node --check` clean on all new `.mjs`. `npm run local:fixture` prints a varied sample.

## Live gate (unchanged truth; no faked proof)

The **real-user path** end-to-end is blocked on a **funded orchestrator model key**
(`ORCHESTRATOR_API_KEY` / `XAI_API_KEY` / `OPENAI_API_KEY`) — the same blocker as the Phase 5 runtime
gate (Hermes chat/`/v1/runs`). The harness is ready to run the moment a key exists; today it stops
honestly at the conversational step. Real (non-bypass) Twilio Verify additionally needs a
`TWILIO_VERIFY_SERVICE_SID`. The **bypass path** (bootstrap → provision → Docker → `/health` +
`/v1/capabilities`) remains runnable with no model key.

## Carry-forward

Add a funded model key, then: `local:onboard` (or `06-browser-onboard`) → `local:acceptance:runtime` →
`local:chat` → capture `/v1/runs/{id}/events` transcript + external run id → mark Phase 5
`runtime-accepted`. Then Phase 7 metering instrumentation (see `phase-07-metering-instrumentation.md`).
