# CODEGRAPH.md — AMTECH AI Employee repository map

Status: active  
Updated: 2026-07-20  
Main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Stacked authority: PR #34 exact base `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a`; PR #35 WS-06/07 source candidate  
Source migration head: `0076`

## Cold-session read order

1. `identity.md`
2. root contributor rules, `CONTRIBUTING.md`, and this file
3. scoped `mvp-build/AGENTS.md`/`CLAUDE.md` and `mvp-build/CODEGRAPH.md`
4. ratified `mvp-build/STANDARD.md` plus `mvp-build/STANDARD-V0.2-AMENDMENT-001.md`
5. mandatory `mvp-build/decision/README.md` and `protocol-v1.json`
6. `mvp-build/production-readiness-program/README.md`
7. current transaction record and active trace
8. newest indexed memory handoff
9. relevant architecture, source, migrations, executable tests, workflows, proof, PR, and diff

The amendment controls where the base Standard still shows the superseded execution loop, old document-family routing, migration `0072`, or the earlier source map.

Authority order:

```text
deployed proof
→ applied durable state
→ executable source/config
→ exact-SHA tests and acceptance
→ Standard/current program
→ CODEGRAPH/architecture
→ newest indexed memory
→ history
```

Computation precedes non-mechanical planning and implementation, but it remains prioritization evidence below source and acceptance.

## Product boundary

AMTECH installs persistent AI Employees. Manager is the labor control plane; Hermes is the reasoning/runtime substrate. Web is the employee operating environment: persistent workspaces, streaming conversation/activity, connected systems, approvals, contextual apps, artifacts, receipts, proof, and recovery.

The durable moat is:

```text
assignment
→ immutable request/work revision
→ exact approval and shared commercial admission
→ one command/effect and provider idempotency identity
→ provider receipt
→ accounting receipt
→ output
→ repairable proof
```

MCP, MCP Apps, AG-UI, OAuth, providers, models, Web, SMS, and signed Review are bounded mechanisms and projections.

## Computation-first boundary

For non-mechanical `mvp-build` work:

```text
authority/evidence/Unknown extraction
→ applicable possible-decision spaces
→ independent candidate batches
→ invariant/prerequisite filtering
→ computed comparison
→ selected exploration
→ separate coherent implementation compression
→ red behavioral proof
→ implementation
→ exact-head and external verification
```

Use proportional tiers `T0`–`T3` from `mvp-build/decision/README.md`. Hypergraphs, Hodge, Koopman, spectral metrics, and manifold language are allowed only when their prerequisites exist and the result materially affects selection.

## Canonical execution boundary

```text
trigger
→ authenticated principal
→ exact account / employee / assignment / current policy / authority version / entitlement
→ immutable request or work revision
→ Hermes reasoning or deterministic Manager work
→ current effective capability
→ exact approval when required
→ atomic shared rate + worst-case budget admission
→ one durable command/effect + provider idempotency identity
→ accepted | failed | ambiguous durable receipt
→ accepted commercial accounting receipt
→ output/proof projection
→ original-effect reconciliation or replay-safe repair without repeating accepted effect
```

## Current evidence headline

- Standard v0.2 plus Amendment 001 are effective.
- PR #34 is the exact stacked base for PR #35.
- PR #35 implements the WS-07 source transaction and bounded WS-08 repair/lineage/observability groundwork through forward migrations `0074`–`0076`.
- Website, Contractor Office, and Bookkeeping publication has an exact revision → approval → effect → output → owner-proof projection source path.
- Native-idempotency ambiguity can reconcile only the original effect identity before accounting/commercial settlement.
- `mvp-build/decision/README.md` is the mandatory computation protocol.
- `mvp-build/decision/trace007/` is the only active WS-06/07/08 T3 trace; incomplete trace transports were removed.
- Source wiring is not unit, integration, CI, provider, managed-database, target-host, browser/channel, commercial, pilot, deployment, or production acceptance.
- PR #35 has a focused exact-head workflow, but CI remains unestablished until a run exists and passes.
- The public estimator remains outdated and non-canonical.

## Repository ownership boundary

- root authority files remain path-stable for governance and contributor tooling;
- `mvp-build/` owns executable product, Standard and amendments, computation protocol/traces, active production program, architecture, memory, tests, deployment, and proof;
- `mvp-build/decision/README.md` owns the decision protocol;
- `mvp-build/decision/trace007/` owns the active computed transaction;
- `mvp-build/second-half-plan/`, old audits, handoffs, and prior complete traces are historical/non-canonical;
- incomplete duplicate trace transports are removed;
- `wiki/` owns strategy, research, and factual history, not current implementation authority;
- workflows own exact-head evidence only when a run exists.

## Core invariants

1. Manager owns authority; Hermes reasons within bound capabilities.
2. Standard v0.2 plus ratified amendments govern engineering.
3. Computation precedes non-mechanical decision modeling and implementation.
4. Unknown evidence remains Unknown and increases Unsupported.
5. Exploration may be broad; implementation is the smallest coherent compression.
6. Initial snapshots install atomically after exact scope validation; cursor/version precedes deltas.
7. Reconnect/retry do not replay accepted intent or effect.
8. Browser, model, MCP App, connector, or caller payload cannot select credentials, providers, scopes, hosts, authority versions, budgets, or commercial state.
9. Provider/connector secrets remain Manager-held.
10. PostgreSQL is shared rate, budget, settlement, ambiguity, and repair authority; process-local buckets are forbidden.
11. Accepted success requires matching provider, effect, and accounting receipts.
12. Accepted-but-unrecorded outcomes remain ambiguous and reconcile before retry.
13. Output, receipt, proof, and accounting identify the same revision and effect.
14. Every partial state has convergent repair or explicit manual-repair terminal state.
15. Repair cannot erase accepted effects or invent completion.
16. Cross-account, stale-assignment, stale-entitlement, stale-approval, duplicate, and reordered requests fail closed.
17. Applied migrations are immutable and additions are forward-only.
18. Production-ready requires every non-waivable gate on one exact signed deployed SHA; no evidence class promotes into another.
