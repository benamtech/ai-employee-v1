# CODEGRAPH.md — AMTECH AI Employee repository map

Status: active
Updated: 2026-07-18
Active integration branch: `employee-production-tuesday`, based on `research`; draft PR `#23` targets `research`

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
- `.github/workflows/`: release and lane-specific CI gates.

The former `GTM-RESEARCH/website-framework/` workspace is not part of this repository. It moved to the independent `benamtech/hyper-site` repository. Do not treat Hyper Site source, plans, tests, or release state as AI Employee authority.

## Canonical product truth

AMTECH installs persistent AI Employees for owner-operated small businesses. The owner experiences one employee through governed web, SMS, signed review, and connected-system events. Manager is the invisible control plane; Hermes is the agent substrate.

The employee notices work, remembers business facts, prepares deliverables and communication, follows up, asks before consequential actions, leaves durable proof, and remains repairable under retries, crashes, provider ambiguity, and revocation.

AMTECH is not primarily an estimator, chatbot, CRM, automation builder, model marketplace, website framework, or collection of disconnected AI tools.

## Canonical offer

- **Start Free:** one bounded useful AI Employee.
- **Managed AI Employee:** from **$400/month** for managed connections, recovery, scheduled/event-driven work, higher capacity, and support.
- **Workforce:** custom pricing for multiple roles, locations, approval structures, or higher volume.

Older $750 setup plus $1,000/$1,500 monthly ladder language is superseded where it conflicts with this strategy.

## Canonical launch boundary

Current launch surfaces:

- web;
- SMS;
- signed review;
- connected-system events.

Voice is a future extension and is not a launch acceptance gate.

Canonical flow:

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
-> role-safe owner surface
-> audit, metering, repair, and release proof
```

For the current production-shaped deployment path, use `mvp-build/docs/production-normal-employee-live-deploy-runbook.md`. The public estimator, fixtures, `/api/dev/login`, local `live:*`, and manually injected provider results are diagnostics only, not launch proof.

## Current production-remediation state

Overall status:

`standard-remediation_in-progress_source-and-ci-evidence_not-live-accepted_not-launch-cleared`

### Integrated checkpoints

- Lane 1 relationship/authorization foundation merged from PR `#24` at `b37d479a70983fcb3e88942b1f36481a07a97d17`: labor/domain relationships, assignment model, initial authorization evaluator, migrations `0039` and `0040`, and the five-case PostgreSQL relationship/RLS matrix.
- Repository-boundary cleanup merged from PR `#27` at `3ec7a5c541fd8d6e6ec074e94f178163c7ec9477`: removed the independent Hyper Site subtree and its orphaned workflow, then repaired root and scoped routing documents.
- Lane 3 durable command/effect kernel merged from PR `#26` at `c94be46137b8c87b610ba0c4b48302bb2e944564`: scheduler-independent concurrency harness, migration `0041`, stable intent registration, atomic claims, effect reservation, accepted/failed/ambiguous receipts, receipt-gated completion, deterministic replay, and bounded lease reclaim.
- Lane 3 Actions run `29642874619` passed shared typecheck/build, six contract invariants, blank PostgreSQL 17 migration application, and the seven-case command/effect matrix. Relationship/authorization run `29642874652` also passed on the same lane head.
- Existing production-like normal-employee deployment machinery remains preserved.

### Current source-wired progress on PR #23

- Lane 1 now has an executable consequential-surface registry at `mvp-build/packages/shared/src/authorization-scope-registry.ts` covering tables, Manager routes, SMS paths, signed resources, connector bindings, owner sessions, admin/support actions, commercial rows, service workers, and public claims.
- Migration `0042_assignment_scope_and_release_evidence_spine.sql` persists the scope registry, adds nullable `assignment_id` columns to existing consequential tables where present, records deterministic high-confidence assignment backfills only, and leaves ambiguous rows unpromoted.
- Lane 10 now has `mvp-build/packages/shared/src/release-evidence.ts`, `infra/scripts/acceptance/release-evidence-spine.mjs`, and `.github/workflows/lane10-integrated-ci-release-evidence.yml` to bind source/CI evidence, migration matrices, and pending hard gates to the exact SHA.

These are source/CI/PostgreSQL checkpoints only until the new workflows pass. They are not real-Supabase, provider, runtime, browser/SMS, commercial, capacity, deployment, or production acceptance.

### Next dependency gates

1. Get the Lane 1 scope registry, migration `0042`, relationship matrix, command/effect matrix, and Lane 10 evidence workflow green on the current PR head.
2. Convert registry entries into route/session/SMS/signed-resource/connector/commercial consumer enforcement without allowing account-membership, bearer-only, phone-only, mutable-header, or caller-selected identity shortcuts.
3. Then implement Lane 2 sessions, approvals, admin/support authority, revocation, and Lane 4 onboarding identity saga against the shared relationship and command/effect kernels.

### Remaining hard gates

- complete consumer-level assignment enforcement and non-recursive privilege review;
- owner sessions, approvals, admin/support authority, and revocation;
- onboarding identity saga, compensation, and repair;
- budget, usage, payer/beneficiary, provider cost, and invoice reconciliation;
- connector custody and unified channel envelope;
- separated workers, capacity, recovery, and fairness for 100–700 provisioned agents;
- role-safe workforce/product surfaces;
- full CI, real Supabase, provider/browser/SMS proof, rollback rehearsal, attestation, and production acceptance on one frozen SHA.

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
| Where does Hyper Site live? | independent repository `benamtech/hyper-site`; not an authority here |

## Folder order for implementation work

```text
root control docs
-> mvp-build/STANDARD.md
-> active execution plan
-> mvp-build/CODEGRAPH.md
-> newest memory
-> shared contracts
-> database migrations
-> service and worker consumers
-> tests and fault matrices
-> deployment and proof machinery
-> release state and public claims
```

This ordering is dependency-driven. Shared authority and durable-effect contracts must exist before downstream sessions, approvals, connectors, billing, workers, or UI can safely consume them.

## Non-negotiable release invariants

1. Every consequential action is assignment-scoped or explicitly approved platform/system work.
2. Unauthorized access or action count is zero.
3. One stable intent cannot create conflicting commands or duplicate irreversible effects.
4. Consequential success without a matching durable accepted receipt is zero.
5. Session and connector revocation propagates within the declared bound.
6. Billable work always identifies assignment, payer, beneficiary, price version, and accounting receipt.
7. Public workloads remain isolated and within their declared fleet-capacity cap.
8. Capacity, recovery, rollback, migration, provider, browser/channel, commercial, and release proof bind to the exact deployed SHA.
9. Unsupported production or marketing claims are forbidden.
10. `main` is not used as a production shortcut around the integration and release gates.
