# CODEGRAPH.md — AMTECH AI Employee build map

Status: active
Updated: 2026-07-18
Active integration branch: `employee-production-tuesday`, based on `research`; draft PR `#23` targets `research`; `main` is untouched

## Cold-session read order

1. `../identity.md`
2. this file
3. `memory/MEMORY.md`, then the newest relevant handoff
4. `CLAUDE.md` or `AGENTS.md`
5. `second-half-plan/phase-2-standard-remediation-execution.md`
6. `docs/production-normal-employee-live-deploy-runbook.md` for launch/live work
7. `../wiki/MVP/second-half-current-and-future-state.md`
8. relevant source, migrations, scripts, tests, and proof artifacts

Source, migrations, scripts, proofs, and newest memory outrank older documentation.

## What AMTECH is building

AMTECH installs a persistent AI Employee for owner-operated small businesses, beginning with painters, landscapers, and adjacent service contractors. The owner experiences one employee through web, SMS, signed review links, connected business tools, and later voice. Manager is the invisible control plane; Hermes is the agent substrate.

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
-> owner web/SMS/voice surfaces
-> provider-backed work and reply
-> governed connected-tool effects
-> commercial attribution and proof
```

`docs/production-normal-employee-live-deploy-runbook.md` is authoritative for launch execution.

The public estimator and `prod-like:public-estimator:*` scripts are outdated acquisition/regression aids. They are non-canonical for product UX, pricing, profile design, and normal-employee launch acceptance. Local fixtures, `/api/dev/login`, host `live:*`, and manually injected provider results are not launch proof.

## Acceptance vocabulary

| Status | Meaning |
|---|---|
| `source-wired` | Source/schema/config and executable proof machinery exist; state exactly which checks ran. |
| `ci-accepted` | A release-bound CI gate passed for the named SHA and scope. |
| `real-supabase-accepted` | The actual Supabase target or approved staging branch passed migrations and behavior checks. |
| `runtime-accepted` | Real employee runtime/host proof artifacts exist. |
| `provider-accepted` | Real external-provider proof IDs exist. |
| `browser/channel-accepted` | Fixture-free browser/SMS/voice proof exists. |
| `commercial-accepted` | Usage, payer/beneficiary attribution, and invoice reconciliation passed. |
| `planned` | Designed, not implemented. |
| `pending` | Unattempted, blocked, or missing proof. |

## Current overall status

**`standard-remediation_in-progress_source-and-ci-evidence_not-live-accepted_not-launch-cleared`**

### Control layer

- Approved execution program: `second-half-plan/phase-2-standard-remediation-execution.md`.
- Machine registry: `validation/phase-2-remediation-vectors.json`.
- Plan-integrity run `29638985374` passed all mapping, dependency, contract, and metric checks.
- Command board: issue `#25`.
- Integration PR: draft `#23`.

### Lane 1 — relationships and authorization

Checkpoint integrated at `b37d479a70983fcb3e88942b1f36481a07a97d17` from PR `#24`.

Source-wired and PostgreSQL behavior-accepted:

- C1 labor/domain relationship schemas;
- C2 authorization request/decision schemas;
- organizations, human principals, employee principals, assignments;
- employment, management, supervision, custody, access, authority, payer, and beneficiary records;
- deterministic compatibility IDs, provenance, and fail-closed launch topology;
- migrations `0039_labor_relationship_authorization_foundation.sql` and `0040_fix_assignment_authorization_policy_version.sql`;
- assignment-aware authorization helpers and initial `accounts`/`employees` RLS replacement;
- five-case relationship/RLS matrix green on run `29639593725` after the matrix exposed and corrected policy-version conflation.

Not closed:

- all active resources and routes are not yet assignment-scoped;
- SMS, signed resources, connectors, owner sessions, admin/support, and commercial consumers still require migration;
- real Supabase and browser/channel packets are pending;
- helper privilege design still requires a non-recursive invoker-policy solution or an explicit reviewed exception. Current helpers use narrowly scoped `SECURITY DEFINER` functions to avoid recursive RLS.

### Lane 3 — durable command/effect kernel

Draft PR `#26` is pre-implementation.

Current evidence:

- C3 shared contract compiles and its six invariant tests pass;
- stable intent, immutable command, claim, effect attempt, accepted/failed/ambiguous receipt, reconciliation, replay, and provider capability classes are distinct;
- run `29639915565` reached the intended missing-kernel red boundary; artifact digest `sha256:e686e08c62cf3cc4b2d5f8a924a5502c690c8792514afd736b791d04a43b2432`;
- no reusable command/effect migration exists yet.

Required correction before implementation:

- the effect-reservation concurrency assertion must not assume caller index `0` wins;
- pass means one unique effect ID and exactly one `duplicate=false` reservation regardless of scheduler order;
- recapture the missing-kernel red state after that correction, then implement SQL without weakening the matrix.

### Integrated branch validation

At Lane 1 integration head, Actions run `29639654226` passed plan integrity and run `29639654276` passed the existing production-boundary workflow, including:

- PostgreSQL 17 plus Supabase-compatible roles/schemas;
- all current migrations from a blank database;
- shared and database typecheck/build;
- worker migration behavior verification;
- Manager/Hono typecheck/build;
- acceptance-script syntax;
- focused production-boundary tests;
- production Manager image build.

These runs are CI evidence only. Production Supabase still stops at `0031_public_estimator.sql`.

## Existing product/runtime source map

### Owner product and surfaces

Primary areas:

- `apps/web/**`
- `apps/manager/src/server.ts`
- `apps/manager/src/lib/employee-stream.ts`
- `packages/shared/src/materialization.ts`
- `packages/shared/src/work-stream.ts`
- `packages/shared/src/preview-links.ts`

Current truth: Home / Talk / Proof / Connected, persisted conversation, signed review resources, approvals, owner-safe materialization, SSE/poll fallback, Connector Center, and generative-card seams are source-wired. Their authority and durable-effect paths are not fully standard-conforming until Lanes 1–3 and consumer lanes complete.

### Relationship and authorization foundation

Primary files:

- `packages/shared/src/relationship-contract.ts`
- `packages/shared/src/labor-relationship-record.ts`
- `packages/db/migrations/0039_labor_relationship_authorization_foundation.sql`
- `packages/db/migrations/0040_fix_assignment_authorization_policy_version.sql`
- `tests/unit/relationship-contract.test.ts`
- `tests/integration/relationship-authorization-matrix.test.ts`

Boundary:

```text
authenticated principal
-> explicit assignment/platform/system context
-> current relationship and role
-> resource grant and authority policy
-> allow/deny decision with version and evidence
-> assignment-scoped resource/action
```

### WS1 — Model Gateway and profile isolation

Primary files:

- `apps/manager/src/lib/model-gateway.ts`
- `apps/manager/src/lib/model-gateway-http.ts`
- `apps/manager/src/model-gateway-server.ts`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/runtime-profile-integrity.ts`
- `packages/shared/src/model-gateway.ts`
- `packages/shared/src/profile-package.ts`
- `infra/deploy/docker-compose.production.yml`
- `infra/scripts/local/start-hermes-container.sh`

Boundary:

```text
employee runtime
-> employee-bound host-private gateway URL
-> employee-scoped Model Gateway credential
-> host-private OpenAI-compatible gateway
-> provider master credential
```

Production profiles must not contain provider master keys. Durable multi-replica budgets, usage receipts, and assignment/payer attribution remain Lane 5 work.

### WS2 — provisioning and reconciliation

Primary files:

- `apps/manager/src/lib/provisioning-state-machine.ts`
- `apps/manager/src/lib/provisioning-reconciler.ts`
- `apps/manager/src/lib/provisioner-idempotency.ts`
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

Existing loop:

```text
claim job or command
-> inspect observed resources
-> decide next transition
-> apply one bounded effect
-> verify evidence
-> persist state
-> retry, compensate, or continue
```

These specialized workers remain useful but must incrementally consume C1–C5 rather than being treated as the universal command/effect protocol.

### WS3 — verified ambient ingress

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
-> duplicate-delivery evidence
-> lease + ordering check
-> assignment/binding resolution
-> business handler
-> durable effect receipt
-> processed, retry, waiting-for-binding, ambiguous, or dead letter
```

Assignment-safe connector custody and provider-backed packets remain Lane 6 work.

## Security and realness invariants

1. Account membership, bearer possession, caller-selected IDs, phone ownership, or mutable headers are never complete authority.
2. Every consequential customer work path resolves an explicit assignment or approved platform/system context.
3. Manager must not own public arbitrary Docker authority; host lifecycle authority stays behind the signed Unix-socket provisioner boundary.
4. Employee runtimes receive scoped credentials, never provider or platform master secrets.
5. Customer-, money-, reputation-, credential-, and destructive actions require the appropriate assignment-aware approval gate.
6. Webhooks verify provider authenticity before durable insertion and asynchronous processing.
7. Success for a consequential effect requires a durable accepted receipt; ambiguity is durable and operator-visible.
8. No capability becomes live-accepted without real proof IDs/artifacts bound to one release SHA.
9. The public estimator, fixtures, dev login, local host scripts, and manually injected events are not launch proof.
10. Documentation never promotes source/CI state into Supabase, runtime, provider, browser/channel, commercial, production, or market acceptance.

## Remaining launch blockers

- Complete P0-001/P0-002 relationship and isolation coverage across every route/resource/channel.
- P0 approval authority and replay-safe terminal action protocol.
- Durable reusable command/effect kernel and consumer migration.
- Revocable owner sessions and scoped service/admin identity.
- Transactional onboarding/Auth saga.
- Durable gateway budgets, usage, and payer/beneficiary attribution.
- Assignment-safe connector custody and provider ingress/effects.
- Turn/context/voice/worker recovery gates.
- Protocol/delegation versioning and research vectors.
- Complete CI, real Supabase, provider/runtime/browser/channel/commercial proof, production deployment, and claim reconciliation.

## Now-to-live checklist

### Current source/CI evidence

- [x] Approved remediation plan and 29-finding registry pass integrity CI.
- [x] C1/C2 contracts and initial relationship graph are integrated.
- [x] Initial five-case PostgreSQL relationship/RLS matrix is green.
- [x] Integrated branch migrations/builds/focused production-boundary workflow are green.
- [x] C3 contract tests are green.
- [ ] Correct and recapture Lane 3's scheduler-order-independent missing-kernel red harness.
- [ ] Implement and green the reusable command/effect database matrix.
- [ ] Close all consumer fault suites and P0/P1 gates.

### Live execution still required

- [ ] Apply the complete release migration set to an approved real Supabase staging target and retain proof.
- [ ] Prove cross-account, cross-employee, wrong-role, revocation, signed-resource, and channel isolation.
- [ ] Run canonical fixture-free onboarding through Twilio Verify and isolated runtime.
- [ ] Run provider-backed web/SMS/voice and connected-tool effects with durable receipts.
- [ ] Prove gateway budgets, usage, payer/beneficiary attribution, and invoice reconciliation.
- [ ] Run reboot, drift, compensation, duplicate intent/effect, ambiguity, reconciliation, and recovery tests.
- [ ] Aggregate every required packet under the exact deployed release SHA.
- [ ] Publish redacted proof ledger and reconcile public claims to evidence.

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
validation/                machine-readable remediation vectors
```