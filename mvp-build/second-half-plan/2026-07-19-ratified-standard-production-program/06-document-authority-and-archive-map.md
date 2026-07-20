# Document Authority and Archive Map

Status: active routing contract  
Task: `AMTECH-P0-DOC-002`

## One current route

Current work starts from:

1. `identity.md`;
2. root `AGENTS.md`/`CLAUDE.md` and `CODEGRAPH.md`;
3. scoped `mvp-build/AGENTS.md`/`CLAUDE.md` and `mvp-build/CODEGRAPH.md`;
4. `mvp-build/STANDARD.md`;
5. this plan folder;
6. `mvp-build/memory/MEMORY.md` and newest relevant handoff;
7. relevant architecture/source/migrations/tests/workflows/proof.

The Standard is normative. This folder owns active dependency order. CODEGRAPH owns current topology and proof boundary. Memory owns narrative handoff. Source and evidence decide implemented status.

## Active documents

| Family | Active authority |
|---|---|
| Product identity | `identity.md` |
| Repository operation | root/scoped `AGENTS.md`, `CLAUDE.md` |
| Normative product/engineering Standard | `mvp-build/STANDARD.md` |
| Current implementation map | root/scoped `CODEGRAPH.md` |
| Active production plan | `mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/` |
| Architecture/research | `mvp-build/docs/architecture/README.md` and indexed current companions |
| Narrative handoff | `mvp-build/memory/MEMORY.md` and newest indexed handoff |
| Acceptance | current source, migrations, tests, workflows, proof, PR `#23` |

## Historical or superseded plan families

The following remain point-in-time evidence and subsystem history:

- `mvp-build/second-half-plan/phase-2-standard-remediation-execution.md`;
- `mvp-build/second-half-plan/2026-07-20-capability-production-closure/`;
- `mvp-build/second-half-plan/phase-00-*` through `phase-06-*`;
- `wiki/MVP/build-plan-current/`;
- `wiki/MVP/old-build-plan/`;
- historical implementation-record and handoff families.

They are not deleted or silently rewritten. Their indexes and status banners route readers here when they could be mistaken for active instructions.

## Root, wiki, and scoped responsibilities

### Root

Root documents answer:

- what repository this is;
- which product is canonical;
- which branch/PR is active;
- where implementation authority lives;
- which other repositories/projects are out of scope.

### Wiki

The wiki retains product rationale, business context, historical plans, and implementation records. Wiki pages do not become current implementation authority by being newer or more detailed. `wiki/MVP/README.md` routes current execution here.

### mvp-build

`mvp-build/` owns executable product implementation, normative Standard, active plan, scoped architecture, memory handoff, migrations, tests, workflows, and proof.

## Update transaction

When current state or dependency order changes:

1. change source/tests/migrations if implementation changed;
2. update the active plan or one subordinate task packet;
3. update the machine vector when Standard satisfaction or direction changed;
4. update scoped/root CODEGRAPH when topology, head, or gates changed;
5. update architecture indexes when explanatory maps changed;
6. write/update one dated memory handoff and the sole memory index;
7. update wiki/root routing when public or historical readers could be misled;
8. stop branch movement and obtain exact-head workflow evidence;
9. update PR `#23` with final head and named evidence.

## Anti-context-rot rules

- Do not create another “current” plan without superseding this folder in the same commit transaction.
- Do not use memory as a second plan.
- Do not use CODEGRAPH as a narrative incident log.
- Do not duplicate implementation records into plan prose.
- Do not concatenate every historical handoff into agent context.
- Do not rewrite historical facts to look current.
- Do not use a date or filename alone to infer authority.
- Do not carry a green workflow matrix across a relevant later SHA.

## Completion predicate

`AMTECH-P0-DOC-002` is complete when all root/scoped/wiki indexes route to one active Standard and plan, the newest handoff records final exact-head evidence, stale documents are explicitly historical, and PR `#23` matches the branch.
