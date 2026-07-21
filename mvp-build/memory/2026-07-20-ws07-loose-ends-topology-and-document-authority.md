# WS-07 Loose Ends — Trace Topology and Document Authority

Date: 2026-07-20  
Task: `AMTECH-P0-DOC-COMPUTE-002`  
Branch: `agent/ws06-ws07-production`  
PR: #35, stacked on #34

## Why this transaction happened

A review of Trace007 and repository governance found two independent defects:

1. governance hard-pinned transient PR/migration/issue/candidate/objective/prose values and therefore carried more semantic weight than a structural repository validator should;
2. Trace007 used candidate IDs as hypergraph vertices, then treated candidate-edge touch and an unequal-feasibility objective comparison as architecture coverage and causal improvement.

## Corrected decision semantics

Trace007 now has two structures:

- `candidate_graph.json` — candidate trajectories, concept variants, shared boundaries, recombination lineage, diversity, redundancy, and candidate-edge touch;
- `software_invariant_hypergraph.json` — actual software entities/obligations and `touch`, `fractional`, `complete`, and `proved` coverage.

All controls use one feasible domain. Mandatory workstream/space coverage is a constraint rather than an objective bonus. The trace runs full, no-graph, no-diversity, evidence baseline, and at least 1,000 feasible random controls plus search and weight sensitivity.

Current classification:

```text
candidate graph terms: descriptive
software invariant graph terms: descriptive
diversity terms: descriptive or selection-influencing
causal improvement: unestablished
```

`implementation_ablation.json` is required before any causal promotion. The implementation transaction remains justified by repository evidence and invariants even if the mathematics is removed.

## Proof contract

Every software-invariant hyperedge maps to behavioral tests or named external acceptance in `verification_plan.json`. A complete proof plan is not accepted proof. `software_proved` remains unestablished until exact-candidate evidence passes.

## Document consolidation

The active authority surface is now:

```text
/AGENTS.md                repository authority, evidence, routing
/mvp-build/AGENTS.md      product invariants and task execution
/CLAUDE.md                short router
/mvp-build/CLAUDE.md      short router
/CODEGRAPH.md             repository routing
/mvp-build/CODEGRAPH.md   sole exact product status and executable topology
```

Root/scoped README, architecture, program, roadmap, workstream, test, verification, risk, and document-control maps were rewritten to route rather than mirror exact status.

## Governance correction

`verify-repository-governance.mjs` now checks:

- route/file existence;
- JSON decode, hash, schema, and references;
- candidate/software topology separation;
- equal-feasibility and non-causal classification;
- software-edge proof mapping;
- dynamic migration-head agreement;
- non-duplicated exact status;
- contributor/workflow entrypoints.

It no longer pins transient PR numbers, SHAs, migration values, issue counts, selected candidate IDs, objective values, causal labels, or prose fragments.

## Known source liability

Production Manager assembly still depends on generated server source and string-based patch transforms. Typed server composition is the next bounded source transaction. This documentation/trace cleanup records but does not implement that refactor.

## Evidence boundary

Established by source changes only until exact current workflows pass:

- corrected decision protocol and trace semantics;
- complete locally encoded candidate matrix and deterministic verifier;
- structural governance rewrite;
- contributor/document consolidation;
- software-invariant proof plan.

Not established:

- exact-head CI;
- managed database;
- live provider/connector;
- fixture-free golden work/browser/channel;
- target-host recovery;
- commercial lifecycle;
- typed server composition;
- signed release, pilot, deployment, or production.

## Next safe action

1. make the current exact-head focused workflow and main integration gates green without weakening assertions;
2. attach accepted evidence to software hyperedges only after the corresponding exact tests pass;
3. apply/prove the current migration head on a disposable managed platform;
4. run provider-backed original-effect reconciliation;
5. implement typed server composition as a separate computed source transaction.
