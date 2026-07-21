# Dependency-Ordered Workstream Map

Status: **active execution decomposition**  
Issue source: [`08-production-issue-vector.json`](08-production-issue-vector.json)  
Resolution source: [`13-resolution-ledger.json`](13-resolution-ledger.json)  
Roadmap: [`04-dependency-ordered-production-plan.md`](04-dependency-ordered-production-plan.md)  
Decision protocol: [`../decision/README.md`](../decision/README.md)  
Source migration head: `0076`

The credible production issues are deduplicated into nine workstreams. Order is dependency order, not team preference. A downstream workstream stops when a prerequisite gate is red, stale, skipped without an allowed reason, or bound to another candidate SHA.

## Decision contract for every workstream

Before opening or materially changing a workstream:

1. extract current source, migration, test, workflow, proof, PR, memory, and Standard authority;
2. mark Observed, Inferred, Hypothesis, Unknown, and Not applicable coordinates;
3. select the applicable computation tier;
4. generate independent current/feature/counterfactual batches before recombination;
5. reject invariant-violating or prerequisite-bypassing candidates;
6. compare the frontier computationally;
7. select exploration and implementation separately;
8. write the smallest behavioral failure manifold;
9. implement and verify exact head;
10. update all active maps and the handoff.

Cross-workstream work is normally `T3`. No trajectory, graph, or score promotes source or evidence state.

## Workstream matrix

| WS | Issues | Minimum decision tier | Current source state | External prerequisites | Complete only when |
|---|---|---:|---|---|---|
| WS-01 repository/test/document truth | `ISS-001`–`ISS-006` | T2 for repo-wide authority changes | current branch consolidates one decision protocol, one active program/trace/index, and historical routers | exact-head GitHub Actions | active docs agree; no false-current entrypoint; broad/curated/governance/type/lint/build/browser gates pass without weakened assertions |
| WS-02 connector/protocol/capability truth | `ISS-007`–`ISS-011` | T2/T3 | prior source/CI evidence retained only for exact scope | remote MCP/OAuth server, connector sandboxes, browser host | generic Manager-custodied connector/protocol passes attack, revocation, health, outage, repair, deletion, MCP Apps, AG-UI, and exact-candidate evidence |
| WS-03 database authority/platform proof | `ISS-012`–`ISS-014` | T2/T3 | forward source migrations through `0076`; application proof pending | PostgreSQL CI, disposable managed Supabase, staging backup/advisors | blank ledger, existing-row, RLS/grant/function, negative isolation, concurrency, ambiguity, rollback, and required managed-platform proof pass |
| WS-04 secrets/target host/runtime lifecycle | `ISS-015`–`ISS-018` | T3 | foundations only | production-shaped Linux host, managed secret store, DNS/TLS, immutable registry | five-service health, two-employee isolation, least privilege, rotation, lifecycle repair, teardown/replacement, exact Hermes/image evidence pass |
| WS-05 fixture-free owner/connectors/channels | `ISS-019`–`ISS-021` | T3 | PR #34 owner-runtime source base | disposable Auth, target host, live connector/channel sandboxes | real owner activates/supervises one assignment; failures remain distinct; Web/SMS/Review converge; no fixture/manual state |
| WS-06 golden governed work/proof | `ISS-022`–`ISS-024` | T3 | PR #35 exact revision→approval→effect→output→repairable proof source candidate | funded provider/adapters, fixture-free owner journey | Website, Contractor Office, Bookkeeping complete real work with parity, one effect, matching receipts/accounting, replay safety, restart proof refinding |
| WS-07 commercial/rate/ambiguity | `ISS-025`–`ISS-028` | T3 | PR #35 PostgreSQL admission/settlement/adjustment/conservation/reconciliation source candidate | provider request IDs/idempotency sandbox, billing sandbox, managed DB | replicas cannot overspend or multiply rate; uncertainty never blind-retries; original effect reconciles; usage/cost/payer/beneficiary/invoice/entitlement settles exactly once |
| WS-08 crash/rollback/observability/signed release | `ISS-029`–`ISS-032` | T3 | PR #35 repair queues, proof projection, lineage, reconciliation, fault seams, focused workflow groundwork | target host, backup store, signing/provenance infrastructure, telemetry backend | fault matrix cannot create false success/duplicate effect; rollback/restore preserves accepted work; alerts/runbooks work; signed manifest verifies independently |
| WS-09 human surface/capacity/pilot | `ISS-033`–`ISS-038` | T3 | downstream | supported browsers/devices, screen readers, load environment, approved pilot cohort | WCAG/screen-reader/browser gates, capacity/fairness envelope, durable interruption/recovery UX, pilot entry/exit/incident/rollback packet pass |

## Workstream-specific stop conditions

### WS-01

- active docs disagree on branch/base/head, migration, workstream, trace, or evidence;
- historical material looks current;
- broad normalization exposes a real source defect;
- test assertions are weakened for green.

### WS-02

- browser/model selects provider, tool, scope, host, issuer, audience, credential, or continuation;
- unknown/stale evidence becomes effective;
- MCP Apps or AG-UI becomes authority or executes effects directly;
- live provider cannot prove revocation/repair.

### WS-03

- an applied migration is edited;
- local PostgreSQL is promoted to managed-platform acceptance;
- service/browser roles can bypass reviewed authority RPCs;
- negative isolation, concurrency, or migration compatibility fails.

### WS-04

- Manager/Web gains Docker or host authority;
- one employee reaches another or arbitrary network;
- old credentials remain valid after rotation;
- partial lifecycle state renders healthy;
- image digest floats.

### WS-05

- infrastructure failure renders as empty/successful state;
- account membership substitutes for assignment authority;
- browser-readable bearer or token-bearing SSE appears;
- channels diverge from durable state.

### WS-06

- preview materially differs from delivered output;
- approval is stale, self-created, or not exact-revision bound;
- success lacks provider/effect/accounting evidence;
- replay duplicates an effect;
- proof cannot be refound after restart.

### WS-07

- spend is checked only after dispatch;
- rate authority is process-local;
- ambiguous outcome becomes ordinary failure or blind retry;
- reconciliation creates a second effect identity;
- payer/beneficiary/provider/effect/accounting disagree;
- caller/browser selects commercial state.

### WS-08

- repair deletes or rewrites accepted evidence;
- crash produces false success or duplicate effect;
- rollback loses accepted work;
- provenance is self-asserted but not independently verifiable;
- alerts collapse blocked, failed, ambiguous, repaired, and recovered.

### WS-09

- fixture browser substitutes for supported-browser acceptance;
- accessibility is inferred from lint alone;
- load tests omit fairness/noisy-neighbor behavior;
- pilot starts without stop authority, rollback, incident ownership, or customer exit.

## Current WS-06/07/08 transaction

Active computation: `../decision/trace007/`.

Selected exploration is larger; selected implementation is exactly:

```text
D01 atomic shared commercial admission
D02 durable settlement and conservation
D03 provider idempotency and original-effect ambiguity reconciliation
D04 accepted effect/accounting continuity
D06 exact golden-work completion
D07 convergent proof projection repair
```

This is one database-authoritative transaction, not six independent subsystems.

## Completion rule

A workstream is complete only when:

```text
computed choice is reproducible
AND source/migration behavior exists
AND selected behavioral tests pass
AND exact-head CI passes
AND every required external evidence class passes
AND active documentation/handoff agrees
```

A lower evidence class cannot satisfy a higher one. Skips, blocked prerequisites, and unavailable environments remain visible evidence.
