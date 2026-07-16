# 2026-07-16 07:19 — Provisioner Twilio webhook + API tunnel fix

Status: fixed in source, pushed, rebuilt, public API ingress proven

## Trigger

Live public onboarding `Start Employee` failed at:

- `account_id`: `acct_5fu75j5zxfq47zrpzr8cwq`
- `employee_id`: `emp_wpnm7rgf7jvpkpsqj8ognr`
- `provisioning_job_id`: `pjob_6709kp7ltzhmtploap6doj`
- `audit_id`: `aud_75cqvdrikk4h2zmz3n7boh`

The public API response was `provider_error` / `provisioner_failed`.

## Findings

This was not a public owner-web outage:

- `agent.amtechai.com/create-ai-employee` returned HTTP/2 200 through Cloudflare and Caddy.
- Manager `/health` returned `{"status":"ok","tools":65,"expected":65}`.
- Caddy local owner route returned 200.
- Tunnel logs showed DNS, UDP, TCP, and Cloudflare API prechecks passing.

The failed provisioning job logs showed the real provider failure:

```text
Twilio 400: Invalid URL provided for SmsUrl: http://manager:8080/webhooks/twilio/emp_wpnm7rgf7jvpkpsqj8ognr
```

Root cause: `provision_employee` built the Twilio webhook URL from `MANAGER_API_ORIGIN`. In the production-like Docker stack that origin must stay internal (`http://manager:8080`) for service-to-service traffic, but Twilio needs a public URL.

Second ingress issue found during verification: `SMS_WEBHOOK_BASE_URL` was `https://api.amtechai.com/webhooks/twilio`, but `api.amtechai.com` initially did not resolve, then returned Cloudflare tunnel 404 after adding DNS because the named tunnel remote ingress config only included `agent.amtechai.com`.

## Fixes

Committed and pushed:

- `40a7611` — `Use public Twilio webhook base for provisioning`

Source changes:

- `apps/manager/src/tools/provisioning.stub.ts` now builds provider webhook URLs from `SMS_WEBHOOK_BASE_URL` first, falling back to `MANAGER_API_ORIGIN` only when no public webhook base is configured.
- `infra/scripts/reprovision-scoped-mcp.mjs` uses the same public webhook base fallback.
- `tests/unit/provisioning-runtime-backend.test.ts` covers the exact production-like split: `MANAGER_API_ORIGIN=http://manager:8080` and `SMS_WEBHOOK_BASE_URL=https://api.amtechai.com/webhooks/twilio/`.

Cloudflare/tunnel changes applied live:

- Added `api.amtechai.com` DNS route to named tunnel `amtech-tunnel` / tunnel ID `496ceef3-e2a8-49f5-9af3-c3b155534627`.
- Updated remote tunnel ingress config to:
  - `agent.amtechai.com -> http://localhost:80`
  - `api.amtechai.com -> http://localhost:80`
  - fallback `http_status:404`
- Running connector logged config version 2 with both hostnames.

Operational docs/proof changes:

- `infra/scripts/prod-like-normal-employee-up.mjs` now checks:
  - local Caddy owner vhost
  - local Caddy API vhost
  - public `agent.amtechai.com/create-ai-employee`
  - public `api.amtechai.com/health`
- The script uses `curl --resolve` for local Caddy vhost checks and treats only HTTP 2xx/3xx as pass.
- `docs/production-normal-employee-live-deploy-runbook.md` documents the two-host tunnel requirement and the Cloudflare-404 vs Caddy-route distinction.
- `docs/production-normal-employee-scenario-verification.md` now shows the Twilio provider callback path through `api.amtechai.com`.

## Verification

Local tests:

```bash
npm run test:unit -- tests/unit/provisioning-runtime-backend.test.ts
npm run typecheck --workspace @amtech/manager
npm run test:unit -- tests/unit/provisioning-runtime-backend.test.ts tests/unit/profile-context.test.ts tests/unit/fake-supabase.test.ts tests/unit/create-account-error.test.ts tests/unit/onboarding-compile.test.ts tests/unit/twilio-status.test.ts
```

All passed.

Stack rebuilt from committed source:

```bash
npm run prod-like:normal:up -- --down-first --require-tunnel
```

Post-fix proof:

```bash
npm run prod-like:normal:up -- --no-build --require-tunnel
```

Latest clean proof:

- `infra/proofs/prod-like-normal-up-2026-07-16T11-18-56-364Z.json`

Important proof values:

- `manager_health`: HTTP 200
- `web_health`: HTTP 200
- `caddy_agent_route`: HTTP 200
- `caddy_api_route`: HTTP 200
- `cloudflare_named_tunnel`: pass, public hosts `https://agent.amtechai.com`, `https://api.amtechai.com`
- `public_agent_route`: HTTP 200
- `public_api_health`: HTTP 200

Manual public checks also passed:

```bash
curl -sS https://api.amtechai.com/health
curl -I -L https://agent.amtechai.com/create-ai-employee
```

## Next

Retry `Start Employee` from the same public onboarding session or repeat public onboarding. The previous failed idempotency key should retry into a fresh provisioning job because the earlier provisioning recovery commit supports failed-job retries.
