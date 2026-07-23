# Dependency-Ordered Workstream Map

Status: **active execution decomposition**  
Updated: 2026-07-23  
Status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision state: [`../decision/active.json`](../decision/active.json)

## Current execution state

- Trace013 is completed and Trace014 is reserved but absent.
- The active operation is top-down stack convergence with exact-head verification after each merge.
- After the user merges the single final PR, the next branch begins with `repoctl start`.

## Workstream matrix

| WS | Current cumulative source state | External prerequisites | Complete only when |
|---|---|---|---|
| WS-01 repository/experiment truth | routers, compiler, P1/P2/P3 verifiers, structural governance, broad gates | exact-head CI on each merge | one exact-green PR targets `main`; no stale active transaction |
| WS-02 connector/protocol | OAuth/MCP authority, lifecycle discovery/revoke/reconnect | live servers and sandboxes | live authorization/revocation/outage/repair passes |
| WS-03 database | ledger through `0082`, local security/concurrency | managed platform | managed migration/security/backup/rollback passes |
| WS-04 target host | Host Provisioner and lifecycle/isolation contracts | Linux host, secrets, registry | least privilege, isolation, recovery, exact images pass |
| WS-05 owner/channels | snapshots, streams, reconnect, projections, UI variants | Auth and live channels | one real owner supervises one real assignment across channels |
| WS-06 golden work | revision/approval/effect/output/proof/repair contracts | providers and live owner journey | all three roles complete real refindable work |
| WS-07 commercial/provider | shared rate/budget, ambiguity, accounting, reconciliation | provider/billing/managed DB | no overspend, blind retry, or duplicate settlement |
| WS-08 recovery/release | faults, restore/rollback, five images, signed manifest | target host and trusted signing | real faults conserve accepted work and evidence |
| WS-09 human/capacity/pilot | UI grammar, automation, capacity and stop schema | browsers, screen readers, load host, cohort | WCAG/browser/capacity and pilot packet pass |

## Compiler stop conditions

- non-mechanical source changes predate task capsule or plan admission;
- an unregistered dialect is selected;
- a P1 claim lacks model, assumptions, certificate, verifier, correspondence, or residual;
- a hard hyperedge lacks accepted proof, planned proof, or blocker;
- changed paths are absent from impact analysis and not recorded as discovered later;
- predictions are written after outcomes;
- evidence is promoted across P0–P4;
- user work is reset, cleaned, stashed, or hidden.

## Product stop conditions

- authority becomes caller, browser, provider, model, or adapter selectable;
- local PostgreSQL is promoted to managed acceptance;
- one employee reaches another or arbitrary network;
- infrastructure failure renders as success;
- preview materially differs from delivery;
- ambiguity becomes ordinary failure or blind retry;
- rollback loses accepted work;
- automated checks substitute for human accessibility;
- pilot lacks stop authority, rollback, incident ownership, or customer exit.

## Completion rule

```text
valid experiment transaction when non-mechanical
AND source behavior exists
AND hard hyperedges have proof or blocker
AND focused and broad exact-head evidence passes
AND required P4 evidence passes
AND active documents and memory agree
```
