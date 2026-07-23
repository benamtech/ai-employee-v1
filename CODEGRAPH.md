# CODEGRAPH.md — Repository routing map

Status: active  
Updated: 2026-07-23

## Read path

```text
identity.md
→ AGENTS.md + CONTRIBUTING.md
→ nearest scoped AGENTS.md + CODEGRAPH.md
→ scoped authority-map.json + decision/active.json
→ normative requirements
→ active program
→ exact source, tests, workflows, and proof
```

Historical plans, audits, handoffs, and completed traces are provenance only. A completed decision trace does not imply that a new planning transaction is open.

## Major boundaries

- `mvp-build/` owns the executable AI Employee product and all candidate, migration, workstream, and acceptance status.
- `wiki/` owns strategy, research, and factual history.
- `.github/workflows/` produces exact-head executable evidence when a run exists.
- root contributor files own repository-wide routing and evidence discipline, not product topology.

## Product routing

```text
mvp-build/AGENTS.md                 product execution contract
mvp-build/authority-map.json        machine-readable authority router
mvp-build/CODEGRAPH.md              current executable topology and structural status
mvp-build/STANDARD.md               ratified normative requirements
mvp-build/decision/active.json      current/no-open-transaction decision router
mvp-build/decision/README.md        computation protocol
mvp-build/production-readiness-program/README.md
                                     single active production route
mvp-build/docs/architecture/        source-backed explanation
mvp-build/memory/MEMORY.md          sole handoff index
mvp-build/second-half-plan/         historical plans
```

Exact transient SHA, workflow run, and conclusion live in the current PR, workflow, or retained release record rather than in routing mirrors.

## Evidence rule

```text
deployed proof
→ applied durable state
→ executable source/config
→ exact-SHA tests and acceptance
→ requirements/current program
→ topology/architecture
→ indexed memory
→ history
```

No document label, score, eigenvector, hyperedge touch, fixture, source path, workflow name, PR prose, or ancestor result promotes evidence class.
