# Computation-First Decision Protocol

Status: **active for non-mechanical `mvp-build` work**  
Updated: 2026-07-23  
Machine contract: [`protocol-v1.json`](protocol-v1.json)  
Machine-native representation contract: [`representation-contract.md`](representation-contract.md)  
Transaction router: [`active.json`](active.json)  
Latest completed trace: [`trace012/`](trace012/)  
Next trace: `trace013`, reserved and not created until a fresh post-merge branch begins

No decision transaction is currently open. Completed traces explain implemented decisions and evidence boundaries; they do not preselect the next task.

## Purpose

Expand useful possibility space, then compress action into the smallest coherent implementation that preserves repository invariants and advances the production goal.

Agents should use the representation that preserves the relevant software relationships best. Natural language is the interoperability and audit layer, not the mandatory reasoning substrate. Graphs, hypergraphs, vectors, tensors, embeddings, formal systems, state machines, geometric/topological structures, and executable matrices are first-class artifacts under `representation-contract.md`.

Computation is useful when repository evidence feeds it and it changes at least one of:

- candidate admission or rejection;
- implementation scope;
- dependency order;
- proof obligations;
- counterexample coverage;
- experiment design;
- rollback or stop conditions.

The default control is the simpler evidence-and-invariants baseline. A mathematical or machine-checkable result may be decisive formal proof for its declared model property. Causal benefit requires an appropriate causal argument or independent equal-feasibility implementation outcomes.

## Required order

```text
authority and exact-coordinate extraction
→ one or more machine-native evidence representations
→ Observed / Inferred / Hypothesis / Unknown / NotApplicable matrix
→ proportional tier
→ typed predictions and falsifiers
→ independent candidate batches
→ invariant and prerequisite filtering
→ explicit baseline semantics
→ simple evidence-and-invariants baseline
→ candidate topology when useful
→ software-invariant hypergraph and other formal models when useful
→ formal/model certificates when available
→ bounded higher-order effect propagation
→ equal-feasibility controls
→ search and weight sensitivity
→ selected exploration
→ separate implementation compression
→ complete behavioral proof plan
→ Red → Green → Refactor
→ exact-head and required external verification
→ prediction/outcome calibration
→ current-document and handoff update
```

No score, graph, spectral result, model, or note created after implementation selection may retroactively justify that implementation.

## Typed engineering nodes

Repository decision records use inspectable typed nodes rather than private reasoning transcripts:

- `Observation` — exact evidence and evidence class.
- `Hypothesis` — falsifiable explanation or expected effect.
- `Counterexample` — concrete failure path that defeats a candidate.
- `Invariant` — state or relation that must remain true.
- `Candidate` — bounded trajectory with prerequisites and patch surfaces.
- `Prediction` — expected measurable first-, second-, third-, or fourth-order outcome.
- `Test` — executable or externally runnable falsifier.
- `Outcome` — observed result and calibration update.

Valid transformations include:

```text
Hypothesis + Evidence → RevisedHypothesis
Candidate + Counterexample → RejectedCandidate
Invariant + Generator → ExecutableTest
Prediction + Outcome → CalibrationUpdate
```

Store evidence, machine representations, generators, hypotheses, rejected alternatives, predictions, formal certificates, tests, and outcomes. Do not store private chain-of-thought as repository authority.

## Proof classes

Use the detailed contract in `representation-contract.md`:

- **P0 representation calculation** — a computed score, vector, embedding, mode, clustering, centrality, or simulation result.
- **P1 formal model-property proof** — a theorem, verified eigenstructure, solver certificate, model-checker result, invariant proof, spectral bound, or other reproducible certificate for an explicitly declared model.
- **P2 representation-fidelity proof** — evidence that the model corresponds to the source/runtime boundary it claims to represent.
- **P3 executable software proof** — accepted source, type, unit, integration, database, browser, build, image, or related evidence on the exact candidate.
- **P4 external/production acceptance** — managed, provider, target-host, real channel/accessibility, commercial, recovery, trusted signing, pilot, deployment, or production evidence.

P1 is real proof for the exact formal property and assumptions. A P1+P2 chain may satisfy a P3 gate when the gate defines and verifies a sound correspondence. No proof class is demoted, and none silently expands beyond its stated domain.

## Tiers

| Tier | Use | Minimum |
|---|---|---|
| `T0 mechanical` | deterministic correction with no material choice | authority check, protected invariant, exact verification |
| `T1 bounded` | local choice with real alternatives | 4 candidates, 2 batches, evidence labels, rejection reasons |
| `T2 consequential` | security, database, protocol, commercial, provider, recovery, owner surface | 16 candidates, 3 batches, explicit baseline, equal-feasibility controls, sensitivity |
| `T3 production/cross-workstream` | release boundary, architecture mutation, or multi-workstream production trajectory | 64 candidates in 4 batches, split topology, at least 1,000 feasible baselines, 32 restarts, 32 perturbations, implementation ablation or explicit non-causal result |

A task may move down only when the record proves that no material choice exists. Do not move down merely because external prerequisites are inconvenient.

## Concurrent possibility spaces

Use only source-grounded spaces that matter to the task:

```text
Z = Z_bug ⊕ Z_feature ⊕ Z_user ⊕ Z_operator ⊕ Z_architecture
  ⊕ Z_protocol ⊕ Z_commercial ⊕ Z_failure ⊕ Z_proof
  ⊕ Z_market ⊕ Z_weird ⊕ Z_constraint
```

Do not silently mix dimensions from different spaces. Generate `current`, `feature`, and `counterfactual` candidates independently before `recombination`. Unknown remains Unknown and increases unsupportedness rather than becoming zero risk.

## Baseline semantics

Every score dimension has an explicit meaning and orientation independent of objective-weight sign. The current machine schema includes:

```text
IG, BV, N, Adj, CrossLens, FutureBug, FeatureYield, ArchLeverage,
VF, Testability, Reversibility, ProofDensity, Risk, Cost, Scope, Unsupported
```

The simple baseline declares five disjoint roles:

```text
positive_required
positive_optional
penalty_required
penalty_optional
excluded
```

Validation fails closed when dimensions are duplicated, missing, unclassified, stale, orientation-mismatched, or multiply assigned to semantic groups.

The reference grouped baseline prevents schema density from silently changing importance:

```text
positive:
  evidence      0.30 × mean(IG)
  value         0.25 × mean(BV)
  verification  0.25 × mean(VF, Testability when present)
  proof         0.20 × mean(ProofDensity)

penalties:
  unsupported   0.35 × mean(Unsupported)
  risk          0.30 × mean(Risk)
  scope         0.20 × mean(Scope)
  cost          0.15 × mean(Cost)
```

Scores prioritize candidates. They are P0 unless accompanied by a valid stronger certificate; weighted ranking alone does not prove architecture, correctness, or acceptance.

## Two non-interchangeable topology layers

### Candidate search topology

Vertices are candidate trajectories. Relations may encode:

- same-concept variants;
- shared implementation boundaries;
- recombination lineage;
- semantic similarity;
- common evidence or prerequisites;
- conflicting resource or sequencing demands.

This layer supports redundancy detection, diversity, lineage, clustering, and sensitivity. It cannot, merely by containing a candidate, report completion of software-invariant obligations.

### Software-invariant hypergraph

Vertices are actual software entities, states, and proof obligations. A hyperedge represents a genuine many-way relation that would be distorted by reducing it to independent pairs.

Examples:

```text
{AssignmentAuthority, ApprovalSnapshot, Revision, Effect}
{BudgetReservation, RateToken, ProviderAttempt, Settlement, AccountingReceipt}
{Backup, Restore, DurableTruth, AcceptedWork, ProofRefinding}
{VariantManifest, NeutralModel, ImportBoundary, IntentBridge, RegistryParity}
```

This layer reports:

- `C_touch` — weighted fraction of invariant hyperedges with any represented member;
- `C_fractional` — weighted mean represented-member fraction;
- `C_complete` — weighted fraction whose complete member set is represented;
- `C_proved` — weighted fraction complete and accepted by the proof contract assigned to that hyperedge.

Mere representation is P0. A theorem or machine certificate over the hypergraph may be P1. `C_proved` advances only when the edge’s declared proof class is satisfied, including P2/P3 correspondence when the edge is an executable-software obligation.

## Hypergraph spectral analysis

For a genuine weighted hypergraph with incidence matrix `H`, hyperedge weights `W`, vertex degrees `D_v`, and hyperedge degrees `D_e`, an allowed normalized hypergraph Laplacian is:

```text
L = I - D_v^(-1/2) H W D_e^(-1) Hᵀ D_v^(-1/2)
```

Other operators, including directed, signed, tensor, random-walk, dual-hypergraph, simplicial, or non-normal operators, are allowed when their semantics and theorem basis are explicit.

Permitted uses of eigenvalues/eigenvectors include:

- formal certificates of operator-defined connectivity, decomposition, stability, convergence, observability, controllability, expansion, mixing, or mode separation;
- solutions or certificates for declared exact or relaxed optimization problems;
- identifying loosely connected obligation clusters;
- exposing high-centrality prerequisites or shared failure boundaries;
- detecting candidate portfolios concentrated in one mode;
- selecting counterexamples that cross weakly coupled regions;
- measuring sensitivity when edge membership or weights change;
- comparing whether an implementation touches structurally distinct obligations;
- providing bases for reconstruction or prediction with measured residual/error.

Guards:

- Use hypergraphs only for genuine multi-way obligations.
- Use Hodge Laplacians only for a true simplicial/cellular complex with valid boundary operators.
- Define the operator, domain, symmetry/normality, direction, signs, weights, normalization, and boundary conditions.
- Verify eigenpair residuals, multiplicity, numerical conditioning, tolerances, and sensitivity.
- Distinguish theorem, exact certificate, relaxation, approximation, and learned heuristic.
- A dominant eigenvector may be the decisive proof or optimizer for the declared mathematical problem.
- Calling that vector “the best feature” additionally requires a valid mapping from the mathematical objective to the feature decision.
- Dependency feasibility or safety constraints remain binding unless the formal result proves that they are satisfied.
- Do not hand-author weights or topology after selecting the desired result.
- A P1 spectral proof establishes the declared model property; P2 correspondence is required before promoting it to the associated software property, and P4 remains separately defined.

## Higher-order effect propagation

Each candidate may declare bounded transitions:

```text
current state
→ direct implementation effect
→ second-order capability, risk, or operator effect
→ third-order architecture, product-line, or failure effect
→ fourth-order commercial, support, or production-system obligation
```

Model these effects as typed relations, tensors, transition systems, hyperedges, constraints, or other inspectable structures rather than free-form optimism. Examples:

- implementation enables capability;
- capability introduces lifecycle obligation;
- lifecycle obligation increases verification matrix;
- verification requirement changes release/pilot feasibility;
- feature shares a prerequisite with another workstream;
- repair path conserves or threatens accepted evidence;
- operator action reduces or amplifies ambiguity.

A higher-order relation is admitted only when it has:

- an evidence or architecture basis;
- a direction and effect type;
- a falsifier, formal property, or observable prediction;
- a bounded horizon;
- an explicit uncertainty label.

Reachability, path counts, hyperedge participation, centrality, spectral projection, formal transition analysis, or solver output may prove properties of the declared model or identify hypotheses worth testing. An empirical future-world claim still requires the proof/evidence class appropriate to that claim.

## Feasible-domain controls

Mandatory coverage and invariants define:

```text
F = {D : size(D)=k, MandatoryCoverage(D)=1, Invariants(D)=1, Prerequisites(D)=1}
```

Mandatory coverage and dependency feasibility are constraints, not objective bonuses. A valid formal proof may establish that a candidate belongs to `F`; a score cannot waive membership.

For `T2/T3`, every comparison searches the same feasible domain:

```text
D*full          = argmax over F of Jfull(D)
D*no_graph      = argmax over F of Jfull(D) - GraphTerms(D)
D*no_diversity  = argmax over F of Jfull(D) - DiversityTerms(D)
D*baseline      = argmax over F of B(D)
```

Evaluate every selected set with the same full metric vector. Do not compare a feasible set with a control that violates mandatory coverage or prerequisites.

Report:

- dimensions used and omitted;
- same-feasible-domain assertion;
- selected-set Jaccard stability;
- implementation-set Jaccard when implementation arms exist;
- objective differences;
- independent proof-yield differences;
- formal certificate class;
- causal classification.

## Selection influence, formal proof, and causal improvement

A term is **selection-influencing** when it changes a selected set inside the same feasible domain.

A result is **formally proving** when it supplies a valid P1/P2/P3 certificate for the declared property.

A method is **causally improving** when an appropriate causal proof or equal-feasibility implementation ablation improves independent outcomes such as:

- defects discovered before patching;
- complete invariant proof obligations;
- implementation coherence;
- review defects;
- unnecessary scope avoided;
- rollback quality;
- executable verification yield;
- prediction calibration.

Ranking differences, eigenvector changes, objective deltas, edge touch, complete representation, or narrative plausibility do not by themselves establish causal improvement. This does not prevent a verified eigenstructure from being formal proof of its declared property.

## Data-driven experiment loop

For each selected implementation or planning method:

1. record predictions before implementation;
2. define measurable outcomes, formal properties, and falsifiers;
3. preserve the simple baseline arm when feasible;
4. keep compared arms inside the same prerequisite domain;
5. run formal/model checks plus focused and broad executable verification;
6. record defects, scope, review findings, proof yield, reversions, and external blockers;
7. update calibration rather than rewriting the prediction;
8. retain formal methods that provide valuable certificates even when they do not claim causal superiority;
9. retire predictive or ranking layers that do not outperform simpler methods for their declared purpose.

Longitudinal models such as Koopman/DMD/DMDc/EDMDc require repeated homogeneous, consistently sampled, task-conditioned episodes. Fit on training episodes, evaluate held-out one-step and multistep prediction, compare with persistence and ordinary regression, and retain residual/diversity controls. Algebraic properties of the fitted operator may be P1; predictive or causal claims require the appropriate held-out or intervention evidence.

## Implementation compression

Exploration is not the patch list. The implementation transaction must:

- preserve mandatory invariants;
- resolve the highest-value current dependency boundary;
- reuse existing authority rather than create a parallel ontology/runtime;
- bound scope, risk, and operational burden;
- map every selected software hyperedge to a formal certificate, complete behavioral proof plan, or honest blocker according to its declared proof class;
- exclude unrelated cleanup;
- define rollback and stop conditions.

When a formal proof is decisive, use it and record its assumptions and correspondence. When a mathematical layer is merely descriptive or does not improve its declared task, use the simpler result and record that limitation.

## Verification and evidence

```text
representation generator and formal/model verifier
→ narrow behavioral proof
→ source/migration change
→ affected suites
→ broad exact-head gates
→ managed/provider/browser/host/commercial/recovery/release evidence when required
→ prediction/outcome calibration
```

Focused PR workflows must explicitly check out and verify the branch head SHA, not a synthetic merge ref. Formal proof, representation fidelity, documentation, source, unit, integration, CI, managed database, provider, browser/channel, target host, commercial lifecycle, recovery, trusted signing, pilot, deployment, and production are distinct evidence classes with explicit correspondence rules.

## Trace artifacts

A full `T2/T3` computation normally contains:

```text
task_state.json
thought_templates.json
candidate_population.json
candidate_scores.json
candidate_graph.json
software_invariant_hypergraph.json
representation schemas/generators/certificates as applicable
selection_comparison.json
selected_exploration.json
selected_implementation.json
implementation_ablation.json
counterexample_matrix.json
implementation_contract.json
verification_plan.json
decision_record.md
deterministic computation/verifier
```

A bounded trace may use compact combined records only when it explicitly documents why no required semantic information or control is lost. Large matrices should be regenerated from compact descriptors.

Keep one open trace per active transaction. Preserve complete historical traces. Remove or revert incomplete duplicate transports rather than presenting them as current.

## Current trace chain

- Trace007 — commercial/effect transaction and baseline semantics.
- Trace008 — release, recovery, rollback, and capacity groundwork.
- Trace009 — UI projection architecture search and calibration.
- Trace010 — connector operating substrate.
- Trace011 — employee UI port and presentation adapters.
- Trace012 — production UI Lab and folder-first UI variants; latest completed trace.
- Trace013 — reserved for the next branch; no candidates or selection currently exist.

## Documentation transaction

```text
source / migrations / tests / workflows
→ machine-native representations and certificates
→ completed or active trace
→ active production program and evidence map
→ architecture and scoped CODEGRAPH
→ contributor and machine routing
→ one dated handoff and MEMORY.md
→ PR or release record
```

Computation improves how a choice is made. Formal proof establishes the property it actually proves. Evidence establishes the boundary it actually exercises.
