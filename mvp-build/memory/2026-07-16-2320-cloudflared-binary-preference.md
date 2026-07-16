# 2026-07-16 23:20 — cloudflared binary preference

## Change
`deriveTunnelToken()` now tries the native `cloudflared` binary first:
```bash
cloudflared tunnel --origincert <cert.pem> token amtech-tunnel
```
Falls back to the `cloudflare/cloudflared:latest` Docker image only if the binary is absent.

## Rationale
Matches the production deployment pattern (token is minted at deploy time via the official CLI) and avoids unnecessary Docker overhead when cloudflared is installed on the host.

## Status
Script updated and tested. Token derivation succeeds (via Docker fallback on this machine). No behavior change for environments without the binary.