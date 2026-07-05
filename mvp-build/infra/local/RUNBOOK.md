# Local VPS-Faithful No-SMS Runbook

Status: active

This runbook exercises the real Manager/provisioner/Hermes profile path locally while Twilio SMS is deliberately skipped. It uses live Supabase, local Manager/Web, Caddy config generation, and one Dockerized Hermes gateway/API-server container per provisioned employee. It does not create Twilio/Gmail/Stripe provider acceptance proof.

## 1. Host prerequisites

Run from a shell where `id -nG` includes `docker`:

```bash
cd /home/georgej/AMTECH/GTM-RESEARCH/mvp-build
cp .env.local.example .env
set -a && source .env && set +a
npm run local:check
npm run local:build-hermes
npm run local:browser-install
```

Fill these two values in `.env` before migrations/bootstrap:

- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` — use the Supabase **shared pooler** URI, not the direct `db.<ref>.supabase.co` URI, when on an IPv4-only local network.

Also choose the provisioned employee's Hermes model/provider before `local:bootstrap`:

- `HERMES_MODEL_PROVIDER`
- `HERMES_MODEL_DEFAULT`
- `HERMES_MODEL_BASE_URL` when using `custom`
- the matching provider key such as `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, or `ANTHROPIC_API_KEY`

Provisioning renders these choices into each Hermes profile so the employee skips the normal terminal
`hermes model` setup wizard. If no provider key is available, runtime `/health` and `/v1/capabilities`
can still pass, but chat/run proof will fail honestly before `runtime-accepted`.

The Supabase project is `amtech-ai-employee-mvp` at `https://uxuruijrgghshfwnaagb.supabase.co`.

Optional: open `mvp-build/` in the devcontainer. It uses Docker-outside-of-Docker, so the development
workspace is reproducible while provisioned employees still run as sibling Docker containers on the host
daemon. That is the preferred local parity shape. Docker-in-Docker is reserved for CI-style isolation where
host port/Caddy parity matters less.

## 2. Database

```bash
npm run db:migrate
npm run db:status
```

## 3. Start local services

Use separate shells:

```bash
set -a && source .env && set +a
npm run manager:dev
```

```bash
set -a && source .env && set +a
npm run web:dev
```

Optional Caddy proxy:

```bash
caddy run --config infra/caddy/local.Caddyfile
```

## 4. Provision and chat

```bash
set -a && source .env && set +a
npm run local:bootstrap
npm run local:chat -- "Can you help price a small interior repaint?"
```

Bootstrap writes `infra/.local/state.json` with the account id, employee id, owner session token, and web route.

Provisioning should also start a container named `amtech-hermes-<employee_id>` and expose its API server on the generated gateway port recorded in `runtime_endpoints.gateway_port`.

## 5. Acceptance vocabulary

- This proves local source/runtime wiring with live Supabase and a real Dockerized Hermes runtime.
- `PROVISIONER_SKIP_SMS=1` skips only Twilio webhook assignment and first outbound SMS. It fails closed in production.
- Runtime acceptance still requires captured Hermes API Server health/capabilities/run proof ids.
- Provider acceptance still requires real Supabase/Twilio/Gmail/PubSub/Stripe proof ids.
