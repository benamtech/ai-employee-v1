# AGENTS.md — AI Employee implementation rules

Status: active
Updated: 2026-07-18

> Tool-agnostic mirror of `CLAUDE.md`. Keep both files synchronized except for the heading note.

This is `mvp-build/`, the implementation home for AMTECH's AI Employee. The owner experiences one employee; Manager is invisible control-plane infrastructure and Hermes is the agent substrate.

## Read order

1. `../identity.md`
2. `CODEGRAPH.md`
3. `memory/MEMORY.md`, then the newest relevant handoff
4. `STANDARD.md`
5. `second-half-plan/phase-2-standard-remediation-execution.md`
6. this file or `CLAUDE.md`
7. `docs/production-normal-employee-live-deploy-runbook.md` for deployment/live work
8. relevant source, migrations, scripts, tests, proofs, and release records

Source, migrations, executable proof, and newest memory outrank stale prose.

## Current status

- Integration branch: `employee-production-tuesday`, based on `research`.
- Integration PR: draft `#23`.
- Overall: `standard-remediation_in-progress_source-and-ci-evidence_not-live-accepted_not-launch-cleared`.
- Lane 1 relationship/authorization checkpoint is integrated.
- Lane 3 durable command/effect kernel is CI-green on draft PR `#26` and awaits integration.
- Real Supabase, provider, browser/SMS, commercial, capacity, recovery, rollback, attestation, and production acceptance remain pending.

## Canonical product boundary

Current governed launch surfaces are web, SMS, signed review, and connected-system events. Voice is a future extension and not a launch gate.

```text
trigger
-> authenticated principal
-> assignment and grant resolution
-> durable intent
-> atomic command claim
-> Hermes or deterministic work
-> approval when required
-> bounded external effect
-> durable accepted, failed, or ambiguous receipt
-> role-safe surface
-> audit, metering, repair, and release proof
```

The public estimator, fixtures, `/api/dev/login`, local `live:*`, and manually injected provider results are diagnostics only.

## Acceptance vocabulary

- `source-wired`: code/schema/config exists; name checks actually run.
- `ci-accepted`: the named CI gate passed on the named SHA.
- `real-supabase-accepted`: the actual database target passed migration and behavior checks.
- `runtime-accepted`: real host/runtime proof exists.
- `provider-accepted`: real external-provider IDs exist.
- `browser/channel-accepted`: fixture-free web/SMS proof exists.
- `commercial-accepted`: usage, payer/beneficiary, provider cost, and invoice reconciliation passed.
- `production-ready`: every non-waivable Standard gate passes on the exact deployed SHA.

## Non-negotiables

1. Every consequential path resolves an authenticated principal and explicit assignment or approved platform/system context.
2. Account membership, bearer possession, caller-selected IDs, mutable headers, and phone ownership are not complete authority.
3. Stable retries cannot create conflicting commands or duplicate irreversible effects.
4. Consequential success requires a matching durable accepted receipt; ambiguity remains durable and repairable.
5. Provider master credentials never enter employee profiles or employee runtimes.
6. Customer-, money-, reputation-, credential-, and destructive actions use assignment-aware approval.
7. Webhooks verify provider authenticity before durable insertion and asynchronous processing.
8. Manager API authority and host lifecycle authority remain separated by the signed host-private provisioner boundary.
9. No browser-readable database surface is added without Data API, RLS, grant, and cross-assignment review.
10. Public claims and release state never exceed evidence bound to the exact SHA.

## Dependency order

1. Lane 3 durable command/effect kernel.
2. Complete Lane 1 assignment and authorization scope.
3. Lane 10 full CI and release evidence spine.
4. Sessions, approvals, admin/support, and onboarding identity saga.
5. Commercial gateway, connector custody, channel envelope, and worker adaptation.
6. Product surfaces, 100–700 agent capacity, recovery, and public-service limits.
7. Real Supabase, live web/SMS/provider proof, commercial reconciliation, attestation, deployment, acceptance, and rollback proof.

Do not jump to downstream consumers that would invent feature-local authority or effect semantics.

## Working rules

- Inspect source and the applicable contract before editing.
- Correct flawed tests or acceptance vectors before implementation.
- Prefer the smallest coherent change that closes an invariant without hiding a failed gate.
- Adapt existing reconciler, inbox, gateway, provider, provisioning, and owner-surface machinery to shared contracts rather than replacing it.
- Use targeted checks during lane work, then run required integrated and release gates at the declared checkpoint.
- Do not repeat old pass counts as current proof unless rerun.

Normal local baseline:

```bash
npm run typecheck
npm run test:unit
npm run build
npm run lint
npm run test:integration   # environment-gated
```

## Memory protocol

After substantial multi-file work, a phase checkpoint, incident, or architectural/product-direction change:

1. write a dated handoff in `memory/`;
2. update `memory/MEMORY.md` newest-first;
3. record exact validation and SHA, or explicitly state what was not run;
4. keep factual implementation/proof state synchronized with CODEGRAPH and release records.

## Git

Work only on the explicitly selected branch. Keep specialist lanes narrow, preserve `main`, and merge through `employee-production-tuesday` only after required checks pass and documentation/proof is synchronized.
