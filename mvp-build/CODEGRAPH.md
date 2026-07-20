# CODEGRAPH.md — AMTECH AI Employee build map

Status: active  
Updated: 2026-07-20  
Main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Newer stacked source/test authority: PR #33 merge `943f2613243ebcbcc9fb703e6273e83a5edc0a24`  
Migration head: `0072`  
Standard: v0.2 ratified

## Product boundary

- Hermes owns employee reasoning, runs, sessions, runtime-local memory/tool use, and runtime recovery.
- Manager owns identity, assignments, authority, capability/tool contracts, connector/OAuth custody, approvals, durable effects, commercial attribution, revocation, repair, and proof.
- Web, SMS, signed Review, MCP Apps, and AG-UI are role-safe projections, not authority.
- PostgreSQL/Supabase is durable authority, evidence, and reconciliation state.

## Current status

**`standard_v0_2__migration_0072__pr33_source_test_authority__ws05_ws06_active_incomplete__live_and_release_gates_open`**

PR #33/source/tests supersede stale plan-status prose only for their exact boundary. This branch has not established exact-head CI, live provider, fixture-free channel, managed database, target-host, pilot, deployment, or production acceptance.

## Owner runtime topology

```text
owner session
→ exact account + employee + assignment + authority version
→ validated full snapshot installed atomically
→ cursor/version established
→ ordered scoped deltas
→ reconnect from durable state without replaying accepted intent
→ Web / SMS / signed Review projections of one durable work object
→ approval bound to exact revision
→ one effect reservation
→ accepted | failed | ambiguous terminal receipt
→ replay-safe recovery and refindable proof
```

## Source hubs

| Boundary | Current evidence | Still open |
|---|---|---|
| repository/test truth | current source and exact local tests where run | exact-head CI and broader suites |
| owner Web snapshot/stream | source defect identified; WS-05 patch target | fixture-free browser/reconnect/cross-account acceptance |
| Web/SMS/Review convergence | durable models/source foundations | fixture-free parity and signed-review proof |
| work/approval/effect/receipt/proof | source foundations and exact prior tests | provider-backed golden journeys and proof refinding |
| connectors | manifest/custody source foundations | live auth/health/revocation/outage/repair/deletion |
| database | PR #33/newer source evidence only | exact managed-platform and release proof |
| target host/commercial/recovery/release | source foundations | all required live and production gates |

## Active production map

- Program root: `production-readiness-program/`.
- Roadmap: `production-readiness-program/04-dependency-ordered-production-plan.md`.
- Issue baseline: `production-readiness-program/08-production-issue-vector.json`.
- Resolution state: `production-readiness-program/13-resolution-ledger.json`.
- Workstreams: `production-readiness-program/09-workstream-execution-map.md`.
- Test authority: `production-readiness-program/10-test-suite-disposition.md`.
- Historical plans: `second-half-plan/`; non-canonical.

## Not accepted yet

- exact fixture-free owner login/account/employee/assignment selection across all projections;
- atomic snapshot, ordered delta, reconnect, and strict cross-account browser acceptance;
- live connector authorization, health, scope change, revocation, outage, repair, and deletion;
- fixture-free Web/SMS/signed Review convergence;
- provider-backed one-effect/terminal-receipt/recovery/proof journeys;
- managed database, target-host, accessibility, capacity, commercial, pilot, deployment, and production acceptance.

## Dependency order

1. Preserve exact current source/test truth and reject stale prose.
2. Complete admitted WS-05 owner snapshot/scope/cursor/reconnect behavior with executable tests.
3. Complete WS-06 durable work revision → approval snapshot → one effect → receipt → recovery → proof evidence only where prerequisites exist.
4. Keep WS-07/08/09 as read-only dependencies or future frontier nodes until their gates are deliberately opened.
