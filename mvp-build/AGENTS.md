# AGENTS.md — executable AI Employee agent interface

Status: active

## Start

1. Read `../identity.md`, root `AGENTS.md`, this file, `CODEGRAPH.md`, and `authority-map.json`.
2. Read `STANDARD.md` plus ratified amendments.
3. Resolve the active transaction through `decision/active.json` and the active production route.
4. Inspect only the exact source, tests, workflows, and evidence required.
5. For non-mechanical work, commit the next `decision/traceNNN/` checkpoint before implementation.
6. Stop stronger claims on red exact-head evidence.

## Compute-frontloaded loop

```text
Q=(goal, non-goals, authority, evidence boundary, maximum patch)
→ observations + explicit Unknowns
→ typed hypotheses and counterexamples
→ evidence-and-invariants baseline
→ bounded candidate search
→ software-invariant hypergraph
→ implementation compression (at most four trajectories)
→ executable verification
→ prediction/outcome calibration
```

Typed nodes only: `Observation`, `Hypothesis`, `Counterexample`, `Invariant`, `Candidate`, `Prediction`, `Test`, `Outcome`.

Valid transformations include:

- `Hypothesis + Evidence → RevisedHypothesis`
- `Candidate + Counterexample → RejectedCandidate`
- `Invariant + Generator → ExecutableTest`
- `Prediction + Outcome → CalibrationUpdate`

Store inspectable evidence, decisions, rejected alternatives, predictions, and outcomes. Do not store private chain-of-thought as repository authority.

## Mathematical guards

- Hypergraphs encode genuine many-way correctness obligations. Pairwise projection must not erase the obligation.
- Pareto, DPP, MCTS, spectral analysis, Tree/Graph of Thoughts, or other search layers affect action only when they alter or outperform the simple evidence-and-invariants baseline.
- Koopman, DMDc, or EDMDc is longitudinal instrumentation only. Fit only homogeneous, consistently sampled, task-conditioned episodes; compare held-out one-step and multistep error with persistence and ordinary regression.
- Hand-authored scores, graph density, eigenvalues, candidate-edge touch, and representation coverage are not architecture proof or causal evidence.
- Unknown is never zero. Representation is never proof.

## Stable runtime roots

`apps/`, `packages/`, `infra/`, `tests/`, and `scripts/` are executable paths. Do not move them for documentation aesthetics. Before any path mutation derive:

```text
Impact(f)=imports ∪ callers ∪ scripts ∪ tests ∪ workflows ∪ docs
```

## Authority and evidence

`authority-map.json` is the machine router. Normative requirements, current topology, active plan, source, tests, workflows, and retained evidence remain distinct. CI is not provider proof; source is not deployment; fixtures are not production acceptance.

## Finish

Run the applicable focused matrix, then the repository map and governance checks. Run broad tests and builds when available. Record unavailable external gates as blockers, never as passes. Preserve managed database, provider, browser/channel, target-host, signed-release, pilot, deployment, and production as separate evidence classes.