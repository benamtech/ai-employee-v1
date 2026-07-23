# Dependency-Ordered Workstream Map

Status: **active execution decomposition**  
Updated: 2026-07-23  
Exact product status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision state: [`../decision/active.json`](../decision/active.json)  
Representation/proof contract: [`../decision/representation-contract.md`](../decision/representation-contract.md)  
Issues: [`08-production-issue-vector.json`](08-production-issue-vector.json)  
Resolution state: [`13-resolution-ledger.json`](13-resolution-ledger.json)  
Roadmap: [`04-dependency-ordered-production-plan.md`](04-dependency-ordered-production-plan.md)

Nine workstreams own distinct completion contracts. Order is dependency order, not preference. A downstream workstream stops when a prerequisite gate is red, stale, skipped without an allowed reason, or bound to another candidate.

## Current execution state

- No new decision transaction is open.
- Trace012 is the latest completed trace and records the UI Lab/folder-first UI-variant decision.
- Trace013 is reserved for a fresh post-merge branch; no prior candidate selection is active.
- The active transaction is repository-stack convergence: PR #40 → PR #35 branch → PR #34 branch → `main`, with exact-head verification after each merge.
- After `main`, a new branch may open Trace013 and recompute the production frontier from the merged coordinate using machine-native representations and formal certificates where useful.

## Decision contract

Before opening or materially changing a workstream:

1. extract current authority and evidence;
2. construct the useful machine-native representations and record provenance/dimensions;
3. mark `Observed`, `Inferred`, `Hypothesis`, `Unknown`, and `NotApplicable`;
4. select the proportional tier;
5. generate independent candidate batches before recombination;
6. reject invariant or prerequisite violations;
7. establish the simple evidence-and-invariants baseline;
8. separate candidate topology from software-invariant topology;
9. compute formal/model certificates when useful;
10. compare equal-feasibility controls and report search/weight/operator sensitivity;
11. select exploration and implementation separately;
12. map every selected software hyperedge to its declared P1/P2/P3/P4 proof contract or blocker;
13. implement, verify exact head, and update active records.

Cross-workstream work is normally `T3`. Scores and unverified representation metrics do not promote evidence. Verified eigenstructure, solver results, model-checker traces, or theorem certificates may be decisive P1 proof for their declared formal property. P2 correspondence determines whether that proof satisfies a software gate; ranking changes alone remain selection influence rather than causal improvement.

## Workstream matrix

| WS | Current cumulative source state | External prerequisites | Complete only when |
|---|---|---|---|
| WS-01 repository/test/document truth | authority routers, machine-native representation contract, structural governance, historical separation, broad/curated tests, exact-status owner, cumulative stack plan | exact-head CI on each merge coordinate | one exact-status owner; no false-current entrypoint; formal/executable evidence boundaries are explicit; cumulative PR to `main` passes without weakened assertions |
| WS-02 connector/protocol/capability | OAuth/MCP authority contracts, custody, effective capability, MCP Apps, AG-UI, lifecycle discovery/revoke/reconnect | OAuth/MCP servers, connector sandboxes, browser host | unknown/stale evidence fails closed and live authorization/revocation/outage/repair evidence passes or an accepted correspondence-backed proof discharges the exact gate |
| WS-03 database authority | forward ledger through `0082`, local RLS/grants/functions/isolation/concurrency contracts | disposable managed platform, staging backup/advisors | blank/existing-row/security/concurrency/backup/rollback matrices pass; applied migrations remain immutable |
| WS-04 target host/runtime custody | secret and exact-image contracts, Host Provisioner Docker authority, lifecycle/isolation scripts | Linux host, secret store, DNS/TLS, registry | least privilege, two-employee isolation, lifecycle repair, destructive recovery, and exact-image proof pass |
| WS-05 fixture-free owner/channels | exact snapshots/streams/reconnect, Talk-first streaming, connector/review projections, UI variants | Auth, target host, connector/channel sandboxes | one real owner supervises one real assignment; failures stay distinct; channels converge without fixtures |
| WS-06 golden work/proof | immutable revision/approval/effect/receipt/output/proof/repair contracts | provider adapters and fixture-free owner journey | Website, Contractor Office, and Bookkeeping complete real work with parity, replay safety, and refindable proof |
| WS-07 commercial/provider ambiguity | shared rate/budget, provider identity, settlement, adjustments, accounting, reconciliation | provider idempotency/request IDs, billing sandbox, managed DB | replicas cannot overspend; ambiguity never blind-retries; commercial state settles exactly once |
| WS-08 recovery/release | fault states, repair, rollback, backup/restore, telemetry, five images, signed manifest and independent verifier | target host, backup, telemetry, trusted signing/registry | faults cannot create false success/duplicate effect; rollback preserves work; signed evidence verifies independently on target infrastructure |
| WS-09 human/capacity/pilot | coherent UI grammar, production UI Lab, folder-first variants, browser automation, capacity/fairness/pilot-stop schema | browsers/devices, screen readers, 64 GiB load environment, pilot cohort | WCAG/browser/capacity gates and pilot entry/exit/incident/rollback/customer-exit packet pass |

## Stop conditions

### WS-01

- exact status is duplicated outside `mvp-build/CODEGRAPH.md` as a moving acceptance claim;
- historical material or a completed trace appears as an open transaction;
- Trace013 is created or preselected before the new branch and fresh computation;
- machine-native artifacts omit generators, dimensions, provenance, assumptions, tolerances, validation, proof class, or compact language bridge;
- tests are weakened for green;
- a known-red lower-stack coordinate is merged independently before its green cumulative repair.

### WS-02

- browser/model selects provider, tool, scope, host, issuer, audience, credential, or continuation;
- unknown or stale evidence becomes effective;
- MCP Apps or AG-UI becomes authority or executes effects directly.

### WS-03

- an applied migration is edited;
- local PostgreSQL is promoted to managed-platform acceptance without a gate correspondence contract;
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
- channels diverge from durable state;
- fixture UI or a green UI-variant doctor is promoted to live owner acceptance.

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
- production server behavior depends on untyped string mutation;
- provenance is self-asserted rather than independently verifiable;
- source/CI signing is promoted to trusted production signing.

### WS-09

- fixture browser substitutes for supported-browser acceptance;
- accessibility is inferred from lint, ARIA snapshots, or automated checks alone;
- load tests omit fairness/noisy-neighbor behavior;
- pilot starts without stop authority, rollback, incident ownership, or customer exit.

## Completed decision chain

- Trace007: database-authoritative admission → effect → receipt → accounting → proof → repair.
- Trace008: release/recovery/rollback/capacity implementation compression.
- Trace009: UI projection architecture and calibration.
- Trace010: connector operating substrate.
- Trace011: employee UI port and presentation adapters.
- Trace012: production UI Lab and folder-first full employee UI variants.

Candidate search calculations are P0 unless accompanied by a stronger certificate. Hypergraph/spectral results may be P1 proof for a declared formal property. Software `proved` coverage requires the proof contract assigned to each edge: formal-model edges may close at P1, while executable-software edges require the declared P2/P3 correspondence and evidence.

## Completion rule

```text
valid decision record when a decision is required
AND required machine-native artifacts and formal certificates are valid
AND source/migration behavior exists or the gate's accepted correspondence proves the property
AND complete software-edge proof plan exists or the blocker is explicit
AND selected behavioral tests pass when required by the proof contract
AND exact-head CI passes
AND required external evidence passes
AND active documentation/handoff agrees
```

A lower proof/evidence class cannot silently satisfy a higher one. A valid correspondence may explicitly connect classes. Blocks, skips, unavailable environments, and historical coordinates remain visible.
