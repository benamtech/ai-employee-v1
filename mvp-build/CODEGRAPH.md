# CODEGRAPH.md — AMTECH AI Employee build map

Status: active
Updated: 2026-07-18
Active integration branch: `employee-production-tuesday`, based on `research`; draft PR `#23` targets `research`; `main` is not the integration shortcut

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

AMTECH installs a persistent AI Employee for owner-operated small businesses, beginning with painters, landscapers, and adjacent service contractors. The owner experiences one employee through governed web, SMS, signed review, and connected-system events. Manager is the invisible control plane; Hermes is the agent substrate.

Voice is a future extension, not a launch acceptance gate.

The product is not a chatbot, estimator, CRM, workflow builder, website framework, or model marketplace. It is always-on intelligent software that notices work, remembers business context, prepares artifacts and communication, follows up, asks permission at consequential gates, executes bounded effects, and leaves durable proof.

## Canonical execution boundary

```text
trigger
-> authenticated principal
-> explicit assignment or approved platform/system context
-> current relationship, role, grant, and policy resolution
-> stable durable intent
-> immutable command
-> atomic claim with bounded lease
-> Hermes or deterministic work
-> approval when required
-> one reserved external effect
-> accepted, failed, or ambiguous durable receipt
-> deterministic replay / repair
-> role-safe web, SMS, signed-review, or connected-system surface
-> audit, metering, commercial attribution, and release proof
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
| `browser/channel-accepted` | Fixture-free web/SMS proof exists. |
| `commercial-accepted` | Usage, payer/beneficiary, provider cost, and invoice reconciliation passed. |
| `production-ready` | Every non-waivable Standard gate is green on the exact deployed SHA. |
| `planned` | Designed, not implemented. |
| `pending` | Unattempted, blocked, or missing proof. |

## Current overall status

**`standard-remediation_in-progress_source-and-ci-evidence_not-live-accepted_not-launch-cleared`**

### Control layer

- Standard: `STANDARD.md`.
- Approved execution program: `second-half-plan/phase-2-standard-remediation-execution.md`.
- Machine registry: `validation/phase-2-remediation-vectors.json`.
- Plan-integrity run `29638985374` passed mapping, dependency, contract, and metric checks.
- Command board: issue `#25`.
- Integration PR: draft `#23`.

### Lane 1 — relationship and authorization foundation

Integrated from PR `#24` at `b37d479a70983fcb3e88942b1f36481a07a97d17`.

Delivered:

- C1 labor/domain relationship schemas;
- C2 authorization request/decision schemas;
- organizations, human principals, employee principals, and employee assignments;
- employment, management, supervision, custody, access, authority, payer, and beneficiary records;
- deterministic compatibility IDs and provenance;
- migrations `0039_labor_relationship_authorization_foundation.sql` and `0040_fix_assignment_authorization_policy_version.sql`;
- assignment-aware helpers and initial `accounts`/`employees` RLS replacement;
- five-case PostgreSQL relationship/RLS matrix green on run `29639593725`.

Still open:

- every consequential row, route, channel, signed resource, connector, session, admin/support action, and commercial consumer is not yet assignment-scoped;
- real Supabase and fixture-free browser/channel packets are pending;
- helper privilege design requires a reviewed non-recursive policy solution or explicit exception.

### Lane 3 — durable command/effect kernel

Integrated from PR `#26` at `c94be46137b8c87b610ba0c4b48302bb2e944564`.

Delivered:

- `packages/shared/src/command-effect.ts` C3 contract;
- migration `0041_durable_command_effect_kernel.sql`;
- stable intent registration and immutable command identity;
- actor, assignment, policy, payload-hash, correlation, and causation provenance;
- atomic command claims with bounded lease reclaim;
- one effect reservation per assignment/effect key;
- provider capability classes;
- accepted, failed, and ambiguous terminal receipts;
- receipt-gated command completion;
- deterministic replay without a second effect;
- internal service-role database boundary;
- unit contract and seven-case PostgreSQL behavior matrix.

Correct RED-first sequence:

1. The initial effect-reservation test incorrectly assumed caller index `0` would win concurrent scheduling.
2. Commit `0a59c6e2195498d4f8657710a730eda583c3b0a3` corrected the invariant to one unique effect ID, exactly one `duplicate=false`, and 49 duplicates returning that same ID.
3. Actions run `29642702660` then recaptured the intended missing-kernel RED state after migrations applied and contracts passed.
4. Migration implementation followed without weakening the matrix.
5. Actions run `29642874619` passed shared typecheck/build, six contract invariants, blank PostgreSQL 17 migration application, and all seven database cases.
6. Relationship/authorization regression run `29642874652` also passed on the same lane head.

This is integrated source/CI/PostgreSQL evidence only. It is not real-Supabase, provider, runtime, browser/SMS, commercial, capacity, deployment, or production acceptance.

### Repository boundary cleanup

PR `#27` merged at `3ec7a5c541fd8d6e6ec074e94f178163c7ec9477`.

- Removed `GTM-RESEARCH/website-framework/` because Hyper Site now lives independently in `benamtech/hyper-site`.
- Removed `.github/workflows/website-framework-reference.yml`.
- Repaired root and scoped read order, pricing, branch, voice, estimator, and source-of-truth routing.
- No product source, migration, runtime, provider, deployment, or production state changed in that cleanup.

## Why the next order is mandatory

The shared relationship/authorization and command/effect kernels now exist. Downstream systems must consume them rather than inventing their own authority, idempotency, lease, receipt, or replay semantics.

Next dependency order:

1. **Complete Lane 1 scope.** A perfect effect kernel is unsafe if a route, session, connector, signed resource, or commercial row can select the wrong assignment.
2. **Build Lane 10 integrated CI/evidence spine.** Later lanes must fail closed when migrations, RLS, concurrency, protocol, browser/SMS, provider, capacity, recovery, or claims drift.
3. **Lane 2 sessions/approvals/admin and Lane 4 onboarding saga.** These need both explicit relationship authority and durable commands/effects.
4. **Lanes 5–7 commercial, connectors/channels, and workers.** These adapt existing gateway, inbox, provider, provisioning, and reconciler machinery to the shared kernels.
5. **Lanes 8–9 product surfaces and 100–700 agent operations.** UI and capacity proof come after authority, durable work, and accounting semantics are stable.
6. **Release.** Real Supabase, fixture-free web/SMS/provider packets, commercial reconciliation, capacity/recovery, rollback, attestation, deployment, and acceptance bind to one frozen SHA.

Jumping ahead would create feature-local protocols, false proof, and expensive rewrites.

## Existing product/runtime source map

### Owner product and surfaces

Primary areas:

- `apps/web/**`
- `apps/manager/src/server.ts`
- `apps/manager/src/lib/employee-stream.ts`
- `packages/shared/src/materialization.ts`
- `packages/shared/src/work-stream.ts`
- `packages/shared/src/preview-links.ts`

Home, Talk, Proof, Connected, persisted conversation, signed review, approvals, owner-safe materialization, SSE/poll fallback, Connector Center, and generative-card seams are source-wired. Their consumers still require full assignment, command/effect, session, connector, commercial, and release conformance.

### Relationship and authorization

Primary files:

- `packages/shared/src/relationship-contract.ts`
- `packages/shared/src/labor-relationship-record.ts`
- `packages/db/migrations/0039_labor_relationship_authorization_foundation.sql`
- `packages/db/migrations/0040_fix_assignment_authorization_policy_version.sql`
- `tests/integration/relationship-authorization-matrix.test.ts`

### Durable command and effects

Primary files:

- `packages/shared/src/command-effect.ts`
- `packages/db/migrations/0041_durable_command_effect_kernel.sql`
- `tests/unit/command-effect-contract.test.ts`
- `tests/integration/command-effect-kernel.test.ts`
- `.github/workflows/lane-commands-effects.yml`

### Model Gateway and profile isolation

Primary files:

- `apps/manager/src/lib/model-gateway.ts`
- `apps/manager/src/lib/model-gateway-http.ts`
- `apps/manager/src/model-gateway-server.ts`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/runtime-profile-integrity.ts`
- `packages/shared/src/model-gateway.ts`
- `packages/shared/src/profile-package.ts`
- `infra/deploy/docker-compose.production.yml`

Employee runtimes receive employee-scoped Manager MCP and Model Gateway credentials, never provider master credentials. Durable budgets, usage receipts, and payer/beneficiary attribution remain Lane 5 work.

### Provisioning and reconciliation

Primary files:

- `apps/manager/src/lib/provisioning-state-machine.ts`
- `apps/manager/src/lib/provisioning-reconciler.ts`
- `apps/manager/src/lib/provisioner-idempotency.ts`
- `apps/manager/src/provisioner.ts`
- `apps/manager/src/provisioner-host.ts`
- migrations `0031`–`0038`

These specialized workers remain useful. Downstream work must adapt them to C1–C5 rather than treating their feature-local commands/receipts as universal semantics.

### Verified ambient ingress

Primary files:

- `apps/manager/src/lib/ambient-inbox.ts`
- `apps/manager/src/webhooks/twilio.ts`
- `apps/manager/src/webhooks/gmail.ts`
- `apps/manager/src/webhooks/stripe.ts`
- `apps/manager/src/webhooks/quickbooks.ts`

Assignment-safe connector custody, unified channel envelopes, consent/revocation, and provider-backed packets remain Lane 6 work.

## Remaining launch blockers

- complete P0 relationship, assignment, isolation, session, approval, admin, and revocation coverage;
- transactional onboarding/Auth saga and repair;
- durable budgets, usage, provider cost, payer/beneficiary, and invoice reconciliation;
- connector custody, consent, channel continuity, and consumer migration to the command/effect kernel;
- separated worker topology, fairness, crash recovery, and 100–700 agent capacity;
- role-safe product/workforce surfaces and public-service isolation;
- full CI, real Supabase, fixture-free provider/browser/SMS packets, rollback rehearsal, SBOM/attestation, proof manifest, and claim consistency;
- exact production deployment and acceptance on the frozen proven SHA.

## Now-to-live checklist

### Integrated source/CI evidence

- [x] Approved remediation plan and 29-finding registry pass integrity CI.
- [x] C1/C2 relationship and authorization foundation integrated.
- [x] Five-case PostgreSQL relationship/RLS matrix green.
- [x] Lane 3 scheduler-independent RED harness corrected and recaptured.
- [x] C3 durable command/effect contract and migration integrated.
- [x] Seven-case command/effect PostgreSQL matrix green.
- [ ] Complete all relationship/authorization consumers and fault suites.
- [ ] Establish full integrated CI and release evidence spine.
- [ ] Close remaining P0/P1 lanes.

### Live execution still required

- [ ] Apply the complete release migration set to an approved real Supabase staging target and retain proof.
- [ ] Prove cross-account, cross-employee, wrong-role, revocation, signed-resource, and channel isolation.
- [ ] Run canonical fixture-free onboarding through Twilio Verify and isolated runtime.
- [ ] Run provider-backed web/SMS and connected-tool effects with durable receipts.
- [ ] Prove gateway budgets, usage, payer/beneficiary attribution, provider costs, and invoice reconciliation.
- [ ] Run reboot, drift, compensation, duplicate intent/effect, ambiguity, reconciliation, fairness, and recovery tests.
- [ ] Prove 100, 250, 500, and 700 provisioned-agent capacity with at least 30% headroom and public-workload limits.
- [ ] Aggregate every required packet under the exact deployed release SHA.
- [ ] Rehearse rollback, publish the redacted proof ledger, and reconcile public claims to evidence.

## Layout

```text
apps/web/                 public onboarding + owner surfaces
apps/manager/             control plane, gateway, tools, events, provisioning
packages/shared/          contracts and schemas
packages/db/migrations/   durable database state and security boundaries
packages/agent-template/  rendered Hermes employee profile
infra/deploy/              production Compose and images
infra/scripts/             deploy, runtime, proof, and repair helpers
infra/acceptance/          release-bound live proof manifest
memory/                    durable session handoffs
second-half-plan/          active forward-plan family
validation/                machine-readable remediation vectors
```
