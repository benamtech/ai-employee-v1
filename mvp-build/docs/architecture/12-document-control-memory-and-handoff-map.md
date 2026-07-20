# 12 — Document Control, Memory, Handoff, and Plan Map

Status: **active repository documentation-routing contract**  
Updated: 2026-07-20  
Current baseline: `main@5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`

This document defines authority and routing without physically moving historical Markdown or breaking inbound references.

## One cold-start chain

```text
root identity.md
→ root AGENTS.md or CLAUDE.md
→ root CONTRIBUTING.md
→ root CODEGRAPH.md
→ mvp-build/AGENTS.md or CLAUDE.md
→ mvp-build/CODEGRAPH.md
→ ratified mvp-build/STANDARD.md
→ mvp-build/second-half-plan/README.md and its one active program
→ mvp-build/memory/MEMORY.md and newest relevant handoff
→ docs/architecture/README.md
→ relevant source, migrations, tests, workflows, proof, current PR, and diff
```

Do not concatenate every historical handoff or select authority by filename date alone.

## Authority classes

### Class 1 — operating and release authority

| File/family | Purpose | Update trigger |
|---|---|---|
| `identity.md` | company/product identity | deliberate company/product posture change |
| root/scoped `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md` | contributor rules and scope routing | repository boundary or execution invariant change |
| root `CODEGRAPH.md` | repository purpose, current baseline, routing, repository-wide status | branch/product/repository authority change |
| `mvp-build/CODEGRAPH.md` | implementation topology, source hubs, migration head, evidence boundary | substantial implementation/migration/proof change |
| `mvp-build/STANDARD.md` | ratified non-waivable product and engineering requirements | approved Standard amendment |
| `mvp-build/validation/standard-v0.2-evolution-vector.json` | original-to-ratified clause/implementation motion | Standard or implementation-satisfaction change |
| `mvp-build/second-half-plan/README.md` | sole active-plan index | active program supersession or routing change |
| active production program | roadmap, issue vector, workstreams, test authority, gates | gate/order/task/evidence change |
| merged PR `#23` and current task PR | cutover record and current diff/exact-head evidence | branch head or evidence change |

These files must not disagree about baseline, migration head, current plan, Standard status, test state, or production-ready meaning.

PR `#23` merged the cutover into `main` on 2026-07-20. Its final evidence head was `d131dd09`; merge SHA `5e5b8d7` is the current `main` baseline. `employee-production-tuesday` and `research` are historical context.

### Class 2 — current explanatory authority

- `mvp-build/docs/architecture/README.md` and indexed current companions;
- `mvp-build/docs/architecture/16-standard-research-basis-and-protocol-disposition.md`;
- `mvp-build/docs/ux/`;
- canonical production runbooks.

These explain source and requirements. They do not establish deployed acceptance.

### Class 3 — durable narrative and factual evidence

- `mvp-build/memory/` — dated handoffs; indexed only by `memory/MEMORY.md`;
- `wiki/MVP/implementation-records/` — historical factual implementation/proof ledger;
- exact CI artifacts and release records.

Point-in-time evidence never carries forward automatically.

### Class 4 — historical plans and research

- `mvp-build/second-half-plan/phase-2-standard-remediation-execution.md`;
- `mvp-build/second-half-plan/2026-07-20-capability-production-closure/`;
- `mvp-build/second-half-plan/phase-00-*` through `phase-06-*`;
- `mvp-build/second-half-plan/context-engineering/`;
- `wiki/MVP/build-plan-current/` and `wiki/MVP/old-build-plan/`;
- older architecture, UX, handoff, research, and implementation-record packets.

Historical materials remain readable and retain their original facts. Their indexes or banners route current work to Class 1.

## Root and scoped responsibilities

### Root `CODEGRAPH.md`

Owns repository boundary, canonical product/offer, root read order, current `main` baseline, reviewed-branch rule, current Standard/plan route, evidence headline, and repository-wide invariants.

### `mvp-build/CODEGRAPH.md`

Owns executable topology, source hubs, migration head, connector/protocol state, database evidence ladder, current proof boundary, and dependency gates.

### `mvp-build/STANDARD.md`

Owns non-waivable requirements and evidence vocabulary. It does not contain current incident narrative or detailed task sequencing.

### Active production program

Owns the sole dependency order, issue vector, workstream contracts, test-suite disposition, exit criteria, stop rules, and handoff matrix. No other plan file is current execution authority.

### Memory

Owns narrative: what changed, why, incidents, unresolved risks, exact proof, and next-agent handoff. `MEMORY.md` is the sole index.

### Wiki

Owns strategy, rationale, research history, historical plans, and factual records. A wiki page does not become implementation authority because it is newer or more detailed.

## Plan-family decision

The active program is:

`mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/`

Its canonical execution files are:

- `04-dependency-ordered-production-plan.md`;
- `08-production-issue-vector.json` and `.md`;
- `09-workstream-execution-map.md`;
- `10-test-suite-disposition.md`.

Superseded plans remain in place. `mvp-build/second-half-plan/README.md` is the only current plan selector. Creating another “current” plan without updating that index and explicitly superseding the prior active program in the same transaction is prohibited.

## Handoff selection

After the Class 1 cold start, select only handoffs relevant to the subsystem:

| Work | Current handoff requirement | Optional history |
|---|---|---|
| Standard/plan/docs | newest post-merge roadmap handoff | ratification/Gate 0 and prior document-authority handoffs |
| connector/MCP/protocol | newest post-merge roadmap plus ratification handoff | Hermes/UI congruence and MCP/tool records |
| database/migrations | newest post-merge roadmap plus ratification handoff | production-boundary and lane records |
| runtime/network/deploy | newest post-merge roadmap handoff | reconciler and production-run handoffs |
| UI/generated work | newest post-merge roadmap handoff | UI/runtime and generative UI predecessors |
| authority/approval/effects | newest post-merge roadmap plus ratification handoff | S2–S9 and Lane 1/Lane 3 predecessors |

Verify every carried-forward claim against current source and exact proof.

## Update transaction

A substantial source, Standard, plan, or status change is complete only when applicable layers are synchronized:

```text
source/migration/test/workflow when implementation changed
→ Standard/vector when normative motion changed
→ active program when dependency/order/evidence changed
→ issue/workstream/test maps
→ architecture/UX explanation
→ scoped CODEGRAPH
→ root CODEGRAPH/README/contributor routing when repository status changed
→ one dated memory handoff
→ memory/MEMORY.md
→ wiki/root supersession routing only when stale readers could be misled
→ exact-head workflows
→ current PR or merged-release record
```

A documentation-only SHA does not inherit an ancestor's workflow matrix. Curated suite success does not prove a known red broad aggregate.

## Anti-context-rot rules

- One ratified Standard.
- One active production program.
- One memory index.
- CODEGRAPH is a current map, not an incident journal.
- Memory is a handoff layer, not a competing plan.
- Historical records are not rewritten to appear current.
- Dates and filenames do not determine authority.
- Current claims use exact source/evidence instead of copied historical pass counts.
- Stale point-in-time audits receive supersession routing.
- Repository archaeology detects candidate stale references; human/source review decides whether they are defects.
- A merged PR or branch cannot remain described as current active work.

## Completion predicate

Gate 0 document resolution remains complete when root/scoped/wiki indexes route to ratified Standard v0.2 and one active program, old plans are explicitly historical, terminology matches current source/research disposition, and exact evidence does not claim unclosed live gates.

`AMTECH-P0-PLAN-003` completes when the post-merge baseline, expanded roadmap, issue vector, workstream map, test disposition, architecture, memory, governance checks, and current PR agree on one final candidate.
