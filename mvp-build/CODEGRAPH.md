# CODEGRAPH.md — AMTECH AI Employee build map

Status: active  
Updated: 2026-07-20  
Main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Stacked base authority: PR #34 `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a`  
Active source candidate: PR #35  
Source migration head: `0075`  
Standard: v0.2 ratified

## Product boundary

- Hermes owns employee reasoning, runs, sessions, runtime-local memory/tool use, and runtime recovery.
- Manager owns identity, assignments, authority, capability/tool contracts, connector/OAuth custody, approvals, durable effects, commercial admission/attribution, revocation, reconciliation, repair, and proof.
- Web, SMS, signed Review, MCP Apps, and AG-UI are role-safe projections, not authority.
- PostgreSQL/Supabase is durable identity, rate, budget, effect, accounting, lineage, and reconciliation authority.

## Current status

**`standard_v0_2__migration_0075_source_candidate__pr34_base__pr35_ws06_ws07_ws08_groundwork__exact_ci_managed_live_release_gates_open`**

PR #35/source supersedes stale plan-status prose for its exact source boundary. It has not established exact-head CI, live-provider behavior, managed-database acceptance, target-host acceptance, fixture-free channel/golden journeys, pilot, deployment, or production readiness.

## Canonical work/effect topology

```text
owner or ambient intent
→ exact account + employee + assignment + current authority/entitlement
→ immutable request/work revision
→ exact approval when required
→ atomic PostgreSQL rate token + budget reservation
→ one durable command/effect + provider idempotency identity
→ accepted | failed | ambiguous receipt
→ accepted provider/effect/accounting continuity
→ output/publication bound to exact revision and effect
→ owner/operator proof projection
→ replay-safe projection repair or explicit ambiguity reconciliation
```

## Source hubs

| Boundary | Current source candidate | Still open |
|---|---|---|
| repository/test truth | PR #34 base + PR #35 source/behavioral tests | exact-head CI and broad suites |
| owner Web snapshot/stream | PR #34 WS-05/06 source | fixture-free browser/reconnect/cross-account acceptance |
| golden work | immutable revisions, exact approvals, durable publication, repairable owner proof | provider-backed Website/Contractor/Bookkeeping parity and restart refinding |
| Model Gateway | shared DB rate/budget admission, one durable dispatch, accepted/failed/ambiguous settlement | provider sandbox idempotency/reconciliation and managed DB proof |
| commercial accounting | accepted effect receipt required by new gateway path; immutable adjustments and conservation | invoice/entitlement lifecycle and billing sandbox reconciliation |
| WS-08 groundwork | ambiguity queue, effect proof repair queue, lineage view, explicit reconciliation, deterministic unit seams | full fault matrix, rollback, backup/restore, signed release evidence, monitoring backend |
| database | forward migrations through `0075`; PostgreSQL behavioral integration test | managed Supabase application/security/advisor proof |
| target host/pilot/release | existing foundations only | all required live and production gates |

## Active production map

- Program root: `production-readiness-program/`.
- Roadmap: `production-readiness-program/04-dependency-ordered-production-plan.md`.
- Issue baseline: `production-readiness-program/08-production-issue-vector.json`.
- Resolution/control state: `production-readiness-program/13-resolution-ledger.json`.
- Workstreams: `production-readiness-program/09-workstream-execution-map.md`.
- Current WS-06/07/08 transaction: `production-readiness-program/20-ws06-ws08-commercial-effect-transaction.md`.
- Test authority: `production-readiness-program/10-test-suite-disposition.md`.
- Active computed trace: `decision/trace007/`.
- Historical plans: `second-half-plan/`; non-canonical.

## Active source graph

```text
model-gateway.ts
  └─ signed alias + assignment/commercial claims
model-gateway-http.ts
  ├─ model-gateway-commercial.ts
  │   ├─ admit_model_gateway_request
  │   ├─ mark_model_gateway_request_dispatched
  │   ├─ settle_model_gateway_request
  │   └─ project_model_gateway_request_proof
  ├─ durable-command-runtime.ts
  │   └─ command → effect attempt → effect receipt → replay
  ├─ commercial-effect-attribution.ts
  │   └─ accepted effect receipt → commercial usage receipt → meter events
  └─ model-gateway-reconciliation.ts
      └─ reconcile_model_gateway_request

artifact-workbench-tools.ts
  ├─ artifact-revisions.ts
  ├─ approval-authority.ts
  ├─ durable-command-runtime.ts
  └─ effect-proof-projection.ts
      └─ project_effect_proof → effect_proof_projections
```

## Computed exploration route

`decision/trace007/compute.py` verifies the B288 extraction state, six reusable templates, 64 isolated-batch candidates, requested 16-dimensional weighted scores, sparse multi-way hypergraph, normalized Laplacian, RBF similarity, redundancy, separation, normalized spectral entropy, QD occupancy, coverage, 120 feasible random comparisons, selected exploration, and six-item implementation compression.

The retained method is evidence-bounded forced dreaming: use concurrent latent spaces and recombination to expand useful possibility, but treat missing evidence as Unsupported and prohibit mathematics from overriding invariants or evidence classes.

## Not accepted yet

- exact-head CI for PR #35;
- managed migration/RLS/function proof through `0075`;
- live provider idempotency, request-ID, timeout, accepted-response-loss, and reconciliation behavior;
- fixture-free Website/Contractor/Bookkeeping output parity and restart proof refinding;
- live connector lifecycle and channel convergence;
- target-host fault injection, rollback, backup/restore, telemetry, signed release, capacity, pilot, deployment, and production acceptance.

## Dependency order

1. Preserve PR #34 exact base authority and PR #35 exact source/test truth.
2. Establish PR #35 exact-head source/unit/PostgreSQL CI without weakening assertions.
3. Apply and prove migrations `0074`/`0075` on a disposable managed platform.
4. Run provider-backed WS-07 ambiguity/idempotency/accounting reconciliation.
5. Run fixture-free WS-06 golden journeys with owner proof refinding after restart.
6. Continue WS-08 fault, rollback, backup/restore, telemetry, and signed-release acceptance.
7. Advance WS-09 human, capacity, and controlled-pilot gates only after all prerequisites are exact-candidate green.
