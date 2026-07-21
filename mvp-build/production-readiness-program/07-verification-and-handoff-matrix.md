# Verification and Handoff Matrix

Status: **active evidence checklist**  
Exact candidate and migration status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision protocol: [`../decision/README.md`](../decision/README.md)

## Evidence classes

```text
decision reproducibility
→ documentation
→ source
→ unit
→ integration
→ exact-head CI
→ managed database
→ provider/connector
→ target host/runtime
→ browser/channel/accessibility
→ commercial lifecycle
→ recovery/rollback
→ signed release
→ pilot
→ deployment
→ production
```

A higher class may depend on a lower one. It never inherits acceptance automatically.

## Gate matrix

| Gate | Required evidence |
|---|---|
| decision record | candidate matrix, split topology, equal-feasibility controls, search/weight sensitivity, implementation compression, proof plan, deterministic verifier |
| document authority | one repository contract, one product contract, short compatibility routers, one exact-status owner, historical separation |
| normative requirements | ratified Standard plus amendments; no document silently weakens them |
| source/type/lint/contracts | exact-head source and generated-config checks |
| broad regression | exact-head complete surviving suites with no weakened assertions |
| build | exact-head production compilability |
| repository archaeology | active/orphan/stale-reference proof |
| database | blank forward ledger, existing-row compatibility, isolation/concurrency/security, required managed-platform proof |
| connector/protocol | live authorization, scope, health, revocation, outage, repair, deletion, client/host conformance |
| owner/channels | fixture-free owner, assignment, connector, snapshot/reconnect, Web/SMS/Review convergence |
| golden work | provider-backed Website/Contractor/Bookkeeping revision → approval → effect → receipt/accounting → output/proof → replay/restart |
| commercial ambiguity | multi-replica rate/budget/effect/accounting/reconciliation plus provider and billing proof |
| recovery/release | fault, repair, rollback, backup/restore, telemetry, provenance, typed composition, signed manifest |
| human/capacity/pilot | supported browsers, accessibility, fairness/capacity, pilot entry/exit/incident/rollback |
| production | every non-waivable gate on one exact signed deployed candidate |

Current state for each gate is recorded in `../CODEGRAPH.md` and `13-resolution-ledger.json`, not duplicated here.

## Decision handoff

A consequential handoff records:

- tier and protocol revision;
- authority basis and observed/unknown reconciliation;
- candidate batches and dimensions;
- candidate graph construction and allowed semantic use;
- software invariant vertices, hyperedges, candidate mapping, and touch/fractional/complete/proved coverage;
- one feasible domain shared by full, no-graph, no-diversity, evidence baseline, and random controls;
- search sensitivity and weight sensitivity;
- selected exploration and separate implementation compression;
- complete behavioral proof plan for every selected software edge;
- implementation ablation status and independent outcomes;
- evidence classes not established.

For Trace007:

```text
Tier: T3
Candidates: 64
Candidate topology: search-only
Software topology: actual invariant entities/obligations
Random feasible baselines: at least 1,000
Search restarts: at least 32
Weight sensitivity runs: at least 32
Graph terms: descriptive
Diversity terms: descriptive or selection-influencing
Causal improvement: unestablished
Implementation: decision/trace007/selected_implementation.json
```

Do not copy objective snapshots or selected IDs into multiple active documents. The exact verifier output and canonical implementation file own those details.

## Source candidate boundary

The current source transaction intends to establish:

- shared PostgreSQL rate and worst-case budget admission;
- stable request/revision/effect/provider identity;
- accepted, failed, denied, refunded, and durable ambiguous settlement;
- accepted effect-bound accounting and conservation;
- original-effect reconciliation;
- exact artifact revision/approval/effect/output/proof continuity;
- projection repair without republishing;
- reconciliation, repair, and lineage views;
- focused behavioral and PostgreSQL tests;
- focused exact-head workflow.

Intent and source shape are not accepted evidence until exact tests run and pass.

## Test and proof rules

- Broad and curated suites are independently reported.
- Decision verification is not runtime verification.
- Candidate-edge touch is not software coverage.
- Software completeness is not proof.
- `software_proved` requires exact accepted behavioral evidence.
- Fixture browser proof is not fixture-free provider/channel proof.
- Local PostgreSQL is not managed-platform proof where a platform trigger applies.
- Provider mocks do not establish provider idempotency or accepted-response-loss behavior.
- `skipped`, unavailable, and blocked remain visible.
- Documentation commits after an implementation run require final exact-head checks.
- Reconciliation and repair preserve original effect identity and accepted evidence.

## Handoff transaction

```text
exact branch/base/head and source migration head
→ decision verifier output and sensitivity
→ source/migration/test/workflow changes
→ exact commands/runs/results
→ external prerequisites and blocked classes
→ CODEGRAPH/program/architecture update
→ one dated memory handoff
→ MEMORY.md index
→ PR or release record
```

A workstream or release claim is complete only when the decision record, executable implementation, exact-head verification, required external evidence, and active documentation agree on the same candidate.
