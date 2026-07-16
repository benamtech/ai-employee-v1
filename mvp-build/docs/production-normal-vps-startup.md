# Production Normal Startup

Status: active operator entrypoint

This is the normal AI employee startup path for both local production-like runs and the first live VPS target.

## One Command From This Folder

From `mvp-build`:

```bash
npm run prod:up
```

Default target: `local-tunnel`.

This is the closest local shape to production:

```text
Cloudflare named tunnel
  -> local Caddy origin
  -> production Web + Manager containers
  -> Docker-launched amtech-hermes-<employee_id> runtimes
```

It wraps:

- `infra/scripts/production-normal-up.mjs`
- `infra/scripts/prod-like-normal-employee-up.mjs`
- `infra/deploy/docker-compose.yml`
- `infra/deploy/docker-compose.tunnel.yml`
- `infra/caddy/tunnel.Caddyfile`

It writes proof JSON under `infra/proofs/production-normal-up-local-tunnel-*.json` and the delegated prod-like proof under `infra/proofs/prod-like-normal-up-*.json`.

## Live VPS Command

On the production VPS, target shape is 8 cores / 64 GB RAM:

```bash
npm run prod:vps:normal:up
```

Equivalent explicit form:

```bash
node infra/scripts/production-normal-up.mjs --target=vps
```

VPS shape:

```text
public DNS
  -> VPS Caddy production origin on :80/:443
  -> production Web + Manager containers
  -> Docker-launched amtech-hermes-<employee_id> runtimes
```

It uses:

- `infra/deploy/docker-compose.yml`
- `infra/caddy/production.Caddyfile`
- `infra/deploy/.env.production`
- Docker network `amtech_runtime`
- host paths under `/var/lib/amtech`

The script checks host capacity and warns if the machine is below 8 cores or 60 GB visible RAM.

## Required Before VPS Run

- DNS for `agent.amtechai.com` and `api.amtechai.com` points to the VPS.
- Ports `80` and `443` are open.
- Docker is installed and the operator can run Docker commands.
- `infra/deploy/.env.production` contains real production secrets:
  - Supabase URL/service role/database URL.
  - `SIGNING_SECRET`, `MANAGER_INTERNAL_TOKEN`, `PROVISIONER_TOKEN`, `SECRET_REF_MASTER_KEY`.
  - Twilio account/Verify/number values.
  - xAI key and model (`grok-4.3`).
  - Cloudflare API token for Caddy wildcard DNS-01 if wildcard employee domains are used.

## What This Does Not Prove

Startup proof is not launch proof. Launch proof still requires:

- real `/create-ai-employee` onboarding;
- real Twilio Verify;
- real account creation;
- Start Employee;
- provisioned `amtech-hermes-<employee_id>` container;
- owner web client message;
- provider-backed employee reply.

Use `docs/production-normal-employee-live-deploy-runbook.md` for the full acceptance path.

