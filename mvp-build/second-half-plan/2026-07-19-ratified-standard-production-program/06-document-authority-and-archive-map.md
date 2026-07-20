# Document Authority and Archive Map

Status: active routing contract  
Tasks: `AMTECH-P0-DOC-002`, `AMTECH-P0-PLAN-003`  
Current baseline: `main@5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`

## One current route

Current work starts from:

1. `identity.md`;
2. root `AGENTS.md`/`CLAUDE.md`, `CONTRIBUTING.md`, and `CODEGRAPH.md`;
3. scoped `mvp-build/AGENTS.md`/`CLAUDE.md` and `mvp-build/CODEGRAPH.md`;
4. `mvp-build/STANDARD.md`;
5. this plan folder;
6. `mvp-build/memory/MEMORY.md` and newest relevant handoff;
7. relevant architecture/source/migrations/tests/workflows/proof/current diff.

The Standard is normative. This folder owns active dependency order. CODEGRAPH owns current topology and proof boundary. Memory owns narrative handoff. Source and evidence decide implemented status.

PR `#23` merged the reviewed cutover into `main` on 2026-07-20. New work begins on reviewed task branches from current `main`; `employee-production-tuesday` and `research` are historical context.

## Active documents

| Family | Active authority |
|---|---|
| Product identity | `identity.md` |
| Repository operation | root/scoped `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md` |
| Normative product/engineering Standard | `mvp-build/STANDARD.md` |
| Current implementation map | root/scoped `CODEGRAPH.md` |
| Active production plan | `mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/` |
| Active issue/workstream/test detail | plan files `08`, `09`, and `10` |
| Architecture/research | `mvp-build/docs/architecture/README.md` and indexed current companions |
| Narrative handoff | `mvp-build/memory/MEMORY.md` and newest indexed handoff |
| Acceptance | current source, migrations, tests, workflows, proof, merged PR `#23`, and current task PR |

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
- which product and offer are canonical;
- the current `main` baseline and reviewed-branch rule;
- where implementation authority lives;
- which other repositories/projects are out of scope.

### Wiki

The wiki retains product rationale, business context, historical plans, and implementation records. Wiki pages do not become current implementation authority by being newer or more detailed. `wiki/MVP/README.md` and `wiki/MVP/build-plan-current/README.md` already route current execution here, so this planning transaction does not rewrite historical wiki bodies.

### mvp-build

`mvp-build/` owns executable product implementation, normative Standard, active plan, scoped architecture, memory handoff, migrations, tests, workflows, and proof.

## Post-merge update transaction

When current state or dependency order changes:

1. change source/tests/migrations if implementation changed;
2. update the active plan or one subordinate task packet;
3. update the issue vector and workstream/test maps when prioritization or evidence changed;
4. update the Standard evolution vector only when normative satisfaction/direction changed;
5. update scoped/root CODEGRAPH when topology, head, or gates changed;
6. update architecture indexes when explanatory maps changed;
7. write/update one dated memory handoff and the sole memory index;
8. update wiki/root routing only when stale readers could be misled;
9. stop branch movement and obtain exact-head workflow evidence;
10. update the active PR or merged-release record with final head and named evidence.

The final cutover evidence belongs to `d131dd09`: Ratified Standard `29717830698`, Hermes Upstream Review `29717830703`, and Main Integration Gates `29717830737`. Merge SHA `5e5b8d7` is the current `main` coordinate. Neither proves the known red broad unit aggregate or any live boundary.

## Anti-context-rot rules

- Do not create another “current” plan without superseding this folder in the same transaction.
- Do not use memory as a second plan.
- Do not use CODEGRAPH as a narrative incident log.
- Do not duplicate implementation records into plan prose.
- Do not concatenate every historical handoff into agent context.
- Do not rewrite historical facts to look current.
- Do not use a date or filename alone to infer authority.
- Do not carry a green workflow matrix across a relevant later SHA.
- Do not report curated suites as proof that the broad aggregate passes.
- Do not leave a merged branch/PR described as current active work.

## Completion predicate

`AMTECH-P0-DOC-002` remains complete for one active Standard/plan route when all root/scoped/wiki indexes point here, historical files are explicitly routed, and exact evidence is recorded honestly. `AMTECH-P0-PLAN-003` completes when post-merge routing, the expanded roadmap, issue/workstream/test maps, memory, governance checks, and current PR agree on one final candidate.
