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

## 6. Two test paths: BYPASS vs REAL-USER

Both drive the real Manager/provisioner/Hermes path; they differ only in how onboarding is entered.
Test data is **varied per run** by `infra/scripts/local/contractor-fixtures.mjs` (painter, landscaper,
carpenter, deck/fence, pressure-washing) so onboarding/provisioning assumptions can't hide behind one
copy-pasted business. Pin a fixture with `ONBOARD_FIXTURE=<kind|index>`; preview one with
`npm run local:fixture`.

**BYPASS path (no model key, no SMS — runnable today).** Manifest built in-script, phone inserted via the
service role. This is the current live-proof path (`/health` + `/v1/capabilities`).

```bash
set -a && source .env && set +a
npm run local:bootstrap                     # varied fixture unless LOCAL_* env is set
npm run local:acceptance:runtime            # /health + /v1/capabilities for the provisioned employee
npm run local:acceptance:browser            # Work Surface chat via an owner-session cookie
```

**REAL-USER path (drives the true front door).** Exercises the exact endpoints the
`/create-ai-employee` page calls: conversation → phone verify → account → provision. Phone verification
uses the **gated dev bypass** (`TWILIO_VERIFY_DEV_BYPASS=1`, dev code `TWILIO_VERIFY_DEV_CODE`, default
`000000`) so no real SMS is sent; it fails closed when `NODE_ENV=production`.

```bash
set -a && source .env && set +a            # needs TWILIO_VERIFY_DEV_BYPASS=1
npm run local:onboard                        # API-level real front door (fixture-driven)
npm run local:acceptance:browser-onboard     # Playwright drives the real /create-ai-employee form
```

Gate: the conversational first step needs a **funded orchestrator model key**
(`ORCHESTRATOR_API_KEY` / `XAI_API_KEY` / `OPENAI_API_KEY`). Without it, `local:onboard` stops honestly at
step 1 with the exact remediation — the same funded-key blocker as the Phase 5 runtime gate. Use the
BYPASS path for no-model core/runtime testing.

Real (non-bypass) Twilio Verify additionally needs a `TWILIO_VERIFY_SERVICE_SID` (a `VA...` Verify
Service) and, on a trial account, the recipient number verified as a caller ID.
