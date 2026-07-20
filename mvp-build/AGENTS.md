# AGENTS.md — AI Employee Implementation Rules

Status: active  
Updated: 2026-07-20

Root rules and `../CONTRIBUTING.md` apply.

## Mandatory read order

1. `../identity.md`
2. root agent rules, CONTRIBUTING, and CODEGRAPH
3. this file and scoped CODEGRAPH
4. ratified `STANDARD.md`
5. `production-readiness-program/README.md`
6. newest relevant indexed handoff
7. architecture index
8. applicable source, migrations, executable tests, workflows, proof, PRs, and diff

## Current implementation state

- Current main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`.
- PR #33/source/tests are newer authority than stale plan prose but establish only their exact evidence.
- Active program: `production-readiness-program/`.
- `second-half-plan/` is historical and non-canonical.
- WS-05/WS-06 remain open without exact fixture-free owner/channel/cross-account/work/effect/receipt/recovery/proof evidence.
- Live connector/provider, managed database, target-host, commercial, deployment, pilot, and production acceptance remain distinct and open unless exact current evidence closes them.

## Canonical boundary

```text
trigger → principal → exact account/employee/assignment/current authority
→ durable intent/work revision → Hermes/deterministic processing
→ broad discovery + current effective capability
→ approval bound to revision → one effect reservation
→ accepted | failed | ambiguous terminal receipt
→ replay-safe recovery → role-safe stream/materialization/proof
```

Hermes owns reasoning, runs, sessions, memory, and runtime-local tool use. Manager owns identity, assignment, authority, connector/token custody, approval, effects, commercial attribution, repair, and proof.

## Connector, stream, and protocol rules

- Declarative connector registry/setup owns identity, risk, custody, tools, scopes, hosts, continuation, and owner-safe copy.
- Unknown or consequential connectors default to Manager custody and fail closed when stale, revoked, mismatched, or unprobed.
- `tools/list` may be broad; `tools/call` is re-authorized using current effective-capability evidence.
- MCP Apps, AG-UI, Web, SMS, and signed Review are bounded projections. They cannot access raw credentials, databases, providers, or direct effects.
- Initial snapshots install atomically only after exact account/employee/assignment/authority validation. Cursor/version is established before deltas.
- Duplicate, stale, reordered, or cross-scope deltas are rejected.
- Reconnect does not resubmit accepted owner intent.
- Consequential actions re-enter Manager commands and existing approval/effect boundaries.

## Engineering execution

Every task declares ID, branch, objective, success criteria, files, tests, blockers, commit ceiling, and rubric scores.

```bash
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
npm run repo:verify:full
npm run test:unit
```

Do not weaken tests. Stop on red exact-head CI. Use forward migrations. Treat schemas, fixtures, contracts, harnesses, diagnostics, proof, and runbooks as first-class code. Fixtures never satisfy fixture-free acceptance.

## Hermes upstream review

Before changing Hermes images, launchers, sessions, streaming, tool discovery, runtime capabilities, gateway behavior, or Hermes-derived UI, run `npm run hermes:upstream:check` when required by repository policy. Production remains pinned until exact-image release gates pass.

## Document authority

- `STANDARD.md` — normative requirements.
- `CODEGRAPH.md` — current topology/evidence boundary.
- `production-readiness-program/` — sole active production-readiness route.
- `second-half-plan/` — historical non-canonical plans.
- `memory/MEMORY.md` — sole handoff index.
- executable source and exact evidence decide implementation and acceptance.
