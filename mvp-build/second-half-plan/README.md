# AMTECH AI Employee Production Plan Index

Status: **one active production program; WS-01 and WS-02 protocol source/CI controls accepted; post-cutover**  
Updated: 2026-07-20

## Active authority

The single active production program is:

[`2026-07-19-ratified-standard-production-program/README.md`](2026-07-19-ratified-standard-production-program/README.md)

It is governed by ratified `../STANDARD.md`, current `../CODEGRAPH.md`, the sole `../memory/MEMORY.md` index, and current source/migrations/tests/workflows/proof/reviewed merges. No other folder in `second-half-plan/` is current execution authority.

## Current execution state

- New work starts on reviewed branches from current `main`.
- Merged baseline: PR `#30`, `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`.
- WS-02 source/CI evidence head: `6f792eabe44a9ca1e9635fd4fe5329fa7daca6c4`.
- Evidence: Standard `29731384034`, Hermes `29731384166`, Main Integration `29731384039`.
- Current broad aggregate: **109 files / 630 tests**. WS-01’s original closure remains **106 files / 613 tests**.
- Streaming-first Hermes/Web, Remote MCP authorization contracts, sealed OAuth custody, MCP Apps host boundary, AG-UI projection/transport, persisted effective capabilities, and MCP execution interception are source/CI accepted.
- Phase 1.2 is not fully complete because live connector authorization/health/revocation/outage/repair/deletion and external protocol-host evidence remain open.
- Migration head `0072`; Hermes pin unchanged.
- Database, target host, fixture-free provider/channels, commercial, recovery, accessibility, capacity, deployment, pilot, and production acceptance remain open.

## Current roadmap structure

The active program retains an immutable 38-issue baseline, current resolution ledger, nine dependency-ordered workstreams, test disposition, Phases 1.1–1.9, frozen release candidate, controlled pilot, and measured expansion.

Phase 1.1 is complete for source/CI. Phase 1.2 source/CI implementation is accepted for ISS-007 through ISS-010; ISS-011 live connector lifecycle remains the workstream completion gate. Continue without reopening Manager provider or connector authority.

## Implementation rules

- Preserve Hermes as runtime and Manager as authority/effect/custody plane.
- Keep first-token streaming fast; do not buffer harmless text behind effect authorization.
- Treat MCP, MCP Apps, and AG-UI as bounded adapters.
- Browser/model/protocol payloads cannot select providers, tools, scopes, hosts, credentials, or authority versions.
- Consequential actions use current assignment policy, approval where required, one effect reservation, and durable receipt.
- Never promote source/fixtures/local evidence into live acceptance.

## Plan update transaction

When dependency or gate state changes: update the active program/subordinate task, source/tests, CODEGRAPH/architecture, one memory handoff and index, freeze branch movement, obtain exact-head evidence, then update the PR/release record. Competing current plans are prohibited.