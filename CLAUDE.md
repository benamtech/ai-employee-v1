# CLAUDE.md — AMTECH AI Employee repository instructions

Status: active
Updated: 2026-07-18

Read `identity.md` first, then `CODEGRAPH.md`. `AGENTS.md` contains the tool-agnostic repository rules; the nearest scoped `CLAUDE.md`, `AGENTS.md`, and `CODEGRAPH.md` govern work inside a subtree.

## Repository purpose

This repository contains:

1. the AMTECH AI Employee product implementation in `mvp-build/`;
2. the company/product brain and historical rationale in `wiki/`;
3. supporting product and operating documents in `docs/`.

The former `GTM-RESEARCH/website-framework/` workspace moved to the independent `benamtech/hyper-site` repository. It is not part of the AI Employee architecture, execution plan, CI, release proof, or documentation authority.

## Canonical product and offer

AMTECH installs persistent AI Employees for owner-operated small businesses. The owner experiences one employee through governed web, SMS, signed review, and connected-system events. Voice is a future extension, not a launch gate.

Canonical offer:

- Start Free;
- Managed AI Employee from $400/month;
- Workforce at custom pricing.

The public estimator is outdated and non-canonical.

## Production work read order

1. `mvp-build/CODEGRAPH.md`
2. `mvp-build/memory/MEMORY.md`, newest relevant handoff first
3. `mvp-build/STANDARD.md`
4. `mvp-build/second-half-plan/phase-2-standard-remediation-execution.md`
5. the nearest scoped instructions
6. source, migrations, scripts, tests, proof artifacts, and release records

Source, migrations, executable proof, and newest memory outrank stale prose.

## Current branch state

- Integration branch: `employee-production-tuesday`
- Base: `research`
- Integration PR: draft `#23`
- `main` is not the integration or release shortcut
- Lane 1 relationship/authorization checkpoint is integrated
- Lane 3 durable command/effect kernel is integrated at `c94be46137b8c87b610ba0c4b48302bb2e944564` with green contract, migration, command/effect matrix, and relationship-regression CI
- Production, real Supabase, provider, browser/channel, commercial, capacity, recovery, rollback, and release acceptance remain pending until exact proof exists

## Working rules

- Inspect before editing.
- Correct a flawed acceptance contract before implementing against it.
- Keep specialist lanes narrow and dependency-ordered.
- Preserve existing production-like Manager, Hermes, reconciler, inbox, provider, and owner-surface machinery; adapt it to shared contracts rather than rebuilding parallel platforms.
- Every consequential path resolves principal, assignment or approved platform/system context, policy, bounded effect, durable receipt, and audit/commercial provenance.
- Never claim acceptance from source wiring, fixtures, old runs, or confidence.
- Update the nearest CODEGRAPH and durable memory after substantial architectural or implementation work.
- Keep public claims synchronized with the exact deployed and proven SHA.

## Validation vocabulary

- `source-wired`: code/schema/config exists; name checks actually run.
- `ci-accepted`: the named CI gate passed on the named SHA.
- `real-supabase-accepted`: the actual database target passed migration and behavior checks.
- `runtime-accepted`: real host/runtime proof exists.
- `provider-accepted`: real external provider IDs exist.
- `browser/channel-accepted`: fixture-free web/SMS proof exists.
- `commercial-accepted`: usage, payer/beneficiary, provider cost, and invoice reconciliation passed.
- `production-ready`: every non-waivable Standard gate is green on the exact deployed SHA.

## Git discipline

Work only on the explicitly selected branch. Preserve lane scope, avoid force updates, and merge through the integration branch only after required checks pass and current documentation/proof is synchronized.
