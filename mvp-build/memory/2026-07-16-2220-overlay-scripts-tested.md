# 2026-07-16 22:20 — Overlay + tunnel scripts tested

## Progress

Both new commands verified clean:

- `npm run prod-like:env:sync` → `ok: true`, token auto-derived from `cert.pem`, proof written
- `npm run prod-like:tunnel:ensure` → same result, explicit tunnel gate passes

`prod-like:normal:up -- --require-tunnel` was started but aborted before completion (long-running compose + tunnel health). Tunnel container `amtech-tunnel` is already running from prior session; core services (manager/web/caddy) and any employee fleet are not currently visible in `docker ps`.

## State

Overlay system is working as designed. Full stack bring-up remains gated on the long-running command completing (or running in background with logs). No changes needed to the scripts themselves.

## Next

Re-run `prod-like:normal:up -- --require-tunnel` when ready for a full local prod-like cycle, or continue with the existing running tunnel if the goal is just to validate the overlay path.