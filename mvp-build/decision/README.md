# Computation-First Decision Protocol

Status: **active for non-mechanical `mvp-build` work**  
Machine contract: [`protocol-v1.json`](protocol-v1.json)  
Current example: [`trace007/`](trace007/)

## Purpose

Expand useful possibility space, then compress action into the smallest coherent implementation. Computation is valuable only when repository evidence feeds it and its result changes a decision, proof obligation, or rejection. It is not a ritual layer between inspection and a patch already chosen.

The default baseline is always the simpler evidence-and-invariants analysis. Mathematics earns causal status only through ablation against that baseline.

## Required order

```text
authority and evidence extraction
→ Observed / Inferred / Hypothesis / Unknown / NotApplicable matrix
→ proportional tier
→ independent candidate batches
→ invariant and prerequisite filtering
→ simple evidence-and-invariants baseline
→ candidate search topology when useful
→ software invariant topology when useful
→ equal-feasibility controls
→ search and weight sensitivity
→ selected exploration
→ separate implementation compression
→ complete behavioral proof plan
→ Red → Green → Refactor
→ exact-head and required external verification
→ current-document and handoff update
```

No score, graph, model, or note created after implementation selection may be used to justify that implementation.

## Tiers

| Tier | Use | Minimum |
|---|---|---|
| `T0 mechanical` | deterministic correction with no material choice | authority check, one invariant, exact verification |
| `T1 bounded` | local choice with real alternatives | 4 candidates, 2 batches, evidence labels, rejection reasons |
| `T2 consequential` | security, database, protocol, commercial, provider, recovery, owner surface | 16 candidates, 3 batches, simple baseline, equal-feasibility controls, search/weight sensitivity |
| `T3 production/cross-workstream` | release boundary or architecture mutation | 64 candidates in 4 batches, two topology layers, 1,000 feasible random baselines, 32 search restarts, 32 weight perturbations, implementation ablation or explicit non-causal result |

A task may move down only when the record proves that no material choice exists.

## Concurrent possibility spaces

Use only source-grounded spaces that matter to the task:

```text
Z = Z_bug ⊕ Z_feature ⊕ Z_user ⊕ Z_operator ⊕ Z_architecture
  ⊕ Z_protocol ⊕ Z_commercial ⊕ Z_failure ⊕ Z_proof
  ⊕ Z_market ⊕ Z_weird ⊕ Z_constraint
```

Do not silently mix dimensions from different spaces. Generate `current`, `feature`, and `counterfactual` candidates independently before `recombination`.

Unknown remains Unknown and increases `Unsupported`.

## Candidate scoring

Candidate dimensions may include:

`Applicability`, `Transfer`, `Evidence`, `CrossLens`, `Unsupported`, `BusinessValue`, `VerificationFeasibility`, `ProofDensity`, `Reversibility`, `ArchitectureLeverage`, `RiskReduction`, `Cost`, `Scope`, `PrerequisiteDebt`, `OperatorBurden`, and `FutureOptionality`.

Weights and direction must be declared. Scores prioritize candidates; they do not prove architecture, implementation, or acceptance.

## Two separate topology layers

### 1. Candidate search graph

Vertices are candidate trajectories such as `A01` or `D07`.

Edges may mean:

- variants of the same concept;
- shared implementation boundary;
- recombination lineage;
- semantic similarity;
- common evidence.

This graph supports candidate separation, redundancy, diversity, lineage, and **candidate-edge touch**. It cannot report software-invariant completion.

### 2. Software invariant hypergraph

Vertices are actual system entities or obligations, for example:

```text
Revision, ApprovalSnapshot, AssignmentAuthority, BudgetReservation,
Effect, ProviderAttempt, ProviderReceipt, Settlement, AccountingReceipt,
ProofProjection, OwnerRefinding, Reconciliation, Repair
```

Hyperedges represent non-decomposable software transactions. Candidates declare which software vertices they represent.

Only this structure reports:

- `C_touch`: weighted fraction of invariant edges with any represented member;
- `C_fractional`: weighted mean represented-member fraction;
- `C_complete`: weighted fraction with every member represented;
- `C_proved`: weighted fraction complete **and** accepted by independent behavioral proof on the exact candidate.

Representation is not proof. A complete edge with pending tests contributes to `C_complete`, not `C_proved`.

## Feasible-domain controls

Mandatory coverage and invariants define the feasible domain:

\[
\mathcal F=\{D:|D|=k,\ MandatoryCoverage(D)=1,\ Invariants(D)=1\}
\]

Mandatory coverage is a constraint, not an objective reward.

For `T2/T3`, optimize and compare inside the same `F`:

\[
D^*_{full}=\arg\max_{D\in\mathcal F}J_{full}(D)
\]

\[
D^*_{no\ graph}=\arg\max_{D\in\mathcal F}(J_{full}-GraphTerms)
\]

\[
D^*_{no\ diversity}=\arg\max_{D\in\mathcal F}(J_{full}-DiversityTerms)
\]

\[
D^*_{baseline}=\arg\max_{D\in\mathcal F}[Evidence+Value+Testability-Risk-Scope]
\]

Evaluate every selected set with the same full metric vector. Do not compare a feasible set against a control that fails mandatory coverage.

## Selection influence versus causal improvement

A term is **selection-influencing** when it changes the selected set inside the same feasible domain.

A term is **causally improving** only when an implementation ablation improves independent outcomes such as:

- defects discovered;
- complete invariant proof obligations;
- implementation coherence;
- review defects;
- unnecessary scope;
- executable verification yield.

Ranking differences, objective deltas, edge touch, or node representation do not establish causal improvement. Without independent outcomes, classify graph terms as `descriptive` and diversity terms as `descriptive` or `selection-influencing`.

## Sensitivity

`T2/T3` must report:

- search restarts, unique optima, objective spread, and selected-set Jaccard stability;
- declared weight perturbations, selected-set stability, and software-coverage stability;
- any instability that changes implementation or proof obligations.

Do not choose a favorable seed and hide the rest.

## Mathematical prerequisites

- Hypergraphs require genuine multi-way dependencies.
- Hodge Laplacians require a true simplicial complex.
- Koopman or another predictive latent model requires repeated comparable trajectories, fitted propagation, held-out evaluation, and residual/diversity control.
- Predictive models remain disabled when they do not outperform the simple baseline on held-out outcomes.
- COCONUT, continuous hidden-state reasoning, latent BFS, manifold, or phase-switching language may inspire exploration. Do not claim the model or product implements those mechanisms without executable implementation and verification.

## Implementation compression

Exploration is not the patch list. The implementation transaction must:

- preserve all non-negotiable invariants;
- resolve the highest-value current boundary;
- reuse existing authority rather than create a parallel ontology or runtime;
- bound files, migrations, and operational burden;
- map every selected software dependency edge to a complete behavioral proof plan or explicit blocker;
- exclude unrelated cleanup and speculative architecture.

When mathematics is non-causal, use the simpler evidence-and-invariants result and record the mathematics as descriptive.

## Verification and evidence

```text
decision verifier
→ narrow red behavioral proof
→ source/migration change
→ narrow green
→ affected suites
→ broad exact-head gates
→ managed/provider/browser/host/commercial/release evidence when required
```

Do not test every imagined vector. Test the selected transaction and the minimum failure manifold that proves its invariants.

Decision records, documentation, source, unit, integration, CI, managed database, provider, browser/channel, target host, commercial lifecycle, signed release, pilot, deployment, and production are separate evidence classes.

## Trace artifacts

A `T2/T3` trace contains:

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
compute.py
```

Large matrices should be regenerated from compact descriptors. Keep one active trace per active transaction; preserve complete historical traces only as historical evidence and remove incomplete duplicate transports.

## Documentation transaction

When current authority changes, reconcile in one transaction:

```text
source / migrations / tests / workflows
→ active trace
→ active production program and evidence map
→ architecture and scoped CODEGRAPH
→ contributor routing
→ one dated handoff and MEMORY.md
→ PR or release record
```

Computation improves how a choice is made. Evidence establishes what is true.
