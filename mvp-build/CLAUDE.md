# CLAUDE.md — AI Employee Implementation Rules

Status: active  
Updated: 2026-07-20

> Tool-specific mirror of `AGENTS.md`. Root rules and `../CONTRIBUTING.md` also apply.

## Required start

1. Read root/scoped `AGENTS.md`, `CODEGRAPH.md`, ratified `STANDARD.md`, and the active program.
2. Read only the newest relevant handoff and source/test/proof needed for the task.
3. Validate the task contract, then run the quick gate before editing.

```bash
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
```

PR `#23` merged the cutover into `main` on 2026-07-20. Current baseline is `main@5e5b8d7`; final cutover evidence head is `d131dd09`. New work starts on reviewed task branches from current `main`. The cutover branch and `research` are historical context. Migration head is `0072`.

The next canonical phase is Phase 1.1: post-merge repository authority and test-contract truth. The curated main gate is green on the final cutover head, but the broad `npm run test:unit` aggregate is explicitly red and remains separate normalization work.

## Boundary

Hermes owns employee reasoning/runtime behavior. Manager owns identity, assignment authority, capability/tool contracts, connector and credential custody, approvals, durable effects, commercial attribution, revocation, repair, and proof.

Unknown or stale connector/capability evidence fails closed. Direct MCP requires explicit read-only, non-money, non-customer-facing evidence. Provider categories never select provider identity, tools, scopes, credentials, or hosts. MCP Apps, AG-UI, Web, SMS, and signed Review are projections, not authority.

## Execution

- Work on a reviewed task branch from current `main`; `main` changes only through approved merge.
- No feature expansion while a prerequisite P0 is unresolved.
- Use Red → Green → Refactor for one behavior at a time.
- Every commit references the task ID.
- Stop on red CI and do not weaken tests to obtain green.
- Never report curated suite success as proof that the broader aggregate passes.
- After three failed attempts on one concrete step, preserve diagnostics and escalate.
- Treat schemas, migrations, fixtures, contracts, harnesses, diagnostics, proof, and runbooks as implementation.

Before pushing:

```bash
npm run repo:verify:full
```

Install local fast-feedback hooks once per clone with `npm run hooks:install`. Hooks are bypassable; exact-head CI remains authoritative.

## Hermes upstream review

Before changing Hermes images, launchers, profiles, sessions, delegation, gateway/client behavior, tool discovery, runtime-native capabilities, or Hermes-derived UI, run `npm run hermes:upstream:check` and review the official repository, `hermes_cli/`, `web/src/App.tsx`, recent commits, and active PRs. Upstream never auto-upgrades the production pin. Do not run the check solely because a session started.

## Database and evidence

Use production-shaped local/CI PostgreSQL for routine migration, RLS, grant, function, negative-isolation, concurrency, backfill, and rollback work. Use disposable managed Supabase only for material platform-specific or release-candidate proof. Production is never the routine test target.

Source, fixture, local database, documentation, old proof, and ancestor-SHA evidence cannot satisfy a live boundary they did not exercise. `production-ready` requires every non-waivable Standard gate on one exact signed deployed release.

## Authority files

- `STANDARD.md` — normative requirements.
- `CODEGRAPH.md` — source topology, migration head, and evidence boundary.
- `second-half-plan/README.md` — single active plan route.
- active program `04`, `08`, `09`, `10` — roadmap, issue vector, workstreams, and test authority.
- `memory/MEMORY.md` — sole handoff index.
- source, migrations, tests, workflows, and proof — implementation and acceptance authority.
