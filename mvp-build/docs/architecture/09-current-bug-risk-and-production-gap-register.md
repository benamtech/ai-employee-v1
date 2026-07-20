# 09 — Current Bug, Risk, and Production-Gap Register

Status: **current architecture summary; scored execution authority lives in the active program**  
Merged baseline: current `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
WS-01 evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`  
Hardened WS-02 implementation evidence head: `16dc18e0535ac14f867875989dfe5aee596f89c0`  
Migration head: `0072`  
Updated: 2026-07-20

Exact scores, dependencies, acceptance tests, prerequisites, stop conditions, and current resolutions live in the single active program: issue vector, resolution ledger, workstream map, test disposition, and verification matrix.

## Current verdict

**Not production-ready and not controlled-pilot ready.**

WS-01 is complete for repository/test source-and-CI scope. Hardened WS-02 source controls passed Standard `29735429854`, Hermes Review `29735429873`, and Main Integration `29735429859`, including broad **110 files / 635 tests**, source/type/lint/contracts, build, archaeology, and compiled Chromium.

`ISS-007`–`ISS-010` are source/CI resolved. `ISS-011` live connector/provider lifecycle and external protocol-host evidence remains open, so Phase 1.2 is not release-complete.

## Dependency-critical gap clusters

### WS-01 — Repository/test truth — source/CI resolved

- one active program and exact-head evidence discipline;
- independent broad merge gate;
- **106 files / 613 tests** on the WS-01 evidence head;
- no exclusions/quarantine;
- current broad/curated/browser/database/provider/live evidence classes remain distinct.

### WS-02 — Protocol and capability authority — hardened source/CI; live gate open

Resolved source controls:

- caller/model/runtime cannot select model provider identity, endpoint, upstream model, headers, tokens, or credentials;
- owner-visible live progress is account/employee/assignment scoped;
- a started Hermes stream falls back to polling the same run;
- Remote MCP authorization derives protected-resource metadata, issuer, resource audience, redirect, scopes, S256 PKCE, and state under Manager custody;
- MCP Apps use content-bound resources, opaque origin, document CSP, bounded host methods, and first-party protocol-action mediation;
- AG-UI is ordered assignment/version projection with finite command return path and stable public failure codes;
- MCP execution re-reads current assignment relationship/policy and authority version immediately before dispatch;
- connector-backed execution requires current binding and fresh provider-verification evidence.

Still open (`ISS-011`):

- live remote MCP/OAuth and shipped-connector authorization;
- provider-backed health, stale/scope-change, revocation, outage, repair, deletion;
- external MCP Apps host and AG-UI client conformance;
- exact provider receipts and release-candidate evidence.

### WS-03 — Database authority and platform proof — prepared, not started

Prepared nodes:

1. blank migration ledger and hashes;
2. effective-capability evidence constraints/current selection;
3. RLS, grants, security-definer, and negative-isolation matrix;
4. authority-version revocation races;
5. command/effect reservation concurrency and ambiguity;
6. existing-row/backfill/rollback compatibility;
7. disposable managed-Supabase trigger/advisor proof.

Applied migrations `0001`–`0072` remain immutable. No approved release-bound database proof exists yet.

### WS-04 — Secret custody, target host, and runtime lifecycle

- current remote MCP secret storage is a Manager encrypted-envelope backend, not managed KMS/secret-manager acceptance;
- production access/rotation/old-token denial/audit/rollback remain open;
- target-host five-service health and two-employee isolation/lifecycle remain open;
- immutable Hermes digest is not yet bound into a signed deployed release packet.

### WS-05 — Fixture-free identity, owner, connector, and channels

Real owner activation, assignment, first turn, connector setup, failure matrix, and Web/SMS/signed-Review parity remain unaccepted.

### WS-06 — Golden governed work, output parity, and proof refinding

No current provider-backed candidate has completed artifact → revision → validation → approval → effect → receipt → verification → refindable proof → replay for all three employee roles.

### WS-07 — Commercial controls and provider ambiguity

P0 source gaps remain:

1. cumulative Model Gateway spend is not atomically reserved/settled;
2. rate authority remains process-local;
3. provider accepted-response-loss is not generically recorded/reconciled as durable ambiguous;
4. payer/beneficiary/usage/cost/invoice/refund/suspension reconciliation is not accepted.

### WS-08 — Crash repair, rollback, observability, and signed release

Fault compensation, backup/restore, rollback, end-to-end lineage, SBOM/provenance, and independently verifiable signed deployment manifest remain open.

### WS-09 — Human surface, accessibility, capacity, and pilot

Fixture Chromium is green, but fixture-free browser/channel behavior, WCAG 2.2 AA, screen readers, durable interruption/recovery UX, fairness/noisy-neighbor controls, and pilot entry/exit/incident authority remain open.

## Non-bugs retained by design

- fixture mode is development evidence, not live acceptance;
- public estimator is non-canonical;
- Manager owns authority; Hermes and generated UI do not;
- owner reads do not create effects solely for observation;
- internal bridges deny arbitrary direct Internet access;
- live stream events are liveness projection; durable snapshots/receipts are truth;
- Hermes upstream review does not auto-upgrade production.

## Completion route

```text
ISS-011 live connector/protocol lifecycle
→ WS-03 database authority
→ WS-04 target-host/runtime custody
→ WS-05 fixture-free owner/channels
→ WS-06 golden work
→ WS-07 commercial/ambiguity
→ WS-08 recovery/signed release
→ WS-09 human surface/capacity/pilot preparation
→ frozen candidate → controlled pilot → measured expansion
```

An issue is resolved only when source, tests, exact-head CI, and the evidence class actually required for that issue agree.
