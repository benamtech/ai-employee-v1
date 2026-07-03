# AI Employee — Next-Era Phase Plan (Productionize + Operate)

Status: active

Date: 2026-06-30

This folder is **the phased build plan for the next era of development**. Earlier docs in
[`../`](../) referenced "phases" loosely (Phase 0–6, "Phase 6/7 seams") but never authored the
forward work as real, ordered, shippable units — it lived as parallel "Workstreams A–H" in the
now-retired [`../05-implementation-workstreams.md`](../05-implementation-workstreams.md). This folder
replaces that with **genuine modular phases**.

## Era boundary

- **Phase 0 — Baseline** is the current source-wired MVP loop plus the Phase-6/7 event-bus seams.
  It is the starting line, not a build phase. See [`phase-00-baseline.md`](phase-00-baseline.md).
- **Phases 1–13 plus Phase 3A** are the next era: take the source-wired loop to **live acceptance**, then
  **productionize and operate** it (runtime, event spine, metering, admin, billing, LLM registry,
  scale).

The era's job: go from "source-complete, locally green" to "running paid pilots safely, manageable
by one operator toward ~1000 users."

## What makes these real modular phases

1. **One module per phase.** A phase owns a defined code/schema surface and exposes a stable seam
   the next phase plugs into. Phases are cut by module, not by provider.
2. **Dependency-ordered.** Cross-cutting foundations (live acceptance posture, metering core, admin
   identity) are their own early phases; later phases plug into them.
3. **Each phase has its own acceptance gate** in the shared status vocabulary below — a phase is not
   "done" until its gate is met with real proof.
4. **The dependency graph is explicit**, so independent phases can run in parallel.
5. **Every phase doc follows one template:** Goal/Module · Depends on · Surface (code + schema) ·
   Build tasks · Acceptance proof · Seam handed forward · Status.

## Status vocabulary

| State | Meaning |
|---|---|
| `source-wired` | code exists and local typecheck/unit/build/lint pass |
| `provider-accepted` | live provider proof ids captured (Twilio/Gmail/Stripe/PubSub/Supabase) |
| `runtime-accepted` | live Hermes/runtime/job proof captured |
| `planned` | designed but not implemented |
| `pending` | blocked by missing env/credential/host, or not yet attempted |

Phase 0 is `source-wired`. Everything in Phases 1–13 plus Phase 3A is `planned`/`pending` today — this folder
authors structure, not progress. Do not upgrade a status without real proof ids (see
[`../README.md`](../README.md) working rule).

## Phase index

| # | Phase | Depends on | Status |
|---|---|---|---|
| 0 | [Baseline — current source-wired MVP](phase-00-baseline.md) | — | source-wired |
| 1 | [Live Provider & Runtime Acceptance](phase-01-provider-runtime-acceptance.md) | 0 | pending |
| 2 | [Runtime & Scheduler Productionization](phase-02-runtime-scheduler-productionization.md) | 1 | source-wired |
| 3 | [Generic Ingress & Event Routing](phase-03-generic-ingress-event-routing.md) | 0 | planned |
| 3A | [Channel, Session & Presence Layer](phase-03a-channel-session-presence-layer.md) | 0, 3 | planned |
| 4 | [Live Employee Wake Path & Descriptors](phase-04-live-wake-path-descriptors.md) | 2, 3, 3A | planned |
| 5 | [Triage, Batching & Live Work Surface Stream](phase-05-triage-batching-work-surface-stream.md) | 4 | planned |
| 6 | [Metering Foundation](phase-06-metering-foundation.md) | 1 | planned |
| 7 | [Metering Instrumentation](phase-07-metering-instrumentation.md) | 6 | planned |
| 8 | [Metering Rollups, Budgets & Safe Summaries](phase-08-metering-rollups-budgets-summaries.md) | 7 | planned |
| 9 | [Admin Foundations](phase-09-admin-foundations.md) | 1 | planned |
| 10 | [Admin Operations Surfaces](phase-10-admin-operations-surfaces.md) | 9, 2, 3, 8 | planned |
| 11 | [AMTECH Billing Scaffold](phase-11-amtech-billing-scaffold.md) | 9 | planned |
| 12 | [LLM Provider Registry](phase-12-llm-provider-registry.md) | 6, 7, 9 | planned |
| 13 | [1000-User Operations](phase-13-1000-user-operations.md) | 10, 11, 12 | planned |

## Dependency graph

```text
                         0  Baseline (source-wired)
                         |
              +----------+-----------------------------+
              |                                         |
              v                                         v
   1  Provider/Runtime Acceptance (gate)     3  Generic Ingress & Routing
              |                                         |
   +----------+-----------+------------+                |
   |          |           |            |                |
   v          v           v            v                v
   2 Runtime  6 Metering  9 Admin     (RLS posture)   3A Channel/Session/Presence
   |  & Sched  Foundation  Foundations                    |
   |          |           |                               v
   |          v           |                            4  Live Wake Path (needs 2 + 3 + 3A)
   |       7 Metering     |                               |
   |        Instrument.    |                               v
   |          |           |                            5  Triage / Batching /
   |          |           |                               Live Work Surface stream
   |          |           |
   |          v           |
   |       8 Metering     |
   |        Rollups       |
   |          |           |
   +----+-----+-----+-----+---------+
        |           |               |
        v           v               v
   10 Admin Ops   11 Billing     12 LLM Provider
   Surfaces       Scaffold        Registry
   (2,3,8,9)      (9, soft 8)     (6,7,9)
        |           |               |
        +-----------+-------+-------+
                            |
                            v
                   13  1000-User Operations
```

Independent foundations that can be built in parallel after Phase 1: **2**, **3**, **3A**, **6**, **9**.

## Durable memory

After implementing a phase (or any substantial/architectural work), write an in-repo durable memory
handoff in [`../../../../mvp-build/memory/`](../../../../mvp-build/memory/) per its protocol
([`mvp-build/memory/MEMORY.md`](../../../../mvp-build/memory/MEMORY.md)), and keep the matching
[`../../implementation-records/`](../../implementation-records/) entry current. The build-home agent
guide is [`mvp-build/CLAUDE.md`](../../../../mvp-build/CLAUDE.md) / `AGENTS.md`.

## Where the detail lives

These phase docs are the **sequence and acceptance gates**. The deeper design detail still lives in
the sibling reference docs, which each phase cites:

- [`../03-provider-runtime-acceptance-plan.md`](../03-provider-runtime-acceptance-plan.md) — Phase 1 runbook.
- [`../04-admin-and-metering-plan.md`](../04-admin-and-metering-plan.md) — design detail for Phases 6–13.
- [`../02-current-system-architecture.md`](../02-current-system-architecture.md) — the reconciled architecture.
- [`../event-driven-office-and-generative-ui.md`](../../event-driven-office-and-generative-ui.md) — event spine for Phases 3–5.
- [`../../agent-inbox-and-channel-architecture.md`](../../agent-inbox-and-channel-architecture.md) — serialized inbox,
  Hermes turn-atomicity, and the Channel/Session/Presence router for Phases 3A–5.
