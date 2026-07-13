# Live Anthropic normal onboarding handoff

Date: 2026-07-12 11:09 EDT
Status: merged to `main`; live proof still pending
Scope: prepared the next session to run a normal AMTECH business-owner onboarding proof with a real Anthropic model, not the local model bridge.

## What changed

- PR #7 merged to `main` as merge commit `a7214198037c8adac7346cd7a7ab0fb174c42c19`.
- Commit included live-provider plumbing for normal onboarding:
  - `apps/manager/src/lib/orchestrator-model.ts` now supports `ORCHESTRATOR_PROVIDER=anthropic` via Anthropic Messages API.
  - `apps/manager/src/lib/profile-renderer.ts` renders `HERMES_MODEL_PROVIDER=anthropic` / `HERMES_MODEL_DEFAULT=claude-haiku-4-5-20251001` without bridge `base_url`, and passes `ANTHROPIC_API_KEY` into rendered employee `.env`.
  - `packages/agent-template/.env.tpl` has `ANTHROPIC_API_KEY={{ANTHROPIC_API_KEY}}`.
  - `infra/scripts/local/test/stack-up.sh` preserves live provider env by default; the old bridge only starts when `LOCAL_MODEL_BRIDGE=1`.
- Added deterministic normal-contractor fixture `ONBOARD_FIXTURE=binghamton_painting`:
  - business: Southern Tier Precision Painting
  - location: Binghamton, NY
  - owner: Nate Barone
  - employee: Avery
  - work: estimate write-ups, quote follow-up, bookkeeping/job-admin reminders.
- Added handoff prompt:
  - `second-half-plan/live-anthropic-binghamton-onboarding-handoff-prompt.md`

## Secret handling

- The live Anthropic API key is only in gitignored `mvp-build/.env`; it was not committed.
- Non-secret `.env` settings expected for the next run:
  - `ORCHESTRATOR_PROVIDER=anthropic`
  - `ORCHESTRATOR_API_BASE_URL=https://api.anthropic.com/v1`
  - `ORCHESTRATOR_MODEL=claude-haiku-4-5-20251001`
  - `ORCHESTRATOR_RESPONSE_FORMAT=none`
  - `HERMES_MODEL_PROVIDER=anthropic`
  - `HERMES_MODEL_DEFAULT=claude-haiku-4-5-20251001`

## Verification before merge

- `npm run typecheck`
- `npm run test:unit -- tests/unit/orchestrator-model.test.ts tests/unit/runtime-backend.test.ts tests/unit/profile-generator-harness.test.ts tests/unit/connector-registry.test.ts tests/unit/ce4-operator-policy.test.ts tests/unit/employee-stream.test.ts tests/unit/materialization.test.ts`
- `bash -n infra/scripts/local/test/_lib.sh infra/scripts/local/test/stack-up.sh infra/scripts/local/test/status.sh`

## Next proof

Run the next session from a clean local stack:

```bash
cd /home/georgej/AMTECH/GTM-RESEARCH/mvp-build
set -a
source .env
set +a
npm run live:down -- --employees
npm run live:up
npm run live:status
ONBOARD_FIXTURE=binghamton_painting npm run local:onboard
npm run live:status
npm run local:acceptance:runtime
npm run live:login -- <employee_id>
```

Do not count the local model bridge as proof. The valid target proof is normal front-door onboarding -> account/session -> provisioned Docker Hermes employee -> headed Work Surface chat response from live Anthropic-backed Hermes.

Keep the website-estimator/profile-generator work as a separate research thread; do not use it as the proof target for this normal contractor onboarding test.
