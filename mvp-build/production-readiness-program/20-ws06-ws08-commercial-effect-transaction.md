# WS-06/07 Commercial Effect Transaction and WS-08 Repair Groundwork

Status: **source candidate; exact-head and external verification unresolved**  
Exact current candidate and migration status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision protocol: [`../decision/README.md`](../decision/README.md)  
Trace: [`../decision/trace007/`](../decision/trace007/)

## Claim boundary

This record describes a source transaction and its proof plan. It does not establish exact-head CI, managed database, live provider, target host, fixture-free golden work, billing lifecycle, recovery/rollback, signed release, pilot, deployment, or production acceptance.

## Decision correction

The task remains `T3` because it crosses WS-06, WS-07, and bounded WS-08 boundaries. Trace007 still contains the complete 64-candidate matrix, but its topology and causal claims are corrected.

### Candidate search graph

`candidate_graph.json` has candidate trajectories as vertices. It supports diversity, redundancy, lineage, similarity, and candidate-edge touch. It does not describe complete software invariants.

### Software invariant hypergraph

`software_invariant_hypergraph.json` has actual software entities and obligations as vertices, including revision, approval, authority, reservation, effect, provider attempt/identity/receipt, settlement, accounting, output, proof, reconciliation, refinding, and repair.

Only this graph computes:

```text
software_touch
software_fractional
software_complete
software_proved
```

`software_proved` remains zero or otherwise unestablished until independent exact-candidate behavioral evidence is attached.

### Equal-feasibility controls

All controls use the same set size, validated candidate domain, mandatory workstream coverage, mandatory Z-space coverage, and invariant feasibility.

```text
full
no_graph
no_diversity
evidence_baseline
≥ 1,000 feasible random baselines
```

Mandatory coverage is a constraint, not an objective reward. The previous comparison against an uncovered utility control is invalid for causal inference.

Current classification:

```text
candidate graph terms: descriptive
software invariant graph terms: descriptive
diversity terms: selection-influencing when the equal-feasibility set changes
causal improvement: unestablished
```

Causal promotion requires independent implementation outcomes in `implementation_ablation.json`.

## Coherent source transaction

```text
immutable request/work revision
→ exact assignment + current commercial authority
→ atomic shared rate token + worst-case budget reservation
→ one durable command/effect identity
→ one provider idempotency identity
→ accepted | failed | ambiguous durable outcome
→ original-effect reconciliation before retry
→ accepted effect receipt
→ accepted effect-bound accounting receipt
→ output/publication bound to the same revision and effect
→ owner/operator proof projection
→ projection repair without repeating the accepted effect
```

Implementation compression remains:

- `D01` — atomic PostgreSQL admission;
- `D02` — durable settlement, release, adjustment, and conservation;
- `D03` — provider idempotency and original-effect ambiguity reconciliation;
- `D04` — accepted effect/accounting continuity;
- `D06` — exact golden-work completion;
- `D07` — independently repairable proof projection.

This transaction is justified by source evidence and invariants. The mathematics is supporting description, not established cause.

## Forward migrations

The source candidate adds forward-only database state for:

- shared model-gateway rate windows and request reservations;
- immutable adjustments and conservation;
- effect proof projections;
- ambiguity and reconciliation state;
- lineage and repair queues;
- native-idempotency reconciliation constrained to the original command/effect/provider identity;
- reviewed service-role RPC mutation boundaries.

Applied migrations remain immutable. Exact migration names and current source head live in `../CODEGRAPH.md` and `packages/db/migrations/`.

## Model Gateway boundary

- request identity derives from canonical request content and exact assignment/commercial authority;
- worst-case cost reserves before dispatch;
- one provider call uses one provider idempotency identity;
- blind post-dispatch retry is forbidden;
- timeout, connection loss, or accepted response without sufficient receipt evidence becomes durable ambiguity;
- accepted usage binds the accepted effect receipt and accounting receipt;
- reconciliation queries/replays only the existing provider identity and cannot mint a new effect.

## Golden work boundary

Website, Contractor Office, and Bookkeeping share one revision/approval/effect/proof grammar:

- one immutable revision;
- exact approval authority;
- one publication effect;
- owner-visible success only with accepted effect and proof reference;
- degraded projection state when effect acceptance exists but proof projection is pending;
- repair that projects/refinds proof without republishing.

## Software invariant proof plan

`verification_plan.json` maps every software hyperedge to behavioral tests or named external acceptance. The minimum failure manifold covers:

1. concurrent same-revision admission;
2. stale/wrong revision authority;
3. budget reservation conflict;
4. shared rate exhaustion;
5. failure before proven effect;
6. accepted-response loss;
7. original-effect reconciliation without redispatch;
8. crash after receipt before proof projection;
9. partial success followed by retry;
10. duplicate/stale/reordered replay;
11. refund, reversal, and conservation;
12. restart and owner proof refinding.

A complete proof plan is not accepted proof. Exact-head and external results determine `software_proved`.

## Verification route

```bash
python decision/trace007/compute.py
npm run test:ws07-ws08
npm run db:verify:commercial-effect-migrations
npm run test:production-boundary
npm run repo:verify:quick
npm run repo:verify:full
npm run test:unit
npm run test:integration
npm run build
```

## Open prerequisites

- exact-head trace, governance, source, unit, PostgreSQL, type, lint, build, and broad regression evidence;
- disposable managed-platform migration/security/advisor proof;
- provider sandbox request-ID/idempotency/timeout/accepted-response-loss reconciliation;
- billing, entitlement, invoice, refund, and reversal lifecycle;
- fixture-free Website/Contractor/Bookkeeping journeys and restart proof refinding;
- target-host fault injection, rollback, backup/restore, telemetry, and signed release;
- typed server composition replacing generated string mutation;
- accessibility, capacity, pilot, deployment, and production gates.
