# Trace 007 — WS-06/07 production transaction and WS-08 groundwork

## Authority

- Repository: `benamtech/ai-employee-v1`
- Base authority: PR #34 exact head `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a`
- Stacked branch: `agent/ws06-ws07-production`
- Authority order: source/migrations/tests/workflows > exact reviewed evidence > architecture/plan > memory > PR prose.

## Computed result

The canonical generator produced 64 candidates in four isolated batches. The joint hypergraph/quality-diversity selection achieved `J=0.5818732` versus utility-only `J=0.2346884` and diversity-only `J=0.56291544`. The selected set differs materially from utility-only and restores complete applicable workstream/Z-space coverage, so graph/diversity terms are **causal**, not merely descriptive.

## Selected production transaction

`D01, D02, D03, D04, D06, D07` compresses to one transaction:

1. atomically admit a stable request using shared budget and rate authority;
2. dispatch with one provider idempotency identity;
3. persist accepted, failed, or ambiguous outcome;
4. reconcile ambiguity before retry;
5. bind accepted effect receipt to accounting;
6. project exact revision/output/proof and repair projection after crash without repeating the effect.

## Repository cleanup rule

Trace 007 is the only active manifold trace for WS-06/07/08. Older traces remain historical evidence only when referenced by the document authority map; incomplete trace transports are removed. `compute.py` regenerates all numeric artifacts from compact evidence-backed descriptors, preventing opaque matrix bloat.

The useful research pattern is retained as **evidence-bounded forced dreaming**: four independent candidate batches, cross-lens recombination, genuine hypergraph dependencies, explicit unsupported penalties, and a separate implementation compression. It may expand possibility space, but it cannot override repository invariants or promote evidence classes.

## Evidence boundary

This transaction may establish source, unit, integration, CI, and local acceptance evidence. It does not by itself establish live-provider, managed-database, target-host, pilot, or production evidence.
