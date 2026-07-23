# AGENTS.md — Repository contract

Status: active  
Updated: 2026-07-23

## Start

1. Read `identity.md`.
2. Read this file, `CONTRIBUTING.md`, and `CODEGRAPH.md`.
3. Enter the target subtree and read its nearest `AGENTS.md`, `CODEGRAPH.md`, and machine authority router when present.
4. Read only the active program, decision router, newest relevant indexed handoff, and exact source/test/proof needed for the task.

Historical plans, audits, handoffs, and completed traces are provenance, not active instructions. A completed trace may explain an implemented decision without becoming the next planning transaction.

## Authority and evidence

```text
deployed release proof
→ applied durable state
→ executable source and generated configuration
→ exact-SHA executable evidence
→ ratified requirements and active program
→ current routing and architecture
→ newest indexed memory
→ historical records
```

A lower evidence class never promotes itself into a higher one. Source is not CI. CI is not provider proof. Fixtures are not live acceptance. Ancestor evidence is not current-candidate evidence.

Formal and mathematical proof is first-class: a theorem, solver certificate, model-checker result, verified eigenstructure, or other reproducible certificate proves the exact property of the declared model. It satisfies a software or external gate only when the model-to-system correspondence required by that gate is also established.

## Routing

- `mvp-build/` — executable AI Employee product and production authority.
- `mvp-build/authority-map.json` — machine-readable authority router.
- `mvp-build/STANDARD.md` plus ratified amendments — normative requirements.
- `mvp-build/decision/active.json` — current decision router; it may state that no transaction is open.
- `mvp-build/decision/README.md` — computation-first method.
- `mvp-build/decision/representation-contract.md` — first-class non-language and machine-native software representations.
- `mvp-build/decision/` — decision protocol and completed traces.
- `mvp-build/production-readiness-program/` — sole active production-readiness route.
- `mvp-build/docs/architecture/` — source-backed explanatory architecture.
- `mvp-build/memory/MEMORY.md` — sole handoff index.
- `mvp-build/second-half-plan/`, old audits, and dated handoffs — historical only.
- `wiki/` — strategy, research, and factual history; never implementation authority.

Exact branch, candidate, migration, workstream, and gate status lives in `mvp-build/CODEGRAPH.md`, with transient SHA/run conclusions retained in the current PR, workflow, or release record.

## Repository-wide decision rules

- Compute before non-mechanical implementation using the scoped decision protocol.
- Agents may reason primarily with graphs, hypergraphs, vectors, tensors, embeddings, state machines, constraints, geometric/topological structures, and formal proof artifacts; natural language is the audit/interoperability layer.
- Mathematical proof or a machine-checkable certificate may decisively prove a property of a faithful formal representation.
- Causal benefit requires an appropriate experimental or formal causal argument; production acceptance requires the evidence class defined by the gate.
- Unknown remains Unknown; do not convert missing evidence into confidence.
- Keep exploration separate from implementation compression.
- Do not hand-construct representations or weights after selecting a desired patch merely to rationalize it.
- Koopman/DMD/EDMD-style propagation requires repeated comparable trajectories and held-out superiority over ordinary baselines for predictive claims.
- Do not let structural document tests become a second semantic specification.

## Contributor and Git discipline

Use `CONTRIBUTING.md` and the scoped contract for commands and tests. Work on the reviewed branch/base, never directly on `main`. Every commit references the task. Stop stronger claims on red exact-head CI. Do not weaken tests, hide blockers, or broaden evidence beyond the boundary exercised.
