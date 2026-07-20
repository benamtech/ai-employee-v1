# CODEGRAPH.md — AMTECH AI Employee build map

Status: active  
Updated: 2026-07-20  
Merged baseline: `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
WS-01 evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`  
Hardened WS-02 implementation evidence head: `16dc18e0535ac14f867875989dfe5aee596f89c0`  
Migration head: `0072`  
Standard: v0.2 ratified

## Product boundary

- Hermes owns employee reasoning, runs, sessions, runtime-local memory/tool use, and runtime recovery.
- Manager owns identity, assignments, authority, capability/tool contracts, connector/OAuth custody, approvals, durable effects, commercial attribution, revocation, repair, and proof.
- Web is an employee operating environment: durable workspace plus token-level streaming, activity, apps, approvals, artifacts, proof, and recovery.
- MCP Apps and AG-UI are role-safe projections, not authority.
- PostgreSQL/Supabase is durable authority/evidence/reconciliation state.

## Current status

**`standard_v0_2__migration_0072__ws01_green__ws02_hardened_source_ci_green__iss011_live_open__ws03_prepared_not_started__not_launch_cleared`**

Implementation head `16dc18e` passed:

- Ratified Standard/governance `29735429854`;
- Hermes Upstream Review `29735429873`, pin unchanged;
- Main Integration `29735429859`: broad **110 files / 635 tests**, source/type/lint/contracts, build, archaeology, compiled Chromium.

## WS-02 executable topology

```text
Hermes /v1/runs/{id}/events
→ streaming-first Manager adapter
→ assistant_delta | work_progress | run_completed
→ account + employee + assignment + authority-version scoped Manager SSE
→ native Web live console and durable workspace
→ optional AG-UI RUN/TEXT/STATE/ACTIVITY projection

MCP protected resource
→ Manager metadata discovery
→ exact issuer/resource/redirect/scopes + PKCE/state
→ token exchange
→ current Manager encrypted-envelope custody

Hermes tools/list
→ broad discovery
Hermes tools/call
→ current MCP credential
→ final current assignment relationship/policy/authority-version read
→ entitlement + connector binding/provider-verification freshness
→ persisted effective-capability decision
→ Manager tool
→ approval/effect/reservation/receipt

WorkResource
→ native renderer or content-bound ui:// MCP App
→ opaque origin + document CSP + finite host methods
→ finite amtech.surface.intent with projected assignment/version/resource/action
→ first-party protocol-action route
→ current Manager assignment/version check
→ existing approval/message/effect boundary
```

## Source hubs

| Boundary | Current source/CI state | Still open |
|---|---|---|
| repository/test truth | accepted | preserve exact-head discipline |
| model/provider authority | locked | live provider/host proof |
| streaming Web | assignment-scoped low-latency projection accepted | measured fixture-free latency/parity |
| Remote MCP authorization | metadata/audience/PKCE/state/custody contracts accepted | live AS/token/revocation proof |
| MCP Apps | negotiated resource, CSP/hash/host mediation accepted | external compliant host/provider proof |
| AG-UI | ordered assignment/version mapping and finite return path accepted | fixture-free client/reconnect/revocation proof |
| effective capabilities | final current policy/version and provider-verification gate accepted | live connector lifecycle/reconciliation |
| connectors | manifest/custody source accepted | `ISS-011` live auth/health/revocation/outage/repair/deletion |
| database | WS-03 frontier/task contract prepared | ledger, RLS/grants, concurrency, rollback, managed-platform proof |
| target host/commercial/recovery/release | source foundations | all required acceptance gates |

## Active production map

- Roadmap: `second-half-plan/2026-07-19-ratified-standard-production-program/04-dependency-ordered-production-plan.md`.
- Immutable issue baseline: `08-production-issue-vector.json`.
- Current resolution state: `13-resolution-ledger.json`.
- WS-02 implementation record: `16-ws02-streaming-protocol-source-ci-closure.md`.
- Capability manifold: `15-ws02-capability-manifold/` — 105 pairs + 357 triples.
- WS-03 frontier: `17-ws03-p0-fisher-frontier.md`.
- WS-03 task contract: `18-ws03-p0-task-contract.json`.

## Not accepted yet

- live remote MCP/connector authorization, health, revocation, outage, repair, deletion;
- external MCP Apps host and AG-UI client conformance;
- migration/RLS/concurrency/managed-Supabase release proof;
- production secret rotation and target-host isolation/lifecycle;
- fixture-free Web/SMS/Review and provider-backed golden work;
- cumulative budgets, shared rates, provider ambiguity, invoice reconciliation;
- crash repair, rollback, signed release, accessibility, capacity, pilot, deployment.

## Next dependency order

1. Merge or formally supersede PR `#31` after its final exact documentation head is green.
2. Complete `ISS-011` live connector/protocol lifecycle acceptance.
3. Start WS-03 from then-current `main`: ledger/hash → capability constraints → RLS/grants → version races → effect concurrency → backfill/rollback → managed-platform proof.
4. Continue target-host/runtime custody and fixture-free channels.
