# Implementation Record — Phase 3 Gmail/Work Events + Phase 4 Stripe Source Wiring

Status: active

Date: 2026-06-29  
Build home: [`../../../mvp-build/`](../../../mvp-build/)  
Plan source: [`../old-build-plan/`](../old-build-plan/)  
Workspace map used: [`../../../CODEGRAPH.md`](../../../CODEGRAPH.md)

## Current State

Phase 3 is source-complete for the local Gmail/work-event path and locally verified, but it is **not provider-accepted** yet. The code now goes materially beyond the earlier consent-link/draft groundwork: Manager has real Gmail OAuth/token, send, watch, Pub/Sub/history, JWKS-backed Pub/Sub auth verification, typed work-event descriptor delivery, owner SMS phone lookup, and Work Surface resource rendering seams.

Phase 4 Stripe is also source-wired for test mode: Manager has Stripe Connect account creation, account-link onboarding, onboarding status checks, deposit invoice creation/send, approval-gated invoice sending, Stripe-Signature webhook processing, test/live guardrails, idempotency, and typed Stripe work-event delivery. It is **not Stripe-provider accepted** until real test-mode Stripe ids and webhook proof are collected.

Local verification passed on 2026-06-29:

```text
npm run typecheck
npm run test:unit
npm run build
npm run lint
```

`npm run test:unit` currently reports 17 passing test files and 79 passing tests.

## Implemented In Code

Phase 3 source files and seams:

- [`../../../mvp-build/packages/db/migrations/0005_phase3_gmail.sql`](../../../mvp-build/packages/db/migrations/0005_phase3_gmail.sql) adds Gmail connector metadata, outbound email proof columns, and dedupe/lookup indexes.
- [`../../../mvp-build/apps/manager/src/lib/google-gmail.ts`](../../../mvp-build/apps/manager/src/lib/google-gmail.ts) implements fetch-based Google OAuth token exchange/refresh and Gmail REST wrappers for profile, send, watch, history, and message metadata.
- [`../../../mvp-build/apps/manager/src/lib/gmail-tokens.ts`](../../../mvp-build/apps/manager/src/lib/gmail-tokens.ts) stores Gmail access/refresh tokens by sealed secret reference and refreshes access tokens without logging raw token values.
- [`../../../mvp-build/apps/manager/src/lib/mime.ts`](../../../mvp-build/apps/manager/src/lib/mime.ts) builds RFC 2822/MIME messages and base64url encodes them for Gmail `users.messages.send`.
- [`../../../mvp-build/packages/shared/src/work-events.ts`](../../../mvp-build/packages/shared/src/work-events.ts) defines typed `WorkEventDescriptor` / deliverable descriptors, SMS rendering, and conformance checks for generative UI inside fixed contracts.
- [`../../../mvp-build/apps/manager/src/lib/pubsub.ts`](../../../mvp-build/apps/manager/src/lib/pubsub.ts) decodes Gmail Pub/Sub push envelopes and verifies configured authenticated push OIDC tokens with Google JWKS/RS256 signature checks.
- [`../../../mvp-build/apps/manager/src/lib/employee-events.ts`](../../../mvp-build/apps/manager/src/lib/employee-events.ts) writes normalized inbound events, stores typed work-event descriptors in normalized payloads, renders owner SMS text, looks up verified owner phone, and preserves idempotency.
- [`../../../mvp-build/apps/manager/src/tools/gmail.stub.ts`](../../../mvp-build/apps/manager/src/tools/gmail.stub.ts) now implements the Gmail tool surface instead of returning stubs.
- [`../../../mvp-build/apps/manager/src/tools/stripe.stub.ts`](../../../mvp-build/apps/manager/src/tools/stripe.stub.ts) now implements Stripe test-mode Connect/account-link/status/deposit-invoice/send tools instead of honest stubs.
- [`../../../mvp-build/apps/manager/src/webhooks/gmail.ts`](../../../mvp-build/apps/manager/src/webhooks/gmail.ts) wires the Gmail OAuth callback and Pub/Sub webhook as thin transport adapters over Manager tools.
- [`../../../mvp-build/apps/manager/src/webhooks/stripe.ts`](../../../mvp-build/apps/manager/src/webhooks/stripe.ts) verifies Stripe signatures, rejects live-mode unless explicitly enabled, dedupes webhook events, and emits typed paid-invoice work events.
- [`../../../mvp-build/apps/web/app/agent/[employeeId]/AgentClient.tsx`](../../../mvp-build/apps/web/app/agent/[employeeId]/AgentClient.tsx) renders Work Surface sections for typed work events, stored messages, connectors, deposit invoices, reminders, artifacts, and approvals.

Implemented Manager tool behavior:

- `connect_email`: creates/reuses a pending Gmail connector and returns a Google consent URL.
- `complete_gmail_oauth`: validates OAuth state, exchanges the Google code, seals tokens by reference, stores Gmail identity/scope metadata, and best-effort starts a Gmail watch when `GMAIL_PUBSUB_TOPIC` is configured.
- `run_email_connector_test`: refreshes the token if needed, fetches Gmail profile, checks send/read scopes, and starts/renews watch when possible.
- `create_email_draft`: validates connector existence plus artifact ownership and writes a draft row.
- `send_email_draft`: requires a resolved owner approval, builds MIME with stored PDF attachments, calls Gmail send, stores Gmail message/thread proof, creates/updates `email_threads`, and is idempotent for already-sent drafts.
- `start_email_listener` / `renew_email_watch`: starts or renews Gmail `users.watch` and stores `historyId`/expiration proof.
- `handle_gmail_pubsub`: finds the connector by pushed Gmail address, syncs history from stored state, dedupes by Gmail message id, recognizes replies to known sent estimate threads, writes inbound email event rows, and delivers normalized employee events.
- `sync_gmail_history`: manual repair/fallback history sync for a connected Gmail account.

Implemented work-event / generative UI behavior:

- `WorkEventDescriptor` supports `notify | question | review` moves and typed deliverables such as `outbound_message`, `money_movement`, and `job_folder`.
- Gmail customer replies become `question` work events with a `money_movement` deposit-invoice decision, proof refs, and SMS/web rendering from the same descriptor.
- Stripe paid-invoice webhooks become `notify` work events with job-folder follow-through context and proof refs.
- Descriptor conformance tests reject customer- or money-facing deliverables without an approval/response path.

Implemented Stripe Manager tool behavior:

- `connect_stripe`: creates/reuses a Stripe test-mode connected account and stores connected-account proof.
- `create_stripe_account_link`: creates an authenticated Stripe Account Link and stores link proof.
- `complete_stripe_onboarding`: checks connected-account status and updates onboarding/charges/payouts state.
- `get_stripe_connection_status`: returns account status without provider mutation.
- `create_deposit_invoice`: creates Stripe customer, draft invoice, invoice item, local invoice row, idempotency keys, and a money-movement descriptor.
- `send_deposit_invoice`: requires resolved owner approval, finalizes/sends the invoice, stores hosted invoice URL/PDF proof, and returns a money-movement descriptor.
- `handle_stripe_webhook`: remains transport-only through the signed `/webhooks/stripe` route; direct unsigned tool invocation is rejected.

Unit coverage added or expanded:

- [`../../../mvp-build/tests/unit/google-gmail.test.ts`](../../../mvp-build/tests/unit/google-gmail.test.ts) covers Google/Gmail fetch wrappers.
- [`../../../mvp-build/tests/unit/mime.test.ts`](../../../mvp-build/tests/unit/mime.test.ts) covers MIME/base64url construction.
- [`../../../mvp-build/tests/unit/gmail-send.test.ts`](../../../mvp-build/tests/unit/gmail-send.test.ts) covers approval-gated send, attachment handling, idempotency, cross-account denial, and token refresh.
- [`../../../mvp-build/tests/unit/gmail-pubsub.test.ts`](../../../mvp-build/tests/unit/gmail-pubsub.test.ts) covers Pub/Sub decode/JWKS verification, known-thread reply processing, typed work-event delivery, and dedupe.
- [`../../../mvp-build/tests/unit/work-events.test.ts`](../../../mvp-build/tests/unit/work-events.test.ts) covers descriptor conformance and SMS rendering.
- [`../../../mvp-build/tests/unit/stripe-tools.test.ts`](../../../mvp-build/tests/unit/stripe-tools.test.ts) covers Stripe Connect, account links, deposit invoice creation, approval-required sending, hosted invoice URL proof, and money-movement descriptors.

## Not Provider-Accepted Yet

These must remain pending until a real configured environment proves them:

- Apply `0005_phase3_gmail.sql` to the hosted Supabase project and confirm schema/indexes.
- Configure `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI` or `MANAGER_API_ORIGIN`, `GMAIL_PUBSUB_TOPIC`, `PUBSUB_VERIFICATION_AUDIENCE`, and `PUBSUB_SERVICE_ACCOUNT_EMAIL`.
- Complete a real Gmail OAuth consent callback and confirm stored connector metadata plus sealed token reference.
- Run a real connector test that fetches Gmail profile and starts/renews a Gmail watch.
- Send a real approved email through Gmail with the estimate PDF attachment or explicit signed-link fallback.
- Receive a real customer reply through Gmail Pub/Sub, process `history.list`, dedupe it, and produce the normalized owner-facing event.
- Verify authenticated Pub/Sub push against a real Google-signed push token and JWKS endpoint.
- Confirm normalized employee events leave a Twilio `MessageSid` for the verified owner phone when SMS delivery is live.
- Complete real Stripe test-mode Connect onboarding and confirm connected account id/status.
- Create and send a real Stripe test-mode deposit invoice, store hosted invoice URL/payment proof, and receive a real signed `invoice.sent` / `invoice.paid` webhook.

## Known Implementation Gaps For The Next Agent

- The owner web UI is still plain and utilitarian. It renders the needed work-event/resource sections, but visual polish and richer job-folder grouping remain future UI work.
- Stripe API calls are source-wired and unit-tested against mocked endpoints; they still require a real `STRIPE_SECRET_KEY` and test-mode account proof before acceptance.
- Periodic watch renewal/history fallback should be scheduled through Manager/Hermes Jobs or a clear cron seam.
- Live end-to-end provider proof has not been collected. Do not mark Phase 3 complete from local mocks.
- `npm run db:status` and hosted Supabase verification still require `DATABASE_URL`.

## Next Implementation Inherits

The next session should treat the Phase 3/4 source code as a strong implementation with local proof, not a plan-only stub. The job is to run provider acceptance and finish the remaining event/runtime operations:

1. Apply/verify schema and configure real Google/Pub/Sub env.
2. Complete live Gmail OAuth and connector test.
3. Send an approved real Gmail email with artifact proof.
4. Process a real Gmail reply into a normalized event.
5. Confirm that Gmail reply work events render in SMS/web from the same descriptor and produce Twilio proof when configured.
6. Complete real Stripe test-mode Connect/account-link/invoice/send/webhook proof.
7. Add a scheduled Gmail watch-renewal/repair path through Manager/Hermes Jobs or cron.
8. Connect the paid/accepted reply path to `set_internal_reminder` for the final job-scheduled MVP step.
