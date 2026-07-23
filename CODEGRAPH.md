# CODEGRAPH.md — Repository routing map

Status: active  
Updated: 2026-07-23

## Read path

```text
identity.md
→ AGENTS.md + CONTRIBUTING.md
→ nearest scoped AGENTS.md + CODEGRAPH.md
→ scoped authority-map.json + decision/active.json
→ decision method + machine-native representation contract
→ normative requirements
→ active program
→ exact source, tests, formal certificates, workflows, and proof
```

Historical plans, audits, handoffs, and completed traces are provenance only. A completed decision trace does not imply that a new planning transaction is open.

## Major boundaries

- `mvp-build/` owns the executable AI Employee product and all candidate, migration, workstream, and acceptance status.
- `wiki/` owns strategy, research, and factual history.
- `.github/workflows/` produces exact-head executable evidence when a run exists.
- root contributor files own repository-wide routing and evidence discipline, not product topology.

## Product routing

```text
mvp-build/AGENTS.md                         product execution contract
mvp-build/authority-map.json                machine-readable authority router
mvp-build/CODEGRAPH.md                      current executable topology and structural status
mvp-build/STANDARD.md                       ratified normative requirements
mvp-build/decision/active.json              current/no-open-transaction decision router
mvp-build/decision/README.md                computation protocol
mvp-build/decision/representation-contract.md
                                             machine-native representation and proof policy
mvp-build/production-readiness-program/README.md
                                             single active production route
mvp-build/docs/architecture/                source-backed explanation
mvp-build/memory/MEMORY.md                  sole handoff index
mvp-build/second-half-plan/                 historical plans
```

Exact transient SHA, workflow run, and conclusion live in the current PR, workflow, or retained release record rather than in routing mirrors.

## Evidence and proof rule

Formal model-property proof is first-class. A theorem, solver certificate, model-checker result, verified eigenstructure, or other reproducible mathematical certificate proves the exact property of its declared model. A verified representation-to-source/runtime correspondence may allow that proof to satisfy a software gate.

```text
P1 formal model-property proof + P2 representation fidelity
→ P3 executable software proof when the gate's sound correspondence is established
→ P4 external/production acceptance only when the external gate is exercised or formally discharged under its own contract
```

No document label, unverified score, bare eigenvector, hyperedge touch, fixture, source path, workflow name, PR prose, or ancestor result silently promotes evidence class. A validated eigenvector or spectral certificate is not “bare”: it is legitimate P1 proof when its operator, assumptions, residuals, conditioning, and theorem boundary are explicit.
