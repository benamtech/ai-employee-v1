# Production VPS runbook: core, tunnel, Caddy, and 0-30 employee fleet

Status: declarative ops notes from the production-level normal employee launch setup

## Production shape

The production system is a fixed core plus a dynamic employee fleet.

Fixed core:

- `manager` container: AMTECH control plane, health on `:8080`.
- `web` container: Next.js owner/front-door app, health on `:3000`.
- `caddy` container: public origin reverse proxy, host `:80/:443`.
- `amtech_runtime` Docker network: shared network for core containers and every employee container.

Dynamic employee fleet:

- Employees are **not** Compose services.
- Each employee is a separately launched Docker container named `amtech-hermes-<employee_id>`.
- Manager/provisioner creates, starts, repairs, and retires employees.
- Caddy routes per-employee traffic by Docker DNS alias on `amtech_runtime`.
- First VPS target is modest: manage anywhere from 0 to 30 employees, not a theoretical scale test.

## Public ingress

For the first live VPS/local-production launch, the public path must be:

```text
Cloudflare public hostname
  -> Cloudflare Tunnel connector
  -> Caddy on the host
  -> Web / Manager / employee containers
```

Cloudflare should terminate public HTTPS. Caddy stays in the path as the origin router.

Required public hostname:

```text
agent.amtechai.com -> http://localhost:80
```

Equivalent DNS target when configured manually:

```text
agent.amtechai.com CNAME <tunnel_id>.cfargotunnel.com
proxy enabled
```

In the attempt on 2026-07-16, the tunnel connector itself came up cleanly:

- Tunnel container: `amtech-tunnel`.
- Tunnel id: `496ceef3-e2a8-49f5-9af3-c3b155534627`.
- Cloudflared registered four QUIC connections.
- Caddy/Web local route for `Host: agent.amtechai.com` returned `200`.
- Public `agent.amtechai.com` did not resolve yet because the Cloudflare public hostname/DNS route still needed to be created.

## Caddy role

Caddy is not optional production decoration. It is the stable origin routing layer.

For Cloudflare Tunnel mode:

- Use `infra/caddy/tunnel.Caddyfile`.
- Cloudflare handles public HTTPS.
- Caddy receives HTTP from the tunnel and routes by host.
- `agent.amtechai.com` routes to Web.
- `api.amtechai.com`, if enabled, routes to Manager.
- imported client snippets support per-employee routing.

For direct VPS DNS mode later:

- Use `infra/caddy/production.Caddyfile`.
- Caddy terminates TLS directly.
- Direct DNS mode needs a real public IP, valid Cloudflare DNS records, and open inbound `80/443`.
- Direct DNS is not the local-PC path and should not be mixed into tunnel proof.

## Commands

Clean start:

```bash
npm run prod-like:normal:down -- --employees
docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
```

Bring up production-like normal core and require Cloudflare tunnel proof:

```bash
npm run prod-like:normal:up -- --down-first --require-tunnel
```

If manually starting the tunnel connector:

```bash
docker rm -f amtech-tunnel || true
docker run -d --name amtech-tunnel --network host --restart unless-stopped \
  cloudflare/cloudflared:latest tunnel --no-autoupdate run --token "$CLOUDFLARE_TUNNEL_TOKEN"
```

Use `--network host` for the local/VPS host-origin shape so cloudflared can reach Caddy on `localhost:80`.

Verify local Caddy before blaming Cloudflare:

```bash
curl -I http://127.0.0.1/create-ai-employee -H 'Host: agent.amtechai.com'
```

Verify public ingress after Cloudflare public hostname/DNS is configured:

```bash
curl -I -L https://agent.amtechai.com/create-ai-employee
```

## Launch proof sequence

The production-level normal employee proof is:

1. Core stack healthy: Manager, Web, Caddy.
2. Cloudflare tunnel connected.
3. `agent.amtechai.com` resolves publicly and returns the `/create-ai-employee` page through Cloudflare -> Caddy -> Web.
4. Real headed browser flow at `https://agent.amtechai.com/create-ai-employee`.
5. Real chat-first onboarding.
6. Real Twilio phone verification.
7. Real account creation.
8. Start Employee.
9. New `amtech-hermes-<employee_id>` container starts on `amtech_runtime`.
10. Owner web client opens through the real authenticated post-onboarding session.
11. A real xAI/Grok-backed employee reply appears.

Only after step 11 should the normal employee loop be called provider/runtime proven.

If the final LLM turn fails because of xAI auth/credit, call it `provider-gated`, not Hermes/runtime outage.

## What not to use as production proof

Do not count:

- `prod-like:public-estimator:*` as normal employee proof.
- `local:acceptance:browser-onboard` as launch proof.
- `ONBOARD_FIXTURE` as launch proof.
- `/api/dev/login` or `npm run live:login` as production login proof.
- Quick Tunnel random `trycloudflare.com` as campaign-ready domain proof.
- host `live:*` toolkit as the production stack proof.

Those are useful development tools, but the launch proof is the real public domain and real browser flow.

## Fleet operations for 0-30 employees

The first VPS should be managed as a single pod:

- One fixed core stack.
- One external Docker network: `amtech_runtime`.
- Zero to thirty `amtech-hermes-*` containers.
- Every employee container gets a scoped Manager MCP credential.
- Old employees provisioned before scoped MCP/tooling fixes should be reprovisioned before real use.
- Employee containers should use `--restart=unless-stopped`.
- Caddy should be able to route to every running employee by container DNS alias.
- Manager should be the only component allowed to launch/stop/recover employees.

Daily/operational checks:

```bash
docker ps --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
docker network inspect amtech_runtime
curl -I http://127.0.0.1/create-ai-employee -H 'Host: agent.amtechai.com'
curl -I -L https://agent.amtechai.com/create-ai-employee
```

Employee-specific checks:

```bash
docker ps --filter 'name=amtech-hermes-' --format '{{.Names}}\t{{.Status}}'
docker logs --tail 120 amtech-hermes-<employee_id>
```

Do not manage a 0-30 employee fleet with one-off ad hoc containers that bypass Manager/provisioner. The point of the pod is that provisioning, scoped credentials, profile rendering, Caddy activation, and runtime tracking all go through the product path.

## Proof artifacts to preserve

For every launch-level run, record:

- production stack proof JSON path;
- Cloudflare tunnel container id and tunnel id;
- Caddy validation result;
- public `agent.amtechai.com` status;
- `session_id`;
- Twilio Verify SID/status;
- `account_id`;
- `employee_id`;
- owner email;
- employee container id/status;
- provider reply result;
- exact gated remainder, if any.

Never print tokens, phone codes, passwords, cookies, or provider keys in proof notes.
