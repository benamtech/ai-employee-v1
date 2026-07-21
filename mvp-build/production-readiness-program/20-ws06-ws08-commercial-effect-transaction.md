# WS-06/07 Commercial Effect Transaction and WS-08 Repair Groundwork

Status: **source candidate implemented; exact-head verification pending**  
Candidate: PR `#35`, stacked on PR `#34` exact base `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a`  
Source migration head: `0076`  
Decision protocol: [`../decision/README.md`](../decision/README.md)  
Computed trace: [`../decision/trace007/`](../decision/trace007/)  
Updated: 2026-07-20

## Claim boundary

This is a source and decision record. It does not establish exact-head CI, live-provider, managed-database, target-host, fixture-free golden-work, commercial lifecycle, recovery/rollback, pilot, deployment, or production acceptance.

## Computation before implementation

The task was classified `T3` because it crosses WS-06, WS-07, and bounded WS-08 production boundaries.

`decision/trace007/compute.py` verifies:

- `B288 = W3 × L12 × H8` with exact observed/unknown reconciliation;
- six reusable thought templates selected before task-specific conclusions;
- 64 current/feature/counterfactual/recombination candidates;
- 16 weighted dimensions including explicit Unsupported and PrerequisiteDebt;
- a genuine multi-way hypergraph with sparse incidence, normalized Laplacian, RBF similarity, separation, redundancy, normalized spectral entropy, quality-diversity occupancy, and coverage;
- joint selection versus utility-only, diversity-only, and 120 feasible random selections;
- separate selected exploration and six-item implementation compression.

Results:

```text
joint J = 0.5818732
utility-only J = 0.2346884
diversity-only J = 0.56291544
graph/diversity classification = causal
implementation = D01,D02,D03,D04,D06,D07
```

Graph/diversity terms are causal because they materially changed required space/workstream coverage and the coherent implementation set. They remain decision evidence, not runtime evidence.

## One coherent transaction

```text
immutable request/work revision
→ exact assignment + current commercial authority
→ atomic shared rate token + worst-case budget reservation
→ one durable command/effect identity
→ one provider idempotency identity
→ accepted | failed | ambiguous durable outcome
→ accepted effect receipt
→ accepted commercial accounting receipt
→ output/publication bound to the same revision and effect
→ owner/operator proof projection
→ replay-safe projection repair or original-effect ambiguity reconciliation
```

Implementation compression:

- `D01` atomic PostgreSQL admission;
- `D02` durable settlement, release, refund, and conservation;
- `D03` provider idempotency and original-effect ambiguity reconciliation;
- `D04` accepted effect/accounting continuity;
- `D06` exact golden-work completion;
- `D07` independently repairable proof projection.

The implementation is one database-authoritative transaction, not six parallel subsystems.

## Forward migrations

### `0074_ws07_commercial_effect_and_ws08_repair.sql`

Adds:

- `model_gateway_rate_windows`;
- `model_gateway_request_reservations`;
- `model_gateway_adjustments`;
- `effect_proof_projections`;
- atomic admission, dispatch, settlement, refund, conservation, proof projection, reconciliation/repair queues, and lineage.

### `0075_ws08_gateway_reconciliation.sql`

Adds forward-only gateway ambiguity settlement and proof-projection failure recording. It cannot dispatch a provider request.

### `0076_ws08_reconciliation_authority_hardening.sql`

Hardens:

- `native_idempotency` as reconcilable only through the already-reserved effect and exact provider idempotency identity;
- the existing C3 command/effect receipt transition from ambiguous to accepted/failed without creating another effect;
- immutable adjustment history;
- service-role access so authority tables are inspected directly but mutated through reviewed security-definer RPCs.

Applied migrations remain immutable; all corrections are forward-only.

## Model Gateway source boundary

`model-gateway.ts` no longer owns process-local rate buckets. The signed credential authorizes only the Manager-owned alias and exact assignment/commercial dimensions. PostgreSQL is the rate, spend, settlement, ambiguity, and adjustment authority.

`model-gateway-http.ts`:

- derives stable revision/request identity from canonical request content;
- reserves worst-case cost before dispatch;
- sends one provider call with `Idempotency-Key`, request key, assignment, and correlation identity;
- removes blind post-dispatch retries;
- records timeout/connection loss or success without provider receipt as durable ambiguity;
- binds accepted usage to the accepted effect receipt;
- returns request, revision, provider receipt, effect receipt, accounting receipt, proof reference, assignment, and replay state together.

`model-gateway-reconciliation.ts` performs the only safe accepted-response-loss repair sequence:

```text
query/replay existing provider idempotency identity
→ reconcile original ambiguous command/effect receipt
→ write accounting against that accepted receipt
→ settle the same commercial request
```

A crash between steps is replay-safe. The helper cannot mint a new effect identity.

## Golden work source boundary

Website, Contractor Office, and Bookkeeping share the immutable artifact revision and approval grammar.

The source candidate adds:

- exact approval/effect/revision/output/proof projection;
- owner-visible success only with the accepted effect and proof reference;
- an explicit degraded result when effect acceptance exists but proof projection is pending;
- retry that replays the accepted effect and repairs only projection;
- artifact history containing durable effect-proof projections.

Effect truth and presentation repair are separate. Repair cannot erase publication or invent a new one.

## Minimum failure manifold

The selected transaction covers:

1. concurrent same-revision request;
2. stale/wrong revision authority;
3. budget reservation conflict;
4. shared rate exhaustion;
5. failure before proven effect;
6. accepted response loss;
7. crash after dispatch/effect before normal response;
8. crash after receipt before proof projection;
9. partial multi-step success followed by retry;
10. duplicate/stale/reordered replay;
11. refund/reversal/compensation conservation;
12. restart and owner proof refinding.

The mandatory partial-success case accepts one effect, injects projection failure, retries the same identity, and requires no duplicate effect, no leaked reservation, no false failure, and no lost proof.

## Verification route

```bash
python decision/trace007/compute.py
npm run test:ws07-ws08
npm run db:verify:commercial-effect-migrations
npm run repo:verify:quick
```

Exact workflow: `.github/workflows/ws07-ws08-commercial-effect.yml`.

## Open prerequisites

- exact-head workflow run and broad gates for PR #35;
- blank PostgreSQL application and behavioral integration through `0076`;
- disposable managed Supabase security/advisor proof through `0076`;
- provider sandbox request-ID/idempotency/timeout/accepted-response-loss reconciliation;
- billing/entitlement/invoice lifecycle reconciliation;
- fixture-free Website/Contractor/Bookkeeping journeys;
- owner proof refinding after restart;
- target-host fault/rollback/backup/restore/telemetry/signed release;
- accessibility, capacity, pilot, deployment, and production gates.
