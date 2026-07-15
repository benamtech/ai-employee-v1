# Prod-like public estimator compose brief

Date: 2026-07-15 00:15 ET
Status: local/prod-compose partial proof; not provider-accepted
Scope: Production-shaped Manager/Web/Caddy compose run for the public estimator employee, using the real Anthropic env key but no live LLM credit proof.

## What changed

- Brought up the production compose stack from `infra/deploy/docker-compose.yml` using `infra/deploy/.env.production`.
- Filled production env gates for the public estimator employee:
  - `PUBLIC_ESTIMATOR_EMPLOYEE_ID=emp_5omv4ihbvggc8ibe31nj43`
  - `PUBLIC_ESTIMATOR_ACCOUNT_ID=acct_x7kt6lu4hjl0r9fzjj5q3b`
  - `PUBLIC_WEB_ORIGIN=http://localhost:3000`
  - `HERMES_DOCKER_NETWORK=amtech_runtime`
- Copied the existing real Anthropic/model env values from `.env` into `infra/deploy/.env.production` without using the local model bridge. `LOCAL_MODEL_BRIDGE` stayed unset.
- Built and started production images for Manager and Web. Both containers became healthy.
- Confirmed:
  - Manager health: `http://127.0.0.1:8080/health` -> `200`, `tools=65`
  - Web route: `http://127.0.0.1:3000/free-estimator` -> `200`
- Confirmed the target estimator employee exists in hosted DB:
  - employee: `emp_5omv4ihbvggc8ibe31nj43`
  - account: `acct_x7kt6lu4hjl0r9fzjj5q3b`
  - status: `live`
  - endpoint port: `8748`
  - profile path: `/home/georgej/.hermes/profiles/client_emp_5omv4ihbvggc8ibe31nj43`
- Found an existing employee runtime container:
  - `amtech-hermes-emp_5omv4ihbvggc8ibe31nj43`
  - state: exited from an older run

## Why

The goal was to run the public estimator as close to production as possible: production Manager/Web images, hosted Supabase, real provisioned estimator employee, Dockerized Hermes runtime, and the real Anthropic env key. The only expected product-path blocker is provider LLM credit/acceptance, not Hermes availability.

## Current status

- `source-wired`: yes, from the earlier public estimator implementation and green local test suite.
- `prod-compose Manager/Web`: locally proven.
- `Caddy HTTPS/public ingress`: pending Cloudflare DNS API token and DNS setup.
- `Hermes employee runtime`: not reproven in this pass. Existing container was present but exited, and the rendered profile was stale.
- `provider-accepted`: no. No real Anthropic completion/provider id was captured.
- `Resend provider-accepted`: no. No real Resend message id was captured.

## What failed / what it means

- `npm run deploy:smoke` wrote `infra/proofs/deploy-smoke-2026-07-15T04-08-35-004Z.json`.
- Smoke result:
  - pass: Manager health
  - pass: Web
  - fail: Caddy
  - pass: compose Manager healthy
  - pass: compose Web healthy
  - fail: compose Caddy
  - skip: employee DNS alias
- Caddy logs showed the concrete blocker:
  - `CLOUDFLARE_API_TOKEN` was empty.
  - `infra/caddy/production.Caddyfile` uses `dns cloudflare {env.CLOUDFLARE_API_TOKEN}` for `*.agents.amtechai.com`.
  - Until Cloudflare DNS/token exists, production Caddy cannot validate/start the wildcard TLS automation policy.
- Reprovision attempt wrote `infra/proofs/reprovision-scoped-mcp-2026-07-15T04-11-54-444Z.json` with `fetch failed`.
  - The invocation sourced `infra/deploy/.env.production` directly.
  - That file is valid as a Compose env file, but not shell-safe because values like `CADDY_VALIDATE_COMMAND=caddy validate ...` contain spaces.
  - It also contains container-network origins like `PROVISIONER_ORIGIN=http://manager:8080`, which work inside Docker but not from the host shell.

## Script notes for next time

Build a dedicated prod-like setup script instead of hand-running the steps.

The script should:

1. Load `.env` and `infra/deploy/.env.production` with a dotenv parser, not `source`.
2. Merge only the required operational keys into `.env.production`, without printing secrets.
3. Keep host origins and container origins separate:
   - host smoke/reprovision: `http://127.0.0.1:8080`
   - container-to-Manager: `http://manager:8080`
4. Ensure `docker network create amtech_runtime` is idempotent.
5. Run `docker compose -f infra/deploy/docker-compose.yml --env-file infra/deploy/.env.production up -d --build`.
6. Run Manager/Web health checks even if Caddy is gated by missing Cloudflare DNS.
7. If `CLOUDFLARE_API_TOKEN` is absent, mark Caddy as `dns-token-gated` instead of a generic deploy failure.
8. Reprovision/start the employee with host-safe overrides:
   - `PROVISIONER_ORIGIN=http://127.0.0.1:8080`
   - `MANAGER_API_ORIGIN=http://127.0.0.1:8080`
   - rendered employee container env still needs `DOCKER_MANAGER_API_ORIGIN=http://manager:8080`
9. Verify the rendered employee profile has:
   - scoped MCP token
   - `HERMES_DOCKER_NETWORK=amtech_runtime`
   - real Anthropic/model env
   - no `LOCAL_MODEL_BRIDGE`
10. Start/check `amtech-hermes-emp_5omv4ihbvggc8ibe31nj43`.
11. Exercise `POST /api/public-estimator/session` and `POST /api/public-estimator/message` through Web with a cookie jar.
12. Record proof ids separately:
   - compose proof
   - employee container id
   - public estimator visitor session id
   - Hermes run/session id if reached
   - provider error/id if Anthropic accepts or rejects the request

## Files / seams touched

- `infra/deploy/docker-compose.yml`
- `infra/deploy/.env.production` (gitignored/secret-bearing operational env)
- `infra/caddy/production.Caddyfile`
- `infra/scripts/deploy-smoke.mjs`
- `infra/scripts/reprovision-scoped-mcp.mjs`
- `infra/scripts/deploy/start-hermes-container.sh`
- `infra/scripts/local/start-hermes-container.sh`
- `apps/manager/src/public-estimator.ts`
- `apps/manager/src/lib/public-estimator-runtime.ts`
- `apps/web/app/free-estimator/page.tsx`
- `apps/web/app/api/public-estimator/*`

## Carry-forward / next

- Create a script such as `infra/scripts/prod-like-public-estimator-up.mjs` that performs the setup above and writes one proof JSON.
- Add a companion smoke script for the public estimator Web API path with cookie persistence.
- Once Cloudflare is ready, add `CLOUDFLARE_API_TOKEN` and rerun Caddy validation/public ingress.
- Once Anthropic has live credits, rerun the message path and capture the provider proof id. Until then, a provider credit failure is expected and should be recorded as provider rejection, not Hermes unavailability.

## Verification

- `docker compose -f infra/deploy/docker-compose.yml --env-file infra/deploy/.env.production up -d --build`
  - Manager image built and container healthy.
  - Web image built and container healthy.
  - Caddy restarted because Cloudflare DNS token was absent.
- `curl -i http://127.0.0.1:8080/health`
  - `200`, Manager reported 65 registered tools.
- `curl -I http://127.0.0.1:3000/free-estimator`
  - `200`.
- `npm run deploy:smoke`
  - partial failure only because Caddy/Cloudflare DNS was not configured.
