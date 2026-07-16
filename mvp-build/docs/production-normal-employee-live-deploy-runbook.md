# Production Normal Employee Live Deploy Runbook

Status: active runbook for first launch-level normal employee proof

This runbook is for a launch-level proof of the normal AMTECH AI Employee path:

```text
public DNS / Cloudflare
  -> Caddy origin
  -> Web + Manager production containers
  -> real /create-ai-employee onboarding
  -> real phone verification
  -> real account creation
  -> provisioned amtech-hermes-<employee_id> runtime
  -> live owner web client
  -> provider-backed employee reply
```

It is not the public estimator path and not the local fixture path.

## Current production topology

The system is a fixed core plus a dynamic employee fleet.

Fixed core:

- `manager`: Hono control plane on `127.0.0.1:8080`, mounted Docker socket, launches employees.
- `web`: Next.js app on `127.0.0.1:3000`, serves front door and owner Work Surface.
- `caddy`: public origin router on host `:80/:443`.
- `amtech_runtime`: external Docker network shared by the fixed core and every employee runtime.

Dynamic fleet:

- Employees are not Compose services.
- Each employee runs as `amtech-hermes-<employee_id>`.
- Manager/provisioner renders the profile, scoped MCP credential, runtime env, and Caddy routing, then starts the container.
- First VPS target is 0-30 employees. Treat this as one pod, not a distributed system.

## Local production-like vs VPS

The local production-like run and the first VPS run should be nearly identical if containerization is correct.

Same in both:

- Same Compose core: `infra/deploy/docker-compose.yml`.
- Same external network: `amtech_runtime`.
- Same employee launcher: `infra/scripts/deploy/start-hermes-container.sh` delegates to `infra/scripts/local/start-hermes-container.sh`.
- Same dynamic employee container names and labels.
- Same Caddy role as origin router.
- Same `/create-ai-employee` flow and Manager onboarding/provisioning endpoints.
- Same proof vocabulary: core healthy, ingress proven, onboarding proven, provider-backed reply proven.

Different on local production-like:

- Cloudflare Tunnel is the public ingress because the local machine has no reliable inbound public IP.
- Caddy uses `infra/caddy/tunnel.Caddyfile`.
- Cloudflare terminates HTTPS and forwards HTTP to local Caddy.
- `agent.amtechai.com` should route to `http://localhost:80` through the tunnel.

Different on a VPS/direct DNS deployment:

- DNS points to the VPS public IP.
- Caddy can use `infra/caddy/production.Caddyfile`.
- Caddy terminates TLS directly, including wildcard DNS-01 for `*.agents.amtechai.com` if enabled.
- Host firewall must allow only SSH, `80`, and `443` publicly.
- Reboot recovery, backups, logs, disk pressure, and capacity become live ops concerns.

## Required commands

Clean start:

```bash
npm run prod-like:normal:down -- --employees
docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
```

Build/start the production-like core and require tunnel proof:

```bash
npm run prod-like:normal:up -- --down-first --require-tunnel
```

If source has not changed and only env/tunnel routing changed, avoid a rebuild:

```bash
npm run prod-like:normal:up -- --no-build --require-tunnel
```

If the tunnel is managed manually:

```bash
docker rm -f amtech-tunnel || true
docker run -d --name amtech-tunnel --network host --restart unless-stopped \
  cloudflare/cloudflared:latest tunnel --no-autoupdate run --token "$CLOUDFLARE_TUNNEL_TOKEN"
```

Use `--network host` so cloudflared can reach Caddy on `localhost:80`.

## Health checks

Core:

```bash
docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
curl -sS http://127.0.0.1:8080/health
curl -I http://127.0.0.1:3000/create-ai-employee
```

Caddy origin:

```bash
curl -I http://127.0.0.1/create-ai-employee -H 'Host: agent.amtechai.com'
```

Public ingress:

```bash
curl -I -L https://agent.amtechai.com/create-ai-employee
```

Expected public proof includes:

- HTTP `200`.
- `server: cloudflare`.
- `via: 1.1 Caddy`.

## Onboarding proof path

Open the real public page:

```text
https://agent.amtechai.com/create-ai-employee
```

Use a headed browser and complete the real UI:

1. Chat-first business intake.
2. Real phone number.
3. Real Twilio Verify SMS code.
4. Real owner email/password account creation.
5. Start Employee.
6. Continue to owner web client.
7. Send one real message to the employee.
8. Confirm a real provider-backed employee reply.

Capture:

- `session_id`.
- Twilio Verify SID/status.
- `account_id`.
- owner email.
- `employee_id`.
- `amtech-hermes-<employee_id>` container id/status.
- production stack proof JSON path.
- Cloudflare tunnel id/container id.
- final provider result.

## Do not count as launch proof

Do not count:

- `prod-like:public-estimator:*`.
- `local:acceptance:browser-onboard`.
- `ONBOARD_FIXTURE`.
- `/api/dev/login`.
- `npm run live:login`.
- Quick Tunnel `trycloudflare.com`.
- host `live:*` toolkit.

Those are useful development tools, but launch proof must use the public production path and real account/session creation.

## Onboarding logging expectations

The Manager should log onboarding model turns as structured JSON with:

- `scope: "onboarding"`.
- event name: `model_call_start`, `model_call_succeeded`, or `model_call_failed`.
- `session_id`.
- state/surface.
- provider/model/base URL.
- response format.
- transcript turn count.
- message character count.
- elapsed milliseconds.
- provider HTTP status and coarse error kind on failure.

The Manager must not log:

- owner message body;
- phone verification code;
- password;
- owner session token/cookie;
- provider API key;
- raw provider response body if it may contain sensitive text.

Provider credit/auth failures should be recorded as `provider_auth_or_credit_gated`, not runtime/Hermes outage.

## Known hardening items before pilots

- Account creation is currently a multi-write sequence: Supabase Auth user, `accounts`, `users`, `account_memberships`, `verified_phones`, onboarding session update, and owner session. Before paid pilots, move this behind a DB RPC or compensating cleanup path so partial writes cannot strand an auth user or phone claim.
- The production-like Manager mounts the Docker socket. Treat Manager compromise as host compromise; keep public access through Caddy/Web only and continue reducing model-controlled surfaces.
- Add a proof writer for normal browser onboarding that records IDs from the real public browser flow without requiring a fixture.
- Add public-ingress proof JSON for the named tunnel route, separate from `prod-like-normal-up`.
- Add log shipping/retention on the VPS before a 0-30 employee fleet is left unattended.
- Back up `/var/lib/amtech`, Caddy data/config volumes, and any generated profile/workspace state.
