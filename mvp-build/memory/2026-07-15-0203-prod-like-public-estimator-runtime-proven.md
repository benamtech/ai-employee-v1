# Prod-like public estimator runtime proven

Date: 2026-07-15 02:03 ET
Status: prod-like local runtime proven; provider-accepted still pending
Scope: Production-shaped public estimator stack, scoped MCP reprovision, Caddy, Hermes runtime, and public Web session smoke.

## What changed

- Added request-scoped provisioner SMS options in `ProvisionerRequest`.
  - Default ordinary provisioning remains SMS-enabled.
  - `infra/scripts/reprovision-scoped-mcp.mjs` now sends `options.sms.enabled=false` unless explicitly overridden with `REPROVISION_SMS_ENABLED=1`.
  - This lets non-SMS employee materializations like the public estimator reprovision without Twilio.
- Improved reprovision failure proofs.
  - Provisioner failures now include `provisioner_http_status` and a redacted `provisioner_result` in proof JSON.
  - Console output stays short.
- Moved the generated `website_estimator_conversation` package into the canonical renderer path:
  - `packages/profile-packages/website_estimator_conversation/`
- Hardened production deploy/runtime seams found during the run:
  - Manager production image includes Docker CLI for runtime/Caddy operations.
  - Caddy client snippets use `/var/lib/amtech/caddy/clients`.
  - Deploy Hermes wrapper invokes the local start script with `bash`.
  - Profile rendering carries `ANTHROPIC_API_KEY` and `HERMES_DOCKER_NETWORK` into employee `.env`.
  - Scoped-MCP reprovision preserves/falls back to profile context.
  - Web production Docker image bakes/runs `MANAGER_API_ORIGIN=http://manager:8080` so Web API routes use Docker DNS instead of container-localhost.

## Current status

- `prod-like Manager/Web/Caddy`: proven healthy.
- `prod-like scoped MCP reprovision`: pass.
- `prod-like Hermes runtime`: running.
- `public /free-estimator` page and visitor session: pass.
- `provider-accepted LLM`: not claimed; no message turn/provider id captured.
- `Resend provider-accepted`: not claimed; Resend key is present but sender/reply-to env remains missing.

## Proofs

- Reprovision proof: `infra/proofs/reprovision-scoped-mcp-2026-07-15T06-03-16-243Z.json`
  - status: pass
  - employee: `emp_5omv4ihbvggc8ibe31nj43`
  - account: `acct_x7kt6lu4hjl0r9fzjj5q3b`
  - generated path: `/var/lib/amtech/hermes/profiles/client_emp_5omv4ihbvggc8ibe31nj43`
  - MCP tools: 62
  - required tools present: true
  - `MANAGER_INTERNAL_TOKEN` hits: none
- Public estimator Web smoke: `infra/proofs/public-estimator-web-smoke-2026-07-15T06-03-27-709Z.json`
  - `/free-estimator`: 200
  - session create/resume: 200
  - initial current draft: 200/null
  - visitor session: `pes_ppi21m8pc45slzpwr0p5eq`
- Stack state at proof time:
  - Manager healthy on `127.0.0.1:8080`
  - Web healthy on `127.0.0.1:3000`
  - Caddy healthy on `80/443`
  - Hermes employee running on `127.0.0.1:8748`

## Carry-forward / next

- Run `npm run prod-like:public-estimator:smoke -- --send-message` only when ready to spend an LLM call / capture the expected provider credit failure.
- Fill `PUBLIC_ESTIMATOR_FROM_EMAIL` and `PUBLIC_ESTIMATOR_REPLY_TO` before claiming any Resend send proof.
- If Twilio credentials are later added, ordinary employee provisioning can still use SMS by default; public estimator reprovision remains no-SMS unless explicitly overridden.

## Verification

- `npx vitest run tests/unit/provisioner-options.test.ts tests/unit/ops-proof-scripts.test.ts` passed.
- `npm run typecheck` passed after rebuilding `@amtech/shared`.
- `npm run prod-like:public-estimator:up -- --down-first --no-build --reprovision-employee` passed after the package-context fallback.
- `npm run prod-like:public-estimator:smoke` passed outside sandbox against the production-shaped stack.
