# Phase 3 — Generic Ingress & Event Routing — Production Implementation Plan

Status: planned (implementation plan — v2 substrate correction pass; still needs source-level implementation pass before build)
Date: 2026-06-30
Owns: the event-bus **front half** — `ingress → verify → normalize → dedupe → triage → route` — as the single office spine for every source.
Scoped to: **Phase 3 only.** Phase 4 (live wake) and Phase 6 (`run_id`) are named as forward seams, not built here.

> **Revision note.** The v1 connector-centric plan has been corrected at the architecture level:
> (1) **Phase 3 ingress is the universal "message to the agent" spine across origin classes** — provider events,
> internal Job completions, clock, manager, and inbound channel messages — **not** a Gmail/Stripe/Twilio connector
> list. Owner inbound SMS is the **channel/session layer**, not a fourth event source. (2) Hermes HTTP Runs/Sessions
> are turn-atomic; Phase 3 owns queue/routing state and Phase 4 consumes it one turn at a time. (3) The WI-4
> "`deliverEmployeeEvent` called only from `ingress.ts`" gate is wrong — it is also called by
> `dispatch_due_reminders`, `dispatch_daily_briefs`, and `redeliver_employee_event`; the real invariant is "external
> provider ingress flows through `ingestEvent`; `deliverEmployeeEvent` stays the shared primitive." (4) WI-1
> normalization lives in the webhooks **and the gmail/stripe tool paths**. (5) Migration `0010`'s unique key means
> `redeliver_employee_event` must reuse-or-resuffix the idempotency key.
>
> Read first: [`../../agent-inbox-and-channel-architecture.md`](../../agent-inbox-and-channel-architecture.md)
> (the inbox + channel/session architecture this plan must conform to),
> [`../../hermes-run-session-semantics-research.md`](../../hermes-run-session-semantics-research.md),
> [`phase-03-generic-ingress-event-routing.md`](phase-03-generic-ingress-event-routing.md) (the gate),
> [`../event-driven-office-and-generative-ui.md`](../event-driven-office-and-generative-ui.md) §2 (canonical lifecycle)
> + §3 (what is built honestly), and [`mvp-build/CLAUDE.md`](../../../../mvp-build/CLAUDE.md). This plan is grounded in the
> code as of commit `45cbf90` on branch `fix/events-and-systemic-robustness`.

---

## 1. Goal & definition of done

Promote the **generic event-source registry from a dead-code seam to the primary ingress path.** Every
event — Gmail, Stripe, Twilio, manager-authored, clock/reminder — must travel **one lifecycle** through a
single front-controller, with per-provider authenticity still strictly enforced at the edge, every payload
normalized to safe structured facts (no raw bodies downstream), deduped against the DB invariant, triaged,
and routed by the `deliver_only` vs `wake_employee` flag.

**Done when the Phase 3 gate is met with real proof:**

1. Gmail, Stripe, Twilio, and manager events **all enter through `ingestEvent`** (the generic registry), not
   bespoke per-connector pipelines — verified by code path + a single integration test that drives all four.
2. **Per-provider verification still strictly enforced at the edge** (Pub/Sub OIDC, `Stripe-Signature` raw
   body, `X-Twilio-Signature`) — no event reaches normalization unverified.
3. **Literal events demonstrably take the zero-token `deliver_only` path** (no model call), proven by a test
   asserting no LLM/runtime call occurs for a literal fact.
4. **No raw provider payloads/secrets appear past normalization** — verified in `inbound_events.normalized_payload`,
   `audit_log.details`, and logs by an automated safe-fact assertion.
5. Baseline green: `typecheck && test:unit && build && lint`; integration env-gated test passes when creds present.

**Out of scope (named seams, not built):** the live Hermes wake/run (Phase 4), employee-authored validated
`WorkEventDescriptor` (Phase 4), the atomic-claim-before-wake (Phase 4), `run_id`/metering ledgers (Phase 6),
account-layer batching digests (Phase 5), Hermes Jobs as the scheduled runner (Phase 2 live gate).

---

## 2. Source memory — where we are, honestly (grounded in code)

The `deliver_only` half is wired end to end; the Manager authors the descriptor deterministically (design §3).

- **Generic registry exists but is OFF the hot path.** `apps/manager/src/events/registry.ts` defines
  `EventSourceAdapter { source, verify, normalize, dedupeKey }` with `registerEventSource` / `getEventSource` /
  `listEventSources`, and registers a real `manager` adapter plus **placeholder pass-through** adapters for
  `gmail`/`stripe`/`twilio` (their `normalize` just casts input; `verify` only checks two fields exist). Nothing
  imports `getEventSource` on the request path.
- **Real ingress is per-connector.** `apps/manager/src/webhooks/{gmail,stripe,twilio}.ts` each do their own
  transport verification + parsing and call `lib/employee-events.ts → deliverEmployeeEvent` (Stripe directly;
  Gmail via `tools/gmail.stub.ts` history→reply; Twilio inbound SMS). `server.ts` wires them via
  `registerGmailWebhooks` / `registerStripeWebhooks` / `registerTwilioWebhooks`.
- **`deliverEmployeeEvent` already implements stages 3–4, 9–10** for known sources: dedupe on `inbound_events`,
  persist a normalized event + a `to_owner` `employee_messages` row, env-gated owner SMS (Twilio `MessageSid`
  proof), audit. It accepts `routing_mode: "deliver_only" | "wake_employee"` (defaults `deliver_only`) and runs
  `decideTriage` internally for `notify | batch | ignore | repair`. The `wake_employee` branch calls
  `wakeEmployeeForEvent(apiUrl, …)` — **the Phase 4 seam** (today a non-live seam).
- **Dedupe is now DB-backed (just landed, commit `45cbf90`).** Migration `0010` makes
  `inbound_events.idempotency_key` unique; `db.ts → insertDedup` turns a 23505 into a tolerated duplicate.
  Phase 3 must make the **adapter own the dedupe key** so the key is provider-correct, not a generic fallback.
- **Triage tables exist** (`event_source_suppressions`, `event_batches`, `event_repair_queue` from `0007`);
  `lib/event-triage.ts` exposes `isSourceSuppressed` / `decideTriage` / `enqueueRepair` / `recordBatchCandidate`.

Canonical target lifecycle (design §2), Phase 3 owns **stages 1–6**:

```
1 INGRESS → 2 VERIFY → 3 NORMALIZE → 4 DEDUPE → 5 TRIAGE → 6 ROUTE(deliver_only | wake_employee)
                                                                         └── stages 7–8 = Phase 4
```

---

## 3. Target architecture (what changes)

Introduce **one front-controller** that all sources flow through; move per-source knowledge into **real
adapters**; keep transport verification at the HTTP edge.

```
HTTP edge (unchanged location, stays strict)            Generic spine (new primary path)
─────────────────────────────────────────────          ──────────────────────────────────────────
webhooks/gmail.ts    ── verify Pub/Sub OIDC ─┐
webhooks/stripe.ts   ── verify Stripe sig ───┤          events/ingress.ts → ingestEvent(db, {
webhooks/twilio.ts   ── verify Twilio sig ───┼────────▶   source, rawVerifiedPayload, edgeContext })
tools/send_employee_event (manager) ─────────┤             │  adapter = getEventSource(source)
scheduler reminder dispatch (clock) ─────────┘             │  adapter.verify()      (structural 2nd layer)
                                                           │  e = adapter.normalize()  → safe fact only
                                                           │  key = adapter.dedupeKey(e)
                                                           │  route = classifyRoute(e, triageHint)
                                                           └▶ deliverEmployeeEvent(db, { ...e,
                                                                idempotency_key: key, routing_mode: route })
```

**Two verification layers, both kept:**
- **Edge (transport authenticity)** — signature/OIDC against raw body + headers. Stays in the webhook handler
  (it needs the raw request). An unverified request never calls `ingestEvent`.
- **Adapter (structural/semantic)** — "does this verified payload carry the fields we can safely normalize?"
  Returns `{ ok:false, reason }` → repair-queue, never a throw.

**`deliverEmployeeEvent` stays the stage 3–4/9–10 primitive** (already hardened). Phase 3 stops callers from
hand-rolling normalization and routes them through `ingestEvent`, which owns stages 1–2(structural)–6.

---

## 4. Work items (dependency-ordered)

Each item: files, the change shape, and its self-check. Land them in order; keep the baseline green after each.

### WI-1 — Real per-source adapters (move normalization out of the connectors)
- **Files:** `apps/manager/src/events/registry.ts`; new `apps/manager/src/events/adapters/{gmail,stripe,twilio,manager}.ts`;
  source of the moved logic = `webhooks/{gmail,stripe,twilio}.ts` + `tools/gmail.stub.ts` / `webhooks/stripe.ts`.
- **Change:** replace the placeholder gmail/stripe/twilio adapters with real `normalize(db, rawVerifiedPayload)`
  that produce a `NormalizedEvent` of **safe structured facts only** (account/employee/estimate linkage,
  `event_type`, `safe_summary`, `refs`; never the raw email body / full Stripe object / raw SMS). `dedupeKey`
  returns the provider-correct idempotency key (Stripe event id; Gmail `messageId`/historyId; Twilio
  `MessageSid`; manager-supplied key). Keep the existing `manager` adapter.
- **Self-check:** unit test per adapter — given a realistic verified payload, `normalize` returns only
  whitelisted fields and a stable `dedupeKey`; a malformed payload returns `null` (→ repair).

### WI-2 — The `ingestEvent` front-controller
- **Files:** new `apps/manager/src/events/ingress.ts`.
- **Change:** `ingestEvent(db, { source, payload, edgeContext })` →
  `getEventSource(source)` (unknown source → `event_repair_queue` with reason `unknown_source`, audit, return
  pending) → `adapter.verify` (fail → repair) → `adapter.normalize` (null → repair) → `key = adapter.dedupeKey`
  → `route = classifyRoute(...)` → `deliverEmployeeEvent(db, { ...normalized, idempotency_key: key, routing_mode: route })`.
  Returns the `DeliverEmployeeEventResult`. **No raw payload is persisted or logged** — only `source`,
  `event_type`, and a reference id appear in audit.
- **Self-check:** unit test — a known source flows end to end and persists one `inbound_events` row; an unknown
  source enqueues repair and writes no `inbound_events` row.

### WI-3 — `classifyRoute` (literal → deliver_only; judgment → wake_employee flag)
- **Files:** `apps/manager/src/events/ingress.ts` (or `lib/event-triage.ts`).
- **Change:** a cheap, **token-free** classifier (rules first; model tier deferred) mapping `event_type` →
  `deliver_only` for trusted literal facts (payment received, reply received, reminder fired) vs `wake_employee`
  for judgment events (ambiguous inbound, unmapped). Phase 3 **sets the flag only**; the live wake is Phase 4, so
  `wake_employee`-flagged events ride the existing `wakeEmployeeForEvent` seam unchanged. Literal facts must
  incur **zero** model/runtime calls.
- **Self-check:** test asserts a literal `event_type` yields `routing_mode === "deliver_only"` and makes no
  runtime/LLM call (spy on `loadRuntimeApiUrl`/`wakeEmployeeForEvent` → not called).

### WI-4 — Re-point the connectors at the spine (thin webhooks)
- **Files:** `apps/manager/src/webhooks/{gmail,stripe,twilio}.ts`; `apps/manager/src/tools/events.stub.ts`
  (`send_employee_event`); `apps/manager/src/lib/scheduler-runner.ts` (reminder dispatch path, if it normalizes).
- **Change:** each webhook keeps its **edge signature/OIDC verification**, then calls
  `ingestEvent(db, { source, payload, edgeContext })` instead of building events by hand. `send_employee_event`
  routes its already-normalized payload through `ingestEvent` with `source: "manager"`. Delete the now-dead
  normalization in the connectors. Confirm nothing else calls `deliverEmployeeEvent` directly except `ingestEvent`
  (grep gate).
- **Self-check:** `grep` shows `deliverEmployeeEvent` is called **only** from `ingress.ts` (+ its unit tests).

### WI-5 — Safe-fact enforcement (no raw bodies downstream)
- **Files:** `apps/manager/src/events/ingress.ts`; a shared `assertSafeFact` guard (reuse/extend
  `assertWorkEventDescriptor` style in `lib/employee-events.ts`).
- **Change:** before persistence, assert `normalized_payload` matches the safe-fact shape (whitelist keys;
  reject obvious raw markers — full RFC822 body, `payment_intent` secrets, raw SMS over N chars). A violation →
  repair-queue + audit, never surfaced.
- **Self-check:** test feeds a payload carrying a raw body field → routed to repair, `inbound_events` not written
  with the raw field.

### WI-6 — Tests + acceptance wiring
- **Files:** `tests/unit/event-ingress.test.ts` (new), per-adapter tests, extend `tests/unit/event-bus.test.ts`;
  `tests/integration/*` (env-gated) one test driving all four sources through `ingestEvent`;
  `infra/scripts/acceptance/run7-*.mjs` (the event-bus acceptance run) updated to exercise the generic path.
- **Self-check:** see §6 acceptance.

---

## 5. Decisions & non-scope (so the phase stays one module)

- **No new browser-exposed table.** Phase 3 uses the **in-code adapter registry** as the "generic registry";
  per-account source enablement reuses existing connection/suppression tables. A persistent `event_sources`
  catalog (per-account, RLS-reviewed) is a **forward seam** — only add it when a connector needs per-account
  config, with the Data-API/RLS review the build rules require.
- **Edge verification does not move into adapters.** Signature/OIDC needs the raw HTTP request; keeping it at the
  edge preserves the strict boundary while the adapter does structural verification.
- **`classifyRoute` is rules-first and token-free** in Phase 3. A model-tier triage (haiku) is a later refinement;
  Phase 3 must prove the zero-token literal path, which a model call would violate.
- **The `wake_employee` flag is set but not made live.** Wiring a real Hermes Run is Phase 4.

---

## 6. Acceptance proof (maps 1:1 to the gate)

| # | Gate clause | Proof artifact |
|---|---|---|
| A | One ingress lifecycle for all four sources | Integration test drives Gmail/Stripe/Twilio/manager events through `ingestEvent`; each lands one `inbound_events` row via the same code path. `grep` proves `deliverEmployeeEvent` is called only from `ingress.ts`. |
| B | Per-provider verification still strict at the edge | Forged-signature tests (existing `tests/unit` forged-request suite) still reject Pub/Sub/Stripe/Twilio before `ingestEvent`; unverified request → 401/403, no `inbound_events` row. |
| C | Literal events take the zero-token `deliver_only` path | Unit test: literal `event_type` → `routing_mode==="deliver_only"`, `wakeEmployeeForEvent`/`loadRuntimeApiUrl` not called (spy). |
| D | No raw payloads/secrets past normalization | Safe-fact assertion test + audit inspection: `inbound_events.normalized_payload` and `audit_log.details` contain only whitelisted fields. |
| E | Baseline | `typecheck && test:unit && build && lint` green; integration env-gated test passes with creds. |

**Status vocabulary:** Phase 3 reaches `source-wired` when A–E pass locally. A `provider-accepted` upgrade (real
Gmail/Stripe/Twilio events flowing the generic path live) rides the Phase 1 live-acceptance posture and is
captured as proof ids in `implementation-records/`.

---

## 7. Forward seams (name, do not build)

- **Phase 4 — live wake & descriptors.** `ingestEvent` sets `routing_mode: "wake_employee"`; Phase 4 makes
  `wakeEmployeeForEvent` a real Hermes Run/Session and the returned `WorkEventDescriptor` employee-authored +
  schema-validated. **Atomic-claim-before-wake:** insert a `pending` `inbound_events` row to claim the
  idempotency key *before* waking, so the `0010` dedupe race can't fire a redundant wake (today's backstop stops
  duplicate rows/messages but not a duplicate wake).
- **Phase 6 — `run_id` at ingress.** `ingestEvent` is the natural origin of a correlation `run_id` threaded
  through the tool/runtime chain into the metering ledgers (`work_runs`, `meter_events`). Phase 3 leaves a single
  obvious call site to add it; it does not introduce the ledgers.
- **Phase 5 — account-layer batching.** `recordBatchCandidate` already tags `batch` triage; Phase 5 turns a burst
  into one digest and the live Work Surface stream.

---

## 8. Wiki / CODEGRAPH update points (do these when the code lands)

- Flip **[`phase-03-generic-ingress-event-routing.md`](phase-03-generic-ingress-event-routing.md)** Status
  `planned → source-wired` and cross-link this plan.
- Update **[`phases/README.md`](README.md)** phase index row 3 status.
- Add an **`../implementation-records/2026-…-phase-03-generic-ingress-record.md`** factual code-state entry
  (files, migration n/a, proof ids when live).
- Update **[`../event-driven-office-and-generative-ui.md`](../event-driven-office-and-generative-ui.md) §3** —
  the "Ingress is per-connector, not a generic registry" gap is closed; keep §3 honest.
- Refresh **[`mvp-build/CLAUDE.md`](../../../../mvp-build/CLAUDE.md)** Current-status block (Phase 3 line) and the
  root **[`../../../CODEGRAPH.md`](../../../CODEGRAPH.md) §4/§6** if file inventory changes (new `events/ingress.ts`,
  `events/adapters/*`).
- Write a dated **`mvp-build/memory/`** handoff per the memory protocol (architectural change + phase implementation).

---

## 9. Build checklist (carry-forward)

- [ ] WI-1 real adapters + per-adapter tests
- [ ] WI-2 `ingestEvent` front-controller + test
- [ ] WI-3 `classifyRoute` token-free + zero-token test
- [ ] WI-4 thin webhooks + `send_employee_event` re-pointed; `deliverEmployeeEvent` single-caller grep gate
- [ ] WI-5 `assertSafeFact` guard + raw-body rejection test
- [ ] WI-6 integration (4 sources) + acceptance run updated
- [ ] Baseline green; gate A–E proven
- [ ] Wiki/CODEGRAPH/memory update points (§8) done
- [ ] Phase 4 atomic-claim-before-wake + Phase 6 `run_id`-at-ingress seams left as single clean call sites
