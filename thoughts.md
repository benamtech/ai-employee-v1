# WS-03/WS-04/WS-05 Decision Ledger

Status: active public decision ledger
Branch: `agent/ws04-target-host-lifecycle`
Base: PR #32 head `caefb5e253473336514756fb388733ca660332a2`

## Z

Projected basis: source, tests, CI, branch, docs, memory, migrations, schema, RLS, auth, API, protocol, Hermes, Manager, employee, assignment, capability, MCP, OAuth, webhook, connector, fail-closed, idempotency, effects, observability, recovery, UI, AG-UI, stream, deploy, provider, drift, frontier, future-bug.

## A / W / L proxy

Proxy nodes:

| id | workstream | severity | node |
|---|---:|---:|---|
| T1 | WS4 | P0=3 | managed secret inventory and rotation authority |
| T2 | WS4 | P0=3 | signed Unix-socket Host Provisioner sole host authority |
| T3 | WS4 | P0=3 | five-service and two-employee network/data/workspace isolation |
| T4 | WS4 | P0=3 | replace/suspend/restore/restart/teardown lifecycle safety |
| T5 | WS4 | P1=2 | immutable Hermes digest bound to evidence |
| T6 | WS3 | P0=3 | ledger/hash and schema prerequisite adjacency |
| T7 | WS5 | P0=3 | owner-visible lifecycle state projection only |
| T8 | WS5 | P0=3 | broad fixture-free owner/channel journey — rejected as non-adjacent |
| T9 | WS4 | P1=2 | credential rotation old-token denial and receipt continuity |

Hyperedges bind each node to invariant, source surface, test, evidence class, runtime effect, and future-use impact. Edge weights are proxy values in [0,1] derived from dependency centrality and shared authority surfaces. The Laplacian clusters T1/T2/T3/T4/T9 together, T5 with deployment evidence, T6 at the WS3 boundary, and T7 as the only admissible WS5 neighbor.

## Phi proxy

Columns: `[w_s,w_p,w_r,w_c,w_t,w_f,w_delta,w_epsilon,w_rho]` = severity, production blocking, authority risk, dependency centrality, testability, future-bug prevention, adjacency, evidence freshness, reversibility.

| id | Phi |
|---|---|
| T1 | [3,1.0,1.0,0.9,0.8,0.9,0.8,0.8,0.8] |
| T2 | [3,1.0,1.0,1.0,0.8,1.0,0.9,0.8,0.6] |
| T3 | [3,1.0,1.0,1.0,0.7,1.0,0.8,0.8,0.5] |
| T4 | [3,1.0,0.9,0.9,0.8,1.0,0.8,0.8,0.7] |
| T5 | [2,0.7,0.6,0.7,0.9,0.7,0.6,0.8,0.9] |
| T6 | [3,0.9,0.8,0.9,1.0,0.8,0.9,0.9,0.9] |
| T7 | [3,0.8,0.7,0.7,0.8,0.9,0.9,0.8,0.8] |
| T8 | [3,0.8,0.7,0.5,0.5,0.5,0.3,0.5,0.5] |
| T9 | [2,0.9,1.0,0.8,0.8,1.0,0.9,0.8,0.6] |

## K_D / spectral proxy

RBF kernel over normalized proxy vectors. Calculated proxy summary:

- trace: `9.000009`
- minimum eigenvalue: `0.0235266`
- condition number: `240.528`
- log determinant: `-11.3202`

The low minimum eigenvalue indicates redundant lifecycle candidates; DPP diversity favors one authority trajectory, one isolation trajectory, one lifecycle/rotation trajectory, one evidence trajectory, and one adjacent WS5 projection trajectory rather than many near-duplicates.

## U(tau) and selected D*

Pareto ordering uses production blocking, authority-risk reduction, verification strength, adjacency, cost, and stale-evidence penalty.

Selected executable trajectories:

1. T6: inspect WS3 exact state -> verify ledger/schema dependencies -> patch only WS4-adjacent gaps -> targeted tests -> docs.
2. T2: inspect host mutation paths -> reproduce unauthorized authority possibilities -> red source-contract tests -> patch sole signed provisioner authority -> regressions.
3. T1/T9: inspect secret flow and rotation -> red custody/old-token tests -> patch inventory and rotation continuity -> regressions.
4. T3: inspect topology/network/workspace mounts -> red two-employee isolation tests -> patch fail-closed isolation -> regressions.
5. T4: inspect lifecycle state machine -> red partial-state and neighbor-safety tests -> patch replace/suspend/restore/restart/teardown -> regressions.
6. T5: inspect image resolution/evidence -> red floating-digest test -> bind immutable digest -> regressions.
7. T7 only: expose durable lifecycle state to owner surfaces where required to avoid WS5 rework; reject broad channel or onboarding expansion.

Rejected: T8 broad WS5 work because novelty and scope exceed adjacency and current verification capacity.

## Dreamed states before patching

| trajectory | current | failure | future-bug | alternative-use | adjacent-work |
|---|---|---|---|---|---|
| Host authority | scripts/provisioner paths exist | Manager/Web can gain host mutation or unsigned requests pass | new lifecycle command bypasses provisioner | staging host pools | WS5 owner lifecycle state |
| Secret custody | env/config paths exist | master secret enters image/log/runtime | new connector reuses broad secret | managed secret backend | WS3 capability/version constraints |
| Isolation | topology contracts exist | cross-employee network/data/workspace reachability | new service joins shared network | multi-tenant host pool | WS5 fixture-free owner journey |
| Lifecycle | operational scripts exist | partial state rendered healthy or neighbor disrupted | restore/rotation loses receipts | repair tooling | WS5 recovery UX |
| Digest evidence | pin exists | floating tag or unresolved digest accepted | registry retag breaks reproducibility | release provenance | WS8 signed manifest |

## b_t -> b_t+1

Prior belief: WS3 mostly complete and WS4 largely scaffolded.

Observed evidence: WS3 has only DB-P0-01 on open PR #32; WS4 acceptance remains open. Updated belief: preserve the stacked dependency, implement source/contract hardening first, and do not claim target-host or managed-secret acceptance without live evidence on the exact candidate.
