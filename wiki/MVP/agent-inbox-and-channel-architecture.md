# The Agent Inbox and the Channel Layer — How the Employee Receives the World and Speaks Back

Status: complete

This is the load-bearing architecture for how an AMTECH employee **receives everything that matters** and
**speaks back as one coherent coworker** across surfaces. It reframes the event-bus work (Phases 3-4) and adds
the channel/session layer the earlier plan under-specified. It is grounded in the Hermes substrate (Runs/Sessions,
Jobs, event stream) and in the code as of the `fix/events-and-systemic-robustness` branch.

> Companion: [`event-driven-office-and-generative-ui.md`](event-driven-office-and-generative-ui.md) (the lifecycle
> and generative-UI frontier). That doc describes the bus; this doc fixes the **execution model** (how a single
> employee stays responsive under concurrency) and the **channel/session layer** (where output actually lands).

---

## 1. Thesis — one universal inbox, orthogonal channels

Two ideas carry the whole architecture, and keeping them separate is what makes the product extensible:

1. **A "message to the agent" is anything that needs to get into the business brain** — regardless of origin.
   An email received, an invoice paid, a scheduled event coming due, a long Job finishing (a rendered estimate, a
   generated video, a completed coding task), an inbound text on the employee's number, a sub-system escalation.
   They are all the **same primitive**, entering the **same ordered inbox**, normalized to the same safe structured
   fact. The brain does not learn about sources; **a source is just metadata.**
2. **The channel an event might surface on is orthogonal to its source.** Most messages to the agent never reach a
   person. Of the ones that do, *where* they surface (SMS, web Work Surface, voice) is decided by the owner's
   **presence and preferences**, not by what kind of event it was.

**Future-proofing is a property of this decoupling, not of any connector.** The source layer is an open contract:
any service — one we have never heard of — becomes a registered adapter that drops normalized messages into the
inbox. We never build speculative integrations; we build the universal ingress and let sources plug in. (The
"AI secretary that escalates a bad call" was only ever an *illustration* of an arbitrary future source — there is
nothing special to implement for it or any other named service.)

---

## 2. Definitions (precise, so we stop conflating them)

- **Message to the agent** — the universal inbound primitive: a normalized, safe structured fact that needs to get
  into the brain. Source-agnostic.
- **The brain** — one Hermes profile per employee: the agent **plus its live session/Run, its filesystem (brain
  files), its db, and its connected tools.** A single stateful entity with one canonical conversation context and
  persistent task state. Not a stateless reasoner.
- **Channel** — a transport/rendering surface to a user: SMS, web Work Surface, voice. A channel renders the brain's
  output and carries the user's input back in.
- **Session** — a live, time-bounded engagement of a user on a channel (the owner is texting *right now*; a web tab
  is open with a heartbeat). Distinct from the brain's durable conversation context.
- **Presence** — the signal that a session is currently active on a given channel.

---

## 3. The five layers (and the recursion)

```
1. SOURCES (open contract: adapters)   any origin -> a normalized "message to the agent"
        |                              provider webhook | internal Job completion | clock | inbound
        v                              channel message | any future service / sub-agent
2. EVENT SPINE                         verify -> normalize(safe fact) -> dedupe -> triage      [Phase 3]
        |
        v
3. THE BRAIN (Hermes conductor)        route: deliver_only (literal, templated, zero-token)
        |                                   OR reason + act(gated) + emit channel-agnostic intents   [Phase 4]
        v
4. CHANNEL / SESSION / PRESENCE ROUTER place each intent on the right surface, presence-aware,
        |                              cross-channel deduped     <-- the layer the old plan under-built
        v
5. THE USER (owner / customer / other)
        |
        +--> any reply, or any downstream effect (a Job finishing, an approved send getting a reply),
             re-enters at layer 1. The office is this loop running on many sources at once.
```

The brain emits **channel-agnostic** intents (notice / question / keep-working / deliverable-for-review). It never
names SMS or web. Layer 4 owns surface selection. That boundary is the contract.

---

## 4. Execution model — live session first, Manager queue when needed

The MVP should not turn every event into an out-of-session routing problem. The whole reason to run on Hermes is that
the owner can experience one live employee session while Hermes handles tool work and delegation behind it. The
employee stays coherent because of four rules:

- **The live Hermes session is the default conductor.** If the owner is actively talking to the employee, notices,
  questions, and short coordination turns should appear in that same session. Do not route "out of session" just
  because the source was a webhook.
- **Native Hermes delegation is valid MVP leverage.** Current `delegate_task` behavior supports background
  subagents: the parent can dispatch work, the user can keep talking, and each subagent result re-enters the
  conversation as a new message. Use that for bounded reasoning/work where losing the parent session would be
  acceptable.
- **Durable or externally important long work runs as a Job/worker lane.** Rendering an estimate PDF, a task that
  must survive restarts, or work with strict tool boundaries should be a Hermes Job/cron/worker profile. **A Job
  completing is itself a message to the agent** — the same primitive as any external event.
- **One serialized inbox feeds the brain when events arrive outside the active turn.** Owner turns (any channel),
  external events, Job completions, clock
  ticks, and sub-system signals all land in **one ordered queue**. Serialization is what lets the agent *know
  everything* and reason *across* items — "this email is a prospect, so propose work; that invoice is a closed loop,
  so just note it" — instead of handling each in isolation.

Consequence: the MVP posture is **use the live session when it works; add Manager structure only where it removes real
risk.** The owner can keep talking while subagents or Jobs run, and the Manager only has to serialize the facts that
would otherwise race or disappear.

---

## 5. The channel / session / presence router (layer 4)

The brain's intent does not choose a surface; the router does, from presence:

- **Active session present → render into that session's channel.** The owner is right there; the live thread is
  where it belongs — even if their standing notification preference is a different channel.
- **No active session → the notification preference governs the ambient push** (e.g., SMS), for intents that warrant
  reaching the owner at all.
- **Silent / record-only intents → no surface; just recorded** for the Work Surface and audit.
- **Never double-deliver.** Cross-channel dedup is keyed on the message, not the channel: the same notice does not
  go to both the active web session and an SMS push.

This resolves the canonical divergence — *active session is webchat, preference is SMS*: in-conversation turns and
notices go to webchat; the SMS preference is for ambient pushes when no session is active.

**Presence is a per-channel signal** the router consults: web = an open SSE/heartbeat; SMS = a recency window since
the last inbound. Adding a channel means adding a renderer and a presence signal — nothing in the brain changes.

---

## 6. The single-thread invariant — the conversation is a brain artifact

The conversation and context **live in the brain, not in a channel.** Channels are transports that *attach* to the
one thread. The owner can be on web now and SMS in an hour and it is the **same continuous conversation**, no
restart. This is what makes "the owner only ever talks to one employee" literally true across surfaces, and it is
the second half of the extensibility payoff: a new channel is a new renderer + presence signal; a new source is a
new adapter; the durable thread is untouched by either.

This also fixes the identity incoherence found in the code: one employee has **one number** (locked decision) and
**one outbound+inbound identity**, and the owner experiences **one thread** — enforced at layer 4, not left to three
divergent sender configs.

---

## 7. Worked scenario (the concurrency stress test)

Owner is active in **webchat**; standing notification preference is **SMS**.

| t | Event | Mechanism |
|---|---|---|
| t0 | Owner sends the Oak St info to be turned into an estimate (PDF + email subject/body) | message to agent |
| t0+ | Agent dispatches **Estimate Work #1** as native background delegation if bounded, or a durable Job if it must survive restart | live conductor + subagent/Job |
| t1 | Invoice paid (Stripe) arrives while work is active | event -> active session if possible, otherwise serialized inbox; triage = notice, no action |
| t1 | Owner sees, in webchat: "Notice: Mr. Davis paid invoice #2444, for recent Oak St job. Requires no confirmation or interaction." | router: active session wins over the SMS preference |
| t1+ | Owner: "ok great" (talking to it like a person) | message to active session; does not touch Estimate Work #1 |
| t2 | Email received ~20s later | event -> inbox; triage = judgment: a prospect, propose work |
| t2 | "New prospective client George Jones said [...], seems like a standard [...]. Want me to start this estimate too? I'll do what I can and bring it to your attention after we finish the current one." | brain reasons + sequences; router -> active webchat |
| t2+ | Owner: "yea that sounds good" | brain dispatches **Estimate Work #2**, queued behind #1 in task state |
| t3 | Work #1 completes | subagent result or Job completion -> active conversation/inbox -> brain surfaces the finished estimate for gated review, then proceeds to #2 |

Every hard part is exercised: the agent knows everything (active session plus serialized inbox), the session never stalls (subagents/Jobs),
notices vs decisions are sorted (triage), output lands where the owner actually is (presence router), work is
sequenced and the plan is spoken aloud (task queue), and it reads as one human conversation.

---

## 8. The production-case class this must cover (not just the demo path)

The model is only right if it absorbs these without new structure:

- An approval requested on SMS but answered on web — **one acceptance record, many renderings** (resolve regardless
  of channel).
- A superseding event before the owner saw the first (invoice paid, then refunded).
- A burst of events (ten in a minute) — **batch into a digest, not ten interrupts.**
- A late event for an already-closed task.
- The owner unreachable — **work to a safe point, then wait** ("I'll do what I can and bring it to your attention").
- Eventually, multiple users on one account — whose session is active, who may approve.

Conductor + serialized inbox + presence router covers all of these. That coverage is the test of correctness.

---

## 9. What this reframes in the build plan

- **Phase 3 — Generic Ingress** is the **universal "message to the agent" spine across all origin classes** (provider
  events, internal Job completions, clock, inbound channel messages, future sources), not a Gmail/Stripe-plus-Twilio
  list. The open source-adapter contract is the deliverable.
- **Phase 4 — Live Wake** is simply the **brain's reason-branch** going live on Hermes Runs/Sessions with validated
  descriptors. It is not an SMS-specific concept.
- **New first-class concern — the Channel / Session / Presence layer (layer 4).** It deserves its own scope (a phase
  or a Phase 3 prerequisite), because Phase 3's promise of "one lifecycle for every source" cannot be honestly met
  while output identity and presence are unmodeled. It owns: the dedicated-number identity invariant, presence
  signals, the routing precedence, cross-channel dedup, and the single-thread attachment model.
- **The conductor + delegation/Jobs execution model** is the runtime contract Phases 2 (Jobs/runtime), 3A
  (presence), and 4 (wake) build to — bounded work can use native Hermes background subagents; durable/isolated work
  uses Jobs or worker profiles; the session remains responsive.

---

## 10. Hermes substrate answer — runs are turn-atomic

Verified against the public Hermes API/docs: a live HTTP Run is **turn-atomic**. `POST /v1/runs` starts a run,
`GET /v1/runs/{run_id}/events` streams progress, and the in-flight control surface is stop/approval — not
"append another user message into this run." The REST Sessions API is the same shape: `/api/sessions/{id}/chat`
runs one synchronous turn and `/chat/stream` streams that one turn. The TUI gateway has finer process-local controls
(`prompt.submit`, `session.steer`, `session.interrupt`), but those are not a durable production event queue for the
AMTECH web/Manager layer.

So the product rule is now more precise:

- **The Manager owns the fallback inbox queue.** It serializes every event that cannot safely enter the active Hermes
  conversation immediately.
- **The active Hermes session stays first-class.** When Hermes can accept the user's next message or a background
  subagent result into the session, use that path; it is lower-latency and more natural.
- **Durable long work is a Job or worker profile/session lane, then completion re-enters the inbox/session.** The
  conversational surface stays responsive because the conductor dispatches work and keeps talking.
- **Extra Hermes sessions are allowed, but they are not free shared-brain concurrency.** Use them only as scoped worker
  lanes with explicit tool/filesystem boundaries and a structured completion event. The canonical owner conversation
  remains one serialized brain thread.

Research note: [`hermes-run-session-semantics-research.md`](hermes-run-session-semantics-research.md).

---

## 11. Guardrails preserved (these do not move)

- **Pro-human, never anti-human.** The employee gives the owner time back and keeps them in command; it never acts
  outward without the gate.
- **The gate is a property of the deliverable type**, enforced structurally — money/customer-facing actions never
  graduate past a one-line confirm, on any channel.
- **One acceptance primitive, many renderings** — SMS "yes," web Approve, voice "send it" resolve the same record.
- **`deliver_only` only for trusted literals**; anything needing judgment wakes the brain. Structured facts on
  internal hops; plain English only at the owner edge.
- **Secrets by reference; safe summaries only** — no raw provider bodies in the inbox, events, or logs.
- **One employee, one number, one thread.** Every new source is one more sender into the inbox the owner already
  trusts; every new channel is a view of the one thread — never a new screen to learn.

---

## 12. Update points

- Registered in [`../README.md`](../README.md) and the root [`../../CODEGRAPH.md`](../../CODEGRAPH.md) §4/§6, and added
  to `index.html` `SEED_PATHS`.
- Cross-linked from [`build-plan-current/phases/phase-03-generic-ingress-event-routing.md`](build-plan-current/phases/phase-03-generic-ingress-event-routing.md),
  [`build-plan-current/phases/phase-03-implementation-plan.md`](build-plan-current/phases/phase-03-implementation-plan.md),
  and [`build-plan-current/phases/phase-04-live-wake-path-descriptors.md`](build-plan-current/phases/phase-04-live-wake-path-descriptors.md).
- Channel/Session/Presence is scoped as [`build-plan-current/phases/phase-03a-channel-session-presence-layer.md`](build-plan-current/phases/phase-03a-channel-session-presence-layer.md).
- It supersedes nothing in [`old-build-plan/`](old-build-plan/) (source of truth); it sharpens the forward arc.
