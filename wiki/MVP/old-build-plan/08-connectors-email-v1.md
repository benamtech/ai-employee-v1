# Gmail Connector V1

Status: complete

## Purpose

Gmail is the first required external connector. It must send the approved estimate email and listen for real customer replies.

## Required Capabilities

- OAuth consent for Gmail.
- Token custody by secret reference.
- Non-destructive connector test.
- Real email send with PDF attachment.
- Gmail watch/Pub/Sub listener.
- `historyId` storage and history sync.
- Reply normalization and employee event delivery.
- Watch renewal before expiration.
- Revoke/reconnect.

## Scopes

Minimum practical MVP scopes:

- read user email/profile;
- send email;
- read mailbox changes needed to process replies.

Use the narrowest Google scopes that still allow send plus reply detection. Expanding scopes later requires owner approval.

## Send Flow

```text
owner: send it to her
employee -> Manager: create_email_draft
Manager returns draft summary
employee asks owner approval
owner approves
employee -> Manager: send_email_draft
Manager builds MIME email with PDF attachment
Manager base64url encodes message
Manager calls Gmail users.messages.send
Manager stores Gmail message id + thread id
employee reports sent
```

The estimate email must include the PDF attachment or a signed estimate link, depending on attachment size and provider constraints. MVP target is PDF attachment plus link.

## Reply Listen Flow

```text
OAuth complete
  -> start_email_listener
  -> Gmail users.watch(topic)
  -> store historyId + expiration
customer replies
  -> Gmail publishes Pub/Sub notification
  -> Manager receives push
  -> decode emailAddress/historyId
  -> history.list from stored historyId
  -> identify new message in known thread
  -> normalize reply
  -> send employee event
  -> employee texts owner
```

Store only safe snippets in normal logs. Keep provider ids so support can inspect through authorized connector tooling.

## Connector Test

A pass requires:

- OAuth token refresh works.
- Gmail profile identity fetched.
- A watch can be started or renewed.
- The account can create/send a test to an AMTECH-controlled mailbox only if the owner explicitly allows a test send; otherwise metadata/watch test is enough before first real approved send.

## Reply Notification

The employee receives structured context:

```json
{
  "event_type": "gmail.reply_received",
  "customer_email": "jane@example.com",
  "thread_id": "gmail-thread-id",
  "related_estimate_id": "est_...",
  "safe_summary": "Customer accepted estimate, deposit okay, asks for Tuesday 9:30 start.",
  "suggested_next_action": "ask owner to approve deposit invoice"
}
```

The employee writes the owner message.

## Failure Handling

- OAuth denied: report and offer retry.
- Watch setup failed: email can still send, but reply listener is not live; report clearly.
- Pub/Sub delayed/dropped: run periodic history sync fallback.
- Token expired/revoked: send employee event asking owner to reconnect.
- Unknown thread reply: summarize and ask owner whether to attach it to a customer/job.

## Current Docs Implementation Notes

Research note, 2026-06-29: Gmail send/listen should follow the official provider path. Build RFC 2822/MIME email, base64url encode it into the Gmail `raw` message, and send with `users.messages.send`. For reply listening, store watch expiration and last `historyId`; renew watches before the seven-day expiration; process Pub/Sub push by validating authenticity, decoding the notification, then calling `users.history.list` from stored state. If `startHistoryId` is stale and Gmail returns 404, run a controlled full sync and update the connector state. Pub/Sub push is at-least-once, so event processing must be idempotent.
