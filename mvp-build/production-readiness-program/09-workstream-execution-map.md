# Dependency-Ordered Workstream Map

Status: **active execution decomposition**  
Exact product status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Issues: [`08-production-issue-vector.json`](08-production-issue-vector.json)  
Resolution state: [`13-resolution-ledger.json`](13-resolution-ledger.json)  
Roadmap: [`04-dependency-ordered-production-plan.md`](04-dependency-ordered-production-plan.md)

Nine workstreams own distinct completion contracts. Order is dependency order, not preference. A downstream workstream stops when a prerequisite gate is red, stale, skipped without an allowed reason, or bound to another candidate.

## Decision contract

Before opening or materially changing a workstream:

1. extract current authority and evidence;
2. mark `Observed`, `Inferred`, `Hypothesis`, `Unknown`, and `NotApplicable`;
3. select the proportional tier;
4. generate independent candidate batches before recombination;
5. reject invariant or prerequisite violations;
6. establish the simple evidence-and-invariants baseline;
7. separate candidate topology from software-invariant topology;
8. compare equal-feasibility controls and report search/weight sensitivity;
9. select exploration and implementation separately;
10. map every selected software edge to behavioral proof;
11. implement, verify exact head, and update active records.

Cross-workstream work is normally `T3`. Graphs and scores do not promote evidence. Ranking changes are selection influence, not causal improvement.

## Workstream matrix

| WS | Owns | Minimum tier | External prerequisites | Complete only when |
|---|---|---:|---|---|
| WS-01 repository/test/document truth | authority routing, structural governance, historical separation, broad/curated test truth | T2 | exact-head CI | one exact-status owner; no false-current entrypoint; structural governance and broad gates pass without weakened assertions |
| WS-02 connector/protocol/capability | OAuth/MCP authority, custody, effective capability, apps, AG-UI, live connector lifecycle | T2/T3 | OAuth/MCP servers, connector sandboxes, browser host | unknown/stale evidence fails closed and required live attack/revocation/outage/repair evidence passes |
| WS-03 database authority | forward ledger, RLS/grants/functions, isolation, concurrency, managed-platform proof | T2/T3 | PostgreSQL CI, disposable managed platform, staging backup/advisors | blank/existing-row/security/concurrency/rollback matrices pass; applied migrations remain immutable |
| WS-04 target host/runtime custody | secrets, topology, Docker authority, employee isolation, lifecycle, exact image | T3 | Linux host, secret store, DNS/TLS, registry | least privilege, two-employee isolation, lifecycle repair, and exact-image proof pass |
| WS-05 fixture-free owner/channels | owner verification, assignment, session, snapshot/reconnect, connectors, Web/SMS/Review convergence | T3 | Auth, target host, connector/channel sandboxes | one real owner supervises one real assignment; failures stay distinct; channels converge without fixtures |
| WS-06 golden work/proof | immutable revision, approval, one effect, receipts, output, proof repair/refinding | T3 | provider/adapters and fixture-free owner journey | Website, Contractor Office, and Bookkeeping complete real work with parity, replay safety, and refindable proof |
| WS-07 commercial/provider ambiguity | shared rate/budget, provider identity, settlement, adjustments, accounting, billing lifecycle | T3 | provider idempotency/request IDs, billing sandbox, managed DB | replicas cannot overspend; ambiguity never blind-retries; commercial state settles exactly once |
| WS-08 recovery/release | fault injection, repair, rollback, backup/restore, telemetry, typed composition, signing/provenance | T3 | target host, backup, telemetry, signing infrastructure | faults cannot create false success/duplicate effect; rollback preserves work; signed evidence verifies independently |
| WS-09 human/capacity/pilot | cross-surface UX, browsers, accessibility, capacity/fairness, pilot controls | T3 | browsers/devices, screen readers, load environment, pilot cohort | WCAG/browser/capacity gates and pilot entry/exit/incident/rollback packet pass |

## Stop conditions

### WS-01

- exact status is duplicated outside `mvp-build/CODEGRAPH.md`;
- historical material appears current;
- governance pins transient PRs, migration numbers, issue counts, selected IDs, objective values, or prose fragments;
- tests are weakened for green.

### WS-02

- browser/model selects provider, tool, scope, host, issuer, audience, credential, or continuation;
- unknown or stale evidence becomes effective;
- MCP Apps or AG-UI becomes authority or executes effects directly.

### WS-03

- an applied migration is edited;
- local PostgreSQL is promoted to managed-platform acceptance;
- service/browser roles bypass reviewed authority RPCs;
- negative isolation, concurrency, or migration compatibility fails.

### WS-04

- Manager/Web gains Docker authority;
- one employee reaches another or arbitrary network;
- old credentials remain valid after rotation;
- partial lifecycle state renders healthy;
- image digest floats.

### WS-05

- infrastructure failure renders as empty or successful state;
- account membership substitutes for assignment authority;
- browser-readable bearer or token-bearing SSE appears;
- channels diverge from durable state.

### WS-06

- preview materially differs from delivered output;
- approval is stale, self-created, or not revision-bound;
- success lacks required effect/accounting/proof evidence;
- replay duplicates an effect;
- proof cannot be refound after restart.

### WS-07

- spend is checked only after dispatch;
- rate authority is process-local;
- ambiguity becomes ordinary failure or blind retry;
- reconciliation creates a second effect identity;
- payer, beneficiary, provider, effect, and accounting disagree;
- caller/browser selects commercial state.

### WS-08

- repair deletes or rewrites accepted evidence;
- crash produces false success or duplicate effect;
- rollback loses accepted work;
- production server behavior depends on untyped string mutation without bounded compatibility proof;
- provenance is self-asserted rather than independently verifiable.

### WS-09

- fixture browser substitutes for supported-browser acceptance;
- accessibility is inferred from lint alone;
- load tests omit fairness/noisy-neighbor behavior;
- pilot starts without stop authority, rollback, incident ownership, or customer exit.

## Current decision transaction

The current transaction and exact implementation IDs live in `../decision/trace007/selected_implementation.json`. It is one database-authoritative admission → effect → receipt → accounting → proof → repair transaction.

Candidate search terms are descriptive. Software invariant coverage comes only from `software_invariant_hypergraph.json`. Causal improvement remains unestablished until independent implementation outcomes exist.

## Completion rule

```text
valid decision record
AND source/migration behavior exists
AND complete software-edge proof plan exists
AND selected behavioral tests pass
AND exact-head CI passes
AND required external evidence passes
AND active documentation/handoff agrees
```

A lower evidence class cannot satisfy a higher one. Blocks, skips, and unavailable environments remain visible.
