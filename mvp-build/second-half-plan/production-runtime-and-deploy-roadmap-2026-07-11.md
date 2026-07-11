# Production Runtime & Deploy Roadmap — Re-Sequencing Decision

Status: active decision · 2026-07-11

This is a founder/architect decision doc. It **re-sequences** the second-half plan around one judgment:
the backend and product surfaces are far enough along, but the box is **not deployable or self-sustaining**,
and that matters more right now than polishing the admin panel or building billing. It is grounded in
[`../docs/production-deploy-readiness-review-2026-07-11.md`](../docs/production-deploy-readiness-review-2026-07-11.md).

## The call

1. **Fix deployability and core-loop reliability first.** Neither needs live provider creds, and creds are
   ~a few days out — so this is the correct use of the pre-creds window.
2. **Park admin-panel polish and billing.** Phase 5 is already `source-wired` and sufficient for a first
   pilot the founder personally operates. Further investment there before the box runs is out of order.
3. **Orchestration = docker-compose** for core services (Manager + Web + Caddy), employees stay as
   per-account Docker containers launched by the provisioner. Rationale below.

## Why docker-compose (not systemd, not bare processes)

The employee isolation model is already **one Docker container per employee** (`runtime-backend.ts`:
`docker` is the required production backend). Using docker-compose for the core services means **one
container runtime and mental model for the whole box** — the same `docker` primitives supervise Caddy,
Web, Manager, and every employee; the same `--restart`, `--memory`, `--cpus`, and log-driver knobs apply
everywhere; and reboot recovery is `restart: unless-stopped` uniformly. A bare-VPS systemd split would
mean two supervision models (units for core, Docker for employees) and two recovery stories. For a
one-person, one-VPS factory scaling to dozens of employees, one model wins on operability. (If a single
box is later outgrown, compose services lift to a multi-host orchestrator far more directly than ad-hoc
units.)

Employees remain **provisioner-launched `docker run` containers, not compose services**, because they are
created/destroyed dynamically per tenant — they are data, not a static topology. Compose owns the fixed
core; the provisioner owns the dynamic fleet.

## Re-sequenced priorities

### P0 — Production runtime & deploy foundation (now, no creds)
Close the P0 blockers from the readiness review. Target artifacts (implementation is the follow-up pass):
- **docker-compose stack** for Caddy + Web + Manager: `restart: unless-stopped`, healthchecks, start-order
  (Caddy after Web+Manager), log rotation, resource limits, `.env` wiring.
- **Concrete employee container launch**: define `HERMES_RUNTIME_COMMAND` as a real, version-pinned
  `docker run` (image+tag, `--restart`, `--memory`/`--cpus`, log driver, per-account secret injection,
  the Manager-origin `host.docker.internal` rewrite the code already expects). Fill `HERMES_VERSION`.
- **Caddy reload wiring**: provisioner triggers a validated Caddy Admin-API reload after `writeCaddySnippet`,
  with rollback on failure. (Smallest, highest-leverage code change — a provisioned employee currently
  doesn't route until a manual reload.)
- **Per-employee lifecycle + reboot recovery**: auto-restart, come-back-on-reboot, dead-container GC on
  deprovision, and a documented per-host capacity ceiling. Retire the phantom `hermes@<id>` systemd hint
  in `repair.mjs`.
- **Deploy path**: a build → ship → migrate → restart → smoke script (or push-triggered), with rollback.

### P1 — Make the core loop deterministically working (now, no creds)
The employee can't actually *do tool work* end-to-end yet, independent of provider creds:
- **Model-bridge tool-calls**: the local no-key bridge returns tool-call JSON as assistant *text*, so the
  employee never invokes Manager tools in local runs. This is the true blocker behind every `pending`
  live gate. Make the tool-execution loop verifiable deterministically (bridge emits real tool-call
  protocol; add a fixture/integration proof that a turn → Manager tool → artifact/approval round-trips).
- **Reprovision old profiles** onto scoped MCP credentials (`0023`) so the live path is testable the moment
  creds land; old rendered profiles predate the scoped-credential switch.
- Result: when creds arrive, Phase 1's live gate is a *confirmation*, not a debugging session.

### P2 — Durability, observability, egress (before charging)
- Off-host backup of Hermes profiles + workspaces, with a tested restore (P1 launch-gate in the review).
- Centralized/rotated logs + error tracking + one red-health alert that reaches the founder's phone.
- Default-deny egress from employee containers with a provider/Manager allowlist (lethal-trifecta closure).

### PARKED — Admin panel polish & billing (Phase 5)
Already `source-wired`: `/admin` console (dashboard/accounts/provisioning/repairs/providers/billing-scaffold/
readiness/support-actions) and metering ledgers. Sufficient for a founder-operated first pilot. **No further
investment until P0/P1 land.** Billing (automated AMTECH subscription collection / paywall) stays deferred;
the trial/plan/billing *state model* already exists for when it's needed.

### THEN — Phase 1 live gate → Phase 6 launch
Once P0-P2 hold and creds exist: run the Phase 1 live-acceptance harness for real provider/runtime proof
ids, then the Phase 6 free-trial/paid-pilot gate. No trial starts until Phase 6 criteria are met or waived
in a dated launch decision.

## What this explicitly does NOT change

- The product-surface phases (web desk P2, SMS/review P3, materialization/capability P4) stay `source-wired`
  and are not reopened; the Connector Center + resurfacing slice stands.
- The realness rules hold: nothing here upgrades a live gate without proof ids. P0/P1/P2 that touch the live
  host are scripted + documented and marked `pending` real-host proof until run on the VPS.

## Sequencing at a glance

| Order | Work | Needs creds? | Status target |
|---|---|---|---|
| P0 | Deploy foundation (compose, employee launch, caddy reload, lifecycle, deploy script) | No | build now |
| P1 | Core loop working (model-bridge tool-calls, scoped-MCP reprovision) | No | build now |
| P2 | Backup/DR, observability, egress control | No | build now |
| — | Admin polish + billing | No | PARKED |
| Live | Phase 1 provider/runtime acceptance | Yes | on creds |
| Launch | Phase 6 trial/pilot gate | Yes | after live |
