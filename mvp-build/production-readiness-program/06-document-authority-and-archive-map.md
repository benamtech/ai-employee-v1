# Document Authority and Archive Map

Status: active routing contract  
Updated: 2026-07-20

## One current route

Current work starts from:

1. `identity.md`;
2. root `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, and `CODEGRAPH.md`;
3. scoped `mvp-build/AGENTS.md`, `mvp-build/CLAUDE.md`, and `mvp-build/CODEGRAPH.md`;
4. `mvp-build/STANDARD.md`;
5. `mvp-build/production-readiness-program/`;
6. `mvp-build/memory/MEMORY.md` and the newest relevant indexed handoff;
7. relevant architecture, source, migrations, tests, workflows, proof, PRs, and current diff.

The Standard is normative. This folder owns active dependency order. CODEGRAPH owns current topology and proof boundaries. Memory owns narrative handoff. Current source, tests, and exact evidence decide implemented status.

## Active documents

| Family | Active authority |
|---|---|
| Product identity | `identity.md` |
| Repository operation | root/scoped `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md` |
| Normative requirements | `mvp-build/STANDARD.md` |
| Current implementation map | root/scoped `CODEGRAPH.md` |
| Active production-readiness program | `mvp-build/production-readiness-program/` |
| Active workstream/test detail | program files `08`, `09`, and `10` |
| Architecture/research | `mvp-build/docs/architecture/README.md` and indexed companions |
| Narrative handoff | `mvp-build/memory/MEMORY.md` and newest indexed handoff |
| Acceptance | current source, migrations, executable tests, workflows, proof, and exact PR/commit evidence |

## Historical material

All content under `mvp-build/second-half-plan/` is historical and non-canonical. It preserves point-in-time plans, including the superseded prototype-era second-half build plan and `2026-07-20-capability-production-closure/`. Historical wiki plans and implementation records remain factual ledgers, not current execution authority.

Historical material is not silently rewritten to look current. Its active indexes and status banners route readers to `mvp-build/production-readiness-program/`.

## Evidence rule

PR #33, current source, and executable tests supersede stale plan-status prose. They establish only their exact evidence. They do not establish live provider, fixture-free channel, managed database, target-host, pilot, or production acceptance.

## Post-change transaction

When state or dependency order changes: update source/tests first; update this program; update issue/workstream/test maps; update CODEGRAPH/architecture when topology changes; write one dated memory handoff and update the sole memory index; update root/wiki routing only where stale readers could be misled; then obtain exact-head evidence and update the PR/release record.

## Anti-context-rot rules

- Do not create another current plan without superseding this folder in the same transaction.
- Do not use memory as a second plan or CODEGRAPH as an incident diary.
- Do not infer authority from dates or filenames.
- Do not carry workflow evidence across a relevant later SHA.
- Do not substitute curated suites, fixtures, or source wiring for broader or live acceptance.
