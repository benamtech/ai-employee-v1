# MVP Implementation Records

Status: active historical factual ledger  
Updated: 2026-07-19

This folder records point-in-time implementation and proof state for `mvp-build/`. It preserves factual history; it does not define current architecture, current branch status, or live acceptance by itself.

## Read order

1. `../../../identity.md`
2. root `../../../CODEGRAPH.md`
3. `../../../mvp-build/CODEGRAPH.md`
4. `../../../mvp-build/memory/MEMORY.md` and the newest relevant handoff
5. `../../../mvp-build/docs/architecture/README.md`
6. `../../../mvp-build/docs/architecture/12-document-control-memory-and-handoff-map.md`
7. the relevant dated implementation record
8. current source, migrations, workflows, proof artifacts, and target-environment evidence

Older records remain point-in-time evidence. When they conflict with current source, CODEGRAPH, architecture, the newest memory, or exact-head proof, do not silently repeat the older state.

## Current factual headline

- The canonical normal-employee path is real owner authentication/identity, canonical activation, durable provisioning, isolated Hermes runtime, owner Web/SMS/Review, provider-backed work, and durable proof.
- The public estimator is outdated and non-canonical for launch acceptance.
- Current integration branch: `employee-production-tuesday`; draft PR `#23`; migration head `0069`.
- Current source includes Model Gateway custody, rendered-profile integrity, desired-resource reconciliation, ambient inbox/worker foundations, assignment/C3/approval/revocation, connector/commercial boundaries, onboarding activation, generated UI, strict context reads, production topology, and exact-head repository archaeology.
- Exact current implementation/CI proof belongs in `mvp-build/CODEGRAPH.md`, the newest handoff, PR `#23`, and named workflow artifacts.
- Approved real-Supabase migration, target-host runtime/network, live provider/identity, fixture-free channel, commercial reconciliation, cumulative budget/shared rate enforcement, capacity, crash/repair, rollback, attestation, deployment, and launch acceptance remain separate live gates unless exact evidence closes them.

## Record index

1. [`2026-07-17-ws1-ws2-production-boundary-record.md`](2026-07-17-ws1-ws2-production-boundary-record.md) — point-in-time Model Gateway/profile/provisioning/reconciler/ambient-inbox boundary record from July 17. Later source has advanced; read current CODEGRAPH first.
2. [`2026-07-05-mcp-server-toolsets-tool-activity-record.md`](2026-07-05-mcp-server-toolsets-tool-activity-record.md) — MCP/toolset/tool-activity implementation history.
3. [`2026-07-03-phase-04-hardening-and-phase-06-record.md`](2026-07-03-phase-04-hardening-and-phase-06-record.md) — Phase 4 hardening and Phase 6 history.
4. [`2026-07-03-phase-03-03a-04-core-record.md`](2026-07-03-phase-03-03a-04-core-record.md) — Phase 3/3A/4 core history.
5. [`2026-06-30-phase-02-runtime-scheduler-record.md`](2026-06-30-phase-02-runtime-scheduler-record.md) — runtime/scheduler history.
6. [`2026-06-30-phase-01-acceptance-harness-record.md`](2026-06-30-phase-01-acceptance-harness-record.md) — Phase 1 acceptance-harness history.
7. Earlier records — baseline, Gmail/Stripe, Work Surface, repair/security, and event-bus history.

The complete tracked-file inventory from `mvp-build/scripts/repository-archaeology-v2.mjs` accounts for every record and Markdown file on the exact branch head. This README remains the human index for this folder.

## Record requirements

Every new implementation record must include:

1. date, branch, PR, and exact implementation SHA;
2. exact source/migration files;
3. status using current acceptance vocabulary;
4. exact tests/workflows/proofs and artifact/ID references;
5. explicit validation not run;
6. unresolved risks and next evidence;
7. links to current CODEGRAPH, architecture/risk register, and the relevant memory handoff;
8. a statement that later source may supersede the point-in-time record.

## Proof rule

Do not mark a provider-backed or runtime capability accepted unless it leaves real proof such as:

- approved Supabase migration/RLS/behavior evidence;
- Twilio SID/status;
- Gmail/provider message ID;
- Stripe/QuickBooks provider object ID;
- Model Gateway request/provider/accounting receipt IDs;
- Hermes runtime/run/session/health proof;
- container/network/profile-checksum/Caddy artifact;
- fixture-free owner activation and browser/channel IDs;
- crash/repair/dead-letter/replay/rollback evidence;
- exact deployed SHA and image digests.

Mocks, fixtures, static source review, local UI screenshots, old containers, manually injected provider events, trajectory scores, historical records, and the public estimator are not normal-employee provider/runtime acceptance.

## Organization rule

Historical records stay in place to preserve paths and point-in-time evidence. Do not reorganize them physically without rewriting every inbound reference and retaining an archive/index path. Current navigation is provided by this README and `mvp-build/docs/architecture/12-document-control-memory-and-handoff-map.md`.
