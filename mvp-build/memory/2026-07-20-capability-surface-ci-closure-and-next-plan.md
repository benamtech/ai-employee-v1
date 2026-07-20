# 2026-07-20 — Capability Surface CI Closure and Production Next Plan

Status: **source-wired; exact-head CI verification required; not live-accepted; not deployed; not launch-cleared**

## Coordinates

- Repository: `benamtech/ai-employee-v1`
- Branch: `employee-production-tuesday`
- Base: `research`
- Draft PR: `#23`
- Primary implementation anchor: `5b56e6a2249f4b5a650d81badbdd7b95cd6ea2bb`
- Migration head: `0072`
- Focused plan folder: `mvp-build/second-half-plan/2026-07-20-capability-production-closure/`
- Primary agent role: CI/remediation integrator
- Interacting roles: Web owner-surface maintainer, Manager authority maintainer, database/migration maintainer, production proof operator, document authority maintainer

## Purpose and invariant

Close the actual current-head capability-surface build failure without weakening connector, assignment, approval, C3, or provider boundaries; repair adjacent stale acceptance contracts exposed by the complete CI surface; and leave a dependency-ordered production plan grounded in exact repo artifacts.

Invariant: capability discovery and setup guidance are owner-safe presentation only. The browser may stage an instruction or begin an explicit supported OAuth setup, but it does not gain tool execution authority. Consequential work remains assignment-scoped and must flow through existing approval and durable command/effect authority.

## Stale premise rejected

The inherited prompt described six TypeScript contract errors caused by scalar-only proof envelopes. Current source and workflow artifacts did not support that diagnosis:

- `mvp-build/packages/shared/src/golden-employee-scenarios.ts` already permits structured evidence through `Record<string, unknown>`.
- On current-head workflow evidence, shared, database, and Manager build/typecheck steps passed.
- `.github/workflows/ui-agent-operating-surface.yml`, job `source-contracts`, failed at step `Typecheck web` with one error: `TS18047: 'setup' is possibly 'null'` in `CapabilityDrawer.tsx`.

The execution followed current source and exact workflow evidence rather than implementing a serializer for a superseded defect.

## Implementation

### 1. Atomic connector setup action

Commit `21ad21c18a8e` — `fix capability connector action narrowing`

Changed:

- `mvp-build/apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx`

Before:

- the card computed nullable `setup` and nullable `setupHref` separately;
- render narrowed `setupHref` but dereferenced `setup.label`;
- TypeScript correctly rejected the unrelated null proofs.

After:

- `CapabilitySetupAction` carries `href` and `label` together;
- `capabilitySetupAction(employeeId, capability)` returns null unless availability is `needs_connection` and the explicit connector registry resolves;
- only Gmail/communication and QuickBooks/accounting map to shipped owner setup descriptors;
- the render consumes `setupAction.href` and `setupAction.label` under one guard;
- unresolved connector setup remains fail-closed.

No connector execution, OAuth scope, assignment authority, approval, C3, or provider boundary changed.

### 2. Regression contract

Commit `ff50b7d99b80` — `test capability connector action contract`

Added:

- `mvp-build/tests/unit/capability-drawer-setup-contract.test.ts`
- describe `CapabilityDrawer connector setup action`
- it `keeps the connection href and label in one null-safe action`

The test requires the availability gate, registry-resolution null gate, atomic render, and absence of the old split pattern.

### 3. Strict-read acceptance reconciliation

Commit `af5bc1cbf36f` — `assert strict reads cover capability enrichment and operating materialization`

Changed:

- `mvp-build/tests/unit/employee-stream-strict.test.ts`
- describe `employee snapshot strict reads`
- it `routes every production owner and employee context entry point through strict reads`

The current Manager route first builds the employee snapshot, then builds the capability catalog using `strictSnapshotClient(db)`, enriches the snapshot, and builds operating state using the strict client and enriched state. The acceptance test now verifies that stronger current path rather than the obsolete direct `snapshot` materialization string.

### 4. Migration-head acceptance drift prevention

Concurrent immediate repair:

- commit `c6eb73f89878` — `advance production topology migration assertion through head 0072`

Durable repair:

- commit `5b56e6a2249f` — `derive migration acceptance head from ledger`

Changed:

- `mvp-build/tests/unit/production-topology-acceptance.test.ts`
- describe `target-host production topology acceptance`
- it `binds staging migration proof to the complete current migration range`

The test now derives the current head from SQL filenames under `mvp-build/packages/db/migrations/` and verifies that `mvp-build/infra/scripts/acceptance/migration-staging-live-proof.mjs` declares that head. Adding a future migration without advancing the live proof now fails deterministically.

## Current schema authority

- `0070` — `mvp-build/packages/db/migrations/0070_effective_capabilities_and_artifact_revisions.sql`
  - artifact revisions and validations;
  - approval snapshot binding for artifact publication;
  - effective capability evidence.
- `0071` — `mvp-build/packages/db/migrations/0071_artifact_policy_seed_and_contract_guards.sql`
  - artifact policy lifecycle sync;
  - role-specific employee-surface actions;
  - viewer read-only correction.
- `0072` — `mvp-build/packages/db/migrations/0072_artifact_revision_scope_guards.sql`
  - revision, parent, validation, and current-head cross-row scope guards;
  - installation-time consistency checks.

Any document still naming `0069` as current is stale.

## Deployment source correction already present

The 2026-07-19 handoff and PR body still say production helpers select legacy Compose. Current source has already closed that source-level fork:

- `mvp-build/infra/scripts/production-topology.mjs` selects `infra/deploy/docker-compose.production.yml` and the five-service control plane;
- `mvp-build/infra/scripts/production-normal-up.mjs` uses `productionComposeArgs`;
- prod-like, smoke, and rollback entrypoints import the same topology authority;
- `mvp-build/tests/unit/production-boundary-source.test.ts`, describe `canonical production deployment topology`, enforces selector, service, custody, Caddy, and rollback contracts.

This is `source-wired`, not target-host accepted. Real host/network/runtime proof remains open.

## CI findings and verification boundary

The first implementation-head run showed:

- the Agent Operating Surface `source-contracts` job passed shared/db/Manager/Web typecheck, UI validation, UI contract tests, and Web build after the drawer fix;
- the earlier Employee Work Production Boundary run exposed two stale tests: migration head `0069` and obsolete strict operating materialization shape;
- both stale acceptance contracts were repaired without changing production behavior.

Exact final-head run IDs must be recorded after the documentation transaction stops moving the branch. A cancelled run is not a pass. A documentation-only head does not automatically inherit the implementation head's workflow matrix.

## Plan and document transaction

Added:

- `mvp-build/second-half-plan/2026-07-20-capability-production-closure/README.md`
- `mvp-build/second-half-plan/2026-07-20-capability-production-closure/01-standardized-execution-output.md`
- `mvp-build/second-half-plan/2026-07-20-capability-production-closure/02-production-next-step-plan.md`
- `mvp-build/second-half-plan/2026-07-20-capability-production-closure/03-verification-and-handoff-matrix.md`
- `mvp-build/second-half-plan/2026-07-20-capability-production-closure/04-recent-change-reference-map.md`

The packet distinguishes source/CI status from staging, runtime, provider, fixture-free browser/channel, commercial, rollback, deployment, and production-ready acceptance.

## Open P0/P1 gates

P0:

1. Complete and record the exact-head required workflow matrix.
2. Synchronize `mvp-build/CODEGRAPH.md`, `mvp-build/memory/MEMORY.md`, `mvp-build/second-half-plan/README.md`, architecture/risk indexes where needed, and PR `#23` to migration head `0072` and current deploy source state.
3. Apply migrations `0032–0072` on approved staging and retain exact-SHA migration/advisor/behavior proof.
4. Prove canonical target-host five-service health, Unix-socket Docker custody, Caddy host networking, per-employee network isolation, replacement, and teardown.
5. Capture fixture-free owner login/account selection/assignment, strict snapshot, SSE reconnect, Gmail/QuickBooks OAuth, staged capability instruction, and provider-backed approval → C3/effect → receipt → proof journey.

P1:

1. Implement cumulative Model Gateway budget reservation/settlement.
2. Replace process-local fleet rate limits with shared atomic state.
3. Represent uncertain consequential provider outcomes as ambiguous and reconcile before retry.
4. Complete crash-point, compensation, repair, rollback, SBOM, provenance, signed manifest, accessibility, cross-browser, visual, and capacity/fairness gates.

## Next dependency-ordered move

1. Stop branch movement long enough for the complete exact-head matrix to finish.
2. Inspect every non-success run by workflow filename, job, and step; repair only source-confirmed P0/P1 defects.
3. Update PR `#23` with the final implementation/document head and named workflow IDs.
4. Move to approved staging migration proof through `0072`.
5. Move to target-host and fixture-free provider/browser proof.

## Acceptance statement

The capability setup nullability defect and adjacent acceptance drift are implemented and regression-covered. The branch remains draft and is not production-ready because exact final-head evidence and live database/runtime/provider/browser/channel/commercial/recovery/rollback/deployment gates remain incomplete.
