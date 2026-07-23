# AMTECH Production Readiness Program

Status: **active and canonical**  
Updated: 2026-07-23  
Structural status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision state: [`../decision/active.json`](../decision/active.json)

This is the single active production-readiness route. Exact candidate conclusions belong to the current PR, workflows, or retained release records. Historical plans, audits, completed traces, and ancestor results remain provenance only.

## Authority

```text
P0 representation calculation
P1 verified formal-model property
P2 verified representation correspondence
P3 exact-candidate executable evidence
P4 external or production acceptance
```

No class silently promotes itself. Provider and connector adapters do not create authority. Manager remains the authority plane; Hermes is the reasoning/runtime substrate; all UI and protocol surfaces are bounded projections.

## Current position

The cumulative source candidate includes typed Manager authority, migrations through `0082`, connector and commercial substrates, release/recovery machinery, the production owner projection, employee UI adapters, UI Lab, folder-first variants, and Trace013’s repository-native software experiment compiler.

Trace013 is completed. `decision/active.json` records no open transaction. Trace014 begins only on a new post-merge branch via `repoctl start`.

## Program route

1. `04-dependency-ordered-production-plan.md` — dependency order and stack checkpoint.
2. `08-production-issue-vector.json` — issue baseline.
3. `13-resolution-ledger.json` — resolution/control state.
4. `09-workstream-execution-map.md` — completion and stop contracts.
5. `20-ws06-ws08-commercial-effect-transaction.md` — durable effect/recovery transaction.
6. `10-test-suite-disposition.md` — test/evidence authority.
7. `07-verification-and-handoff-matrix.md` — evidence and handoff boundary.
8. `../decision/active.json` — transaction router.
9. `../decision/README.md` — executable experiment protocol.
10. `../decision/engine/` — generators, representations, certificates, task capsules, and trusted verifiers.
11. `../decision/trace007/` through `../decision/trace013/` — completed scoped decisions.
12. current source, immutable migrations, tests, workflows, proof, and newest indexed memory.

## Current integration checkpoint

```text
verify final PR #40 head
→ merge PR #40 into PR #35 branch
→ verify cumulative PR #35 head
→ merge PR #35 into PR #34 branch
→ verify cumulative PR #34 head
→ leave PR #34 as the single ready-to-review integration into main
```

No ancestor workflow certifies a descendant merge commit.

## Open P4 gates

- managed platform migration, security, backup, restore, and rollback;
- live OAuth/MCP/provider authorization, idempotency, response-loss, revoke, outage, and repair;
- target-host secrets, two-employee isolation, destructive recovery, and trusted signing;
- fixture-free Web/SMS/Review convergence and provider-backed golden work;
- supported browsers, human visual/accessibility, representative capacity, and fairness;
- controlled pilot, deployment, and production.

## Stop rules

- Run `repoctl start` before non-mechanical source edits.
- Do not weaken tests for green.
- Do not hand-author representations or weights to justify an intended patch.
- Do not demote valid formal proof of its exact property.
- Do not promote P1/P2/P3 into P4 without the missing evidence.
- Unknown is not zero.
- Ambiguous effects reconcile original identity before retry.
- Repair cannot erase accepted work or invent completion.
- Fixtures cannot satisfy fixture-free acceptance.
