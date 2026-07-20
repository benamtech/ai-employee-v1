# Verification and Handoff Matrix

Status: **executable proof map; every outcome must be attached to an exact SHA**

## Source and unit contracts

| Boundary | Exact test | Required invariant | Failure meaning |
|---|---|---|---|
| Connector setup action | `mvp-build/tests/unit/capability-drawer-setup-contract.test.ts` — describe `CapabilityDrawer connector setup action` — it `keeps the connection href and label in one null-safe action` | Connection href and label are one nullable action; unresolved connectors produce no link. | Owner UI can re-enter a split nullability proof state. |
| Strict operating snapshot | `mvp-build/tests/unit/employee-stream-strict.test.ts` — describe `employee snapshot strict reads` — it `routes every production owner and employee context entry point through strict reads` | Capability enrichment and operating materialization both use `strictSnapshotClient(db)`. | Authoritative read failure can be mistaken for plausible state. |
| Migration proof range | `mvp-build/tests/unit/production-topology-acceptance.test.ts` — describe `target-host production topology acceptance` — it `binds staging migration proof to the complete current migration range` | The proof script declares the highest migration ID in `packages/db/migrations/`. | Staging proof can silently stop before schema head. |
| Canonical deploy selection | `mvp-build/tests/unit/production-boundary-source.test.ts` — describe `canonical production deployment topology` — it `routes every production launcher, smoke, and rollback entrypoint through one compose authority` | Production entrypoints import `production-topology.mjs` and exclude legacy Compose. | Operators can invoke a topology outside the current authority model. |
| Artifact scope | `mvp-build/packages/db/migrations/0072_artifact_revision_scope_guards.sql` plus migration integration tests | Revision, parent, validation, and current head stay in artifact/assignment/account/employee scope. | A privileged malformed write can cross-bind artifact history. |

## Workflow matrix

| Workflow file | Job | Critical steps | Evidence |
|---|---|---|---|
| `.github/workflows/ui-agent-operating-surface.yml` | `source-contracts` | `Typecheck Manager`, `Typecheck web`, `Validate UI source contracts`, `Run npm run test:ui:contracts`, Web build | Manager/Web typecheck and UI validation artifacts |
| `.github/workflows/ui-agent-operating-surface.yml` | `browser-fixture` | compiled fixture build and adaptive/product-shell browser matrices | browser log and screenshot/evidence directory |
| `.github/workflows/employee-work-production-boundary.yml` | `boundary` | migration ledger, Manager contracts, exact Hermes filesystem proof, production-boundary tests, Manager image build | migration, typecheck, filesystem, test, and image artifacts |
| `.github/workflows/lane10-integrated-ci-release-evidence.yml` | exact run job | integrated CI and release evidence | run ID and release artifact |
| `.github/workflows/lane-relationships-auth.yml` | exact run job | relationship/assignment authorization | run ID and exact step |
| `.github/workflows/s2-s7-s9-production-boundary.yml` | exact run job | authority/runtime boundary | run ID and exact step |
| `.github/workflows/s10-onboarding-identity.yml` | exact run job | onboarding identity authority | run ID and exact step |
| `.github/workflows/phase-2-remediation-plan.yml` | exact run job | remediation plan/vector integrity | run ID and exact step |
| `.github/workflows/repository-archaeology.yml` | exact run job | tracked-object/document authority | run ID and archaeology output |

## Deterministic local sequence

Run from `mvp-build/` on the exact candidate SHA:

```bash
npm ci
npm run generate:production-sources
npm run build --workspace @amtech/shared
npm run typecheck --workspace @amtech/shared
npm run build --workspace @amtech/db
npm run typecheck --workspace @amtech/db
npm run typecheck --workspace @amtech/manager
npm run typecheck --workspace @amtech/web
npm run ui:validate
npm run test:ui:contracts
npm run build --workspace @amtech/web
npm run test:production-boundary
```

With Docker available:

```bash
docker compose -f infra/deploy/docker-compose.production.yml \
  --env-file infra/deploy/.env.production config --format json
```

A local pass is not CI acceptance. CI acceptance is not live acceptance.

## Staging migration handoff

Primary harness: `mvp-build/infra/scripts/acceptance/migration-staging-live-proof.mjs`.

Required inputs: exact candidate SHA, approved `STAGING_DATABASE_URL`, optional project reference, and ledger `0032` through `0072`.

Required retained evidence:

- exact git SHA and database reference without secret material;
- migration start, head, count, every repo-relative SQL path, and SHA-256;
- verifier/status output tails;
- timestamp, run/operator coordinate, and `production_mutated: false`;
- behavior checks for artifact scope, approval snapshots, human-principal grants, and effective-capability evidence isolation.

Stop on partial ledger, advisor blocker, cross-assignment visibility, malformed existing artifact history, or proof not bound to the candidate SHA.

## Target-host handoff

Primary files:

- `mvp-build/infra/deploy/docker-compose.production.yml`
- `mvp-build/infra/scripts/production-topology.mjs`
- `mvp-build/infra/scripts/production-normal-up.mjs`
- `mvp-build/infra/scripts/deploy-smoke.mjs`
- `mvp-build/infra/scripts/acceptance/target-host-two-employee-isolation.mjs`

Required proof:

1. Manager, Model Gateway, Host Provisioner, Web, and Caddy are healthy.
2. Manager has no Docker socket; Host Provisioner alone owns Docker authority.
3. Caddy host networking reaches only intended loopback services.
4. Each employee has one internal network with scoped Manager/Model Gateway peers.
5. Cross-employee access is denied both ways.
6. Replacing and tearing down employee A does not change employee B.
7. Exact image digest, profile checksum, container/network inspection, and proof JSON are retained.

## Fixture-free owner/provider handoff

Required journey:

1. Real owner login and account selection.
2. Assignment-scoped dashboard and employee navigation.
3. Strict operating snapshot plus SSE reconnect/rotation without bearer in JSON or URL.
4. Explicit Gmail or QuickBooks OAuth; unknown connector and Stripe OAuth requests fail closed.
5. CapabilityDrawer stages an instruction but makes no browser-direct provider call.
6. Generated work object proceeds through immutable approval snapshot, C3 command/effect, provider receipt, audit/proof, and owner refinding.
7. Exercise 403, 409, 410, 429, 500, and 503 states.

Record owner principal, account, assignment/policy version, employee, connector binding, approval, command/effect, provider idempotency/receipt, audit, and proof IDs.

## Acceptance vocabulary

- `source-wired`: source/schema/config exists and named deterministic checks pass.
- `ci-accepted`: named workflow/job/step passes on named SHA.
- `real-supabase-accepted`: approved real database target passes migration and behavior proof.
- `runtime-accepted`: target-host topology/runtime/network proof passes.
- `provider-accepted`: real provider request and receipt evidence exists.
- `browser/channel-accepted`: fixture-free owner Web/SMS/Review journey passes.
- `commercial-accepted`: usage, payer/beneficiary, provider cost, price, invoice, and accounting reconciliation pass.
- `production-ready`: every non-waivable Standard gate passes on the exact deployed SHA.

## Handoff record

```text
Repository: benamtech/ai-employee-v1
Branch: employee-production-tuesday
PR: #23
Candidate SHA: <40-char SHA>
Implementation commits: <12-char SHA + exact message>
Migration head: 0072 — mvp-build/packages/db/migrations/0072_artifact_revision_scope_guards.sql
Workflow file: <exact path>
Workflow run ID: <id>
Job: <exact job name>
Step: <exact step name>
Outcome: success|failure|cancelled
Artifact/proof IDs: <exact IDs>
Acceptance level reached: <term>
Acceptance levels explicitly not reached: <terms>
Open P0/P1 blockers: <dependency ordered>
Next command/harness: <exact repo path/command>
```
