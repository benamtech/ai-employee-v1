# CLAUDE.md — AMTECH AI Employee repository instructions

Status: active  
Updated: 2026-07-19

Read `identity.md` first. Root `AGENTS.md` contains the tool-agnostic mirror of these repository rules. The nearest scoped `CLAUDE.md`, `AGENTS.md`, and `CODEGRAPH.md` govern work inside a subtree.

## Repository purpose

This repository contains:

1. the AMTECH AI Employee product implementation in `mvp-build/`;
2. the company/product brain and historical rationale in `wiki/`;
3. supporting product, design, and operating documents in `docs/`.

The former `GTM-RESEARCH/website-framework/` workspace moved to the independent `benamtech/hyper-site` repository. It is not part of AI Employee architecture, execution, CI, release proof, or documentation authority.

## Canonical product and offer

AMTECH installs persistent AI Employees for owner-operated small businesses. The owner experiences one employee through governed web, SMS, signed review, and connected-system events. Voice is a future extension, not a launch gate.

Canonical offer:

- Start Free;
- Managed AI Employee from $400/month;
- Workforce at custom pricing.

The public estimator is outdated and non-canonical.

## Mandatory product-work read order

1. `identity.md`
2. root `CODEGRAPH.md`
3. `mvp-build/AGENTS.md` or `mvp-build/CLAUDE.md`
4. `mvp-build/CODEGRAPH.md`
5. `mvp-build/memory/MEMORY.md`, then the newest relevant handoff
6. `mvp-build/STANDARD.md`
7. `mvp-build/second-half-plan/phase-2-standard-remediation-execution.md`
8. `mvp-build/docs/architecture/README.md`
9. `mvp-build/docs/architecture/11-agent-orientation-and-role-map.md`
10. applicable UX, deployment, source, migrations, tests, workflow, proof, and release files

Source, applied migrations, executable proof, and newest scoped memory outrank stale prose.

## Current branch state

- Integration branch: `employee-production-tuesday`.
- Base: `research`.
- Integration PR: draft `#23`.
- Migration head: `0069`.
- `main` is not the integration or release shortcut.
- Current exact proof anchor and workflow IDs live in root/scoped CODEGRAPH, the newest handoff, and PR `#23`.
- Real Supabase, live runtime, provider, fixture-free browser/SMS/Review, commercial reconciliation, capacity/fairness, crash recovery, rollback, deployment attestation, and production acceptance remain separate live gates unless exact evidence says otherwise.

## Runtime architecture rule

Stay as close to Hermes runtime as possible. Hermes remains the agent substrate for execution, transcript/session continuity, streaming, recovery, rotation, materialization, and memory behavior. Manager adds identity/assignment authority, durable command/effect semantics, credential custody, approval, revocation, accounting provenance, repair, and release proof. Do not build a parallel agent runtime when an existing Hermes capability can be constrained or adapted.

## Agent-role rule

For substantial work, name one primary role and its interacting subsystems using `mvp-build/docs/architecture/11-agent-orientation-and-role-map.md`. A role defines the source hubs, invariants, and validation surface; it does not grant authority to ignore neighboring systems.

Trajectory artifacts in `mvp-build/docs/architecture/trajectories/` are useful only for dependency ordering, interaction analysis, hard-wall checks, and testable bifurcation warnings. They do not override source, grant runtime authority, or promote production acceptance.

## Working rules

- Inspect before editing.
- Correct a flawed acceptance contract before implementing against it.
- Keep specialist lanes narrow and dependency-ordered.
- Preserve existing production-like Manager, Hermes, reconciler, inbox, provider, owner-surface, materialization, session, recovery, and deployment machinery; adapt it to shared contracts rather than rebuilding parallel platforms.
- Every consequential path resolves principal, assignment or approved platform/system context, policy, bounded effect, durable receipt, and audit/commercial provenance.
- Never claim acceptance from source wiring, fixtures, old runs, confidence, trajectory scores, or documentation-only SHAs.
- Update the nearest CODEGRAPH and durable memory after substantial architectural or implementation work.
- Keep public claims synchronized with the exact deployed and proven SHA.

## Validation vocabulary

- `source-wired`: code/schema/config exists; name the checks that ran.
- `ci-accepted`: the named CI gate passed on the named SHA and scope.
- `real-supabase-accepted`: the approved database target passed migration and behavior checks.
- `runtime-accepted`: real host/runtime proof exists.
- `provider-accepted`: real external provider IDs exist.
- `browser/channel-accepted`: fixture-free web/SMS/signed-review proof exists.
- `commercial-accepted`: usage, payer/beneficiary, provider cost, and invoice reconciliation passed.
- `production-ready`: every non-waivable Standard gate is green on the exact deployed SHA.

## Documentation and memory

- Root `CODEGRAPH.md` owns repository-level current state and routing.
- `mvp-build/CODEGRAPH.md` owns implementation topology, migration head, current proof boundary, and next dependency gates.
- `mvp-build/memory/MEMORY.md` is the sole handoff index.
- `mvp-build/docs/architecture/12-document-control-memory-and-handoff-map.md` defines document families and synchronization rules.
- Historical handoffs and implementation records remain point-in-time evidence; do not silently repeat them as current state.

## Git discipline

Work only on the explicitly selected branch. Preserve lane scope, avoid force updates, and merge through the integration branch only after required checks pass and current documentation/proof is synchronized.
