# MVP Implementation Records

Status: active historical factual ledger  
Updated: 2026-07-19

This folder records point-in-time implementation and proof state for `mvp-build/`. It preserves factual history; it does not define current architecture, branch status, dependency order, or acceptance by itself.

## Read order

1. `../../../identity.md`
2. root `../../../CODEGRAPH.md`
3. `../../../mvp-build/CODEGRAPH.md`
4. ratified `../../../mvp-build/STANDARD.md`
5. `../../../mvp-build/second-half-plan/README.md` and its active program
6. `../../../mvp-build/memory/MEMORY.md` and the newest relevant handoff
7. `../../../mvp-build/docs/architecture/README.md`
8. the relevant dated implementation record
9. current source, migrations, workflows, proof, and target-environment evidence

Older records remain point-in-time evidence. When they conflict with current source or current indexes, do not silently repeat the old state.

## Current factual headline

- The canonical path is real owner identity, explicit assignment, canonical activation, durable provisioning, isolated Hermes runtime, governed capabilities/connectors, owner Web/SMS/Review, provider-backed work, and durable proof.
- Current integration branch: `employee-production-tuesday`; draft PR `#23`; migration head `0072`.
- Standard v0.2 is ratified and effective.
- The single active plan is indexed by `mvp-build/second-half-plan/README.md`.
- Connector identity, custody, setup protocol, exact managed tool ownership, and capability readiness are manifest-driven; Gmail, QuickBooks, and Stripe are adapters.
- Routine database TDD uses production-shaped local/CI PostgreSQL. Disposable managed Supabase is a platform-specific/release evidence gate, not the inner loop.
- Canonical production topology selection is source-wired.
- Exact current implementation/CI proof belongs in scoped CODEGRAPH, the newest handoff, PR `#23`, and named workflow artifacts.
- Target-host, live connector/provider, fixture-free channels, commercial reconciliation, cumulative budget/shared rate enforcement, capacity, crash/repair, rollback, attestation, deployment, and launch acceptance remain separate gates unless exact evidence closes them.

## Record index

1. [`2026-07-17-ws1-ws2-production-boundary-record.md`](2026-07-17-ws1-ws2-production-boundary-record.md) — point-in-time Model Gateway/profile/provisioning/reconciler/ambient-inbox record.
2. [`2026-07-05-mcp-server-toolsets-tool-activity-record.md`](2026-07-05-mcp-server-toolsets-tool-activity-record.md) — MCP/toolset/tool-activity implementation history; read current connector/MCP disposition first.
3. [`2026-07-03-phase-04-hardening-and-phase-06-record.md`](2026-07-03-phase-04-hardening-and-phase-06-record.md) — Phase 4 hardening and Phase 6 history.
4. [`2026-07-03-phase-03-03a-04-core-record.md`](2026-07-03-phase-03-03a-04-core-record.md) — Phase 3/3A/4 core history.
5. [`2026-06-30-phase-02-runtime-scheduler-record.md`](2026-06-30-phase-02-runtime-scheduler-record.md) — runtime/scheduler history.
6. [`2026-06-30-phase-01-acceptance-harness-record.md`](2026-06-30-phase-01-acceptance-harness-record.md) — Phase 1 acceptance-harness history.
7. Earlier records — baseline, Gmail/Stripe, Work Surface, repair/security, and event-bus history.

## Record requirements

Every new implementation record must include:

1. date, branch, PR, and exact implementation SHA;
2. exact source/migration files;
3. status using ratified acceptance vocabulary;
4. exact tests/workflows/proofs and artifact/ID references;
5. explicit validation not run;
6. unresolved risks and next evidence;
7. links to current Standard, CODEGRAPH, active program, architecture, and memory;
8. a statement that later source may supersede the point-in-time record.

## Proof rule

A provider/runtime capability requires evidence appropriate to its boundary, such as:

- disposable managed-Supabase migration/platform behavior proof where required;
- Twilio SID/status;
- provider message/object/event IDs;
- Model Gateway request/provider/accounting receipt IDs;
- Hermes runtime/run/session/health evidence;
- container/network/profile-checksum/Caddy evidence;
- fixture-free owner and channel evidence;
- crash/repair/dead-letter/replay/rollback evidence;
- exact deployed SHA, image digests, provenance, and manifest.

Local PostgreSQL, mocks, fixtures, static source review, local screenshots, old containers, manually injected events, trajectory scores, historical records, and the public estimator cannot satisfy provider/runtime/deployment acceptance.

## Organization rule

Historical records stay in place to preserve paths and point-in-time evidence. Current navigation is provided by this README, root/scoped CODEGRAPH, the active plan index, `memory/MEMORY.md`, and the architecture document-control map.
