# 12 — Document Control, Memory, Handoff, and Program Map

Status: **active repository documentation-routing contract**  
Updated: 2026-07-20  
Current main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`

## One cold-start chain

```text
identity.md
→ root AGENTS.md or CLAUDE.md
→ CONTRIBUTING.md and root CODEGRAPH.md
→ scoped mvp-build AGENTS.md/CLAUDE.md and CODEGRAPH.md
→ ratified mvp-build/STANDARD.md
→ mvp-build/production-readiness-program/README.md
→ mvp-build/memory/MEMORY.md and newest relevant handoff
→ docs/architecture/README.md
→ current source, migrations, executable tests, workflows, proof, PR, and diff
```

Do not select authority by filename date or concatenate historical handoffs.

## Authority classes

### Operating and release authority

- `identity.md` — company and product identity.
- root/scoped `AGENTS.md`, `CLAUDE.md`, and `CONTRIBUTING.md` — contributor rules.
- root/scoped `CODEGRAPH.md` — current routing, topology, migration, and evidence boundary.
- `mvp-build/STANDARD.md` — ratified normative requirements.
- `mvp-build/production-readiness-program/` — the single current dependency order, issue vector, workstream contracts, test disposition, stop rules, and handoff matrix.
- current source, migrations, generated production config, executable tests, exact workflow evidence, deployed proof, and release records — implementation and acceptance truth.

### Current explanatory authority

- `mvp-build/docs/architecture/README.md` and indexed companions;
- current UX/runtime derivations;
- canonical production runbooks.

These explain current source and requirements but do not establish live acceptance.

### Durable narrative and factual evidence

- `mvp-build/memory/` — dated handoffs; `MEMORY.md` is the sole index;
- `wiki/MVP/implementation-records/` — point-in-time factual ledger;
- exact CI artifacts and release records.

Point-in-time evidence does not carry forward automatically.

### Historical plans and research

Everything under `mvp-build/second-half-plan/` is historical and non-canonical. This includes the superseded prototype-era second-half plan and `2026-07-20-capability-production-closure/`. Historical wiki build plans, old architecture packets, and earlier implementation records remain readable but cannot direct current execution.

## Current program decision

The active program is:

`mvp-build/production-readiness-program/`

Its canonical execution files are:

- `04-dependency-ordered-production-plan.md`;
- `08-production-issue-vector.json` and `.md`;
- `13-resolution-ledger.json`;
- `09-workstream-execution-map.md`;
- `10-test-suite-disposition.md`;
- `07-verification-and-handoff-matrix.md`.

PR #33, current source, and executable tests supersede stale plan-status prose only for the exact boundary they exercise. They do not establish live provider, fixture-free channel, managed database, target-host, pilot, deployment, or production acceptance.

## Update transaction

```text
source / migration / executable tests / generated production config
→ Standard or evolution vector when normative motion changed
→ production-readiness program and issue/workstream/test maps
→ architecture and scoped CODEGRAPH
→ root routing when repository authority changed
→ one dated memory handoff and MEMORY.md
→ wiki routing only where stale readers could be misled
→ exact-head workflows
→ current PR or release record
```

## Anti-context-rot rules

- One ratified Standard.
- One active root-level production-readiness program.
- One memory index.
- Historical material is preserved, not rewritten to appear current.
- CODEGRAPH is a current map, not an incident diary.
- Memory is a handoff layer, not a second plan.
- Current claims require exact source and evidence.
- Source wiring, fixtures, local-only tests, and ancestor-SHA evidence do not prove live or production gates.
