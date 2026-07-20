# AGENTS.md — AI Employee Implementation Rules

Status: active  
Updated: 2026-07-20

Root rules and `../CONTRIBUTING.md` apply.

## Mandatory read order

1. `../identity.md`
2. root agent rules, CONTRIBUTING, CODEGRAPH
3. this file and scoped CODEGRAPH
4. ratified `STANDARD.md`
5. single active production program
6. newest relevant indexed handoff
7. architecture index
8. applicable source, migrations, tests, workflows, proof, and diff

## Current implementation state

- New work starts on reviewed branches from current `main`.
- Merged baseline: PR `#30`, `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`.
- WS-02 implementation evidence: `6f792eabe44a9ca1e9635fd4fe5329fa7daca6c4`, Standard `29731384034`, Hermes `29731384166`, Main Integration `29731384039`.
- Broad regression: **109 files / 630 tests**. Migration head: `0072`. Standard: ratified v0.2.
- Source/CI accepted: streaming-first Hermes/Web, assignment/version-scoped stream, Remote MCP authorization contracts, sealed token custody, MCP Apps host boundary, AG-UI projection/transport, persisted effective capability, and MCP execution interceptor.
- Live connector/provider, managed database, target-host, fixture-free channel, commercial, recovery, deployment, pilot, and production acceptance remain open.

## Canonical boundary

```text
trigger → principal → assignment/current authority
→ durable intent/work → Hermes/deterministic processing
→ broad discovery + current effective capability
→ approval → one effect reservation
→ accepted | failed | ambiguous receipt
→ replay/repair → role-safe stream/materialization
```

Hermes owns reasoning, runs, sessions, memory, and runtime-local tool use. Manager owns identity, assignment, authority, connector/token custody, approval, effects, commercial attribution, repair, and proof.

## Connector and protocol rules

- Declarative connector registry/setup owns identity, risk, custody, tools, scopes, hosts, continuation, and owner-safe copy.
- Unknown/consequential connectors default to Manager custody.
- Remote protected MCP uses discovered metadata, exact audience, PKCE/state/redirect binding, and sealed Manager token custody.
- `tools/list` may be broad; `tools/call` is re-authorized using current effective-capability evidence.
- MCP Apps and AG-UI are bounded projections. They cannot access raw credentials, databases, providers, or direct effects.
- Harmless text/activity streams immediately. Consequential actions re-enter Manager commands and existing approval/effect boundaries.

## Engineering execution

Every task declares ID, branch, objective, success criteria, files, tests, blockers, commit ceiling, and six rubric scores.

```bash
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
npm run repo:verify:full
npm run test:unit
```

Do not weaken tests. Stop on red CI. Use forward migrations. Treat schemas, fixtures, contracts, harnesses, diagnostics, proof, and runbooks as first-class code.

## Hermes upstream review

Before changing Hermes images, launchers, sessions, streaming, tool discovery, runtime capabilities, gateway behavior, or Hermes-derived UI, run `npm run hermes:upstream:check`. Production remains pinned until exact-image release gates pass.

## Document authority

- `STANDARD.md` — normative requirements.
- `CODEGRAPH.md` — current topology/evidence boundary.
- `second-half-plan/README.md` — sole active-plan route.
- active program — roadmap, issue vector, resolution ledger, workstreams, test authority, WS-02 manifold/closure.
- `memory/MEMORY.md` — sole handoff index.
- executable source and exact evidence decide implementation/acceptance.