# Repository-Native Software Experiment Protocol

Status: **active for non-mechanical `mvp-build` work**  
Updated: 2026-07-23  
Machine contract: [`protocol-v1.json`](protocol-v1.json)  
Executable engine: [`engine/repoctl.mjs`](engine/repoctl.mjs)  
Representation registry: [`engine/representation-registry.json`](engine/representation-registry.json)  
Representation and proof contract: [`representation-contract.md`](representation-contract.md)  
Transaction router: [`active.json`](active.json)  
Active implementation trace: [`trace013/`](trace013/)

## Purpose

Compile exact repository truth and a task into a bounded, inspectable experiment transaction that any coding agent or human can execute.

```text
repository facts
→ typed representations
→ verified transformations
→ task capsule and predeclared predictions
→ admitted plan
→ isolated implementation
→ executable evidence and outcomes
→ finished transaction
```

This is compiler infrastructure, not a prompt convention. Natural language is a generated interoperability and audit view; machine artifacts own semantics.

## Canonical commands

From `mvp-build`:

```bash
node decision/engine/repoctl.mjs doctor
node decision/engine/repoctl.mjs self-test
node decision/engine/repoctl.mjs start --task task.json --out decision/traceNNN
node decision/engine/repoctl.mjs admit-plan --transaction decision/traceNNN --plan plan.json
node decision/engine/repoctl.mjs evaluate --transaction decision/traceNNN
node decision/engine/repoctl.mjs finish --transaction decision/traceNNN
node decision/engine/repoctl.mjs verify --transaction decision/traceNNN --phase finished
```

The engine is repository-owned, lockfile-independent at task execution, vendor-neutral, and does not download a remote skill. Verification commands are argv arrays executed without a shell.

## Required chronology

```text
exact authority and Git coordinate
→ content-addressed repository facts
→ representation selection
→ task capsule
→ predictions and falsifiers
→ candidate generation and comparison
→ plan admission
→ source edits
→ focused and broad executable verification
→ outcomes and calibration
→ finish verifier
→ exact-head and required external gates
```

The capsule, prediction set, and admitted plan must predate source changes. Outcomes never overwrite predictions.

## Always-on representation cascade

Every non-mechanical task receives:

1. `repo.fact.v1` — tracked files, digests, symbols, imports, scripts, workflows, tests, references, and authority relations at an exact SHA.
2. `authority.dag.v1` — active routing and evidence-class ordering.
3. `dependency.graph.v1` — observed dependency, execution, proof, and documentation relations.
4. `invariant.hypergraph.v1` — genuine cardinality-three-or-greater joint obligations.
5. `correspondence.v1` — P2 source-to-hypergraph membership parity.
6. `task.diffusion.v1` — task-local graph and hypergraph context expansion.
7. `effect.frontier.v1` — typed first-through-fourth-order relations with direction, uncertainty, evidence, and falsifier.
8. `experiment.design.v1` — baseline, predictions, metrics, outcomes, and stop conditions.

The selector activates specialized representations only when their registered admission conditions hold. The first implemented specialization is `spectral.hypergraph.v1`. State-machine, SMT, e-graph, queueing, Koopman, topology, and embedding dialects are registered future work, not simulated capabilities.

## Proof taxonomy

- **P0 — representation calculation:** ranking, diffusion, embedding, mode, simulation, or hypothesis.
- **P1 — formal model-property certificate:** a small verifier proves an exact property of an explicit model. A checked eigenpair is real proof of its operator property.
- **P2 — representation fidelity:** verified correspondence between model members/relations and exact repository facts.
- **P3 — executable software evidence:** tests, typecheck, integration, build, database, browser, image, or other exact-candidate execution.
- **P4 — external acceptance:** managed database, live provider, target host, accessibility, commercial lifecycle, recovery, trusted signing, pilot, deployment, or production.

No class silently promotes itself. P1 may satisfy a software gate only when P2 correspondence makes the implication sound. Engineering causality requires intervention or outcome evidence; production acceptance remains separate.

## Candidate and experiment rules

- Select a proportional tier from `protocol-v1.json`.
- Generate `current`, `feature`, and `counterfactual` batches independently before recombination for T3 work.
- Filter prerequisites and hard invariants before scoring.
- Preserve an evidence-and-invariants baseline inside the same feasible domain.
- Use graph, hypergraph, spectral, constraint, geometric, or learned representations when they change a decision, proof obligation, counterexample, or experiment.
- Separate exploration from implementation compression.
- Map every hard hyperedge to accepted proof, planned proof, or explicit blocker.
- Bound file count, allowed paths, rollback, and stop conditions.
- Record discovered-later paths with evidence rather than silently broadening scope.

Trace013 implements a 64-candidate, four-batch selection record and chooses the smallest complete vertical slice: facts, registered representations, P1/P2 certificates, task capsule, chronology, executable evaluation, outcome calibration, and queries.

## Query interface

```bash
node decision/engine/repoctl.mjs query authority --transaction <path> --entity <name>
node decision/engine/repoctl.mjs query impact --transaction <path> --path <repo-path>
node decision/engine/repoctl.mjs query invariants --transaction <path> --entity <name>
node decision/engine/repoctl.mjs query proofs --transaction <path> --hyperedge <id>
node decision/engine/repoctl.mjs query effects --transaction <path> --depth 4
node decision/engine/repoctl.mjs query evidence --transaction <path> --claim <id>
```

Outputs are structured JSON. Generated Markdown views do not duplicate authority.

## Evidence and safety

- Dirty work is rejected by default and is never reset, cleaned, stashed, or hidden.
- Artifact paths are confined to the repository root.
- Every retained representation carries generator, source SHA, input/output digests, schema, parameters, assumptions, validation, proof class, and excluded claims.
- Every P1 claim carries a model, certificate, correspondence digest, verifier, residual/tolerance, assumptions, and nonclaims.
- Exact-head CI does not establish provider, host, pilot, deployment, or production evidence.
- Private chain-of-thought is never retained as repository authority.

## Validation

```text
Trace013 deterministic selector
→ engine doctor
→ isolated full lifecycle self-test
→ decision-engine Vitest contract
→ repository agentic/governance checks
→ typecheck/lint
→ broad unit regression
→ workspace build
→ PostgreSQL integration
→ Compose and five-image release candidate
→ exact stack reconciliation
```

The experiment compiler becomes mandatory infrastructure now because its artifact integrity and lifecycle are executable. Whether it improves engineering outcomes causally remains an explicit longitudinal experiment, not a documentation claim.
