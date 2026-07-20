# CLAUDE.md — AMTECH AI Employee repository instructions

Status: active  
Updated: 2026-07-20

Read `identity.md` first. Root `AGENTS.md` is the complete tool-agnostic contract. Use `CONTRIBUTING.md` for executable setup, hooks, task rubric, and verification. The nearest scoped `CLAUDE.md`, `AGENTS.md`, and `CODEGRAPH.md` govern their subtree.

## Current authority

- Current integration baseline: `main@48b917389ed85b9652eca43a8e4a8f60b52e917b`.
- New work starts on reviewed task branches from current `main`.
- Standard v0.2 is ratified and effective; migration head remains `0072` unless current source proves otherwise.
- Active program: `mvp-build/production-readiness-program/`.
- `mvp-build/second-half-plan/` is historical and non-canonical.
- PR #33, current source, and executable tests supersede stale plan-status prose. They establish only their exact evidence, not CI/live/provider/channel/database/target-host/pilot/production acceptance.
- WS-05 and WS-06 are active but incomplete without exact fixture-free owner, channel, cross-account, work/effect/receipt/recovery/proof evidence.

## Canonical boundary

AMTECH installs governed persistent AI Employees. Hermes owns reasoning, runs, session continuity, memory, tool use, and runtime-local recovery. Manager owns identity, assignments, authority, capability/tool contracts, connector/credential custody, approvals, durable effects, commercial attribution, revocation, repair, and release proof.

MCP core, MCP Apps, AG-UI, Web, SMS, and signed Review are bounded interoperability/presentation layers. They do not create assignment authority, durable business state, approval, or external-effect permission. Gmail, QuickBooks, and Stripe are adapters rather than the connector ontology.

## Executable contributor gate

From `mvp-build/`:

```bash
npm ci
npm run hooks:install
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
npm run repo:verify:full
```

## Engineering rules

- Inspect before editing; use repository search rather than invented paths.
- No feature expansion while a prerequisite P0 is unresolved.
- Every commit references the task ID.
- Run applicable executable tests and exact-head CI before claiming completion.
- Stop downstream work on red CI and never weaken expectations for green.
- Curated suites, broad aggregates, source wiring, fixtures, local PostgreSQL, managed-platform proof, provider proof, browser/channel proof, and production proof are separate claims.
- Preserve exact account, employee, assignment, authority, work revision, approval snapshot, effect, receipt, recovery, and proof identity.
- Reconnect must not replay accepted owner intent; ambiguous consequential outcomes reconcile before retry.
- After three failed attempts on one concrete step, retain diagnostics and escalate.

## Hermes upstream review

For Hermes integration, runtime, profile, session, delegation, tool-discovery, gateway, or Hermes-derived UI changes, run `npm run hermes:upstream:check` when repository policy, watched-path drift, pin mismatch, or a material Hermes-boundary workstream requires it. Upstream changes never auto-upgrade the pinned production runtime.

## Database and evidence policy

Production-shaped local/CI PostgreSQL is the normal TDD loop for migrations, constraints, RLS/grants/functions, negative isolation, concurrency, backfills, and rollback. Disposable managed Supabase is a platform-specific and release-candidate gate, not routine schema development. Production is never a test target.

`planned`, `source-wired`, `locally-proven`, `ci-accepted`, `database-accepted`, `runtime-accepted`, `provider-accepted`, `browser/channel-accepted`, `commercial-accepted`, `live-accepted`, and `production-ready` are distinct.

## Document authority

- root `CODEGRAPH.md`: repository routing/current integration headline;
- `mvp-build/CODEGRAPH.md`: source topology/migration/evidence boundary;
- `mvp-build/STANDARD.md`: ratified normative requirements;
- `mvp-build/production-readiness-program/`: single active production-readiness route;
- `mvp-build/second-half-plan/`: historical non-canonical plans;
- `mvp-build/memory/MEMORY.md`: sole handoff index;
- current source, migrations, tests, workflows, and proof: implementation/acceptance authority.
