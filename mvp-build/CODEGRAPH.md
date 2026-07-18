# CODEGRAPH.md — AMTECH AI Employee build map

Status: active
Updated: 2026-07-18
Active integration branch: `employee-production-tuesday`, based on `research`; draft PR `#23` targets `research`; `main` is not the integration shortcut
Implementation proof anchor: `a9184be1af68ed6c5372d642928db46b51eb0506`

## Cold-session read order

1. `../identity.md`
2. this file
3. `memory/MEMORY.md`, then the newest relevant handoff
4. `STANDARD.md`
5. `second-half-plan/phase-2-standard-remediation-execution.md`
6. `CLAUDE.md` or `AGENTS.md`
7. `docs/production-normal-employee-live-deploy-runbook.md` for launch/live work
8. relevant source, migrations, scripts, tests, proofs, and release records

Source, migrations, executable proof, and newest memory outrank older documentation.

## What AMTECH is building

AMTECH installs a persistent AI Employee for owner-operated small businesses, beginning with painters, landscapers, and adjacent service contractors. The owner experiences one employee through governed web, SMS, signed review, and connected-system events. Voice is a future extension, not a launch acceptance gate.

Manager is the invisible control plane. Hermes is the agent substrate.

Hermes remains the execution/runtime layer for agent turns, transcript/session continuity, streaming, recovery, rotation, employee-local materialization, and memory behavior. Manager adds authenticated authority, exact assignment/grant resolution, durable command/effect semantics, approval, connector and credential custody, commercial provenance, revocation, repair, and release proof.

The product is not a chatbot, estimator, CRM, workflow builder, website framework, or model marketplace. It is always-on intelligent software that notices work, remembers business context, prepares artifacts and communication, follows up, asks permission at consequential gates, executes bounded effects, and leaves durable proof.

## Canonical execution boundary

```text
trigger
-> authenticated principal
-> exact assignment or approved platform/system context
-> current relationship, role, grant, policy, and authority version
-> stable durable intent
-> immutable command
-> atomic claim with bounded lease
-> Hermes or deterministic work
-> approval when required
-> one reserved bounded external effect
-> accepted, failed, or ambiguous durable receipt
-> deterministic replay or repair
-> role-safe web, SMS, signed-review, or connected-system surface
-> audit, metering, commercial attribution, revocation propagation, and release proof
```

The public estimator and `prod-like:public-estimator:*` scripts are outdated acquisition/regression aids. Fixtures, `/api/dev/login`, local `live:*`, and manually injected provider results are not launch proof.

For the production-shaped normal-employee path, use `docs/production-normal-employee-live-deploy-runbook.md`.

## Acceptance vocabulary

| Status | Meaning |
|---|---|
| `source-wired` | Source/schema/config exists; state exactly which checks ran. |
| `ci-accepted` | The named CI gate passed on the named SHA and scope. |
| `real-supabase-accepted` | The approved real Supabase target passed migration and behavior checks. |
| `runtime-accepted` | Real employee host/runtime proof artifacts exist. |
| `provider-accepted` | Real external-provider proof IDs exist. |
| `browser/channel-accepted` | Fixture-free web/SMS/signed-review proof exists. |
| `commercial-accepted` | Usage, payer/beneficiary, provider cost, and invoice reconciliation passed. |
| `production-ready` | Every non-waivable Standard gate is green on the exact deployed SHA. |
| `planned` | Designed, not implemented. |
| `pending` | Unattempted, blocked, or missing proof. |

Documentation-only commits after the implementation proof anchor do not automatically promote that anchor.

## Current overall status

**`standard-remediation_s2-s9-branch-ci-postgres-image-accepted_not-live-accepted_not-launch-cleared`**

Canonical current handoff: `memory/2026-07-18-s2-s9-authority-runtime-checkpoint.md`.

## Control layer

- Standard: `STANDARD.md`.
- Approved execution program: `second-half-plan/phase-2-standard-remediation-execution.md`.
- Machine registry: `validation/phase-2-remediation-vectors.json`.
- Command board: issue `#25`.
- Integration PR: draft `#23`.
- Root and scoped CODEGRAPHs plus `memory/MEMORY.md` are synchronized to the implementation proof anchor.

## Implemented checkpoint map

### Lane 1 — relationship, assignment, and authorization foundation

Integrated from PR `#24` at `b37d479a70983fcb3e88942b1f36481a07a97d17`.

Delivered:

- C1 labor/domain relationship schemas;
- C2 authorization request/decision schemas;
- organizations, human principals, employee principals, and employee assignments;
- employment, management, supervision, custody, access, authority, payer, and beneficiary records;
- deterministic compatibility IDs and provenance;
- migrations `0039`, `0040`, and the frozen `0042` assignment-scope/release-evidence spine;
- assignment-aware helpers and initial RLS replacement;
- executable consequential-surface registry and assignment-enforcement source spine.

Primary source:

- `packages/shared/src/relationship-contract.ts`
- `packages/shared/src/labor-relationship-record.ts`
- `packages/shared/src/authorization-scope-registry.ts`
- `packages/shared/src/assignment-resolver.ts`
- `packages/shared/src/session-enforcer.ts`
- `packages/db/migrations/0039_labor_relationship_authorization_foundation.sql`
- `packages/db/migrations/0040_fix_assignment_authorization_policy_version.sql`
- `packages/db/migrations/0042_assignment_scope_and_release_evidence_spine.sql`
- `tests/integration/relationship-authorization-matrix.test.ts`

### Lane 3 — durable command/effect kernel

Integrated from PR `#26` at `c94be46137b8c87b610ba0c4b48302bb2e944564`.

Delivered:

- C3 shared command/effect contract;
- stable intent registration and immutable command identity;
- actor, assignment, policy, payload-hash, correlation, and causation provenance;
- atomic claims with bounded lease reclaim;
- one effect reservation per assignment/effect key;
- provider capability classes;
- accepted, failed, and ambiguous receipts;
- receipt-gated completion and deterministic replay;
- ambiguity reconciliation for queryable/consumer-dedupe effects without a second external effect.

Primary source:

- `packages/shared/src/command-effect.ts`
- `apps/manager/src/lib/durable-command-runtime.ts`
- `packages/db/migrations/0041_durable_command_effect_kernel.sql`
- `packages/db/migrations/0061_ambiguous_command_reconciliation.sql`
- `tests/integration/command-effect-kernel.test.ts`
- `tests/integration/ambiguous-command-reconciliation.test.ts`

### S2/S3 — owner assignment, session, and signed-resource closure

Delivered:

- owner requests resolve current human principal, exact employee assignment, role, grant, action, and policy version;
- owner sessions enforce principal session and authority versions;
- Manager/web middleware rejects unresolved or mismatched assignment scope;
- new signed preview/action links require one exact assignment;
- preview links and artifact links carry issuance-time assignment authority versions;
- human-bound links also carry resolver authority versions;
- stale signed resources fail closed after relevant authority changes;
- historical unscoped rows are not promoted into authority.

Primary source:

- `apps/manager/src/lib/owner-assignment-authority.ts`
- `apps/manager/src/lib/owner-session.ts`
- `apps/manager/src/lib/preview-links.ts`
- `apps/manager/src/lib/signed-links.ts`
- `apps/manager/src/middleware/assignment-guard.ts`
- `apps/web/src/middleware/assignment-guard.ts`
- migrations `0053`, `0054`, `0060`, `0062`, and `0063`

### Owner web turn C3 closure

Delivered:

- stable browser intent IDs produce deterministic owner-turn commands/effects;
- owner messages register a C3 command before Hermes execution;
- duplicate retries replay the terminal response;
- queued/uncertain Hermes jobs become durable `ambiguous` receipts;
- repair inspects `employee_turn_jobs` and reconciles accepted/failed state without another model/provider invocation;
- inbound/outbound employee messages remain assignment-bound and idempotent.

Primary source:

- `apps/manager/src/lib/owner-turn-command.ts`
- `apps/manager/src/lib/owner-turn-repair.ts`
- `apps/manager/src/lib/runtime.ts`
- `apps/manager/src/lib/turn-queue.ts`
- `tests/unit/owner-turn-command-contract.test.ts`
- `tests/integration/ambiguous-command-reconciliation.test.ts`

### S5 — connector custody

Canonical ingress:

```text
provider authenticity
-> durable ambient inbox
-> durable connector binding
-> exact assignment and resource grant
-> stable dedupe
-> C3 command/effect
-> durable receipt
```

Delivered for Gmail, QuickBooks, Stripe, and assignment-bound Twilio:

- provider-verification metadata;
- resource and subject binding;
- exact assignment/employee-principal dimensions;
- lifecycle refresh and revocation state;
- stable provider-event dedupe;
- C3 processing and terminal receipts;
- Twilio route employee IDs remain routing hints, not authority.

Primary source:

- `packages/shared/src/connector-custody.ts`
- `apps/manager/src/lib/connector-custody.ts`
- `apps/manager/src/lib/ambient-inbox.ts`
- `apps/manager/src/webhooks/gmail.ts`
- `apps/manager/src/webhooks/quickbooks.ts`
- `apps/manager/src/webhooks/stripe.ts`
- `apps/manager/src/webhooks/twilio.ts`
- migrations `0043`–`0047`
- `tests/integration/connector-commercial-boundary.test.ts`

### S6 — commercial attribution and Model Gateway receipt gating

Canonical dimensions:

```text
assignment_id
+ current payer
+ current beneficiary
+ immutable price_version
+ provider receipt
+ accounting receipt
```

Delivered:

- durable commercial price versions;
- provider usage receipts and accounting receipt linkage;
- payer/beneficiary/price attribution on usage and invoice rows;
- transactional budget policy and usage rollups;
- assignment-bound Model Gateway credentials;
- no `ok` response until provider and accounting evidence is durable;
- provider success with uncertain accounting state becomes `ambiguous`;
- billing state remains separate from authorization.

Primary source:

- `packages/shared/src/commercial-attribution.ts`
- `apps/manager/src/lib/commercial-attribution.ts`
- `apps/manager/src/lib/model-gateway.ts`
- `apps/manager/src/lib/model-gateway-http.ts`
- migrations `0043`–`0047`
- `tests/integration/connector-commercial-boundary.test.ts`

### S7 — approval authority and execution

Delivered:

- immutable approval snapshots bind assignment, action, resource, policy, risk class, resolver roles, and required resolver action;
- legacy approvals require explicit promotion;
- durable signed review binds exact human resolver and assignment;
- current role/grant/policy, expiry, revocation, snapshot, and single-use state are checked;
- approval consumption is atomic under concurrency;
- approved provider actions revalidate authority and snapshot immediately before the effect;
- an approval cannot authorize a different assignment, action, resource, or changed policy snapshot.

Primary source:

- `packages/shared/src/approval-authority.ts`
- `apps/manager/src/lib/approval-authority.ts`
- `apps/manager/src/lib/approval-promotion.ts`
- `apps/manager/src/tools/approval-authority.stub.ts`
- `apps/manager/src/tools/approved-actions.stub.ts`
- `apps/manager/src/tools/qbo-approval-promotion.stub.ts`
- migrations `0048`–`0054`
- `tests/integration/approval-authority-boundary.test.ts`

### S8 — platform-admin and support authority

Status: source-wired and included in broad branch typecheck/migration/source validation. The dedicated exact-SHA Lane 8 workflow exists but a current-proof-anchor dispatch is not claimed here.

Delivered/source-wired:

- durable platform principals and roles;
- hashed `pad_` platform sessions with audience, version, expiry, and revocation;
- bounded recent step-up;
- exact account/employee/assignment support leases;
- read/write action classes and role evaluation;
- mutable legacy identity headers denied and audited;
- consequential support writes register C3 commands/effects and require accepted receipts;
- operator session/lease CLI;
- local-production contract and SDRT verification tooling.

Primary source:

- `packages/shared/src/platform-admin-authority.ts`
- `apps/manager/src/lib/platform-admin-runtime.ts`
- `apps/manager/src/lib/admin.ts`
- `infra/scripts/platform-admin-session.mjs`
- migrations `0055`, `0056`, `0057`, `0058_platform_*`, and `0059_platform_*`
- `.github/workflows/lane8-platform-admin-authority.yml`
- `tests/integration/platform-admin-authority-boundary.test.ts`

### S9 — authority-version revocation spine

Delivered:

- durable authority versions for human principals and employee assignments;
- version bumps on security-relevant lifecycle, principal, role, grant, policy, and credential changes;
- issuance-time versions on owner sessions, Hermes Manager MCP credentials, approvals, preview links, and artifact links;
- synchronous stale-consumer revocation/denial at the durable boundary;
- pending approval revocation for fully revoked assignments;
- execution-time approval authority-version check;
- leased `SKIP LOCKED` revocation outbox for runtime/cache teardown, alerting, and evidence delivery;
- new preview credentials require one exact assignment.

Primary source:

- `packages/shared/src/authority-version.ts`
- `apps/manager/src/lib/mcp-auth.ts`
- `apps/manager/src/lib/owner-session.ts`
- `apps/manager/src/lib/preview-links.ts`
- migrations `0057a`, `0058_authority_version_revocation_spine.sql`, `0059_authority_version_operational_closure.sql`, and `0060`–`0063`
- `tests/integration/authority-revocation-boundary.test.ts`
- `tests/integration/signed-resource-revocation-boundary.test.ts`

### Generated Manager production surface

The production Manager route surface is generated from a hash-pinned template.

Primary source:

- `apps/manager/src/server.template.ts`
- `apps/manager/scripts/generate-production-server.mjs`
- `apps/manager/scripts/production-admin-block.mjs`
- `apps/manager/src/server.ts`

The generator injects current owner, approval, admin, command, and repair closures and fails when the template blob or required markers drift. `server.ts` remains a minimal entrypoint, preventing an independently edited parallel production server.

### Local-production, SDRT, and image boundary

Primary source:

- root `package.json`
- `mise.toml`
- `local-prod/**`
- `scripts/local-prod/**`
- `scripts/sdrt/sdrt_validator.py`
- `scripts/sdrt/sdrt_mcp_server.py`
- `infra/deploy/manager.Dockerfile`
- `mvp-build/.dockerignore`

Delivered:

- exact-SHA local audit/preflight/typecheck/lint/build/test/verify/start/go-no-go orchestration;
- root pnpm orchestration with `mvp-build/package-lock.json` and npm as application dependency authority;
- bounded SDRT-v2 validation, canonical round trip, query, and read-only MCP resources;
- production topology checks for Manager, Model Gateway, host provisioner, web, and Caddy;
- Docker generator inputs copied before root `npm ci` so `prepare` runs against a complete hash-pinned closure;
- bounded Docker context excluding host dependencies, build outputs, mutable evidence, secrets, and documentation not needed by the runtime image.

## Forward migration ledger after frozen `0042`

```text
0043 connector custody and commercial attribution
0044 connector binding scope dimensions
0044b connector compatibility timestamps
0045 connector consumers and commercial rows
0046 connector binding lifecycle
0047 gateway ambiguous audit state
0048 approval authority and execution
0049 approval legacy promotion
0050 atomic preview approval consumption
0051 immutable approval snapshots
0052 approval resolution namespace fix
0053 owner assignment consumer closure
0054 MCP/artifact assignment closure
0055 platform-admin authority groundwork
0056 platform-admin authority activation
0057 platform command actor enforcement
0057a authority surface categories
0058 platform command session/lease binding
0058 authority-version revocation spine
0059 platform command exact lease resolution
0059 authority-version operational closure
0060 signed artifact authority closure
0061 ambiguous command reconciliation
0062 all-preview authority versions
0063 preview assignment required
```

Do not rewrite or renumber applied migrations. Future corrections use new forward migrations.

## Exact implementation-head CI proof

Implementation SHA: `a9184be1af68ed6c5372d642928db46b51eb0506`

- Phase 2 Remediation Plan Integrity `29662757178`: **success**
- Lane 1 Relationships and Authorization `29662757194`: **success**
- S2 S7 S9 Production Boundary `29662757252`: **success**
- Lane 10 Integrated CI and Release Evidence `29662757197`: **success**
- Employee Work Production Boundary `29662757204`: **success**

Observed proof:

- generated Manager production source;
- shared/database/Manager typecheck and build;
- unit/source contracts;
- complete migration ledger through `0063` on blank PostgreSQL 17;
- worker migration/recovery regression;
- Lane 1 relationship/RLS matrix;
- Lane 3 command/effect matrix;
- S5 connector/S6 commercial matrix;
- S7 approval matrix;
- S9 authority-version matrix;
- assignment-bound signed preview/artifact revocation and unscoped-preview denial;
- ambiguous Hermes-turn reconciliation without a second effect;
- release-evidence manifest generation;
- successful production Manager image inclusion.

## Evidence boundary and remaining launch blockers

Not yet accepted:

- complete migration application and behavior on the approved real Supabase target;
- current-head dedicated Lane 8 workflow dispatch;
- fixture-free owner web, SMS, signed review, and connected-system provider packets;
- real provider/accounting reconciliation for Gmail, QuickBooks, Stripe, Twilio, and Model Gateway usage;
- S10 onboarding/Auth identity saga, compensation, and repair;
- separated worker topology, fairness, crash recovery, and 100–700 agent capacity;
- role-safe workforce/product surfaces and public-service isolation under load;
- reboot, drift, compensation, duplicate, ambiguity, recovery, and rollback packets on real infrastructure;
- SBOM, attestation, exact deployment, final proof aggregation, and production acceptance.

## Now-to-live checklist

### Branch/source/CI checkpoint

- [x] Approved remediation plan and finding registry pass integrity CI.
- [x] Lane 1 C1/C2 relationship and authorization foundation integrated.
- [x] Lane 3 C3 durable command/effect foundation integrated.
- [x] Owner assignment/session/signed-resource consumers source-wired and tested.
- [x] S5 connector custody and S6 commercial attribution matrices green.
- [x] S7 approval resolution/execution matrix green.
- [x] S9 revocation, signed-resource denial, and C3 ambiguity-repair matrices green.
- [x] Generated Manager surface typechecks/builds.
- [x] Full migration ledger through `0063` applies on blank PostgreSQL 17.
- [x] Production Manager image inclusion passes.
- [ ] Dispatch and record the dedicated S8 workflow on the chosen exact acceptance SHA.

### Live execution still required

- [ ] Apply the complete migration ledger to approved real Supabase staging and retain proof.
- [ ] Prove cross-account, cross-employee, wrong-role, revocation, signed-resource, and channel isolation on the real target.
- [ ] Run canonical fixture-free onboarding through durable identity/verification and isolated runtime.
- [ ] Run provider-backed web/SMS/signed-review and connected-tool effects with durable receipts.
- [ ] Reconcile gateway budgets, usage, payer/beneficiary attribution, provider costs, and invoice totals.
- [ ] Run reboot, drift, compensation, duplicate intent/effect, ambiguity, reconciliation, fairness, and recovery tests.
- [ ] Prove 100, 250, 500, and 700 provisioned-agent capacity with at least 30% headroom and public-workload limits.
- [ ] Aggregate every required packet under the exact deployed release SHA.
- [ ] Rehearse rollback, publish the redacted proof ledger, and reconcile public claims to evidence.

## Layout

```text
apps/web/                 owner surfaces
apps/manager/             control plane, gateway, tools, events, generated server, provisioning
packages/shared/          contracts and schemas
packages/db/migrations/   durable database state and security boundaries
packages/agent-template/  rendered Hermes employee profile
infra/deploy/              production Compose and images
infra/scripts/             deploy, runtime, proof, operator, and repair helpers
infra/acceptance/          release-bound live proof manifest
memory/                    durable session handoffs
second-half-plan/          active forward-plan family
validation/                machine-readable remediation vectors
```
