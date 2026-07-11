# Production Deploy Readiness Review

Status: review · 2026-07-11 · author: source audit (no live host)

Purpose: an evidence-backed review of whether the AMTECH AI Employee can actually be
**deployed and kept running in production** on the intended one-VPS factory. This is deliberately
separate from the second-half plan's *product-surface* readiness (web/SMS/admin quality). A product can
be feature-complete in source and still be undeployable. This document only asks: if we rented a VPS
today and pointed real owners at it, what would fall over.

Scope frame: the intended topology (per `infra/hermes/RUNBOOK.md`, `infra/caddy/Caddyfile`,
`amtech-technical-architecture-principles` memory) is **one VPS** running Caddy + the Next web app +
the Manager control plane + N per-employee Hermes runtimes (one Docker container per employee), with
hosted Supabase as the database and Twilio/Gmail/Stripe/Intuit as external providers.

## Executive Readout

The application layer is in good shape; the **operational layer barely exists**. Every gap below is a
missing *deployment/runtime-operations* artifact, not a missing feature. The single most important
finding: **nothing in this repo starts, supervises, or restarts the core services or the employee
runtimes.** The code that admits this is in the repo itself:

> `apps/manager/src/lib/runtime-backend.ts:19-23` — "there is no Dockerfile/systemd/pm2 config in this
> repo that sets NODE_ENV=production for the Manager process…"

The codebase has correctly built the *policy* for production (default-deny `local` backend admission,
`docker` as the required tenant isolation) but not the *mechanism* (what actually launches, supervises,
and recovers those containers and the core services). Closing this is prerequisite to a paid pilot and,
per the founder's call, ranks **ahead of further admin-panel or billing work.**

None of this needs live provider credentials — it is exactly the work to do in the days before creds
arrive.

## Severity Legend

- **P0 blocker** — a real owner's employee would not reliably come up or stay up.
- **P1 launch-gate** — needed before charging money / trusting the box unattended.
- **P2 hardening** — needed for scale/durability, tolerable for the very first pilot with a human watching.

---

## Findings

### 1. No process supervision for the core services — P0 blocker

`infra/caddy/Caddyfile` reverse-proxies `localhost:3000` (Next web) and `localhost:8080` (Manager API)
and simply assumes both are running. There is no systemd unit, no docker-compose service, no pm2/forever
config, and no `start:prod` script anywhere — every script in `package.json` is either a build/test gate
or a `local:*` / `live:*` dev-and-local-test helper (the `live:*` scripts all shell into
`infra/scripts/local/test/`).

Consequence: a crash, an OOM, or a host reboot leaves Manager and/or Web down with nothing to bring them
back, and Caddy happily serving 502s. There is no boot ordering (Caddy depends on Web+Manager; employee
containers depend on Manager reachability for MCP).

**Done looks like:** a supervised, restart-on-failure definition for Caddy + Web + Manager that survives
reboot, with explicit health and start-order. (Chosen target: **docker-compose** — see the roadmap.)

### 2. Employee runtime launch is an undefined env string — P0 blocker

The production launch path is `provisioner.ts:65 runRuntimeStart(generated_path)` →
`profile-renderer.ts:210` → `runCommand(process.env.HERMES_RUNTIME_COMMAND, ...)`. The actual command is
**entirely externalized to an unspecified env var.** The repo defines the *admission policy* for backends
(`runtime-backend.ts` — `docker` default, `local` hard-vetoed in production) but never defines what the
`docker` launch actually is: no `docker run` invocation, no image reference, no restart policy, no
resource limits, no volume/secret mounts, no network wiring.

Related: `infra/hermes/RUNBOOK.md` still reads `HERMES_VERSION = <fill at install>` — the engine version
has never been pinned, so "production" is whatever Hermes happens to install that day.

**Done looks like:** a concrete, in-repo, version-pinned employee container launch (image + tag,
`--restart=unless-stopped`, `--memory`/`--cpus`, log driver, per-account secret injection, the
`host.docker.internal` Manager-origin rewrite that `profile-renderer.ts` already anticipates) referenced
by `HERMES_RUNTIME_COMMAND`, plus a filled `HERMES_VERSION`.

### 3. New employee subdomains never start routing — P0 blocker

`writeCaddySnippet` (`profile-renderer.ts:214`) writes `clients/<id>.caddy`, and the root `Caddyfile`
`import ./clients/*.caddy` picks those up **only on reload**. There is no `caddy reload` (nor Caddy Admin
API call) anywhere in the repo — verified by grep across `apps/` and `infra/`. So after a successful
provision, `<slug>.agents.amtechai.com` returns nothing until someone manually reloads Caddy, and the
employee's Twilio webhook (pointed at that subdomain) silently fails.

**Done looks like:** the provisioner triggers a validated Caddy reload (Admin API `POST /load` or
`caddy reload`) after writing the snippet, and rolls the snippet back if reload fails.

### 4. No per-employee lifecycle or host-reboot recovery — P0 blocker

`infra/scripts/repair.mjs:71` instructs an operator to run `systemctl --user restart hermes@<employee>`
— but that `hermes@.service` template unit **does not exist in the repo.** More broadly there is no
answer to: how do N employee containers come back after a reboot; how is a wedged runtime restarted; how
are dead/abandoned containers garbage-collected; what caps total employees per host. `runtime_health_checks`
records health to the DB, but nothing acts on a red check.

**Done looks like:** a declarative per-employee runtime definition (compose service template or a real
`hermes@<id>` unit) that auto-restarts and comes back on reboot, plus a documented capacity ceiling and a
GC path for deprovisioned employees.

### 5. No deploy pipeline — P1 launch-gate

There is no defined way for code to reach the VPS: no CI/CD, no build-and-ship script, no image build for
Manager/Web, no release/rollback procedure. `origin` is a GitHub remote but no workflow deploys from it.

**Done looks like:** a one-command (or push-triggered) build → ship → migrate → restart → smoke path with a
documented rollback.

### 6. No backup / disaster recovery for on-VPS state — P1 launch-gate

Supabase is hosted (managed backups). But the VPS holds irreplaceable per-employee filesystem state:
Hermes profiles at `~/.hermes/profiles/client_<id>/` (identity, memory, sessions, skills, secrets, cron)
and workspaces at `~/amtech/clients/<id>/workspace/` (brain, outputs). None of it is backed up. If the
VPS dies, **every employee's memory and identity is gone** and cannot be reconstructed from Supabase alone.

**Done looks like:** scheduled off-host backup of profiles + workspaces (and the secret material they
reference), with a tested restore, and a documented RPO/RTO.

### 7. No observability, alerting, or log management — P1 launch-gate

Health checks land in `runtime_health_checks`, and services log to stdout (in local test, to
`infra/.local/test/logs/*.log`). In production there is no log aggregation/rotation, no error tracking, no
uptime/heartbeat alerting, and nothing that pages the single operator when an employee goes red, a
provider webhook starts failing, or a container is OOM-looping. For a one-person factory, "nobody is
watching" is the default state.

**Done looks like:** centralized/rotated logs, an error tracker, and at minimum one external uptime + a
red-health alert that reaches the founder's phone.

### 8. Egress control is still open — P1 launch-gate (security)

Employee containers run Hermes with web/terminal/file tools and process untrusted provider content
(email bodies, QBO text — already treated as untrusted for the lethal-trifecta reason in the QBO
adapter). Without egress control, a prompt-injected employee with network access is an exfiltration path.
This is flagged `pending` across recent memory notes and remains unbuilt.

**Done looks like:** default-deny outbound from employee containers with an explicit allowlist (provider
APIs, Manager MCP), so tool access cannot become data exfiltration.

### 9. No graceful drain / zero-downtime deploy — P2 hardening

Restarting Manager drops open owner SSE streams and any in-flight turn; the turn queue + stuck-turn
reaper (`turn-drain.ts`) will recover correctness, but the owner sees a dropped connection and a stalled
"working…". No connection draining or rolling restart exists.

**Done looks like:** drain SSE + let in-flight turns finish (or requeue cleanly) on deploy; reconnect is
already handled client-side.

### 10. Secrets live as plaintext `.env` on the host — P2 hardening

Manager stores provider tokens as sealed references in the DB (good), but the VPS-level `.env`
(service-role key, signing secrets, provider client secrets, `MANAGER_*` tokens) is plaintext on disk
with no rotation story or backup. Blast radius of host compromise is total.

**Done looks like:** documented secret provenance + rotation, least-privilege file perms, and inclusion in
the (encrypted) backup story.

---

## Summary Table

| # | Gap | Severity | Evidence |
|---|---|---|---|
| 1 | No supervision for Caddy/Web/Manager | P0 | `Caddyfile`; no `start:prod` in `package.json` |
| 2 | Employee launch is an undefined env string; `HERMES_VERSION` unpinned | P0 | `profile-renderer.ts:210`, `runtime-backend.ts:19`, `RUNBOOK.md` |
| 3 | No `caddy reload` after snippet write | P0 | `profile-renderer.ts:214`; grep: no reload in repo |
| 4 | No per-employee lifecycle / reboot recovery / GC | P0 | `repair.mjs:71` (unit doesn't exist) |
| 5 | No deploy pipeline / rollback | P1 | no CI/deploy in repo |
| 6 | No backup/DR for profiles + workspaces | P1 | `RUNBOOK.md` layout; nothing backs it up |
| 7 | No observability/alerting/log mgmt | P1 | `runtime_health_checks` write-only |
| 8 | Egress control open (lethal trifecta) | P1 | memory `pending`; QBO untrusted-text posture |
| 9 | No graceful drain / zero-downtime deploy | P2 | `turn-drain.ts` recovers correctness only |
| 10 | Host `.env` plaintext, no rotation/backup | P2 | env layout in `.env.example`/RUNBOOK |

## What is already good (so the follow-up build reuses it)

- Backend admission policy is correct: `docker` required, `local` default-denied and production-vetoed
  (`runtime-backend.ts` `isLocalRuntimeBackendAllowed`).
- The provisioner already externalizes the launch + Caddy snippet + health seams — the follow-up wires
  real mechanisms into existing seams, it does not restructure provisioning.
- RLS is closed (migrations 0018-0021, advisor-verified) and correctness under restart is handled
  (turn-claim CAS, stuck-turn reaper) — so the deploy layer can be added without fear of data races.
- Per-employee scoped MCP credentials already replaced the shared bearer (`0023`, `lib/mcp-auth.ts`).

## Next

The sequenced remediation is in
[`../second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md`](../second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md).
The chosen orchestration target is **docker-compose** for core services with per-account Docker
containers for employees. Implementation is a follow-up pass; this review defines the gap set it must close.
