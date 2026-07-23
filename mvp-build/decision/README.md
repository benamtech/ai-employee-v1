# Computation-First Decision Protocol

Status: **active for non-mechanical `mvp-build` work**  
Updated: 2026-07-23  
Machine contract: [`protocol-v1.json`](protocol-v1.json)  
Transaction router: [`active.json`](active.json)  
Latest completed trace: [`trace012/`](trace012/)  
Next trace: `trace013`, reserved and not created until a fresh post-merge branch begins

No decision transaction is currently open. Completed traces explain implemented decisions and evidence boundaries; they do not preselect the next task.

## Purpose

Expand useful possibility space, then compress action into the smallest coherent implementation that preserves repository invariants and advances the production goal.

Computation is useful only when repository evidence feeds it and it changes at least one of:

- candidate admission or rejection;
- implementation scope;
- dependency order;
- proof obligations;
- counterexample coverage;
- experiment design;
- rollback or stop conditions.

The default control is the simpler evidence-and-invariants baseline. Mathematics earns causal status only through independent equal-feasibility implementation outcomes.

## Required order

```text
authority and exact-coordinate extraction
→ Observed / Inferred / Hypothesis / Unknown / NotApplicable matrix
→ proportional tier
→ typed predictions and falsifiers
→ independent candidate batches
→ invariant and prerequisite filtering
→ explicit baseline semantics
→ simple evidence-and-invariants baseline
→ candidate topology when useful
→ software-invariant hypergraph when useful
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

Store evidence, hypotheses, rejected alternatives, predictions, tests, and outcomes. Do not store private chain-of-thought as repository authority.

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

Scores prioritize candidates. They do not prove architecture, correctness, or acceptance.

## Two non-interchangeable topology layers

### Candidate search topology

Vertices are candidate trajectories. Relations may encode:

- same-concept variants;
- shared implementation boundaries;
- recombination lineage;
- semantic similarity;
- common evidence or prerequisites;
- conflicting resource or sequencing demands.

This layer supports redundancy detection, diversity, lineage, clustering, and sensitivity. It cannot report software-invariant completion.

### Software-invariant hypergraph

Vertices are actual software entities, states, and proof obligations. A hyperedge represents a genuine many-way relation that would be distorted by reducing it to independent pairs.

Examples:

```text
{AssignmentAuthority, ApprovalSnapshot, Revision, Effect}
{BudgetReservation, RateToken, ProviderAttempt, Settlement, AccountingReceipt}
{Backup, Restore, DurableTruth, AcceptedWork, ProofRefinding}
{VariantManifest, NeutralModel, ImportBoundary, IntentBridge, RegistryParity}
```

Only this layer reports:

- `C_touch` — weighted fraction of invariant hyperedges with any represented member;
- `C_fractional` — weighted mean represented-member fraction;
- `C_complete` — weighted fraction whose complete member set is represented;
- `C_proved` — weighted fraction complete and accepted by independent behavioral proof on the exact candidate.

Representation is not proof. Complete representation with pending tests contributes to `C_complete`, not `C_proved`.

## Hypergraph spectral analysis

For a genuine weighted hypergraph with incidence matrix `H`, hyperedge weights `W`, vertex degrees `D_v`, and hyperedge degrees `D_e`, a normalized hypergraph Laplacian may be computed as:

```text
L = I - D_v^(-1/2) H W D_e^(-1) Hᵀ D_v^(-1/2)
```

Permitted uses of eigenvalues/eigenvectors include:

- identifying loosely connected obligation clusters;
- exposing high-centrality prerequisites or shared failure boundaries;
- detecting candidate portfolios concentrated in one mode;
- selecting counterexamples that cross weakly coupled regions;
- measuring sensitivity when edge membership or weights change;
- comparing whether an implementation touches structurally distinct obligations.

Guards:

- Use hypergraphs only for genuine multi-way obligations.
- Use Hodge Laplacians only for a true simplicial complex with valid boundary operators.
- Do not interpret a dominant eigenvector as “the best feature.”
- Do not let centrality override prerequisite feasibility, risk stop conditions, or required evidence classes.
- Do not hand-author weights to force an intended ranking.
- Report instability under alternative edge definitions and bounded weights.
- A spectral mode is a representation of relationships, not a causal mechanism or proof of correctness.

## Higher-order effect propagation

Each candidate may declare bounded transitions:

```text
current state
→ direct implementation effect
→ second-order capability, risk, or operator effect
→ third-order architecture, product-line, or failure effect
→ fourth-order commercial, support, or production-system obligation
```

Model these effects as typed relations, not free-form optimism. Examples:

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
- a falsifier or observable prediction;
- a bounded horizon;
- an explicit uncertainty label.

Reachability, path counts, hyperedge participation, centrality, or spectral projection may identify hypotheses worth testing. They do not establish that the predicted effect will occur.

## Feasible-domain controls

Mandatory coverage and invariants define:

```text
F = {D : size(D)=k, MandatoryCoverage(D)=1, Invariants(D)=1, Prerequisites(D)=1}
```

Mandatory coverage and dependency feasibility are constraints, not objective bonuses.

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
- causal classification.

## Selection influence versus causal improvement

A term is **selection-influencing** when it changes a selected set inside the same feasible domain.

A term is **causally improving** only when an equal-feasibility implementation ablation improves independent outcomes such as:

- defects discovered before patching;
- complete invariant proof obligations;
- implementation coherence;
- review defects;
- unnecessary scope avoided;
- rollback quality;
- executable verification yield;
- prediction calibration.

Ranking differences, eigenvector changes, objective deltas, edge touch, complete representation, or narrative plausibility do not establish causal improvement.

## Data-driven experiment loop

For each selected implementation or planning method:

1. record predictions before implementation;
2. define measurable outcomes and falsifiers;
3. preserve the simple baseline arm when feasible;
4. keep compared arms inside the same prerequisite domain;
5. run focused and broad verification;
6. record defects, scope, review findings, proof yield, reversions, and external blockers;
7. update calibration rather than rewriting the prediction;
8. retire mathematical layers that do not outperform simpler methods.

Longitudinal models such as Koopman/DMD/DMDc/EDMDc require repeated homogeneous, consistently sampled, task-conditioned episodes. Fit on training episodes, evaluate held-out one-step and multistep prediction, compare with persistence and ordinary regression, and retain residual/diversity controls. Keep the model disabled when it does not outperform the simpler baseline.

## Implementation compression

Exploration is not the patch list. The implementation transaction must:

- preserve mandatory invariants;
- resolve the highest-value current dependency boundary;
- reuse existing authority rather than create a parallel ontology/runtime;
- bound scope, risk, and operational burden;
- map every selected software hyperedge to a complete behavioral proof plan or honest blocker;
- exclude unrelated cleanup;
- define rollback and stop conditions.

When mathematics is non-causal, use the evidence-and-invariants result and record the mathematics as descriptive.

## Verification and evidence

```text
decision verifier
→ narrow behavioral proof
→ source/migration change
→ affected suites
→ broad exact-head gates
→ managed/provider/browser/host/commercial/recovery/release evidence when required
→ prediction/outcome calibration
```

Focused PR workflows must explicitly check out and verify the branch head SHA, not a synthetic merge ref. Decision records, documentation, source, unit, integration, CI, managed database, provider, browser/channel, target host, commercial lifecycle, recovery, trusted signing, pilot, deployment, and production are separate evidence classes.

## Trace artifacts

A full `T2/T3` computation normally contains:

```text
task_state.json
thought_templates.json
candidate_population.json
candidate_scores.json
candidate_graph.json
software_invariant_hypergraph.json
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
→ completed or active trace
→ active production program and evidence map
→ architecture and scoped CODEGRAPH
→ contributor and machine routing
→ one dated handoff and MEMORY.md
→ PR or release record
```

Computation improves how a choice is made. Evidence establishes what is true.
