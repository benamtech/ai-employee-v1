# Real Event Mesh V1

Status: complete

## Purpose

The event mesh proves AMTECH turns real outside events into useful employee messages. MVP requires two real event classes:

- `gmail.reply_received`
- `stripe.invoice_sent` / `stripe.invoice_paid`

Provider test mode is acceptable for Stripe. Manually injected invoice results are not.

## Gmail Reply Event

Pipeline:

```text
Gmail Pub/Sub push
  -> verify Pub/Sub delivery/auth where configured
  -> decode notification
  -> load connector by email address
  -> history.list from stored historyId
  -> identify new reply in sent estimate thread
  -> normalize safe summary
  -> dedupe by Gmail message id
  -> send event to employee
  -> employee texts owner
```

Required owner-facing behavior:

```text
Jane replied that the estimate looks good and the 20% deposit is fine if you can start Tuesday at 9:30. Want me to send the deposit invoice for $840?
```

## Stripe Invoice Event

Pipeline:

```text
Stripe webhook
  -> verify Stripe-Signature
  -> reject wrong mode unless live pilot mode enabled
  -> dedupe by Stripe event id
  -> normalize invoice/payment state
  -> link to employee/account/estimate/customer
  -> send event to employee when owner attention is useful
```

Required events:

- invoice sent: record proof, usually no owner interruption unless requested.
- invoice paid: notify owner with customer/job/deposit context and next action.

## Event Delivery Rules

- Event payloads are structured facts, not final owner copy.
- Employee writes the owner-facing message in its voice.
- SMS is default for important events.
- Active webchat may also show the event.
- Duplicate events do not notify twice.
- Unknown mappings go to repair queue, not the owner.

Current-docs research note, 2026-06-29: Manager should verify and normalize provider events before Hermes receives them. Hermes can then deliver through webhook/SMS/API surfaces and use the employee's tools/context to write the owner-facing message. Use `deliver_only`-style direct notification only for trusted facts that require no reasoning; use a Hermes run when the event needs business judgment, artifact context, approval setup, or a next action.

## Idempotency

Keys:

- Gmail: provider `messageId` or `threadId:historyId:messageId`.
- Stripe: Stripe `event.id`.
- Twilio: Twilio `MessageSid`.

Every event trace stores provider id, account id, employee id, normalized type, processing status, delivery status, and audit id.

## Repair

Required operator actions:

- replay Gmail history range;
- renew Gmail watch;
- relink email thread to estimate/customer;
- replay Stripe event by id;
- mark event duplicate;
- redeliver employee event;
- suppress noisy event source.
