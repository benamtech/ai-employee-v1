# MVP Implementation Records

Status: active

This folder is the implementation ledger for the AMTECH AI Employee MVP. It sits beside, but does **not** replace or rewrite, the original build plan at [`../old-build-plan/`](../old-build-plan/).

Use this packet when you need to answer:

- what has been implemented in [`../../../mvp-build/`](../../../mvp-build/);
- which build-plan phases have code wiring vs provider-backed acceptance;
- what tests/proofs have passed locally;
- what must be verified in a real Supabase/Twilio/Hermes/Caddy environment;
- what the next implementation phase should inherit.

## Reading Order

1. [`../../../CODEGRAPH.md`](../../../CODEGRAPH.md) - workspace map and current canonical build state.
2. [`../old-build-plan/README.md`](../old-build-plan/README.md) - original whole-product MVP bar and plan packet.
3. [`2026-06-29-phase-0-2-record.md`](2026-06-29-phase-0-2-record.md) - baseline implementation record through Phase 2 wiring.
4. [`2026-06-29-phase-3-partial-record.md`](2026-06-29-phase-3-partial-record.md) - Phase 3/4 source wiring record (Gmail, typed work events, Stripe test-mode).
5. [`2026-06-29-phase-5-and-work-surface-record.md`](2026-06-29-phase-5-and-work-surface-record.md) - Phase 0–4 loose ends closed, Phase 5 close-the-loop + reminder firing/watch-renewal scheduler seam, the descriptor-driven Work Surface redesign, and the still-pending provider proof.
6. [`2026-06-30-phase-6-and-event-bus-record.md`](2026-06-30-phase-6-and-event-bus-record.md) - Phase 6 repair/security/runtime hardening plus Phase 7 event-bus seams (`deliver_only`/`wake_employee`, registry, triage/batching, daily briefs, SSE seam), with provider/runtime proof still pending.
7. [`2026-06-30-phase-01-acceptance-harness-record.md`](2026-06-30-phase-01-acceptance-harness-record.md) - the next-era **Phase 1** provider/runtime acceptance *harness* (preflight, 8 run-verifiers, report, ops scripts, forged-request tests) — source-wired + locally verified; the live acceptance gate stays pending creds.
8. [`2026-06-30-phase-02-runtime-scheduler-record.md`](2026-06-30-phase-02-runtime-scheduler-record.md) - **current** record: new-era **Phase 2** runtime/scheduler productionization — Docker-default backend, protected scheduler runner, `hermes_job_runs` proof writes, `runtime_health_checks`; source-wired + locally verified, live runtime gate pending.
9. [`../../../mvp-build/README.md`](../../../mvp-build/README.md) - runnable build-home status and commands.

## Rule

Implementation records must be factual. Do not mark a provider-backed feature accepted unless it leaves real proof ids such as Twilio SIDs, Supabase artifact/storage evidence, Gmail ids, Stripe ids, or runtime health records. Local typecheck/unit/build proof is useful, but it is not provider acceptance.
