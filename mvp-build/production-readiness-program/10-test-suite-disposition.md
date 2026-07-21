# Test Suite Disposition

Status: **active test/evidence map**  
Exact candidate and migration status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision protocol: [`../decision/README.md`](../decision/README.md)

A suite is evidence only for the exact boundary and candidate it exercises. Decision computation selects and describes a transaction; Standard/source invariants define expected behavior.

## Test-design order

```text
valid decision record
→ selected implementation contract
→ complete software-edge proof plan
→ narrow red behavioral proof
→ source/migration change
→ narrow green
→ affected suites
→ broad exact-head gates
→ required external acceptance
```

Rules:

- `T0` verifies the exact mechanical invariant.
- `T1` tests the selected behavior and decisive rejection boundary.
- `T2/T3` tests the coherent transaction, authority/concurrency/effect boundaries, and minimum failure manifold.
- Every selected software-invariant hyperedge maps to a complete behavioral test or explicit blocker.
- Rejected candidate vectors do not automatically become tests.
- Candidate scores and graph metrics are not test oracles.
- Unknown external prerequisites remain blocked, not mocked into acceptance.
- Structural governance tests validate routing, schemas, references, evidence classes, and reproducibility. They do not hard-pin prose, PR numbers, migration numbers, issue counts, selected IDs, objective values, or causal labels.

## Trace and topology verification

| Harness | Evidence |
|---|---|
| `python decision/trace007/compute.py` | decodes the complete candidate matrix; rebuilds candidate search topology; computes software touch/fractional/complete/proved coverage; runs equal-feasibility controls, ≥1,000 feasible random baselines, search sensitivity, and weight sensitivity; not runtime evidence |
| `test:repo-governance` | structural authority/routing/schema/reference/evidence invariants; not product behavior |

Candidate graph terms are descriptive. Diversity is at most selection-influencing. Causal improvement remains unestablished until independent implementation outcomes are recorded.

## Product suites

| Suite / harness | Authority |
|---|---|
| `test:standard` | ratified Standard and connector contract shape |
| `test:s10-onboarding` | identity/onboarding source behavior |
| `test:lane1-scope` | assignment and authorization scope |
| `test:lane10-evidence` | release-evidence shape, not signed deployed proof |
| `test:production-boundary` | named source/unit production boundaries |
| `test:ws07-ws08` | commercial admission, ambiguity, repair, gateway isolation, and PostgreSQL ledger boundaries |
| `test:ui:contracts` | typed/fixture UI, MCP Apps, AG-UI, and owner snapshot contracts |
| `db:verify:commercial-effect-migrations` | post-migration schema/security/authority shape |
| `repo:verify:quick/full` | structural governance, contract suites, typecheck, and lint |
| `test:unit` | surviving broad unit regression |
| `test:integration` | PostgreSQL integration; environment-gated tests remain explicit |
| `build` | production compilability |
| focused WS07/08 workflow | exact-head trace/governance/source/unit/PostgreSQL evidence when a run exists |
| Main Integration | merge-gate evidence only for its exact candidate |

## Software invariant proof matrix

The canonical edge-to-test mapping lives in `../decision/trace007/verification_plan.json`.

It covers:

- exact revision/approval/effect authority;
- shared rate, budget, dispatch, settlement, and release;
- provider idempotency and durable receipt continuity;
- accepted effect/accounting continuity;
- golden completion and owner refinding;
- ambiguity reconciliation and retry denial;
- accepted-effect proof repair;
- commercial conservation and immutable adjustments.

A mapped test is a proof plan. `software_proved` advances only when the required exact-candidate behavioral evidence is accepted.

## Current minimum failure manifold

1. concurrent same-revision admission;
2. stale/wrong revision identity;
3. shared budget reservation conflict;
4. cross-worker rate exhaustion;
5. provider failure before proven acceptance;
6. accepted-response loss and durable ambiguity;
7. original-effect reconciliation without redispatch;
8. crash after receipt before proof projection;
9. partial success followed by retry;
10. duplicate/stale/reordered replay;
11. refund/adjustment conservation;
12. restart and proof refinding.

## External or incomplete evidence

- blank-ledger and managed-platform migration/security/advisor proof;
- live provider request-ID/idempotency/accepted-response-loss reconciliation;
- fixture-free Website/Contractor/Bookkeeping journeys;
- owner proof refinding after restart;
- target-host fault, rollback, backup/restore, and telemetry;
- supported-browser/channel, accessibility, capacity, billing lifecycle, signed release, pilot, deployment, and production.

Compiled fixture Web remains deterministic regression, not fixture-free acceptance.

## Preservation rules

- Do not weaken a current invariant for green.
- Discovery cannot substitute for execution.
- A started Hermes run may resume/poll the same run after stream loss; it never silently creates another.
- Unscoped progress cannot broadcast owner-visible state.
- Ambiguous provider outcome is not ordinary failure or success.
- Accepted success requires matching provider/effect/accounting/proof evidence for the boundary.
- A lower evidence class cannot satisfy a higher one.
