# 2026-07-16 20:00 — Local production overlay + tunnel helper

## What was built

Added a durable, gitignored `.env.production.local` overlay system plus two new npm commands that eliminate the two biggest day-to-day friction points for reliable local prod-like testing:

- `npm run prod-like:env:sync` — merges `.env.production.local` (if present) into `infra/deploy/.env.production`, seeds from `.env.production.example` when needed, and auto-derives `CLOUDFLARE_TUNNEL_TOKEN` from `infra/.local/cloudflared/cert.pem`.
- `npm run prod-like:tunnel:ensure` — same as above but fails fast if no tunnel token ends up present.

## Files added / changed

- `infra/scripts/prod-env-overlay.mjs` — the canonical helper (exports `syncOverlay` / `ensureTunnelToken`, writes timestamped proof JSONs to `infra/proofs/`).
- `package.json` — two new scripts registered.
- `.env.production.local.example` — documented template (gitignored by existing `.*.local` rule).

## Behavior

- `.env.production.local` is never committed (already covered by `!.env.local.example` + `.*.local` patterns).
- Auto-derivation reads the PEM-wrapped token from the cert file the same way the tunnel container expects it.
- Proof artifacts are written on every successful run (`prod-env-overlay-*.json`).
- Existing `prod-like:normal:*` scripts continue to work unchanged; they now inherit a cleaner `.env.production` after a one-time `env:sync`.

## Next steps (optional polish)

- Could add a `prod-like:health:daily` wrapper later that chains overlay sync + tunnel ensure + existing healthcheck.
- Tunnel token UX could be further hardened by storing the cert in a Docker secret / 1Password, but the current cert.pem + 0600 pattern is the production shape and is now script-supported.

## Status

Overlay system complete and ready for daily use. No changes to the production topology or runbook required.