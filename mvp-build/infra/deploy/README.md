# AMTECH production deploy scaffold

Status: source-wired deploy scaffold; live VPS proof pending

This directory defines the fixed core stack for a one-VPS deployment:

- `manager` - Hono Manager control plane on `:8080`
- `web` - Next.js owner/admin web app on `:3000`
- `caddy` - public reverse proxy on `:80/:443`

Employees are intentionally not Compose services. They are dynamic tenant runtimes launched by the
provisioner with `infra/scripts/deploy/start-hermes-container.sh` and attached to the same
`amtech_runtime` Docker network so Caddy can route per-employee subdomains by container DNS alias.

## First-run outline

```bash
cp infra/deploy/.env.production.example .env.production
docker network create amtech_runtime || true
docker compose -f infra/deploy/docker-compose.yml --env-file .env.production up -d --build
npm run deploy:smoke
```

This is not a live acceptance gate. Live acceptance still requires provider/runtime proof IDs.

## Public estimator prod-like runner

For the public estimator employee path, prefer the scripted runner over hand-editing env and
issuing ad hoc Docker commands:

```bash
npm run prod-like:public-estimator:up
npm run prod-like:public-estimator:smoke
npm run prod-like:down
```

The runner prepares `infra/deploy/.env.production` with the public estimator employee/account,
real provider env from `.env` when present, `amtech_runtime`, and container-internal Manager
routing. It deliberately removes `LOCAL_MODEL_BRIDGE`. The production Manager image includes the
Docker CLI because employee runtimes are started through the mounted Docker socket and Caddy reloads
are issued with `docker exec amtech-ai-employee-caddy-1 ...`.

When `CLOUDFLARE_API_TOKEN` is missing, the runner records Caddy as `dns_token_gated` and stops
the Caddy service after Compose starts so the host is not left with a restart loop. Manager and Web
can still be proven on `127.0.0.1:8080` and `127.0.0.1:3000`.

The production public path is `/estimator` on the Web app. Locally the scripted smoke checks
`http://127.0.0.1:3000/estimator` by default; `/free-estimator` is kept as a compatibility and
acquisition alias.

Employee reprovision is opt-in because it rotates scoped MCP credentials, activates Caddy, restarts
Hermes, and may touch production providers:

```bash
npm run prod-like:public-estimator:up -- --reprovision-employee
```

Use that only after Cloudflare DNS/TLS is configured, or the provisioner will correctly gate on
Caddy activation. To exercise the message leg, use:

```bash
npm run prod-like:public-estimator:smoke -- --send-message
```

That can reach the Anthropic-backed LLM leg. A provider credit rejection is a provider proof event,
not a Hermes outage, and should not be called provider-accepted unless a real provider id is
captured.

## Local public tunnel

When the stack is running on a local PC without inbound `80/443`, use a Cloudflare Tunnel instead
of A-record DNS. A residential/public outbound IP is not enough; the router, firewall, and ISP must
also forward inbound traffic for public DNS to work.

For a temporary public proof URL:

```bash
docker rm -f amtech-cloudflared-estimator || true
docker run -d --name amtech-cloudflared-estimator --network host \
  cloudflare/cloudflared:latest tunnel --no-autoupdate --url http://127.0.0.1:3000
docker logs --tail 120 amtech-cloudflared-estimator
```

Use `--network host` because the production-like Web service is bound to host loopback
(`127.0.0.1:3000`). A default-bridge `cloudflared` container cannot reach that listener and will
serve a Cloudflare `502`.

Quick Tunnels create a random `*.trycloudflare.com` URL and are not campaign-ready. To publish
`https://agent.amtechai.com/estimator`, create a named Cloudflare Tunnel in the Cloudflare account,
route `agent.amtechai.com` to it, and run `cloudflared tunnel --token ...` (or the equivalent Docker
command) against `http://127.0.0.1:3000`. The old A-record path still requires
`AMTECH_PUBLIC_IPV4`, a valid `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_DNS_APPLY_CONFIRM=amtechai.com`.
