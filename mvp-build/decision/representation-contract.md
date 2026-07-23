# Machine-Native Software Representation Contract

Status: **active additive decision-method authority**  
Updated: 2026-07-23  
Router: [`active.json`](active.json)  
Protocol: [`README.md`](README.md)

## Principle

Agents are encouraged to represent and reason about software using the most useful inspectable medium, including representations that are primarily non-linguistic.

Natural language is an interoperability, review, and audit layer. It is not the mandatory internal substrate of repository reasoning.

A valid decision transaction may be driven primarily by:

- vectors, matrices, tensors, and sparse operators;
- abstract/concrete syntax trees;
- control-flow, data-flow, call, import, ownership, dependency, and provenance graphs;
- weighted directed graphs, multigraphs, bipartite graphs, factor graphs, and knowledge graphs;
- genuine hypergraphs and incidence structures;
- simplicial or cellular complexes when valid boundary operators exist;
- state machines, transition systems, Petri nets, event structures, and process algebras;
- SAT/SMT constraints, logical formulae, proof terms, model-checker state spaces, and counterexample traces;
- geometric embeddings, manifolds, metric spaces, polytopes, cones, and feasible regions;
- graph/hypergraph Laplacians, eigenspaces, spectral projectors, singular vectors, kernels, and diffusion operators;
- state-space, Koopman, DMD/DMDc/EDMDc, Markov, Bayesian, queueing, reliability, and control models;
- executable schemas, generated inventories, typed tuples, automata, and machine-checkable contracts;
- learned code/change embeddings when their task meaning and calibration are explicit.

Agents should prefer representations that preserve the relationships relevant to the task. A many-way invariant should not be reduced to unrelated pairs merely because prose or ordinary graphs are more familiar.

## Representation-first workflow

```text
source, tests, workflows, evidence, and external observations
→ typed extraction into one or more machine-native representations
→ dimensional and semantic validation
→ transformations, search, proof, simulation, or inference
→ candidate and counterexample generation
→ implementation compression
→ executable verification
→ outcome calibration
→ concise language bridge for humans and other agents
```

Agents need not translate every intermediate vector, matrix, shape, or graph into prose. They must make the selected result, assumptions, transformations, evidence links, and proof boundary inspectable.

## Required artifact contract

A retained non-language artifact must include or link to:

1. **Generator or extraction rule** — how repository/external evidence becomes the representation.
2. **Schema and dimensions** — vertex/member meanings, axes, units, orientation, domains, and missing-value semantics.
3. **Provenance** — exact source paths, SHAs, test/evidence references, and external inputs.
4. **Transformation contract** — equations, algorithms, parameters, seeds, tolerances, and deterministic/non-deterministic status.
5. **Assumptions** — theorem prerequisites, sampling assumptions, independence assumptions, stationarity, fidelity limits, and bounded approximations.
6. **Validation** — shape checks, conservation checks, residuals, reconstruction error, held-out error, mutation tests, and counterexamples as applicable.
7. **Proof class** — exactly what property is certified and at what evidence layer.
8. **Language bridge** — a compact interpretation sufficient for review and downstream action.

Opaque vectors without provenance, semantics, or validation are scratch data, not repository authority.

## Proof classes

### P0 — Representation calculation

A computed value, embedding, clustering, centrality score, spectral coordinate, or simulation result.

This is an observation about the chosen representation. It may guide search but is not yet a proof.

### P1 — Formal model-property proof or certificate

A mathematical derivation or machine-checkable certificate may prove a property of an explicitly constructed model.

Examples:

- an eigenpair with bounded residual;
- positive semidefiniteness or a spectral bound;
- graph or hypergraph connectivity under the declared operator;
- a cut, expansion, mixing, convergence, observability, controllability, or stability property;
- conservation in a transition/incidence model;
- reachability, unreachability, deadlock freedom, or an explicit counterexample in a model checker;
- satisfiability/unsatisfiability with a proof certificate;
- a valid Hodge decomposition on a true complex;
- a verified invariant over a state-transition model.

A P1 result **is proof** for the exact formal property under the declared model and assumptions. Eigenvectors and other spectral objects are explicitly allowed to be the decisive proof instrument when mathematically appropriate.

### P2 — Representation-fidelity proof

Evidence that the model corresponds to the repository boundary it claims to represent.

Examples:

- generated AST/CFG/call graph parity against the compiler or source inventory;
- every migration, route, effect, state, or dependency mapped exactly once;
- mutation tests showing the extractor detects relevant source changes;
- reconstruction or round-trip equality;
- bisimulation/refinement between executable state machines;
- proof that hyperedge membership matches the actual multi-party invariant;
- bounded embedding error on held-out labeled repository examples.

P2 can be formal, executable, empirical, or a combination. Without sufficient P2, P1 proves only the abstract model property.

### P3 — Executable software proof

Accepted behavioral evidence on the exact candidate: typechecking, unit/integration/property/model-based tests, database proofs, builds, browser tests, image identity, or other executable verification.

A P1+P2 chain may satisfy part or all of P3 only when the repository defines and verifies a sound correspondence from the formal model to the executable boundary. Otherwise P3 remains separately required.

### P4 — External/production acceptance

Managed database, live provider, target-host, real browser/channel/accessibility, commercial, recovery, trusted signing, pilot, deployment, and production evidence.

P1, P2, and P3 can be prerequisites but do not automatically establish P4.

## Eigenvector and spectral proof policy

Eigenvectors, singular vectors, eigenspaces, spectra, and projectors may be used as:

- formal certificates of operator-defined properties;
- solutions to relaxed optimization problems;
- proofs of connectivity, decomposition, stability, observability, controllability, convergence, or mode separation when theorems support the claim;
- dimensionality-reduction bases with measured reconstruction or predictive error;
- centrality or influence measures under an explicit operator;
- hypothesis generators for shared prerequisites, bottlenecks, failure propagation, and implementation leverage;
- components of model-checkable or experimentally testable predictions.

They are not restricted to descriptive use.

Required guards:

- define the operator and its domain exactly;
- state whether the matrix/operator is symmetric, normal, stochastic, positive semidefinite, directed, signed, weighted, or non-normal;
- report normalization and weight semantics;
- verify residuals, multiplicity, numerical conditioning, and tolerance;
- distinguish exact theorem, relaxation, approximation, and learned heuristic;
- test sensitivity to plausible graph/hypergraph construction and weight changes;
- declare the exact property proved;
- establish P2 correspondence before using a model-property proof as software proof;
- do not extend the proof to causal benefit or production acceptance without the required additional evidence.

A dominant eigenvector may be decisive when it solves the declared mathematical problem. It must not be renamed “the best feature” unless the mapping from that mathematical solution to the feature decision is itself justified and verified.

## Hypergraph and higher-order representations

Use a hypergraph when a correctness, failure, ownership, or proof obligation genuinely depends on three or more members jointly.

For incidence matrix `H`, hyperedge weights `W`, vertex degree matrix `D_v`, and hyperedge degree matrix `D_e`, an allowed normalized operator is:

```text
L = I - D_v^(-1/2) H W D_e^(-1) Hᵀ D_v^(-1/2)
```

Other hypergraph operators are allowed when their semantics and theorem basis are documented. Do not assume all hypergraph Laplacians are interchangeable.

Agents may use:

- primal and dual hypergraphs;
- edge-to-node dual transformations;
- hyperedge embeddings;
- tensor adjacency and multilinear eigenproblems;
- clique/star expansions when information loss is measured and acceptable;
- simplicial/cellular representations when orientation and boundary maps matter;
- hypergraph cuts, diffusion, centrality, communities, and spectral certificates.

Pairwise expansion is a derived view, not automatically the authoritative representation.

## Vector and embedding policy

Learned or engineered embeddings may represent code, changes, traces, tests, plans, failures, and proof obligations.

Useful roles include:

- semantic retrieval and clustering;
- duplicate or near-duplicate candidate detection;
- anomaly and outlier discovery;
- patch/test/evidence matching;
- trajectory similarity;
- latent factor discovery;
- proposal generation for recombination or counterexamples.

An embedding dimension has no intrinsic human semantic meaning unless identified and validated. Similarity is not equivalence. A useful embedding requires task-specific held-out evaluation or a clearly bounded exploratory role.

## Shape and topology policy

Agents may reason with geometric and topological structures when they preserve useful invariants:

- feasible polytopes and cones for dependency/resource constraints;
- manifolds or local charts for continuous configuration spaces;
- simplicial complexes for valid higher-order face relations;
- persistent homology for stable holes/components across thresholds;
- Hodge decompositions for flows on valid complexes;
- Morse/energy landscapes for optimization or failure basins;
- category/commutative diagrams for typed composition and authority-preserving mappings.

The representation must define what geometric or topological feature means in repository terms and what executable observation could falsify the interpretation.

## Dynamic and trajectory representations

State-space and operator-learning methods are encouraged for repeated comparable episodes.

Koopman/DMD/DMDc/EDMDc or related models require:

- homogeneous task-conditioned episodes;
- consistent sampling and state definitions;
- explicit controls/inputs when present;
- train/validation/test separation;
- one-step and multistep held-out evaluation;
- comparison with persistence and ordinary regression;
- residual, uncertainty, and diversity analysis;
- disablement when the model does not outperform simpler baselines.

A fitted operator may prove algebraic properties of the fitted model at P1. Predictive or causal claims require held-out or intervention evidence at the appropriate class.

## Multi-representation reasoning

One task may use several concurrent representations without forcing them into one space:

```text
syntax graph ⊕ runtime transition system ⊕ invariant hypergraph
⊕ evidence tensor ⊕ candidate embedding ⊕ dependency DAG
⊕ commercial conservation model ⊕ recovery state machine
```

Cross-representation mappings must be explicit. Dimensions from unrelated spaces must not be silently averaged or compared.

A useful pattern is:

```text
language query
→ repository graph extraction
→ hypergraph invariant construction
→ vector/tensor candidate encoding
→ spectral or constraint-based exploration
→ state-machine counterexample generation
→ executable test generation
→ language summary
```

## Agent freedom and auditability

Agents may:

- use non-language representations for most internal repository-facing analysis;
- create machine-readable artifacts before prose;
- use theorem provers, solvers, numerical linear algebra, graph algorithms, geometric methods, learned embeddings, and simulations;
- select an implementation because a valid formal certificate changes the decision;
- keep language output compact when the machine artifacts are complete and reproducible.

Agents must not:

- retain private chain-of-thought as authority;
- present an uninterpretable latent vector as self-authenticating truth;
- hide assumptions, mappings, residuals, seeds, tolerances, or failed controls;
- conflate proof inside a model with proof of model fidelity;
- conflate executable proof with external production acceptance;
- invent a mathematical representation after selecting the desired patch merely to rationalize it.

## Research basis

This contract builds on established results that higher-order relationships can lose information when squeezed into pairwise graphs, that spectral hypergraph operators support clustering and embedding, and that code and code changes can be represented as learned vectors or heterogeneous program graphs. These results justify representation plurality; repository-specific usefulness and proof still require the artifact, fidelity, and evidence contracts above.
