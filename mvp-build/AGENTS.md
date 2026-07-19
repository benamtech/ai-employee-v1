# AGENTS.md — AI Employee implementation rules

Status: active  
Updated: 2026-07-19

> Tool-agnostic mirror of `CLAUDE.md`. Keep both files synchronized except for the heading note.

This is `mvp-build/`, the implementation home for AMTECH's AI Employee. The owner experiences one employee; Manager is invisible control-plane infrastructure and Hermes is the agent substrate.

## Mandatory read order

1. `../identity.md`
2. root `../AGENTS.md` or `../CLAUDE.md` and root `../CODEGRAPH.md`
3. this file or `CLAUDE.md`
4. `CODEGRAPH.md`
5. `memory/MEMORY.md`, then the newest relevant handoff
6. `STANDARD.md`
7. `second-half-plan/phase-2-standard-remediation-execution.md`
8. `docs/architecture/README.md`
9. `docs/architecture/11-agent-orientation-and-role-map.md`
10. `docs/production-normal-employee-live-deploy-runbook.md` for deployment/live work
11. relevant UX, source, migrations, scripts, tests, workflows, proofs, release records, and current diff

Source, applied migrations, executable proof, and newest memory outrank stale prose.

## Current status

- Integration branch: `employee-production-tuesday`, based on `research`.
- Integration PR: draft `#23`.
- Migration head: `0069`.
- Current implementation/proof anchors and workflow IDs are maintained in `CODEGRAPH.md`, the newest handoff, and PR `#23`.
- Branch source includes relationship/authorization, C3, connector custody, commercial attribution, approval authority, platform authority, revocation, onboarding identity/activation, generated UI, strict owner/context reads, reconciler/ambient inbox, Model Gateway, production topology, and exact-head archaeology.
- Real Supabase, target-host runtime/network, live identity/provider, fixture-free browser/SMS/Review, commercial reconciliation, cumulative budgets/shared rate limits, capacity/fairness, crash/repair, rollback, attestation, deployment, and launch acceptance remain separate gates unless named evidence closes them.

## Canonical product boundary

Current governed launch surfaces are web, SMS, signed review, and connected-system events. Voice is a future extension and not a launch gate.

```text
trigger
→ authenticated principal
→ exact assignment or approved platform/system context
→ current relationship, role, grant, policy, and authority version
→ stable durable intent
→ immutable command and atomic claim
→ Hermes or deterministic work
→ approval when required
→ one reserved bounded external effect
→ accepted, failed, or ambiguous durable receipt
→ deterministic replay or repair
→ role-safe surface
→ audit, metering, commercial attribution, revocation propagation, and release proof
```

The public estimator, fixtures, `/api/dev/login`, local `live:*`, and manually injected provider results are diagnostics only.

## Hermes preservation rule

Stay as close to Hermes runtime as possible.

Hermes owns agent execution, transcript/session continuity, streaming, recovery, rotation, employee-local materialization, and memory behavior. Manager owns authority, durable command/effect semantics, credential custody, approvals, revocation, commercial provenance, repair, and release evidence.

Do not create a parallel runtime, transcript store, session manager, streaming stack, materialization layer, or recovery path when an existing Hermes capability can be constrained or adapted.

## Agent roles

Every substantial change names one primary role from `docs/architecture/11-agent-orientation-and-role-map.md`:

- repository/documentation archaeologist;
- contracts/shared vocabulary;
- database/authority/relationships;
- runtime/network/provisioning;
- events/connectors/ambient inbox;
- Hermes/context/capabilities;
- owner UI/UX/generated view;
- reliability/evidence/commercial;
- deployment/release;
- research/product trajectory.

The role selects source hubs, invariants, and required validation. It does not permit ignoring interacting systems.

## Acceptance vocabulary

- `source-wired`: code/schema/config exists; state exactly which checks ran.
- `ci-accepted`: the named CI gate passed on the named SHA and scope.
- `real-supabase-accepted`: the approved real database target passed migration and behavior checks.
- `runtime-accepted`: real employee host/runtime proof exists.
- `provider-accepted`: real external-provider IDs exist.
- `browser/channel-accepted`: fixture-free web/SMS/signed-review proof exists.
- `commercial-accepted`: usage, payer/beneficiary, provider cost, and invoice reconciliation passed.
- `production-ready`: every non-waivable Standard gate passes on the exact deployed SHA.

Documentation-only commits and trajectory scores do not promote an implementation proof anchor.

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
11. Generated UI and adaptive layout remain presentation, not authority or hidden psychographic control.
12. Public claims and release state never exceed evidence bound to the exact SHA.

## Dependency order

Use `CODEGRAPH.md`, `docs/architecture/09-current-bug-risk-and-production-gap-register.md`, and `docs/architecture/trajectories/05-attractor-navigation-and-production-equation.md` together:

1. CODEGRAPH states current implementation and proof.
2. The risk register states source-confirmed P0/P1 gaps.
3. The trajectory packet orders interacting prerequisites and bifurcation controls.
4. `STANDARD.md` and live evidence decide acceptance.

Do not jump to downstream UX, capacity, MCP, or product claims that invent feature-local authority, effect, or proof semantics.

## Working rules

- Inspect source and the applicable contract before editing.
- Correct flawed tests or acceptance vectors before implementation.
- Prefer the smallest coherent change that closes an invariant without hiding a failed gate.
- Adapt existing Hermes, reconciler, inbox, gateway, provider, provisioning, materialization, session, recovery, commercial, and owner-surface machinery to shared contracts.
- Use targeted checks during lane work, then run required integrated/release gates at the declared checkpoint.
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

## Documentation and memory protocol

After substantial multi-file work, a phase checkpoint, incident, architectural/product-direction change, or production-risk discovery:

1. update the applicable architecture/UX contract;
2. update `CODEGRAPH.md` when source hubs, migration head, proof, or production gates changed;
3. write a dated handoff in `memory/`;
4. update `memory/MEMORY.md` newest-first;
5. update root CODEGRAPH when repository-level current state changed;
6. update the active plan/vector only when dependency/gate state changed;
7. update PR `#23` and exact-head workflow evidence;
8. distinguish documentation-only follow-up commits from the implementation proof anchor.

`docs/architecture/12-document-control-memory-and-handoff-map.md` defines the complete document-family transaction. Historical handoffs and implementation records remain point-in-time evidence and are not moved casually.

## Git

Work only on the explicitly selected branch. Keep specialist lanes narrow, preserve `main`, and merge through `employee-production-tuesday` only after required checks pass and documentation/proof is synchronized.
