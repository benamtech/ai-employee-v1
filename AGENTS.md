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
- Ratified requirements: `mvp-build/STANDARD.md`.
- Single active program: `mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/`.
- Current architecture: `mvp-build/docs/architecture/`.
- Sole handoff index: `mvp-build/memory/MEMORY.md`.
- Historical factual ledger: `wiki/MVP/implementation-records/`.
- Hyper Site lives in `benamtech/hyper-site`; do not recreate it here.
- The public estimator is outdated and non-canonical.

## Current integration boundary

- New work starts on reviewed branches from current `main`.
- WS-01 and the Model Gateway provider-authority lock are merged in PR `#30` at `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`.
- WS-02 protocol implementation evidence head: `6f792eabe44a9ca1e9635fd4fe5329fa7daca6c4` in PR `#31`.
- That head passed Standard `29731384034`, Hermes review `29731384166`, and Main Integration `29731384039`, including broad **109 files / 630 tests**, build, archaeology, and compiled Chromium.
- Migration head remains `0072`; Standard v0.2 remains ratified.
- Remote MCP, MCP Apps, AG-UI, effective capability, and streaming Web are accepted only for source/CI scope. Live connector authorization/revocation, third-party host conformance, managed database, target host, provider, fixture-free channels, commercial, recovery, deployment, pilot, and production acceptance remain open.

## Product and protocol invariants

1. AMTECH is governed AI labor, not a generic chat or tool wrapper.
2. Every consequential path resolves an authenticated principal plus explicit assignment or approved platform/system context.
3. Identity, ownership, employment, access, authority, custody, payer, and beneficiary remain separate.
4. Hermes owns reasoning/runtime behavior; Manager owns assignment authority, capability/tool contracts, connector/token custody, approvals, effects, commercial attribution, revocation, repair, and proof.
5. Capability discovery may be broad. Execution requires current effective capability evidence.
6. MCP core, MCP Apps, AG-UI, Web, SMS, and signed Review are interoperability/presentation layers, not authority.
7. Generated UI and shared state cannot invent work, actions, approval, credentials, provider routing, or effects.
8. Harmless Hermes text/activity should stream immediately; authority gates apply when crossing into commands, credentials, approvals, or external effects.
9. Unknown, stale, revoked, or unprobed connector/capability evidence fails closed.
10. Provider master credentials and connector tokens never enter employee profiles, Hermes runtimes, browser payloads, or generated UI.
11. Consequential effects reserve once and terminate with accepted, failed, or ambiguous durable receipts; ambiguous reconciles before retry.
12. Public and release claims never exceed exact-candidate evidence.

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

CI is authoritative. Do not weaken tests, hide blocked evidence, or promote fixtures into live acceptance.

## Hermes upstream review

Before changing Hermes integration, launch, sessions, tool discovery, streaming, gateway behavior, runtime capabilities, or Hermes-derived UI, run `npm run hermes:upstream:check`. The pinned image/digest changes only through exact-image compatibility and release gates.

## Git discipline

Create a reviewed task branch from current `main`. Every commit references the task ID. Stop downstream work on red CI. Merge only when required checks pass and source, plan, memory, and PR evidence agree.