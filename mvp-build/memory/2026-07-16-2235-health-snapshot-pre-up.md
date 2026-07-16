# 2026-07-16 22:35 — Pre-up health snapshot

## Cleanup done
- `amtech-tunnel` forcibly removed (no longer exposing host)
- No live employee containers on `amtech_runtime`
- Only stale `Created` container: `amtech-ai-employee-manager-1`
- Network `amtech_runtime` still present (expected)

## .env.production current state
Overlay sync succeeded and correctly derived `CLOUDFLARE_TUNNEL_TOKEN`.

**Critical placeholders still present (will block real auth):**
- `MANAGER_INTERNAL_TOKEN=change-me`
- `PROVISIONER_TOKEN=change-me`
- `SIGNING_SECRET=change-me`

**Present and non-placeholder:**
- `SUPABASE_URL`, `DATABASE_URL`, `TWILIO_ACCOUNT_SID`, `SMS_WEBHOOK_BASE_URL`, `CLOUDFLARE_TUNNEL_TOKEN`

## Decision point
Full `prod-like:normal:up -- --require-tunnel` will exercise compose + Caddy + tunnel bring-up, but internal service-to-service auth will fail until the three tokens are supplied (via `.env.production.local` overlay or direct edit).

Next action can be:
A) Supply the three tokens now and then run full up
B) Run full up anyway (will surface the exact failure point for documentation)
C) Pause here

Snapshot complete. Tunnel is down as requested.