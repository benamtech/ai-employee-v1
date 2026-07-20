# Dependency-Ordered Production Plan

Status: active execution order  
Scope: P0/P1 closures only until release hard gates pass

## P0-0 — Ratification and authority convergence

Deliverables:

- ratified Standard v0.2;
- machine evolution vector and research disposition;
- connector setup manifest implementation;
- one active plan family;
- root/scoped/wiki/memory/PR routing;
- exact-head workflow matrix.

Exit predicate:

```text
Standard effective
AND vector grounded
AND no unapproved destructive motion
AND current docs route to one active plan
AND every required workflow succeeds on the final authority head
```

## P0-1 — Connector and protocol conformance

Deliverables:

- descriptor-only native setup;
- remote MCP authorization profile;
- MCP Apps compatibility adapter;
- effective-capability health/revocation reconciliation;
- owner-safe generic setup/status UI.

Hard gate: browser, model, or unknown server cannot choose authority, scope, tool, host, token audience, or provider continuation.

## P0-2 — Database TDD closure

Deliverables:

- full blank-ledger migration test through `0072`;
- existing-row/backfill compatibility matrices;
- RLS/grant/security-definer negative tests;
- artifact/approval/capability scope tests;
- concurrency tests for durable claims and compare-and-swap updates;
- deterministic migration/proof hashes.

Disposable Supabase is required only for the risk-triggered release conditions in `05-database-tdd-and-release-proof.md`.

## P0-3 — Target-host runtime and network proof

Deliverables:

- canonical five-service health;
- Manager without Docker socket;
- signed Unix-socket Host Provisioner custody;
- host-network Caddy and loopback routing;
- two-employee runtime/network/data/action isolation;
- exact Hermes image digest and filesystem persistence;
- replacement, suspension, restore, and teardown without neighbor disruption.

## P0-4 — Fixture-free owner and connector journey

Deliverables:

- real owner authentication and account selection;
- explicit assignment-only dashboard;
- strict operating snapshot and SSE reconnect/rotation;
- real managed connector authorization;
- connector health, revocation, and capability effectiveness;
- 200/401/403/409/410/429/500/503 owner-state matrix;
- proof that browser setup/guidance does not execute provider tools directly.

## P0-5 — Golden work-object journey

Order:

1. Website Employee A manual journey;
2. Website A automated journey and replay;
3. Contractor Office Employee B;
4. Bookkeeping Employee C.

Every journey requires:

```text
artifact
→ immutable revision
→ validation
→ exact approval snapshot
→ durable command/effect
→ provider/publication receipt
→ post-effect verification
→ owner refinding
→ idempotent replay
```

## P1-1 — Commercial and provider ambiguity

Deliverables:

- atomic cumulative budget reservation/settlement/release;
- shared fleet rate authority;
- provider accepted-response-loss injection;
- durable ambiguous state;
- reconciliation before retry;
- exactly one provider and accounting settlement.

## P1-2 — Crash, repair, rollback, and release evidence

Deliverables:

- crash injection at each durable and external boundary;
- deterministic repair or explicit manual-repair terminal state;
- five-service/database/runtime/profile rollback compatibility;
- SBOM, SLSA/in-toto provenance, exact image/migration hashes;
- signed deployment manifest and verifier evidence.

## P1-3 — Human surface acceptance

Deliverables:

- Chromium, Firefox, WebKit/mobile-Safari representative execution;
- keyboard, focus, screen-reader, zoom, reflow, reduced-motion, and contrast checks;
- deterministic visual baselines;
- long-content, reconnect, degraded, ambiguous, and approval-result states;
- Web/SMS/signed Review parity for the same work object.

## P1/P2 — Capacity and controlled pilot

Measured sequence:

```text
1 employee canary
→ 10 employee operating pod
→ 100
→ 250
→ 500
→ 700
```

Measure queue latency, database pools, SSE fan-out, provider concurrency, Model Gateway fairness, worker leases, reconciler convergence, recovery time, cost, and noisy-neighbor isolation.

A Start Free or $400 managed pilot may begin only when the declared pilot boundary has passed all non-waivable Standard gates. Pilot scope and unresolved limits must be explicit.

## Global acceptance rule

Downstream work does not inherit upstream proof from another SHA. When branch movement changes relevant files, rerun the applicable gates and bind evidence to the final candidate.
