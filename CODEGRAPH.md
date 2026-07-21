# CODEGRAPH.md — Repository map

Status: active  
Updated: 2026-07-20  
Active stack: PR #34 base → PR #35 candidate  
Source migration head: `0076`

## Read path

```text
identity.md
→ AGENTS.md + CONTRIBUTING.md
→ mvp-build/AGENTS.md + mvp-build/CODEGRAPH.md
→ STANDARD.md + ratified amendments
→ decision/README.md + active trace
→ production-readiness-program/README.md + current transaction
→ exact source, tests, workflows, and proof
```

Historical plans, audits, and handoffs are consulted only for provenance.

## Product boundary

AMTECH installs governed, persistent AI Employees.

- **Hermes:** reasoning, runs, sessions, runtime-local memory and tool execution.
- **Manager:** identity, assignments, authority, connectors/provider custody, approvals, durable commands/effects, shared commercial admission/accounting, reconciliation, repair, and proof.
- **Web/SMS/signed Review/MCP Apps/AG-UI:** bounded projections; never independent authority.
- **PostgreSQL/Supabase:** durable shared identity, rate, budget, effect, receipt, accounting, lineage, and reconciliation state.

Canonical transaction:

```text
principal + exact assignment
→ immutable request/work revision
→ current capability and approval
→ atomic shared rate/budget admission
→ one command/effect + provider idempotency identity
→ accepted | failed | ambiguous receipt
→ effect-bound accounting receipt
→ output and repairable proof
→ original-effect reconciliation or projection repair
```

## Current evidence

- PR #35 contains WS-07 commercial/effect source and bounded WS-08 repair groundwork through migration `0076`.
- Its current trace expands 64 candidates, but the graph term is **descriptive/non-causal** until an implementation-selection ablation exists.
- Existing hypergraph coverage is primarily edge touch; complete selected-edge coverage is not established.
- Exact-head CI, managed database, provider, target-host, fixture-free channel/golden work, commercial lifecycle, signed release, pilot, deployment, and production readiness remain separate gates.
- The public estimator is outdated and non-canonical.

## Decision contract

`mvp-build/decision/README.md` owns the protocol. The repository does not claim to implement COCONUT or continuous hidden-state reasoning. Those ideas may inspire candidate generation only.

A mathematical term may influence implementation only after:

```text
valid prerequisites
+ simpler baseline
+ implementation-level ablation
+ weight sensitivity
+ search sensitivity
+ honest evidence boundary
```

Otherwise it is descriptive and removable without changing the patch.

## Ownership

| Path | Owns |
|---|---|
| `mvp-build/` | executable product and production work |
| `mvp-build/STANDARD.md` | ratified normative requirements |
| `mvp-build/decision/` | decision protocol and traces |
| `mvp-build/production-readiness-program/` | one active program |
| `mvp-build/docs/architecture/` | current source-backed explanation |
| `mvp-build/memory/MEMORY.md` | handoff index |
| `mvp-build/second-half-plan/` | historical plans |
| `wiki/` | strategy/research/history |
| `.github/workflows/` | exact-head executable evidence when a run exists |
