# Test Suite Disposition

Status: **active test and evidence map**  
Updated: 2026-07-23  
Exact structural status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision state: [`../decision/active.json`](../decision/active.json)  
Decision protocol: [`../decision/README.md`](../decision/README.md)

A suite is evidence only for the exact boundary and candidate it executes. Decision computation selects and describes work; Standard and source invariants define expected behavior.

## Test-design order

```text
valid decision record when required
→ selected implementation contract
→ complete software-edge proof plan or explicit blocker
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
- Scores, eigenvectors, centrality, spectral gaps, and graph metrics are not test oracles.
- Unknown external prerequisites remain blocked, not mocked into acceptance.
- Structural governance validates routing, schemas, references, evidence classes, reproducibility, direct typed Manager composition, trace state, and absence of deleted mutation paths. It must not become a second product specification by pinning transient prose, SHAs, run IDs, issue counts, selected candidates, or objective snapshots.

## Decision and topology verification

| Harness | Evidence |
|---|---|
| `python decision/trace007/compute.py` | production commercial/effect candidate matrix, explicit baseline semantics, candidate topology, software-invariant coverage, equal-feasibility controls, random baselines, search and weight sensitivity; not runtime evidence |
| `python decision/trace008/compute.py` | release/recovery/capacity candidate compression and software-hyperedge coverage; not target-host evidence |
| Trace009 artifacts | UI projection Pareto/baseline comparison and calibration; not browser or production evidence |
| Trace010 inventory/verifier | connector operating-substrate evidence and source inventory; not live OAuth/provider evidence |
| Trace011/Trace012 records | UI port, production UI Lab, and folder-first variant decisions and validation vectors; not aesthetic, accessibility, live-channel, or production evidence |
| `repo:agentic:check` | agent routers, completed/open trace state, source-owned instructions, package-script semantics, and anti-drift constraints |
| `test:repo-governance` | structural authority, routing, schema, reference, evidence-class, direct-source, migration-head, and reproducibility invariants |

Candidate graphs, software hypergraphs, and spectral terms remain descriptive or selection-supporting. Causal improvement remains unestablished until independent equal-feasibility implementation outcomes exist.

## Product suites

| Suite or harness | Authority |
|---|---|
| `test:standard` | ratified Standard and connector contract shape |
| `test:s10-onboarding` | identity and onboarding source behavior |
| `test:lane1-scope` | assignment and authorization scope |
| `test:lane10-evidence` | release-evidence shape, not trusted signed deployed proof |
| `test:production-boundary` | WS-01–07 source/unit boundaries, direct Manager composition, current authority, streams, economics, effects, ambiguity, and proof |
| `test:ws07-ws08` | commercial admission, database-owned rate authority, ambiguity, repair, release authority, and PostgreSQL boundaries |
| `test:ui:contracts` | typed/fixture UI, MCP Apps, AG-UI, owner snapshots, presentation adapters, UI Lab, and UI-variant contracts |
| `node scripts/ui-variant.mjs doctor` | variant manifest, import, dependency, registry, local guidance, containment, and environment exposure; not visual approval |
| `db:verify:commercial-effect-migrations` | post-migration schema, grants, RLS, security-definer authority, namespace repair, and receipt-chain shape |
| `repo:verify:quick/full` | agentic/structural governance, contract suites, typecheck, and lint |
| `test:unit` | complete surviving unit regression on the exact candidate |
| `test:integration` | blank-ledger and PostgreSQL integration; environment-gated tests remain explicit |
| `build` | all production workspace compilation and generated registry compatibility |
| `MVP Build Merge Gates` | exact-head agentic/governance/type/lint/unit/build evidence when the run exists |
| `WS08-WS09 Release Candidate` | exact-head source/UI/PostgreSQL/Compose/five-image/image-identity/manifest-verification evidence when the run exists |
| historical `WS01-WS07 Production Candidate` | exact ancestor evidence only; not the current cumulative descendant |
| Main Integration | evidence only for the exact merge candidate it executed |

## Software-invariant proof map

Trace007’s canonical edge-to-test mapping remains `../decision/trace007/verification_plan.json` for:

- exact revision, approval, effect, and authority;
- shared rate, budget, dispatch, settlement, and release;
- provider idempotency and durable receipt continuity;
- accepted effect and accounting continuity;
- golden completion and owner refinding;
- ambiguity reconciliation and retry denial;
- accepted-effect proof repair;
- commercial conservation and immutable adjustments.

Trace008 adds release identity, health, Docker authority, isolation, restore, rollback, operator recovery, and capacity hyperedges. Trace010 adds connection lifecycle, ambient event, and conversational-decision obligations. Trace011/012 add UI-port and neutral-variant capability/containment obligations.

A mapped test is a proof plan. `software_proved` advances only when the required exact-candidate independent behavioral evidence is accepted.

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
14. cross-assignment progress and stream isolation;
15. stale/revoked connector discovery or credential use;
16. wrong SMS decision focus or multi-role principal resolution;
17. Docker authority leakage or cross-employee attachment;
18. restore without durable truth or proof refinding;
19. rollback outside signed schema/config compatibility;
20. UI variant import/network/storage/dependency escape;
21. UI Lab write endpoint exposure outside explicit loopback development mode;
22. fixture/browser success promoted to live, accessibility, or production acceptance;
23. noisy-neighbor starvation or pilot continuation after saturation.

## External or incomplete evidence

- disposable managed-platform migration, security, trigger, advisor, backup, restore, and rollback proof;
- live connector/provider authorization, request identity, idempotency, accepted-response-loss, refresh/expiry, revocation, outage, repair, and deletion;
- fixture-free Web/SMS/signed Review convergence and Website/Contractor/Bookkeeping journeys;
- owner/operator proof refinding after target-host restart;
- payer, beneficiary, entitlement, invoice, refund, suspension, and reactivation lifecycle;
- target-host secret custody, isolation, fault, rollback, backup/restore, telemetry, trusted signing, registry retention, and deployment;
- supported-browser/channel, manual accessibility, human visual review, representative capacity, pilot, and production.

Compiled fixture Web and UI variants remain deterministic regression, not fixture-free acceptance.

## Stack verification rule

```text
verify PR40 exact head
→ merge PR40 into PR35 branch
→ verify cumulative PR35 exact head
→ merge PR35 into PR34 branch
→ verify cumulative PR34 exact head
→ present PR34 for main
```

No ancestor workflow certifies a merge descendant. The historical red PR #35 coordinate is not independently merged before the green cumulative repair.

## Preservation rules

- Do not weaken an invariant for green.
- Discovery cannot substitute for execution.
- A started Hermes run may resume or poll the same run after stream loss; it never silently creates another.
- Unscoped progress cannot broadcast owner-visible state.
- Projected owner actions require current assignment and authority version before dispatch.
- Ambiguous provider outcome is not ordinary failure or success.
- Accepted success requires matching provider, effect, accounting, output, and proof evidence for the boundary.
- A green UI doctor or screenshot is not aesthetic or accessibility approval.
- A source-built signed manifest is not trusted target-host deployment evidence.
- A lower evidence class cannot satisfy a higher one.
