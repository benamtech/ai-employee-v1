# 03 — Ingress, Events, Ambient Inbox, and Egress

Status: **[VERIFIED] source event substrate; [INCOMPLETE] full live-provider matrix**

## Two event doors

AMTECH has two related but distinct ingress paths.

### Door 1 — normalized employee event ingress

`events/ingress.ts` accepts an event source and provider payload, selects a registered adapter, verifies the payload, normalizes it into an owner-safe `NormalizedEvent`, opens a correlated work run, and delegates to `deliverEmployeeEvent`.

This path is used when the provider-specific route can immediately establish account/employee binding and convert the payload into a safe fact.

### Door 2 — durable ambient inbox

`ambient-inbox.ts` stores a verified event before complete account/employee binding or provider-specific processing. It provides durable leasing, ordering, retries, waiting-for-binding state, effect receipts, dead letters, and replay.

This path is used for at-least-once provider delivery that must survive process failure, binding delay, transient dependency failure, or ambiguous effects.

The two doors converge on shared Manager work/event primitives; they are not duplicate implementations of the same lifecycle.

## Event source registry

`events/registry.ts` defines the adapter contract:

```ts
interface EventSourceAdapter<T> {
  source: string;
  verify(input: T): Promise<{ ok: true } | { ok: false; reason: string }>;
  normalize(db, input: T): Promise<NormalizedEvent | null>;
  dedupeKey(event: NormalizedEvent): string;
}
```

A normalized event can carry:

- account and employee binding;
- event type and provider ID;
- idempotency key;
- owner-safe normalized payload;
- owner-safe summary and suggested next action;
- optional silent triage hint;
- typed `WorkEventDescriptor`;
- `deliver_only` or `wake_employee` routing mode;
- channel hint.

[VERIFIED] The manager adapter is registered once in its adapter module. The registry explicitly avoids an inline second registration that would make behavior import-order dependent.

## Safe normalization boundary

Before a normalized payload becomes employee context, `events/ingress.ts`:

- caps serialized normalized payload size at 8,000 characters;
- recursively examines object keys;
- rejects raw-provider or credential-like keys including raw/RFC822, payment intent, client secret, authorization, access token, and refresh token;
- sends unknown, unverified, un-normalizable, or unsafe events to the repair queue rather than fabricating a work event.

This is a fact-safety boundary, not a full content-moderation boundary. Adapter normalization remains responsible for producing a bounded business fact.

## Correlation and work runs

The ingress path opens a `work_run` at the true entry point with:

- trigger type `provider_event`;
- adapter dedupe key as trigger reference;
- account/employee binding when available;
- safe summary.

The run ID travels through event delivery, runtime wake, messages, metering, artifacts, and evidence where supported. Success/failure is finalized at the ingress boundary.

## Employee event delivery

`lib/employee-events.ts` is the shared structured-fact delivery primitive.

Its behavior includes:

1. derive or accept an idempotency key;
2. open or reuse a work run;
3. check durable inbound-event dedupe;
4. calculate triage decision and priority;
5. validate the typed work descriptor;
6. route repair, ignore, or batch outcomes;
7. bind a durable approval when the deliverable is consequential and approval-capable;
8. mint a signed preview link when the descriptor points at an approval or artifact;
9. optionally compile a generated UI resource;
10. either persist-and-deliver or claim-and-wake the employee;
11. persist owner-facing message/event state;
12. meter the delivery;
13. signal the live owner surface.

### Triage modes

- **repair** — event is placed in repair workflow and the run fails.
- **ignore** — durable suppressed event is recorded; no owner interruption.
- **batch** — candidate is recorded for grouped presentation.
- **deliver_only** — Manager produces owner-visible work without a live Hermes turn.
- **wake_employee** — the event is claimed, delivered to Hermes for reasoning/phrasing, then materialized.

### Approval binding

A typed deliverable that leaves the business, moves money, or otherwise requires a gate can acquire an approval row. The approval stores:

- action key;
- summary;
- risk level;
- descriptor references;
- money amount/currency when present;
- source event reference;
- expiration.

The descriptor is then rewritten with the durable approval ID. Generated and text/card surfaces subsequently reference that exact resource.

## Ambient inbox data model

`ambient_event_inbox` records:

- source type and provider;
- provider external event ID;
- optional account/employee binding;
- occurred/received/verified timestamps;
- schema and event type;
- subject, correlation, causation, dedupe, and ordering keys;
- normalized payload and header/verification metadata;
- processing state;
- attempt, lease, retry, dead-letter, replay, and completion state.

Unique constraints cover provider external identity and dedupe key.

Processing states:

```text
received
processing
waiting_for_binding
processed
retryable_failed
dead_letter
suppressed
```

## Ambient enqueue and dedupe

`enqueueAmbientEvent` attempts a normal insert. On a uniqueness conflict it calls `record_ambient_event_duplicate`, which atomically records duplicate delivery metadata and returns the existing inbox ID.

This prevents a provider retry from being treated as a new business event while preserving evidence that repeated delivery occurred.

## Ambient leasing and ordering

`runAmbientInboxCycle` claims one event through the database RPC `claim_next_ambient_event` with a random lease token and bounded lease duration.

Before dispatch, it checks whether an earlier unfinished event exists for the same ordering key. If one exists, the claimed row is returned to `received` with a short retry delay.

This provides per-key ordering without serializing unrelated providers, accounts, employees, or subjects.

## Ambient provider dispatch

Current dynamic dispatch targets:

- Twilio
- Gmail
- Stripe
- QuickBooks
- AMTECH employee-welcome request

Provider modules own provider-specific binding and effect behavior. Dynamic imports keep provider implementation out of the ambient core while making the supported-provider list explicit.

An unsupported provider fails with `ambient_provider_not_supported:<provider>` and follows retry/dead-letter semantics.

## Ambient effect receipts

Before a provider effect, code can call `claimAmbientEffect` with a globally stable effect key. The receipt state is:

```text
claimed → applied
claimed → failed → claimed (retry)
claimed → ambiguous
```

A duplicate claim returns the existing receipt. A failed receipt can be reclaimed atomically. Applied or ambiguous receipts are not silently executed again.

`completeAmbientEffect`, `failAmbientEffect`, and `markAmbientEffectAmbiguous` mutate only a currently claimed receipt.

The effect receipt is separate from the inbox row because one incoming event can produce multiple independently idempotent external or internal effects.

## Retry, binding wait, and dead letters

Retry delay is exponential, beginning at two seconds and capped at one hour.

- `AmbientWaitingForBindingError` moves the row to `waiting_for_binding`.
- normal transient failure moves it to `retryable_failed`.
- maximum attempts or `AmbientEffectAmbiguousError` creates/upserts a dead-letter row and marks the inbox row `dead_letter`.
- replay requires an existing dead-letter inbox row and increments replay state before re-entry.

Errors are bounded and redact long token-like values.

## Outbound effect substrate

Outbound effects leave through Manager-owned adapters and tools rather than arbitrary model-authored network calls.

Examples:

- Gmail draft/send
- Stripe invoice create/send
- QuickBooks pending write/commit
- Twilio SMS delivery
- Model Gateway provider call
- artifact storage and signed link creation
- Caddy/runtime provisioning through Host Provisioner

Common invariants:

1. resolve assignment and commercial scope;
2. validate typed input;
3. require approval where policy requires it;
4. claim command/effect or provider-specific effect key before dispatch;
5. dispatch through a bounded adapter;
6. persist provider receipt, accounting receipt, audit, and owner-safe evidence;
7. classify no-receipt success as ambiguous rather than success;
8. surface retry/repair state without duplicating the owner intent.

## Ingress-to-owner effect graph

### EFFECT-EVENT-001 — verified provider event

```text
provider webhook
  → raw-body signature verification
  → durable inbox or source adapter
  → dedupe
  → account/employee/assignment binding
  → normalized safe fact
  → work_run
  → triage
  → optional approval binding
  → deliver_only OR Hermes wake
  → inbound_event + employee_message + surface envelope
  → SSE/poll refresh
  → owner action
  → command/effect/provider receipt
```

Files touched include provider webhook modules, `events/ingress.ts`, `ambient-inbox.ts`, `employee-events.ts`, metering/audit modules, PostgreSQL event/receipt tables, and Web snapshot/stream routes.

External calls include provider APIs, Hermes, Model Gateway, and SMS transport depending on the event.

### EFFECT-EVENT-002 — event cannot be safely bound

```text
provider delivery
  → verification succeeds
  → durable ambient row
  → worker claim
  → binding lookup fails
  → waiting_for_binding + next_attempt_at
  → future binding or max attempts
  → processed OR dead_letter
```

### EFFECT-EVENT-003 — provider accepted but receipt absent

```text
claimed effect
  → provider returns apparent success without durable receipt
  → effect receipt marked ambiguous
  → inbox/command not reported terminal success
  → repair/operator investigation
```

## Interaction surfaces

### INTERACTION-EVENT-001: adapter verification × normalization | SEQUENTIAL

Emergent finding: a verified signature proves transport origin, while normalization determines whether the payload can become a safe business fact. Neither alone is sufficient.

Defects exposed: DEF-003 if either effect is undocumented.

Value: 19/20.

### INTERACTION-EVENT-002: ambient inbox × effect receipts | EMERGENT

Emergent finding: the inbox guarantees processing of the event; effect receipts guarantee idempotency of each consequence. Together they support crash-safe at-least-once ingress with effectively-once bounded effects.

Defects exposed: DEF-002, DEF-003.

Value: 20/20.

### INTERACTION-EVENT-003: work descriptor × approval × generated UI | TRANSFORM

Emergent finding: a provider event can become a rich owner review object while its authority remains the durable approval and assignment, not the generated card.

Defects exposed: none in current source path.

Value: 20/20.

## Current incomplete boundaries

- [INCOMPLETE] No fleet-scale throughput/load evidence proves ambient leases, ordering keys, and provider workers under 500+ simultaneously active employees.
- [INCOMPLETE] No chaos suite proves worker death between provider acceptance and receipt persistence across every connector.
- [INCOMPLETE] Provider-specific live packets and replay evidence are not captured for every adapter on the current exact SHA.
- [INCOMPLETE] Metrics are stored in domain tables and logs; Prometheus/OpenTelemetry alerting is not present.
- [INCOMPLETE] Compensation and deterministic repair remain explicit later production gates for effects whose provider semantics cannot be made atomic.
