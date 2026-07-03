# AMTECH AI Employee Build Plan Current

Status: active

Date: 2026-06-30

This folder is the reconciled build plan for the AMTECH AI Employee MVP and first production operating layer. It combines:

- the original whole-product packet in [`../old-build-plan/`](../old-build-plan/);
- factual implementation records in [`../implementation-records/`](../implementation-records/);
- forward event-office design in [`../event-driven-office-and-generative-ui.md`](../event-driven-office-and-generative-ui.md);
- production admin and metering docs in [`../../../mvp-build/docs/`](../../../mvp-build/docs/);
- current source state in [`../../../mvp-build/`](../../../mvp-build/).

The original [`../old-build-plan/`](../old-build-plan/) folder is not rewritten. Treat it as the original complete packet. Treat this folder as the current reconciled packet for next implementation work.

## Current Bar

The whole-product MVP bar still stands:

```text
signup/claim -> live employee -> estimate PDF -> approved Gmail send
  -> real Gmail customer reply event -> approved Stripe Connect test-mode deposit invoice
  -> internal job reminder
```

Current code has source-level wiring for the full loop plus Phase 6/7 production seams, but live provider/runtime acceptance is still pending because real credentials/host setup are absent.

## Current Packet

- [`phases/`](phases/) - **THE forward roadmap**: the next era of development authored as real, dependency-ordered modular phases (Phase 0 baseline + Phases 1-13, from live acceptance through 1000-user operations). Start here for next build work.
- [`00-source-of-truth.md`](00-source-of-truth.md) - rules, source hierarchy, what this folder supersedes.
- [`01-reconciled-scope-and-status.md`](01-reconciled-scope-and-status.md) - current implementation status, accepted vs pending.
- [`02-current-system-architecture.md`](02-current-system-architecture.md) - reconciled architecture including owner surface, Manager, event bus, runtime, admin, and metering.
- [`03-provider-runtime-acceptance-plan.md`](03-provider-runtime-acceptance-plan.md) - exact remaining live proof plan (the **Phase 1** runbook).
- [`04-admin-and-metering-plan.md`](04-admin-and-metering-plan.md) - admin system and metering design detail (feeds **Phases 6-13**).
- [`05-implementation-workstreams.md`](05-implementation-workstreams.md) - RETIRED; kept as the Workstream A-H -> phase crosswalk.
- [`06-next-agent-handoff.md`](06-next-agent-handoff.md) - copy-ready prompt for the next implementation/planning agent.

## Working Rule

Do not mark a capability accepted unless it leaves real proof ids: Twilio SID, Gmail ids, Pub/Sub message id, Stripe account/invoice/webhook ids, Supabase artifact/storage evidence, migration status, RLS denial proof, Hermes runtime/job proof, or admin/metering audit rows.

Local typecheck/unit/build/lint proof is useful but not provider acceptance.
