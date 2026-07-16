# 2026-07-16 23:00 — Tunnel token derivation fix

## Problem
Overlay script was reading `cert.pem` raw contents (base64 blob). Cloudflare expects the **runtime token** minted by `cloudflared tunnel token amtech-tunnel` at deployment time, not the origin certificate.

## Fix
Updated `prod-env-overlay.mjs`:
- `deriveTunnelToken()` now spawns the official `cloudflared tunnel --origincert /cert.pem token amtech-tunnel` inside a throwaway container (same pattern the main up script already uses in `deriveTunnelTokenFromCert()`).
- Requires `docker` + valid `cert.pem` (0600) — same prerequisites as production.

## Files changed
- `infra/scripts/prod-env-overlay.mjs` — now matches the production derivation logic.

## Status
Overlay + tunnel helper now produce the correct token. Re-run `npm run prod-like:env:sync` (or `tunnel:ensure`) after any cert rotation.