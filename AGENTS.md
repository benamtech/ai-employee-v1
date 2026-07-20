# AGENTS.md — Repository Agent Rules

Status: active  
Updated: 2026-07-19

## Mandatory read order

1. `identity.md`
2. this file or `CLAUDE.md`
3. root `CODEGRAPH.md`
4. nearest scoped `AGENTS.md`, `CLAUDE.md`, and `CODEGRAPH.md`
5. ratified `mvp-build/STANDARD.md`
6. `mvp-build/second-half-plan/README.md` and its single active program
7. `mvp-build/memory/MEMORY.md`, then the newest relevant handoff
8. `mvp-build/docs/architecture/README.md`
9. relevant source, migrations, tests, workflows, proof, release records, and current diff

Authority order: deployed release proof → applied migrations/durable state → executable source/generated production config → exact-SHA tests/acceptance → ratified Standard/active program → CODEGRAPH/architecture → newest indexed memory → historical records.

## Repository routing

- AI Employee implementation and production authority: `mvp-build/`.
- Ratified product/engineering requirements: `mvp-build/STANDARD.md`.
- Single active program: `mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/`.
- Current architecture/research disposition: `mvp-build/docs/architecture/`.
- Durable handoffs: `mvp-build/memory/`, indexed only by `mvp-build/memory/MEMORY.md`.
- Historical factual ledger: `wiki/MVP/implementation-records/`.
- Wiki plans/rationale are historical or explanatory unless routed by current root/scoped indexes.
- Hyper Site lives in `benamtech/hyper-site`; do not recreate it here.
- The public estimator is outdated and non-canonical.

## Current integration boundary

- Repository: `benamtech/ai-employee-v1`.
- Integration branch: `employee-production-tuesday`.
- Base: `research`.
- Draft PR: `#23`.
- Migration head: `0072`.
- `main` is never the integration or release shortcut.
- Standard v0.2 is ratified and effective.
- Current source/CI does not imply database, target-host, provider, fixture-free browser/channel, commercial, recovery, rollback, capacity, deployment, or launch acceptance.

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

## Company engineering standards

Every task must declare:

- task ID, repository, branch, and concise objective;
- verifiable success criteria;
- allowed and forbidden files;
- required tests;
- known blockers;
- maximum commits when assigned.

Execution:

```text
Explore → smallest coherent action → test → commit → verify exact head
```

Rules:

- Never edit `main`.
- No feature expansion while a prerequisite P0 is unresolved.
- Every commit references the task ID.
- If CI is red after the change, stop downstream work and fix or escalate.
- If an applicable test fails after the change, treat it as the change's defect unless evidence proves the expectation stale.
- Do not weaken tests merely to obtain green.
- Use `find`/`grep` rather than guessing paths.
- Run tests before reporting completion.
- After three failed attempts on the same concrete step, preserve diagnostics and escalate.
- Measure on this codebase and deployed product boundary, not public benchmark scores.
- Schemas, fixtures, migrations, typed contracts, harnesses, diagnostics, proof capture, and runbooks are first-class implementation.
- Add concise `why` comments at non-obvious authority, safety, failure, or compatibility boundaries.

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
- A newer date or longer document does not automatically make a file authoritative.

## Git discipline

Work only on the selected branch. Do not force-update shared branches without explicit approval and a recovery path. Merge only when required checks pass, current authority documents and proof agree, and no P0/P1 gate is hidden.
