# AMTECH Standard v0.2 — Amendment 001: Computation-First Engineering and Current Authority

Status: **ratified additive amendment and effective**  
Effective date: **2026-07-20**  
Approved by: **AMTECH human operator through the explicit directive requiring a comprehensive `mvp-build` repository-wide documentation cleanup and all required computation before decision modeling or implementation across possible-decision vectors**  
Applies to: `mvp-build/` engineering, planning, architecture, production-readiness, testing, documentation, and handoff work  
Base Standard: [`STANDARD.md`](STANDARD.md), blob `83db0285649c41df6f0d5ac16928e78f5df308af`  
Protocol: [`decision/README.md`](decision/README.md) and [`decision/protocol-v1.json`](decision/protocol-v1.json)  
Evolution supplement: [`validation/standard-v0.2-amendment-001-evolution.json`](validation/standard-v0.2-amendment-001-evolution.json)

## 0. Amendment control

This amendment is an `expansion` and `reorientation`. It removes or weakens no existing MUST. Where it conflicts with `ENG-12.1`, `ENG-12.3`, `ENG-12.7`, `ENG-12.8`, `STD-13.3`, or Appendix B of the base Standard, this amendment controls. All other clauses remain unchanged.

Computation is a mandatory engineering-process artifact. It does not change the evidence hierarchy in `STD-0.3`, establish implementation, or promote acceptance state.

## ENG-12.1A — Computed task contract

Every non-mechanical engineering task MUST declare:

- task ID, repository, branch/base, and current head;
- objective, success criteria, allowed/forbidden files, required tests, blockers, and commit ceiling;
- applicable decision tier from `decision/README.md`;
- authority/evidence sources and explicit Unknown coordinates;
- required decision-trace location for `T2`/`T3` work;
- selected implementation IDs or the exact mechanical invariant for `T0`.

A task MUST NOT self-classify as mechanical merely to avoid computation, prerequisite analysis, or behavioral proof.

## ENG-12.3A — Computation-first execution loop

The execution loop is:

```text
authority and evidence/Unknown extraction
→ applicable concurrent possible-decision spaces
→ independent candidate generation
→ invariant and prerequisite filtering
→ computed comparison
→ selected exploration
→ separate coherent implementation compression
→ narrow red behavioral proof
→ implementation
→ affected and broad exact-head verification
→ required external acceptance
→ documentation and handoff reconciliation
```

For a truly mechanical edit with no material alternative, `T0` MAY compress this to:

```text
authority check → protected invariant → exact deterministic edit → exact verification
```

No implementation decision may be justified by a score, graph, model, or note created after the implementation choice was already made.

## ENG-12.3B — Proportional decision tiers

The repository MUST use these minimum tiers:

| Tier | Boundary | Minimum computation |
|---|---|---|
| `T0 mechanical` | deterministic correction with no material choice | authority check, protected invariant, exact verification |
| `T1 bounded` | meaningful local choice | at least 4 candidates, 2 independent batches, evidence/Unknown labels, feasibility filter, rejection reasons |
| `T2 consequential` | security, database, provider, commercial, effect, recovery, owner-surface, or multi-file behavior | at least 16 candidates, 3 batches, weighted comparison, utility-only comparison, separate implementation compression |
| `T3 production/cross-workstream` | release boundary, architecture mutation, or multiple workstreams | at least 64 candidates in current/feature/counterfactual/recombination batches, explicit basis reconciliation, multi-way dependency analysis or proof of pairwise sufficiency, joint/utility/diversity comparison, at least 100 feasible random baselines, causal/descriptive graph classification, separate implementation compression |

Tier reduction requires a recorded proof that no material decision space exists.

## ENG-12.3C — Concurrent spaces and Unknown evidence

Applicable possible-decision spaces MUST be considered independently before recombination:

```text
bug | feature | user | operator | architecture | protocol
commercial | failure | proof | market | weird | constraint
```

Excluded spaces MUST record why they are not applicable. Dimensions from different spaces MUST NOT be silently collapsed into one coordinate system.

Evidence labels are:

```text
Observed | Inferred | Hypothesis | Unknown | NotApplicable
```

Unknown remains Unknown and increases `Unsupported`. It MUST NOT be converted into zero risk, positive evidence, or an accepted prerequisite.

## ENG-12.3D — Mathematical validity

- Hypergraphs MUST be used only for genuine multi-way dependencies.
- Pairwise graphs SHOULD be preferred when they preserve the relationship.
- Hodge Laplacians MUST NOT be used unless the task constructs a true simplicial complex.
- Koopman propagation MUST NOT be used unless repeated comparable trajectories exist, an operator is fitted, held-out propagation error is computed, and residual/diversity control prevents mode collapse.
- Spectral entropy, separation, quality-diversity, and redundancy metrics MUST be deterministically reconstructable.
- Graph/diversity terms are `causal` only when they materially alter selected candidates, required coverage, feasibility, or implementation compression; otherwise they are `descriptive` and cannot justify complexity.

Decorative mathematics is prohibited.

## ENG-12.3E — Exploration and implementation separation

Selected exploration and selected implementation MUST be separate artifacts.

The implementation compression MUST:

- preserve every non-negotiable Standard invariant;
- resolve the highest-value current boundary;
- reuse canonical primitives instead of creating parallel ontologies, runtimes, plans, or authority sources;
- name exact files, migrations, tests, and evidence classes;
- have direct behavioral proof or an honest blocked proof;
- exclude unrelated cleanup and speculative architecture.

A broad possibility frontier MUST NOT become an equally broad patch list.

## ENG-12.4A — Test selection after computation

Computation precedes test design, but implementation remains Red → Green → Refactor.

Tests MUST cover the selected implementation transaction, its protected invariant boundaries, and the smallest counterexample/failure manifold needed to prove convergence. Discarded possible-decision vectors do not automatically become tests.

A score or graph is not a test oracle. Expected behavior derives from Standard and source invariants.

## ENG-12.7A — Decision scaffolding

Decision protocols, task-state matrices, candidate populations, score definitions, dependency matrices/hypergraphs, deterministic verifiers, selection comparisons, counterexample matrices, implementation contracts, and verification plans are first-class engineering scaffolding for `T2`/`T3` work.

Large opaque matrices SHOULD be regenerated from compact descriptors and retained hashes rather than committed as duplicated payloads.

## ENG-12.8A — Current document families

Current document families are:

- `STANDARD.md` plus ratified amendments — normative requirements;
- `decision/README.md` and `decision/protocol-v1.json` — computation-before-decision contract;
- one active `decision/traceNNN/` per active consequential transaction;
- `production-readiness-program/` — sole active production-readiness roadmap, issue, resolution, workstream, test, and evidence route;
- `CODEGRAPH.md` — current topology, source hubs, migration head, and evidence boundary;
- `docs/architecture/` — current source-backed explanation;
- `memory/` — dated narrative handoffs indexed only by `memory/MEMORY.md`;
- `wiki/MVP/implementation-records/` — historical factual ledger;
- `second-half-plan/`, old audits, and prior complete traces — historical and non-canonical;
- source, migrations, tests, workflows, and proof — implementation and acceptance authority.

Active-looking stale entrypoints MUST become explicit routing stubs or move to archive. Historical bodies remain point-in-time evidence and are not rewritten to appear current.

## STD-13.3A — Current release status

Ratification and this amendment do **not** make the product production-ready.

As of 2026-07-20:

- main baseline is `48b917389ed85b9652eca43a8e4a8f60b52e917b`;
- PR #34 exact head `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a` is the stacked owner-runtime base;
- PR #35 is the WS-06/07 source candidate with bounded WS-08 groundwork;
- source migration head is `0076`;
- `decision/trace007/` is the active `T3` computed transaction;
- exact-head computation/document/source/unit/PostgreSQL/broad CI remains pending;
- managed database, live provider/connector, target host, fixture-free browser/channel/golden-work, commercial lifecycle, recovery/rollback, signed release, accessibility, capacity, pilot, deployment, and production evidence remain separate and open.

No active document may cite the base Standard's earlier `0072` status sentence as current release state.

## Appendix B amendment — Current source map additions

Appendix B additionally includes:

- `decision/README.md`
- `decision/protocol-v1.json`
- `decision/trace007/`
- `production-readiness-program/`
- `apps/manager/src/lib/model-gateway-commercial.ts`
- `apps/manager/src/lib/model-gateway-reconciliation.ts`
- `apps/manager/src/lib/effect-proof-projection.ts`
- `infra/scripts/acceptance/verify-commercial-effect-migrations.mjs`
- `packages/db/migrations/0073*` through `packages/db/migrations/0076*`
- `.github/workflows/ws07-ws08-commercial-effect.yml`

The source map remains navigational. Computation selects work; current source and exact evidence decide conformance.
