# AMTECH AI Employee Production Plan Index

Status: **one active production program; hardened WS-02 source/CI accepted; WS-03 prepared**  
Updated: 2026-07-20

## Active authority

The single active production program is:

[`2026-07-19-ratified-standard-production-program/README.md`](2026-07-19-ratified-standard-production-program/README.md)

It is governed by ratified `../STANDARD.md`, current `../CODEGRAPH.md`, the sole `../memory/MEMORY.md` index, and current source, migrations, tests, workflows, proof, and reviewed merges. No other folder in `second-half-plan/` is current execution authority.

## Current execution state

- New work starts on reviewed branches from current `main`.
- Merged baseline: current `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`.
- Hardened WS-02 implementation evidence: `16dc18e0535ac14f867875989dfe5aee596f89c0`.
- Evidence runs: Standard `29735429854`, Hermes `29735429873`, Main Integration `29735429859`.
- Broad regression: **110 files / 635 tests**. WS-01 remains **106 files / 613 tests**.
- `ISS-007`–`ISS-010` are source/CI resolved. `ISS-011` live connector/protocol lifecycle evidence remains open.
- WS-03 is prepared in active-program documents `17` and `18`; implementation has not started.
- Migration head is `0072`; production acceptance remains open.

## Roadmap rule

Phase 1.1 is complete for source/CI. Finish the Phase 1.2 live gate, then start the guarded Phase 1.3 database sequence from then-current `main` after PR `#31` is merged or formally superseded.

## Plan update transaction

When dependency or gate state changes: update the active program, source/tests, CODEGRAPH/architecture, one memory handoff and index, freeze branch movement, obtain exact-head evidence, then update the PR or release record. Competing current plans are prohibited.
