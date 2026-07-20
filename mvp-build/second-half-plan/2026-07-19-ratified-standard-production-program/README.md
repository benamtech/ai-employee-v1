# Ratified Standard Production Program

Status: **active and canonical**  
Date: 2026-07-19  
Task family: `AMTECH-P0-GOV-001`, `AMTECH-P0-DOC-002`  
Branch: `employee-production-tuesday`  
Base: `research`  
PR: `#23`  
Standard: `../../../STANDARD.md`  
Evolution vector: `../../../validation/standard-v0.2-evolution-vector.json`

## Authority

This folder is the single active production program for the AI Employee repository.

It supersedes as active execution authority:

- `../phase-2-standard-remediation-execution.md`;
- `../2026-07-20-capability-production-closure/`;
- the historical phase sequence under `../phase-*.md`;
- `wiki/MVP/build-plan-current/`.

Those files remain evidence and subsystem history. They do not define current order or status.

## Product target

AMTECH installs governed persistent AI Employees. The product moat is the reusable labor protocol joining:

- identity and assignments;
- tool and capability discovery;
- connector and credential custody;
- work objects and generated views;
- approvals and external effects;
- recovery, proof, and commercial attribution;
- protocol adapters for MCP, MCP Apps, AG-UI, Web, SMS, and signed Review.

Gmail, QuickBooks, and Stripe are shipped adapters. They are not the connector ontology.

## Current state

- Standard v0.2 is ratified.
- Migration head is `0072`.
- The pre-ratification exact head `ee006c0d8303` passed all eight required workflows.
- The connector/protocol implementation checkpoint `701936ab1ded` passed all eight required workflows.
- Canonical Compose selection is source-wired.
- Connector custody and capability discovery are transport-neutral.
- Owner setup is normalized around a managed connector setup descriptor.
- The product is not launch-cleared.

## Execution order

1. **G0 — Ratification and repository authority**
   - ratify Standard;
   - publish vector/crosswalk and research disposition;
   - reconcile root, scoped, wiki, memory, and PR authority;
   - pass exact-head CI.

2. **P0-A — Protocol and connector conformance**
   - finish manifest-driven setup across OAuth, provider onboarding, managed secrets, direct MCP, and operator installation;
   - add MCP Apps and AG-UI adapters without changing durable authority;
   - prove unknown connectors fail closed.

3. **P0-B — Database TDD closure**
   - close local PostgreSQL migration, RLS, and concurrency behavior matrices;
   - require disposable Supabase only for platform-specific and release-candidate evidence;
   - preserve forward-only migration discipline.

4. **P0-C — Target-host runtime proof**
   - five-service health;
   - Host Provisioner Docker custody;
   - two-employee network, data, and action isolation;
   - replace, recover, and teardown.

5. **P0-D — Fixture-free golden owner journey**
   - real owner identity;
   - capability evidence;
   - managed connector authorization;
   - approval → effect → receipt → owner-refindable proof;
   - Website A manually, then automated;
   - Contractor B and Bookkeeping C.

6. **P1 — Commercial and reliability closure**
   - cumulative budgets;
   - shared rate limits;
   - ambiguous provider reconciliation;
   - crash, repair, and rollback;
   - attestation and deployment manifest.

7. **P1/P2 — Supported-browser, accessibility, capacity, and pilot**
   - cross-browser, accessibility, and visual gates;
   - 100/250/500/700 employee measurements;
   - controlled free and $400 managed pilots after non-waivable gates.

## Global stop rules

- Never edit `main`.
- No feature expansion ahead of an unresolved prerequisite P0.
- Every task has explicit success criteria and task-ID commits.
- No test expectation is weakened to obtain green.
- After three failed attempts on one step, preserve diagnostics and escalate.
- A fixture, source contract, local PostgreSQL test, or previous SHA cannot satisfy a live boundary it did not exercise.
- A live database is not the routine development loop.
- Browser or protocol UI never creates authority.
- Unknown or stale capability evidence fails closed.
- Ambiguous consequential effects reconcile before retry.

## Files

- [`01-ratification-and-change-control.md`](01-ratification-and-change-control.md)
- [`02-standard-evolution-vector.md`](02-standard-evolution-vector.md)
- [`03-connector-mcp-apps-ag-ui-program.md`](03-connector-mcp-apps-ag-ui-program.md)
- [`04-dependency-ordered-production-plan.md`](04-dependency-ordered-production-plan.md)
- [`05-database-tdd-and-release-proof.md`](05-database-tdd-and-release-proof.md)
- [`06-document-authority-and-archive-map.md`](06-document-authority-and-archive-map.md)
- [`07-verification-and-handoff-matrix.md`](07-verification-and-handoff-matrix.md)
