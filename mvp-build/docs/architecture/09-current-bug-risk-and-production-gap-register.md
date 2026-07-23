# 09 — Current Bug, Risk, and Production-Gap Register

Status: current architecture summary; scored issue state lives in the active program  
Exact candidate and migration status: [`../../CODEGRAPH.md`](../../CODEGRAPH.md)  
Updated: 2026-07-20

This is a readable risk summary, not a competing issue ledger. Exact issue rows, resolutions, prerequisites, and gates live in `../../production-readiness-program/`.

## Verdict

**Not production-ready and not controlled-pilot ready.**

Source exists for a substantial WS-06/07 transaction and bounded WS-08 groundwork. Exact-head CI and every stronger external evidence class remain independent gates.

## Decision-trace risk

Trace007 retains a complete candidate matrix, but its original mathematical interpretation was overstated.

Corrected state:

- candidate graph vertices are candidate trajectories and support search diversity, lineage, redundancy, and candidate-edge touch;
- software invariant hypergraph vertices are actual system entities/obligations and support software touch, fractional, complete, and proved coverage;
- mandatory workstream/space coverage is a feasible-domain constraint, not an objective bonus;
- full, no-graph, no-diversity, evidence baseline, and random controls use the same feasible domain;
- search and weight sensitivity are reported;
- graph terms are descriptive;
- diversity is descriptive or selection-influencing;
- causal improvement is unestablished without independent implementation outcomes.

The implementation remains defensible from source evidence and invariants even if the mathematical machinery is removed.

## Dependency-critical risks

### Repository and document authority

Current cleanup target:

- one repository contract;
- one product contract;
- short root/scoped compatibility routers;
- one exact-status owner: `mvp-build/CODEGRAPH.md`;
- structural governance based on schemas, references, evidence classes, and reproducibility;
- no pinned PR numbers, migration values, issue counts, candidate IDs, objective values, causal labels, or prose fragments in governance tests.

Open: exact-head governance, stale-reference scan, and broad verification.

### Generated production source mutation

Production Manager assembly still mutates a template through string replacement and a second patch script. This creates three risks:

1. template hashes and string positions become accidental semantic authority;
2. structural tests carry behavior that should live in typed composition and behavioral contracts;
3. every new route increases transform fragility and review opacity.

Required direction: typed server composition with generated data/config only. This risk is recorded, not fixed by the documentation transaction.

### WS-02 — Protocol and capability authority

Live Remote MCP/OAuth, connector authorization, provider-backed health/revocation/outage/repair/deletion, external MCP Apps host, AG-UI client conformance, and release-candidate evidence remain open.

### WS-03 — Database authority

Source contains forward commercial/effect/reconciliation migrations. Still required:

- blank-ledger execution through the source head;
- RLS/grant/function/concurrency/negative-isolation proof;
- existing-row/backfill compatibility;
- required disposable managed-platform application, security, trigger, and advisor proof.

### WS-04 — Secret custody and target host

Managed secret custody/rotation, five-service target-host health, two-employee isolation, immutable Hermes image binding, lifecycle replacement, rollback, and signed release remain open.

### WS-05 — Fixture-free owner and channels

Real owner activation, exact assignment, first turn, connector setup, failure matrix, reconnect, and Web/SMS/signed-Review convergence remain unaccepted.

### WS-06 — Golden governed work

Source models:

```text
artifact → immutable revision → validation → exact approval
→ one durable effect → output/publication
→ accepted receipt/accounting when applicable
→ repairable owner proof
```

Open:

- provider-backed Website, Contractor Office, and Bookkeeping journeys;
- output parity across owner surfaces;
- crash/restart proof refinding;
- fixture-free replay and owner presentation.

### WS-07 — Commercial controls and provider ambiguity

Source models shared rate authority, pre-dispatch budget reservation, one request/effect/provider identity, durable ambiguity, effect-bound accounting, immutable adjustments, conservation, and original-effect reconciliation.

Open:

- exact-head unit/PostgreSQL verification;
- real provider request ID, idempotency, timeout, and accepted-response-loss behavior;
- managed database proof;
- payer/beneficiary/usage/cost/invoice/refund/suspension/reactivation lifecycle.

### WS-08 — Recovery, observability, and release

Source groundwork includes proof repair, ambiguity reconciliation, queues, lineage, and fault seams.

Open:

- target-host fault injection;
- reservation expiry/reclamation policy;
- typed server composition;
- backup/restore and rollback;
- telemetry, alerts, and incident runbooks;
- SBOM/provenance and independently verifiable signed deployment manifest.

### WS-09 — Human surface, capacity, and pilot

Supported-browser/channel behavior, WCAG 2.2 AA, screen readers, interruption/recovery UX, fairness/noisy-neighbor controls, capacity envelope, pilot entry/exit criteria, and incident authority remain open.

## Non-bugs retained by design

- computation is mandatory but proportional;
- simple evidence-and-invariants analysis is the baseline;
- fixture mode is development evidence, not live acceptance;
- the public estimator is non-canonical;
- Manager owns authority; Hermes, browser, models, protocols, and generated UI do not;
- owner reads do not create effects solely for observation;
- stream events are liveness projection; durable state and receipts are truth;
- Hermes upstream review does not auto-upgrade production;
- non-causal mathematics is labeled descriptive rather than retained for prestige.

## Completion route

```text
structural governance + corrected trace + exact-head broad gates
→ managed database proof
→ provider-backed commercial ambiguity/accounting reconciliation
→ target-host/runtime custody
→ fixture-free owner/channels
→ provider-backed golden work and restart proof refinding
→ typed server composition + recovery/rollback/observability/signed release
→ accessibility/capacity/pilot preparation
→ frozen candidate → controlled pilot → measured expansion
```

An issue closes only when source, behavioral tests, exact-head CI, and the evidence class required by the claim agree. Decision computation can reject a bad path; it cannot close an external gate.
