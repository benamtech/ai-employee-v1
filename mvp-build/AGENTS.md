# AGENTS.md — executable AI Employee agent interface

Status: active  
Updated: 2026-07-23

## Start

1. For a fresh coding-agent session, execute `decision/SESSION_ONBOARDING.md` before receiving or compiling the task prompt.
2. Read `../identity.md`, root `AGENTS.md`, this file, `CODEGRAPH.md`, and `authority-map.json` as routed by that bootstrap.
3. Read `STANDARD.md` plus ratified amendments and resolve the current transaction through `decision/active.json`.
4. For every non-mechanical task, run the repository-owned experiment compiler before source edits:

```bash
node decision/engine/repoctl.mjs start --task <task.json> --out decision/<trace-or-transaction>
```

5. Use the generated `task-capsule.json` as the machine contract and `TASK-CAPSULE.md` as its compact language view.
6. Generate candidates, predictions, proof obligations, maximum patch, and argv-based verification in a plan; then admit it before implementation:

```bash
node decision/engine/repoctl.mjs admit-plan --transaction <path> --plan <plan.json>
```

7. After implementation, run:

```bash
node decision/engine/repoctl.mjs evaluate --transaction <path>
node decision/engine/repoctl.mjs finish --transaction <path>
```

8. Stop stronger claims on red exact-head evidence. Never reset, clean, stash, or overwrite user work to satisfy the compiler.

The compiler is vendor-neutral. Claude Code, Codex, Cursor, Pi, local models, deterministic scripts, and humans use the same task capsule, representations, certificates, and evidence ledger.

For UI Lab or full employee UI-variant work, begin at `ui-lab/README.md`, then read `ui-lab/AGENTS.md` and the exact UI trace/source/tests named by the capsule.

## Representation cascade

Every non-mechanical task passes through the selector in `decision/engine/representation-registry.json`.

Always-on substrate:

```text
content-addressed repository facts
→ authority/evidence DAG
→ dependency graph
→ genuine software-invariant hypergraph
→ P2 source-to-model correspondence
→ task-local graph/hypergraph diffusion
→ typed first-through-fourth-order effect frontier
→ experiment contract and task capsule
```

The first specialized representation is a normalized spectral hypergraph operator with a small certificate verifier. Additional state-machine, SMT, e-graph, queueing, Koopman, topology, and embedding dialects activate only when their registered admission conditions and data prerequisites hold.

Natural language is a generated interoperability, review, and audit view. It is not the mandatory reasoning substrate.

## Proof taxonomy

- **P0:** representation calculation, simulation, ranking, or hypothesis.
- **P1:** machine-verified property of an explicit formal model. Eigenpairs, spectra, solver certificates, model-checker results, and other formal objects may be decisive proof instruments when their assumptions and verifiers pass.
- **P2:** verified correspondence between the representation and exact repository/source boundary.
- **P3:** accepted executable evidence on the exact software candidate.
- **P4:** external or production acceptance.

No class silently promotes itself. A P1 certificate may satisfy a software gate only when a verified P2 correspondence contract makes that implication sound. Causal engineering benefit requires outcomes; external acceptance remains separate.

## Retained artifact requirements

Every retained non-language artifact exposes or links to:

- generator and input digests;
- schema, dimensions, units, domains, and missing-value semantics;
- exact source SHA and locations;
- transformation, algorithm, parameters, seeds, and tolerances;
- assumptions and admissibility conditions;
- residuals, parity checks, counterexamples, or held-out validation;
- exact proof class and excluded claims;
- a compact language bridge.

Do not retain private chain-of-thought as authority. Retain typed observations, hypotheses, candidates, counterexamples, invariants, predictions, tests, outcomes, representations, transformations, and certificates.

## Queries

Use deterministic JSON queries instead of frontloading the repository into context:

```bash
node decision/engine/repoctl.mjs query authority --transaction <path> --entity <name>
node decision/engine/repoctl.mjs query impact --transaction <path> --path <repo-path>
node decision/engine/repoctl.mjs query invariants --transaction <path> --entity <name>
node decision/engine/repoctl.mjs query proofs --transaction <path> --hyperedge <id>
node decision/engine/repoctl.mjs query effects --transaction <path> --depth 4
node decision/engine/repoctl.mjs query evidence --transaction <path> --claim <id>
```

## Stable runtime roots and evidence

`apps/`, `packages/`, `infra/`, `tests/`, and `scripts/` are executable roots. Do not move them for documentation aesthetics.

`authority-map.json` routes authority; `CODEGRAPH.md` owns structural status; source, model certificates, unit/integration/CI, managed database, provider, target host, browser/channel/accessibility, commercial, recovery, trusted signing, pilot, deployment, and production are distinct evidence classes.

Before completion, run the applicable compiler verifier, focused proof matrix, repository governance, broad tests, and builds. Record unavailable external gates as blockers, never as passes.
