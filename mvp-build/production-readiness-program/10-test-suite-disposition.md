# Test Suite Disposition

Status: **active test-authority map**  
Decision protocol: [`../decision/README.md`](../decision/README.md)  
Current source candidate: PR #35  
Source migration head: `0076`

A suite is evidence only for the boundary and exact SHA it exercises. Computation chooses the coherent implementation transaction and minimum counterexample manifold; it does not justify testing every discarded possible-decision vector.

## Test-design order

```text
verified computation record
→ selected implementation contract
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
- `T2/T3` tests the selected transaction, concurrency/authority/effect boundaries, and the smallest failure manifold proving convergence.
- Discarded exploration vectors do not automatically become tests.
- A score or graph is not a test oracle; expected behavior comes from Standard/source invariants.
- Unknown external prerequisites remain blocked, not mocked into acceptance.

## Current authoritative suites

| Suite / harness | Authority |
|---|---|
| `python decision/trace007/compute.py` | reproducibility of the current candidate frontier, graph hashes, comparisons, and implementation compression; not runtime evidence |
| `test:standard` | Standard and connector registry/setup/binding contracts |
| `test:s10-onboarding` | identity/onboarding source contract |
| `test:lane1-scope` | assignment/authorization scope |
| `test:lane10-evidence` | release-evidence shape, not signed deployed proof |
| `test:production-boundary` | named source/unit boundaries including gateway, topology, workbench, streaming, protocol |
| `test:ws07-ws08` | focused PR #35 commercial admission, ambiguity, partial-success repair, gateway isolation, PostgreSQL ledger |
| `test:ui:contracts` | typed/fixture UI, MCP Apps, AG-UI, operating snapshot contracts |
| `db:verify:commercial-effect-migrations` | source-target database security/authority shape after migrations apply |
| `repo:verify:quick/full` | repository/document governance, contracts, typecheck, lint |
| `test:unit` | complete surviving broad regression after workspace builds |
| `test:integration` | PostgreSQL integration boundaries; environment-gated tests remain explicit |
| `build` | production compilability |
| `.github/workflows/ws07-ws08-commercial-effect.yml` | exact-head PR #35 decision/source/unit/PostgreSQL gate when a run exists |
| Main Integration | canonical merge gate only for the exact candidate it runs |

## Historical exact evidence

WS-01 and hardened WS-02 pass counts and workflow IDs remain historical evidence for their exact heads. They are not inherited by PR #35. Active docs may cite them only with exact SHA/scope and without implying current-head green.

## PR #35 selected failure manifold

The current transaction tests:

1. concurrent same-revision admission;
2. stale/wrong revision identity;
3. shared budget reservation conflict;
4. cross-worker rate exhaustion;
5. provider failure before proven acceptance;
6. accepted-response loss and durable ambiguity;
7. original-effect reconciliation without redispatch;
8. crash after receipt before proof projection;
9. partial multi-step success followed by retry;
10. duplicate/stale/reordered replay;
11. refund/adjustment conservation;
12. restart and proof refinding.

The mandatory partial-success case accepts the effect, injects projection failure, retries the same identity, and requires one effect, conserved value, no false failure, and refindable proof.

## Useful but incomplete or external

- blank migration and worker-migration harnesses;
- disposable managed Supabase application/advisors/security proof;
- live provider request-ID/idempotency/accepted-response-loss reconciliation;
- fixture-free Website/Contractor/Bookkeeping journeys;
- target-host topology, recovery, rollback, backup/restore;
- supported-browser/channel, accessibility, capacity, pilot, deployment, signed release.

Compiled fixture Web remains deterministic regression, not fixture-free channel acceptance.

## Flakiness and blocked evidence

No suite is labeled flaky without repeatable exact-environment evidence. Missing provider, host, database, browser, billing, or signing prerequisites are `blocked`, not pass. Fix product or harness invariants rather than adding blind retries.

## Preservation rules

- Do not weaken a current invariant for green.
- Discovery cannot substitute for execution.
- Source-order assertions follow invocation boundaries, not imports.
- Under-scoped generated UI remains display-only.
- A started Hermes run may resume/poll the same run after stream loss, never create another silently.
- Unscoped progress cannot broadcast owner-visible state.
- Ambiguous provider outcome is not ordinary failure or success.
- Accepted success requires the boundary's provider/effect/accounting/proof evidence.
- A lower evidence class cannot satisfy a higher one.
