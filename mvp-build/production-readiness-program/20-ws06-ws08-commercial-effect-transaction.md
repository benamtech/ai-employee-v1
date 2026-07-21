# WS-01–07 Production Boundary and WS-08 Repair Groundwork

Status: **source and locally reproducible candidate; external acceptance remains open**  
Exact candidate and migration status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision protocol: [`../decision/README.md`](../decision/README.md)  
Trace: [`../decision/trace007/`](../decision/trace007/)

## Claim boundary

This record describes the production source transaction and locally reproducible proof surface. Exact GitHub Actions records own transient candidate conclusions. Managed database, live connector/provider, target host, fixture-free channels and golden work, billing lifecycle, recovery/rollback, signed release, accessibility, capacity, pilot, deployment, and production remain separate evidence classes.

## Decision semantics

Trace007 is a `T3` record with:

- 64 independently batched candidates;
- explicit score-dimension roles, orientation, and grouped evidence baseline;
- a candidate search graph used only for search diversity, lineage, redundancy, and candidate-edge touch;
- a software-invariant hypergraph used for touch, fractional, complete, and proved software coverage;
- one feasible domain shared by full, no-graph, no-diversity, evidence-baseline, and 1,024 random controls;
- 32 deterministic search restarts and 32 weight perturbations;
- separate exploration and implementation compression.

Current classification:

```text
candidate graph terms: descriptive
software invariant graph terms: descriptive
diversity terms: descriptive or selection-influencing
causal improvement: unestablished
```

No ranking delta, objective delta, edge touch, or represented software node establishes better software. Causal promotion requires independent implementation outcomes in `implementation_ablation.json`.

## Repository and Manager boundary

Production Manager behavior is committed typed source:

```text
apps/manager/src/server.ts
→ direct typecheck
→ direct build to dist/server.js
→ direct package and Docker entrypoint
```

The template, generated server, string-patch scripts, generation hooks, and generated Docker entrypoints were removed. Structural governance fails if that mutation chain reappears.

Projected owner actions and streams revalidate current assignment authority:

```text
owner session
→ exact account + employee + assignment
→ current non-revoked authority version
→ projected assignment/version match
→ command/tool dispatch or scoped stream projection
```

Stream frames carry account, employee, assignment, authority version, and cursor before deltas. Unscoped progress cannot reach the owner stream.

## Commercial effect transaction

```text
immutable request/work revision
→ exact assignment + current commercial authority
→ finite request economics and bounded provider timeout
→ database-owned minute rate token + worst-case budget reservation
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

Key invariants:

- caller-supplied rate-window keys are compatibility metadata and cannot shard shared authority;
- correlation IDs and reservation estimates do not redefine deterministic replay identity;
- malformed token, timeout, price, or provider-usage values cannot introduce `NaN` or false settlement;
- provider acceptance with invalid or lost usage evidence remains ambiguous;
- accepted success requires provider, effect, accounting, output, and proof evidence appropriate to the boundary;
- reconciliation preserves the original command, effect, and provider identity.

## Forward migrations

Migrations `0074` through `0078` establish:

- shared rate windows and request reservations;
- settlement, release, immutable adjustments, refunds, and conservation;
- accepted effect/accounting continuity;
- proof projection and repair queues;
- ambiguity, reconciliation, and lineage views;
- database-owned minute-window authority;
- forward-only repair of the PL/pgSQL rate-window conflict-target namespace collision.

Applied migrations remain immutable. The current source head is derived by the migration ledger and recorded only in `../CODEGRAPH.md`.

## Golden work boundary

Website, Contractor Office, and Bookkeeping share one grammar:

```text
immutable revision
→ validation
→ exact approval snapshot
→ one publication effect
→ accepted receipt
→ output bound to revision and effect
→ owner proof projection
→ replay-safe repair and restart refinding
```

Provider-backed execution and restart refinding remain external acceptance.

## Locally reproducible proof surface

The candidate workflow executes, on one exact branch head:

```bash
python decision/trace007/compute.py
npm run test:repo-governance
npm run typecheck
npm run test:production-boundary
npm run repo:verify:quick
npm run repo:verify:full
npm run test:unit
npm run build
npm run db:migrate
npm run db:verify:commercial-effect-migrations
npm run test:integration
```

Artifact upload is diagnostic only; command exit status and retained evidence-file existence are the gates.

## External prerequisites

- disposable managed-platform migration, security, trigger, advisor, backup, and rollback proof;
- live remote MCP/OAuth and shipped connector setup, scope change, revocation, outage, repair, and deletion;
- provider request-ID, idempotency, timeout, accepted-response-loss, and original-effect reconciliation;
- payer, beneficiary, entitlement, usage, cost, invoice, refund, suspension, and reactivation lifecycle;
- fixture-free Website, Contractor Office, and Bookkeeping journeys with restart proof refinding;
- target-host secret custody, employee isolation, lifecycle replacement, fault injection, rollback, backup/restore, telemetry, and signed release;
- supported-browser/channel, accessibility, capacity/fairness, pilot, deployment, and production gates.
