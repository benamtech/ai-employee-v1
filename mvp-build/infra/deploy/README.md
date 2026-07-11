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
