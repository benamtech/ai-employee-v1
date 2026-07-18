# CODEGRAPH.md — AMTECH AI Employee repository map

Status: active
Updated: 2026-07-18
Active integration branch: `employee-production-tuesday`, based on `research`; draft PR `#23` targets `research`
Implementation proof anchor: `a9184be1af68ed6c5372d642928db46b51eb0506`

## Read first

1. `identity.md`
2. `AGENTS.md` or `CLAUDE.md`
3. this file
4. `mvp-build/CODEGRAPH.md`
5. `mvp-build/memory/MEMORY.md`, then the newest relevant handoff
6. `mvp-build/STANDARD.md`
7. `mvp-build/second-half-plan/phase-2-standard-remediation-execution.md`
8. relevant source, migrations, scripts, tests, proofs, and release records

Verified source, migrations, executable proof, and newest scoped memory outrank older documentation.

## Repository boundary

This repository contains the AMTECH company brain and the implementation home for the AI Employee product.

- `mvp-build/`: product code, contracts, database migrations, runtime, workers, owner surfaces, connectors, security, tests, deployment, proofs, and active production-remediation work.
- `wiki/`: strategy, product rationale, historical planning, research, and implementation records.
- `docs/`: supporting product, design, and operating documents.
- `local-prod/` and `scripts/local-prod/`: exact-SHA local-production evidence orchestration.
- `.github/workflows/`: release and lane-specific CI gates.

The former `GTM-RESEARCH/website-framework/` workspace moved to `benamtech/hyper-site`. Hyper Site source, plans, tests, and release state are not AI Employee authority.

## Canonical product truth

AMTECH installs persistent AI Employees for owner-operated small businesses. The owner experiences one employee through governed web, SMS, signed review, and connected-system events.

Manager is the invisible control plane. Hermes is the agent substrate.

Hermes remains responsible for agent execution, transcript/session continuity, streaming, recovery, rotation, materialization, memory behavior, and the existing employee runtime path. Manager constrains and coordinates Hermes through authenticated principal and assignment resolution, durable commands/effects, approval, credential custody, revocation, accounting provenance, repair, and release proof.

The employee notices work, remembers business facts, prepares deliverables and communication, follows up, asks before consequential actions, leaves durable proof, and remains repairable under retries, crashes, provider ambiguity, and revocation.

AMTECH is not primarily an estimator, chatbot, CRM, automation builder, model marketplace, website framework, or collection of disconnected AI tools.

## Canonical offer

- **Start Free:** one bounded useful AI Employee.
- **Managed AI Employee:** from **$400/month** for managed connections, recovery, scheduled/event-driven work, higher capacity, and support.
- **Workforce:** custom pricing for multiple roles, locations, approval structures, or higher volume.

The public estimator is outdated and non-canonical. Older $750 setup plus $1,000/$1,500 monthly ladder language is superseded where it conflicts with this strategy.

## Canonical execution boundary

```text
trigger
-> authenticated principal
-> exact assignment or approved platform/system context
-> current role, grant, policy, and authority version
-> stable durable intent
-> immutable command
-> atomic claim with bounded lease
-> Hermes or deterministic work
-> approval when required
-> one reserved bounded external effect
-> accepted, failed, or ambiguous durable receipt
-> deterministic replay or repair
-> role-safe web, SMS, signed-review, or connected-system surface
-> audit, metering, commercial attribution, revocation propagation, and release proof
```

For the production-shaped normal-employee deployment path, use `mvp-build/docs/production-normal-employee-live-deploy-runbook.md`. Fixtures, `/api/dev/login`, local `live:*`, public-estimator scripts, and manually injected provider results are diagnostics only.

## Current branch status

Overall status:

`standard-remediation_s2-s9-branch-ci-postgres-image-accepted_not-live-accepted_not-launch-cleared`

The detailed current handoff is `mvp-build/memory/2026-07-18-s2-s9-authority-runtime-checkpoint.md`.

### Integrated and branch-level source/CI checkpoints

- Lane 1 relationship/authorization foundation integrated from PR `#24` at `b37d479a70983fcb3e88942b1f36481a07a97d17`.
- Repository-boundary cleanup integrated from PR `#27` at `3ec7a5c541fd8d6e6ec074e94f178163c7ec9477`.
- Lane 3 durable command/effect kernel integrated from PR `#26` at `c94be46137b8c87b610ba0c4b48302bb2e944564`.
- S2/S3 owner assignment, session, signed-preview, and artifact-link consumers now use durable assignment and authority-version boundaries.
- Owner web turns register C3 commands before Hermes execution; ambiguous turn jobs are repairable without a second effect.
- S5 connector custody binds verified Gmail, QuickBooks, Stripe, and assignment-bound Twilio ingress to durable connector bindings, grants, C3 commands, and receipts.
- S6 commercial attribution binds assignment, payer, beneficiary, immutable price version, provider receipt, and accounting receipt; uncertain accounting state is ambiguous.
- S7 approval authority uses immutable snapshots, current resolver role/grant/policy checks, atomic consumption, and execution-time revalidation.
- S8 platform-admin authority is source-wired through durable platform sessions, roles, step-up, exact support leases, audit, and C3 support writes. The dedicated exact-SHA workflow exists; do not claim a current-head dispatch without a recorded run ID.
- S9 authority-version revocation synchronously invalidates stale owner sessions, Hermes MCP credentials, approvals, preview links, and artifact links and emits a leased operational outbox.
- The Manager production server is generated from a hash-pinned template with injected owner/approval/admin/repair closures.
- Local-production and bounded SDRT-v2 tooling provide exact-SHA local evidence orchestration without redefining application dependency authority.
- The Manager Docker lifecycle now copies generator inputs before root `npm ci`; `.dockerignore` excludes host dependencies, mutable evidence, and secrets.

### Forward migration range in the current checkpoint

The current branch adds forward migrations `0043` through `0063`, including connector custody, commercial attribution, approval authority, owner/MCP/artifact assignment closure, platform-admin authority, authority-version revocation, ambiguous-command reconciliation, all-preview versioning, and exact preview-assignment requirements.

Migration `0042_assignment_scope_and_release_evidence_spine.sql` remains frozen. Do not rewrite or renumber applied migrations; use new forward migrations for later corrections.

### Exact implementation-head proof

Implementation SHA: `a9184be1af68ed6c5372d642928db46b51eb0506`

- Phase 2 Remediation Plan Integrity run `29662757178`: **success**
- Lane 1 Relationships and Authorization run `29662757194`: **success**
- S2 S7 S9 Production Boundary run `29662757252`: **success**
- Lane 10 Integrated CI and Release Evidence run `29662757197`: **success**
- Employee Work Production Boundary run `29662757204`: **success**

Observed proof includes generated Manager source; shared/database/Manager typecheck and build; unit/source contracts; complete migrations through `0063` on blank PostgreSQL 17; Lane 1, Lane 3, S5/S6, S7, and S9 database matrices; signed-resource revocation and unscoped-preview denial; ambiguous Hermes-turn reconciliation; release-evidence generation; worker migration regression; and successful Manager production-image inclusion.

Documentation-only commits after the implementation SHA do not automatically promote the proof anchor.

## Evidence boundary

This checkpoint does **not** claim:

- real Supabase staging acceptance;
- live external-provider packets;
- fixture-free browser/SMS/signed-review acceptance;
- current-head dedicated Lane 8 dispatch evidence;
- commercial reconciliation against real provider invoices/costs;
- remote runtime, reboot, drift, compensation, or recovery acceptance;
- 100/250/500/700-agent capacity and fairness;
- rollback, SBOM/attestation, production deployment, or production readiness.

## Next dependency gates

1. Apply the full migration ledger to the approved real Supabase staging target and retain exact-SHA behavior proof.
2. Dispatch the dedicated Lane 8 exact-SHA workflow if platform-admin acceptance is the next target.
3. Capture fixture-free owner web, SMS, signed-review, and real connector/provider packets through the current assignment/C3/revocation boundaries.
4. Implement and prove the S10 onboarding identity saga with compensation and repair.
5. Close commercial reconciliation, capacity/fairness, recovery, rollback, attestation, deployment, and final release gates on one frozen SHA.

## Source-of-truth map

| Question | Authority |
|---|---|
| What is the production standard? | `mvp-build/STANDARD.md` |
| What is the active execution order? | `mvp-build/second-half-plan/phase-2-standard-remediation-execution.md` |
| What is actually implemented? | `mvp-build/CODEGRAPH.md`, source, migrations, tests, proofs |
| What is the newest handoff? | `mvp-build/memory/MEMORY.md` and newest relevant memory |
| How is the normal employee deployed? | `mvp-build/docs/production-normal-employee-live-deploy-runbook.md` |
| What is the canonical offer? | this file and `mvp-build/docs/gtm/free-infrastructure-managed-workforce-strategy.md` |
| What records historical product rationale? | `wiki/` |
| Where does Hyper Site live? | `benamtech/hyper-site`; not authority here |

## Folder order for implementation work

```text
root control docs
-> mvp-build/STANDARD.md
-> active execution plan
-> mvp-build/CODEGRAPH.md
-> newest memory
-> shared contracts
-> database migrations
-> Manager/Hermes adapters and workers
-> tests and fault matrices
-> deployment and proof machinery
-> release state and public claims
```

## Non-negotiable release invariants

1. Every consequential action is assignment-scoped or explicitly approved platform/system work.
2. Unauthorized access or action count is zero.
3. One stable intent cannot create conflicting commands or duplicate irreversible effects.
4. Consequential success without a matching durable accepted receipt is zero.
5. Session, connector, signed-resource, and assignment revocation propagate within the declared bound.
6. Billable work always identifies assignment, payer, beneficiary, price version, provider receipt, and accounting receipt.
7. Hermes remains the execution substrate; Manager does not duplicate transcript/session/runtime machinery without a proven gap.
8. Public workloads remain isolated and within their declared fleet-capacity cap.
9. Capacity, recovery, rollback, migration, provider, browser/channel, commercial, and release proof bind to the exact deployed SHA.
10. Unsupported production or marketing claims are forbidden.
11. `main` is not used as a production shortcut around integration and release gates.
