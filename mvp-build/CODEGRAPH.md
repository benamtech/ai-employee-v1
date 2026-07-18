# CODEGRAPH.md — AMTECH AI Employee build map

Status: active
Updated: 2026-07-17
Active branch: `employee-work` (based on `research`; draft PR `#19` targets `research`; `main` is untouched)

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
| `source-wired` | Source/schema/config and executable proof machinery exist; state exactly which static or CI checks ran. |
| `provider-accepted` | Real external-provider proof IDs exist. |
| `runtime-accepted` | Real employee runtime/host proof artifacts exist. |
| `planned` | Designed, not implemented. |
| `pending` | Unattempted, blocked, or missing proof. |

**Current overall status: `source-wired_ci-accepted_not-live-accepted`.** Actions run `29618584037` passed the complete production-boundary gate on commit `249b4a7c8895449fe87727f0d31af7c7580d9f4d`: all 39 migrations and worker behavior checks, shared/database/Manager typechecks and builds, acceptance-script syntax, 27 focused tests, and the production Manager image build. Production Supabase still stops at `0031_public_estimator.sql`; no live runtime/provider/browser packet is claimed.

## Current production state

| Area | Status | Current truth |
|---|---|---|
| Normal employee path | canonical | Public onboarding through owner web and provider-backed reply is the only launch path. |
| Owner product | source-wired | Home / Talk / Proof / Connected, Tell Avery, approval/review resources, persisted conversation, SSE/poll fallback, and owner-safe materialization are implemented. |
| Manager + Hermes runtime spine | source-wired, CI green | Provisioning, scoped Manager MCP, owner turns, event routing, approvals, connectors, artifacts, scheduler, metering, admin, runtime seams, typecheck, and image inclusion are green. |
| WS1 Model Gateway | source-wired, HTTP-tested | Employee-bound routes and credentials, host-private custody, malformed/expired/revoked/cross-employee rejection, and production-unbound-route rejection are covered by Hono HTTP tests. |
| WS1 profile integrity | source-wired, test-accepted | Rendering rejects forbidden secret names/values and unresolved tokens, freezes files, computes a checksum, recreates runtime on rotation, and is covered by profile tests. |
| WS2 reconciler | source-wired, DB-behavior-accepted | The DB-backed worker claims jobs/commands, applies one bounded effect, verifies/persists, retries or compensates, reconstructs after reboot, and schedules fleet drift inspection/repair. PostgreSQL 17 behavior checks pass. |
| WS3 ambient inbox | source-wired, DB-behavior-accepted | Twilio, Gmail, Stripe, and QuickBooks verify before insertion; leased processing, retries, ordering, duplicate counters, dead letters, effect receipts, and replay exist. |
| Runtime boundary | source-wired, live proof pending | Host-private provisioner, private employee bridges, loopback gateway, immutable profile mounts, and in-container probes exist; real deployed proof remains pending. |
| Live acceptance harness | source-wired | Nine release-bound, fail-closed proof phases cover migrations, gateway isolation, credential matrix, rotation, recovery, ingress reliability, browser onboarding, and generated work. |
| GTM | canonical | Start free; managed AI Employee from $400/month; higher-volume workforce is custom. |
| Public website | next major frontier | Rewrite from first principles using `docs/amtech-website-rewrite-brief.md`. |

## WS1 — Model Gateway and profile isolation

Primary files:

- `apps/manager/src/lib/model-gateway.ts`
- `apps/manager/src/lib/model-gateway-http.ts`
- `apps/manager/src/model-gateway-server.ts`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/runtime-profile-integrity.ts`
- `packages/shared/src/model-gateway.ts`
- `packages/shared/src/profile-package.ts`
- `packages/agent-template/config.yaml`
- `packages/agent-template/.env.tpl`
- `infra/deploy/docker-compose.production.yml`
- `infra/scripts/local/start-hermes-container.sh`
- `tests/unit/model-gateway-http-isolation.test.ts`
- `tests/unit/model-profile-isolation.test.ts`

Boundary:

```text
employee runtime
-> employee-bound host-private gateway URL
-> employee-scoped Model Gateway credential
-> host-private OpenAI-compatible gateway
-> provider master credential
```

Production profiles must not contain provider master keys or provider-specific master-key slots. Local direct-provider mode is an explicit non-production exception only.

## WS2 — durable provisioning and reconciliation

Primary files:

- `apps/manager/src/lib/provisioning-state-machine.ts`
- `apps/manager/src/lib/provisioning-reconciler.ts`
- `apps/manager/src/lib/provisioner-idempotency.ts`
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
-> atomic duplicate-delivery evidence
-> lease + ordering check
-> business handler
-> effect receipt / durable evidence
-> processed, retry, waiting-for-binding, or dead letter
```

## Production-boundary CI gate

Workflow: `.github/workflows/employee-work-production-boundary.yml`

The gate performs:

1. PostgreSQL 17 plus Supabase-compatible roles, auth helpers, and Storage tables;
2. shared and database typecheck/build;
3. all 39 migrations from a blank database;
4. behavioral checks for RLS, grants, invoker functions, leases, terminal commands, ambient claims, welcome materialization, and reprovision triggering;
5. Manager/Hono typecheck and build;
6. syntax validation for every live acceptance script;
7. 27 focused production-boundary tests;
8. a real build of `infra/deploy/manager.Dockerfile`.

Green proof: Actions run `29618584037`, commit `249b4a7c8895449fe87727f0d31af7c7580d9f4d`.

## Live proof command matrix

Manifest: `infra/acceptance/production-boundary-live.json`

| Phase | Command |
|---|---|
| Staging migration application | `npm run prod:boundary:migrations` |
| Two-employee gateway + credential HTTP matrix | `npm run prod:boundary:gateway -- --employee-a=<id> --employee-b=<id>` |
| Credential rotation | `npm run prod:boundary:rotation -- --employee=<id> --allow-destructive` |
| Reboot, drift, compensation, marker recovery | `npm run prod:boundary:recovery -- --employee=<id> --allow-destructive` |
| Real provider duplicate/retry/dead-letter/replay | `npm run prod:boundary:ambient -- --provider=<name> --external-event-id=<id> --dead-letter-inbox=<id>` |
| Canonical public onboarding | `npm run prod:boundary:onboarding -- --onboarding-proof=<path>` |
| Provider-backed generated work object | `npm run prod:boundary:work-object -- --account=<id> --employee=<id>` |
| Consolidated release-bound validation | `npm run prod:boundary:validate -- --proof=<phase>:<path> ...` |

Every phase writes a redacted JSON proof, requires real identifiers and environment contracts, rejects fixture/dev bypasses, and is bound by the consolidated validator to one `AMTECH_RELEASE_SHA`. Destructive phases also require an exact employee allowlist and confirmation value.

## Security and realness invariants

1. Manager must not own public arbitrary Docker authority; host lifecycle authority stays behind the signed Unix-socket provisioner boundary.
2. Employee runtimes receive scoped credentials, never provider or platform master secrets.
3. Customer-, money-, and reputation-affecting actions require the appropriate owner approval gate.
4. Webhooks verify provider authenticity before durable insertion and asynchronous processing.
5. RLS and explicit service-role grants are reviewed for every browser-visible or control-plane table.
6. Worker claim functions use explicit service-role grants and `SECURITY INVOKER`, not privileged `SECURITY DEFINER` execution.
7. No capability becomes live-accepted without real proof IDs/artifacts.
8. Welcome delivery and provider/channel binding occur only after runtime and route acceptance.
9. One owner relationship; Manager remains invisible.

## Remaining risks and live acceptance

- The connected production Supabase project still stops at `0031_public_estimator.sql`; migrations `0032`–`0038` are not applied live.
- CI used a clean PostgreSQL 17 database with Supabase-compatible roles/schemas. A real Supabase preview branch or staging project apply remains a separate live step.
- Model Gateway rate counters remain process-local; strict multi-replica budget/rate enforcement still needs shared transactional metering.
- The worker currently runs in the Manager process; leases make replicas safe, but dedicated process separation and worker metrics may still be preferable.
- Ambiguous irreversible provider effects deliberately dead-letter; the backend replay contract exists, while a richer operator receipt-inspection UI remains future work.
- No real runtime/provider/browser proof from this branch is claimed until the live command matrix is executed.

## Now-to-live checklist

### Source and CI complete

- [x] Shared/database/Manager/Hono typecheck and build.
- [x] Production Manager image build.
- [x] Apply all migrations to a blank production-shaped database.
- [x] Verify `0032`–`0038` RLS, grants, leases, welcome gate, duplicate evidence, and reprovision behavior.
- [x] HTTP-test malformed, expired, revoked, and cross-employee credentials.
- [x] Test rendered-profile secret and unresolved-token isolation.
- [x] Test failed/stale idempotency-marker recovery.
- [x] Test inbox deduplication, effect receipt reuse, and dead-letter reset.
- [x] Source-wire all nine live proof phases and release-bound proof aggregation.

### Live execution still required

- [ ] Apply `0032`–`0038` to an actual Supabase preview/staging project and retain the proof.
- [ ] Run the two-employee private-gateway and credential matrix against deployed containers.
- [ ] Run live rotation and retain checksum, container, credential, and request IDs.
- [ ] Run reboot/drift/compensation/marker recovery on an explicitly disposable employee.
- [ ] Produce real provider duplicate/retry/dead-letter/replay evidence.
- [ ] Complete canonical public onboarding without dev bypasses.
- [ ] Produce one real provider-backed generated work object and owner-facing materialization proof.
- [ ] Aggregate every phase under the deployed release SHA.

## Layout

```text
apps/web/                 public onboarding + owner surfaces
apps/manager/             control plane, gateway, tools, events, provisioning
packages/shared/          contracts and schemas
packages/db/migrations/   durable DB state and security boundaries
packages/agent-template/  rendered Hermes employee profile
infra/deploy/              production Compose and images
infra/scripts/             deploy, runtime, proof, and repair helpers
infra/acceptance/          release-bound live proof manifest
memory/                    durable session handoffs
second-half-plan/          active forward-plan family
```
