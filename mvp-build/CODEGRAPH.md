# CODEGRAPH.md — AMTECH AI Employee build map

Status: active
Updated: 2026-07-17
Active branch: `employee-work` (based on `research`; draft PR `#19` targets `research`; closed PR `#18` is superseded)

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
-> durable provisioning request
-> leased DB-backed reconciler
-> signed host-private provisioner
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

**Current overall status: `source-wired_not_accepted`.** The worker, ingress, and isolation boundaries now exist in source, but migrations `0032`–`0038` are unapplied and no build-, runtime-, provider-, or browser-acceptance packet has completed for the patched branch head.

## Current production state

| Area | Status | Current truth |
|---|---|---|
| Normal employee path | canonical | Public onboarding through owner web and provider-backed reply is the only launch path. |
| Owner product | source-wired | Home / Talk / Proof / Connected, Tell Avery, approval/review resources, persisted conversation, SSE/poll fallback, and owner-safe materialization are implemented. |
| Manager + Hermes runtime spine | source-wired | Provisioning, scoped Manager MCP, owner turns, event routing, approvals, connectors, artifacts, scheduler, metering, admin, and runtime seams exist. |
| WS1 model gateway | source-wired | Employee-bound routes and credentials, host-private gateway custody, fail-closed token checks, and production-unbound-route rejection are implemented. |
| WS1 profile integrity | source-wired | Rendering rejects forbidden secret slots/values and unresolved tokens, freezes permissions, computes a deterministic checksum, and recreates the runtime on credential rotation. |
| WS2 reconciler | source-wired, migration/runtime proof pending | A continuously running DB-backed worker claims jobs/commands, applies one bounded effect, verifies/persists, retries or compensates, reconstructs after reboot, and schedules fleet drift inspection/repair. |
| WS3 ambient inbox | source-wired, migration/provider proof pending | Twilio, Gmail, Stripe, and QuickBooks verify authenticity before inbox insertion; leased processing, retries, ordering, dead letters, effect receipts, and replay exist. |
| Runtime boundary | source-wired, live proof pending | Host-private provisioner, private employee bridges, loopback runtime ports, immutable profile mounts, in-container gateway/health probes, and gateway custody exist in source. |
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
-> employee-bound host-private gateway URL
-> employee-scoped model-gateway credential
-> host-private OpenAI-compatible gateway
-> provider master credential
```

Production profiles must not contain provider master keys or provider-specific master-key slots. Local direct-provider mode is an explicit non-production exception only.

## WS2 — durable provisioning and reconciliation

Primary files:

- `apps/manager/src/lib/provisioning-state-machine.ts`
- `apps/manager/src/lib/provisioning-reconciler.ts`
- `apps/manager/src/tools/provisioning.stub.ts`
- `apps/manager/src/provisioner.ts`
- `apps/manager/src/provisioner-host.ts`
- `packages/db/migrations/0031_runtime_boundary_foundations.sql`
- `packages/db/migrations/0032_gateway_reconciler_inbox_foundations.sql`
- `packages/db/migrations/0033_provisioning_operation_key_retry_idx.sql`
- `packages/db/migrations/0034_reconciler_workers_and_ambient_replay.sql`
- `packages/db/migrations/0035_worker_terminal_claim_and_effect_receipts.sql`
- `packages/db/migrations/0036_worker_service_role_grants.sql`
- `packages/db/migrations/0037_welcome_effect_ready_gate.sql`
- `packages/db/migrations/0038_needs_reprovision_command_trigger.sql`

Implemented loop:

```text
claim job or command
-> inspect observed resources
-> decide next transition
-> apply one bounded effect
-> verify evidence
-> persist state
-> retry, compensate, or continue
```

Strict initial ordering:

```text
requested
-> resources_reserved
-> credentials_minted
-> profile_rendered
-> runtime_started
-> runtime_healthy
-> routing_activated
-> channel_configured
-> welcome_sent
-> ready
```

The database prevents `ready` until the welcome inbox event is processed and an idempotent owner-facing welcome message exists.

## WS3 — verified ambient ingress

Primary files:

- `apps/manager/src/lib/ambient-inbox.ts`
- `apps/manager/src/webhooks/twilio.ts`
- `apps/manager/src/webhooks/gmail.ts`
- `apps/manager/src/webhooks/stripe.ts`
- `apps/manager/src/webhooks/quickbooks.ts`

Boundary:

```text
provider request
-> provider authenticity verification
-> atomic ambient_event_inbox insertion
-> lease + ordering check
-> existing business handler
-> effect receipt / durable evidence
-> processed, retry, waiting-for-binding, or dead letter
```

## Security and realness invariants

1. Manager must not own public arbitrary Docker authority; host lifecycle authority stays behind the signed Unix-socket provisioner boundary.
2. Employee runtimes receive scoped credentials, never provider or platform master secrets.
3. Customer-, money-, and reputation-affecting actions require the appropriate owner approval gate.
4. Webhooks verify provider authenticity before durable insertion and asynchronous processing.
5. RLS and explicit service-role grants are reviewed for every browser-visible or control-plane table.
6. No capability becomes accepted without real proof IDs/artifacts.
7. Welcome delivery and provider/channel binding occur only after runtime and route acceptance.
8. One owner relationship; Manager remains invisible.

## Static review findings requiring proof or repair

- The connected live Supabase project stops at `0031_public_estimator.sql`; apply/review `0032`–`0038` in staging before deploying this source.
- CI runs `24`–`26` validated shared/db setup and exposed Manager contract failures. The exact four remaining Manager errors were repaired on the branch, but a clean end-to-end run for the patched head is still pending.
- The model-gateway rate bucket remains process-local; spend-limit enforcement is not yet a transactional accumulated-usage budget.
- Host idempotency-marker recovery and fresh compensated retry keys are source-wired but need crash/retry acceptance.
- Credential rotation sequencing is source-wired but requires live checksum/new-token/old-token-rejection proof.
- Fleet drift inspection/repair is source-wired but needs orphan/missing/stuck-resource acceptance across a deployed fleet.
- Ambiguous irreversible provider effects deliberately dead-letter; the operator inspection/replay UX remains incomplete.
- No provider-backed generated work object closes the product acceptance loop yet.

## Now-to-live checklist

### P0 source implementation

- [x] Rebase working base through `research`; keep `main` untouched.
- [x] Add shared exports, Hono entrypoint, Supabase row-shape, `ProvisionerResult`, and image-inclusion checks.
- [x] Bind Model Gateway credentials/routes to employees and keep public ingress absent.
- [x] Enforce rendered-profile secret/token/checksum integrity.
- [x] Implement the DB-backed provisioning reconciler worker.
- [x] Implement failed-marker recovery, fresh compensated retry keys, reboot reconstruction, and fleet drift commands.
- [x] Enforce runtime -> routing -> provider binding -> welcome ordering.

### P0 acceptance still required

- [ ] Obtain a clean shared/db/Manager typecheck, boundary-test, and production-image build run.
- [ ] Apply/review migrations `0032`–`0038` on a disposable production-shaped database.
- [ ] Prove two employee runtimes reach only their employee-bound host-private Model Gateway route and public ingress cannot.
- [ ] Prove malformed, expired, revoked, and cross-employee credentials fail through real HTTP.
- [ ] Prove credential rotation updates live token/checksum, recreates a healthy runtime, and rejects the prior credential.
- [ ] Prove reboot reconstruction, fleet drift repair, failed-marker recovery, compensation, and fresh retry keys.

### P1 source implementation

- [x] Migrate Twilio, Gmail, Stripe, and QuickBooks ingress to verified inbox-first leased processing with retries, dead letters, effect receipts, and replay.
- [x] Route suspend, reprovision, restore/rotate, teardown, inspect, and repair through `provisioning_commands` and the reconciler.

### P1 acceptance still required

- [ ] Exercise real duplicate ingress, waiting-for-binding, retry, dead-letter, and replay paths for each provider.
- [ ] Provision a fresh normal employee through public onboarding and capture real provider/runtime/tool proof IDs.
- [ ] Produce one provider-backed generated work object and validate its owner-facing UI/actions/proof.

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

## Validation state for the 2026-07-17 employee-work pass

Read-only live Supabase catalog inspection ran and confirmed the migration frontier stops at `0031`. Source, migrations, tests, typeproofs, a CI workflow, and production-image assertions were added. CI runs `24`–`26` passed the shared/db stages and surfaced/focused the Manager contract errors; those four errors are fixed on the current branch. No clean patched-head Actions run, migration application, Compose run, browser flow, provider call, hostile-runtime probe, or runtime/provider proof artifact is claimed.
