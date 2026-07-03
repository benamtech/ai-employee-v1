# Phase 3A — Channel, Session & Presence Layer

Status: planned

> **Architecture context:** [`../../agent-inbox-and-channel-architecture.md`](../../agent-inbox-and-channel-architecture.md)
> locks the model: source is orthogonal to channel, the active Hermes session is first-class, and the Manager owns the
> fallback serialized inbox when events cannot safely enter that session. This phase scopes layer 4, the router that
> decides where employee output lands.

## Goal / Module

Build the **Channel/Session/Presence router** as its own module so Phase 3's universal ingress and Phase 4's live
employee wake do not leak transport decisions into the brain.

The employee emits channel-agnostic intents: notify, question, review, keep-working, silent-record. The router chooses
SMS, web Work Surface/chat, voice, or no surface from current presence, standing preferences, recipient authority, and
dedupe state.

## Depends on

- Phase 0 baseline.
- Phase 3's normalized event stream can proceed in parallel, but Phase 4 should not ship owner-facing live wake without
  this router.
- Hermes semantics research: [`../../hermes-run-session-semantics-research.md`](../../hermes-run-session-semantics-research.md).

## Surface (code + schema)

- `channel_sessions`: active channel session records, heartbeat/last inbound timestamps, channel type, owner/user id,
  employee id, expiry.
- `channel_presence`: derived/current presence view per employee/user/channel.
- `delivery_decisions`: one row per owner-facing intent showing selected channel, reason, dedupe key, fallback path,
  and proof ids.
- Router library: `routeEmployeeIntent(intent, presence, preferences)`.
- Channel adapters/renderers: SMS line, web Work Surface/chat event, future voice event.

## Routing rules

- **Active session wins** over standing notification preference.
- **No active session** uses the owner's ambient push preference for interrupt-worthy intents.
- **Silent/record-only** never pushes; it records for Work Surface/audit.
- **Never double-deliver** the same intent across channels.
- **One acceptance primitive, many renderings**: SMS yes, web Approve, and voice approval resolve the same Manager
  acceptance record.
- **Native in-session subagent results may re-enter the active conversation directly** when Hermes supports it and the
  parent session is still alive.
- **Durable worker lanes do not deliver directly**: Jobs, cron runs, and secondary Hermes sessions emit completion
  events into the canonical inbox/session; the router owns delivery when the owner is not already in-session.

## Build tasks

1. Add channel/session/presence schema and typed shared contracts.
2. Implement web heartbeat/SSE presence and SMS recency-window presence.
3. Add owner/user notification preferences and authority lookup.
4. Implement router decision function and delivery-decision persistence.
5. Re-point existing owner SMS/work-event delivery through the router.
6. Preserve the low-latency active-session path for notices/subagent results; do not force every message through an
   out-of-session push.
7. Add cross-channel dedupe and acceptance resolution tests.
8. Add fallback behavior when a selected channel fails.

## Acceptance proof

- With web active and SMS preference set, a notify/question/review intent renders to web only.
- With no active session and SMS preference set, the same interrupt-worthy intent pushes to SMS.
- Silent intent records without push.
- Duplicate intent key does not double-deliver across web/SMS.
- Approval requested on SMS can be resolved on web against the same acceptance row.
- Native subagent completion can appear in the active session without duplicate SMS.
- Durable worker completion event routes through the inbox/router, not directly to a channel.

## Seam handed forward

Phase 4 can wake the live employee and accept employee-authored descriptors without caring about SMS/web/voice. Phase 5
can stream/batch over stable delivery decisions instead of ad hoc per-surface state.

## Status

`planned`.
