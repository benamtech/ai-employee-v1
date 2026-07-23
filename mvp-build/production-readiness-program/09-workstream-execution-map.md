# Dependency-Ordered Workstream Map

Status: **active execution decomposition**  
Updated: 2026-07-23  
Status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision state: [`../decision/active.json`](../decision/active.json)

## Current execution state

- Trace013 completed the repository-native experiment compiler.
- Trace014 and Trace015 completed branch-lineage bootstrap/strategy artifacts.
- Trace016 repaired production Caddy/upstream/runtime wiring and produced retained exact-candidate local mirror P3 proof, but repoctl finish is not claimed because the admitted impact envelope was exceeded.
- Trace017 reconciles active authority, production-readiness docs, ledger state, and memory to the current candidate.
- The active operation is review/merge of `task/new-task-20260723`, followed by exact-head verification of the resulting `main` merge commit.
- The next UI Lab redesign starts on a fresh branch with `repoctl start`; current UI Lab/variants are historical and non-authoritative for that work.

## Workstream matrix

| WS | Current cumulative source state | External prerequisites | Complete only when |
|---|---|---|---|
| WS-01 repository/experiment truth | routers, compiler, P1/P2/P3 verifiers, structural governance, Trace017 reconciliation | exact-head verification on the eventual `main` merge commit | one exact-green merge commit is on `main`; no stale active transaction |
| WS-02 connector/protocol | OAuth/MCP authority, lifecycle discovery/revoke/reconnect | live servers and sandboxes | live authorization/revocation/outage/repair passes |
| WS-03 database | ledger through `0082`; production Supabase status observed fully applied | managed advisors/security, backup/restore/rollback | managed migration/security/backup/rollback passes |
| WS-04 target host | Host Provisioner, lifecycle/isolation contracts, exact-SHA local mirror healthy | production host, secrets, DNS/tunnel, registry | least privilege, isolation, recovery, exact images pass on target host |
| WS-05 owner/channels | snapshots, streams, reconnect, projections; historical UI Lab/variants non-authoritative | Auth, live channels, redesigned UI Lab | one real owner supervises one real assignment across channels |
| WS-06 golden work | revision/approval/effect/output/proof/repair contracts | providers and live owner journey | all three roles complete real refindable work |
| WS-07 commercial/provider | shared rate/budget, ambiguity, accounting, reconciliation | provider/billing/managed DB | no overspend, blind retry, or duplicate settlement |
| WS-08 recovery/release | faults, restore/rollback scripts, current local Caddy wiring, current-SHA images | target host, trusted signing, ops rehearsals | real faults conserve accepted work and evidence |
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
- local PostgreSQL or local mirror evidence is promoted to managed/external acceptance;
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
