# CLAUDE.md — AI Employee Implementation Rules

Status: active  
Updated: 2026-07-20

> Tool-specific mirror of `AGENTS.md`. Root rules and `../CONTRIBUTING.md` also apply.

## Required start

1. Read root/scoped `AGENTS.md`, `CODEGRAPH.md`, ratified `STANDARD.md`, and `production-readiness-program/README.md`.
2. Read only the newest relevant indexed handoff and source/test/proof needed for the task.
3. Validate the task contract, then run the quick gate before editing.

```bash
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
```

Current main baseline is `48b917389ed85b9652eca43a8e4a8f60b52e917b`. PR #33/source/tests are newer authority than stale plan-status prose but establish only their exact evidence. `second-half-plan/` is historical and non-canonical. Migration head remains `0072` unless current source proves otherwise.

## Boundary

Hermes owns employee reasoning/runtime behavior. Manager owns identity, assignment authority, capability/tool contracts, connector and credential custody, approvals, durable effects, commercial attribution, revocation, repair, and proof.

Unknown, stale, revoked, cross-account, or mismatched connector/capability/assignment evidence fails closed. MCP Apps, AG-UI, Web, SMS, and signed Review are projections, not authority. Initial snapshots install only after exact scope validation; cursor/version precedes deltas; reconnect never replays accepted owner intent.

## Execution

- Work on a reviewed task branch from current `main`; `main` changes only through approved merge.
- No feature expansion while a prerequisite P0 is unresolved.
- Use Red → Green → Refactor for one behavior at a time.
- Every commit references the task ID.
- Stop on red exact-head CI and do not weaken tests to obtain green.
- Never report curated suite success as proof that a broader aggregate or live boundary passes.
- Preserve exact work revision, approval snapshot, effect, receipt, recovery, and proof identity.
- After three failed attempts on one concrete step, preserve diagnostics and escalate.
- Treat schemas, migrations, fixtures, contracts, harnesses, diagnostics, proof, and runbooks as implementation. Fixtures do not satisfy fixture-free acceptance.

Before pushing:

```bash
npm run repo:verify:full
```

## Hermes upstream review

Before changing Hermes images, launchers, profiles, sessions, delegation, gateway/client behavior, tool discovery, runtime-native capabilities, or Hermes-derived UI, run `npm run hermes:upstream:check` when repository policy requires it. Upstream never auto-upgrades the production pin.

## Database and evidence

Use production-shaped local/CI PostgreSQL for routine migration, RLS, grant, function, negative-isolation, concurrency, backfill, and rollback work. Use disposable managed Supabase only for material platform-specific or release-candidate proof. Production is never the routine test target.

Source, fixture, local database, documentation, old proof, and ancestor-SHA evidence cannot satisfy a live boundary they did not exercise. `production-ready` requires every non-waivable Standard gate on one exact signed deployed release.

## Authority files

- `STANDARD.md` — normative requirements.
- `CODEGRAPH.md` — source topology, migration head, and evidence boundary.
- `production-readiness-program/` — single active production-readiness route.
- `second-half-plan/` — historical non-canonical material.
- `memory/MEMORY.md` — sole handoff index.
- source, migrations, tests, workflows, and proof — implementation and acceptance authority.
