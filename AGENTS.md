# AGENTS.md — Repository contract

Status: active  
Updated: 2026-07-23

## Start

1. Read `identity.md`, this file, `CONTRIBUTING.md`, and `CODEGRAPH.md`.
2. Enter the target subtree and read its nearest `AGENTS.md`, `authority-map.json`, and `CODEGRAPH.md`.
3. For a fresh coding-agent session targeting `mvp-build`, execute `mvp-build/decision/SESSION_ONBOARDING.md` before receiving or compiling the task prompt.
4. For non-mechanical `mvp-build` work, run the repository-owned experiment compiler before source edits:

```bash
cd mvp-build
node decision/engine/repoctl.mjs start --task <task.json> --out decision/<trace-or-transaction>
```

5. Use the generated task capsule, admit the plan, implement within its maximum patch, evaluate, and finish.
6. Stop stronger claims on red exact-head evidence.

Historical plans, completed traces, audits, and handoffs are provenance, not active instructions.

## Authority and evidence

`mvp-build/CODEGRAPH.md` owns current product status. The proof classes are:

```text
P0 representation calculation
P1 verified formal-model property
P2 verified model/repository correspondence
P3 exact-candidate executable software evidence
P4 external or production acceptance
```

No class silently promotes itself. Source is not CI. CI is not provider proof. Fixtures are not live acceptance. Ancestor evidence is not descendant evidence.

## Agent-native engineering

Natural language is an interoperability and audit layer, not the mandatory reasoning substrate. Agents may use graphs, genuine hypergraphs, vectors, matrices, tensors, spectral operators, formal systems, state machines, constraints, geometric/topological structures, and validated learned representations under the scoped registry and proof contract.

Retain typed artifacts, generators, provenance, assumptions, certificates, predictions, tests, and outcomes—not private chain-of-thought.

## Routing

- `mvp-build/decision/SESSION_ONBOARDING.md` — canonical pre-task session bootstrap.
- `mvp-build/` — executable product and experiment compiler.
- `mvp-build/decision/engine/repoctl.mjs` — universal non-mechanical task interface.
- `mvp-build/STANDARD.md` plus amendments — normative requirements.
- `mvp-build/production-readiness-program/` — active production route.
- `mvp-build/memory/MEMORY.md` — handoff index.
- `wiki/` — strategy and research, never implementation authority.

Work on the reviewed branch/base, never directly on `main`. Do not weaken tests, hide blockers, reset user work, or broaden evidence beyond the boundary exercised.
