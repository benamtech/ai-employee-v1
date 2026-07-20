# Ratified Standard Production Program

Status: **active and canonical**  
Program state: **post-cutover main baseline**  
Gate 0: **resolved for declared source/document/CI scope on final cutover head**  
Updated: 2026-07-20  
Task families: `AMTECH-P0-GOV-001`, `AMTECH-P0-DOC-002`, `AMTECH-P0-ONB-001`, `AMTECH-P0-PLAN-003`  
Current integration baseline: `main@5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`  
Final cutover evidence head: `d131dd09e216fc9dcf0444afd1eb1494194f52eb`  
Historical cutover PR: merged `#23`  
Standard: [`../../../STANDARD.md`](../../../STANDARD.md)  
Evolution vector: [`../../../validation/standard-v0.2-evolution-vector.json`](../../../validation/standard-v0.2-evolution-vector.json)

## Authority

This folder is the single active production program. Predecessor remediation, capability-closure, historical phase, and wiki plan files remain point-in-time evidence, not current execution authority. The merged `employee-production-tuesday` branch is historical cutover context; new work starts on reviewed task branches from current `main`.

## Product target

AMTECH installs governed persistent AI Employees. The moat is the reusable labor protocol joining identity/assignments, capability discovery, connector custody, work objects/generated views, approvals/effects, recovery/proof/commercial attribution, and bounded MCP, MCP Apps, AG-UI, Web, SMS, and signed-Review adapters.

Gmail, QuickBooks, and Stripe are shipped adapters. They are not the connector ontology.

## Current evidence state

- Standard v0.2 is ratified and migration head is `0072`.
- PR `#23` merged the cutover into `main` at `5e5b8d7`; final reviewed head `d131dd09` passed:
  - Ratified Standard and Production Plan Integrity — `29717830698`;
  - Hermes Upstream Review — `29717830703`;
  - Main Integration Gates — `29717830737`.
- Gate 0 governance/document/contributor/source scope is CI-accepted on the final cutover head, not live-accepted.
- Connector identity, custody, setup, tool ownership, and readiness are manifest-driven.
- Direct MCP denies omitted or uncertain risk metadata.
- Local/CI PostgreSQL is the routine database TDD loop; managed Supabase remains selective platform/release evidence.
- The broad historical `npm run test:unit` aggregate remains explicitly red on the cutover evidence head: PR `#23` records 30 files and 112 failed tests from pre-ratification assignment, principal, fake-RPC, and environment fixtures. Curated green gates do not prove the broad aggregate.
- Target-host, managed-platform, live connector/provider, fixture-free golden work, commercial, recovery, rollback, accessibility, capacity, deployment, and launch acceptance remain open.
- The product is not launch-cleared.

## Canonical execution route

1. [`04-dependency-ordered-production-plan.md`](04-dependency-ordered-production-plan.md) — sole phased roadmap: Phase 1.1 through 1.9, exact release candidate, controlled pilot, and measured expansion.
2. [`08-production-issue-vector.json`](08-production-issue-vector.json) and [`08-production-issue-vector.md`](08-production-issue-vector.md) — scored issue source and human view.
3. [`09-workstream-execution-map.md`](09-workstream-execution-map.md) — dependencies, acceptance evidence, tests, prerequisites, stop conditions, and completion definitions.
4. [`10-test-suite-disposition.md`](10-test-suite-disposition.md) — current test authority and normalization contract.
5. [`07-verification-and-handoff-matrix.md`](07-verification-and-handoff-matrix.md) — evidence state and exact candidate rules.

## Current dependency order

1. **Phase 1.1 — repository authority and test-contract truth.** Repair post-merge metadata and the broad red aggregate before feature expansion.
2. **Phase 1.2 — connector/protocol/capability truth.** Remote MCP authorization, MCP Apps, AG-UI, and effective capability reconciliation.
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
- After three failed attempts, preserve diagnostics and escalate.
- Fixtures, local PostgreSQL, old hosts, manually injected outcomes, ancestor SHAs, and the public estimator cannot satisfy live boundaries they did not exercise.
- Browser/protocol UI never creates authority.
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
