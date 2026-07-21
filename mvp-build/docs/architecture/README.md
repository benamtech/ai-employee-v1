# AMTECH AI Employee — Canonical Source-Backed Architecture

Status: **current source map; exact CI and live acceptance incomplete**  
Main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Stacked base: PR #34 exact head `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a`  
Current source candidate: PR #35 branch `agent/ws06-ws07-production`  
Source migration head: `0076`  
Standard: ratified v0.2  
Decision protocol: [`../../decision/README.md`](../../decision/README.md)  
Active program: `../../production-readiness-program/`

This directory explains executable architecture. It does not promote source or computed decisions into exact CI, live provider, managed database, target-host, browser/channel, commercial, pilot, deployment, or production evidence.

## System boundary

- **Web:** employee operating environment—durable workspace plus streaming conversation/activity, connected apps, approvals, artifacts, receipts, proof, and recovery.
- **Manager:** identity, assignment, authority, context, capability/tool contracts, connector/provider custody, approvals, effects, shared commercial admission, accounting, reconciliation, repair, and proof.
- **Hermes:** per-employee reasoning, runs, sessions, memory, runtime-local tool use, and runtime recovery.
- **Model Gateway:** assignment-scoped model effect, rate, budget, provider receipt, accounting, ambiguity, and proof boundary.
- **PostgreSQL/Supabase:** durable authority, idempotency, rate, budget, effects, accounting, lineage, and reconciliation state.
- **Protocol/channel adapters:** replaceable projections and transports; never authority.

## Reading order

1. product/system context;
2. network/runtime topology;
3. ingress/events/egress;
4. Hermes context/capabilities;
5. Web/work surfaces/AG-UI;
6. effects/failure/commercial/observability;
7. emergent capability manifold;
8. archaeology/audit;
9. current risk register;
10. role/document/decision maps;
11. artifact workbench;
12. Standard research/protocol disposition;
13. Hermes upstream review;
14. streaming, Remote MCP, MCP Apps, AG-UI, effective capability;
15. computation-first decision protocol;
16. active workstream map and current WS-06/07/08 transaction.

## Computation before architecture choice

Architecture work follows `decision/README.md`:

```text
source authority and Unknown extraction
→ applicable concurrent decision spaces
→ independent candidate batches
→ invariant/feasibility filter
→ computed utility/diversity/dependency comparison
→ selected exploration
→ separate coherent implementation compression
→ behavioral proof
→ source change
```

Possible spaces are not flattened: defect, future capability, owner/user, operator, architecture, protocol, commercial, failure, proof, market, weird adjacency, and constraint. Hypergraphs model genuine multi-way dependencies; Hodge and Koopman are used only when their mathematical prerequisites exist.

`decision/trace007/` is the active T3 example. Its graph/diversity terms are causal for that task because they materially change coverage and implementation selection. The trace remains decision evidence only.

## Current authority and evidence

| Plane | Current boundary |
|---|---|
| repository/test truth | PR #34 exact base plus PR #35 source candidate; exact-head workflow run still required |
| owner snapshot/stream | PR #34 source foundations; fixture-free atomic-install/cursor/scope/reconnect acceptance open |
| Web/SMS/signed Review | bounded projections; exact fixture-free convergence open |
| golden work | immutable revision/approval/effect/output/proof source chain for Website, Contractor Office, and Bookkeeping; provider-backed journeys and restart refinding open |
| Model Gateway/commercial | PostgreSQL admission, one durable dispatch, accepted/failed/ambiguous settlement, effect-bound accounting, refunds, conservation, reconciliation, lineage in source | 
| Remote MCP/MCP Apps/AG-UI/effective capability | retain exact accepted prior source/test evidence; live provider/host/client lifecycle open |
| connectors | source foundations; live setup, scope change, revocation, outage, repair, deletion open |
| WS-08 | repair queues, reconciliation, lineage, proof projection, fault seams, focused workflow in source; target-host recovery/rollback/backup/observability/signed release open |
| database/target host/pilot/release | named acceptance classes remain separate and open |

## Canonical work/effect topology

```text
owner, ambient, scheduled, or delegated intent
→ exact account + employee + assignment + authority/entitlement
→ immutable request or work revision
→ Hermes reasoning or deterministic Manager work
→ current effective capability
→ exact approval when required
→ atomic shared rate + worst-case budget reservation
→ one durable command/effect + provider idempotency identity
→ accepted | failed | ambiguous durable receipt
→ accepted commercial accounting receipt
→ output/publication bound to exact revision and effect
→ owner/operator proof projection
→ explicit reconciliation or replay-safe repair without repeating accepted effect
```

## Hardened interception points

1. exact principal, account, employee, assignment, authority, and entitlement;
2. computation-first architecture and implementation selection;
3. immutable request/work revision;
4. cursor/version before ordered deltas;
5. duplicate, stale, reordered, cross-account, stale-assignment rejection;
6. connector metadata, scope, custody, health, revocation, and final capability check;
7. generated/protocol actions re-enter Manager authority;
8. approval bound to exact revision;
9. shared database rate/budget admission before dispatch;
10. one durable effect and provider idempotency identity;
11. ambiguity reconciliation before retry;
12. effect-bound accounting and conservation;
13. output/effect/proof identity continuity;
14. projection repair without effect replay;
15. fixture-free and exact-evidence acceptance guards.

## Workstream boundary

- WS-05/06 owner-runtime source is based on PR #34.
- PR #35 is the WS-06/07 source candidate and bounded WS-08 groundwork.
- WS-06, WS-07, and WS-08 are not accepted until exact required external gates pass.
- WS-09 remains downstream.

## Non-negotiable invariants

1. Manager owns authority, custody, commercial state, reconciliation, and proof.
2. Hermes reasons within bound capabilities.
3. Computation precedes non-mechanical decision modeling and implementation.
4. Unknown evidence remains Unknown and increases Unsupported.
5. Browser, channel, model, runtime, or provider content cannot select authority, credentials, scopes, hosts, approvals, budgets, or effects.
6. Reconnect never resubmits accepted owner intent.
7. Shared rate and budget authority cannot be process-local.
8. Consequential effects reserve once and end in accepted, failed, or ambiguous evidence.
9. Accepted success requires matching provider, effect, and accounting receipts.
10. Repair cannot erase accepted effects or invent completion.
11. Applied migrations are immutable and forward changes are hash-recorded.
12. Exact-candidate evidence controls every production claim.
