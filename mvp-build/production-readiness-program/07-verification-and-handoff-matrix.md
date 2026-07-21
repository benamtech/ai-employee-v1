# Verification and Handoff Matrix

Status: **active evidence checklist**  
Main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Stacked base: PR #34 exact head `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a`  
Current source candidate: PR #35  
Source migration head: `0076`  
Decision protocol: [`../decision/README.md`](../decision/README.md)

## Evidence-class rule

The following classes are separate and non-promoting:

```text
computed decision
→ documentation
→ source
→ unit
→ integration
→ exact-head CI
→ managed database
→ provider/connector
→ target host/runtime
→ browser/channel/accessibility
→ commercial lifecycle
→ recovery/rollback
→ pilot
→ deployment
→ production
```

A higher class may depend on a lower class, but never inherits acceptance automatically.

## Current gate matrix

| Gate | Required evidence | Current state |
|---|---|---|
| Computation-first decision | deterministic trace, required candidates/batches/dimensions/comparisons, implementation compression | `decision/trace007/` committed; exact workflow verification pending |
| Document authority | contributor/CODEGRAPH/architecture/program/gap/remediation/test/memory routes agree | source candidate in PR #35; exact-head governance scan pending |
| Ratified Standard | v0.2 and recorded evolution discipline | effective; current implementation status text must not overclaim |
| Source/type/lint/contracts | exact-head workflow | pending on PR #35 |
| Current broad regression | exact-head broad suite, no weakened assertions | pending on PR #35 |
| Production build | exact-head build | pending on PR #35 |
| Repository archaeology | exact-head active/orphan/stale-reference proof | pending on PR #35 |
| Compiled browser regression | exact-head fixture Chromium | prior exact evidence only; current head pending |
| WS-02 protocol/capability | prior exact source/CI plus live lifecycle | prior source/CI retained; live AS/provider/client open |
| WS-03 database authority | blank ledger through `0076`, security/concurrency/integration, managed triggers | source migrations exist; PostgreSQL/managed proof pending |
| WS-05 owner/channels | fixture-free exact owner/assignment/connector/channel journey | open |
| WS-06 golden work | provider-backed three-role revision→approval→effect→output→proof→replay/restart | source candidate; external acceptance open |
| WS-07 commercial/ambiguity | multi-replica rate/budget/effect/accounting/reconciliation plus provider/billing proof | source candidate; exact CI, managed DB, provider, billing open |
| WS-08 recovery/release | fault, repair, rollback, backup/restore, telemetry, provenance, signed manifest | groundwork only |
| WS-09 human/capacity/pilot | supported browsers, WCAG/screen readers, fairness/capacity, pilot packet | open |
| Production | every non-waivable gate on one exact signed deployed release | open |

## Computation handoff

A consequential handoff records:

- computation tier and protocol version;
- authority basis and observed/unknown counts;
- candidate batch counts and dimensions;
- joint/utility/diversity/random comparison;
- graph causality classification;
- selected exploration IDs;
- selected implementation IDs and compression rationale;
- rejected high-value candidates and prerequisites;
- deterministic verifier output;
- evidence classes not established.

For PR #35:

```text
Tier: T3
Trace: decision/trace007
Candidates: 64
Random feasible baselines: 120
Joint J: 0.5818732
Utility-only J: 0.2346884
Diversity-only J: 0.56291544
Graph/diversity: causal
Implementation: D01,D02,D03,D04,D06,D07
```

## Source candidate boundary

PR #35 source intends to establish:

- shared PostgreSQL rate and worst-case budget admission;
- stable request/revision/effect/provider-idempotency identity;
- accepted, failed, denied, refunded, and durable ambiguous settlement;
- accepted effect-bound accounting and conservation;
- original-effect native-idempotency reconciliation;
- exact artifact revision/approval/effect/output/proof continuity;
- projection repair without republishing;
- reconciliation, repair, and lineage views;
- focused behavioral and PostgreSQL tests;
- focused exact-head workflow.

None of those source statements are exact-head accepted until the workflow exists and passes.

## Test and proof rules

- Broad and curated suites are independently reported.
- Computation verification is not runtime verification.
- Fixture browser proof is not fixture-free provider/channel proof.
- Local PostgreSQL is not managed-platform proof where a Standard trigger applies.
- Provider mocks do not establish provider idempotency or response-loss behavior.
- `skipped`, unavailable, and blocked remain visible and never become pass.
- Documentation commits after an implementation run require final exact-head checks.
- A successful effect requires matching evidence appropriate to that boundary.
- Reconciliation and repair must preserve original effect identity and accepted evidence.

## Handoff update transaction

```text
exact branch/base/head and migration head
→ computation result
→ source/migration/test/workflow changes
→ commands/runs and exact results
→ external prerequisites and blocked classes
→ program/CODEGRAPH/architecture updates
→ one dated memory handoff
→ MEMORY.md index
→ PR/release record
```

## Completion rule

A workstream or release claim is complete only when the computed choice, executable implementation, exact-head verification, required external evidence, and active documentation agree on the same candidate.
