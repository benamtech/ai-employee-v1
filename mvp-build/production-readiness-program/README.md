# AMTECH Production Readiness Program

Status: **active and canonical**  
Canonical path: `mvp-build/production-readiness-program/`  
Updated: 2026-07-20  
Current integration baseline: `main@48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Newer source/test authority incorporated: PR `#33` merge `943f2613243ebcbcc9fb703e6273e83a5edc0a24`

New work starts on reviewed task branches from current `main` or an explicitly named stacked dependency.

## Authority

This root-level folder is the repository's single current production-readiness program. `mvp-build/second-half-plan/` is historical and non-canonical. The old second-half plan was superseded by successful prototype work and never established production readiness.

Authority is resolved in this order: deployed release proof; applied durable state; executable source/generated production config; exact-SHA tests and acceptance; ratified Standard and this program; CODEGRAPH/architecture; newest indexed memory; historical records.

PR #33, current source, and executable tests are newer authority than stale plan-status prose. PR #33 establishes only the exact lifecycle/source/test evidence it contains. It does not establish CI on this branch, live provider or connector acceptance, managed database acceptance, target-host acceptance, fixture-free Web/SMS/Review acceptance, pilot acceptance, or production readiness.

## Product target

AMTECH installs governed persistent AI Employees. The owner experience must preserve exact account, employee, assignment, authority, channel, work revision, approval snapshot, effect, receipt, recovery, and proof identity. Manager remains the authority plane; Hermes remains the reasoning/runtime substrate. Web, SMS, signed Review, MCP, MCP Apps, and AG-UI are bounded projections rather than authority.

Gmail, QuickBooks, and Stripe are shipped adapters. They are not the connector ontology.

## Current workstream boundary

- WS-01 and WS-02 retain only their exact accepted evidence.
- PR #33/source evidence is newer than stale WS-03/WS-04 status prose.
- WS-05 and WS-06 are active production-readiness workstreams, but neither is complete without exact fixture-free, cross-account, channel, provider/effect, receipt, recovery, and proof evidence.
- WS-07, WS-08, and WS-09 remain downstream. They may be inspected as dependencies or future states but are not independently implemented by WS-05/WS-06 work.
- Source wiring, fixtures, local-only proof, and ancestor-SHA evidence do not satisfy live or production gates.

## Canonical execution route

1. `04-dependency-ordered-production-plan.md` — dependency-ordered roadmap.
2. `08-production-issue-vector.json` and `.md` — issue baseline and current summary.
3. `13-resolution-ledger.json` — closure/control state.
4. `09-workstream-execution-map.md` — workstream completion contracts.
5. `10-test-suite-disposition.md` — test authority and claim boundaries.
6. `07-verification-and-handoff-matrix.md` — exact evidence boundary.
7. `14-ws02-runtime-ui-capability-contract.json` and `15-ws02-capability-manifold/` — bounded WS-02 evidence.
8. `16-ws02-streaming-protocol-source-ci-closure.md` — historical exact WS-02 closure record.
9. `17-ws03-p0-fisher-frontier.md` and `18-ws03-p0-task-contract.json` — guarded WS-03 evidence, subordinate to newer source/PR state.
10. current source, migrations, executable tests, workflows, proof, and newest indexed memory.

## Stop rules

- Do not weaken tests for green.
- Do not infer authority or acceptance from filenames, dates, fixtures, UI labels, or stale prose.
- Preserve exact account/employee/assignment/authority identity across snapshot, stream, reconnect, retry, channel, work, approval, effect, receipt, and proof projections.
- Reconnect must not replay accepted owner intent.
- A work object may reach completion only through terminal, receipt-backed evidence; ambiguous outcomes reconcile before retry.
- Cross-account or stale-assignment requests fail closed.
- Fixture state cannot satisfy fixture-free acceptance.
- Do not claim CI, provider, channel, database, target-host, pilot, or production acceptance without exact evidence on the claimed candidate.
