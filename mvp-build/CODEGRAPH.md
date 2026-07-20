# CODEGRAPH.md — AMTECH AI Employee build map

Status: active  
Updated: 2026-07-20  
Merged baseline: `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
WS-02 implementation evidence head: `6f792eabe44a9ca1e9635fd4fe5329fa7daca6c4`  
Migration head: `0072`  
Standard: v0.2 ratified

## Product boundary

- Hermes owns employee reasoning, runs, sessions, runtime-local memory/tool use, and runtime recovery.
- Manager owns identity, assignments, authority, capability/tool contracts, connector and OAuth custody, approvals, durable effects, commercial attribution, revocation, repair, and proof.
- Web is an employee OS-like operating surface: durable workspace plus token-level streaming, activity, apps, approvals, artifacts, proof, and recovery.
- MCP Apps and AG-UI are role-safe projections, not authority.
- PostgreSQL/Supabase is durable authority/evidence/reconciliation state.

## Current status

**`standard_v0_2__migration_0072__ws01_green__provider_authority_locked__ws02_protocol_source_ci_accepted__live_connector_and_release_gates_open__not_launch_cleared`**

Implementation head `6f792ea` passed:

- Ratified Standard and governance `29731384034`;
- Hermes Upstream Review `29731384166`, pin unchanged;
- Main Integration `29731384039`: broad **109 files / 630 tests**, source contracts, build, archaeology, compiled Chromium.

## WS-02 executable topology

```text
Hermes /v1/runs/{id}/events
→ streaming-first Manager adapter
→ assistant_delta | work_progress | run_completed
→ assignment + authority-version scoped Manager SSE
→ native Web live console and durable workspace
→ optional AG-UI RUN/TEXT/STATE/ACTIVITY projection

MCP protected resource
→ Manager metadata discovery
→ exact issuer/resource/redirect/scopes + PKCE/state
→ token exchange
→ sealed Manager secret references

Hermes tools/list
→ broad discovery
Hermes tools/call
→ current MCP credential
→ assignment/policy/authority version
→ entitlement + connector binding/probe freshness
→ persisted effective-capability decision
→ Manager tool
→ approval/effect/reservation/receipt

WorkResource
→ native renderer or negotiated ui:// MCP App
→ opaque-origin sandbox + content hash + no direct network
→ finite amtech.surface.intent
→ current WorkAction/authority intersection
→ existing Manager command boundary
```

## Source hubs

| Boundary | Current source/CI state | Still open |
|---|---|---|
| repository/test truth | accepted | preserve exact-head discipline |
| model/provider authority | locked | live provider/host proof |
| Remote MCP authorization | metadata/audience/PKCE/state/custody contracts accepted | real AS/token/revocation proof |
| MCP Apps | negotiated resource, sandbox/hash/host-method/action projection accepted | third-party compliant host and live CSP/provider proof |
| AG-UI | ordered mapping, first-party SSE, finite command shape accepted | fixture-free client/reconnect/revocation conformance |
| effective capabilities | persisted authority/freshness/entitlement evidence; MCP execution gate accepted | live connector lifecycle and release reconciliation |
| streaming Web | first-token/activity projection plus durable workspace accepted | measured terminal-parity latency and fixture-free channel proof |
| connectors | manifest/custody source accepted | live auth/health/revocation/outage/repair/deletion |
| database/target host/commercial/recovery/release | source foundations | all required acceptance gates |

## Active production map

- Roadmap: `second-half-plan/2026-07-19-ratified-standard-production-program/04-dependency-ordered-production-plan.md`.
- Immutable issue baseline: `08-production-issue-vector.json`.
- Current resolution state: `13-resolution-ledger.json`.
- WS-02 implementation record: `16-ws02-streaming-protocol-source-ci-closure.md`.
- Capability manifold: `15-ws02-capability-manifold/` — 105 pairs + 357 triples.

## Not accepted yet

- live remote MCP/connector authorization, health, revocation, outage, repair, deletion;
- external MCP Apps host and AG-UI client conformance;
- managed-Supabase/final-candidate proof;
- production secret rotation and target-host isolation/lifecycle;
- fixture-free Web/SMS/Review and provider-backed golden work;
- cumulative budgets, shared rates, provider ambiguity, invoice reconciliation;
- crash repair, rollback, signed release, accessibility, capacity, pilot, deployment.

## Next dependency order

1. Finish WS-02 live connector/protocol acceptance without reopening source authority.
2. Phase 1.3 database authority.
3. Phase 1.4 target-host/runtime custody.
4. Phase 1.5 fixture-free channels.
5. Later governed work, commercial, recovery, release, capacity, pilot, expansion.