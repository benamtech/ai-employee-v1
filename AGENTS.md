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
7. `mvp-build/production-readiness-program/README.md`
8. `mvp-build/memory/MEMORY.md`, then the newest relevant handoff
9. `mvp-build/docs/architecture/README.md`
10. relevant source, migrations, tests, workflows, proof, release records, PRs, and current diff

Authority order: deployed release proof → applied migrations/durable state → executable source/generated production config → exact-SHA tests/acceptance → ratified Standard/current production-readiness program → CODEGRAPH/architecture → newest indexed memory → historical records.

## Repository routing

- AI Employee implementation and production authority: `mvp-build/`.
- Ratified requirements: `mvp-build/STANDARD.md`.
- Single active program: `mvp-build/production-readiness-program/`.
- Historical plans: `mvp-build/second-half-plan/`; non-canonical.
- Current architecture: `mvp-build/docs/architecture/`.
- Sole handoff index: `mvp-build/memory/MEMORY.md`.
- Historical factual ledger: `wiki/MVP/implementation-records/`.
- Hyper Site lives in `benamtech/hyper-site`; do not recreate it here.
- The public estimator is outdated and non-canonical.

## Current integration boundary

- Current `main` baseline for this work is `48b917389ed85b9652eca43a8e4a8f60b52e917b`.
- PR #33/source/tests are newer authority than stale plan-status prose, but establish only their exact lifecycle/source/test evidence.
- Remote MCP, MCP Apps, AG-UI, effective capability, and streaming Web retain only their exact source/test evidence.
- Live connector authorization/revocation, third-party host conformance, managed database, target host, provider, fixture-free Web/SMS/Review, commercial, recovery, deployment, pilot, and production acceptance remain distinct and open unless exact current evidence closes them.
- WS-05 and WS-06 may use WS-07/08/09 only as read-only dependencies or future frontier nodes.

## Product and protocol invariants

1. AMTECH is governed AI labor, not a generic chat or tool wrapper.
2. Every consequential path resolves an authenticated principal plus explicit assignment or approved platform/system context.
3. Identity, ownership, employment, access, authority, custody, payer, and beneficiary remain separate.
4. Hermes owns reasoning/runtime behavior; Manager owns assignment authority, capability/tool contracts, connector/token custody, approvals, effects, commercial attribution, revocation, repair, and proof.
5. Capability discovery may be broad. Execution requires current effective capability evidence.
6. MCP core, MCP Apps, AG-UI, Web, SMS, and signed Review are interoperability/presentation layers, not authority.
7. Generated UI and shared state cannot invent work, actions, approval, credentials, provider routing, or effects.
8. Harmless Hermes text/activity should stream immediately; authority gates apply when crossing into commands, credentials, approvals, or external effects.
9. Unknown, stale, revoked, cross-account, mismatched, or unprobed evidence fails closed.
10. Provider master credentials and connector tokens never enter employee profiles, Hermes runtimes, browser payloads, or generated UI.
11. Consequential effects reserve once and terminate with accepted, failed, or ambiguous durable receipts; ambiguous reconciles before retry.
12. Reconnect never resubmits accepted owner intent.
13. Public and release claims never exceed exact-candidate evidence.

## Required contributor gate

From `mvp-build/`:

```bash
npm ci
npm run hooks:install
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
npm run repo:verify:full
npm run test:unit
```

CI is authoritative only when an exact run exists for the exact claimed SHA. Do not weaken tests, hide blocked evidence, or promote fixtures into live acceptance.

## Hermes upstream review

Before changing Hermes integration, launch, sessions, tool discovery, streaming, gateway behavior, runtime capabilities, or Hermes-derived UI, run `npm run hermes:upstream:check`. The pinned image/digest changes only through exact-image compatibility and release gates.

## Git discipline

Create a reviewed task branch from current `main`. Every commit references the task ID. Stop downstream work on red CI. Merge only when required checks pass and source, program, memory, and PR evidence agree.
