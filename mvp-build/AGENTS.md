# AGENTS.md — executable AI Employee agent interface

Status: active
Updated: 2026-07-23

## Start

1. Read `../identity.md`, root `AGENTS.md`, this file, `CODEGRAPH.md`, and `authority-map.json`.
2. Read `STANDARD.md` plus ratified amendments.
3. Resolve transaction state through `decision/active.json`, then read `decision/README.md` and `decision/representation-contract.md` for non-mechanical work.
4. Inspect only the exact source, tests, workflows, and evidence required.
5. When `decision/active.json` records an open non-mechanical transaction, commit the next valid `decision/traceNNN/` checkpoint before implementation.
6. Stop stronger claims on red exact-head evidence.

For employee UI, presentation adapters, themes, layouts, component variants, fixture scenarios, UI presets, or UI Lab work, also read in order:

1. `ui-lab/README.md` — canonical agent entry point;
2. `ui-lab/AGENTS.md`;
3. `docs/ux/02-current-ux-system-map.md`;
4. `docs/ux/10-ui-lab-live-workbench.md`;
5. `docs/adr/ADR-010-employee-ui-port-and-web-presentation-adapters.md`;
6. the completed or active UI decision trace and exact source/tests/scripts it names.

## Representation-first compute loop

```text
Q=(goal, non-goals, authority, evidence boundary, maximum patch)
→ repository and external evidence extraction
→ one or more machine-native representations
→ observations + explicit Unknowns
→ typed hypotheses, predictions, and counterexamples
→ evidence-and-invariants baseline
→ bounded candidate search
→ software-invariant hypergraph and other valid operators
→ formal/model certificates when useful
→ implementation compression (at most four trajectories)
→ executable verification
→ prediction/outcome calibration
→ compact human/agent language bridge
```

Typed repository nodes: `Observation`, `Hypothesis`, `Counterexample`, `Invariant`, `Candidate`, `Prediction`, `Test`, `Outcome`.

Valid transformations include:

- `Hypothesis + Evidence → RevisedHypothesis`
- `Candidate + Counterexample → RejectedCandidate`
- `Invariant + Generator → ExecutableTest`
- `Prediction + Outcome → CalibrationUpdate`

Store inspectable evidence, representations, generators, decisions, rejected alternatives, predictions, certificates, and outcomes. Do not store private chain-of-thought as repository authority.

## Machine-native representation freedom

Agents are encouraged to reason with the representation that best preserves the software relationships involved, including:

- AST/CST, control-flow, data-flow, call, import, dependency, provenance, and knowledge graphs;
- genuine hypergraphs, incidence matrices, dual hypergraphs, tensors, and multilinear operators;
- vectors, embeddings, kernels, eigenspaces, singular vectors, diffusion operators, and geometric/topological structures;
- transition systems, state machines, Petri nets, SAT/SMT models, proof terms, model-checker traces, and executable schemas;
- state-space, Koopman, DMD/DMDc/EDMDc, queueing, reliability, and control models when their data prerequisites hold.

Natural language is the audit/interoperability layer, not the mandatory reasoning substrate. Agents do not need to translate every intermediate vector, matrix, graph, or shape into prose.

Retained machine artifacts must expose their generator, schema/dimensions, provenance, assumptions, transformations, tolerances/seeds, validation, exact proof class, and a compact language bridge. Follow `decision/representation-contract.md`.

## Mathematical and proof guards

- Hypergraphs encode genuine many-way correctness obligations. Pairwise projection must not erase the obligation unless information loss is measured and accepted.
- Pareto, DPP, MCTS, spectral analysis, Tree/Graph of Thoughts, constraints, theorem proving, or other search layers may affect action whenever they change a decision, proof obligation, counterexample, or experiment.
- Eigenvalues, eigenvectors, eigenspaces, singular vectors, Laplacians, and related objects **may be mathematical proof or machine-checkable certificates** of properties of an explicitly constructed model when theorem assumptions, numerical residuals, conditioning, and transformations are valid and reproducible.
- A formal model-property proof becomes executable-software proof only when the representation-to-source/runtime correspondence is itself established strongly enough for that claim.
- Formal proof, representation fidelity, executable verification, causal benefit, and external/production acceptance are distinct proof classes; none is demoted, but none silently promotes itself across classes.
- Dependency feasibility and safety stop conditions remain hard constraints unless the formal result proves those constraints are satisfied.
- Do not hand-author scores, operators, edge weights, or graph structure to justify a desired patch.
- Unknown is never zero. An opaque latent vector without provenance or calibration is not authority.
- Hodge Laplacians require a true simplicial/cellular complex with valid boundary operators.
- Koopman/DMD/DMDc/EDMDc requires homogeneous, consistently sampled, task-conditioned episodes, held-out evaluation, and comparison with persistence and ordinary regression.

## Stable runtime roots

`apps/`, `packages/`, `infra/`, `tests/`, and `scripts/` are executable paths. Do not move them for documentation aesthetics. Before any path mutation derive:

```text
Impact(f)=imports ∪ callers ∪ scripts ∪ tests ∪ workflows ∪ docs
```

## Authority and evidence

`authority-map.json` is the machine router. Normative requirements, current topology, active plan, source, tests, formal certificates, workflows, and retained external evidence remain distinct. CI is not provider proof; source is not deployment; fixtures are not production acceptance. A verified formal certificate is proof for its declared mathematical/model property and may satisfy a software gate only when the gate’s correspondence contract says so.

For UI work, also keep these distinctions:

- a theme/layout/component strategy is not an adapter;
- a UI Lab preset is not a page fork;
- a dirty draft is not reproducible or assignable;
- a green browser test is not aesthetic approval;
- a fixture screenshot is not live or production evidence.

## Finish

Run the applicable formal/model verifiers and focused behavioral matrix, then repository map and governance checks. Run broad tests and builds when available. Record unavailable external gates as blockers, never as passes. Preserve managed database, provider, browser/channel, target-host, commercial, recovery, trusted signing, pilot, deployment, and production as separate evidence classes unless an explicit verified correspondence legitimately satisfies a defined gate.
