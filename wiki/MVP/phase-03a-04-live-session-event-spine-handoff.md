# Handoff — Live-Session-First Event Spine, Phase 3A Router, and Phase 4 Wake Path

Status: active

Date: 2026-06-30

Brief orientation for the next planning/implementation session. Read this after `identity.md` and `CODEGRAPH.md`, then
read the linked source docs before touching code.

## Why this matters

AMTECH is not trying to be a Hermes wrapper. Hermes supplies the agent runtime, sessions, tools, subagents, jobs,
profiles, and messaging substrate. AMTECH owns the product layer that makes it feel like one reliable AI employee for
an owner-led SMB: one number, one coworker, one Work Surface, typed deliverables, approval gates, provider events,
presence-aware delivery, and enough Manager control to make the office loop safe.

The current MVP path is still the contractor Estimate loop: signup/claim -> live employee -> estimate PDF -> approved
Gmail send -> real Gmail reply event -> Stripe test-mode deposit invoice/payment -> reminder/next action. The upcoming
work is the infrastructure that makes that loop feel like a coworker instead of a chat box.

## Recent decisions to inherit

1. **Dedicated number per employee is locked.** One employee has one outbound/inbound identity and one owner-facing
   thread across SMS/web/voice.
2. **Source is orthogonal to channel.** Gmail, Stripe, clock, inbound SMS/web, Job completion, subagent completion, and
   future services are all "messages to the agent." Where output lands is a Channel/Session/Presence decision.
3. **Live Hermes session first.** Do not overbuild an out-of-session router for the MVP. If the owner is actively in
   webchat/SMS and Hermes can keep the conversation alive, use that path.
4. **Native subagents are MVP leverage.** Current Hermes `delegate_task` source says top-level delegations run in the
   background by default: the user can keep talking, and subagent results re-enter the conversation as new messages.
   Use this for bounded in-session work.
5. **Manager serialization is the fallback, not the default UX.** Use Manager queue/worker lanes for non-session
   provider events, durable/restart-sensitive work, isolation boundaries, cross-channel dedupe, approvals, proof, and
   audit.
6. **Hermes HTTP Runs/Sessions are turn-atomic.** The API exposes run start/status/events/stop/approval, not arbitrary
   mid-run message injection. This matters for the Manager wake path and for live-provider acceptance.
7. **Profiles isolate Hermes state, not OS access.** On `local`, profiles do not sandbox filesystem/tools by
   themselves. Public/customer-facing or high-risk worker lanes need least-privilege tools and real runtime containment.

## Read next

1. `wiki/MVP/agent-inbox-and-channel-architecture.md` — controlling interaction architecture.
2. `wiki/MVP/hermes-run-session-semantics-research.md` — Hermes Runs/Sessions/Jobs/profiles/subagents research note.
3. `wiki/MVP/build-plan-current/phases/phase-03-generic-ingress-event-routing.md` and
   `phase-03-implementation-plan.md` — Phase 3 generic ingress plan.
4. `wiki/MVP/build-plan-current/phases/phase-03a-channel-session-presence-layer.md` — new Channel/Session/Presence
   phase scope.
5. `wiki/MVP/build-plan-current/phases/phase-04-live-wake-path-descriptors.md` — wake path, but read it with the
   live-session-first correction in mind.
6. `wiki/MVP/event-driven-office-and-generative-ui.md` — broader event-driven office and Work Surface frontier.
7. `mvp-build/CLAUDE.md`, newest `mvp-build/memory/*`, then actual source files before implementation.

## Upcoming work

**First planning task:** revise Phase 3/3A/4 implementation sequencing against the corrected architecture.

- Phase 3 should build generic ingress for non-session events: verify -> normalize safe fact -> dedupe -> triage ->
  route `deliver_only` vs `wake_employee`.
- Phase 3A should be a small MVP router, not an enterprise notification platform: active session wins, no double SMS,
  one acceptance primitive across SMS/web, presence heartbeat/recency, delivery proof.
- Phase 4 should connect judgment events to live Hermes while preserving the active-session path. Do not force native
  subagent completions or active owner turns through a slow external queue.

**Implementation bias:** keep the MVP simple. Prefer Hermes-native session/delegation behavior when it gives the owner
the pleasant "talking to a person" experience. Add Manager machinery only when it protects correctness, safety,
durability, or cross-channel identity.

## Scenario to keep in your head

Owner is active in webchat, but notification preference is SMS. They ask for an Oak St estimate. The employee starts
estimate work in a subagent or durable Job. While that work runs, Stripe says invoice #2444 was paid, then Gmail receives
a prospect email. The owner should see the paid-invoice notice in the active web session, not a duplicate SMS. The agent
can ask whether to start the new prospect estimate and queue it behind the current one. The owner replies naturally
("yea that sounds good"). The estimate work completes and surfaces for gated review.

This is the product: one employee that keeps working, notices the office, speaks in the active session, and asks for
approval only when needed.

## Guardrails

- Never fake provider/runtime acceptance. Record missing env vars and proof ids.
- Do not rewrite `wiki/MVP/old-build-plan/*`; current sequencing belongs in `build-plan-current/`, implementation
  records, and handoffs.
- Money/customer-facing actions stay gated forever.
- Safe facts only downstream; secrets and raw provider bodies stay by reference.
- Conformance-first UI: typed `WorkEventDescriptor`, fixed renderers, one acceptance primitive.
- If code changes land, update implementation records, `mvp-build/memory/`, `CODEGRAPH.md`, and status docs.
