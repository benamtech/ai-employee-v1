# Golden path — Step 3: Gmail Send + Real Reply Event (Phase 3 acceptance)

Source: `wiki/MVP/old-build-plan/12-tests-demo-acceptance.md` §3, `08-connectors-email-v1.md`, `09-event-mesh-v1.md`.
Provider test mode is NOT available for Gmail — this requires a real Google account + Pub/Sub. Manually
injected provider results are not acceptance.

## Env required
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`
  (or `MANAGER_API_ORIGIN`), `GMAIL_PUBSUB_TOPIC`
- Authenticated push: `PUBSUB_VERIFICATION_AUDIENCE`, `PUBSUB_SERVICE_ACCOUNT_EMAIL`, `PUBSUB_REQUIRE_AUTH=true`
- Owner notify: `TWILIO_*` + (`EMPLOYEE_SMS_FROM` or `TWILIO_MESSAGING_SERVICE_SID`)

## Flow
1. Owner clicks "Connect Gmail"; `connect_email` returns the Google consent URL (narrowest scopes:
   profile + send + readonly mailbox changes).
2. Google redirects to `/webhooks/gmail/oauth/callback`; CSRF `state` validates; `complete_gmail_oauth`
   exchanges the code, seals the token bundle by reference (`token_secret_ref`), marks the connector
   connected, and starts a Gmail `watch`.
3. `run_email_connector_test` refreshes the token, fetches the profile, verifies scopes, and confirms the watch.
4. Employee drafts the estimate email (`create_email_draft`) with the estimate PDF attached.
5. Employee calls `request_approval` (`action_key: send_estimate_email`); the owner approves from web/SMS.
6. `send_email_draft` builds the MIME message and sends it via `users.messages.send` (records `email_threads`).
7. The customer replies in their mail client.
8. Gmail Pub/Sub pushes to `/webhooks/gmail`; `verifyPubSubJwt` passes; `handle_gmail_pubsub` runs
   `history.list` from the stored `historyId`, finds the reply on a thread we sent an estimate on, dedupes by
   `inbound_email_events.gmail_message_id`, builds a `move:"question"` work-event descriptor, and calls
   `deliverEmployeeEvent` → owner is texted.

## Pass criteria
- [ ] `connector_accounts` row is `connected` with a sealed `token_secret_ref` (no raw token in DB/logs).
- [ ] `gmail_watches` row is `active` with a real `historyId` + `expiration`.
- [ ] Approved send produces a real Gmail `message.id` + `thread.id`; unapproved send is denied.
- [ ] Customer reply arrives as a normalized `gmail.reply_received` event (not raw payload) on the Work Surface.
- [ ] Owner receives an SMS notice with a Twilio `MessageSid`.
- [ ] A duplicate Pub/Sub push does not double-notify (idempotent by `gmail_message_id`).
- [ ] No raw email body is stored or logged; only a safe summary.

## Proof ids to capture
- OAuth: `token_secret_ref`, profile `emailAddress`
- Watch: `historyId`, `expiration`
- Send: Gmail `message.id`, `thread.id`, post-send `historyId`
- Reply: Pub/Sub `messageId`, normalized event id, dedupe key (`gmail_message_id`)
- Notify: Twilio `MessageSid`
