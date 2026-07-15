# Cloudflare tunnel + production DNS handoff for estimator and client employees

Date: 2026-07-15 02:58 ET
Status: Quick Tunnel public proof complete; production custom-domain tunnel/DNS still required before campaign/client deployment
Scope: Public exposure path for the AMTECH public estimator now, and repeatable public exposure for client employees by tomorrow.

## Executive state

The production-like estimator stack is running locally and is publicly reachable through a Cloudflare
Quick Tunnel:

- Temporary public estimator URL: `https://enjoy-commented-fix-buses.trycloudflare.com/estimator`
- Local origin behind the tunnel: `http://127.0.0.1:3000`
- Tunnel container: `amtech-cloudflared-estimator`
- Proof JSON: `infra/proofs/cloudflare-quick-tunnel-2026-07-15T06-58-39-844Z.json`

This proves Cloudflare can reach the local Web app without public inbound `80/443`. It is **not** a
campaign-ready domain because Quick Tunnels are random `trycloudflare.com` hostnames and have no uptime
guarantee. The production path for tomorrow should be a **named Cloudflare Tunnel** routed to
`agent.amtechai.com`, not an A record to this local PC.

## What was proven today

- Prod-like stack:
  - `manager`, `web`, and `caddy` are healthy through `infra/deploy/docker-compose.yml`.
  - Estimator Hermes container is running as `amtech-hermes-emp_5omv4ihbvggc8ibe31nj43`.
  - Local `/estimator` served at `http://127.0.0.1:3000/estimator`.
- Public Quick Tunnel:
  - First attempt used default Docker bridge and failed with Cloudflare `502` because Web is bound to host loopback.
  - Correct command used `--network host` and origin `http://127.0.0.1:3000`.
  - `GET https://enjoy-commented-fix-buses.trycloudflare.com/estimator` returned `200`.
  - `POST /api/public-estimator/session` through the tunnel created visitor session `pes_suogdvplxdrbbldkzm3v0x`.
- Provider boundary:
  - Message turns are gated by Anthropic account credit/subscription/provider auth, not DNS and not Hermes availability.
  - Do not call the message path provider-accepted until paid provider proof returns a real provider/run id.

## Why direct production DNS is not the right local-PC path

The repo's direct DNS script, `infra/scripts/cloudflare-dns.mjs`, is for a VPS/static public IP deployment.
It wants to create/update A records:

- `amtechai.com`
- `www.amtechai.com`
- `api.amtechai.com`
- `agent.amtechai.com`
- `*.agents.amtechai.com`

That path is blocked locally for three reasons:

- `AMTECH_PUBLIC_IPV4` is missing, so the desired-state script cannot build a DNS plan.
- The value currently loaded from `infra/deploy/.env.production` as `CLOUDFLARE_API_TOKEN` failed
  Cloudflare API verification:
  - token fingerprint only: prefix `cfat`, length `53`, sha256 prefix `a414c5def6a9`;
  - `GET /user/tokens/verify` returned `401`, code `1000`, `Invalid API Token`;
  - an earlier zone lookup returned `403`, code `9109`.
  If there is a valid Cloudflare token elsewhere, it was not the token present in this file during this run.
- The local PC's detected outbound public IP was `174.60.161.221`, but inbound `80/443` to that IP timed
  out. That is consistent with residential NAT/router/firewall/ISP blocking. Even a correct A record would
  not make this machine publicly reachable unless router forwarding and firewall rules are fixed.

For tomorrow's public demo/client work, use Cloudflare Tunnel.

## Tomorrow's recommended deployment topology

Use one named tunnel for the host and route public hostnames to local services:

- `agent.amtechai.com` -> `http://127.0.0.1:3000`
  - Serves `/estimator`, company app routes, and Web API proxies.
- Optional later: `api.amtechai.com` -> `http://127.0.0.1:8080`
  - Only if external provider webhooks must hit Manager directly.
- Optional later: `*.agents.amtechai.com` -> local Caddy or per-employee route
  - For public per-client employee subdomains. The current Caddy config already supports wildcard hosts and dynamic client snippets, but the immediate estimator path does not need wildcard routing.

This keeps local services bound safely to loopback while Cloudflare provides the public edge.

## Named tunnel setup checklist

Do this in the Cloudflare dashboard or with `cloudflared` authenticated to the AMTECH account:

1. Create a named tunnel, e.g. `amtech-local-prodlike`.
2. Add public hostname:
   - Hostname: `agent.amtechai.com`
   - Service: `http://127.0.0.1:3000`
3. Copy the tunnel token.
4. Run the named tunnel on this machine:

```bash
docker rm -f amtech-cloudflared-agent || true
docker run -d --name amtech-cloudflared-agent --network host --restart unless-stopped \
  cloudflare/cloudflared:latest tunnel --no-autoupdate run --token "$CLOUDFLARE_TUNNEL_TOKEN"
```

5. Verify:

```bash
curl -I https://agent.amtechai.com/estimator
curl -sS -X POST https://agent.amtechai.com/api/public-estimator/session \
  -H 'Content-Type: application/json' --data '{}'
```

6. Record proof under `infra/proofs/` and update this memory note.

## Client employee public exposure path

For client employees by tomorrow, do not invent a new public architecture. Reuse the existing production shape:

- Core services stay in Compose:
  - Manager on host loopback `127.0.0.1:8080`
  - Web on host loopback `127.0.0.1:3000`
  - Caddy on host `80/443` for local direct testing and future VPS/A-record mode
- Employee runtimes are dynamic containers on `amtech_runtime`:
  - `amtech-hermes-<employee_id>`
  - provisioned by Manager/provisioner
  - attached to Docker DNS for Caddy/Manager reachability
- Public surface should be Web-first:
  - owner/client surfaces through `agent.amtechai.com`
  - public estimator through `agent.amtechai.com/estimator`
  - per-client employee subdomains only after named tunnel/wildcard routing is proven

Immediate client-ready path:

1. Bring up stack:

```bash
npm run prod-like:public-estimator:up -- --down-first --reprovision-employee
```

2. Start named tunnel for `agent.amtechai.com`.
3. For each new client employee:
   - provision/reprovision employee through existing Manager/provisioner path;
   - verify Hermes container running;
   - verify scoped MCP tools list includes `create_estimate_artifact` and `request_approval`;
   - verify owner/session route via Web, not raw Hermes;
   - do not claim provider-accepted until the paid LLM provider returns a real successful turn.

## Exact commands from this session

Quick Tunnel command that worked:

```bash
docker rm -f amtech-cloudflared-estimator >/dev/null 2>&1 || true
docker run -d --name amtech-cloudflared-estimator --network host \
  cloudflare/cloudflared:latest tunnel --no-autoupdate --url http://127.0.0.1:3000
docker logs --tail 120 amtech-cloudflared-estimator
```

Verification:

```bash
curl -I https://enjoy-commented-fix-buses.trycloudflare.com/estimator
curl -sS -X POST https://enjoy-commented-fix-buses.trycloudflare.com/api/public-estimator/session \
  -H 'Content-Type: application/json' --data '{}'
```

Stop only the Quick Tunnel:

```bash
docker rm -f amtech-cloudflared-estimator
```

Stop the whole prod-like stack and estimator runtime:

```bash
npm run prod-like:down -- --employee
```

## Open blockers before campaign/client deployment

- Replace/fix the Cloudflare credential loaded by the deploy env:
  - the token currently in `infra/deploy/.env.production` failed `/user/tokens/verify`;
  - a named tunnel token is needed for `agent.amtechai.com`, or a valid API token/login is needed to create one.
- Create named tunnel and route `agent.amtechai.com` to `http://127.0.0.1:3000`.
- Paid/active Anthropic provider account:
  - current message-turn failure is expected provider auth/credit gating;
  - do not frame this as Hermes unavailable.
- Resend:
  - sending domain is `mail.amtechleads.com`;
  - still need full `PUBLIC_ESTIMATOR_FROM_EMAIL` and `PUBLIC_ESTIMATOR_REPLY_TO`;
  - only send contractor visitor their own draft after a current draft exists.

## Status language to preserve

- `local public proof`: Quick Tunnel URL works and visitor sessions are isolated.
- `runtime-proven`: local/prod-like Manager/Web/Caddy/Hermes run.
- `provider-accepted`: not yet; requires real paid LLM turn/provider id.
- `campaign-ready`: not yet; requires named tunnel/custom domain, provider acceptance, and email proof.
