# Production-level normal employee launch runbook

Status: launch runbook note while full proof is in progress

## 2026-07-16 02:41 ET attempt status

Commands run:

```bash
npm run prod-like:normal:down -- --employees
docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
npm run prod-like:normal:up -- --down-first --require-tunnel
```

Result:

- Production-like Docker core built and started.
- Manager is healthy on `127.0.0.1:8080`.
- Web is healthy on `127.0.0.1:3000`.
- Caddy is healthy on host `:80/:443` and validates `infra/caddy/tunnel.Caddyfile`.
- Proof JSON: `infra/proofs/prod-like-normal-up-2026-07-16T06-41-47-339Z.json`.
- Public Cloudflare ingress is still gated:
  - `CLOUDFLARE_TUNNEL_TOKEN` is missing.
  - Existing `CLOUDFLARE_API_TOKEN` verification returned `Invalid API Token`.

Current running containers after the attempt:

```text
amtech-ai-employee-caddy-1    Up, healthy, host :80/:443
amtech-ai-employee-web-1      Up, healthy, 127.0.0.1:3000
amtech-ai-employee-manager-1  Up, healthy, 127.0.0.1:8080
```

Do not continue to call this launch-ready until a valid named Cloudflare Tunnel token is installed and `npm run prod-like:normal:up -- --require-tunnel` records `cloudflare_named_tunnel: pass`.

## Correct target

For a real launch-level normal employee proof, do **not** use the local fixture/onboarding harness as the success path.

The intended path is:

```text
Cloudflare named tunnel / public DNS
  -> agent.amtechai.com
  -> local Caddy origin
  -> Web / Manager production-like Docker core
  -> real /create-ai-employee browser flow
  -> real Twilio phone verification
  -> real account creation
  -> Start Employee
  -> new amtech-hermes-<employee_id> container
  -> live owner web client
  -> real provider-backed employee reply
```

## What not to count

- Do not count `prod-like:public-estimator:*`; that is the public estimator path, not a new normal employee.
- Do not count `local:acceptance:browser-onboard` or `ONBOARD_FIXTURE` as the launch proof; those are harnesses.
- Do not use `live:login` or `/api/dev/login` for production-level proof; production mode requires the real owner cookie/session created by onboarding/account creation.
- Do not source the full production env into the host dev stack. If using the host live toolkit later, keep the host invariants and only selectively overlay provider env.

## Production-like setup

Use the normal employee production-like stack:

```bash
npm run prod-like:normal:down -- --employees
docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
npm run prod-like:normal:up -- --down-first --require-tunnel
```

`--require-tunnel` is important: it prevents a run from silently skipping Cloudflare. Previous proof runs used `--skip-tunnel`, which proved Docker/Caddy locally but not public ingress.

The public ingress should be a named Cloudflare Tunnel for the local-PC launch path:

```text
agent.amtechai.com -> http://127.0.0.1:80
```

This keeps Caddy in the routing path. Cloudflare terminates public HTTPS, forwards HTTP to local Caddy, and Caddy routes `agent.amtechai.com` to Web through `infra/caddy/tunnel.Caddyfile`.

Direct A-record DNS is a different VPS/static-IP path and needs `AMTECH_PUBLIC_IPV4`; it is not the current local-PC launch path.

## Browser flow

Open:

```text
https://agent.amtechai.com/create-ai-employee
```

Then manually complete the real product flow in headed Chromium:

- chat-first onboarding for a painting/remodeling contractor;
- employee name `Jordan`;
- real phone number and real Twilio SMS code in secure inline controls;
- real owner email/password in secure inline account controls;
- click Start Employee;
- continue into the owner web client and talk to the employee live.

## Proof to record

After the run, record:

- exact commands;
- production stack proof JSON path;
- Cloudflare tunnel container id/status;
- Caddy route/config proof;
- `session_id`;
- Twilio Verify SID/status, with no `dev_bypass`;
- `account_id`;
- `employee_id`;
- owner email;
- `amtech-hermes-<employee_id>` container id/status;
- whether the owner web client received a real xAI/Grok-backed reply.

If xAI auth/credit blocks the final reply, record it as `provider-gated`, not as a Hermes/runtime outage.
