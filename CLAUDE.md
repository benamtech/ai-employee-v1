# CLAUDE.md — AMTECH AI Employee repository instructions

Status: active  
Updated: 2026-07-20

Read `identity.md` first. Root `AGENTS.md` is the complete tool-agnostic contract. Use `CONTRIBUTING.md` for executable setup, hooks, task rubric, and verification. The nearest scoped `CLAUDE.md`, `AGENTS.md`, and `CODEGRAPH.md` govern their subtree.

## Current branch state

- Integration/cutover branch: `employee-production-tuesday`.
- Target/base: `main`.
- Draft cutover PR: `#23`.
- Historical `research` is not a current integration dependency.
- Migration head: `0072`.
- Standard v0.2 is ratified and effective.
- Active program: `mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/`.

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

The task contract includes Authority, Completeness, Agility, Isolation, Provability, and Moat scores. A score below `0.5` requires a named mitigation.

## Engineering rules

- Work on a reviewed branch; `main` changes only through approved merge.
- Inspect before editing; use `find`/`grep` rather than invented paths.
- No feature expansion while a prerequisite P0 is unresolved.
- Every commit references the task ID.
- Run applicable tests and exact-head CI before completion.
- Stop downstream work on red CI.
- Do not weaken expectations merely to get green.
- After three failed attempts on one concrete step, retain diagnostics and escalate.
- Treat scaffolding, tests, migrations, proof capture, and runbooks as first-class implementation.

## Hermes upstream review

For Hermes integration, runtime, profile, session, delegation, tool-discovery, gateway, or Hermes-derived UI changes, run `npm run hermes:upstream:check` and review the official repository, `hermes_cli/`, `web/src/App.tsx`, recent commits, and active PRs. Upstream changes never auto-upgrade the pinned production runtime.

## Database and evidence policy

Production-shaped local/CI PostgreSQL is the normal TDD loop for migrations, constraints, RLS/grants/functions, negative isolation, concurrency, backfills, and rollback. Disposable managed Supabase is a platform-specific and release-candidate gate, not routine schema development. Production is never a test target.

`planned`, `source-wired`, `locally-proven`, `ci-accepted`, `database-accepted`, `runtime-accepted`, `provider-accepted`, `browser/channel-accepted`, `commercial-accepted`, `live-accepted`, and `production-ready` are distinct. Source wiring, fixtures, local PostgreSQL, documentation, old proof, or an ancestor SHA cannot satisfy a live boundary they did not exercise.

## Document authority

- root `CODEGRAPH.md`: repository routing/current integration headline;
- `mvp-build/CODEGRAPH.md`: source topology/migration/evidence boundary;
- `mvp-build/STANDARD.md`: ratified normative requirements;
- `mvp-build/second-half-plan/README.md`: single active plan route;
- `mvp-build/memory/MEMORY.md`: sole handoff index;
- current source, migrations, tests, workflows, and proof: implementation/acceptance authority.
