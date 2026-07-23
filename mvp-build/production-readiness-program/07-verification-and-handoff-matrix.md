# Verification and Handoff Matrix

Status: **active evidence checklist**  
Updated: 2026-07-23  
Exact structural status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision state: [`../decision/active.json`](../decision/active.json)  
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
→ trusted signed release
→ pilot
→ deployment
→ production
```

A higher class may depend on a lower one. It never inherits acceptance automatically. Source-built signing and independent verification are not the same evidence class as trusted production signing, registry retention, or deployment.

## Gate matrix

| Gate | Required evidence |
|---|---|
| decision record | proportional tier; authority/Unknown extraction; baseline; topology only when useful; equal-feasibility controls; sensitivity; separate implementation compression; proof plan; deterministic reproduction |
| document authority | repository and product contracts; `authority-map.json`; `decision/active.json`; one exact-status owner; historical/completed-trace separation; indexed handoff |
| direct Manager source | committed `server.ts`; direct typecheck/build/package/Docker entrypoints; no template/generated/string-patch assembly; structural anti-regression gate |
| source/type/lint/contracts | exact-candidate source, generated-registry, architecture, security, UI, and contract checks |
| broad regression | exact-candidate broad unit/lint suites with no weakened assertions |
| build | all production workspaces compile; UI production build and generated registries agree |
| local database | blank immutable ledger through source head; RLS; grants; security-definer; isolation; concurrency; namespace and receipt-chain tests |
| release-build identity | canonical Compose; five exact-SHA images; image identity; manifest recomputation; independent signature verification |
| managed database | disposable managed application; existing-row/backfill; security/advisors; backup/restore and rollback evidence |
| connector/protocol | live authorization, scope, health, refresh/expiry, revocation, outage, repair, deletion, client and host conformance |
| owner/channels | fixture-free owner, assignment, connector, current-authority stream, reconnect, Web/SMS/Review convergence |
| golden work | provider-backed Website/Contractor/Bookkeeping revision → approval → effect → receipt/accounting → output/proof → replay/restart |
| commercial ambiguity | multi-replica rate/budget/effect/accounting/reconciliation plus provider and billing proof |
| target host/recovery | secret custody, isolation, lifecycle, fault, repair, rollback, backup/restore, telemetry, accepted-work conservation |
| browser/accessibility | supported Chromium/Firefox/WebKit/mobile-Safari plus keyboard, screen-reader, zoom, focus, reflow, reduced-motion, and human visual review |
| capacity/pilot | representative fairness/noisy-neighbor/SSE measurement and pilot entry/exit/incident/rollback/customer-exit packet |
| production | every non-waivable gate on one exact trusted-signed deployed candidate |

Current structural state lives in `../CODEGRAPH.md` and `13-resolution-ledger.json`. Transient SHA, run number, and conclusion live only in the current PR, GitHub Actions, or retained release records.

## Current exact-candidate matrix

The cumulative branch workflows assert the pull-request head SHA and currently compose:

```text
Trace007 / Trace008 / Trace009 / Trace010 deterministic checks where applicable
→ agentic and structural repository governance
→ migration ledger and generated-contract parity
→ all workspace typechecks and lint
→ focused production-boundary, UI-port, UI-Lab, UI-variant, release, recovery, connector, and commercial units
→ complete broad unit regression
→ all production workspace builds
→ blank-ledger migrations
→ commercial migration/security verifier
→ focused and complete PostgreSQL integration aggregate
→ canonical production Compose validation
→ five exact-SHA image builds
→ image-identity inspection
→ independent release-manifest recomputation and signature verification
```

Artifact upload is diagnostic. A missing required retained log fails the evidence step; artifact-service failure alone does not rewrite an already completed command conclusion.

The last verified ancestor cannot certify documentation or merge descendants. Every stack merge requires new exact-head CI.

## Current stack handoff

```text
PR #40 exact head green
→ merge into PR #35 head branch
→ verify new PR #35 exact head
→ merge into PR #34 head branch
→ verify new PR #34 exact head
→ mark PR #34 ready as the single integration into main
```

The historical PR #35 coordinate is red. It is not independently promoted before PR #40’s cumulative repair is merged into it.

## Decision handoff

A consequential handoff records:

- tier and protocol revision;
- authority basis and observed/unknown reconciliation;
- score schema and orientation when scoring is used;
- baseline roles and semantic groups when weighted comparison is used;
- candidate batches and candidate-graph semantic boundary;
- software-invariant vertices, genuine hyperedges, candidate mapping, and touch/fractional/complete/proved coverage;
- one feasible domain shared by compared controls;
- search and weight sensitivity;
- selected exploration and separate implementation compression;
- complete behavioral proof plan or explicit blocker for each selected software edge;
- implementation ablation status and independent outcomes;
- evidence classes not established.

Eigenvectors, centrality, spectral gaps, graph density, ranking changes, objective differences, and represented nodes remain descriptive or selection-supporting unless independent implementation outcomes establish more.

Trace012 is the latest completed trace. No transaction is currently open. Trace013 begins only on the next branch with new authority extraction and computation.

## Source boundary

The cumulative source establishes or intends to establish locally:

- direct typed Manager route composition;
- current assignment and authority-version interception for projected owner actions and streams;
- strict account/employee/assignment/authority-version stream framing and cursor-before-delta ordering;
- provider-neutral connector discovery, setup, lifecycle, revoke/reconnect, and exact conversational decisions;
- shared PostgreSQL rate and worst-case budget admission;
- finite request economics and bounded provider timeout;
- stable request, revision, command, effect, and provider identity;
- accepted, failed, denied, refunded, and durable ambiguous settlement;
- accepted effect-bound accounting and conservation;
- original-effect reconciliation;
- exact artifact revision/approval/effect/output/proof continuity;
- projection repair without republishing;
- reconciliation, repair, rollback, restore, and proof-refinding views;
- forward migrations through `0082`;
- one production UI projection path plus neutral folder-first UI variants;
- five image identities and independently verified source-built release metadata.

Source and local CI do not establish managed, live provider, target-host, fixture-free channel, billing, manual accessibility, representative capacity, trusted production signing, pilot, deployment, or production evidence.

## Test and proof rules

- Broad and curated suites are independently reported.
- Decision verification is not runtime verification.
- Candidate-edge touch is not software coverage.
- Hypergraph node or edge representation is not behavioral proof.
- `software_proved` requires exact accepted independent behavioral evidence.
- Fixture browser proof is not fixture-free provider/channel proof.
- A UI-variant doctor or screenshot is not aesthetic or accessibility approval.
- Local PostgreSQL is not managed-platform proof.
- Provider mocks do not establish provider idempotency or accepted-response-loss behavior.
- Source-built image/signature verification is not target-host, registry, trusted-signing, or deployment acceptance.
- `skipped`, unavailable, and blocked remain visible.
- Reconciliation and repair preserve original effect identity and accepted evidence.
- Documentation and merge commits require final exact-candidate checks.

## Handoff transaction

```text
branch/base and source migration head
→ decision state and applicable verifier/sensitivity output
→ source/migration/test/workflow changes
→ exact candidate commands and results
→ external prerequisites and blocked classes
→ CODEGRAPH/program/architecture update
→ one dated memory handoff
→ MEMORY.md index
→ PR or release record
```

A workstream or release claim is complete only when the decision record when required, executable implementation, exact-candidate verification, required external evidence, and active documentation agree.
