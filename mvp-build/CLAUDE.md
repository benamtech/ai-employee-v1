# CLAUDE.md — AI Employee Implementation Rules

Status: active  
Updated: 2026-07-19

> Tool-specific mirror of `AGENTS.md`. Root rules also apply.

## Mandatory read order

1. `../identity.md`
2. root `../AGENTS.md` or `../CLAUDE.md` and `../CODEGRAPH.md`
3. this file or `AGENTS.md`
4. `CODEGRAPH.md`
5. ratified `STANDARD.md`
6. `second-half-plan/README.md` and its single active production program
7. `memory/MEMORY.md`, then the newest relevant handoff
8. `docs/architecture/README.md`
9. `docs/production-normal-employee-live-deploy-runbook.md` for deployment/live work
10. relevant UX, source, migrations, scripts, tests, workflows, proof, release records, and current diff

Source, applied migrations, executable proof, and exact-head acceptance outrank prose.

## Current implementation state

- Branch: `employee-production-tuesday`, based on `research`.
- Draft PR: `#23`.
- Migration head: `0072`.
- Standard: ratified v0.2.
- Active program: `second-half-plan/2026-07-19-ratified-standard-production-program/`.
- Canonical production topology: `infra/scripts/production-topology.mjs` → `infra/deploy/docker-compose.production.yml`.
- `main` is never an integration shortcut.
- Exact current proof head/workflow IDs belong in PR `#23` and the newest indexed handoff after branch movement stops.

## Canonical boundary

```text
trigger
→ authenticated principal
→ explicit assignment or approved platform/system context
→ current relationship, grant, policy, entitlement, and authority version
→ durable intent, command, event, or work object
→ Hermes reasoning or deterministic processing
→ evidence-backed capability selection
→ approval when required
→ one idempotent external-effect reservation
→ accepted | failed | ambiguous durable receipt
→ role-safe materialization
→ audit, metering, commercial attribution, revocation, recovery, and proof
```

Hermes owns employee reasoning/runtime behavior. Manager owns authority, connector/tool custody, approvals, durable effects, commercial attribution, repair, and release proof. Do not build a parallel agent runtime or authority plane.

## Connector and protocol rules

- `packages/shared/src/connector-registry.ts` owns connector identity, risk axes, and custody derivation.
- `packages/shared/src/connector-setup.ts` owns native setup protocol, exact tool ownership, scopes/permissions, allowed hosts, continuation, readiness evidence, and owner-safe copy.
- Gmail, QuickBooks, and Stripe are shipped adapters, not the connector ontology.
- Unknown/underspecified connectors default to Manager mediation.
- Direct MCP requires every write/money/customer-facing risk axis explicitly false.
- Broad categories never select a provider.
- MCP Apps is the official interactive MCP extension target; current MCP-UI-shaped code is compatibility groundwork until conformance passes.
- AG-UI is an optional role-safe event/state adapter, not authority or a generated-UI schema.
- Browser/protocol UI may stage commands and collect inputs but cannot access raw credentials, choose provider tools/scopes/hosts, resolve approval, or perform direct business effects.

## Database policy

Routine schema/query work uses production-shaped local/CI PostgreSQL TDD:

- full migration ledger from blank;
- constraints, triggers, indexes, RLS, grants, functions, and negative isolation;
- seed/backfill/existing-row compatibility;
- concurrency/race/compare-and-swap behavior;
- deterministic rollback and proof hashes.

Disposable managed Supabase is required only for material platform-specific Auth/Realtime/Storage/Data API/advisor behavior, security-sensitive browser boundaries, suspected platform differences, new release migration classes, and the final release candidate. Production is never the routine test target.

## Non-negotiables

1. Every consequential path is assignment-scoped or explicitly approved platform/system work.
2. Account membership, bearer possession, mutable headers, caller-selected IDs, and phone ownership are incomplete authority.
3. One stable intent cannot create conflicting commands or duplicate irreversible effects.
4. Consequential success requires a matching durable accepted receipt.
5. Ambiguous provider outcomes reconcile before retry.
6. Provider master credentials never enter employee profiles or runtimes.
7. Customer-facing, monetary, destructive, credential, and reputation effects use current policy/approval.
8. Webhooks verify provider authenticity before durable insertion.
9. Manager API authority and Docker-host authority remain separated by Host Provisioner.
10. Browser-readable database surfaces require Data API, RLS, grant, and cross-assignment review.
11. Revocation propagates across sessions, connectors, approvals, signed resources, runtime credentials, and queued work.
12. Generated UI and adaptive layout remain presentation rather than authority.
13. Claims and acceptance never exceed exact evidence.

## Engineering execution

Every task declares task ID, branch/repository, objective, verifiable success criteria, allowed/forbidden files, tests, blockers, and maximum commits when assigned.

```text
Explore → smallest coherent action → test → commit → verify exact head
```

- Never edit `main`.
- No feature expansion while a prerequisite P0 is unresolved.
- Every commit references the task ID.
- Stop downstream work when CI turns red.
- Do not weaken tests merely to get green.
- Use `find`/`grep`, not guessed paths.
- Add concise `why` comments at non-obvious boundaries.
- Run tests before completion.
- After three failed attempts on one concrete step, retain diagnostics and escalate.
- Measure on this repository/product boundary rather than public coding benchmarks.
- Treat migrations, schemas, fixtures, typed contracts, harnesses, diagnostics, proof, and runbooks as first-class code.

Normal baseline:

```bash
npm run test:standard
npm run typecheck
npm run test:unit
npm run test:production-boundary
npm run build
npm run lint
npm run test:integration   # environment-gated
```

## Document authority

- `STANDARD.md` — normative requirements.
- `CODEGRAPH.md` — current source topology, migration head, and evidence boundary.
- `second-half-plan/README.md` — single active plan route.
- `docs/architecture/` — explanatory architecture/research disposition.
- `memory/MEMORY.md` — sole handoff index.
- `wiki/MVP/implementation-records/` — historical factual ledger.
- source, migrations, tests, workflows, proof, and PR `#23` — implementation/acceptance authority.

Historical records remain point-in-time evidence. Do not silently rewrite them into current state or create another competing current plan.
