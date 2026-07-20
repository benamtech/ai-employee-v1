# 09 — Current Bug, Risk, and Production-Gap Register

Status: **current architecture summary; scored execution authority lives in the active program**  
Current baseline: `main@816aae325401a8d8d4bc7ffe90e8f241eb977ba8`  
Implementation evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`  
Migration head: `0072`  
Updated: 2026-07-20

This document summarizes the source-backed production gap shape. Exact baseline scores, dependencies, evidence, acceptance tests, prerequisites, stop conditions, completion definitions, and current resolutions are maintained in the sole active program:

- [`../../second-half-plan/2026-07-19-ratified-standard-production-program/08-production-issue-vector.json`](../../second-half-plan/2026-07-19-ratified-standard-production-program/08-production-issue-vector.json)
- [`../../second-half-plan/2026-07-19-ratified-standard-production-program/13-resolution-ledger.json`](../../second-half-plan/2026-07-19-ratified-standard-production-program/13-resolution-ledger.json)
- [`../../second-half-plan/2026-07-19-ratified-standard-production-program/09-workstream-execution-map.md`](../../second-half-plan/2026-07-19-ratified-standard-production-program/09-workstream-execution-map.md)
- [`../../second-half-plan/2026-07-19-ratified-standard-production-program/10-test-suite-disposition.md`](../../second-half-plan/2026-07-19-ratified-standard-production-program/10-test-suite-disposition.md)

## Current verdict

**Not production-ready and not controlled-pilot ready.**

WS-01 is complete for repository/test source-and-CI scope. Implementation head `1460960` passed Ratified Standard, Hermes upstream, and Main Integration workflows, including 106 broad test files and 613 tests, production build, archaeology, and compiled Chromium fixtures.

The WS-02 provider-authority manufacture surface is source/CI locked. That does not establish remote MCP authorization, MCP Apps/AG-UI conformance, persisted effective-capability truth, live connector lifecycle, target-host, or provider acceptance.

## Dependency-critical gap clusters

### WS-01 — Repository authority and test-contract truth — source/CI resolved

Resolved controls:

- current authority documents route work from reviewed branches based on current `main`;
- Main Integration requires the broad aggregate as an independent job;
- `test:unit` builds shared/database workspace dependencies before Vitest;
- obsolete pre-assignment/account-owned/direct-provider suites were deleted atomically rather than skipped;
- reusable assertions were repaired to current capability, topology, and managed-connector contracts;
- 106 test files / 613 tests passed on implementation evidence head `1460960`;
- broad, curated, browser-fixture, database, provider, and live evidence remain distinct.

### WS-02 — Connector, remote MCP, MCP Apps, AG-UI, capability, and provider authority

Source/CI control now present:

- runtime callers use only the stable AMTECH model alias;
- Manager-owned registered profiles resolve provider identity, endpoint, master API key, and upstream model;
- caller-supplied provider/profile/model/endpoint/header/token/credential/routing fields fail before dispatch and are audited;
- signed gateway claims must match the current durable credential policy;
- legacy unbound production routes remain absent.

Still open:

- protected remote MCP metadata/authorization profile;
- official MCP Apps negotiation, `ui://` retrieval, sandbox/CSP/permission contract, bounded JSON-RPC bridge, and assignment-scoped action intersection;
- complete versioned role-safe AG-UI replay/reconnect adapter;
- one persisted hash-bound effective-capability intersection;
- live authorization, health, staleness, revocation, scope-change, outage, repair, and deletion proof.

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
3. `apps/manager/src/lib/model-gateway-http.ts` still retries provider transport/time-out exceptions without a generic upstream idempotency contract and records exhausted attempts as failed/provider-unavailable rather than durable ambiguous.

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
- cleanup of tracked generated/orphaned repository artifacts;
- trustworthy broad unit execution and required CI gating;
- Manager-only model provider routing and credential custody.

These are source/CI controls, not target-host or live acceptance.

## Non-bugs retained by design

- fixture mode remains useful for UI development but cannot satisfy live acceptance;
- the public estimator remains separated and non-canonical;
- Manager, not Hermes or generated UI, owns assignment/effect/provider authority;
- owner reads do not create command/effect rows solely for observation;
- internal employee bridges intentionally deny arbitrary direct Internet access;
- process-local SSE events are liveness hints; strict snapshots and durable receipts remain truth;
- the pinned Hermes upstream review system is scheduled/path-triggered and does not auto-upgrade production.

## Completion route

Follow the active roadmap in dependency order:

```text
remaining Phase 1.2 protocols/capabilities/connectors
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

A baseline issue is marked resolved only in the resolution ledger when source, tests, exact-head CI, and the evidence class actually required for that issue agree.
