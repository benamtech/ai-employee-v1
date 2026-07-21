# CODEGRAPH.md — AMTECH AI Employee repository map

Status: active  
Updated: 2026-07-20  
Current main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Current stacked authority: PR #34 base `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a`; PR #35 WS-06/07 source candidate  
Source migration head: `0075`

## Cold-session read order

1. `identity.md`
2. root `AGENTS.md`/`CLAUDE.md`, `CONTRIBUTING.md`, this file
3. scoped `mvp-build/AGENTS.md`/`CLAUDE.md` and `mvp-build/CODEGRAPH.md`
4. ratified `mvp-build/STANDARD.md`
5. `mvp-build/production-readiness-program/`
6. `mvp-build/production-readiness-program/20-ws06-ws08-commercial-effect-transaction.md`
7. `mvp-build/decision/trace007/decision_record.md` and `compute.py`
8. newest indexed memory handoff
9. relevant architecture, source, migrations, executable tests, workflows, proof, PRs, and diff

Authority order: deployed proof → applied durable state → executable source/config → exact-SHA tests → Standard/current program → CODEGRAPH/architecture → newest indexed memory → history.

## Product boundary

AMTECH installs persistent AI Employees. Manager is the labor control plane; Hermes is the reasoning/runtime substrate. The Web client is an employee operating environment: persistent workspaces, streaming conversation/activity, connected systems, approvals, contextual apps, artifacts, proof, and recovery.

The durable moat is assignment → immutable work/request revision → exact approval/commercial admission → one effect → provider receipt → accounting receipt → output → repairable proof. MCP, MCP Apps, AG-UI, OAuth, providers, models, Web, SMS, and signed Review are bounded mechanisms and projections.

## Canonical execution boundary

```text
trigger
→ authenticated principal
→ exact account / employee / assignment / current policy / authority version
→ immutable request or work revision
→ Hermes reasoning or deterministic Manager work
→ current effective-capability and entitlement check
→ exact approval when required
→ atomic shared rate + budget admission
→ one durable command/effect + provider idempotency identity
→ accepted | failed | ambiguous durable receipt
→ accepted commercial accounting receipt
→ output/proof projection
→ reconciliation or replay-safe repair without repeating accepted effect
```

## Current evidence headline

- PR #34 is the exact stacked base for PR #35.
- PR #35 implements the WS-07 source transaction and bounded WS-08 repair/lineage/observability groundwork through forward migrations `0074` and `0075`.
- Website, Contractor Office, and Bookkeeping artifact publication now has an exact revision → approval → effect → output → owner-proof projection path in source.
- `mvp-build/decision/trace007/` is the only active WS-06/07/08 manifold trace. It preserves evidence-bounded forced dreaming while making every score, graph, selection, and unsupported penalty reproducible.
- Source wiring is not unit, integration, CI, live-provider, managed-database, target-host, pilot, or production acceptance. Each class requires exact evidence on the claimed head.
- PR #35 has a focused exact-head workflow, but CI remains unestablished until a run object exists and passes.
- The public estimator remains outdated and non-canonical.

## Repository ownership boundary

- root authority files remain path-stable because governance and contributor tooling addresses them directly;
- `mvp-build/` owns executable product, Standard, current production program, architecture, active decision traces, memory, tests, deployment, and proof;
- `mvp-build/decision/trace007/` owns the active computed WS-06/07/08 exploration and compression record;
- `mvp-build/second-half-plan/` and prior complete decision traces are historical and non-canonical;
- incomplete duplicate trace transports are deleted rather than retained as false authority;
- `wiki/` owns strategy, research, and factual history, not current implementation authority;
- `.github/workflows/` owns exact-head merge/release verification only when an exact run exists.

## Core invariants

1. Manager owns authority; Hermes reasons within bound capabilities.
2. Discovery may be broad; execution is re-derived from current evidence before dispatch.
3. Initial snapshots install atomically only after exact scope validation; cursor/version precedes ordered deltas.
4. Reconnect and retry do not replay accepted intent or effect.
5. Browser, model, MCP App, connector, and caller payloads cannot select credentials, providers, scopes, hosts, authority versions, budgets, or commercial state.
6. Provider and connector secrets remain Manager-held.
7. PostgreSQL is the shared rate, budget, settlement, ambiguity, and repair authority; per-process buckets are forbidden.
8. Accepted success requires matching provider, effect, and accounting receipts.
9. Accepted-but-unrecorded outcomes remain ambiguous and reconcile before retry.
10. Output, receipt, proof, and accounting identify the same revision and effect.
11. Every partial state has a convergent repair path or an explicit manual-repair terminal state.
12. Repair cannot erase accepted prior effects or invent completion.
13. Cross-account, stale-assignment, stale-entitlement, duplicate, and reordered requests fail closed.
14. Applied migrations are immutable and additions are forward-only.
15. Production-ready requires every non-waivable gate on one signed deployed SHA; no evidence class promotes into another.
