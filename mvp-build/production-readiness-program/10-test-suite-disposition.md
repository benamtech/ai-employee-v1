# Test Suite Disposition

Status: **active test and evidence map**  
Exact candidate and migration status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision protocol: [`../decision/README.md`](../decision/README.md)

A suite is evidence only for the exact boundary and candidate it executes. Decision computation selects and describes work; Standard and source invariants define expected behavior.

## Test-design order

```text
valid decision record
→ selected implementation contract
→ complete software-edge proof plan
→ narrow red behavioral proof
→ source or forward migration
→ narrow green
→ affected suites
→ broad exact-candidate gates
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
- Structural governance validates routing, schemas, references, evidence classes, reproducibility, direct typed Manager composition, and absence of deleted mutation paths. It does not pin transient prose, PRs, SHAs, issue counts, selected IDs, or objective snapshots.

## Decision and topology verification

| Harness | Evidence |
|---|---|
| `python decision/trace007/compute.py` | decodes the complete candidate matrix; validates explicit baseline semantics; rebuilds candidate search topology; computes software touch/fractional/complete/proved coverage; runs equal-feasibility controls, 1,024 random baselines, search sensitivity, and weight sensitivity; not runtime evidence |
| `test:repo-governance` | structural authority, routing, schema, reference, evidence-class, direct-source, and reproducibility invariants; not product behavior |

Candidate graph terms are descriptive. Diversity is at most selection-influencing. Causal improvement remains unestablished until independent implementation outcomes are recorded.

## Product suites

| Suite or harness | Authority |
|---|---|
| `test:standard` | ratified Standard and connector contract shape |
| `test:s10-onboarding` | identity and onboarding source behavior |
| `test:lane1-scope` | assignment and authorization scope |
| `test:lane10-evidence` | release-evidence shape, not signed deployed proof |
| `test:production-boundary` | WS-01–07 source and unit boundaries, including direct Manager composition, current projected authority, strict snapshots/streams, finite gateway economics, and commercial ambiguity |
| `test:ws07-ws08` | commercial admission, database-owned rate authority, ambiguity, repair, gateway isolation, and PostgreSQL ledger boundaries |
| `test:ui:contracts` | typed and fixture UI, MCP Apps, AG-UI, and owner snapshot contracts |
| `db:verify:commercial-effect-migrations` | post-migration schema, grants, RLS, security-definer authority, namespace repair, and receipt-chain shape |
| `repo:verify:quick/full` | structural governance, contract suites, direct typecheck, and lint |
| `test:unit` | surviving complete unit regression |
| `test:integration` | blank-ledger PostgreSQL integration; environment-gated tests remain explicit |
| `build` | direct production workspace compilability |
| `WS01-WS07 Production Candidate` workflow | exact-candidate decision, source, production-boundary, broad, build, and PostgreSQL evidence when a run exists |
| Main Integration | merge-gate evidence only for its exact candidate |

## Software-invariant proof matrix

The canonical edge-to-test mapping is `../decision/trace007/verification_plan.json`. It covers:

- exact revision, approval, effect, and authority;
- shared rate, budget, dispatch, settlement, and release;
- provider idempotency and durable receipt continuity;
- accepted effect and accounting continuity;
- golden completion and owner refinding;
- ambiguity reconciliation and retry denial;
- accepted-effect proof repair;
- commercial conservation and immutable adjustments.

A mapped test is a proof plan. `software_proved` advances only when the required exact-candidate behavioral evidence is accepted.

## Current minimum failure manifold

1. concurrent same-revision admission;
2. stale or wrong projected assignment and authority version;
3. shared budget reservation conflict;
4. caller window sharding and cross-worker rate exhaustion;
5. malformed token, timeout, price, or usage economics;
6. provider failure before proven acceptance;
7. accepted-response loss and durable ambiguity;
8. original-effect reconciliation without redispatch;
9. crash after receipt before proof projection;
10. partial success followed by retry;
11. duplicate, stale, or reordered replay;
12. refund and adjustment conservation;
13. restart and proof refinding;
14. cross-assignment progress and stream isolation.

## External or incomplete evidence

- disposable managed-platform migration, security, trigger, advisor, backup, and rollback proof;
- live connector and provider authorization, request identity, idempotency, accepted-response-loss, revocation, outage, repair, and deletion;
- fixture-free Website, Contractor Office, and Bookkeeping journeys;
- owner proof refinding after target-host restart;
- payer, beneficiary, entitlement, invoice, refund, suspension, and reactivation lifecycle;
- target-host secret custody, isolation, fault, rollback, backup/restore, telemetry, and signed release;
- supported-browser/channel, accessibility, capacity, pilot, deployment, and production.

Compiled fixture Web remains deterministic regression, not fixture-free acceptance.

## Preservation rules

- Do not weaken an invariant for green.
- Discovery cannot substitute for execution.
- A started Hermes run may resume or poll the same run after stream loss; it never silently creates another.
- Unscoped progress cannot broadcast owner-visible state.
- Projected owner actions require current assignment and authority version before dispatch.
- Ambiguous provider outcome is not ordinary failure or success.
- Accepted success requires matching provider, effect, accounting, output, and proof evidence for the boundary.
- A lower evidence class cannot satisfy a higher one.
