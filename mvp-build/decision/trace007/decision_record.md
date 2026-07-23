# Trace 007 — WS-06/07 transaction and bounded WS-08 groundwork

## Authority

- Repository: `benamtech/ai-employee-v1`
- Stack: PR #34 owner-runtime base → PR #35 candidate
- Source migration head: `0076`
- Evidence order: applied durable state → executable source/config → exact-SHA executable evidence → Standard/program → architecture → memory → PR prose

This trace is decision evidence only. It does not establish source correctness, CI, managed database, provider, browser/channel, target-host, commercial lifecycle, release, pilot, deployment, or production acceptance.

## Candidate matrix

The trace retains:

- `B288 = W3 × L12 × H8` authority/evidence extraction;
- 64 candidates across `current`, `feature`, `counterfactual`, and `recombination` batches;
- 16 scored dimensions with explicit `Unsupported` and prerequisite debt;
- one coherent implementation transaction: `D01,D02,D03,D04,D06,D07`.

The implementation remains justified by repository evidence, production invariants, and dependency prerequisites even when the mathematical machinery is removed.

## Corrected topology

Trace007 previously used one hypergraph whose vertices were candidate IDs. That structure could measure candidate grouping and edge touch, but it could not measure complete software invariants.

The trace now separates:

1. `candidate_graph.json` — candidate trajectories and relations used for diversity, redundancy, lineage, similarity, and candidate-edge touch;
2. `software_invariant_hypergraph.json` — actual software entities and obligations used for `touch`, `fractional`, `complete`, and `proved` coverage.

`C_complete` and `C_proved` are never computed from candidate-group edges.

## Corrected controls

All controls use the same feasible domain:

```text
16 validated candidates
+ all mandatory workstream coverage
+ all mandatory Z-space coverage
+ repository invariant feasibility
```

Mandatory coverage is a constraint, not a `+0.20` reward.

`compute.py` compares:

- full objective;
- no-graph objective;
- no-diversity objective;
- simple evidence/value/testability/risk/scope baseline;
- at least 1,000 feasible random sets.

It also reports deterministic multi-start search sensitivity and bounded weight sensitivity.

The prior `J=0.5818732` versus `J=0.2346884` comparison is retained only as historical context. The utility control failed the same coverage condition that rewarded the joint set, so that delta is invalid as a graph/diversity ablation.

## Current classification

```text
candidate graph terms: descriptive
software invariant graph terms: descriptive
diversity terms: selection-influencing when equal-feasibility selections differ
causal improvement: unestablished
```

Selection influence is not causal improvement. Causal promotion requires `implementation_ablation.json` to show better independent outcomes for the implementation and proof surface.

## Software transaction

```text
immutable request or work revision
→ exact assignment, authority, entitlement, and approval
→ atomic shared rate and budget admission
→ one durable command/effect and provider idempotency identity
→ accepted | failed | ambiguous durable outcome
→ original-effect reconciliation before retry
→ accepted effect-bound accounting receipt
→ output and owner proof bound to the same revision/effect
→ projection repair without repeating an accepted effect
```

`software_invariant_hypergraph.json` models these obligations directly. `verification_plan.json` maps every software hyperedge to a complete behavioral proof plan. Proof status remains `unestablished` until exact executable evidence is attached.

## Predictive-model boundary

No Koopman, Hodge, COCONUT, continuous hidden-state, latent BFS, or phase-switching implementation is claimed. Predictive models remain disabled because this trace has no repeated comparable trajectories and no held-out result that beats the simpler baseline.

## Repository cleanup consequence

- snapshot-specific governance assertions are being replaced by schema, reference, evidence-class, routing, and reproducibility invariants;
- contributor policy is consolidated into one root contract, one scoped product contract, and short compatibility routers;
- current status is not duplicated across every contributor document;
- opaque derived matrices are regenerated from compact topology descriptors.

The corrected trace is useful when it expands search and exposes dependencies. It is non-causal when it does not outperform the simpler baseline.
