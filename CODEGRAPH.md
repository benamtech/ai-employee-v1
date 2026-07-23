# CODEGRAPH.md — Repository routing map

Status: active  
Updated: 2026-07-23

## Read path

```text
identity.md
→ AGENTS.md + CONTRIBUTING.md
→ nearest scoped AGENTS.md + CODEGRAPH.md
→ scoped authority-map.json + decision/active.json
→ decision/engine/repoctl.mjs for non-mechanical work
→ generated task capsule and admitted plan
→ exact source, tests, workflows, certificates, and evidence
```

Historical plans, audits, handoffs, and completed traces are provenance only.

## Product routing

```text
mvp-build/AGENTS.md                         product execution contract
mvp-build/authority-map.json                machine authority router
mvp-build/CODEGRAPH.md                      current product/workstream status
mvp-build/STANDARD.md                       normative requirements
mvp-build/decision/active.json              transaction router
mvp-build/decision/engine/repoctl.mjs       experiment compiler
mvp-build/decision/representation-contract.md
                                             proof and representation contract
mvp-build/production-readiness-program/     active production route
mvp-build/memory/MEMORY.md                  handoff index
```

## Evidence rule

```text
P0 representation calculation
P1 verified formal-model property
P2 verified representation correspondence
P3 exact-candidate executable evidence
P4 external or production acceptance
```

No document label, score, eigenvector, certificate, source path, workflow name, PR prose, or ancestor result silently promotes evidence class. A valid P1 proof remains real proof of its exact property; broader claims require the missing P2/P3/P4 evidence.
