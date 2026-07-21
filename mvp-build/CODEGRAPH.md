# CODEGRAPH.md — AMTECH AI Employee build map

Status: active  
Updated: 2026-07-20  
Main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Stacked base: PR #34 exact head `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a`  
Active source candidate: PR #35  
Source migration head: `0076`  
Standard: v0.2 ratified  
Decision protocol: `decision/README.md`

## Product boundary

- Hermes owns employee reasoning, runs, sessions, runtime-local memory/tool use, and runtime recovery.
- Manager owns identity, assignments, authority, capability/tool contracts, connector/provider custody, approvals, durable effects, shared commercial admission/accounting, revocation, reconciliation, repair, and proof.
- Web, SMS, signed Review, MCP Apps, and AG-UI are role-safe projections, not authority.
- PostgreSQL/Supabase is durable identity, rate, budget, effect, accounting, lineage, and reconciliation authority.

## Current status

**`standard_v0_2__computed_decision_v1__migration_0076_source_candidate__pr34_base__pr35_ws06_ws07_ws08_groundwork__exact_ci_managed_live_release_gates_open`**

PR #35/source supersedes stale plan-status prose only for its exact source boundary. Exact-head CI, live provider, managed database, target host, fixture-free channel/golden journeys, commercial lifecycle, pilot, deployment, and production readiness remain open.

## Compute-before-implement route

```text
authority/evidence/Unknown extraction
→ applicable possible-decision spaces
→ independent candidate batches
→ invariant and prerequisite filter
→ computed comparison
→ selected exploration
→ separate coherent implementation compression
→ behavioral proof
→ implementation
→ exact-head and required external verification
```

`decision/README.md` is mandatory for non-mechanical work. `decision/trace007/` is the current T3 example. Scores and graphs prioritize; they do not establish source or acceptance.

## Canonical work/effect topology

```text
owner, ambient, scheduled, or delegated intent
→ exact account + employee + assignment + current authority/entitlement
→ immutable request/work revision
→ Hermes reasoning or deterministic Manager work
→ current effective capability
→ exact approval when required
→ atomic PostgreSQL rate token + worst-case budget reservation
→ one durable command/effect + provider idempotency identity
→ accepted | failed | ambiguous receipt
→ accepted provider/effect/accounting continuity
→ output/publication bound to exact revision and effect
→ owner/operator proof projection
→ replay-safe projection repair or original-effect ambiguity reconciliation
```

## Source hubs

| Boundary | Current source candidate | Still open |
|---|---|---|
| repository/document truth | one computation protocol, active program/trace/index, historical gap/remediation/plan routers | exact-head governance and broad CI |
| owner snapshot/stream | PR #34 WS-05/06 source | fixture-free browser/reconnect/cross-account acceptance |
| golden work | immutable revision, exact approval, durable publication, repairable owner proof | provider-backed three-role parity and restart refinding |
| Model Gateway | shared DB rate/budget admission, one durable dispatch, accepted/failed/ambiguous settlement | provider sandbox idempotency/reconciliation and managed DB proof |
| commercial accounting | accepted effect-bound usage, immutable adjustments, conservation | invoice/entitlement/billing lifecycle reconciliation |
| original-effect reconciliation | native-idempotency ambiguous command/effect reconciled before commercial settlement | real provider accepted-response-loss evidence |
| WS-08 groundwork | ambiguity/repair queues, lineage, proof projection, deterministic seams | target-host fault, rollback, backup/restore, telemetry, signed release |
| database | forward migrations through `0076`; focused PostgreSQL tests | blank-ledger CI and managed Supabase security/advisor proof |
| target host/pilot/release | foundations only | all required external and production gates |

## Active production map

- Computation protocol: `decision/README.md` and `decision/protocol-v1.json`.
- Active trace: `decision/trace007/`.
- Program root: `production-readiness-program/`.
- Roadmap: `production-readiness-program/04-dependency-ordered-production-plan.md`.
- Issue baseline: `production-readiness-program/08-production-issue-vector.json`.
- Resolution state: `production-readiness-program/13-resolution-ledger.json`.
- Workstreams: `production-readiness-program/09-workstream-execution-map.md`.
- Current transaction: `production-readiness-program/20-ws06-ws08-commercial-effect-transaction.md`.
- Test authority: `production-readiness-program/10-test-suite-disposition.md`.
- Evidence/handoff: `production-readiness-program/07-verification-and-handoff-matrix.md`.
- Historical plans: `second-half-plan/`.

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
      ├─ reconcile_ambiguous_command
      ├─ effect-bound accounting
      └─ reconcile_model_gateway_request

artifact-workbench-tools.ts
  ├─ artifact-revisions.ts
  ├─ approval-authority.ts
  ├─ durable-command-runtime.ts
  └─ effect-proof-projection.ts
      └─ project_effect_proof → effect_proof_projections
```

## Computed exploration route

`decision/trace007/compute.py` verifies B288 authority/evidence extraction, reusable templates, 64 isolated-batch candidates, 16-dimensional scores, multi-way hypergraph hashes, utility/diversity/120-random comparison, selected exploration, and six-item implementation compression.

Evidence-bounded forced dreaming expands useful possibility across separate defect, feature, user, operator, architecture, protocol, commercial, failure, proof, weird, and constraint spaces. Missing evidence remains Unsupported. Mathematics cannot override invariants or evidence classes.

## Not accepted yet

- exact-head computation/source/type/unit/PostgreSQL/governance/build CI for PR #35;
- blank and managed migration/RLS/function proof through `0076`;
- live provider idempotency, request-ID, timeout, accepted-response-loss, and original-effect reconciliation;
- fixture-free Website/Contractor/Bookkeeping parity and restart proof refinding;
- live connector lifecycle and channel convergence;
- commercial invoice/entitlement lifecycle;
- target-host fault injection, rollback, backup/restore, telemetry, signed release, accessibility, capacity, pilot, deployment, and production.

## Dependency order

1. Finish repo-wide active-document reconciliation and deterministic governance verification.
2. Establish PR #35 exact-head computation/source/unit/PostgreSQL/broad CI without weakening assertions.
3. Apply and prove migrations `0074`–`0076` on disposable managed platform.
4. Run provider-backed WS-07 idempotency/ambiguity/original-effect/accounting reconciliation.
5. Run fixture-free WS-06 golden journeys with restart proof refinding.
6. Complete WS-08 target-host fault, rollback, backup/restore, telemetry, and signed-release acceptance.
7. Advance WS-09 human, accessibility, capacity, and controlled-pilot gates only after prerequisites are exact-candidate green.
