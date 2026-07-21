# 12 — Document Control, Decision, Memory, and Handoff Map

Status: **active documentation-routing contract**  
Updated: 2026-07-20  
Main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Stacked source candidate: PR #35 on PR #34  
Source migration head: `0076`

## One cold-start chain

```text
identity.md
→ root contributor rules, CONTRIBUTING, and CODEGRAPH
→ scoped AGENTS.md/CLAUDE.md and CODEGRAPH.md
→ STANDARD.md
→ decision/README.md and protocol-v1.json
→ production-readiness-program/README.md
→ memory/MEMORY.md and newest relevant handoff
→ docs/architecture/README.md
→ current source, migrations, tests, workflows, proof, PR, and diff
→ applicable computed trace
```

Do not select authority by filename date, concatenate historical handoffs, or treat a decision score as source truth.

## Authority classes

### Operating and release authority

- `identity.md` — company/product identity.
- root/scoped contributor rules — execution constraints.
- `STANDARD.md` — ratified non-waivable requirements.
- `decision/README.md` and `decision/protocol-v1.json` — mandatory computation-before-decision contract.
- root/scoped `CODEGRAPH.md` — current topology, migration head, source hubs, and evidence boundary.
- `production-readiness-program/` — sole active dependency order, issue/workstream/test/evidence program.
- source, migrations, generated production config, executable tests, exact workflows, deployed proof, and release records — implementation and acceptance truth.

### Current explanatory authority

- `docs/architecture/README.md` and indexed companions;
- current UX/runtime derivations;
- canonical production runbooks.

These explain current source and computed decisions but do not establish stronger evidence.

### Decision records

- `decision/README.md` defines the protocol.
- `decision/protocol-v1.json` is the machine-readable contract.
- one `decision/traceNNN/` directory is active per current consequential transaction.
- complete prior traces are historical evidence; incomplete transports are removed.
- computation selects and compresses work; it never establishes implementation or acceptance.

### Narrative and factual evidence

- `memory/` — dated handoffs; `MEMORY.md` is the sole index;
- `wiki/MVP/implementation-records/` — point-in-time factual ledger;
- exact CI artifacts and release records.

Point-in-time evidence does not carry forward automatically.

### Historical plans and audits

- `second-half-plan/` is historical and non-canonical.
- old architecture packets, audit bodies, implementation records, and handoffs remain readable through history or archive routing.
- active-looking obsolete entrypoints become explicit routing stubs; they are not silently rewritten to look current.

## Current program and transaction

Active program:

`production-readiness-program/`

Current computation-first transaction:

`decision/trace007/`

Canonical execution files:

- `04-dependency-ordered-production-plan.md`;
- `08-production-issue-vector.json` and `.md`;
- `13-resolution-ledger.json`;
- `09-workstream-execution-map.md`;
- `20-ws06-ws08-commercial-effect-transaction.md`;
- `10-test-suite-disposition.md`;
- `07-verification-and-handoff-matrix.md`.

PR #35/source may supersede stale status prose only for the exact source boundary it implements. Exact-head CI, provider, managed database, target host, fixture-free browser/channel, commercial lifecycle, pilot, deployment, and production evidence remain separate.

## Update transaction

```text
authority extraction and evidence/Unknown matrix
→ computed candidate frontier and implementation compression
→ source / migration / behavioral tests / workflows
→ active decision trace
→ production program issue/workstream/test/evidence maps
→ architecture and scoped CODEGRAPH
→ root routing when repository authority changed
→ contributor/read-order docs
→ one dated handoff and MEMORY.md
→ PR or release record
```

A current claim is incomplete when any required downstream map still points to a superseded head, migration, workstream status, trace, or evidence class.

## Anti-context-rot rules

1. One ratified Standard.
2. One computation-first protocol.
3. One active production-readiness program.
4. One active trace per active consequential transaction.
5. One memory index.
6. CODEGRAPH is a current map, not an incident diary.
7. Memory is a handoff layer, not a second plan.
8. Historical material is preserved as point-in-time evidence.
9. Unknown evidence stays Unknown.
10. Source wiring, computation, documentation, fixtures, local-only tests, and ancestor-SHA evidence do not prove stronger gates.
