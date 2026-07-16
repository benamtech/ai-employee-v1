# 2026-07-16 22:45 — Full prod-like:normal:up result

## Run outcome
Command completed with status **fail** on the public-route checks only.

### What succeeded (local production shape)
- Images built (manager, web, caddy)
- Compose stack up on `amtech_runtime`
- Manager healthy on :8080
- Web healthy on :3000
- Caddy healthy on :80/:443 (local)
- `cloudflare_named_tunnel` check passed (container started, token source recorded)
- Overlay sync injected xAI/Grok-4.3 keys correctly

### What failed
- `public_agent_route` → 530
- `public_api_health` → 530
- Root cause: tunnel container logs show **"Provided Tunnel token is not valid"** repeatedly

The auto-derived token from `infra/.local/cloudflared/cert.pem` is either:
- Stale / rotated at Cloudflare
- The wrong field inside the PEM (script parsed the base64 line but Cloudflare expects the full credential string)
- Needs to be the actual `cloudflared tunnel token` output, not the cert.pem contents

## Current running state
```
amtech-ai-employee-manager-1   Up (healthy)   127.0.0.1:8080
amtech-ai-employee-web-1       Up (healthy)   127.0.0.1:3000
amtech-ai-employee-caddy-1     Up (healthy)   0.0.0.0:80,443
amtech-tunnel                  Restarting     (invalid token)
```

## Next required action
Fix the tunnel token source before any public testing at agent.amtechai.com. Options:
1. Re-export a fresh tunnel token via `cloudflared tunnel token amtech-tunnel` and store it properly
2. Update `prod-env-overlay.mjs` to handle the correct extraction or accept an explicit token file
3. Manually place the correct token in `.env.production.local` as `CLOUDFLARE_TUNNEL_TOKEN=...`

Local stack is ready; public ingress is the only blocker.