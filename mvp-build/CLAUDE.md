# CLAUDE.md — AI Employee implementation rules

Status: active
Updated: 2026-07-18

> Tool-specific mirror of `AGENTS.md`. Keep both files synchronized except for the heading note.

This is `mvp-build/`, the implementation home for AMTECH's AI Employee. The owner experiences one employee; Manager is invisible control-plane infrastructure and Hermes is the agent substrate.

## Read order

1. `../identity.md`
2. `CODEGRAPH.md`
3. `memory/MEMORY.md`, then the newest relevant handoff
4. `STANDARD.md`
5. `second-half-plan/phase-2-standard-remediation-execution.md`
6. this file or `AGENTS.md`
7. `docs/production-normal-employee-live-deploy-runbook.md` for deployment/live work
8. relevant source, migrations, scripts, tests, proofs, and release records

Source, migrations, executable proof, and newest memory outrank stale prose.

## Current status

- Integration branch: `employee-production-tuesday`, based on `research`.
- Integration PR: draft `#23`.
- Implementation proof anchor: `a9184be1af68ed6c5372d642928db46b51eb0506`.
- Overall: `standard-remediation_s2-s9-branch-ci-postgres-image-accepted_not-live-accepted_not-launch-cleared`.
- Lane 1 relationship/authorization and Lane 3 durable command/effect foundations are integrated.
- S5 connector custody, S6 commercial attribution, S7 approval authority, source-wired S8 platform-admin authority, and S9 authority-version revocation are present.
- Owner web turns execute through C3 around the existing Hermes runtime path, with durable ambiguity and no-second-effect repair.
- New preview/action links require one exact assignment; owner sessions, Hermes MCP credentials, approvals, preview links, and artifact links enforce current authority versions.
- Generated Manager source and the production Manager image passed the branch production boundary.
- Real Supabase, live runtime, provider, fixture-free browser/SMS, commercial reconciliation, capacity, recovery, rollback, attestation, deployment, and production acceptance remain pending.

Exact implementation-head Actions:

- Phase 2 Remediation Plan Integrity `29662757178`: success
- Lane 1 Relationships and Authorization `29662757194`: success
- S2 S7 S9 Production Boundary `29662757252`: success
- Lane 10 Integrated CI and Release Evidence `29662757197`: success
- Employee Work Production Boundary `29662757204`: success

Read `memory/2026-07-18-s2-s9-authority-runtime-checkpoint.md` for the complete branch handoff and evidence boundary.

## Canonical product boundary

Current governed launch surfaces are web, SMS, signed review, and connected-system events. Voice is a future extension and not a launch gate.

```text
trigger
-> authenticated principal
-> exact assignment or approved platform/system context
-> current relationship, role, grant, policy, and authority version
-> stable durable intent
-> immutable command and atomic claim
-> Hermes or deterministic work
-> approval when required
-> one reserved bounded external effect
-> accepted, failed, or ambiguous durable receipt
-> deterministic replay or repair
-> role-safe surface
-> audit, metering, commercial attribution, revocation propagation, and release proof
```

The public estimator, fixtures, `/api/dev/login`, local `live:*`, and manually injected provider results are diagnostics only.

## Hermes preservation rule

Stay as close to Hermes runtime as possible.

Hermes owns agent execution, transcript/session continuity, streaming, recovery, rotation, employee-local materialization, and memory behavior. Manager owns authority, durable command/effect semantics, credential custody, approvals, revocation, commercial provenance, repair, and release evidence.

Do not create a parallel runtime, transcript store, session manager, streaming stack, materialization layer, or recovery path when an existing Hermes capability can be constrained or adapted. Every control-plane change should preserve or improve Hermes performance, network behavior, runtime/session management, and existing production-like deployment machinery.

## Acceptance vocabulary

- `source-wired`: code/schema/config exists; state exactly which checks ran.
- `ci-accepted`: the named CI gate passed on the named SHA and scope.
- `real-supabase-accepted`: the approved real database target passed migration and behavior checks.
- `runtime-accepted`: real employee host/runtime proof exists.
- `provider-accepted`: real external-provider IDs exist.
- `browser/channel-accepted`: fixture-free web/SMS/signed-review proof exists.
- `commercial-accepted`: usage, payer/beneficiary, provider cost, and invoice reconciliation passed.
- `production-ready`: every non-waivable Standard gate passes on the exact deployed SHA.

Documentation-only commits do not automatically promote an implementation proof anchor.

## Non-negotiables

1. Every consequential path resolves an authenticated principal and exact assignment or approved platform/system context.
2. Account membership, bearer possession, caller-selected IDs, mutable headers, and phone ownership are not complete authority.
3. Stable retries cannot create conflicting commands or duplicate irreversible effects.
4. Consequential success requires a matching durable accepted receipt; ambiguity remains durable and repairable without blind re-execution.
5. Provider master credentials never enter employee profiles or employee runtimes.
6. Customer-, money-, reputation-, credential-, and destructive actions use assignment-aware approval.
7. Webhooks verify provider authenticity before durable insertion and asynchronous processing.
8. Manager API authority and host lifecycle authority remain separated by the signed host-private provisioner boundary.
9. No browser-readable database surface is added without Data API, RLS, grant, and cross-assignment review.
10. Session, connector, approval, signed-resource, and runtime credentials fail closed after relevant authority-version changes.
11. Public claims and release state never exceed evidence bound to the exact SHA.

## Dependency order

Completed branch-level source/CI checkpoints:

1. Lane 1 relationship and authorization foundation.
2. Lane 3 durable command/effect kernel.
3. S2/S3 owner assignment and signed-resource enforcement.
4. S5 connector custody.
5. S6 commercial attribution and receipt-gated Model Gateway success.
6. S7 approval authority and execution.
7. S8 platform-admin authority source wiring and exact-SHA workflow definition.
8. S9 authority-version revocation and signed-resource closure.
9. Generated Manager production surface and successful production-image inclusion.

Next:

1. Apply the full migration ledger through `0063` to the approved real Supabase staging target.
2. Run the dedicated Lane 8 exact-SHA workflow if S8 acceptance is next.
3. Capture fixture-free web/SMS/signed-review and real connector/provider packets.
4. Implement and prove S10 onboarding identity saga, compensation, and repair.
5. Close commercial reconciliation, separated workers, capacity/fairness, recovery, rollback, attestation, deployment, and release gates.

Do not jump to downstream UI or capacity claims that would invent feature-local authority, effect, or proof semantics.

## Working rules

- Inspect source and the applicable contract before editing.
- Correct flawed tests or acceptance vectors before implementation.
- Prefer the smallest coherent change that closes an invariant without hiding a failed gate.
- Adapt existing Hermes, reconciler, inbox, gateway, provider, provisioning, materialization, session, recovery, and owner-surface machinery to shared contracts rather than replacing it.
- Use targeted checks during lane work, then run required integrated and release gates at the declared checkpoint.
- Do not repeat old pass counts as current proof unless rerun.
- Never rewrite or renumber applied forward migrations; add a new forward migration.

Normal local baseline:

```bash
npm run typecheck
npm run test:unit
npm run build
npm run lint
npm run test:integration   # environment-gated
```

Exact local-production orchestration lives at repository root under `local-prod/`, `scripts/local-prod/`, and root `pnpm` commands. `mvp-build/package-lock.json` plus `npm ci` remain application dependency authority.

## Memory protocol

After substantial multi-file work, a phase checkpoint, incident, or architectural/product-direction change:

1. write a dated handoff in `memory/`;
2. update `memory/MEMORY.md` newest-first;
3. record exact validation and implementation SHA, or explicitly state what was not run;
4. keep factual implementation/proof state synchronized with CODEGRAPH and release records;
5. distinguish documentation-only follow-up commits from the implementation proof anchor.

## Git

Work only on the explicitly selected branch. Keep specialist lanes narrow, preserve `main`, and merge through `employee-production-tuesday` only after required checks pass and documentation/proof is synchronized.
