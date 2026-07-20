# AGENTS.md — AI Employee Implementation Rules

Status: active  
Updated: 2026-07-20

> Tool-agnostic implementation contract. Root rules and `../CONTRIBUTING.md` also apply.

## Mandatory read order

1. `../identity.md`
2. root `../AGENTS.md` or `../CLAUDE.md`, `../CONTRIBUTING.md`, and `../CODEGRAPH.md`
3. this file or `CLAUDE.md`
4. `CODEGRAPH.md`
5. ratified `STANDARD.md`
6. `second-half-plan/README.md` and its single active production program
7. `memory/MEMORY.md`, then the newest relevant handoff
8. `docs/architecture/README.md`
9. applicable source, migrations, tests, workflows, proof, and current diff

## Current implementation state

- Cutover branch: `employee-production-tuesday`; target/base `main`; draft PR `#23`.
- Historical `research` is not current execution authority.
- Migration head: `0072`.
- Standard: ratified v0.2.
- Active program: `second-half-plan/2026-07-19-ratified-standard-production-program/`.
- Canonical topology: `infra/scripts/production-topology.mjs` → `infra/deploy/docker-compose.production.yml`.

## Canonical boundary

```text
trigger
→ authenticated principal
→ explicit assignment or approved platform/system context
→ current relationship, grant, policy, entitlement, and authority version
→ durable intent, command, event, or work object
→ Hermes reasoning or deterministic work
→ evidence-backed capability selection
→ approval when required
→ one idempotent effect reservation
→ accepted | failed | ambiguous durable receipt
→ role-safe materialization
→ audit, commercial attribution, recovery, and proof
```

Hermes owns employee reasoning/runtime behavior. Manager owns authority, connector/tool custody, approvals, durable effects, commercial attribution, repair, and release proof. Do not build a parallel runtime or authority plane.

## Connector and protocol rules

- `packages/shared/src/connector-registry.ts` owns connector identity, risk axes, and custody.
- `packages/shared/src/connector-setup.ts` owns setup protocol, exact tool ownership, permissions, hosts, continuation, readiness, and owner-safe copy.
- Gmail, QuickBooks, and Stripe are shipped adapters, not the connector ontology.
- Unknown or underspecified connectors default to Manager mediation.
- Direct MCP requires write, money, and customer-facing risk axes explicitly false.
- Broad categories never select a provider.
- MCP Apps and AG-UI are bounded adapters, not authority or durable state.
- Browser/protocol UI cannot access raw credentials, choose provider tools/scopes/hosts, resolve approval, or perform business effects.

## Database policy

Routine schema/query work uses production-shaped local/CI PostgreSQL for the full ledger, constraints, triggers, indexes, RLS, grants, functions, negative isolation, existing rows/backfills, concurrency, compare-and-swap, rollback, and proof hashes.

Disposable managed Supabase is required only for material platform-specific Auth/Realtime/Storage/Data API/advisor behavior, security-sensitive platform boundaries, suspected platform differences, new release migration classes, and final release candidates. Production is never the routine test target.

## Engineering execution

Every task declares task ID, branch/repository, objective, success criteria, allowed/forbidden files, tests, blockers, maximum commits, and six rubric scores.

```bash
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
npm run repo:verify:full
```

```text
Explore → smallest coherent action → test → commit → verify exact head
```

- Work on a reviewed branch; `main` changes only through approved merge.
- No feature expansion while a prerequisite P0 is unresolved.
- Every commit references the task ID.
- Stop downstream work on red CI.
- Do not weaken tests merely to get green.
- Use `find`/`grep`, not guessed paths.
- Add concise `why` comments at non-obvious boundaries.
- After three failed attempts, retain diagnostics and escalate.
- Treat migrations, schemas, fixtures, contracts, harnesses, diagnostics, proof, and runbooks as first-class code.

Install fast-feedback hooks once per clone:

```bash
npm run hooks:install
```

Hooks are bypassable; exact-head CI remains authoritative. Maintain focused coverage for changed logic where instrumentation exists; do not fabricate a repository-wide percentage.

## Hermes upstream review

Before changing Hermes images, launchers, profiles, sessions, delegation, gateway/client behavior, tool discovery, runtime-native capabilities, or Hermes-derived UI:

```bash
npm run hermes:upstream:check
```

Review official `NousResearch/hermes-agent` current head, `hermes_cli/`, `web/src/App.tsx`, recent merged commits, and active PRs. Upstream is intelligence, not authority; the production pin changes only through exact-image compatibility and release gates.

## Document authority

- `STANDARD.md` — normative requirements.
- `CODEGRAPH.md` — current source topology, migration head, and evidence boundary.
- `second-half-plan/README.md` — single active plan route.
- `docs/architecture/` — explanatory architecture/research disposition.
- `memory/MEMORY.md` — sole handoff index.
- source, migrations, tests, workflows, proof, and PR `#23` — implementation/acceptance authority.
