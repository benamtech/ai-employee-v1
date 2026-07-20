# 09 — Current Bug, Risk, and Production-Gap Register

Status: **current architecture summary; scored execution authority lives in the active program**  
Current baseline: `main@5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`  
Final cutover evidence head: `d131dd09e216fc9dcf0444afd1eb1494194f52eb`  
Migration head: `0072`  
Updated: 2026-07-20

This architecture document summarizes the source-backed production gap shape. Exact issue scores, dependencies, affected boundaries, evidence coordinates, acceptance tests, prerequisites, stop conditions, and completion definitions are maintained in the sole active program:

- [`../../second-half-plan/2026-07-19-ratified-standard-production-program/08-production-issue-vector.json`](../../second-half-plan/2026-07-19-ratified-standard-production-program/08-production-issue-vector.json)
- [`../../second-half-plan/2026-07-19-ratified-standard-production-program/08-production-issue-vector.md`](../../second-half-plan/2026-07-19-ratified-standard-production-program/08-production-issue-vector.md)
- [`../../second-half-plan/2026-07-19-ratified-standard-production-program/09-workstream-execution-map.md`](../../second-half-plan/2026-07-19-ratified-standard-production-program/09-workstream-execution-map.md)
- [`../../second-half-plan/2026-07-19-ratified-standard-production-program/10-test-suite-disposition.md`](../../second-half-plan/2026-07-19-ratified-standard-production-program/10-test-suite-disposition.md)

The predecessor version of this file correctly identified many runtime, commercial, and UX trajectories but carried stale current-state metadata, including migration head `0069` and an older production-ledger coordinate. Those coordinates are superseded by current source and the active program. Historical implementation facts remain in Git history and indexed handoffs.

## Current verdict

**Not production-ready and not controlled-pilot ready.**

PR `#23` merged the ratified cutover into `main`. Final cutover head `d131dd09` passed the named Ratified Standard, Hermes upstream, and Main Integration workflows. That proves the declared source/document/curated-CI boundary only.

The broad `npm run test:unit` aggregate remains red on the final cutover head. PR `#23` records 30 files and 112 failed tests caused by pre-ratification assignment, principal, fake-RPC, and environment fixtures. This is explicit Phase 1.1 work; the curated green gate is not broader proof.

## Dependency-critical gap clusters

### WS-01 — Repository authority and test-contract truth

- post-merge authority documents still described PR `#23` as a draft cutover before this transaction;
- active evidence matrices cited ancestor Gate 0 head `4be092f` rather than final cutover head `d131dd09` and current `main` merge coordinate;
- broad unit aggregate is red while the main merge gate composes selected current suites;
- no prior single test-disposition map classified current, incomplete, stale/migrating, overlapping, blocked, or unusable evidence.

This is the first dependency because false repository/test truth corrupts every downstream completion claim.

### WS-02 — Connector, remote MCP, MCP Apps, AG-UI, and capability truth

- native connector identity/setup/custody contracts are source-wired;
- protected remote MCP metadata/authorization profile is not implemented and accepted;
- official MCP Apps negotiation, `ui://` resource retrieval, sandbox/CSP/permission contract, bounded JSON-RPC bridge, and assignment-scoped action intersection are incomplete;
- AG-UI lacks a complete versioned role-safe replay/reconnect adapter;
- effective capability truth is not persisted as one hash-bound intersection;
- live authorization, health, staleness, revocation, scope-change, outage, repair, and deletion proof remain open.

### WS-03 — Database authority and platform proof

- repository migration head is `0072`, but no final release-bound approved database proof through that ledger exists;
- complete existing-row, backfill, RLS/grant/security-definer, negative-isolation, concurrency, race, compare-and-swap, ambiguity, and rollback matrices remain incomplete;
- triggered disposable managed Supabase evidence remains open for security-sensitive and final-candidate behavior.

### WS-04 — Secret custody, target host, and runtime lifecycle

- source defines the canonical five-service topology and Host Provisioner boundary;
- managed secret custody, access, rotation, old-token denial, audit, and rollback are not accepted;
- target-host Caddy/Web/Manager/Model Gateway/Host Provisioner health is not accepted;
- two-employee network/data/workspace/memory/queue/credential/action isolation is not accepted;
- replace, suspend, restore, rotate, restart, and teardown proof is incomplete;
- the resolved immutable Hermes digest is not yet bound into a signed deployed release packet.

### WS-05 — Fixture-free identity, owner, connector, and channels

- no exact-candidate real owner has completed verification, canonical activation, explicit assignment selection, runtime readiness, strict snapshot, first turn, connector setup, and recovery;
- Web, SMS, and signed Review have not been accepted as projections of the same durable work/approval/proof state;
- connection, consent, ready, degraded, stale, revoked, scope-changed, repair, and deletion UX need one finite lifecycle grammar.

### WS-06 — Golden governed work, output parity, and proof refinding

- no funded/provider-backed current candidate has completed artifact → immutable revision → validation → exact approval → durable command/effect → provider receipt → post-effect verification → owner-refindable proof → replay;
- approved preview parity across HTML/PDF/email/signed-link/customer output is unproven;
- proof queries and exports by assignment, job/customer, action, provider, time, state, and failure class remain immature.

### WS-07 — Commercial controls and provider ambiguity

Current executable source confirms three high-centrality defects:

1. `apps/manager/src/lib/model-gateway.ts` stores rate buckets in a process-local `Map`, so restart resets limits and replicas multiply authority.
2. Gateway policy only rejects `spend_limit_cents <= 0`; it does not atomically reserve and settle cumulative spend before provider dispatch.
3. `apps/manager/src/lib/model-gateway-http.ts` retries provider transport/time-out exceptions without a generic upstream idempotency contract and records exhausted attempts as failed/provider-unavailable rather than durable ambiguous.

Payer, beneficiary, assignment, price snapshot, entitlement, usage, cost, invoice, credit/refund, suspension, and reactivation also lack final exact-candidate reconciliation acceptance.

### WS-08 — Crash repair, rollback, observability, and signed release

- every partial durable/external transition lacks accepted deterministic compensation or explicit manual-repair terminal proof;
- database/runtime/profile/Caddy/config/image/application rollback and backup/restore are not accepted on one candidate;
- no signed deployment manifest binds SHA, image digests, migration/config hashes, resolved Hermes digest, SBOM, standard provenance, proof IDs, failures/skips, and rollback result;
- production observability and incident runbooks do not yet prove complete principal-to-assignment-to-effect-to-receipt-to-repair-to-commercial lineage.

### WS-09 — Human surfaces, accessibility, capacity, and controlled pilot

- public/create/claim/login/account/billing/admin/artifact/connector/approval/proof/recovery surfaces are not fully aligned;
- WCAG 2.2 AA, screen reader, keyboard, focus, zoom/reflow, contrast, error announcement, and supported browser evidence are incomplete;
- durable progress, exact-run interruption, reconnect, restart, ambiguity, and recovery UX are incomplete;
- fleet admission, queue fairness, provider concurrency allocation, and noisy-neighbor controls are unproven;
- controlled-pilot eligibility, entitlements, support/incident ownership, rollback, customer exit, thresholds, and stop authority are not operationalized.

Shared/fractional employees, generic governed egress, and richer operator adapters remain P2 expansion boundaries and are not prerequisites for the initial bounded pilot unless pilot scope explicitly requires them.

## Closed source defects retained as context

Current source includes controls for previously identified defects:

- production Caddy host-network/loopback routing;
- Manager/Model Gateway membership in employee networks with teardown support;
- strict Manager MCP/business-brain/operating-surface reads;
- Web rejection of successful Manager responses missing `operating_state`;
- cleanup of tracked generated/orphaned repository artifacts.

These are source/CI controls, not target-host or live acceptance. Their live DNS/TLS/network/reload/isolation/recovery behavior remains part of WS-04 and later exact-candidate evidence.

## Non-bugs retained by design

- fixture mode remains useful for UI development but cannot satisfy live acceptance;
- the public estimator remains separated and non-canonical;
- Manager, not Hermes or generated UI, owns assignment/effect authority;
- owner reads do not create command/effect rows solely for observation;
- internal employee bridges intentionally deny arbitrary direct Internet access;
- process-local SSE events are liveness hints; strict snapshots and durable receipts remain truth;
- the pinned Hermes upstream review system is scheduled/path-triggered and does not auto-upgrade production.

## Completion route

Follow the active roadmap in dependency order:

```text
Phase 1.1 repository/test truth
→ 1.2 protocols/capabilities
→ 1.3 database
→ 1.4 secrets/runtime
→ 1.5 fixture-free owner/channels
→ 1.6 golden work
→ 1.7 commercial/ambiguity
→ 1.8 recovery/signed release
→ 1.9 human surface/capacity/pilot preparation
→ frozen exact candidate
→ controlled pilot
→ measured expansion
```

A row leaves the active issue vector only when source, tests, exact-head CI, and the required database/runtime/provider/browser/commercial/recovery/deployment evidence agree.
