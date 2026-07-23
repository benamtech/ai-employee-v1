# Repository-Native Software Experiment Protocol

Status: **active for non-mechanical `mvp-build` work**  
Updated: 2026-07-23  
Machine contract: [`protocol-v1.json`](protocol-v1.json)  
Executable engine: [`engine/repoctl.mjs`](engine/repoctl.mjs)  
Representation registry: [`engine/representation-registry.json`](engine/representation-registry.json)  
Representation contract: [`representation-contract.md`](representation-contract.md)  
Transaction router: [`active.json`](active.json)  
Latest completed trace: [`trace013/`](trace013/)  
Next trace: `trace014`, reserved and not created

## Purpose

Compile exact repository truth and a task into a bounded experiment transaction usable by any agent or human:

```text
repository facts
→ typed representations
→ verified transformations
→ task capsule and predeclared predictions
→ admitted plan
→ implementation
→ executable evidence and outcomes
→ finished transaction
```

Natural language is a generated interoperability and audit view. Machine artifacts own semantics.

## Commands

```bash
node decision/engine/repoctl.mjs doctor
node decision/engine/repoctl.mjs self-test
node decision/engine/repoctl.mjs start --task task.json --out decision/traceNNN
node decision/engine/repoctl.mjs admit-plan --transaction decision/traceNNN --plan plan.json
node decision/engine/repoctl.mjs evaluate --transaction decision/traceNNN
node decision/engine/repoctl.mjs finish --transaction decision/traceNNN
node decision/engine/repoctl.mjs verify --transaction decision/traceNNN --phase finished
```

## Required chronology

```text
exact authority and Git coordinate
→ content-addressed facts
→ representation selection
→ task capsule
→ predictions and falsifiers
→ candidates and baseline comparison
→ plan admission
→ source edits
→ executable verification
→ outcomes and calibration
→ exact-head and required external gates
```

## Always-on representations

- `repo.fact.v1`
- `authority.dag.v1`
- `dependency.graph.v1`
- `invariant.hypergraph.v1`
- `correspondence.v1`
- `task.diffusion.v1`
- `effect.frontier.v1`
- `experiment.design.v1`

The first specialized implementation is `spectral.hypergraph.v1`. Other dialects activate only under registered admission conditions.

## Proof classes

```text
P0 representation calculation or hypothesis
P1 verified property of an explicit formal model
P2 verified representation-to-repository correspondence
P3 exact-candidate executable software evidence
P4 external or production acceptance
```

No class silently promotes itself. Causal engineering benefit requires appropriate intervention or outcome evidence.

## Planning rules

- Use the proportional tier from `protocol-v1.json`.
- For T3, generate current, feature, and counterfactual batches independently before recombination.
- Filter hard invariants and prerequisites before scoring.
- Preserve an evidence-and-invariants baseline in the same feasible domain.
- Separate exploration from implementation compression.
- Give every hard hyperedge accepted proof, planned proof, or an explicit blocker.
- Bound paths, file count, rollback, and stop conditions.
- Record discovered-later paths rather than silently broadening scope.

Trace013 implements the complete initial vertical slice and a six-case retrospective benchmark. Its causal superiority remains unestablished until prospective matched tasks produce independent outcomes.

## Queries

```bash
repoctl query authority
repoctl query impact
repoctl query invariants
repoctl query proofs
repoctl query effects
repoctl query evidence
```

Actual invocation uses `node decision/engine/repoctl.mjs ...` and returns structured JSON.

## Safety

- Dirty work is rejected by default and never reset, cleaned, stashed, or hidden.
- Verification commands are argv arrays executed without a shell.
- Artifact paths remain inside the repository.
- Every P1 claim includes model, assumptions, certificate, verifier, correspondence, residual/tolerance, and excluded claims.
- Private chain-of-thought is not retained as authority.
- P4 gates remain external until actually crossed.
