# AMTECH AI Employee — Canonical Source-Backed Architecture

Status: **current source map; WS-01 and hardened WS-02 source/CI accepted; live acceptance incomplete**  
Merged baseline: current `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
Hardened WS-02 implementation evidence head: `16dc18e0535ac14f867875989dfe5aee596f89c0`  
Standard: ratified v0.2  
Active program: `../../second-half-plan/2026-07-19-ratified-standard-production-program/`

This directory describes executable architecture and separates source implementation from live acceptance.

## System boundary

- **Web:** employee operating environment—durable workspace plus streaming conversation/activity, connected apps, approvals, artifacts, proof, and recovery.
- **Manager:** identity, assignment, authority, context, capability/tool contracts, connector/OAuth custody, approvals, effects, receipts, metering, repair, proof.
- **Hermes:** per-employee reasoning, runs, sessions, memory, runtime-local tool use and recovery.
- **Model Gateway:** employee-scoped model/commercial boundary.
- **PostgreSQL/Supabase:** durable authority, evidence, idempotency, and reconciliation state.
- **Protocol adapters:** replaceable projections and transports that never become authority.

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
14. `18-streaming-remote-mcp-mcp-apps-ag-ui-and-effective-capability.md`
15. active-program WS-03 frontier/task contract

## Current protocol disposition

- AMTECH labor protocol is durable authority.
- MCP core supplies discovery/resources/tools and protected-resource authorization.
- MCP Apps supplies content-bound isolated contextual UI.
- AG-UI supplies optional ordered run/message/activity/state transport.
- Generated views, live deltas, and shared state are role-safe projection.
- Discovery may be broad; execution is re-derived from current Manager policy/version/evidence immediately before dispatch.
- Streaming is latency-sensitive presentation, not an authority bypass.

## Current evidence

Implementation head `16dc18e` passed Standard `29735429854`, Hermes `29735429873`, and Main Integration `29735429859`, including broad **110 files / 635 tests**, source/type/lint/contracts, build, archaeology, and compiled Chromium.

| Plane | Current state |
|---|---|
| repository/test truth | source/CI accepted |
| provider authority | source/CI locked |
| streaming Web/Work Stream | account/employee/assignment-scoped projection accepted; fixture-free latency/parity open |
| Remote MCP authorization | source/CI accepted; live AS/provider open |
| MCP Apps | CSP/content/hash/host mediation accepted; external host/provider open |
| AG-UI | ordered assignment/version projection and finite return path accepted; third-party client proof open |
| effective capabilities | final current policy/version/provider-verification gate accepted; live lifecycle open |
| connector setup/custody | source accepted; `ISS-011` live lifecycle open |
| database | WS-03 frontier prepared; ledger/RLS/concurrency/rollback/platform proof open |
| target host/channels/commercial/recovery/release | acceptance open |

## Hardened interception points

1. protected-resource metadata retrieval;
2. authorization-server selection;
3. OAuth redirect/state/PKCE/resource/scope validation;
4. token sealing and adapter access;
5. MCP credential verification;
6. final current assignment/policy/authority-version/effective-capability check before `tools/call` dispatch;
7. MCP App metadata and content-hash verification before render;
8. iframe source/origin/method/authority verification;
9. first-party protocol-action route;
10. current Manager assignment/version check before approval or owner-message command;
11. assignment-scoped live-stream subscription and AG-UI projection;
12. durable approval/effect reservation and receipt boundary.

## WS-03 architecture frontier

WS-03 is prepared, not started. Its dependency order is:

```text
blank ledger and migration hashes
→ effective-capability evidence constraints
→ RLS/grant/security-definer negative isolation
→ authority-version revocation races
→ command/effect reservation concurrency
→ existing-row/backfill/rollback compatibility
→ disposable managed-Supabase trigger proof
```

Applied migrations `0001`–`0072` are immutable. Local PostgreSQL is the routine TDD loop; managed-platform acceptance requires the named disposable-project evidence.

## Non-negotiable invariants

1. Manager owns authority and custody.
2. Hermes reasons within bound capabilities.
3. Harmless stream projection should be terminal-fast; effect gates remain strict.
4. Browser/protocol/runtime content cannot select providers, scopes, hosts, credentials, authority versions, or approvals.
5. Unknown, stale, revoked, mismatched, or unprobed evidence fails closed.
6. Consequential effects reserve once and end in accepted/failed/ambiguous receipt.
7. Applied migrations are immutable and forward changes are hash-recorded.
8. Exact-candidate evidence controls every production claim.
