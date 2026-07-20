# 12 — Document Control, Memory, Handoff, and Plan Map

Status: **active repository documentation-routing contract**  
Updated: 2026-07-19

This document defines authority and routing without physically moving historical Markdown or breaking inbound references.

## One cold-start chain

```text
root identity.md
→ root AGENTS.md or CLAUDE.md
→ root CODEGRAPH.md
→ mvp-build/AGENTS.md or CLAUDE.md
→ mvp-build/CODEGRAPH.md
→ ratified mvp-build/STANDARD.md
→ mvp-build/second-half-plan/README.md and its one active program
→ mvp-build/memory/MEMORY.md and newest relevant handoff
→ docs/architecture/README.md
→ relevant source, migrations, tests, workflows, proof, and branch diff
```

Do not concatenate every historical handoff or select authority by filename date alone.

## Authority classes

### Class 1 — operating and release authority

| File/family | Purpose | Update trigger |
|---|---|---|
| `identity.md` | company/product identity | deliberate company/product posture change |
| root/scoped `AGENTS.md` and `CLAUDE.md` | agent rules and scope routing | repository boundary or execution invariant change |
| root `CODEGRAPH.md` | repository purpose, current branch, routing, repository-wide status | branch/product/repository authority change |
| `mvp-build/CODEGRAPH.md` | implementation topology, source hubs, migration head, evidence boundary | substantial implementation/migration/proof change |
| `mvp-build/STANDARD.md` | ratified non-waivable product and engineering requirements | approved Standard amendment |
| `mvp-build/validation/standard-v0.2-evolution-vector.json` | original-to-ratified clause/implementation motion | Standard or implementation-satisfaction change |
| `mvp-build/second-half-plan/README.md` | sole active-plan index | active program supersession |
| `mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/` | active dependency order and task contracts | gate/order/task change |
| draft PR `#23` | integration diff, exact-head status, workflow evidence | branch head or evidence change |

These files must not disagree about branch, migration head, current plan, Standard status, or production-ready meaning.

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

Owns repository boundary, canonical product/offer, root read order, branch/PR, current Standard/plan route, evidence headline, and repository-wide invariants.

### `mvp-build/CODEGRAPH.md`

Owns executable topology, source hubs, migration head, connector/protocol state, database evidence ladder, current proof boundary, and dependency gates.

### `mvp-build/STANDARD.md`

Owns non-waivable requirements and evidence vocabulary. It does not contain current incident narrative or detailed task sequencing.

### Active production program

Owns dependency order, verifiable task contracts, exit criteria, stop rules, and handoff matrix. No other plan file is current execution authority.

### Memory

Owns narrative: what changed, why, incidents, unresolved risks, exact proof, and next-agent handoff. `MEMORY.md` is the sole index.

### Wiki

Owns strategy, rationale, research history, historical plans, and factual records. A wiki page does not become implementation authority because it is newer or more detailed.

## Plan-family decision

The active program is:

`mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/`

Superseded plans remain in place. `mvp-build/second-half-plan/README.md` is the only current plan selector.

Creating another “current” plan without updating that index and explicitly superseding the prior active program in the same transaction is prohibited.

## Handoff selection

After the Class 1 cold start, select only handoffs relevant to the subsystem:

| Work | Current handoff requirement | Optional history |
|---|---|---|
| Standard/plan/docs | newest ratification/Gate 0 handoff | prior capability and document-authority handoffs |
| connector/MCP/protocol | newest ratification handoff | Hermes/UI congruence, MCP/tool records |
| database/migrations | newest ratification handoff | prior production-boundary and lane records |
| runtime/network/deploy | newest ratification handoff | reconciler and production-run handoffs |
| UI/generated work | newest ratification handoff | UI/runtime and generative UI predecessors |
| authority/approval/effects | newest ratification handoff | S2–S9 and Lane 1/Lane 3 predecessors |

Verify every carried-forward claim against current source and exact proof.

## Update transaction

A substantial source, Standard, plan, or status change is complete only when applicable layers are synchronized:

```text
source/migration/test/workflow
→ Standard/vector when normative motion changed
→ active program when dependency/order changed
→ architecture/UX explanation
→ scoped CODEGRAPH
→ root CODEGRAPH/README when repository routing changed
→ one dated memory handoff
→ memory/MEMORY.md
→ wiki/root supersession routing when stale readers could be misled
→ exact-head workflows
→ PR #23
```

A documentation-only SHA does not inherit an ancestor's workflow matrix.

## Anti-context-rot rules

- One ratified Standard.
- One active production program.
- One memory index.
- CODEGRAPH is a current map, not an incident journal.
- Memory is a handoff layer, not a competing plan.
- Historical records are not rewritten to appear current.
- Dates and filenames do not determine authority.
- Current claims use exact source/evidence instead of copied historical pass counts.
- Stale point-in-time audits receive supersession banners.
- Repository archaeology detects candidate stale references; a human/source review decides whether they are defects.

## Completion predicate for `AMTECH-P0-DOC-002`

Gate 0 document resolution is complete when:

1. root/scoped/wiki indexes route to ratified Standard v0.2 and one active program;
2. old plans are explicitly historical;
3. connector/MCP/AG-UI/database terminology matches current source and research disposition;
4. the newest handoff records the final exact head and all required workflows;
5. PR `#23` matches that branch head without claiming unclosed live gates.
