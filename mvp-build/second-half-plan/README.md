# AMTECH AI Employee Production Plan Index

Status: **one active production program; Gate 0 resolved for declared scope; post-cutover**  
Updated: 2026-07-20

## Active authority

The single active production program is:

[`2026-07-19-ratified-standard-production-program/README.md`](2026-07-19-ratified-standard-production-program/README.md)

It is governed by:

- `../STANDARD.md` — ratified normative requirements;
- `../validation/standard-v0.2-evolution-vector.json` — original-to-ratified clause/implementation motion;
- `../CODEGRAPH.md` — current source topology, migration head, and evidence boundary;
- `../memory/MEMORY.md` — sole narrative handoff index;
- current source, migrations, tests, workflows, proof, and merged PR `#23`.

No other file or folder in `second-half-plan/` is current execution authority.

## Read order

1. `../../identity.md`
2. root/scoped `AGENTS.md` or `CLAUDE.md` and `CODEGRAPH.md`
3. `../STANDARD.md`
4. the active production program above
5. `../memory/MEMORY.md` and newest relevant handoff
6. `../docs/architecture/README.md`
7. applicable source, migrations, tests, workflows, proof, and current diff

## Current execution state

- PR `#23` merged `employee-production-tuesday` into `main` on 2026-07-20.
- Current integration baseline: `main@5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`.
- Final cutover evidence head: `d131dd09e216fc9dcf0444afd1eb1494194f52eb`.
- New work starts on reviewed task branches from current `main`; `research` and the cutover branch are historical context.
- Migration head: `0072`.
- Standard v0.2 is ratified and effective.
- Final cutover head passed Ratified Standard (`29717830698`), Hermes Upstream Review (`29717830703`), and Main Integration Gates (`29717830737`).
- Gate 0 is accepted only for its declared source/document/CI scope.
- The broad historical `npm run test:unit` aggregate is explicitly red on that evidence head; PR `#23` records 30 files and 112 failed tests from stale/migrating fixtures. Curated green suites are not broader proof.
- Connector identity, custody, setup, tool ownership, and capability readiness are manifest-driven.
- MCP Apps and AG-UI directions are ratified; complete implementation/conformance remains open.
- Canonical production Compose selection is source-wired.
- Local/CI PostgreSQL is the database TDD inner loop; disposable managed Supabase remains a platform-specific and release-candidate proof boundary.
- Target-host, live connector/provider, fixture-free golden work, commercial, recovery, rollback, accessibility, capacity, deployment, and launch acceptance remain open.

## Current roadmap structure

The active program contains:

- a machine-readable 38-issue production vector;
- nine dependency-ordered workstreams;
- a test-suite disposition map;
- Phase 1.1 through Phase 1.9 production closure;
- Phase 2 frozen exact-candidate acceptance;
- Phase 3 controlled pilot;
- Phase 4 measured fleet expansion.

Phase 1.1 repairs repository/test truth before feature expansion. The active roadmap and workstream map define exact dependencies, evidence, tests, prerequisites, stop rules, and completion predicates.

## Historical plan families

The following are retained as point-in-time evidence and subsystem history:

- `phase-2-standard-remediation-execution.md` — predecessor remediation program;
- `2026-07-20-capability-production-closure/` — predecessor capability/CI closure packet;
- `phase-00-*` through `phase-06-*` — historical phase family;
- `surface-research-hermes-gui-and-materialization.md` — historical runtime/UI research;
- `context-engineering/` — historical context-engineering workstream.

When historical material conflicts with the ratified Standard, active program, current source, applied migrations, exact-SHA proof, or current CODEGRAPH, current authority wins. Historical facts are not silently rewritten.

## Implementation rules

- Preserve Hermes as employee runtime and Manager as authority/effect plane.
- Use shared connector/capability/work/action contracts rather than bespoke provider UI ontology.
- Treat MCP core, MCP Apps, and AG-UI as bounded interoperability adapters, not execution authority.
- Keep Web, SMS, and signed Review as role-safe projections of the same durable work.
- Keep customer-facing, monetary, destructive, credential, and broad external changes behind assignment-aware policy, approval, effects, and receipts.
- Never promote source, fixture, local PostgreSQL, old-host, or ancestor-SHA evidence into a live state it did not exercise.
- No feature expansion while a prerequisite P0 is unresolved.

## Plan update transaction

When dependency order or a release gate changes:

1. update the active program or one subordinate task file;
2. update the Standard vector only if clause satisfaction/direction changed;
3. update source/tests when implementation changed;
4. update scoped/root CODEGRAPH and architecture indexes;
5. update one dated memory handoff and the sole memory index;
6. update wiki/root routing only when stale readers could be misled;
7. stop branch movement and obtain exact-head workflow evidence;
8. update the active PR or merged-release record.

Creating another competing “current plan” without superseding this index in the same transaction is prohibited.
