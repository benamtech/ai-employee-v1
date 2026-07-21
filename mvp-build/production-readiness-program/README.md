# AMTECH Production Readiness Program

Status: **active and canonical**  
Canonical path: `mvp-build/production-readiness-program/`  
Updated: 2026-07-20  
Current integration baseline: `main@48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Current stacked base: PR `#34` exact head `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a`  
Current WS-06/07 source candidate: PR `#35`, migration head `0075`

New work starts from current main or an explicitly named reviewed stack. PR #35 is intentionally stacked on PR #34 and does not edit main.

## Authority

This folder is the repository's single current production-readiness program. `mvp-build/second-half-plan/` is historical and non-canonical.

Authority is resolved in this order: deployed release proof; applied durable state; executable source/generated production config; exact-SHA tests and acceptance; ratified Standard and this program; CODEGRAPH/architecture; newest indexed memory; historical records.

PR #34 is the exact owner-runtime base for PR #35. PR #35 establishes only its source candidate until exact evidence exists. It does not establish exact-head CI, live provider or connector acceptance, managed database acceptance, target-host acceptance, fixture-free Web/SMS/Review or golden-work acceptance, pilot acceptance, deployment, or production readiness.

## Product target

AMTECH installs governed persistent AI Employees. The owner experience must preserve exact account, employee, assignment, authority, entitlement, channel, immutable work/request revision, approval snapshot, rate/budget admission, effect, provider receipt, accounting receipt, recovery, output, and proof identity. Manager remains the authority plane; Hermes remains the reasoning/runtime substrate. Web, SMS, signed Review, MCP, MCP Apps, and AG-UI are bounded projections rather than authority.

Gmail, QuickBooks, and Stripe are shipped adapters. They are not the connector ontology.

## Current workstream boundary

- WS-01/02 retain only their exact accepted evidence.
- PR #34/source is current owner-runtime authority for WS-05/06.
- PR #35 implements the WS-07 source transaction: PostgreSQL rate/budget admission, durable request/effect identity, provider ambiguity, accepted effect/accounting continuity, refunds/adjustments, conservation, lineage, and explicit reconciliation.
- PR #35 completes the WS-06 source chain for Website, Contractor Office, and Bookkeeping through an independently repairable owner proof projection.
- PR #35 includes only bounded WS-08 groundwork: crash seams, repair queues, lineage, reconciliation, observability views, focused tests, and exact-head workflow wiring.
- WS-06, WS-07, and WS-08 remain incomplete until their external and exact-candidate gates pass.
- WS-09 remains downstream.
- Source wiring, fixtures, local-only proof, and ancestor-SHA evidence do not satisfy live or production gates.

## Canonical execution route

1. `04-dependency-ordered-production-plan.md` — dependency-ordered roadmap.
2. `08-production-issue-vector.json` and `.md` — issue baseline and current summary.
3. `13-resolution-ledger.json` — closure/control state.
4. `09-workstream-execution-map.md` — workstream completion contracts.
5. `20-ws06-ws08-commercial-effect-transaction.md` — current WS-06/07 source transaction and bounded WS-08 groundwork.
6. `10-test-suite-disposition.md` — test authority and claim boundaries.
7. `07-verification-and-handoff-matrix.md` — exact evidence boundary.
8. `14-ws02-runtime-ui-capability-contract.json` and `15-ws02-capability-manifold/` — bounded WS-02 evidence.
9. `16-ws02-streaming-protocol-source-ci-closure.md` — historical exact WS-02 closure record.
10. `17-ws03-p0-fisher-frontier.md` and `18-ws03-p0-task-contract.json` — guarded WS-03 evidence, subordinate to newer source/PR state.
11. `../decision/trace007/` — active computed WS-06/07/08 candidate frontier and implementation compression.
12. current source, migrations, executable tests, workflows, proof, PRs, and newest indexed memory.

## Decision-space discipline

The active trace retains the useful research method as **evidence-bounded forced dreaming**:

- independent current-defect, feature-emergence, counterfactual, and recombination batches;
- multiple concurrent work/commercial/provider/authority/failure/proof/operator/future spaces;
- genuine multi-way dependencies instead of decorative graph language;
- explicit Unknown and Unsupported penalties;
- joint exploration followed by separate coherent implementation compression.

The method expands possibility space. It does not create authority, relax prerequisites, or promote evidence classes.

## Stop rules

- Do not weaken tests for green.
- Do not infer authority or acceptance from filenames, dates, fixtures, UI labels, source wiring, or stale prose.
- Preserve exact account/employee/assignment/authority/revision/commercial/effect identity across snapshot, stream, reconnect, retry, output, accounting, and proof.
- Shared rate and budget authority cannot be process-local.
- Accepted provider success requires matching effect and accounting receipts.
- Ambiguous outcomes reconcile before retry.
- Repair cannot erase accepted effects or invent completion.
- Cross-account, stale-assignment, stale-entitlement, stale-approval, duplicate, or reordered requests fail closed.
- Fixture state cannot satisfy fixture-free acceptance.
- Do not claim CI, provider, channel, database, target-host, pilot, deployment, or production acceptance without exact evidence on the claimed candidate.
