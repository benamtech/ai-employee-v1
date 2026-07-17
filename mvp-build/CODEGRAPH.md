# CODEGRAPH.md — AMTECH AI Employee build map

Status: active
Updated: 2026-07-17
Active branch: `research` (rebased onto latest `main`)

## Cold-session read order

1. `../identity.md`
2. this file
3. `memory/MEMORY.md`, then the newest relevant handoff
4. `CLAUDE.md` or `AGENTS.md`
5. `docs/production-normal-employee-live-deploy-runbook.md` for launch/live work
6. `../wiki/MVP/second-half-current-and-future-state.md`
7. `../wiki/MVP/implementation-records/README.md`
8. relevant source, migrations, scripts, and proof artifacts

Source, migrations, scripts, proofs, and newest memory outrank older documentation.

## What AMTECH is building now

AMTECH installs a persistent AI Employee for owner-operated small businesses, beginning with painters, landscapers, and adjacent service contractors. The owner experiences one employee through web, SMS, signed review links, and connected business tools. Manager is the invisible control plane; Hermes is the agent substrate.

The product is not a chatbot, estimator, CRM, or workflow-builder category. It is always-on intelligent software that notices work, remembers business context, prepares artifacts and communication, follows up, asks permission at trust/money/reputation gates, and leaves proof.

## Canonical normal-employee launch path

```text
public DNS / Cloudflare Tunnel
-> Caddy
-> production Web + Manager
-> real /create-ai-employee
-> Twilio Verify
-> account creation
-> Start Employee
-> host-private provisioning
-> isolated Hermes runtime
-> owner web client
-> provider-backed reply
-> useful connected-tool proof
```

`docs/production-normal-employee-live-deploy-runbook.md` is authoritative for this path.

The public estimator and `prod-like:public-estimator:*` scripts are outdated acquisition/regression aids. They are non-canonical for product UX, pricing, profile design, and normal-employee launch acceptance. Local fixtures, `/api/dev/login`, host `live:*`, and manually injected provider results are also not launch proof.

## Acceptance vocabulary

| Status | Meaning |
|---|---|
| `source-wired` | Source/schema/config exists. State exactly which static/local checks ran. |
| `provider-accepted` | Real provider proof IDs exist. |
| `runtime-accepted` | Real runtime/host proof artifacts exist. |
| `planned` | Designed, not implemented. |
| `pending` | Unattempted, blocked, or missing proof. |

**Current overall status: `source-wired_not_accepted`.** Existing point-in-time live proofs remain historical evidence, but the WS1/WS2 boundary changes have not been build-, migration-, hostile-runtime-, or provider-accepted.

## Current production state

| Area | Status | Current truth |
|---|---|---|
| Normal employee path | canonical | Public onboarding through owner web and provider-backed reply is the only launch path. |
| Owner product | source-wired | Home / Talk / Proof / Connected, Tell Avery, approval/review resources, persisted conversation, SSE/poll fallback, and owner-safe materialization are implemented. |
| Manager + Hermes runtime spine | source-wired | Provisioning, scoped Manager MCP, owner turns, event routing, approvals, connectors, artifacts, scheduler, metering, admin, and runtime seams exist. |
| WS1 model gateway | source-wired | Employee profiles receive gateway URL, employee-scoped token, alias, credential version, and non-secret policy; provider master keys stay behind the host-private gateway. |
| WS1 profile integrity | source-wired | Rendering rejects forbidden secret slots/values and unresolved tokens, freezes permissions, and computes a deterministic checksum. |
| WS2 reconciler foundation | source-wired foundation | Resource graph, transition evidence, leases, retry classes, commands, drift operations, credential rotation, and compensation vocabulary exist. Provisioning still runs inline; a true worker loop is pending. |
| WS3 ambient inbox | groundwork only | `ambient_event_inbox` exists, but Twilio/Gmail/Stripe/provider webhooks are not fully migrated to inbox-first leased processing. |
| Runtime boundary | source-wired, live proof pending | Host-private provisioner, private employee bridges, loopback runtime ports, immutable profile mounts, and gateway custody exist in source. Hostile/runtime proof is pending. |
| GTM | canonical | Start free; managed AI Employee from $400/month; higher-volume workforce is custom. |
| Public website | next major frontier | Rewrite from first principles using `docs/amtech-website-rewrite-brief.md`. |

## WS1 — model gateway credential custody

Primary files:

- `apps/manager/src/lib/model-gateway.ts`
- `apps/manager/src/model-gateway-server.ts`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/runtime-profile-integrity.ts`
- `packages/shared/src/model-gateway.ts`
- `packages/shared/src/profile-package.ts`
- `packages/agent-template/config.yaml`
- `packages/agent-template/.env.tpl`
- `infra/deploy/docker-compose.production.yml`
- `infra/scripts/local/start-hermes-container.sh`

Boundary:

```text
employee runtime
-> employee-scoped model-gateway credential
-> host-private OpenAI-compatible gateway
-> provider master credential
```

Production profiles must not contain provider master keys or provider-specific master-key slots. Local direct-provider mode is an explicit non-production exception only.

## WS2 — durable provisioning and reconciliation foundation

Primary files:

- `apps/manager/src/lib/provisioning-state-machine.ts`
- `apps/manager/src/tools/provisioning.stub.ts`
- `apps/manager/src/provisioner-host.ts`
- `packages/db/migrations/0031_runtime_boundary_foundations.sql`
- `packages/db/migrations/0032_gateway_reconciler_inbox_foundations.sql`
- `packages/db/migrations/0033_provisioning_operation_key_retry_idx.sql`

Desired loop:

```text
claim job or command
-> inspect observed resources
-> decide next transition
-> apply one bounded effect
-> verify evidence
-> persist state
-> retry, compensate, or continue
```

The schema and helper layer exist. The production reconciler worker, unified admin command path, drift scan/repair loop, and deterministic recovery remain pending.

## Security and realness invariants

1. Manager must not own public arbitrary Docker authority; host lifecycle authority stays behind the signed Unix-socket provisioner boundary.
2. Employee runtimes receive scoped credentials, never provider or platform master secrets.
3. Customer-, money-, and reputation-affecting actions require the appropriate owner approval gate.
4. Webhooks verify provider authenticity before durable insertion and asynchronous processing.
5. RLS and grants are reviewed for every browser-visible or control-plane table.
6. No capability becomes accepted without real proof IDs/artifacts.
7. Welcome delivery and provider/channel binding occur only after runtime and route acceptance.
8. One owner relationship; Manager remains invisible.

## Static review findings requiring proof or repair

- Apply `0031`–`0033` to a disposable production-shaped DB and verify constraints, indexes, grants, and existing row compatibility.
- Verify shared exports, Hono server entry/build inclusion, Supabase row shapes, and `ProvisionerResult` fields through typecheck.
- The model-gateway rate bucket is process-local; spend-limit enforcement is not yet a transactional accumulated-usage budget.
- Failed host-provisioner executions can leave filesystem idempotency markers without a cached result; retry behavior needs a deterministic cleanup/new-key rule.
- Compensated provisioning retry semantics need validation because fresh idempotency-key generation is explicit only for failed jobs.
- Credential rotation rewrites profile token/checksum, but runtime reload and old-credential revocation sequencing require live proof.
- Drift inspection currently establishes primitives, not a complete fleet-wide orphan/missing/stuck-resource reconciler.

## Now-to-live checklist

### P0

- [x] Rebase `research` onto latest `main`.
- [ ] Apply/review migrations `0031`–`0033` on a disposable production-shaped DB.
- [ ] Run static TypeScript import/API review through typecheck.
- [ ] Prove employee runtimes reach the loopback-bound host-private model gateway and public ingress cannot.
- [ ] Prove model-gateway credential rotation updates token/checksum without full reprovision and revokes the prior credential safely.
- [ ] Prove rendered profiles reject master-key names, configured secret values, unresolved tokens, and unsafe permissions.
- [ ] Implement the DB-backed provisioning reconciler worker.
- [ ] Implement fleet drift detection/repair for orphan containers/networks, stale Caddy, missing profile/checksum, expired credentials, and stuck jobs.
- [ ] Ensure Twilio/provider binding and welcome effects occur only after runtime + route acceptance.

### P1

- [ ] Migrate Twilio/Gmail/Stripe/provider ingress to `ambient_event_inbox` with leased workers, retries, dead letters, and replay.
- [ ] Route admin suspend/reprovision/rotate/repair through `provisioning_commands` and the reconciler.
- [ ] Provision a fresh normal employee through public onboarding and capture real provider/runtime/tool proof IDs.

## Layout

```text
apps/web/                 public onboarding + owner surfaces
apps/manager/             control plane, gateway, tools, events, provisioning
packages/shared/          contracts and schemas
packages/db/migrations/   durable DB state and security boundaries
packages/agent-template/  rendered Hermes employee profile
infra/deploy/              production Compose and images
infra/scripts/             deploy, runtime, proof, and repair helpers
docs/                      runbooks, security, GTM, UX, operations
memory/                    durable session handoffs
second-half-plan/          active forward-plan family
```

## Validation state for the 2026-07-17 reconciliation

No full build, typecheck, unit suite, migration application, Compose run, browser flow, provider call, hostile-runtime probe, or proof artifact was run. Documentation and static reasoning only.