# MVP Implementation Records

Status: active factual ledger
Updated: 2026-07-17

This folder records what is actually implemented in `mvp-build/`, what proof exists, and what remains pending. It does not promote a design or source change to provider/runtime acceptance.

## Read order

1. `../../../identity.md`
2. `../../../mvp-build/CODEGRAPH.md`
3. `../../../mvp-build/memory/MEMORY.md` and newest relevant handoff
4. [2026-07-17 WS1/WS2 production boundary record](2026-07-17-ws1-ws2-production-boundary-record.md) — current model-gateway custody, profile integrity, provisioning/reconciler foundation, ambient-inbox groundwork, static risks, and explicit validation not run.
5. [2026-07-05 MCP/toolsets/tool-activity record](2026-07-05-mcp-server-toolsets-tool-activity-record.md)
6. [2026-07-03 Phase 4 hardening and Phase 6 record](2026-07-03-phase-04-hardening-and-phase-06-record.md)
7. [2026-07-03 Phase 3/3A/4 core record](2026-07-03-phase-03-03a-04-core-record.md)
8. [2026-06-30 Phase 2 runtime/scheduler record](2026-06-30-phase-02-runtime-scheduler-record.md)
9. [2026-06-30 Phase 1 acceptance-harness record](2026-06-30-phase-01-acceptance-harness-record.md)
10. Earlier records for baseline, Gmail/Stripe, Work Surface, repair/security, and event-bus history.

Older records remain point-in-time evidence. When they conflict with current source or the newest record, do not silently repeat the old state.

## Current factual headline

- The canonical normal-employee path is public onboarding through a real owner account, isolated runtime, owner web client, provider-backed reply, and useful connected-tool proof.
- The public estimator is outdated and non-canonical for launch acceptance.
- WS1 Model Gateway custody and rendered-profile integrity are source-wired.
- WS2 durable provisioning/resource/retry/drift/command foundations are source-wired, but the true DB-backed reconciler worker remains pending.
- WS3 `ambient_event_inbox` is schema groundwork; provider ingress migration remains pending.
- The WS1/WS2 changes are not provider-accepted or runtime-accepted from the 2026-07-17 documentation session.

## Record requirements

Every new implementation record must include:

1. date and branch;
2. exact source/migration files;
3. status using `source-wired`, `provider-accepted`, `runtime-accepted`, `planned`, or `pending`;
4. exact tests/proofs run and their artifacts/IDs;
5. explicit validation not run;
6. unresolved risks and next evidence.

## Proof rule

Do not mark a provider-backed or runtime capability accepted unless it leaves real proof such as:

- Twilio SID/status;
- Gmail/provider message ID;
- Stripe/QuickBooks provider object ID;
- Supabase migration/storage/RLS evidence;
- Model Gateway request audit ID;
- Hermes runtime/job/health proof;
- container/network/profile checksum artifact;
- production browser onboarding IDs.

Mocks, fixtures, static source review, local UI screenshots, old containers, manually injected provider events, and the public estimator are not normal-employee provider/runtime acceptance.