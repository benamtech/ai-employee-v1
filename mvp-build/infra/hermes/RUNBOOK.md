# Hermes runbook (VPS)

Hermes (NousResearch/hermes-agent) is the **engine** — profile-scoped state, runtime,
gateways, per-profile API server, webhooks, cron, MCP, skill loading. AMTECH does **not**
rebuild this; `provision_employee` (Phase 1) drives it. This runbook grounds the environment
so Phase 0 is verifiably ready before Phase 1 automates against it.

## Install (pin a version)
1. Provision a VPS (Ubuntu LTS). Create an `amtech` user.
2. Install Hermes per its docs; pin the version in `HERMES_VERSION` and record it here:
   - `HERMES_VERSION = <fill at install>`
3. Set env (see repo `.env.example`): `HERMES_HOME`, `HERMES_BIN`, `AMTECH_CLIENTS_DIR`,
   `HERMES_GATEWAY_PORT_BASE=8100`.
4. Install Caddy; point it at `infra/caddy/Caddyfile`. For laptop testing, run a tunnel
   (e.g. Cloudflare named tunnel) so Twilio webhooks reach the local Manager; set
   `PUBLIC_TUNNEL_URL` / `SMS_WEBHOOK_BASE_URL` to the exact public URL Twilio will sign.

## Profile / workspace layout (per client `<id>`)
- Profile: `~/.hermes/profiles/client_<id>/` (identity, memory, sessions, skills, config, secrets, cron, gateway/API state).
- Workspace: `~/amtech/clients/<id>/workspace/` (terminal cwd; holds `AGENTS.md`, `brain/`, `output/`).
- Inbound webhook: local port `8100 + n`; subdomain mapped by the Caddy client snippet.

## Manager → Hermes interface (Phase 1 wires this)
`provision_employee` will: create the profile, render the template (`packages/agent-template`),
claim a 10DLC number, write `.env`/config, register the two check-in crons, start the
gateway + API server, run health checks, and send the first live SMS.

## Hermes Jobs (Phase 2 scheduler runner)
AMTECH records stay the source of truth; Hermes Jobs is only the runner. Configure Jobs
to call the Manager scheduler boundary with `Authorization: Bearer $MANAGER_INTERNAL_TOKEN`.
Each pass records `hermes_job_runs` proof; use the external Hermes job/run id when available.

- every 5 minutes: `npm run scheduler:hermes-jobs -- --job=dispatch_due_reminders --external-job-id=<hermes-job-id>`;
- daily: `npm run scheduler:hermes-jobs -- --job=renew_expiring_watches --external-job-id=<hermes-job-id>`;
- daily morning local time: `npm run scheduler:hermes-jobs -- --job=dispatch_daily_briefs --external-job-id=<hermes-job-id>`;
- every 5 minutes or at deploy boundaries: `npm run scheduler:hermes-jobs -- --job=runtime_health_checks --external-job-id=<hermes-job-id>`.

`npm run scheduler:tick` remains the dev/manual fallback and calls the same Manager endpoint,
but its rows are marked `runner_type=scheduler_tick`; those rows are not live Hermes job proof.

## Message-to-agent event path (Phase 7 seam)
For judgment events, Manager calls the per-employee Hermes API at
`$HERMES_EVENT_PATH` (default `/events/work`) with a compact structured event payload.
Hermes must return a validated `WorkEventDescriptor`; invalid descriptors go to the
repair queue, not the owner.

## MANUAL SMOKE TEST — gates Phase 0 "done"
Prove the environment by hand before Phase 1 automates it:
1. Create a throwaway Hermes profile.
2. Start its gateway on `8100`; confirm `GET` on its API/health responds.
3. Point a test 10DLC number's SMS webhook at the tunnel; text it; confirm an inbound run.
4. Send one outbound SMS from the profile; confirm a Twilio **message SID** comes back.
Record the result in `infra/hermes/smoke-result.md` (SID + timestamp).

`node infra/scripts/hermes-smoke.mjs` documents these steps and checks env presence.

## Runtime containment (first-pilot path)
`runtime_endpoints.backend_type` records the containment level:

- `docker`: default for production, VPS deployment, and production-like local testing; one container per employee runtime, per-account env/secrets, no shared writable workspace.
- `local`: demo/dev escape hatch only; Hermes profile isolation is state/config isolation, not process isolation.
- `ssh` / `vm`: later stronger isolation for higher-risk clients.

Before a paid pilot, keep `HERMES_BACKEND_TYPE=docker` and record the runtime health proof
plus real Hermes job-run proof in the implementation record. The security boundary that always holds is verified provider
webhooks + Manager approval gates; prompt instructions are never a boundary.
