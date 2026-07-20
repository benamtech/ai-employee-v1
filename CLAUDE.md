# CLAUDE.md — AMTECH AI Employee repository instructions

Status: active  
Updated: 2026-07-19

Read `identity.md` first. Root `AGENTS.md` is the tool-agnostic mirror and contains the complete company engineering rules. The nearest scoped `CLAUDE.md`, `AGENTS.md`, and `CODEGRAPH.md` govern their subtree.

## Repository purpose

This repository contains:

1. the AI Employee product implementation under `mvp-build/`;
2. historical rationale and implementation records under `wiki/`;
3. supporting company/product/design documents under `docs/`.

Hyper Site moved to `benamtech/hyper-site` and is not AI Employee source or release authority.

## Mandatory product-work read order

1. `identity.md`
2. root `AGENTS.md` and `CODEGRAPH.md`
3. `mvp-build/AGENTS.md` or `mvp-build/CLAUDE.md`
4. `mvp-build/CODEGRAPH.md`
5. ratified `mvp-build/STANDARD.md`
6. `mvp-build/second-half-plan/README.md` and its single active program
7. `mvp-build/memory/MEMORY.md` and newest relevant handoff
8. `mvp-build/docs/architecture/README.md`
9. applicable source, migrations, tests, workflows, proof, and current diff

## Current branch state

- Integration branch: `employee-production-tuesday`.
- Base: `research`.
- Draft PR: `#23`.
- Migration head: `0072`.
- `main` is not an integration or release shortcut.
- Standard v0.2 is ratified and effective.
- Active program: `mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/`.
- Exact current proof head and workflow IDs belong in PR `#23` and the newest indexed handoff after branch movement stops.

## Canonical product and offer

AMTECH installs governed persistent AI Employees for owner-operated businesses. Canonical offer:

- Start Free;
- Managed AI Employee from $400/month;
- Workforce at custom pricing.

The public estimator is outdated and non-canonical.

The product moat is the reusable labor protocol connecting identity, assignments, capabilities, connector manifests, work objects, approvals, durable effects, receipts, recovery, and commercial attribution. Gmail, QuickBooks, and Stripe are adapters rather than the connector ontology.

## Runtime and protocol rule

Hermes owns employee reasoning, runs, transcript/session continuity, memory, tool use, and runtime-local recovery. Manager owns identity, assignments, authority, capability/tool contracts, connector/credential custody, approvals, durable effects, commercial attribution, revocation, repair, and release proof.

MCP core, MCP Apps, and AG-UI are bounded interoperability layers. They do not create assignment authority, durable business state, approval, or external-effect permission.

Unknown or consequential connectors default to Manager mediation. Direct MCP requires explicitly declared read-only, non-money, non-customer-facing risk axes. Owner setup is generated from the managed connector manifest rather than provider/category branches in Web code.

## Engineering rules

- Follow the task contract and `AGENTS.md` standards.
- Never edit `main`.
- Inspect before editing; use `find`/`grep` rather than invented paths.
- No feature expansion while a prerequisite P0 is unresolved.
- Every commit references the task ID.
- Add concise `why` comments at non-obvious authority/safety/failure boundaries.
- Run applicable tests and exact-head CI before completion.
- Stop downstream work on red CI.
- Do not weaken expectations merely to get green.
- After three failed attempts on one concrete step, retain diagnostics and escalate.
- Measure product behavior on this codebase and declared environments, not public coding benchmarks.
- Treat scaffolding, tests, migrations, proof capture, and runbooks as first-class implementation.

## Database policy

Production-shaped local/CI PostgreSQL is the normal TDD loop for migrations, constraints, RLS/grants/functions, negative isolation, concurrency, backfills, and rollback semantics.

Disposable managed Supabase is a platform-specific and release-candidate gate, not the routine schema-development loop. Production is never a test target.

## Evidence vocabulary

`planned`, `source-wired`, `locally-proven`, `ci-accepted`, `database-accepted`, `runtime-accepted`, `provider-accepted`, `browser/channel-accepted`, `commercial-accepted`, `live-accepted`, and `production-ready` are distinct.

Source wiring, fixtures, local PostgreSQL, documentation, old proof, or an ancestor SHA cannot satisfy a live boundary they did not exercise.

## Document authority

- root `CODEGRAPH.md`: repository routing/current integration headline;
- `mvp-build/CODEGRAPH.md`: source topology/migration/evidence boundary;
- `mvp-build/STANDARD.md`: ratified normative requirements;
- `mvp-build/second-half-plan/README.md`: single active plan route;
- `mvp-build/memory/MEMORY.md`: sole handoff index;
- current source, migrations, tests, workflows, and proof: implementation/acceptance authority.

Work only on the explicitly selected branch and merge through the approved integration path after required checks and document/proof synchronization.
