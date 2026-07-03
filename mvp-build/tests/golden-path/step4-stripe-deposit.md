# Golden path — Step 4: Stripe Connect Deposit Invoice (Phase 4 acceptance, test mode)

Source: `wiki/MVP/old-build-plan/12-tests-demo-acceptance.md` §4, `09-event-mesh-v1.md`, `10-security-ops-observability.md`.
Stripe **test mode** is allowed; the connected account, invoice, hosted URL, and signed webhook must be REAL
test-mode objects. Manually injected provider results are not acceptance.

## Env required
- `STRIPE_SECRET_KEY=sk_test_…`, `STRIPE_CONNECT_CLIENT_ID`, `STRIPE_WEBHOOK_SECRET=whsec_…`
- `WEB_APP_ORIGIN` (or `MANAGER_API_ORIGIN`) for the account-link return/refresh URLs
- `STRIPE_ALLOW_LIVE` stays unset/false — live keys are rejected.

## Flow
1. Owner asks to collect a deposit; `connect_stripe` creates a test-mode connected account
   (idempotent per account+employee).
2. `create_stripe_account_link` returns a hosted onboarding URL; the owner completes it **inside the
   authenticated app** (never sent by SMS/email).
3. `complete_stripe_onboarding` checks `details_submitted` and stores `charges_enabled`/`payouts_enabled`.
4. Employee calls `create_deposit_invoice` (customer + invoice + invoice item on the connected account);
   it returns a `move:"review"`, `money_movement` descriptor (acceptance: approve/edit/reject).
5. Employee calls `request_approval` (`action_key: send_deposit_invoice`); owner approves.
6. `send_deposit_invoice` finalizes + sends the invoice (approval-gated, idempotent); stores the
   `hosted_invoice_url`.
7. Stripe posts `invoice.sent` (and later `invoice.paid`) to `/webhooks/stripe`; the signature is verified
   on the RAW body, the event is deduped by `event.id`, and `invoice.paid` is normalized into a `job_folder`
   work event for the owner.

## Pass criteria
- [ ] `stripe_connections` row holds a real test-mode `connected_account_id` and onboarding status.
- [ ] Account link URL is a real Stripe-hosted onboarding URL.
- [ ] Deposit invoice is created on the connected account; the draft requires approval before send.
- [ ] Unapproved `send_deposit_invoice` is denied; approved send returns a real `hosted_invoice_url`.
- [ ] `invoice.sent` webhook verifies its signature and is stored once (idempotent by `event.id`).
- [ ] A forged/altered `Stripe-Signature` is rejected (400).
- [ ] No live-mode event is processed (livemode → 202 ignored unless `STRIPE_ALLOW_LIVE=true`).

## Proof ids to capture
- Connect: `connected_account_id`, onboarding status
- Account link: `account_link.url`, `expires_at`
- Invoice: `invoice.id`, `hosted_invoice_url`, status transitions (`draft`→`open`→`sent`)
- Webhook: signed `invoice.sent` `event.id`, stored `stripe_webhook_events` row id
