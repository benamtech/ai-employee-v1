# Production normal employee runbook default handoff

Date: 2026-07-16 03:35 EDT
Status: `source-wired`; launch proof `provider-gated`
Scope: Production-level normal employee onboarding/live deploy path, docs/pointers, logging, and current live state

## What changed

- Made [`docs/production-normal-employee-live-deploy-runbook.md`](../docs/production-normal-employee-live-deploy-runbook.md) the default entry point for normal employee live deploy work.
- Updated cold-start pointers in:
  - [`README.md`](../README.md)
  - [`CODEGRAPH.md`](../CODEGRAPH.md)
  - [`AGENTS.md`](../AGENTS.md)
  - [`CLAUDE.md`](../CLAUDE.md)
  - [`infra/scripts/local/test/README.md`](../infra/scripts/local/test/README.md)
  - root [`../README.md`](../../README.md)
  - root [`../CODEGRAPH.md`](../../CODEGRAPH.md)
  - wiki [`../wiki/README.md`](../../wiki/README.md)
- Added live-deploy review docs:
  - [`docs/production-normal-employee-live-deploy-runbook.md`](../docs/production-normal-employee-live-deploy-runbook.md)
  - [`docs/onboarding-live-review-2026-07-16.md`](../docs/onboarding-live-review-2026-07-16.md)
  - [`memory/2026-07-16-0320-production-vps-runbook-core-tunnel-caddy-fleet.md`](2026-07-16-0320-production-vps-runbook-core-tunnel-caddy-fleet.md)
- Improved Manager onboarding/provider diagnostics:
  - [`apps/manager/src/lib/orchestrator-model.ts`](../apps/manager/src/lib/orchestrator-model.ts) now classifies provider failures, including auth/credit/spending-limit gates.
  - [`apps/manager/src/orchestrator.ts`](../apps/manager/src/orchestrator.ts) now emits sanitized structured onboarding model logs and returns `provider_auth_or_credit_gated` for provider credit/auth blocks.
  - [`tests/unit/orchestrator-model.test.ts`](../tests/unit/orchestrator-model.test.ts) covers the provider-error classification.

## Why

The previous handoffs made it too easy for an agent to reach for local fixture/harness paths and mistake them for launch proof. The founder clarified that the target is a complete production-level normal employee run: public DNS/Cloudflare Tunnel to Caddy, real `/create-ai-employee`, real Twilio Verify, real account creation, Start Employee, live owner web client, and a provider-backed employee reply.

This handoff locks the default path and explicitly excludes:

- `local:*` browser onboarding harnesses.
- `live:*` local toolkit and `live:login`.
- `/api/dev/login`.
- fixture mode / `ONBOARD_FIXTURE`.
- `prod-like:public-estimator:*`.

## Current status

- Production-like fixed core is running and healthy:
  - `amtech-ai-employee-manager-1` on `127.0.0.1:8080`.
  - `amtech-ai-employee-web-1` on `127.0.0.1:3000`.
  - `amtech-ai-employee-caddy-1` on host `:80/:443`.
- The local named Cloudflare tunnel was intentionally stopped while debugging:
  - stopped container: `amtech-tunnel`.
  - tunnel id observed while running: `496ceef3-e2a8-49f5-9af3-c3b155534627`.
  - container id observed while running: `5df231528af6...`.
- No normal employee runtime was provisioned in this attempt:
  - no `amtech-hermes-*` containers.
  - no `account_id` / `employee_id` / owner email / onboarding proof JSON from account creation.
- Public ingress was proven before tunnel shutdown:
  - `https://agent.amtechai.com/create-ai-employee` returned HTTP 200.
  - response included Cloudflare and Caddy evidence (`server: cloudflare`, `via: 1.1 Caddy`).
- xAI/Grok blocked the onboarding model call:
  - Manager logged `model_403`.
  - `/models` against the configured xAI key returned a team credits/monthly-spending-limit message.
  - This is `provider-gated`, not Hermes/runtime/Caddy/Web outage.

## Exact commands run

Clean/down and core startup:

```bash
npm run prod-like:normal:down -- --employees
npm run prod-like:normal:up -- --down-first --require-tunnel
npm run prod-like:normal:up -- --require-tunnel
```

Proofs written:

```text
infra/proofs/prod-like-normal-down-2026-07-16T06-32-21-499Z.json
infra/proofs/prod-like-normal-up-2026-07-16T06-41-47-339Z.json
infra/proofs/prod-like-normal-up-2026-07-16T06-59-10-126Z.json
```

Manual tunnel command shape used, with token redacted:

```bash
docker run -d --name amtech-tunnel --network host --restart unless-stopped \
  cloudflare/cloudflared:latest tunnel --no-autoupdate run --token '<redacted>'
```

Public/local surface checks:

```bash
curl -I -L --max-time 30 https://agent.amtechai.com/create-ai-employee
curl -I http://127.0.0.1/create-ai-employee -H 'Host: agent.amtechai.com'
curl -sS http://127.0.0.1:8080/health
curl -I http://127.0.0.1:3000/create-ai-employee
docker logs --tail 200 amtech-ai-employee-manager-1
docker logs --tail 200 amtech-ai-employee-web-1
docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
```

Browser:

```bash
firefox --new-window https://agent.amtechai.com/create-ai-employee
```

Tunnel shutdown while fixing/debugging:

```bash
docker rm -f amtech-tunnel
```

Verification after source changes:

```bash
npm run typecheck --workspace @amtech/manager
npm run test:unit -- tests/unit/orchestrator-model.test.ts tests/unit/orchestrator-readiness.test.ts tests/unit/onboarding-compile.test.ts
```

Results:

- Manager typecheck passed.
- Focused unit tests passed: 3 files, 14 tests.

## What was source-wired

- Canonical production normal employee runbook and warnings across root/build/wiki entry points.
- VPS/containerization notes for a fixed core plus dynamic fleet of 0-30 `amtech-hermes-*` employee containers.
- Sanitized onboarding model-call logging.
- Provider auth/credit/rate/provider/bad-request classification.
- Unit coverage for provider error classification.

## What was runtime-proven

- Production-like core containers build/start/healthcheck.
- Caddy origin serves `/create-ai-employee`.
- Cloudflare named tunnel can reach local Caddy when configured with `--network host`.
- Public `agent.amtechai.com/create-ai-employee` reached the web app through Cloudflare and Caddy.
- xAI key/config path is present and reaches the provider, but the provider rejects due credit/spending-limit state.

## What remains gated

- Add xAI credit or raise the spending/monthly limit, then rebuild/restart the Manager image to get the new logging code live.
- Restart `amtech-tunnel` with the named tunnel token.
- Run the production runbook from the public browser:
  1. real chat-first onboarding,
  2. real phone verification,
  3. real account creation,
  4. Start Employee,
  5. capture `session_id`, Twilio SID/status, `account_id`, owner email, `employee_id`, `amtech-hermes-<employee_id>` container id/status, proof paths, and final provider result,
  6. send a real owner message in the live web client,
  7. mark success only after a real provider-backed employee reply appears.

## Carry-forward

If source changes must go live, do not use `--no-build`; rebuild the production-like Manager/Web image path. If only DNS/tunnel routing changes, `npm run prod-like:normal:up -- --no-build --require-tunnel` is acceptable.

Do not source the full `infra/deploy/.env.production` into a host dev stack. For launch-level proof, use the production-like Docker/Caddy path and the selective provider configuration already wired by the prod-like normal scripts.

