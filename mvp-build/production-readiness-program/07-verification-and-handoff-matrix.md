# Verification and Handoff Matrix

Status: **active evidence checklist**  
Exact candidate and migration status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision protocol: [`../decision/README.md`](../decision/README.md)

## Evidence classes

```text
decision reproducibility
→ documentation
→ source
→ unit
→ integration
→ exact-candidate CI
→ managed database
→ connector/provider
→ target host/runtime
→ browser/channel/accessibility
→ commercial lifecycle
→ recovery/rollback
→ signed release
→ pilot
→ deployment
→ production
```

A higher class may depend on a lower one. It never inherits acceptance automatically.

## Gate matrix

| Gate | Required evidence |
|---|---|
| decision record | explicit baseline semantics, split topology, equal-feasibility controls, search/weight sensitivity, implementation compression, proof plan, deterministic verifier |
| document authority | one repository contract, one product contract, short compatibility routers, one exact-status owner, historical separation |
| direct Manager source | committed `server.ts`, direct typecheck/build/package/Docker entrypoints, no template/generated/string-patch assembly, structural anti-regression gate |
| source/type/lint/contracts | exact-candidate source and contract checks |
| broad regression | exact-candidate surviving unit and lint suites with no weakened assertions |
| build | exact-candidate production workspace compilation |
| database | blank immutable forward ledger, security, isolation, concurrency, namespace, receipt-chain, and applicable managed-platform proof |
| connector/protocol | live authorization, scope, health, revocation, outage, repair, deletion, client and host conformance |
| owner/channels | fixture-free owner, assignment, connector, current-authority stream, reconnect, Web/SMS/Review convergence |
| golden work | provider-backed Website/Contractor/Bookkeeping revision → approval → effect → receipt/accounting → output/proof → replay/restart |
| commercial ambiguity | multi-replica rate/budget/effect/accounting/reconciliation plus provider and billing proof |
| target host/release | secret custody, isolation, lifecycle, fault, repair, rollback, backup/restore, telemetry, provenance, signed manifest |
| human/capacity/pilot | supported browsers, accessibility, fairness/capacity, pilot entry/exit/incident/rollback |
| production | every non-waivable gate on one exact signed deployed candidate |

Current structural state lives in `../CODEGRAPH.md` and `13-resolution-ledger.json`. Transient SHA, run number, and conclusion live only in GitHub Actions or release records.

## Exact-candidate local matrix

The focused workflow uses the PR branch head, asserts the checkout SHA, and runs:

```text
Trace007 deterministic verifier
→ structural repository governance
→ all workspace typechecks
→ focused WS-01–07 production-boundary units
→ migration ledger and quick contracts
→ full repository verification
→ complete unit regression
→ all production workspace builds
→ blank-ledger migrations
→ commercial migration/security verifier
→ focused WS-07 PostgreSQL matrix
→ complete PostgreSQL integration aggregate
```

Artifact upload is diagnostic. A missing retained log fails the evidence step; artifact-service failure alone does not rewrite command truth.

## Decision handoff

A consequential handoff records:

- tier and protocol revision;
- authority basis and observed/unknown reconciliation;
- exact score schema, orientation, roles, groups, and optional dimensions;
- candidate batches and candidate-graph semantic boundary;
- software invariant vertices, hyperedges, candidate mapping, and touch/fractional/complete/proved coverage;
- one feasible domain shared by full, no-graph, no-diversity, evidence baseline, and random controls;
- search and weight sensitivity;
- selected exploration and separate implementation compression;
- complete behavioral proof plan for every selected software edge;
- implementation ablation status and independent outcomes;
- evidence classes not established.

For Trace007:

```text
Tier: T3
Candidates: 64
Random feasible baselines: 1,024
Search restarts: 32
Weight sensitivity runs: 32
Candidate graph: descriptive
Software invariant graph: descriptive
Diversity: descriptive or selection-influencing
Causal improvement: unestablished
```

Do not duplicate objective snapshots or selected IDs across active documents. The exact verifier output and canonical implementation artifact own those details.

## Source boundary

The current source establishes or intends to establish locally:

- direct typed Manager route composition;
- current assignment and authority-version interception for projected owner actions and streams;
- strict account/employee/assignment/authority-version stream framing and cursor-before-delta ordering;
- shared PostgreSQL rate and worst-case budget admission;
- finite request economics and bounded provider timeout;
- stable request, revision, command, effect, and provider identity;
- accepted, failed, denied, refunded, and durable ambiguous settlement;
- accepted effect-bound accounting and conservation;
- original-effect reconciliation;
- exact artifact revision/approval/effect/output/proof continuity;
- projection repair without republishing;
- reconciliation, repair, and lineage views;
- forward migrations through the source-derived head.

Source and local CI do not establish managed, provider, host, browser, billing, release, pilot, deployment, or production evidence.

## Test and proof rules

- Broad and curated suites are independently reported.
- Decision verification is not runtime verification.
- Candidate-edge touch is not software coverage.
- Software completeness is not proof.
- `software_proved` requires exact accepted behavioral evidence.
- Fixture browser proof is not fixture-free provider/channel proof.
- Local PostgreSQL is not managed-platform proof.
- Provider mocks do not establish provider idempotency or accepted-response-loss behavior.
- `skipped`, unavailable, and blocked remain visible.
- Reconciliation and repair preserve original effect identity and accepted evidence.
- Documentation commits require final exact-candidate checks.

## Handoff transaction

```text
branch/base and source migration head
→ decision verifier and sensitivity output
→ source/migration/test/workflow changes
→ exact candidate commands and results
→ external prerequisites and blocked classes
→ CODEGRAPH/program/architecture update
→ one dated memory handoff
→ MEMORY.md index
→ PR or release record
```

A workstream or release claim is complete only when the decision record, executable implementation, exact-candidate verification, required external evidence, and active documentation agree.
