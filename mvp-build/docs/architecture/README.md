# AMTECH AI Employee — Canonical Source-Backed Architecture

Status: **current source map; WS-01 and WS-02 protocol source/CI accepted; live deployment acceptance incomplete**  
Merged baseline: current `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
WS-02 implementation evidence head: `6f792eabe44a9ca1e9635fd4fe5329fa7daca6c4`  
Standard: ratified v0.2  
Active program: `../../second-half-plan/2026-07-19-ratified-standard-production-program/`

This directory describes executable architecture and separates source implementation from live acceptance.

## System boundary

- Web: employee OS-like owner surface—durable workspace plus streaming conversation/activity, connected apps, approvals, artifacts, proof, and recovery.
- Manager: identity, assignment, authority, capability/tool contracts, connector/OAuth custody, approvals, effects, receipts, metering, repair, proof.
- Hermes: per-employee reasoning, sessions/runs, memory, runtime-local tool use and recovery.
- Model Gateway: employee-scoped model/commercial boundary.
- PostgreSQL/Supabase: durable authority/evidence/reconciliation.
- Protocol adapters: replaceable transports that never become authority.

## Reading order

1. product/system context
2. network/runtime topology
3. ingress/egress
4. Hermes context/capabilities
5. Web/work surfaces/AG-UI
6. effects/failure/observability
7. capability manifold
8. archaeology/audit
9. risk register
10. role/document maps
11. artifact workbench
12. Standard research/protocol disposition
13. Hermes upstream review
14. `18-streaming-remote-mcp-mcp-apps-ag-ui-and-effective-capability.md`

## Current protocol disposition

- AMTECH labor protocol is durable authority.
- MCP core supplies discovery/resources/tools and protected-resource authorization.
- MCP Apps supplies negotiated isolated contextual UI.
- AG-UI supplies optional ordered run/message/activity/state transport.
- Generated views and shared state are role-safe projection.
- Discovery may be broad; execution is re-derived from current Manager evidence.
- Streaming is latency-sensitive presentation, not an authority bypass.

## Current evidence

Implementation head `6f792ea` passed Standard `29731384034`, Hermes `29731384166`, and Main Integration `29731384039`, including broad 109/630, source contracts, build, archaeology, and compiled Chromium.

| Plane | Current state |
|---|---|
| repository/test truth | source/CI accepted |
| provider authority | source/CI locked |
| streaming Web/Work Stream | source/CI accepted; fixture-free latency/parity open |
| Remote MCP authorization | source/CI accepted; live AS/provider open |
| MCP Apps | source/CI accepted; external host/provider open |
| AG-UI | source/CI accepted; third-party client/reconnect/revocation open |
| effective capabilities | persisted/source execution gate accepted; live lifecycle open |
| connector setup/custody | source accepted; live lifecycle open |
| database/target host/channels/commercial/recovery/release | acceptance open |

## Non-negotiable invariants

1. Manager owns authority and custody.
2. Hermes reasons within bound capabilities.
3. Harmless stream projection should be terminal-fast; effect gates remain strict.
4. Browser/protocol/runtime content cannot select providers, scopes, hosts, credentials, authority versions, or approvals.
5. Unknown/stale/revoked/unprobed evidence fails closed.
6. Consequential effects reserve once and end in accepted/failed/ambiguous receipt.
7. Exact-candidate evidence controls every production claim.