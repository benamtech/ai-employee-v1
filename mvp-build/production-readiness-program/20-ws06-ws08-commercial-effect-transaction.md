# WS-01–08 Cumulative Production Boundary

Status: **source and locally reproducible cumulative candidate; external acceptance remains open**  
Updated: 2026-07-23  
Exact structural status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision state: [`../decision/active.json`](../decision/active.json)  
Primary effect trace: [`../decision/trace007/`](../decision/trace007/)  
Related release/connector/UI traces: [`../decision/trace008/`](../decision/trace008/), [`../decision/trace010/`](../decision/trace010/), [`../decision/trace011/`](../decision/trace011/), [`../decision/trace012/`](../decision/trace012/)

## Claim boundary

This record describes the cumulative production source transaction and locally reproducible proof surface. Exact PR/workflow/release records own transient candidate conclusions. Managed database, live connector/provider, target host, fixture-free channels and golden work, billing lifecycle, destructive recovery, trusted signing, manual accessibility, representative capacity, pilot, deployment, and production remain separate evidence classes.

## Decision semantics

Trace007 remains the primary commercial/effect `T3` record. Later traces extend release, connector, and UI boundaries without rewriting its transaction.

Trace007 includes:

- 64 independently batched candidates;
- explicit score roles, orientation, and grouped evidence baseline;
- a candidate graph for diversity, lineage, redundancy, and sensitivity only;
- a software-invariant hypergraph for touch, fractional, complete, and proved coverage;
- one feasible domain shared by full, no-graph, no-diversity, evidence-baseline, and 1,024 random controls;
- 32 deterministic restarts and 32 weight perturbations;
- separate exploration and implementation compression.

Current mathematical classification across active traces:

```text
candidate graph: descriptive or selection-supporting
software invariant hypergraph: descriptive until independent behavioral proof
spectral/eigenvector measures: descriptive or selection-supporting
causal improvement: unestablished without equal-feasibility implementation outcomes
```

No ranking, eigenvector, objective delta, edge touch, represented node, or complete hyperedge establishes better software or acceptance.

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

## Connector and conversational decision boundary

```text
owner names/selects system
→ Manager-owned authorization or guided setup intent
→ exact assignment binding + credential custody
→ provider-neutral capability discovery
→ harmless use/health evidence
→ event ingress or controlled polling
→ exact work/approval conversation focus
→ Hermes interprets natural language
→ Manager revalidates principal + assignment + approval snapshot + effect
→ one durable resolution and receipt
→ revoke/reconnect lifecycle remains fail-closed
```

MCP Apps, AG-UI, SMS, signed Review, Web, and UI variants remain projections. They do not select provider or approval authority.

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
- reconciliation preserves the original command, effect, and provider identity;
- payer, beneficiary, provider, effect, accounting, and entitlement cannot be caller-selected or silently diverge.

## Forward migrations

Migrations `0074` through `0079` establish and repair:

- shared rate windows and request reservations;
- settlement, release, immutable adjustments, refunds, and conservation;
- accepted effect/accounting continuity;
- proof projection and repair queues;
- ambiguity, reconciliation, and lineage views;
- database-owned minute-window authority;
- forward-only qualification of conflict targets, predicates, and expressions.

Migrations `0080` through `0082` add:

- provider-neutral connector capability, lifecycle, and guided setup records;
- exact assignment-scoped revoke projection;
- verified reconnect normalization and fresh discovery requirements;
- connected lifecycle receipts;
- exact conversational decision context;
- one open SMS decision focus per assignment-bound human, serialized and attached atomically to the delivered work object.

Applied migrations remain immutable. The current source head is derived by the migration ledger and recorded in `../CODEGRAPH.md`.

## Golden work and UI boundary

Website, Contractor Office, and Bookkeeping share one grammar:

```text
immutable revision
→ validation
→ exact approval snapshot
→ one publication/effect
→ accepted | failed | ambiguous receipt
→ output bound to revision and effect
→ owner proof projection
→ replay-safe repair and restart refinding
```

The owner experience may be projected through the production client, presentation adapters, or a folder-first UI variant behind `EmployeeExperienceModelV1`. Presentation cannot rewrite durable truth or authorization.

Provider-backed execution, preview/delivery parity, fixture-free channels, and restart refinding remain external acceptance.

## Release and recovery boundary

The cumulative source/CI candidate includes:

- canonical five-service Compose topology;
- five distinct exact-SHA image identities;
- image identity inspection;
- signed release metadata and independent recomputation/verification;
- deterministic failure states and safe next actions;
- database/filesystem/secret-version backup bundle;
- restore continuity and proof refinding;
- fail-closed rollback compatibility and accepted-work guards.

These are source/CI release-build evidence. Trusted production signing, registry retention, target-host health/isolation, destructive restore/rollback rehearsal, and deployment remain open.

## Locally reproducible proof surface

The cumulative workflows and scripts compose, on one exact branch head:

```bash
python decision/trace007/compute.py
python decision/trace008/compute.py
npm run repo:agentic:check
npm run test:repo-governance
npm run typecheck
npm run test:production-boundary
npm run test:ws07-ws08
npm run repo:verify:quick
npm run repo:verify:full
npm run test:unit
npm run build
npm run db:migrate
npm run db:verify:commercial-effect-migrations
npm run test:integration
node scripts/ui-variant.mjs doctor
```

The release-candidate workflow additionally validates Compose, builds five exact-SHA images, inspects identity, and independently verifies the release manifest.

Artifact upload is diagnostic only; command exit status and required retained evidence existence are the gates. Every documentation or stack merge descendant requires new exact-head verification.

## External prerequisites

- disposable managed-platform migration, security, trigger, advisor, backup, restore, and rollback proof;
- live remote MCP/OAuth and shipped connector setup, refresh, scope change, revocation, outage, repair, and deletion;
- provider request-ID, idempotency, timeout, accepted-response-loss, and original-effect reconciliation;
- payer, beneficiary, entitlement, usage, cost, invoice, refund, suspension, and reactivation lifecycle;
- fixture-free Website, Contractor Office, and Bookkeeping journeys with channel convergence and restart proof refinding;
- target-host secret custody, employee isolation, lifecycle replacement, destructive fault, rollback, backup/restore, telemetry, trusted signing, and registry retention;
- supported-browser/channel, human visual review, manual accessibility, representative capacity/fairness, pilot, deployment, and production gates.
