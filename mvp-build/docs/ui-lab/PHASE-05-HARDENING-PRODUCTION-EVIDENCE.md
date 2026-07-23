# Phase 05: Hardening Production Evidence

## Purpose
Harden UI Lab into production evidence workflows and define external acceptance gates.
## Prerequisite Merged-Main Evidence
Phase 4 merged with exact-head replay, route, and no-effect-replay verification.
## Authority Queries
`repoctl query evidence --claim ui-lab-production`; `repoctl query authority --entity production`.
## Invariants
P3 remains distinct from P4; production acceptance requires retained external proof.
## Source Entry Points
UI Lab routes, browser acceptance scripts, production-readiness ledger, release evidence.
## In-Scope Paths
Acceptance scripts, evidence ledger updates, manual accessibility checklist, docs.
## Out-of-Scope Paths
Provider feature work, database schema changes, target-host destructive recovery unless separately tasked.
## Candidates And Rejected Alternatives
Candidate: exact-head browser and external acceptance matrix. Rejected: declaring production-ready from CI/source.
## Maximum Patch Envelope
32 files across evidence scripts, docs, tests, and ledgers.
## Effect Frontier
Browser scripts, release evidence, CODEGRAPH, memory, production readiness program.
## Predictions And Falsifiers
Prediction: evidence classes remain non-promoting. Falsifier: a P3 check is labeled P4.
## Contracts And Tests
Evidence redaction, exact SHA binding, accessibility/manual gates, no fixture-free claim from fixtures.
## Browser Acceptance
Run authenticated live browser journey on target environment and retain redacted proof.
## Argv Verification
`npm run repo:verify:full`; `npm run test:unit`; `npm run build`; production browser acceptance argv when available.
## Evidence Class
P4 only for retained external/provider/deployment/manual acceptance; otherwise P3.
## Blockers
Provider credentials, production deployment, target-host readiness, manual accessibility reviewer.
## Rollback
Withdraw production claim and keep Phase 1-4 local workbench available.
## Stop Conditions
Any unredacted secret, stale SHA, fixture substitution, or failed external gate.
## Docs Reconciliation
Update CODEGRAPH, authority-map, memory, resolution ledger, and UI Lab README.
## Exact One-Line Future Prompt
Implement UI Lab Phase 5 hardening and production evidence without promoting P3 checks to P4.
