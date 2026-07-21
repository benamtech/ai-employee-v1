# AMTECH Standard v0.2 — Amendment 001: Computation-First Engineering and Document Authority

Status: **ratified additive amendment and effective**  
Effective date: **2026-07-20**  
Approved by: **AMTECH human operator through explicit computation-first and repository-cleanup directives, including the correction separating candidate topology from software-invariant topology and selection influence from causal improvement**  
Applies to: `mvp-build/` engineering, planning, architecture, production-readiness, testing, documentation, and handoff work  
Base Standard: [`STANDARD.md`](STANDARD.md)  
Protocol: [`decision/README.md`](decision/README.md) and [`decision/protocol-v1.json`](decision/protocol-v1.json)  
Evolution supplement: [`validation/standard-v0.2-amendment-001-evolution.json`](validation/standard-v0.2-amendment-001-evolution.json)

## 0. Amendment control

This amendment expands and reorients engineering process. It removes or weakens no existing MUST. Where it conflicts with the base Standard's execution loop, document routing, or stale release-status prose, this amendment controls.

Computation is an engineering-process artifact. It does not change the evidence hierarchy, establish implementation, or promote acceptance.

## ENG-12.1A — Computed task contract

Every non-mechanical task MUST declare:

- task ID, repository, branch/base, and current head;
- objective, success criteria, allowed/forbidden files, tests, blockers, and commit ceiling;
- decision tier;
- authority/evidence sources and explicit Unknown coordinates;
- trace location for `T2/T3`;
- selected implementation identity or exact mechanical invariant.

A task MUST NOT self-classify as mechanical to avoid computation, prerequisites, or behavioral proof.

## ENG-12.3A — Execution loop

```text
authority and evidence/Unknown extraction
→ applicable independent candidate spaces
→ invariant and prerequisite filtering
→ simple evidence-and-invariants baseline
→ candidate search topology when useful
→ software invariant topology when useful
→ equal-feasibility controls
→ search and weight sensitivity
→ selected exploration
→ separate coherent implementation compression
→ complete behavioral proof plan
→ narrow red proof
→ implementation
→ affected and broad exact-head verification
→ required external acceptance
→ documentation and handoff reconciliation
```

`T0` MAY compress to:

```text
authority check → protected invariant → deterministic edit → exact verification
```

No implementation decision may be justified by a score, graph, model, or note created after the implementation choice.

## ENG-12.3B — Proportional tiers

| Tier | Boundary | Minimum |
|---|---|---|
| `T0 mechanical` | deterministic correction with no material choice | authority check, protected invariant, exact verification |
| `T1 bounded` | meaningful local choice | 4 candidates, 2 independent batches, evidence/Unknown labels, feasibility filter, rejection reasons |
| `T2 consequential` | security, database, provider, commercial, effect, recovery, owner-surface, or multi-file behavior | 16 candidates, 3 batches, simple baseline, equal-feasibility controls, search/weight sensitivity, separate implementation compression |
| `T3 production/cross-workstream` | release boundary, architecture mutation, or multiple workstreams | 64 candidates in 4 batches, explicit basis reconciliation, candidate graph, software invariant hypergraph, full/no-graph/no-diversity/evidence controls over one feasible domain, at least 1,000 feasible random baselines, at least 32 search restarts, at least 32 weight perturbations, implementation ablation or explicit non-causal result |

Tier reduction requires proof that no material decision space exists.

## ENG-12.3C — Concurrent spaces and Unknown

Applicable spaces MUST be considered independently before recombination:

```text
bug | feature | user | operator | architecture | protocol
commercial | failure | proof | market | weird | constraint
```

Evidence labels are:

```text
Observed | Inferred | Hypothesis | Unknown | NotApplicable
```

Unknown remains Unknown and increases `Unsupported`. It MUST NOT become zero risk, positive evidence, or an accepted prerequisite.

## ENG-12.3D — Separate topology layers

### Candidate search graph

Vertices are candidate trajectories. Relations MAY represent same-concept variants, shared implementation boundaries, recombination lineage, similarity, or common evidence.

It MAY compute candidate-edge touch, separation, redundancy, lineage, and diversity. It MUST NOT report software-invariant completion.

### Software invariant hypergraph

Vertices are actual software entities or obligations. Candidates MUST declare represented software vertices.

Only this graph MAY report:

- `touch` — an edge has any represented member;
- `fractional` — represented-member fraction;
- `complete` — every member is represented;
- `proved` — complete representation plus accepted independent behavioral proof on the exact candidate.

Representation MUST NOT be reported as proof.

## ENG-12.3E — Equal-feasibility controls and sensitivity

Mandatory coverage and invariants define a feasible domain. Mandatory coverage MUST be a constraint, not an objective reward.

`T2/T3` controls MUST use the same feasible domain:

```text
full
no_graph
no_diversity
evidence_baseline
feasible_random
```

Search sensitivity MUST report restarts, unique optima, objective spread, and selected-set stability. Weight sensitivity MUST report selected-set and software-coverage stability under declared perturbations. Instability MUST remain visible.

## ENG-12.3F — Selection influence and causality

A term is `selection-influencing` when it changes a selected set inside the same feasible domain.

A term is `causally improving` only when an equal-feasibility implementation ablation improves independent outcomes such as defects found, complete proof obligations, coherence, review defects, unnecessary scope, or executable verification yield.

Ranking differences, objective deltas, candidate-edge touch, and software-node representation MUST NOT establish causal improvement. Without independent outcome evidence, graph terms MUST be `descriptive`; diversity terms MUST be `descriptive` or `selection-influencing`.

## ENG-12.3G — Mathematical prerequisites

- Hypergraphs MUST represent genuine multi-way dependencies.
- Pairwise graphs SHOULD be preferred when they preserve the relationship.
- Hodge MUST NOT be used without a true simplicial complex.
- Koopman or another predictive latent model MUST NOT be used without repeated comparable trajectories, fitted propagation, held-out evaluation, and residual/diversity control.
- Predictive models MUST remain disabled when they do not outperform the simple baseline on held-out outcomes.
- COCONUT, continuous hidden-state reasoning, latent BFS, manifold, or phase-switching language MUST NOT be presented as implemented without executable source and verification.
- Derived metrics MUST be deterministically reconstructable.

Decorative mathematics is prohibited.

## ENG-12.4A — Implementation and behavioral proof

Exploration and implementation MUST be separate artifacts.

Implementation compression MUST:

- preserve every non-negotiable invariant;
- resolve the highest-value current boundary;
- reuse canonical primitives;
- name exact source/migration surfaces and evidence classes;
- map every selected software-invariant edge to a complete behavioral proof or explicit blocker;
- exclude unrelated cleanup and speculative architecture.

Tests cover the selected transaction and minimum failure manifold. Discarded candidates do not automatically become tests. Scores and graphs are not test oracles.

## ENG-12.7A — Decision scaffolding

Task matrices, candidate populations, candidate graphs, software invariant hypergraphs, deterministic verifiers, equal-feasibility controls, sensitivity reports, implementation ablations, counterexamples, implementation contracts, and verification plans are first-class `T2/T3` scaffolding.

Large derived matrices SHOULD be regenerated from compact descriptors rather than committed as duplicated opaque payloads.

## ENG-12.8A — Document ownership

Current document families are:

- root `AGENTS.md` — repository authority/evidence/routing;
- `mvp-build/AGENTS.md` — product invariants and task execution;
- root/scoped `CLAUDE.md` — short compatibility routers only;
- root `CODEGRAPH.md` — repository routing and major boundaries;
- `mvp-build/CODEGRAPH.md` — sole exact product status and executable topology;
- `STANDARD.md` plus ratified amendments — normative requirements;
- `decision/` — decision protocol and one active trace per consequential transaction;
- `production-readiness-program/` — sole active production route;
- `docs/architecture/` — current source-backed explanation;
- `memory/` — dated handoffs indexed only by `MEMORY.md`;
- `second-half-plan/`, old audits, and complete prior traces — historical/non-canonical;
- source, migrations, tests, workflows, and proof — implementation and acceptance authority.

Exact PR/SHA, migration head, issue counts, selected IDs, objective values, and gate status MUST NOT be duplicated across contributor mirrors or hard-pinned in structural governance.

## STD-13.3A — Release status ownership

Ratification does **not** make the product production-ready. Exact current source and evidence state lives in `mvp-build/CODEGRAPH.md` and exact workflow/release records.

No active document may use stale base-Standard status prose as current release state. No source, decision, documentation, fixture, local test, or ancestor result may satisfy a stronger gate it did not exercise.

## Appendix B amendment — Source map additions

Appendix B additionally includes:

- `decision/README.md` and `decision/protocol-v1.json`;
- active `decision/traceNNN/` directories;
- `production-readiness-program/`;
- current Model Gateway commercial/reconciliation source;
- effect-proof projection source;
- forward commercial/effect migrations;
- focused decision/governance/database workflows.

The source map is navigational. Executable source and exact evidence decide conformance.
