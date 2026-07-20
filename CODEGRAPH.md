# CODEGRAPH.md — AMTECH AI Employee repository map

Status: active  
Updated: 2026-07-20  
Current main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Newer stacked source/test authority: PR #33 merge `943f2613243ebcbcc9fb703e6273e83a5edc0a24`

## Cold-session read order

1. `identity.md`
2. root `AGENTS.md`/`CLAUDE.md`, `CONTRIBUTING.md`, this file
3. scoped `mvp-build/AGENTS.md`/`CLAUDE.md` and `mvp-build/CODEGRAPH.md`
4. ratified `mvp-build/STANDARD.md`
5. `mvp-build/production-readiness-program/`
6. newest indexed memory handoff
7. architecture index
8. relevant source, migrations, executable tests, workflows, proof, PRs, and diff

Authority order: deployed proof → applied durable state → executable source/config → exact-SHA tests → Standard/current program → CODEGRAPH/architecture → newest indexed memory → history.

## Product boundary

AMTECH installs persistent AI Employees. Manager is the labor control plane; Hermes is the reasoning/runtime substrate. The Web client is an employee operating environment: persistent workspaces, streaming conversation/activity, connected systems, approvals, contextual apps, artifacts, proof, and recovery.

The durable moat is assignment → work revision → approval snapshot → effect → receipt → recovery → refindable proof. MCP, MCP Apps, AG-UI, OAuth, providers, models, Web, SMS, and signed Review are bounded mechanisms and projections.

## Canonical execution boundary

```text
trigger
→ authenticated principal
→ exact account / employee / assignment / current policy / authority version
→ durable intent and work revision
→ Hermes reasoning or deterministic Manager work
→ broad discovery + final effective-capability execution check
→ approval bound to the exact revision when required
→ one idempotent effect reservation
→ accepted | failed | ambiguous terminal receipt
→ reconciliation / replay-safe recovery
→ role-safe streaming and durable proof projection
```

## Current evidence headline

- PR #33/source/tests supersede stale plan-status prose only for their exact lifecycle/source/test boundary.
- Source wiring is not CI, live provider, fixture-free channel, managed database, target-host, pilot, or production acceptance.
- WS-05 and WS-06 remain open until the owner experience proves exact login/account/employee/assignment identity, connector state, atomic snapshot/ordered delta/reconnect behavior, Web/SMS/signed Review convergence, strict cross-account denial, durable work continuity, one effect, terminal receipt, replay-safe recovery, and proof refinding.
- WS-07, WS-08, and WS-09 remain downstream and are not independently implemented by this workstream.
- Migration head remains `0072` unless current migration source proves a newer applied head.
- The public estimator is outdated and non-canonical.

## Repository ownership boundary

- root authority files remain path-stable because governance and contributor tooling addresses them directly;
- `mvp-build/` owns executable product, Standard, `production-readiness-program/`, architecture, memory, tests, deployment, and proof;
- `mvp-build/second-half-plan/` is historical and non-canonical;
- `wiki/` owns strategy, research, and factual history, not current implementation authority;
- `.github/workflows/` owns exact-head merge/release verification when an exact run exists.

## Core invariants

1. Manager owns authority; Hermes reasons within bound capabilities.
2. Discovery is broad; execution is re-derived from current evidence before dispatch.
3. Streaming presentation does not wait on effect authority, but commands and effects do.
4. Initial snapshots install atomically only after exact scope validation; cursor/version precedes ordered deltas.
5. Reconnect does not replay accepted owner intent.
6. Browser, MCP Apps, AG-UI, models, and connector payloads cannot mint credentials or select providers, scopes, hosts, or authority versions.
7. Provider and connector secrets remain Manager-held.
8. Generated UI and shared state are presentation, not authority.
9. Stable retries do not duplicate effects; ambiguous outcomes reconcile first.
10. Cross-account, stale-assignment, stale-cursor, duplicate, and reordered projections fail closed.
11. Applied migrations are immutable and additions are forward-only.
12. Exact-candidate evidence controls release claims; production-ready requires every non-waivable gate on one signed deployed SHA.
