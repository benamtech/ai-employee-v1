# Production runtime P0 source-wired + capacity notes synthesis

Date: 2026-07-11 11:42 EDT
Status: P0/P1 deploy/runtime scaffolding `source-wired`; live host/provider/runtime proof still `pending`
Scope: production runtime implementation pass, local tool-call bridge repair, deploy/networking research note, and synthesis of capacity/economics notes

## What changed

This session implemented the first production-runtime pass from the re-sequenced roadmap. It is intentionally
source-wired only; no live VPS, provider, or funded LLM proof was claimed.

Code/source changes:
- Added `docs/production-runtime-implementation-research.md`, grounding the implementation in current package/infra choices: Docker/Compose, Caddy, Hono, Next standalone output, MCP transport, Supabase/pg, and OpenAI-compatible tool calls.
- Added `infra/deploy/`:
  - `docker-compose.yml` for fixed core services (`manager`, `web`, `caddy`) with healthchecks, `restart: unless-stopped`, log rotation, and a shared `amtech_runtime` user-defined bridge network.
  - `manager.Dockerfile`, `web.Dockerfile`, `.env.production.example`, `README.md`.
  - The Web Docker path uses Next `output: "standalone"` via `apps/web/next.config.mjs`.
- Updated `infra/caddy/Caddyfile` to read upstreams from env (`WEB_UPSTREAM`, `MANAGER_UPSTREAM`) so the same file works with localhost dev and Compose service DNS.
- Added `apps/manager/src/lib/caddy-activation.ts` and `command-runner.ts`. Provisioning now calls `writeAndActivateCaddySnippet()` rather than only writing a snippet:
  - write candidate snippet;
  - run optional `CADDY_VALIDATE_COMMAND`;
  - run optional `CADDY_RELOAD_COMMAND`;
  - run optional `CADDY_SMOKE_COMMAND`;
  - rollback snippet + best-effort reload on failure.
- Updated Caddy employee snippet rendering so production can route to dynamic employee containers by Docker DNS alias (`CADDY_EMPLOYEE_UPSTREAM_HOST=amtech-hermes-{{EMPLOYEE_ID}}`) instead of assuming host `localhost`.
- Hardened `infra/scripts/local/start-hermes-container.sh` and added `infra/scripts/deploy/start-hermes-container.sh` wrapper:
  - pinned default `HERMES_VERSION=0.18.0`;
  - `HERMES_DOCKER_IMAGE=hermes-agent:${HERMES_VERSION}`;
  - `--restart=unless-stopped`;
  - `--network` + `--network-alias`;
  - Docker labels for account/employee/profile;
  - `local` log driver + max size/file opts;
  - existing cap drop, no-new-privileges, memory/CPU/PID limits retained.
- Added `apps/manager/src/lib/employee-lifecycle.ts` and `infra/scripts/employee-lifecycle.mjs` for label/name-based start-point lifecycle actions (`inspect`, `restart`, `stop`, `gc`).
- Wired admin lifecycle actions in `apps/manager/src/lib/admin.ts` so `suspend_employee`, `resume_employee`, and `disable_employee` call the lifecycle command when configured. In local/test env this safely records `employee_lifecycle_command:skipped`.
- Fixed the local model bridge (`infra/scripts/local/model-bridge-lib.mjs`, `model-bridge.mjs`) so JSON-shaped tool calls normalize into real OpenAI-style `message.tool_calls`, and streaming emits indexed `delta.tool_calls`. This directly targets the previous failure mode where Hermes saw tool calls as assistant text.
- Added `infra/scripts/local/tool-loop-proof.mjs` and `npm run local:tool-loop-proof`. It sends an owner turn and polls for concrete local proof rows: employee tool audit, artifact, approval. It is local proof only; it does not mark runtime/provider acceptance.
- Added deploy/operator npm aliases:
  - `npm run ops:employee-lifecycle`
  - `npm run deploy:smoke`
  - `npm run deploy:rollback`
  - `npm run local:tool-loop-proof`

Focused tests added/updated:
- `tests/unit/caddy-activation.test.ts`
- `tests/unit/employee-lifecycle.test.ts`
- `tests/unit/hermes-container-script.test.ts`
- `tests/unit/model-bridge.test.ts`

## Why

The 2026-07-11 deploy-readiness review found the product surfaces were ahead of the operational layer:
core services were not supervised, employee launch was an undefined env string, Caddy snippets were never
reloaded, per-employee lifecycle did not exist, and the local model bridge could still strand tool calls
as text. This pass turns those findings into concrete source seams and pass/fail hooks without pretending
the box has run in production.

Important networking insight from implementation:
- In local scripts, Caddy can reverse-proxy employee gateways through host loopback.
- In Compose production, Caddy is itself a container, so `localhost:<gateway_port>` points at Caddy, not the host or employee. The better production shape is a shared user-defined Docker bridge network (`amtech_runtime`) where Caddy resolves dynamic employee containers by DNS alias (`amtech-hermes-<employee_id>`), while the employee gateway port can still be bound to host loopback for operator smoke/debug.
- Employee-to-Manager traffic remains the opposite direction: employee containers reach Manager through Compose service DNS (`http://manager:8080`) in production, or `host.docker.internal` in local Docker testing.

## Current status

Source status:
- P0 deploy scaffolding is now `source-wired`: compose file, Dockerfiles, Caddy reload/rollback seam, pinned employee launch script, lifecycle helper, deploy smoke/rollback scripts.
- P1 bridge behavior is source-fixed at the OpenAI response-shape layer: tool calls are normalized and streamed as `tool_calls`.
- Deterministic local core-loop proof script exists but was not run end-to-end in this session because the live local stack/provider creds were not available in this shell.

Not accepted:
- No live VPS proof.
- No `docker compose up` proof against the production compose stack.
- No real Caddy reload proof on a host Caddy daemon.
- No live Hermes runtime acceptance ID.
- No provider proof IDs (Twilio/Gmail/PubSub/Stripe/QBO).
- No claim that the local bridge makes Haiku reliable at multi-step business workflows; it only fixes the transport shape so Hermes can see tool calls as tool calls.

Acceptance vocabulary remains unchanged: this is `source-wired`, not `runtime-accepted` or `provider-accepted`.

## Verification

Passed:
- `npm run test:unit -- tests/unit/caddy-activation.test.ts tests/unit/employee-lifecycle.test.ts tests/unit/hermes-container-script.test.ts tests/unit/model-bridge.test.ts tests/unit/admin-routes.test.ts`
  - 5 files / 25 tests passed.
- `npm run typecheck` — passed.
- `npm run build` — passed, including Next standalone production build.
- `npm run lint` — passed.
- `npm run test:integration` — 6 files / 11 tests skipped cleanly (env-gated).
- `npm run acceptance:report` — passed honestly with 0 pass / 0 fail / 9 not-run, all missing env listed; wrote gitignored report `infra/acceptance/reports/phase01-2026-07-11T15-41-46-934Z.*`.
- Isolated `npm run test:unit -- tests/unit/artifact-resolve.test.ts` — passed 8 tests.

Expected/known failures:
- Full `npm run test:unit` still fails because `tests/unit/gmail-pubsub.test.ts` has the pre-existing 5s timeout documented in the 11:20 memory note. During the full parallel run, `admin-routes` and `artifact-resolve` also showed hook timeouts/skips around the hung suite; both focused route suites pass when isolated/focused, and the focused admin suite passed earlier in this session. Treat the Gmail timeout as the blocker to clean full-unit truth before claiming "all unit tests green."
- `npm run acceptance:preflight` exits nonzero because this shell has no live env. It correctly reported 0/9 runnable and all missing credentials. This is expected given the founder note that live LLM/provider creds are still days out.

## Capacity/economics notes synthesis

The stream-of-consciousness capacity notes should be treated as hypotheses, not architecture facts. They are useful directionally but not source-verified and not benchmarked against AMTECH's Hermes profile.

High-confidence product/system conclusions:
- For the current contractor/bookkeeper/services ICP under roughly $10M/year, assume **one AI Employee per business** for now, not a "swarm" of Hermes agents. The business has a low logical ceiling on useful daily office work; the product relationship is one employee, one thread, one Work Surface.
- Do **not** spend near-term engineering on suspend-to-zero / sleep-wake orchestration. The current architecture can keep each employee container resident and mostly idle. The real P0/P1 problem is reliability, tool-loop correctness, proof, and lifecycle/recovery, not cold-start optimization.
- Initial commercial deployment should use **pods/nodes**, not one giant shared fleet. A 16-24 core / 64-128GB node is a better first commercial unit than a 48-core / 256GB+ mega-node because it limits blast radius and makes capacity experiments cheap.
- Treat capacity as "employees per node" rather than "agents per customer." For early pilots, use a conservative cap that leaves room for runaway browser/tool work, logs, Postgres/network spikes, Caddy/Web/Manager overhead, and operator debugging.

Reasonable starting assumptions to benchmark, not promises:
- If reserving ~2GB RAM per resident employee container, a 64GB host should be treated as roughly **20-25 employees** at first, not 30+ in production. Leave more than a tiny OS buffer: core services, Docker overhead, logs, Caddy, package caches, and the operator/debug path all need headroom.
- A 16-core / 32-thread host is probably enough for 20-25 mostly I/O-bound employees using remote LLMs, but browser automation, local compiles, Python tools, OCR/PDF processing, or runaway terminal loops can shift the bottleneck to CPU quickly.
- A 48-core / 256GB host could likely hold many more idle/resident employees, but the correct first scaling model is probably "add Pod Beta" before "put 150 first customers on Pod Alpha."
- Do not encode "120-180 active agents" or "400 idle agents" anywhere as AMTECH truth until a real soak test proves it with Hermes v0.18.x, the AMTECH profile, representative tools, and real Caddy/Manager/Web sidecars.

Benchmark plan before pricing infrastructure confidently:
- Add a synthetic load harness that starts N employee containers with the real profile template and Manager MCP config, then measures:
  - idle RSS/PSS per container;
  - CPU idle and active spikes;
  - file descriptors;
  - Docker network latency to Manager and Caddy;
  - Caddy route latency across dynamic aliases;
  - disk/log growth per day;
  - time to restart all containers after reboot;
  - behavior when one employee runs a pathological terminal/browser task.
- Test tiers: N=5, 10, 20, 30 on the first node. Do not extrapolate beyond the largest clean test.
- Define a pod cap from p95/p99 resource usage, not average usage.

Future wiki/product note candidate:
- In GTM/product docs, keep saying "one AI Employee for the business" for this ICP. Avoid swarm language for contractors/bookkeepers under $10M unless a later product tier genuinely needs multiple specialist employees.

## Files / seams touched

Representative source:
- `apps/manager/src/lib/caddy-activation.ts`
- `apps/manager/src/lib/employee-lifecycle.ts`
- `apps/manager/src/provisioner.ts`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/admin.ts`
- `infra/scripts/local/start-hermes-container.sh`
- `infra/scripts/deploy/start-hermes-container.sh`
- `infra/deploy/docker-compose.yml`
- `infra/caddy/Caddyfile`
- `infra/scripts/local/model-bridge-lib.mjs`
- `infra/scripts/local/model-bridge.mjs`
- `infra/scripts/local/tool-loop-proof.mjs`
- `apps/web/next.config.mjs`

Docs:
- `docs/production-runtime-implementation-research.md`
- this handoff + `MEMORY.md` index

Tests:
- `tests/unit/caddy-activation.test.ts`
- `tests/unit/employee-lifecycle.test.ts`
- `tests/unit/hermes-container-script.test.ts`
- `tests/unit/model-bridge.test.ts`

## Carry-forward / next

Immediate next implementation:
1. Run the local stack with the new launch script and execute `npm run local:tool-loop-proof`. Pass means concrete local IDs for employee tool audit, artifact, approval. Fail means inspect Hermes logs and Manager MCP transport before touching product UI.
2. Run `docker compose -f infra/deploy/docker-compose.yml --env-file infra/deploy/.env.production up -d --build` on a VPS-like host and fix any Dockerfile/standalone path issues. Do not claim runtime acceptance; just prove the core services start and healthcheck.
3. Test Caddy activation against a real Caddy daemon. Verify bad snippet rollback leaves existing routes alive.
4. Add a reprovision command that can rerender an old employee with a fresh scoped MCP credential, restart the container, run MCP handshake/tool-list proof, then clear `needs_reprovision`.
5. Add the capacity benchmark harness described above before making hard claims about employees per node or pricing per customer.

Open risks:
- `infra/deploy/manager.Dockerfile` mounts `/var/run/docker.sock` so Manager can launch employee containers. This is operationally simple but high blast-radius; next hardening pass should consider a narrower host-side provisioner/lifecycle daemon or Docker API proxy with restricted verbs.
- Egress control remains open. Employee containers still need a default-deny outbound design with explicit Manager/provider allowlist before paid pilots.
- Backups/DR and observability/alerting are still P1/P2 from the deploy-readiness review.
- Full unit suite remains blocked by pre-existing Gmail Pub/Sub timeout.
