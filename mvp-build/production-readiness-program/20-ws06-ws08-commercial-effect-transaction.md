# WS-06/07 Commercial Effect Transaction and WS-08 Repair Groundwork

Status: **source candidate implemented; exact-head verification pending**  
Candidate: PR `#35`, stacked on PR `#34` exact base `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a`  
Migration head: `0075`  
Decision authority: [`../decision/trace007/`](../decision/trace007/)  
Updated: 2026-07-20

## Claim boundary

This record describes the source candidate. It does not establish live-provider, managed-database, target-host, pilot, deployment, or production acceptance. CI is established only when an exact-head run exists and passes. Local PostgreSQL evidence does not promote into managed-platform evidence.

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
→ replay-safe repair or explicit reconciliation
```

The implementation compression selected `D01,D02,D03,D04,D06,D07`:

- `D01`: atomic PostgreSQL admission;
- `D02`: durable settlement and conservation;
- `D03`: provider idempotency and ambiguity reconciliation;
- `D04`: accepted effect/accounting receipt continuity;
- `D06`: exact golden-work completion contract;
- `D07`: independently repairable proof projection.

## Durable database authority

Migration `0074_ws07_commercial_effect_and_ws08_repair.sql` adds:

- `model_gateway_rate_windows` — shared per-credential/window authority;
- `model_gateway_request_reservations` — request, revision, route, provider idempotency, reservation, command, effect, accounting, ambiguity, proof, and correlation identity;
- `model_gateway_adjustments` — immutable refund/reversal/credit/compensation history;
- `effect_proof_projections` — accepted effect → owner/operator output/proof projection with independent repair state;
- admission, dispatch, settlement, refund, conservation, proof projection, reconciliation queue, repair queue, and lineage functions/views.

Migration `0075_ws08_gateway_reconciliation.sql` adds the forward-only transition from durable ambiguity to accepted only when exact accepted provider, effect, and accounting receipts are supplied. It cannot dispatch a provider request.

## Model Gateway

`model-gateway.ts` no longer owns process-local rate buckets. The signed credential authorizes only the Manager-owned alias and durable assignment/commercial dimensions. PostgreSQL admission is the rate and spend authority.

`model-gateway-http.ts`:

- derives a stable revision and request identity from canonical request content;
- reserves worst-case cost before dispatch;
- sends one request under `Idempotency-Key`, `X-Amtech-Request-Key`, assignment, and correlation identity;
- removes blind transport retries after dispatch;
- converts post-dispatch timeout/connection loss or success without provider receipt into durable ambiguity;
- records accepted provider usage only with the accepted effect receipt;
- returns request, revision, provider receipt, effect receipt, accounting receipt, proof reference, assignment, and replay state together.

`model-gateway-reconciliation.ts` is an operator/repair seam. Its resolver must replay or query the existing durable provider identity. It cannot mint a new effect identity.

## Golden work completion

Website, Contractor Office, and Bookkeeping use the existing immutable artifact revision and approval snapshot grammar. The source candidate adds:

- `effect-proof-projection.ts` for exact approval/effect/revision/output/proof projection;
- artifact publication success only when the accepted effect can be presented with an owner proof reference;
- an explicit degraded result when publication was accepted but proof projection failed;
- retry behavior that replays the accepted effect and repairs only the missing projection;
- artifact history output containing durable effect-proof projections.

This separates effect truth from presentation repair. Repair cannot erase the accepted publication or invent a new one.

## Mandatory failure manifold

Behavioral tests cover or route every selected effect path through:

1. concurrent same-revision requests;
2. stale or wrong-revision approval;
3. budget reservation conflict;
4. shared rate exhaustion;
5. timeout before proven effect;
6. accepted response loss;
7. crash after effect before receipt;
8. crash after receipt before proof projection;
9. partial multi-step success followed by retry;
10. duplicate, stale, or reordered replay;
11. refund/reversal/compensation;
12. restart and proof refinding.

The mandatory partial-success test accepts the effect, injects failure before proof projection, retries with the same identity, and requires convergence without duplicate effect, leaked reservation, false failure, or lost proof.

## Computed decision trace

`decision/trace007/compute.py` verifies:

- `B288 = W3 × L12 × H8` with explicit observed/unknown extraction;
- six reusable thought templates selected before production inspection;
- 64 candidates in isolated current/feature/counterfactual/recombination batches;
- all 16 requested candidate dimensions and weighted `q` values;
- a genuine multi-way hypergraph, sparse incidence matrix, normalized Laplacian, RBF similarity, redundancy, separation, normalized spectral entropy, quality-diversity occupancy, and coverage;
- joint selection against utility-only, diversity-only, and 120 feasible random selections;
- a separate six-item production compression.

Joint `J=0.5818732`, utility-only `J=0.2346884`, and diversity-only `J=0.56291544`. Graph/diversity terms changed coverage and selected trajectories materially, so they are causal for this task. The trace calls the retained research method **evidence-bounded forced dreaming**: broad latent-space exploration is permitted, but unsupported coordinates are penalized and no mathematical artifact can override repository invariants or evidence classes.

## Verification route

Focused commands:

```bash
npm run test:ws07-ws08
npm run db:verify:commercial-effect-migrations
python decision/trace007/compute.py
```

Exact CI workflow: `.github/workflows/ws07-ws08-commercial-effect.yml`.

Evidence classes remain separate:

- source established;
- unit established;
- integration established;
- CI established;
- live provider established;
- managed database established;
- target-host established;
- pilot established;
- production established.

## Open prerequisites

- exact-head CI run for PR #35;
- disposable managed Supabase application and security proof through `0075`;
- provider sandbox evidence for request IDs and idempotency behavior;
- explicit reconciliation evidence for accepted-response-loss;
- fixture-free Website/Contractor/Bookkeeping journeys;
- owner browser proof refinding after restart;
- target-host, rollback, backup/restore, signed release, capacity, pilot, and production gates.
