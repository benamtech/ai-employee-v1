# AMTECH AI Employee Production Plan Index

Status: **one active production program; WS-01 source/CI closed; post-cutover**  
Updated: 2026-07-20

## Active authority

The single active production program is:

[`2026-07-19-ratified-standard-production-program/README.md`](2026-07-19-ratified-standard-production-program/README.md)

It is governed by:

- `../STANDARD.md` — ratified normative requirements;
- `../validation/standard-v0.2-evolution-vector.json` — original-to-ratified clause/implementation motion;
- `../CODEGRAPH.md` — current source topology, migration head, and evidence boundary;
- `../memory/MEMORY.md` — sole narrative handoff index;
- current source, migrations, tests, workflows, proof, and reviewed merges into `main`.

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

- PR `#29` merged the post-cutover roadmap into `main`.
- Current integration baseline: `main@816aae325401a8d8d4bc7ffe90e8f241eb977ba8`.
- WS-01/WS-02 implementation evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`.
- New work starts on reviewed task branches from current `main`; `research` and cutover branches are historical context.
- Migration head: `0072`.
- Standard v0.2 is ratified and effective.
- Implementation head passed Ratified Standard (`29725298168`), Hermes Upstream Review (`29725298172`), and Main Integration Gates (`29725298163`).
- WS-01 is source/CI resolved: the full broad aggregate passes **106 files / 613 tests**, and Main Integration requires it independently on PRs and `main`.
- The Standard workflow no longer duplicates broad/build execution or historical branch triggers.
- The Model Gateway provider-authority surface is source/CI locked: Manager alone resolves registered provider identity, endpoint, upstream model, and master credential; caller routing/credential fields fail before dispatch.
- Remote MCP authorization, MCP Apps, AG-UI, persisted effective capabilities, and live connector lifecycle remain open WS-02 work.
- Local/CI PostgreSQL is the database TDD inner loop; disposable managed Supabase remains a platform-specific and release-candidate proof boundary.
- Target-host, live provider/channel, fixture-free golden work, commercial, recovery, rollback, accessibility, capacity, deployment, pilot, and production acceptance remain open.

## Current roadmap structure

The active program contains:

- an immutable machine-readable 38-issue baseline vector;
- a current machine resolution ledger;
- nine dependency-ordered workstreams;
- a test-suite disposition map;
- Phase 1.1 through Phase 1.9 production closure;
- Phase 2 frozen exact-candidate acceptance;
- Phase 3 controlled pilot;
- Phase 4 measured fleet expansion.

Phase 1.1 is complete for source/CI scope. Continue Phase 1.2 from its remaining remote protocol, effective-capability, and live connector boundaries without reopening provider authority. The active roadmap and workstream map define exact dependencies, evidence, tests, prerequisites, stop rules, and completion predicates.

## Historical plan families

The following are retained as point-in-time evidence and subsystem history:

- `phase-2-standard-remediation-execution.md` — predecessor remediation program;
- `2026-07-20-capability-production-closure/` — predecessor capability/CI closure packet;
- `phase-00-*` through `phase-06-*` — historical phase family;
- `surface-research-hermes-gui-and-materialization.md` — historical runtime/UI research;
- `context-engineering/` — historical context-engineering workstream.

When historical material conflicts with the ratified Standard, active program, current source, applied migrations, exact-SHA proof, or current CODEGRAPH, current authority wins. Historical facts are not silently rewritten.

## Implementation rules

- Preserve Hermes as employee runtime and Manager as authority/effect/provider-custody plane.
- Use shared connector/capability/work/action contracts rather than bespoke provider UI ontology.
- Treat MCP core, MCP Apps, and AG-UI as bounded interoperability adapters, not execution authority.
- Runtime/model/browser/protocol payloads cannot select provider routing or credentials.
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
