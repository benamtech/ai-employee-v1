# Prod-like estimator scripts

Date: 2026-07-15 00:35 ET
Status: source-wired ops scripts; Cloudflare DNS still gated
Scope: Repeatable production-shaped public estimator deploy/smoke/down scripts.

## What changed

- Added `infra/scripts/prod-like-public-estimator-up.mjs`.
  - Prepares `infra/deploy/.env.production` from `.env` using a dotenv parser, not shell `source`.
  - Sets the public estimator employee/account ids, `PUBLIC_WEB_ORIGIN`, Docker runtime network, and container-internal Manager origins.
  - Removes `LOCAL_MODEL_BRIDGE` from the deploy env.
  - Runs production Compose unless `--skip-compose` is passed.
  - Stops Caddy after startup when `CLOUDFLARE_API_TOKEN` is absent so the host is not left with a restart loop.
  - Writes `prod_like_public_estimator_up` proof JSON.
  - Keeps employee reprovision opt-in with `--reprovision-employee` because it rotates scoped MCP credentials, activates Caddy, restarts Hermes, and may touch production providers.
- Added `infra/scripts/public-estimator-smoke.mjs`.
  - Exercises the public `/free-estimator` page and `/api/public-estimator/session` path through Web with cookie persistence.
  - Sends a message only with `--send-message`, so routine smoke does not burn LLM/provider calls.
  - Writes `public_estimator_web_smoke` proof JSON and keeps provider acceptance separate.
- Added `infra/scripts/prod-like-down.mjs`.
  - Runs production Compose down and writes `prod_like_down` proof JSON.
  - Optional `--employee` also removes `amtech-hermes-$PUBLIC_ESTIMATOR_EMPLOYEE_ID`.
- Added package aliases:
  - `npm run prod-like:public-estimator:up`
  - `npm run prod-like:public-estimator:smoke`
  - `npm run prod-like:down`
- Updated `infra/deploy/README.md` with the new workflow and Cloudflare/provider boundaries.

## Why

The public estimator proof needs to be repeatable without an AI agent burning tokens to remember ad hoc commands. The scripts preserve the real production shape while making known local gates explicit: Cloudflare DNS/TLS is a production credential gate, and Anthropic credit/provider acceptance is a provider gate.

## Current status

- `source-wired`: yes for the scripts.
- `prod-compose`: scriptable, with Manager/Web health when Compose is run.
- `Caddy`: still gated until `CLOUDFLARE_API_TOKEN` exists.
- `Hermes reprovision`: scriptable but opt-in and gated by Caddy token.
- `provider-accepted`: not claimed.

## Files / seams touched

- `infra/scripts/prod-like-public-estimator-up.mjs`
- `infra/scripts/public-estimator-smoke.mjs`
- `infra/scripts/prod-like-down.mjs`
- `infra/deploy/README.md`
- `package.json`

## Carry-forward / next

- After Cloudflare DNS setup, rerun:
  - `npm run prod-like:public-estimator:up -- --down-first --reprovision-employee`
  - `npm run prod-like:public-estimator:smoke -- --send-message`
- If the Anthropic key rejects for credits, record that as provider rejection, not Hermes unavailability.
- If a real provider id is returned, add it to the proof record before claiming provider-accepted.

## Verification

- `node --check infra/scripts/prod-like-public-estimator-up.mjs` passed.
- `node --check infra/scripts/prod-like-down.mjs` passed.
- `node --check infra/scripts/public-estimator-smoke.mjs` passed.
- `npm run prod-like:down` passed and wrote `infra/proofs/prod-like-down-2026-07-15T04-34-25-613Z.json`.
- `npm run prod-like:public-estimator:up -- --skip-compose` passed and wrote `infra/proofs/prod-like-public-estimator-up-2026-07-15T04-35-10-632Z.json`; status is `partial` only because `CLOUDFLARE_API_TOKEN` is missing.
