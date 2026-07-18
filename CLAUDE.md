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
- Current implementation proof anchor: `a9184be1af68ed6c5372d642928db46b51eb0506`
- Branch-level status: `standard-remediation_s2-s9-branch-ci-postgres-image-accepted_not-live-accepted_not-launch-cleared`
- Lane 1 relationship/authorization and Lane 3 durable command/effect foundations are integrated
- S5 connector custody, S6 commercial attribution, S7 approval authority, source-wired S8 platform-admin authority, and S9 authority-version revocation are present on the integration branch
- Owner web turns use C3 around the existing Hermes runtime path; ambiguous Hermes turn jobs are repairable without a second effect
- New signed preview/action credentials require one exact assignment and carry current authority versions
- Generated Manager routing and the production Manager image build are green at the implementation proof anchor
- Real Supabase, live runtime, provider, fixture-free browser/SMS, commercial reconciliation, capacity, recovery, rollback, deployment, and production acceptance remain pending

Exact implementation-head Actions:

- Phase 2 Remediation Plan Integrity `29662757178`: success
- Lane 1 Relationships and Authorization `29662757194`: success
- S2 S7 S9 Production Boundary `29662757252`: success
- Lane 10 Integrated CI and Release Evidence `29662757197`: success
- Employee Work Production Boundary `29662757204`: success

The detailed branch checkpoint is `mvp-build/memory/2026-07-18-s2-s9-authority-runtime-checkpoint.md`.

## Runtime architecture rule

Stay as close to Hermes runtime as possible. Hermes remains the agent substrate for execution, transcript/session continuity, streaming, recovery, rotation, materialization, and memory behavior. Manager adds authority, durable command/effect semantics, credential custody, approval, revocation, accounting provenance, repair, and release proof. Do not build a parallel agent runtime when an existing Hermes capability can be constrained or adapted.

## Working rules

- Inspect before editing.
- Correct a flawed acceptance contract before implementing against it.
- Keep specialist lanes narrow and dependency-ordered.
- Preserve existing production-like Manager, Hermes, reconciler, inbox, provider, owner-surface, materialization, session, recovery, and deployment machinery; adapt it to shared contracts rather than rebuilding parallel platforms.
- Every consequential path resolves principal, assignment or approved platform/system context, policy, bounded effect, durable receipt, and audit/commercial provenance.
- Never claim acceptance from source wiring, fixtures, old runs, confidence, or documentation-only SHAs.
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
