# AMTECH AI Employee — Canonical Source-Backed Architecture

Status: **current source map; live acceptance incomplete**  
Main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Newer stacked source/test authority: PR #33 merge `943f2613243ebcbcc9fb703e6273e83a5edc0a24`  
Standard: ratified v0.2  
Active program: `../../production-readiness-program/`

This directory describes executable architecture and separates source implementation from exact test, live, and release acceptance.

## System boundary

- **Web:** employee operating environment—durable workspace plus streaming conversation/activity, connected apps, approvals, artifacts, receipts, proof, and recovery.
- **Manager:** identity, assignment, authority, context, capability/tool contracts, connector/OAuth custody, approvals, effects, receipts, metering, repair, proof.
- **Hermes:** per-employee reasoning, runs, sessions, memory, runtime-local tool use and recovery.
- **Model Gateway:** employee-scoped model/commercial boundary.
- **PostgreSQL/Supabase:** durable authority, evidence, idempotency, and reconciliation state.
- **Protocol/channel adapters:** replaceable projections and transports that never become authority.

## Reading order

1. product/system context
2. network/runtime topology
3. ingress/egress
4. Hermes context/capabilities
5. Web/work surfaces/AG-UI
6. effects/failure/observability
7. capability manifold
8. archaeology/audit
9. current risk register
10. role/document maps
11. artifact workbench
12. Standard research/protocol disposition
13. Hermes upstream review
14. streaming, Remote MCP, MCP Apps, AG-UI, and effective capability
15. `../../production-readiness-program/09-workstream-execution-map.md`

## Current authority and evidence

PR #33, current source, and executable tests supersede stale program-status prose only for the exact boundary they exercise. They do not establish exact-head CI on this branch, live provider, fixture-free Web/SMS/Review, managed database, target-host, pilot, deployment, or production acceptance.

| Plane | Current boundary |
|---|---|
| repository/test truth | current source and exact tests where run; broader exact-head CI open |
| owner snapshot/stream | full durable snapshot contract exists; browser atomic-install/cursor/scope/reconnect evidence is WS-05 work |
| Web/SMS/signed Review | bounded projections; exact fixture-free convergence open |
| work/approval/effect/receipt/proof | durable model/source foundations; provider-backed golden journeys and proof refinding open |
| Remote MCP/MCP Apps/AG-UI/effective capability | retain only exact prior source/test evidence; live provider/host/client lifecycle open |
| connectors | source foundations; live setup, scope change, revocation, outage, repair, deletion open |
| database/target host/commercial/recovery/release | all named acceptance gates remain distinct and open |

## Owner runtime and work continuity topology

```text
owner session
→ exact account + employee + assignment + authority version
→ validated snapshot installed atomically
→ cursor/version established
→ ordered scoped deltas
→ reconnect from durable state without replaying accepted intent
→ Web / SMS / signed Review projection of one work revision
→ approval snapshot bound to that revision
→ one idempotent external effect
→ accepted | failed | ambiguous terminal receipt
→ reconciliation / replay-safe recovery
→ assignment-isolated refindable proof
```

## Hardened interception points

1. owner session and assignment authorization;
2. exact account/employee/assignment/authority validation before snapshot install;
3. cursor/version establishment before deltas;
4. duplicate, stale, reordered, cross-account, and stale-assignment delta rejection;
5. reconnect without owner-intent replay;
6. connector metadata, scope, custody, health, revocation, and final effective-capability checks;
7. generated/protocol action mediation through current Manager authority;
8. approval bound to exact work revision;
9. one durable effect reservation and terminal receipt;
10. ambiguous reconciliation before retry;
11. receipt-backed completion and proof refinding;
12. fixture-free acceptance guards.

## Workstream boundary

WS-05 and WS-06 are active and incomplete. WS-07, WS-08, and WS-09 may appear only as read-only dependencies, predicted future states, or unresolved frontier nodes until separately opened.

## Non-negotiable invariants

1. Manager owns authority and custody.
2. Hermes reasons within bound capabilities.
3. Harmless stream projection should be low latency; effect gates remain strict.
4. Browser, channel, protocol, runtime, or provider content cannot select authority, credentials, scopes, hosts, approvals, or effects.
5. Unknown, stale, revoked, cross-account, mismatched, or unprobed evidence fails closed.
6. Reconnect never resubmits accepted owner intent.
7. Consequential effects reserve once and end in accepted, failed, or ambiguous receipt.
8. Completion is receipt-backed and proof remains refindable.
9. Applied migrations are immutable and forward changes are hash-recorded.
10. Exact-candidate evidence controls every production claim.
