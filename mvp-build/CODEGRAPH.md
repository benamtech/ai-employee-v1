# CODEGRAPH.md — AI Employee executable topology

Status: active cumulative source candidate; exact acceptance is owned by workflows and retained release records  
Updated: 2026-07-23  
Candidate stack: PR #40 cumulative branch → PR #35 branch → PR #34 branch → `main`  
Source migration head: `0082`

This is the sole contributor-facing owner of current product and workstream structure. `authority-map.json` routes machine readers here. Exact transient SHA, run number, and conclusion remain in the current PR, workflows, or retained release evidence.

## Current state

- The cumulative candidate contains WS-01 through WS-09 source work represented by PRs #34, #35, integrated PRs #36–#39, and PR #40.
- Trace011 and Trace012 complete the employee UI port, presentation adapters, production UI Lab, canonical agent onboarding, and folder-first UI variants.
- Trace013 completes the repository-native software experiment compiler.
- `decision/active.json` records no open transaction. Trace014 is reserved and absent until a new post-merge branch begins.
- The compiler’s implementation coordinate passed merge gates and the complete source/PostgreSQL/image/release workflow. Documentation and merge descendants require their own exact-head evidence.
- Managed database, live provider, target host, fixture-free channels/golden work, manual accessibility, representative capacity, pilot, deployment, and production remain P4 gates.
- The public estimator is outdated and non-canonical.

## Product authority

- **Hermes:** reasoning, runs, sessions, runtime-local memory, and tool execution.
- **Manager:** identity, assignments, authority, capabilities, connector/provider custody, approvals, durable effects, commercial admission/accounting, reconciliation, repair, and proof.
- **Web/SMS/signed Review/MCP Apps/AG-UI/UI Lab/UI variants:** bounded projections.
- **PostgreSQL/Supabase:** durable shared identity, rate, budget, effect, receipt, accounting, lineage, reconciliation, and retry permission.
- **Host Provisioner:** sole Docker and target-host lifecycle authority.

Provider and connector adapters do not create authority.

## Canonical work/effect transaction

```text
exact principal + assignment + current authority
→ immutable request/work revision
→ current capability and exact approval
→ database-owned rate and worst-case budget admission
→ one command/effect/provider idempotency identity
→ accepted | failed | ambiguous receipt
→ effect-bound accounting
→ output and owner/operator proof
→ original-effect reconciliation or projection repair
```

## Canonical experiment transaction

```text
exact Git SHA + task
→ content-addressed repository facts
→ authority DAG + dependency graph
→ genuine invariant hypergraph
→ P2 correspondence
→ P1 formal certificate when admitted
→ task diffusion + first-through-fourth-order effect frontier
→ task capsule + predictions + proof obligations
→ admitted plan before source edits
→ implementation
→ argv-based verification + P3 evidence ledger
→ prediction/outcome calibration
→ finished transaction
```

Canonical engine: `decision/engine/repoctl.mjs`  
Dialect registry: `decision/engine/representation-registry.json`  
Completed implementation record: `decision/trace013/`

## Proof taxonomy

- `P0`: representation calculation or hypothesis.
- `P1`: verified property of an explicit formal model.
- `P2`: verified representation-to-repository correspondence.
- `P3`: executable evidence on the exact candidate.
- `P4`: external or production acceptance.

A checked eigenpair may be decisive proof of its declared operator property. No class silently promotes itself.

## Active source hubs

```text
apps/manager/src/server.ts
  direct typed Manager composition and authority interception

packages/db/migrations/0077..0082
  rate authority, connector lifecycle, reconnect normalization,
  and atomic SMS decision focus

packages/shared/src/adaptive-connector-runtime.ts
apps/manager/src/lib/connector-lifecycle.ts
apps/manager/src/lib/channel-decisions.ts
  provider-neutral lifecycle and exact decisions

apps/web/app/agent/[employeeId]/owner-projection-controller.ts
packages/shared/src/operating-projection.ts
packages/shared/src/operating-layout.ts
  scoped owner stream and deterministic production projection

packages/shared/src/employee-ui-presentation.ts
apps/web/app/_components/employee-ui/EmployeeUiPort.tsx
apps/web/ui-variants/
ui-lab/README.md
  presentation adapters, neutral variants, and agent-first UI Lab

decision/engine/
  facts, dialects, transformations, certificates, task capsules,
  experiment chronology, evaluation, queries, and trusted verifiers

infra/scripts/release-manifest.mjs
infra/scripts/verify-release-manifest.mjs
infra/scripts/backup-restore.mjs
infra/scripts/restore-verify.mjs
infra/scripts/deploy-rollback.mjs
  release identity, verification, recovery, and rollback guards
```

## Trace chain

- Trace007 — commercial/effect authority and computation baseline.
- Trace008 — release, recovery, rollback, and capacity groundwork.
- Trace009 — UI projection architecture search and calibration.
- Trace010 — connector operating substrate.
- Trace011 — employee UI port and presentation adapters.
- Trace012 — UI Lab and folder-first UI variants.
- Trace013 — repository-native software experiment compiler; completed.
- Trace014 — reserved and not created.

## Open gates

| Boundary | Cumulative source candidate | Still open |
|---|---|---|
| repository/agent truth | routers, typed Manager, structural governance, compiler, P1/P2/P3 verifiers | exact-head evidence after each stack merge |
| protocol/capability | current authority, scoped streams, connector lifecycle and exact decisions | live MCP/OAuth/provider lifecycle |
| database | migrations through `0082`, blank-ledger and PostgreSQL contracts | managed platform, backup, restore, rollback |
| release identity | five exact-SHA images, signed manifest, independent verifier | trusted signing and registry retention |
| target host/runtime | Host Provisioner lifecycle and isolation contracts | host secrets, isolation, destructive recovery |
| owner UI/golden work | production projection, UI variants, effect/proof contracts | fixture-free channels and all three provider journeys |
| human/capacity/pilot | responsive surfaces, automation, fairness/pilot-stop schema | manual accessibility, 64 GiB capacity, pilot packet |

## Dependency order

1. Verify the final PR #40 closure head.
2. Merge PR #40 into PR #35’s branch and verify that exact head.
3. Merge PR #35 into PR #34’s branch and verify that exact head.
4. Present PR #34 as the only ready-to-review integration into `main`.
5. After the user merges, create a new branch and run `repoctl start`; that transaction becomes Trace014.
6. Cross the remaining P4 gates in dependency order.
