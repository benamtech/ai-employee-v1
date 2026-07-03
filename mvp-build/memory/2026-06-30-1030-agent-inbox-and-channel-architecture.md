# Handoff — agent-inbox + channel/session architecture (decision)

Date: 2026-06-30 10:30
Status: architecture decided + documented; reframes Phase 3/4; no code change this pass.
Scope: a design decision that resolves "what is a message to the agent", how one employee survives concurrency, and where output actually lands. Source-of-truth doc authored.

## What was decided

Authored **`wiki/MVP/agent-inbox-and-channel-architecture.md`** (source of truth). The model, in five layers:
`SOURCES (open adapter contract) → EVENT SPINE (Phase 3) → BRAIN (Hermes conductor; Phase 4 reason-branch) →
CHANNEL/SESSION/PRESENCE ROUTER → USER`, with the whole thing recursive (a reply or a Job completion re-enters as a
new event).

Locked principles:
- **"A message to the agent" = anything that must enter the business brain, source-agnostic.** Provider events,
  internal Job completions (rendered estimate / generated video / coding task done), clock, inbound channel
  messages, future sub-systems — all the *same* primitive into *one ordered inbox*. A source is just metadata.
  **Future-proofing = the open source-adapter contract; we never build speculative connectors.**
- **Source is orthogonal to channel.** Most messages never reach a person; of those that do, *presence + preference*
  pick the surface, not the event type.
- **Execution = conductor + Jobs + serialized inbox.** The session never blocks; heavy/long work runs as a Hermes
  Job; **a Job completion is itself a message to the agent.** Serialization lets the agent know everything and
  reason across items.
- **Channel/Session/Presence router (layer 4)** places channel-agnostic brain intents: active session wins over the
  standing notification preference for in-conversation turns; the preference governs ambient pushes when no session
  is active; silent/record-only intents don't surface; never double-deliver (dedup on the message). Presence is a
  per-channel signal (web SSE heartbeat; SMS recency window).
- **The conversation is a brain artifact, not a channel artifact** — one continuous thread the owner experiences
  across SMS/web/voice; channels attach/detach as transports. This enforces "one employee, one number, one thread."
- **Dedicated number per employee — LOCKED** (founder, no doubt). Resolves the three-divergent-sender incoherence
  found in code (`twilio.ts` per-employee number vs `employee-events.ts` `EMPLOYEE_SMS_FROM` vs `sendSms`
  Messaging-Service override). Identity is enforced at layer 4.

## Why

The Phase 3/4 plan cut the event bus by front/back half but never modeled the **channel/session layer** or the
**concurrency execution model**, and treated SMS as edge transport — so SMS (the product's trust substrate) was
half-built and "Twilio as an event source" was incoherent. A concurrency scenario (owner mid-estimate while an
invoice pays and an email arrives, notices/decisions woven into one live thread, notification pref ≠ active channel)
forced the model out. Founder confirmed the shape exactly ("yes perfect").

## Reframe of the build plan (see doc §9)

- **Phase 3** = the universal "message to the agent" ingress spine across **all origin classes** (not a connector
  list). The open adapter contract is the deliverable.
- **Phase 4** = the brain's reason-branch on live Hermes Runs/Sessions; not SMS-specific.
- **NEW first-class concern: the Channel/Session/Presence layer** — deserves its own phase or a Phase 3
  prerequisite (identity invariant, presence, routing precedence, cross-channel dedup, single-thread attachment).
- **Conductor + Jobs** is the runtime contract Phases 2 and 4 build to.

## Files / seams touched (docs only)

- New: `wiki/MVP/agent-inbox-and-channel-architecture.md`.
- Cross-linked from `phases/phase-03-generic-ingress-event-routing.md`, `phases/phase-04-live-wake-path-descriptors.md`,
  and `phases/phase-03-implementation-plan.md` (whose status was downgraded to "v1; needs revision" with the
  corrections captured inline).

## Carry-forward / next

- **Open substrate unknown to verify before locking the channel layer:** does a live Hermes Run accept an injected
  message/event mid-turn, or do inputs queue at the next turn boundary? Verify against the real
  NousResearch/hermes-agent Runs/Sessions + Jobs API. Load-bearing for latency + "agent knows mid-task".
- **Revise `phase-03-implementation-plan.md` to v2** against this doc (the four corrections + reframe).
- **Scope the Channel/Session/Presence layer** as its own phase doc; update `phases/README.md` index + graph.
- Remaining propagation: register the new doc in `wiki/README.md`, `CODEGRAPH.md` §4/§6, root `index.html`
  `SEED_PATHS`.

## Verification

- Docs only; no code touched. `mvp-build` tree unchanged since `45cbf90` (typecheck/unit/build/lint last green at
  26 files / 128 tests).
