# Runtime bind + Hermes setup skip + Phase 6 live proof

Date: 2026-07-04 18:38 EDT

Status: source-wired; Supabase accepted; Hermes runtime endpoints proven; provider-backed run/SSE pending

Scope: local VPS-faithful no-SMS stack, Hermes sibling Docker runtime, Phase 5 runtime gate, Phase 6 proof.

## What changed

- Fixed the real Hermes API-server bind issue at the profile source: `packages/agent-template/.env.tpl`
  now renders `API_SERVER_HOST=0.0.0.0`. Hermes loads the profile `.env` with precedence over Docker
  `-e`, so fixing the profile template was the correct layer.
- Frontloaded the normal Hermes model setup choice into provisioning. `packages/agent-template/config.yaml`
  now renders `model.provider`, `model.default`, and `model.base_url`; `profile-renderer.ts` supplies
  `HERMES_MODEL_PROVIDER` / `HERMES_MODEL_DEFAULT` / `HERMES_MODEL_BASE_URL` defaults; local env examples
  and `infra/local/RUNBOOK.md` document the required provider key.
- `infra/scripts/local/start-hermes-container.sh` now passes host provider-key env vars through to the
  sibling container without writing them into the rendered profile.
- `hermes-client.ts` now pins the live Hermes run-events contract: capabilities advertise
  `run_events_sse`, `tool_progress_events`, `approval_events`, and `endpoints.run_events`; JSON `event`
  names include `message.delta`, `tool.started`, `tool.completed`, `reasoning.available`,
  `approval.request`, `run.completed`, `run.failed`, and `run.cancelled`.
- Reconciled docs: Phase 5/6 status in the phase index, the Phase 6 doc, implementation records, and
  `CODEGRAPH.md`.

## Why

The first live test was useful because it returned a real Hermes error. After the bind fix, `local:chat`
reached Hermes but failed with: "No inference provider configured. Run 'hermes model'..." That was not an
LLM failure; it proved provisioning skipped an essential first-run Hermes setup step. Provisioning now
renders that setup choice for every employee so local testing matches the product reality.

## Current status

- Fresh employee `emp_vhz8kw3bhvh67zu292ukgl` proved the sibling Docker runtime path:
  `/health` returned 200 with `status:"ok"`, `platform:"hermes-agent"`, `version:"0.18.0"`;
  `/v1/capabilities` returned 200 and advertised the runs/events/approval features.
- The fresh profile inside the container rendered:
  `model.provider: custom`, `model.default: gpt-4.1`, `model.base_url: https://api.openai.com/v1`, and
  `API_SERVER_HOST=0.0.0.0`.
- `local:chat` no longer asks for `hermes model`; it reaches the OpenAI-compatible provider and fails with
  provider auth because the current local env has no funded provider key. Therefore the Phase 5 runtime
  gate is still pending: no valid `/v1/runs/{id}/events` transcript or external runtime run id exists yet.
- Phase 6 is now formally live-proven against Supabase: RLS + turn-claim `run_id` integration tests passed.

## Files / seams touched

- `packages/agent-template/.env.tpl`
- `packages/agent-template/config.yaml`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/hermes-client.ts`
- `apps/manager/src/lib/work-verbs.ts`
- `infra/scripts/local/start-hermes-container.sh`
- `.env.example`, `.env.local.example`, `infra/local/RUNBOOK.md`
- `tests/unit/hermes-stream.test.ts`
- `wiki/MVP/build-plan-current/phases/README.md`
- `wiki/MVP/build-plan-current/phases/phase-06-metering-foundation.md`
- `wiki/MVP/implementation-records/2026-07-03-phase-04-hardening-and-phase-06-record.md`
- `wiki/MVP/implementation-records/2026-07-04-phase-05-record.md`
- `CODEGRAPH.md`

## Carry-forward / next

1. Add a real funded provider key to local env (`OPENAI_API_KEY`, `OPENROUTER_API_KEY`, or equivalent
   matching `HERMES_MODEL_*`).
2. Restart Manager, bootstrap a fresh employee, then run `local:acceptance:runtime` and `local:chat`.
3. Capture a successful `/v1/runs/{id}/events` SSE transcript and the external runtime run id before
   marking Phase 5 `runtime-accepted`.
4. Then rerun the Work Surface browser flow, MCP-UI approval intent, batching digest, and scheduler tick.

## Verification

- `set -a && source .env && set +a && npm run local:acceptance:runtime` — pass for
  `emp_vhz8kw3bhvh67zu292ukgl`: endpoint row, no-SMS, container, `/health`, `/v1/capabilities`.
- `set -a && source .env && set +a && npm run local:chat -- "Before pricing anything, tell me what setup step you still need."`
  — reached Hermes/provider; failed honestly with OpenAI-compatible provider auth, not the Hermes setup wizard.
- Live endpoint capture:
  `/health` 200 `{"status":"ok","platform":"hermes-agent","version":"0.18.0"}`;
  `/v1/capabilities` 200 with `run_events_sse`, `tool_progress_events`, `approval_events`, and
  `endpoints.run_events`.
- `npm run test:unit -- tests/unit/hermes-stream.test.ts` — 1 file / 6 tests pass.
- `set -a && source .env && set +a && npm run test:integration -- tests/integration/new-tables-rls.integration.test.ts tests/integration/turn-claim.integration.test.ts`
  — live Supabase pass, 2 files / 5 tests.
