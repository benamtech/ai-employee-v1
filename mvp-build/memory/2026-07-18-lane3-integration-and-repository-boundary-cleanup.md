# 2026-07-18 — Lane 3 integration and repository-boundary cleanup

Status: current handoff
Branch at handoff: `lane/lane3-integration-doc-sync`, based on integration head `c94be46137b8c87b610ba0c4b48302bb2e944564`
Integration branch: `employee-production-tuesday`
Integration PR: draft `#23` targeting `research`

## Goal

Advance the AMTECH Standard remediation in dependency order while removing the now-independent Hyper Site project from the AI Employee repository and repairing stale source-of-truth routing.

## What happened

### 1. Lane 3 acceptance harness was corrected before implementation

The pre-implementation PostgreSQL matrix contained a false concurrency assumption: it expected concurrent effect reservation caller index `0` to win.

Scheduler order is nondeterministic. The correct invariant is:

- 50 concurrent reservations return one unique effect ID;
- exactly one reservation returns `duplicate=false`;
- the other 49 return the same effect ID with `duplicate=true`;
- a changed request hash raises `idempotency_conflict`.

Commit `0a59c6e2195498d4f8657710a730eda583c3b0a3` corrected the harness. Actions run `29642702660` then reproduced the intended RED boundary: contracts and existing migrations passed, while the matrix failed because the reusable kernel tables were absent.

### 2. Durable command/effect kernel was implemented and proven in CI/PostgreSQL

Migration `0041_durable_command_effect_kernel.sql` added:

- stable assignment-scoped command intents;
- immutable durable commands;
- actor, policy, payload-hash, correlation, and causation provenance;
- atomic claims with bounded leases and reclaim;
- one effect reservation per assignment/effect key;
- provider capability classes;
- accepted, failed, and ambiguous receipts;
- receipt-gated command completion;
- deterministic replay without a second effect;
- restricted internal service-role access.

Actions run `29642874619` passed:

- shared command/effect typecheck;
- shared build;
- six contract invariants;
- blank PostgreSQL 17 migration application;
- all seven command/effect database cases.

Relationship/authorization regression run `29642874652` also passed on the same lane head.

PR `#26` merged into `employee-production-tuesday` at `c94be46137b8c87b610ba0c4b48302bb2e944564`.

Acceptance tier: `ci-accepted` and PostgreSQL behavior-accepted for the named scope. Not real-Supabase, runtime, provider, browser/SMS, commercial, capacity, deployment, or production accepted.

### 3. Hyper Site was removed from the AI Employee repository

The user confirmed that the website framework moved to independent repository `benamtech/hyper-site`.

PR `#27` removed:

- the complete `GTM-RESEARCH/website-framework/` subtree;
- `.github/workflows/website-framework-reference.yml`.

It also repaired:

- root `AGENTS.md`;
- root `CLAUDE.md`;
- root `CODEGRAPH.md`;
- root `README.md`;
- `mvp-build/AGENTS.md`;
- `mvp-build/CLAUDE.md`.

PR `#27` merged at `3ec7a5c541fd8d6e6ec074e94f178163c7ec9477`.

No AI Employee product source, migration, runtime, provider, deployment, or production state changed in that cleanup.

## Why Lane 3 had to come first

Downstream sessions, approvals, connectors, billing, workers, and product surfaces all create or authorize consequential work. Without one shared durable kernel, each consumer would invent local semantics for:

- idempotency;
- command identity;
- claims and leases;
- provider effect deduplication;
- accepted versus failed versus ambiguous outcomes;
- replay after lost responses;
- repair after crashes.

That would produce duplicate irreversible effects, false success, incompatible evidence, and expensive rewrites. Correcting the test first was equally necessary: implementing against the caller-index assumption would have made the SQL satisfy a scheduling accident rather than the actual concurrency invariant.

## Repository order after cleanup

Canonical product-work order is now:

1. root control documents;
2. `mvp-build/STANDARD.md`;
3. active Phase 2 remediation plan;
4. `mvp-build/CODEGRAPH.md`;
5. this memory index and newest relevant handoff;
6. shared contracts;
7. database migrations;
8. service/worker consumers;
9. tests and fault matrices;
10. deployment/proof machinery;
11. release state and public claims.

The active code lanes are dependency-ordered. Historical wiki and memory files remain evidence, but current source/proof and newest memory outrank them. Hyper Site is not an authority in this repository.

## Current first next step

Complete Lane 1 assignment and authorization scope across every consequential resource and consumer, while establishing Lane 10’s integrated CI/evidence spine early.

Specific first targets:

- inventory every consequential table, route, SMS path, signed resource, connector binding, owner session, admin/support action, and commercial row;
- bind each to explicit assignment or approved platform/system context;
- eliminate account-membership, bearer-only, mutable-header, phone-only, and caller-selected identity shortcuts;
- extend denial, revocation, latency, and cross-assignment matrices;
- make integrated CI block schema/source mismatch, missing command/effect concurrency proof, stale evidence, and cross-SHA claims.

Only after those foundations are enforced should Lane 2 sessions/approvals/admin and Lane 4 onboarding saga proceed.

## Unresolved risks

- Lane 1 is foundational but incomplete across consumers.
- Current relationship helpers use narrowly scoped `SECURITY DEFINER` functions; privilege design still requires explicit review.
- Lane 3 is not applied to real Supabase and existing workers/providers are not yet migrated to it.
- Production Supabase remains behind the repository migration set.
- No new fixture-free provider, runtime, browser/SMS, commercial, capacity, recovery, rollback, or production proof was produced in this pass.
- Historical documents outside the repaired control layer may still mention older pricing, voice, or website-framework concepts; they are not current authority and require progressive contradiction cleanup when touched.

## Validation and exact state

- Lane 3 RED recapture: Actions `29642702660`.
- Lane 3 green implementation: Actions `29642874619`.
- Relationship regression on Lane 3 head: Actions `29642874652`.
- Repository cleanup merge: `3ec7a5c541fd8d6e6ec074e94f178163c7ec9477`.
- Lane 3 integration merge: `c94be46137b8c87b610ba0c4b48302bb2e944564`.
- No production migration, deployment, provider effect, destructive proof, or release promotion was run.
