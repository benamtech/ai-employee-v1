# CODEGRAPH.md — AI Employee executable topology

Status: active source candidate; exact acceptance unresolved  
Updated: 2026-07-20  
Candidate: PR #35, branch `agent/ws06-ws07-production`, stacked on PR #34  
Source migration head: `0078`

This is the sole contributor-facing file that carries exact current product/workstream status. Root and compatibility documents route here rather than duplicating it.

## Evidence headline

- PR #35 contains the WS-01–07 production-boundary cleanup and bounded WS-08 reconciliation, lineage, repair, and observability groundwork.
- Source migrations extend through `0078`; application to a database or managed platform requires separate proof.
- Migration `0077` makes the shared minute rate window database-owned and removes correlation/window metadata from deterministic replay conflict checks; `0078` fixes the PL/pgSQL output-column namespace collision forward-only.
- Manager now compiles and runs from committed typed `apps/manager/src/server.ts`; generated-template and string-patch assembly has been removed.
- Exact-head decision, source, production-boundary, and broad-local gates have passed on the preceding candidate; PostgreSQL reruns on `0078` before exact acceptance is claimed.
- Managed database, live provider, target host, fixture-free golden work/channel, billing lifecycle, signed release, accessibility, capacity, pilot, deployment, and production remain separate gates.
- The public estimator is outdated and non-canonical.

## Product authority

- **Hermes:** reasoning, runs, sessions, runtime-local memory, and tool execution.
- **Manager:** identity, assignments, authority, capability/tool contracts, connector/provider custody, approvals, durable effects, shared commercial admission/accounting, reconciliation, repair, and proof.
- **Web/SMS/signed Review/MCP Apps/AG-UI:** role-safe projections, not authority.
- **PostgreSQL/Supabase:** shared durable identity, rate, budget, effect, receipt, accounting, lineage, and reconciliation state.
- **Host Provisioner:** bounded target-host lifecycle authority.

## Canonical work/effect transaction

```text
owner, ambient, scheduled, or delegated intent
→ exact account + employee + assignment + current authority/entitlement
→ immutable request or work revision
→ Hermes reasoning or deterministic Manager work
→ current effective capability
→ exact approval when required
→ atomic PostgreSQL rate token + worst-case budget reservation
→ one durable command/effect + provider idempotency identity
→ accepted | failed | ambiguous receipt
→ accepted effect-bound accounting receipt
→ output/publication bound to the same revision and effect
→ owner/operator proof projection
→ original-effect reconciliation or replay-safe projection repair
```

## Active source graph

```text
server.ts
  ├─ direct typed Manager route composition
  ├─ owner assignment and current authority-version interception
  ├─ account + employee + assignment + authority-version stream scope
  └─ no generated source or string-based production patching

model-gateway.ts
  └─ signed alias + assignment/commercial claims

model-gateway-http.ts
  ├─ validated request economics and provider accounting bounds
  ├─ model-gateway-commercial.ts
  │   ├─ atomic database-owned rate and budget admission
  │   ├─ dispatch state
  │   ├─ settlement, release, and adjustment
  │   └─ request proof projection
  ├─ durable-command-runtime.ts
  │   └─ command → effect attempt → effect receipt → replay
  ├─ commercial-effect-attribution.ts
  │   └─ accepted effect receipt → accounting receipt → meter events
  └─ model-gateway-reconciliation.ts
      └─ original ambiguous effect → provider identity reconciliation → accounting

artifact-workbench-tools.ts
  ├─ immutable artifact revision and approval authority
  ├─ durable publication effect
  └─ effect-proof-projection.ts
      └─ accepted effect → owner proof projection → repair/refinding
```

## Decision topology

Trace007 has two non-interchangeable structures:

```text
candidate_graph.json
  vertices: candidate trajectories
  use: search diversity, lineage, redundancy, candidate-edge touch

software_invariant_hypergraph.json
  vertices: Revision, ApprovalSnapshot, Effect, ProviderAttempt,
            ProviderReceipt, Settlement, AccountingReceipt,
            ProofProjection, OwnerRefinding, Reconciliation, Repair, ...
  use: touch, fractional, complete, and proved software coverage
```

All selection controls use one feasible domain. Mandatory workstream/space coverage is a constraint, not an objective reward. Graph terms are descriptive; diversity is at most selection-influencing; causal improvement remains unestablished without independent implementation outcomes.

## Source hubs and open gates

| Boundary | Source candidate | Still open |
|---|---|---|
| repository/source truth | structural governance, direct typed Manager composition, exact-head candidate workflow, derived migration status | final exact-head all-job green result and stale-reference reconciliation |
| protocol/capability | current assignment/version interception for projected actions; assignment-scoped stream projection | live remote MCP/OAuth/provider/client lifecycle |
| database | forward migrations through `0078`, immutable ledger, focused PostgreSQL contracts | exact-head blank-ledger rerun and managed Supabase proof |
| target host/runtime | source boundaries and lifecycle contracts | target-host secrets, isolation, replacement, and recovery evidence |
| owner snapshot/stream | exact-scope snapshot, authority-version stream frames, cursor-before-delta, reconnect without intent replay | fixture-free browser, reconnect, and cross-account acceptance |
| golden work | revision → approval → effect → output → proof with projection repair | provider-backed three-role journeys and restart refinding |
| Model Gateway | shared DB admission, one provider identity, validated request bounds, accepted/failed/ambiguous settlement | provider sandbox idempotency and accepted-response-loss proof |
| commercial accounting | effect-bound usage, immutable adjustments, conservation | entitlement, invoice, refund, and billing lifecycle reconciliation |

## Resolved architectural liability

Production Manager assembly no longer mutates generated source. `apps/manager/src/server.ts` is committed, typechecked, built, tested, and used directly by package and Docker entrypoints. The removed template/generator/patch chain is not a compatibility authority and must not be reintroduced.

## Active authority map

- `STANDARD.md` plus ratified amendments — normative requirements.
- `decision/README.md` and `decision/protocol-v1.json` — computation contract.
- `decision/trace007/` — active WS-06/07/08 decision record.
- `production-readiness-program/README.md` — sole active production route.
- `production-readiness-program/20-ws06-ws08-commercial-effect-transaction.md` — current source transaction.
- `production-readiness-program/10-test-suite-disposition.md` — test/evidence classification.
- `production-readiness-program/07-verification-and-handoff-matrix.md` — evidence/handoff boundary.
- `docs/architecture/` — current source-backed explanation.
- `memory/MEMORY.md` — sole handoff index.
- `second-half-plan/`, `GAPS.md`, `REMEDIATION.md` — historical provenance only.

## Dependency order

1. Complete the exact-head `0078` decision/source/broad/PostgreSQL matrix without weakened assertions.
2. Apply and prove migrations through the source head on a disposable managed platform.
3. Run provider-backed idempotency, ambiguity, original-effect, and accounting reconciliation.
4. Run fixture-free golden journeys and restart proof refinding.
5. Complete target-host recovery, signed release, accessibility, capacity, pilot, deployment, and production gates.
