# Implementation Workstreams — RETIRED (now phased)

Status: superseded

The forward work formerly described here as parallel **Workstreams A–H** has been authored as a real,
dependency-ordered **modular phase plan**. Use [`phases/`](phases/) as the current forward roadmap.
This file remains only as the **crosswalk** so older references to "Workstream X" still resolve.

## Workstream → phase crosswalk

| Old workstream | Now |
|---|---|
| A — Live Provider Runtime Acceptance | [Phase 1](phases/phase-01-provider-runtime-acceptance.md) |
| B — Runtime And Scheduler Productionization | [Phase 2](phases/phase-02-runtime-scheduler-productionization.md) |
| C — Event Bus And Work Surface Completion | [Phase 3](phases/phase-03-generic-ingress-event-routing.md) (ingress/routing) + [Phase 4](phases/phase-04-live-wake-path-descriptors.md) (live wake/descriptors) + [Phase 5](phases/phase-05-triage-batching-work-surface-stream.md) (triage/batching/live stream) |
| E — Metering | [Phase 6](phases/phase-06-metering-foundation.md) (foundation) + [Phase 7](phases/phase-07-metering-instrumentation.md) (instrumentation) + [Phase 8](phases/phase-08-metering-rollups-budgets-summaries.md) (rollups/budgets/summaries) |
| D — Admin System MVP | [Phase 9](phases/phase-09-admin-foundations.md) (foundations) + [Phase 10](phases/phase-10-admin-operations-surfaces.md) (operations surfaces) |
| F — AMTECH Billing | [Phase 11](phases/phase-11-amtech-billing-scaffold.md) |
| G — LLM Provider Registry | [Phase 12](phases/phase-12-llm-provider-registry.md) |
| H — 1000-User Operations | [Phase 13](phases/phase-13-1000-user-operations.md) |

Workstream C was split into Phases 3–5 and Workstreams D/E into Phases 9–10 / 6–8 because each held
several independent modules; metering's three layers and admin's identity-vs-surfaces split now have
their own acceptance gates. See [`phases/README.md`](phases/README.md) for the dependency graph.
