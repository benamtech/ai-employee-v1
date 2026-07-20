# Ratified Standard Production Program

Status: **active and canonical**  
Program state: **WS-01 source/CI closed; WS-02 provider-authority lock source/CI closed**  
Gate 0: **resolved for declared source/document/CI scope**  
Updated: 2026-07-20  
Task families: `AMTECH-P0-GOV-001`, `AMTECH-P0-DOC-002`, `AMTECH-P0-ONB-001`, `AMTECH-P0-PLAN-003`, `AMTECH-P0-WS01-001`, `AMTECH-P0-WS02-001`  
Current integration baseline: `main@816aae325401a8d8d4bc7ffe90e8f241eb977ba8`  
WS-01/WS-02 implementation evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`  
Standard: [`../../../STANDARD.md`](../../../STANDARD.md)  
Evolution vector: [`../../../validation/standard-v0.2-evolution-vector.json`](../../../validation/standard-v0.2-evolution-vector.json)

## Authority

This folder is the single active production program. Historical phase, remediation, capability-closure, cutover, and wiki plan files remain point-in-time evidence. New work starts on reviewed task branches from current `main`.

## Product target

AMTECH installs governed persistent AI Employees. The moat is the reusable labor protocol joining identity/assignments, capability discovery, connector custody, work objects/generated views, approvals/effects, recovery/proof/commercial attribution, and bounded MCP, MCP Apps, AG-UI, Web, SMS, and signed-Review adapters.

Gmail, QuickBooks, and Stripe are shipped adapters. They are not the connector ontology.

## Current evidence state

- Standard v0.2 is ratified and migration head is `0072`.
- PR `#29` merged the post-cutover roadmap transaction into `main` at `816aae3`.
- WS-01 implementation head `1460960` passed:
  - broad unit: **106 files / 613 tests**;
  - repository governance, typecheck, and lint;
  - named onboarding, assignment, release-evidence, production-boundary, and UI contract suites;
  - production build and repository archaeology;
  - Hermes upstream review on the gateway/profile watched boundary.
- The canonical Main Integration workflow now runs broad unit on pull requests and `main`; the Standard workflow no longer duplicates broad/build execution or historical branch triggers.
- Twenty-seven obsolete pre-assignment/account-owned/direct-provider test files were deleted atomically; no skip list, quarantine, or weakened assertion was introduced.
- Runtime model requests accept only the stable AMTECH alias. Manager resolves the provider profile, HTTPS/loopback endpoint, master credential, and upstream model from one registered host-private policy.
- Caller-supplied provider, profile, upstream model, base URL, API key, headers, token, credential, endpoint, or routing fields fail before dispatch and are audited.
- Signed gateway claims are checked against the current durable credential row, so policy mutation invalidates stale credentials.
- Remote MCP authorization, MCP Apps host conformance, AG-UI replay mapping, persisted effective-capability truth, and live connector lifecycle evidence remain open WS-02 boundaries.
- Target-host, managed-platform, fixture-free provider/channel, commercial, recovery, rollback, accessibility, capacity, deployment, and launch acceptance remain open.
- The product is not launch-cleared.

## Canonical execution route

1. [`04-dependency-ordered-production-plan.md`](04-dependency-ordered-production-plan.md) — phased roadmap and exact-candidate sequence.
2. [`08-production-issue-vector.json`](08-production-issue-vector.json) and [`08-production-issue-vector.md`](08-production-issue-vector.md) — baseline scored issue source.
3. [`09-workstream-execution-map.md`](09-workstream-execution-map.md) — workstream contracts.
4. [`10-test-suite-disposition.md`](10-test-suite-disposition.md) — current test authority and WS-01 closure.
5. [`07-verification-and-handoff-matrix.md`](07-verification-and-handoff-matrix.md) — evidence state and exact-candidate rules.
6. [`12-ws01-ws02-execution-contract.json`](12-ws01-ws02-execution-contract.json) — implementation contract for this closure pass.

## Current dependency order

1. **Phase 1.1 — complete for source/CI scope.** Preserve the canonical broad gate; final live evidence remains outside this phase.
2. **Phase 1.2 — provider-authority lock complete for source/CI; protocol completion remains.** Implement remote MCP authorization, MCP Apps, AG-UI, effective-capability persistence, and live connector lifecycle without reopening caller-selected provider authority.
3. **Phase 1.3 — database authority.** Migrations, RLS/grants, existing rows, concurrency, rollback, and managed-platform triggers.
4. **Phase 1.4 — secret/runtime custody.** Target-host five-service and two-employee isolation/lifecycle proof.
5. **Phase 1.5 — fixture-free owner/channels.** Real identity, assignment, connector, Web/SMS/Review, and recovery journey.
6. **Phase 1.6 — golden governed work.** Three employee roles through approval/effect/receipt/parity/refindable proof.
7. **Phase 1.7 — commercial and ambiguity controls.** Atomic budgets, shared rates, provider ambiguity, and invoice reconciliation.
8. **Phase 1.8 — recovery and signed release.** Fault injection, rollback, observability, SBOM/provenance, and deployment manifest.
9. **Phase 1.9 — human surfaces, capacity, and pilot preparation.** Accessibility, browsers, progress/recovery UX, fairness, and operating packet.
10. **Phases 2–4.** Frozen exact candidate, bounded pilot, then measured 10/100/250/500/700 expansion.

## Stop rules

- Work on reviewed branches from current `main`; merge only after required checks.
- No feature expansion ahead of an unresolved prerequisite P0.
- Every task has success criteria, rubric, tests, blockers, and task-ID commits.
- Tests are not weakened to obtain green.
- Fixtures, local PostgreSQL, old hosts, manually injected outcomes, ancestor SHAs, and the public estimator cannot satisfy live boundaries they did not exercise.
- Browser, model, MCP Apps, AG-UI, or connector content cannot select or mint provider authority.
- Unknown/stale capability evidence fails closed.
- Ambiguous consequential outcomes reconcile before retry.

## Files

- `01-ratification-and-change-control.md`
- `02-standard-evolution-vector.md`
- `03-connector-mcp-apps-ag-ui-program.md`
- `04-dependency-ordered-production-plan.md`
- `05-database-tdd-and-release-proof.md`
- `06-document-authority-and-archive-map.md`
- `07-verification-and-handoff-matrix.md`
- `08-production-issue-vector.json`
- `08-production-issue-vector.md`
- `09-workstream-execution-map.md`
- `10-test-suite-disposition.md`
- `11-task-contract.json`
- `12-ws01-ws02-execution-contract.json`
