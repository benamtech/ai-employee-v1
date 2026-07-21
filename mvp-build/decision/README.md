# Computation-First Decision Protocol

Status: **active and mandatory for non-mechanical work**  
Protocol: `amtech.computed-decision.v1`  
Machine-readable contract: [`protocol-v1.json`](protocol-v1.json)  
Current production example: [`trace007/`](trace007/)

## Purpose

AMTECH should maximize useful possibility-space per task, then compress action into one high-leverage implementation. Planning prose, intuition, remembered architecture, trajectory language, or a single favored solution must not become implementation authority before the applicable computation is complete.

This protocol preserves the useful parts of forced dreaming, latent-space exploration, manifold interdimensional vectors, graph reasoning, and counterfactual recombination without allowing decorative mathematics, architectural sprawl, or excessive testing.

## Mandatory order

```text
authority extraction
→ evidence/unknown matrix
→ applicable decision tier
→ independent possible-decision vectors
→ feasibility and invariant filtering
→ computed comparison
→ multi-way dependency analysis when justified
→ selected exploration set
→ separate coherent implementation compression
→ red behavioral proof
→ implementation
→ exact-head verification
→ documentation and handoff update
```

No implementation decision may be justified by a score, graph, model, or note created after the implementation choice was already made.

## Decision tiers

| Tier | Use | Minimum computation | Graph requirement |
|---|---|---|---|
| `T0 mechanical` | exact typo, generated hash refresh, deterministic rename, unambiguous source correction | authority check, one invariant, exact verification command | none |
| `T1 bounded` | one-file or one-boundary choice with meaningful alternatives | at least 4 candidate vectors, evidence/unknown labels, feasibility filter, explicit rejection reasons | only when dependencies are genuinely multi-way |
| `T2 consequential` | security, database, protocol, commercial, provider, recovery, owner-surface, or cross-file behavior | at least 16 candidate vectors across 3 independent batches, weighted dimensions, utility-only comparison, coherent compression | hypergraph or explicit dependency matrix when pairwise edges lose information |
| `T3 production/cross-workstream` | production boundary, multiple workstreams, release gate, or architecture mutation | at least 64 vectors across current/feature/counterfactual/recombination batches, baseline comparison, sparse multi-way graph, causal graph/diversity check, separate implementation frontier | required unless the record proves pairwise structure is sufficient |

A task may move to a lower tier only when the computation record explains why no material decision space exists. Tier reduction cannot be used to evade risk, evidence, or dependency analysis.

## Concurrent spaces

Do not model one flattened possibility space. Build applicable concurrent spaces over the same task:

```text
Z = Z_bug ⊕ Z_feature ⊕ Z_user ⊕ Z_operator ⊕ Z_architecture
  ⊕ Z_protocol ⊕ Z_commercial ⊕ Z_failure ⊕ Z_proof
  ⊕ Z_market ⊕ Z_weird ⊕ Z_constraint
```

Only include spaces that are applicable and source-grounded. Record excluded spaces and why. Dimensions from different spaces must not be silently mixed into one coordinate system.

Typical prompts include:

- What defect or violated invariant exists now?
- What future capability becomes possible if it is fixed correctly?
- What operator workflow, recovery path, or misuse is implied?
- What customer trust or proof problem is hidden here?
- What architecture mutation becomes natural, and what prerequisite debt does it create?
- What adjacent or strange use case reveals a more general primitive?
- What future failure appears if only half the boundary is fixed?

## Authority and evidence matrix

Before candidates are generated, extract:

1. exact repository, branch, base, and current head;
2. applicable Standard clauses and active program/workstream coordinates;
3. source, migration, test, workflow, proof, PR, and newest-memory evidence;
4. known contradictions and authority order;
5. explicit `Observed`, `Inferred`, `Hypothesis`, `Unknown`, and `Not applicable` coordinates.

Unknown evidence remains Unknown. It increases `Unsupported`; it cannot be silently converted into zero risk or positive evidence.

For structured tasks, define the basis explicitly, for example:

\[
\mathcal B = W \times L \times H
\]

where `W` is workstream or boundary, `L` is lens/space, and `H` is evidence or hypothesis class. Cardinality, observed count, unknown count, and non-applicable count must reconcile exactly.

## Independent candidate generation

Candidates must be generated in isolated batches so the first favored solution does not collapse the frontier:

- `current`: direct repairs and invariant restorations;
- `feature`: capabilities unlocked by a correct repair;
- `counterfactual`: alternate architectures, failures, and operator constraints;
- `recombination`: cross-lens trajectories built only after the first batches exist.

Candidates carry stable IDs, source/evidence references, prerequisites, affected boundaries, expected proof, reversibility, and explicit failure modes.

## Required candidate dimensions

Use normalized `[0,1]` values where possible. Applicable dimensions are:

- `Applicability`
- `Transfer`
- `Evidence`
- `CrossLens`
- `Unsupported`
- `BusinessValue`
- `VerificationFeasibility`
- `ProofDensity`
- `Reversibility`
- `ArchitectureLeverage`
- `RiskReduction`
- `Cost`
- `Scope`
- `PrerequisiteDebt`
- `OperatorBurden`
- `FutureOptionality`

A default quality score is:

\[
q(c)=\sum_d w_d r_{c,d}-w_U\,Unsupported(c)-w_P\,PrerequisiteDebt(c)
\]

Weights must be recorded and sum to a declared total. Scores are prioritization evidence, never implementation or acceptance evidence.

## Feasibility and invariant filter

Before optimization, reject any candidate that:

- violates Manager/Hermes authority, assignment isolation, exact approval, effect, receipt, commercial, migration, or evidence-class invariants;
- requires an unresolved prerequisite while pretending it does not;
- duplicates an accepted effect or makes ambiguity look like failure/success;
- creates a parallel ontology, runtime, plan, or authority source;
- expands architecture without a concrete current or near-term use;
- cannot name a behavioral proof or an honest blocked proof;
- promotes source/fixture/local/ancestor evidence into a stronger class.

Rejected candidates remain in the trace with rejection reasons.

## Multi-way dependency computation

Use a hypergraph when a relationship is genuinely multi-way. Pairwise graphs are sufficient only when decomposition preserves the dependency.

For incidence matrix `H`, edge weights `W_e`, vertex degrees `D_v`, and edge degrees `D_e`, the normalized hypergraph Laplacian is:

\[
L = I-D_v^{-1/2} H W_e D_e^{-1}H^T D_v^{-1/2}
\]

Use Hodge Laplacians only when the task constructs a true simplicial complex. Do not relabel arbitrary tuples as simplices.

Use Koopman propagation only when there are repeated, comparable plan-state trajectories and a computed linear latent propagator with held-out error. It is not a decorative synonym for “future state.” Excessive coherence can collapse diversity; any Koopman objective must include residual/diversity control.

## Joint selection and causality check

A default joint objective for selected set `S` is:

\[
J(S)=.30\bar q+.20C_\Omega+.10C_H+.10Sep_{min}+.10Sep_{mean}+.10VNE+.10QD-.15Redundancy
\]

Where:

- `C_Ω` is required-space/workstream coverage;
- `C_H` is weighted hyperedge coverage;
- `Sep` is candidate-vector separation;
- `VNE` is normalized von Neumann entropy of the selected similarity kernel;
- `QD` is occupied quality-diversity cells;
- `Redundancy` is mean off-diagonal similarity.

The exact objective may change, but every term and weight must be declared.

For `T2/T3`, compare at least:

1. joint selection;
2. utility-only selection;
3. diversity/dependency-only selection;
4. feasible random baselines (`T3`: at least 100).

Graph/diversity terms are `causal` only when they materially change selected candidates, coverage, feasibility, or implementation compression. Otherwise label them `descriptive` and do not use them to justify complexity.

## Separate implementation compression

Exploration is not the patch list. Compress the selected frontier into the smallest coherent implementation transaction that:

- preserves all non-negotiable invariants;
- resolves the highest-value current boundary;
- creates reusable primitives rather than parallel subsystems;
- has bounded files and migration surface;
- has a direct red behavioral test or explicit blocked proof;
- does not require unrelated cleanup or speculative architecture.

Record selected implementation IDs separately from selected exploration IDs. The implementation set must be a subset or a clearly documented recombination of the computed frontier.

## Verification discipline

Computation precedes test design, but implementation still follows Red → Green → Refactor.

Required order:

1. computation record verifies;
2. narrow behavioral tests fail for the intended reason;
3. source/migration change;
4. narrow tests pass;
5. affected suites;
6. broad exact-head gates;
7. managed/provider/target-host/browser/commercial/recovery evidence only when required and available.

Do not create a test for every imagined vector. Test the selected transaction, its invariant boundaries, and the smallest failure manifold needed to prove convergence.

## Required artifacts

`T2/T3` traces use one directory under `decision/traceNNN/`:

- `task_state.json`
- `thought_templates.json`
- `candidate_population.json`
- `candidate_scores.json`
- `hypergraph.json` or `dependency_matrix.json`
- `selection_comparison.json`
- `selected_exploration.json`
- `selected_implementation.json`
- `counterexample_matrix.json`
- `implementation_contract.json`
- `verification_plan.json`
- `decision_record.md`
- one deterministic verifier such as `compute.py`

Large matrices should be regenerated from compact descriptors and hashes rather than committed as duplicated opaque payloads. One active trace exists per active transaction; earlier complete traces are historical, and incomplete transports are removed.

## Documentation transaction

When a decision changes current authority, update in the same transaction:

```text
source/migrations/tests/workflows
→ active decision trace
→ production-readiness issue/workstream/test/evidence maps
→ architecture map and scoped CODEGRAPH
→ contributor/read-order docs
→ one dated handoff and MEMORY.md
→ PR/release record
```

Historical handoffs and audits are preserved as point-in-time evidence. Active-looking stale entrypoints become explicit routing stubs or move to `docs/archive/`.

## Non-claims

Computation does not establish implementation, test, CI, provider, managed-database, target-host, browser/channel, commercial, pilot, deployment, or production acceptance. It improves the quality and auditability of the choice; evidence establishes the state.
