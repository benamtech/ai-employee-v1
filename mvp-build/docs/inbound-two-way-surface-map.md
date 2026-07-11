# Inbound / Two-Way Surface Map (as built)

Status: review · 2026-07-11 · author: source audit (no live host) · scope = Part A of the two-way-surface pass

Companion docs: [`production-networking-and-dns.md`](production-networking-and-dns.md) (Part B),
[`roles-and-delegated-permissions-design.md`](roles-and-delegated-permissions-design.md) (Part C).
Outbound substrate proof: [`../memory/2026-07-11-1900-pod-alpha-lifecycle-dns-routing-proven-on-host.md`](../memory/2026-07-11-1900-pod-alpha-lifecycle-dns-routing-proven-on-host.md).

## Purpose

The outbound production infra (docker-compose core, per-employee Hermes containers, `amtech_runtime`
network, Docker-DNS, Caddy routing OUT to each employee) is proven on a real host. This document maps the
**other direction — the inbound / two-way surface** as it exists in source today, and marks where it is
fragile under real concurrency/load. It is a review, not a rebuild instruction: the inbound spine is
`source-wired`. Every claim cites a file.

## The three inbound turn types

### 1. Web owner turn (`source-wired`)

```
apps/web/app/api/employee/[employeeId]/message/route.ts   (Next.js route)
  -> apps/manager/src/server.ts                           (Manager owner-message route)
  -> apps/manager/src/lib/owner-session.ts                (requireOwnerSession — token_hash lookup)
  -> apps/manager/src/lib/runtime.ts   deliverOwnerTurnToRuntime
  -> apps/manager/src/lib/turn-queue.ts runEmployeeTurn   (enqueue -> claim -> execute, per-employee)
  -> apps/manager/src/lib/wake.ts / lib/hermes-client.ts  (executeHermesTurnStreaming — turn-atomic)
  -> employee calls Manager tools over MCP                (apps/manager/src/lib/mcp-server.ts, scoped cred 0023)
  -> apps/manager/src/lib/employee-stream.ts              (SSE via progress-bus + cursor catch-up + poll)
     back to the web desk.
```

Auth: `requireOwnerSession` (`owner-session.ts:40`) resolves an opaque `ow_…` token to
`{ account_id, user_id }` by HMAC `token_hash` against `owner_web_sessions`. There is **no role claim** on
the session today — every authenticated web caller is the single owner (see Part C).

### 2. SMS inbound turn (`source-wired`)

Two distinct SMS front doors, both signature-gated (`X-Twilio-Signature` mandatory —
`webhooks/twilio.ts:47,123,138`; `SMS_INSECURE_NO_SIGNATURE` is hard-vetoed in production, `twilio.ts:40`):

- **Front-door / onboarding** (`POST /webhooks/twilio/frontdoor`, `twilio.ts:44`): anonymous number →
  `onboarding_sessions` → Manager orchestrator → optional `/claim` signed link. Pre-account; not a turn.
- **Per-employee owner inbound** (`POST /webhooks/twilio/:employeeId`, `twilio.ts:134`): verifies the
  employee is `live`, then authorizes the sender by matching `From` against `verified_phones` for that
  account (`twilio.ts:155-161`) — **unknown numbers get 403 `unauthorized sender`**. It records the inbound
  `employee_messages` row, stamps SMS presence (`stampChannelPresence`), returns an **empty 200 TwiML
  immediately**, and does the actual turn in a **fire-and-forget `void (async () => {…})()`**
  (`twilio.ts:173-213`) that calls `deliverOwnerTurnToRuntime` with `idempotency_key: twilio:<MessageSid>`,
  then sends the reply as a fresh outbound SMS via `sms-sender.ts` / `twilio.ts sendSms`.

Important nuance the high-level trace elides: **owner inbound SMS does NOT flow through `events/ingress.ts`
or `channel-router.ts`.** It goes straight to the owner-turn path (same `turn-queue`). `channel-router.ts`
governs the **outbound** delivery decision (web vs ambient SMS vs silent) for employee-initiated intents and
provider events — not inbound owner messages. The inbound reply here is sent directly on the same SMS thread.

Signed mobile previews / approvals: `lib/preview-links.ts` + `lib/preview-render.ts` +
`apps/web/app/agent/[employeeId]/review/` render a signed page; the action posts to
`apps/web/app/api/employee/[employeeId]/preview/action/route.ts` → Manager `previewAction` →
`resolve_approval` → wake. **The signed token itself is the credential** (no owner session needed); Manager
verifies scope, idempotency, and account/employee binding (`preview/action/route.ts:5-8`).

### 3. Provider webhook turn (`source-wired`)

```
apps/manager/src/webhooks/{gmail,stripe,quickbooks}.ts   (signature / Pub-Sub OIDC / HMAC verify)
  -> apps/manager/src/events/ingress.ts   ingestEvent      (adapter.verify -> normalize -> assertSafeFact)
  -> apps/manager/src/events/adapters/*    (per-source normalizers; the extension point)
  -> apps/manager/src/lib/employee-events.ts deliverEmployeeEvent
       routing_mode "deliver_only"  = record + notify owner
       routing_mode "wake_employee" = run a Hermes turn to author the owner-facing descriptor, then notify
```

The **two-door invariant** holds in code: external/untrusted provider payloads enter ONLY through
`ingestEvent` (`events/ingress.ts:61`), which runs `adapter.verify` then `assertSafeFact` — a recursive
KEY scan (`ingress.ts:25-45`) that rejects payloads carrying `access_token`/`refresh_token`/`client_secret`/
`authorization`/`payment_intent`/`rfc822`/`raw` keys or >8KB, routing them to the repair queue instead of the
brain. Internal Manager-authored events call `deliverEmployeeEvent` directly (e.g. reminders, daily brief,
`send_employee_event`). Only `gmailReplyReceived` currently classifies as `wake_employee`
(`ingress.ts:16-19`); everything else is `deliver_only`.

## Cross-cutting mechanisms (the load-bearing correctness)

### Turn serialization — single-flight per employee, turn-atomic

`turn-queue.ts` implements a DB-backed queue: `enqueueEmployeeTurn` (idempotency-keyed) →
`claimNextEmployeeTurn` (lease-token CAS via `claim_next_employee_turn` RPC + `employee_turn_locks`,
migrations `0024`/`0027`/`0028`) → execute → `completeEmployeeTurn` (`complete_employee_turn_job` RPC).
`runEmployeeTurn` (`turn-queue.ts:150-175`) enqueues, then claims the NEXT queued turn for that employee; if
it claims an **older** turn than its own it releases it (`releaseEmployeeTurn`) and returns `queued` rather
than run someone else's turn on the wrong caller's request. Net effect: **at most one turn runs per employee
at a time; a second inbound message QUEUES — it never interrupts an in-flight turn.** Stragglers left
`queued` are picked up by the `drain_employee_turns` scheduler lane.

### Stuck-turn reaper

`lib/turn-drain.ts` recovers turns stuck in `running` because their worker died mid-execution (crash, OOM,
redeploy): it selects rows whose `lease_expires_at` has passed but are still `running` (`turn-drain.ts:47-51`;
lease = `HERMES_TURN_TIMEOUT_MS` default 120s **+30s**, `turn-queue.ts:63,91`), drops the stale lock, and
requeues (CAS-guarded on `lease_token` so it can't stomp a worker that is genuinely still finishing). After
max attempts it marks `failed` and texts the owner an apologetic "send it again" message
(`turn-drain.ts:106,136`).

### Idempotency / dedupe (webhooks are at-least-once)

- Provider events: `deliverEmployeeEvent` dedupes on `inbound_events.idempotency_key`
  (`adapter.dedupeKey(event)`), with a **pre-check** (`employee-events.ts:201`) AND a **23505 race backstop**
  on the unique index (migration `0010`) so a concurrent at-least-once delivery loses cleanly and returns
  `duplicate` instead of double-notifying (`employee-events.ts:399-420`). Side-effecting binds (approval row,
  preview link) run **only after** the dedupe row is claimed, so a lost race never orphans an approval.
- Owner inbound SMS: `idempotency_key: twilio:<MessageSid>` into the turn queue → a Twilio webhook retry
  re-enqueues the same key and is deduped at the queue, not re-run.
- Outbound delivery: `channel-router.ts routeEmployeeIntent` claims a `delivery_decisions` row on
  `intent_key` first (`channel-router.ts:52-65`); a duplicate intent returns `duplicate` and sends nothing.

### Presence routing

`channel-router.ts`: `isWebActive` = a `channel_sessions` web row seen within `WEB_PRESENCE_WINDOW_SECONDS`
(default 90s). Active web → deliver to web; else load the owner's most-recent `verified_phones` number and
send ambient SMS; `move: "silent"` records without notifying. `loadOwnerPhone` (`channel-router.ts:39-45`)
always resolves the OWNER's number — the seam Part C reuses to route a delegated user's approval to the owner.

## Fragilities under real concurrency / load

These hold today because the box is single-tenant / low-load. Flag them before pilots scale.

1. **Fire-and-forget inbound SMS turns have no backpressure.** `twilio.ts:173` kicks the turn into a detached
   promise after the 200. Correctness survives a crash (the reaper requeues), but there is no concurrency cap
   on how many detached turns run on the single Manager process — a burst of owner texts (or many employees
   texting at once) spawns unbounded in-flight promises + Hermes calls. Web owner turns run inline on the
   request and are naturally bounded by the HTTP layer; SMS is not. Consider a worker/queue drain for SMS
   turns rather than in-request fan-out at scale.
2. **Long turn + second message = silent queue, not acknowledged.** Because a second message queues behind an
   in-flight turn (correct), the owner texting again mid-turn gets `"I got it. I'm working on that now."` only
   if `deliverOwnerTurnToRuntime` returns `queued` synchronously — otherwise the second message waits for the
   drain lane with no interim receipt. There is **no interrupt/cancel** of an in-flight turn. For a chatty
   owner this can feel unresponsive. UX decision, not a correctness bug.
3. **Presence window is a fixed heuristic.** 90s web-active means an owner who just closed the tab can get a
   turn's result delivered to a web session no one is watching (and no SMS). Fine at low volume; revisit if
   owners complain about "missing" replies.
4. **The reaper + drain + batch flush are scheduler-tick-cadenced.** Recovery latency for a wedged turn is
   bounded by tick frequency, not immediate. Under a dead-worker scenario the owner waits a tick for the
   apology/requeue. Acceptable for pilot; document the cadence in the runbook.
5. **`assertSafeFact` is a key-name denylist, not an allowlist.** It blocks known secret-shaped keys
   (`ingress.ts:25`) but a novel provider field carrying sensitive data under an unlisted key name would pass.
   Low risk given the fixed set of providers; worth an allowlist if new connectors land.
6. **Single Manager process is the whole control plane.** Every inbound path, the SSE fan-out
   (`employee-stream.ts`), the scheduler lanes, and MCP tool serving share one Node process bound to
   `127.0.0.1:8080`. This is the intended one-VPS topology (see Part B), but it means a Manager restart drops
   open SSE streams and in-flight inline turns (the reaper recovers turn correctness; the owner sees a dropped
   "working…"). Graceful drain is deferred (`production-deploy-readiness-review-2026-07-11.md` finding 9).
7. **Owner identity is single-number / single-user.** The `:employeeId` inbound handler authorizes purely by
   `From ∈ verified_phones(account)`; there is no per-user distinction. Multi-user roles are net-new — see
   [`roles-and-delegated-permissions-design.md`](roles-and-delegated-permissions-design.md).

## Where this sits in the sequence (Part D)

This review is step 1 (design/review, no creds). It does not reopen the inbound spine. The load fragilities
above are **not** P0 for the first founder-operated pilot (single tenant, human watching), but items 1 and 6
should be revisited during the "limited real-VPS production tests" step, alongside the deploy-readiness P0/P1
work. See the sequence in
[`../second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md`](../second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md)
and Part D of the two companion docs.
