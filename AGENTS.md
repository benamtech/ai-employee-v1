# AGENTS.md — Repository Agent Rules

Status: active  
Updated: 2026-07-20

## Mandatory read order

1. `identity.md`
2. this file or `CLAUDE.md`
3. `CONTRIBUTING.md`
4. root `CODEGRAPH.md`
5. nearest scoped `AGENTS.md`, `CLAUDE.md`, and `CODEGRAPH.md`
6. ratified `mvp-build/STANDARD.md`
7. `mvp-build/second-half-plan/README.md` and its single active program
8. `mvp-build/memory/MEMORY.md`, then the newest relevant handoff
9. `mvp-build/docs/architecture/README.md`
10. relevant source, migrations, tests, workflows, proof, release records, and current diff

Authority order: deployed release proof → applied migrations/durable state → executable source/generated production config → exact-SHA tests/acceptance → ratified Standard/active program → CODEGRAPH/architecture → newest indexed memory → historical records.

## Repository routing

- AI Employee implementation and production authority: `mvp-build/`.
- Ratified product/engineering requirements: `mvp-build/STANDARD.md`.
- Single active program: `mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/`.
- Current architecture/research disposition: `mvp-build/docs/architecture/`.
- Durable handoffs: `mvp-build/memory/`, indexed only by `mvp-build/memory/MEMORY.md`.
- Historical factual ledger: `wiki/MVP/implementation-records/`.
- Hyper Site lives in `benamtech/hyper-site`; do not recreate it here.
- The public estimator is outdated and non-canonical.

## Current integration boundary

- PR `#23` merged the reviewed cutover into `main` on 2026-07-20.
- Current integration baseline: `main@5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`.
- Final cutover evidence head: `d131dd09e216fc9dcf0444afd1eb1494194f52eb`.
- New work starts on a reviewed non-main task branch from current `main`.
- `employee-production-tuesday` and `research` are historical branch context, not current execution authority.
- Migration head: `0072`.
- Standard v0.2 is ratified and effective.
- Phase 1.1 of the active roadmap is repository/test-contract truth.
- Current source/CI does not imply database, target-host, provider, fixture-free browser/channel, commercial, recovery, rollback, capacity, deployment, or launch acceptance.
- The broad historical `npm run test:unit` aggregate is known red on the final cutover head; curated green gates may not be reported as proof that it passes.

## Product and protocol invariants

1. AMTECH is governed AI labor, not a generic chat or tool wrapper.
2. Every consequential path resolves an authenticated principal plus explicit assignment or approved platform/system context.
3. Identity, ownership, employment, access, authority, custody, payer, and beneficiary remain separate relationships.
4. Hermes remains the reasoning/runtime substrate; Manager owns assignment authority, capability/tool contracts, connector custody, approvals, durable effects, commercial attribution, revocation, repair, and proof.
5. MCP core, MCP Apps, and AG-UI are interoperability layers, not execution authority.
6. Gmail, QuickBooks, and Stripe are shipped adapters, not the connector ontology.
7. Unknown/consequential connectors fail closed to Manager mediation; direct MCP requires explicit read-only, non-money, non-customer-facing evidence.
8. Generated UI and adaptive layout are presentation systems; browser state cannot invent work, actions, approval, credentials, or effects.
9. Customer-facing, monetary, destructive, credential, and broad external actions use assignment-aware policy, approval where required, durable effect state, and receipts.
10. Provider master credentials never enter employee profiles or runtimes.
11. Ambiguous consequential provider outcomes reconcile before retry.
12. Public and release claims never exceed evidence on the exact candidate.

## Required contributor gate

From `mvp-build/`:

```bash
npm ci
npm run hooks:install
npm run repo:verify:quick
```

Before editing, validate a bounded task contract and six-point rubric:

```bash
npm run repo:rubric -- ./task-contract.json
```

Before pushing:

```bash
npm run repo:verify:full
```

Local hooks provide fast feedback but are bypassable; CI is authoritative. Coverage is required for changed logic where the package has instrumentation, but no agent may invent a misleading repository-wide percentage without a measured baseline.

## Company engineering standards

Every task must declare task ID, repository, branch, objective, success criteria, allowed/forbidden files, required tests, blockers, maximum commits, and Authority/Completeness/Agility/Isolation/Provability/Moat scores with mitigations below `0.5`.

```text
Explore → smallest coherent action → test → commit → verify exact head
```

- Work on the selected reviewed branch; `main` changes only through an approved merge.
- No feature expansion while a prerequisite P0 is unresolved.
- Every commit references the task ID.
- Stop downstream work on red CI.
- Treat a new applicable failure as the change's defect unless evidence proves the expectation stale.
- Do not weaken tests merely to obtain green.
- Use `find`/`grep` rather than guessing paths.
- After three failed attempts on one concrete step, preserve diagnostics and escalate.
- Schemas, fixtures, migrations, typed contracts, harnesses, diagnostics, proof capture, and runbooks are first-class implementation.
- Add concise `why` comments at non-obvious authority, safety, failure, or compatibility boundaries.

## Hermes upstream review

Before changing Hermes integration, runtime launch, profiles, sessions, delegation, tool discovery, gateway behavior, or Hermes-derived UI, run:

```bash
cd mvp-build
npm run hermes:upstream:check
```

Review the official `NousResearch/hermes-agent` repository, `hermes_cli/`, `web/src/App.tsx`, recent merged commits, and active pull requests. Upstream is intelligence, not authority: AMTECH production remains pinned until exact-image compatibility and release gates pass.

Do not run the check merely because a session starts. Repository policy, watched-path drift, pin/baseline mismatch, or a Hermes-boundary workstream must make it material.

## Database evidence policy

Routine database work uses production-shaped local/CI PostgreSQL TDD: complete ledger, constraints, RLS/grants/functions, negative isolation, concurrency, backfills, and rollback behavior.

Disposable managed Supabase is required only for material platform-specific behavior, security-sensitive browser/Data API boundaries, suspected platform differences, new release migration classes, and the final release candidate. Production is never the routine test target.

## Documentation discipline

- Root `CODEGRAPH.md` owns repository routing and the integration headline.
- `mvp-build/CODEGRAPH.md` owns implementation topology, migration head, source hubs, and evidence boundary.
- `mvp-build/STANDARD.md` owns normative requirements.
- `mvp-build/second-half-plan/README.md` owns the single active plan route.
- `mvp-build/memory/MEMORY.md` is the sole handoff index.
- Historical documents remain point-in-time evidence; route them through explicit supersession banners rather than silently rewriting facts.

## Git discipline

Create a reviewed task branch from current `main`. Do not force-update shared branches without explicit approval and a recovery path. Merge only when required checks pass, current authority documents and proof agree, and no P0/P1 gate is hidden.
