# CODEGRAPH.md — AI Employee executable topology

Status: active cumulative source candidate; exact acceptance is owned by workflows and retained release records  
Updated: 2026-07-23  
Candidate stack: PR #40 cumulative branch → PR #35 branch → PR #34 branch → `main`  
Source migration head: `0082`

This is the sole contributor-facing file that carries current product/workstream structure. `authority-map.json` routes machine readers here. Exact transient SHA, run number, and conclusion remain in the current PR, GitHub Actions, or retained release evidence.

## Current integration state

- The cumulative candidate includes WS-01 through WS-09 source work represented by PRs #34, #35, the already integrated internal PRs #36–#39, and PR #40.
- PR #40 adds the employee UI port, presentation adapters, production UI Lab, canonical agent onboarding, and folder-first full employee UI variants.
- The incomplete accidental Trace013 planning attempt was removed. `decision/active.json` records no open decision transaction; Trace013 is reserved for a fresh post-merge branch.
- Trace011 and Trace012 are completed UI decision records. Their recorded SHAs are historical coordinates, not moving acceptance claims.
- The current cumulative candidate has historical exact-head success for governance, typecheck, lint, broad unit, PostgreSQL integration, workspace production builds, Compose validation, five exact-SHA image builds, image-identity inspection, and independent signed-manifest verification.
- Any new documentation or merge commit requires its own exact-head verification. Ancestor success does not certify a descendant SHA.
- Managed database, live connector/provider, target host, fixture-free channels/golden work, manual accessibility, representative capacity, pilot, deployment, and production remain separate gates.
- The public estimator is outdated and non-canonical.

## Product authority

- **Hermes:** reasoning, runs, sessions, runtime-local memory, and tool execution.
- **Manager:** identity, assignments, authority, capability/tool contracts, connector/provider custody, approvals, durable effects, shared commercial admission/accounting, reconciliation, repair, and proof.
- **Web/SMS/signed Review/MCP Apps/AG-UI/UI Lab:** role-safe projections, not authority.
- **PostgreSQL/Supabase:** shared durable identity, rate, budget, effect, receipt, accounting, lineage, reconciliation, and retry permission.
- **Host Provisioner:** sole Docker and bounded target-host lifecycle authority.

## Canonical work/effect transaction

```text
owner, ambient, scheduled, or delegated intent
→ exact account + employee + assignment + current authority/entitlement
→ immutable request or work revision
→ Hermes reasoning or deterministic Manager work
→ current effective capability
→ exact approval when required
→ finite request economics
→ atomic PostgreSQL rate token + worst-case budget reservation
→ one durable command/effect + provider idempotency identity
→ accepted | failed | ambiguous receipt
→ accepted effect-bound accounting receipt
→ output/publication bound to the same revision and effect
→ owner/operator proof projection
→ original-effect reconciliation or replay-safe projection repair
```

## Canonical connector transaction

```text
owner names or selects a business system
→ AMTECH-managed authorization or guided setup intent
→ Manager credential custody + exact assignment binding
→ provider-neutral capability discovery
→ harmless read/health proof
→ verified event ingress or controlled polling
→ Hermes uses broad effective capabilities
→ exact conversational decision context when approval is held
→ Manager revalidates principal + assignment + snapshot + effect
→ lifecycle/effect receipt projected to owner
→ revoke binding + credential reference + grant + capability projection
→ verified reconnect requires fresh discovery
→ later use fails closed when binding is not current
```

## Canonical UI transaction

```text
Manager durable truth + exact assignment authority
→ production semantic compiler or neutral EmployeeExperienceModelV1 projection
→ production renderer path or folder-first UI variant
→ bounded intent bridge
→ fresh Manager authorization
→ durable receipt and proof refresh
```

The production Web client is one conforming presentation, not the mandatory visual grammar. UI variants preserve capabilities and bounded actions without inheriting private application modules, navigation, terminology, DOM hierarchy, or component structure.

## Canonical release and recovery transaction

```text
exact Git SHA
→ five distinct OCI image identities
→ compose/config/migration/secret-version hashes
→ signed manifest + independent fingerprint verification
→ topology-complete health
→ deterministic fault state
→ operator terminality and safe next action
→ complete backup bundle
→ restore + durable-truth conservation + proof refinding
→ exact prior SHA rollback inside schema/config compatibility
→ accepted-work conservation
```

A running container without a healthy dependency-complete state is not healthy. Rollback never retags a release to a floating alias and blocks when the signed prior migration or configuration envelope is incompatible.

## Active source hubs

```text
apps/manager/src/server.ts
  direct typed Manager composition and current-authority interception

packages/db/migrations/0077..0082
  shared rate authority, namespace repairs, connector lifecycle,
  reconnect normalization, and atomic SMS decision focus

packages/shared/src/adaptive-connector-runtime.ts
apps/manager/src/lib/connector-lifecycle.ts
apps/manager/src/lib/channel-decisions.ts
  provider-neutral discovery, lifecycle, revoke/reconnect, and exact decisions

apps/web/app/agent/[employeeId]/owner-projection-controller.ts
packages/shared/src/operating-projection.ts
packages/shared/src/operating-layout.ts
  one scoped owner stream and deterministic production projection path

packages/shared/src/employee-ui-presentation.ts
apps/web/app/_components/employee-ui/EmployeeUiPort.tsx
  employee UI port, adapters, and presentation strategies

apps/web/ui-variants/
apps/web/app/_components/ui-variant/
ui-lab/README.md
  neutral capability model, folder-first variants, bounded host, and agent-first UI Lab

infra/scripts/release-manifest.mjs
infra/scripts/verify-release-manifest.mjs
infra/scripts/backup-restore.mjs
infra/scripts/restore-verify.mjs
infra/scripts/deploy-rollback.mjs
  exact release identity, independent verification, recovery, and rollback guards
```

## Decision topology and current traces

Candidate search topology and software-invariant topology are non-interchangeable:

```text
candidate graph
  vertices: candidate trajectories
  use: similarity, lineage, redundancy, separation, and sensitivity

software invariant hypergraph
  vertices: actual entities, states, and proof obligations
  use: touch, fractional, complete, and independently proved coverage
```

Mandatory invariants are feasibility constraints. Eigenvectors, graph density, spectral gaps, weighted scores, edge touch, and represented nodes can guide exploration only. They do not override dependency order or establish architecture, causality, or acceptance.

- `decision/trace007/` — commercial/effect transaction and baseline semantics.
- `decision/trace008/` — release, recovery, rollback, and capacity compression.
- `decision/trace009/` — UI projection architecture search and calibration.
- `decision/trace010/` — connector operating substrate.
- `decision/trace011/` — employee UI port and presentation adapters.
- `decision/trace012/` — UI Lab and folder-first UI variants; latest completed trace.
- `decision/trace013/` — reserved and absent until the next branch begins a fresh computation.

Representation is never proof. Causal improvement remains unestablished without equal-feasibility implementation outcomes.

## Workstream state and open gates

| Boundary | Cumulative source candidate | Still open |
|---|---|---|
| repository/source truth | authority routers, direct typed Manager, structural governance, exact-head workflows, cumulative PR stack | final exact-head verification after each merge and final `main` merge |
| protocol/capability | current authority interception, scoped streams, connector manifests/discovery, exact conversational decisions | live remote MCP/OAuth/provider/client lifecycle |
| database | forward migrations through `0082`, blank-ledger and direct PostgreSQL contracts | disposable managed Supabase migration, security, advisors, backup, restore, rollback |
| release identity | five exact-SHA image definitions, signed manifest, independent verifier | trusted production signing authority and registry retention |
| target host/runtime | Host Provisioner-only Docker authority and lifecycle contracts | target-host secrets, isolation, replacement, destructive recovery |
| owner UI | one production projection path plus neutral folder-first variants and agent-first UI Lab | fixture-free browser/channel, human visual review, accessibility, reconnect and cross-account acceptance |
| connectors/events | assignment-bound discovery, lifecycle receipts, setup intents, verified ingress, revoke and reactivation projection | live consent, refresh/expiry, webhook delivery, provider-side revoke confirmation |
| commercial/provider | shared rate/budget, one effect/provider identity, ambiguity and reconciliation source contracts | provider sandbox idempotency, accepted-response-loss, billing lifecycle |
| restore/rollback | complete source transaction and fail-closed compatibility/conservation guards | destructive rehearsal on production-matching infrastructure |
| capacity/pilot | queue/connection/SSE/fairness descriptors and pilot-stop schema | representative 64 GiB measurement, accessibility, pilot packet and acceptance |

## Active authority map

- `authority-map.json` — machine router.
- `STANDARD.md` plus ratified amendments — normative requirements.
- `decision/active.json` and `decision/protocol-v1.json` — transaction router and method.
- `production-readiness-program/README.md` — sole active production route.
- `production-readiness-program/10-test-suite-disposition.md` — test/evidence classification.
- `production-readiness-program/07-verification-and-handoff-matrix.md` — evidence/handoff boundary.
- `docs/architecture/` — current source-backed explanation.
- `memory/MEMORY.md` — sole handoff index.
- `second-half-plan/`, `GAPS.md`, and `REMEDIATION.md` — historical provenance only.

## Dependency order

1. Complete exact-head verification on the cumulative PR #40 branch.
2. Merge PR #40 into PR #35’s branch and verify the new cumulative PR #35 head.
3. Merge PR #35 into PR #34’s branch and verify the new cumulative PR #34 head.
4. Present PR #34 as the single ready-to-review integration into `main`.
5. After `main`, begin a fresh Trace013 on a new branch.
6. Apply and prove migrations through `0082` on a disposable managed platform.
7. Run live connector/provider, original-effect, accounting, host/recovery, fixture-free channel/golden-work, browser/accessibility, capacity, pilot, deployment, and production gates in dependency order.
