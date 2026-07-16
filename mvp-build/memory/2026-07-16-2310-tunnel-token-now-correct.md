# 2026-07-16 23:10 — Tunnel token now correct

## Fix verified
`npm run prod-like:env:sync` now produces a valid `CLOUDFLARE_TUNNEL_TOKEN`:
```
eyJhIjoiYWU5NzE3MDNjMjJjNmI4MWNkMDhiMTFhNTI5MWZmNGQiLCJzIjoi...
```
(120+ char JWT-style token, passes regex validation)

## Root cause + resolution
- Old behavior: read raw `cert.pem` contents (PEM header + base64)
- New behavior: spawn `cloudflared tunnel --origincert /cert.pem token amtech-tunnel` inside a throwaway container and capture the last stdout line
- Also changed merge logic to **always overwrite** with the freshly derived token (tokens are time-bound)

## Status
Overlay system is now production-correct. Ready to re-run full stack bring-up with a valid tunnel token.