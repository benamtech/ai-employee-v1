# Provider Runtime Acceptance Plan

Status: active

> This is the detailed runbook for **[Phase 1 — Live Provider & Runtime Acceptance](phases/phase-01-provider-runtime-acceptance.md)**. The phase doc owns the gate; this doc owns the env vars, acceptance runs §1-§8, and proof ids.

## Purpose

This is the remaining acceptance plan for the current MVP. It should be executed before declaring the product live, and before shifting most effort into admin/metering implementation.

## Environment Required

Supabase:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Manager/runtime:

- `MANAGER_BASE_URL`
- `MANAGER_INTERNAL_TOKEN`
- `PROVISIONER_TOKEN`
- `HERMES_API_TOKEN`
- `HERMES_EVENT_PATH`
- `HERMES_BACKEND_TYPE=docker` for first pilots

Twilio:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`
- `TWILIO_FRONTDOOR_NUMBER`
- `TWILIO_EMPLOYEE_NUMBER` or `TWILIO_MESSAGING_SERVICE_SID`

Google/Gmail/PubSub:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GMAIL_PUBSUB_TOPIC`
- `PUBSUB_VERIFICATION_AUDIENCE`
- `PUBSUB_SERVICE_ACCOUNT_EMAIL`
- `PUBSUB_REQUIRE_AUTH=true`
- optional `PUBSUB_JWKS_URL`

Stripe:

- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_CONNECT_CLIENT_ID`
- `STRIPE_WEBHOOK_SECRET=whsec_...`

LLM/front door:

- `ORCHESTRATOR_API_BASE_URL`
- `ORCHESTRATOR_API_KEY` or provider-specific compatible key
- `ORCHESTRATOR_MODEL`
- optional `ORCHESTRATOR_RESPONSE_FORMAT=json_object`

## Acceptance Runs

### 1. Database And RLS

Run:

```text
npm run db:migrate
npm run test:integration
```

Proof required:

- migrations `0001` through `0008` applied;
- owner A denied account B read;
- service role can read both for Manager operations;
- no new owner-facing admin/metering table is exposed without explicit grants and RLS.

### 2. Account, Claim, Provisioning

Run:

- create owner through web or SMS front door;
- verify phone;
- create account;
- claim/provision employee.

Proof required:

- Supabase auth user id;
- AMTECH account id;
- user id and account membership id;
- verified phone Twilio proof;
- provisioning job id;
- profile build id;
- runtime endpoint id;
- Twilio employee webhook proof;
- first outbound SMS `MessageSid`;
- runtime health proof.

### 3. Estimate Artifact

Run:

- owner asks employee for an estimate;
- employee produces PDF artifact;
- owner opens signed artifact link.

Proof required:

- artifact id;
- storage ref;
- signed artifact link id/token hash;
- Supabase Storage signed URL creation;
- audit `artifact:access` row;
- approval id if gated.

### 4. Gmail Send And Reply

Run:

- connect Gmail;
- send estimate email after owner approval;
- reply from customer mailbox;
- Pub/Sub/history normalizes reply event;
- owner receives employee notification.

Proof required:

- connector id and sealed token secret ref;
- Gmail profile email;
- watch id, `historyId`, expiration;
- Gmail sent message id/thread id;
- Pub/Sub message id;
- inbound email event id;
- normalized work event id;
- Twilio owner notification SID or web delivery proof.

### 5. Stripe Connect Deposit

Run:

- connect Stripe test-mode account through authenticated account link;
- owner approves deposit invoice;
- invoice is sent;
- webhook is verified and processed.

Proof required:

- connected account id;
- account-link id/url, not sent outside authenticated app;
- Stripe customer id if created;
- Stripe invoice id;
- hosted invoice URL;
- signed webhook event id;
- `invoice.sent` and `invoice.paid` event traces where applicable.

### 6. Reminder And Scheduler

Run:

- employee proposes job reminder after reply/payment context;
- owner confirms;
- `dispatch_due_reminders` fires;
- `renew_expiring_watches` renews watches;
- `dispatch_daily_briefs` emits stored silent brief.

Proof required:

- job commitment id;
- reminder id;
- approval id for reminder gate;
- reminder status `scheduled -> sent`;
- Twilio SID;
- Gmail watch renewed count;
- Hermes job-run proof or scheduler tick proof;
- daily brief inbound event id.

### 7. Repair And Event Bus

Run:

- replay Gmail history;
- replay Stripe event;
- suppress a noisy event source;
- redeliver an employee event;
- exercise `deliver_only` and `wake_employee` paths.

Proof required:

- repair queue row;
- replayed provider event id/history range;
- suppression id;
- redelivery id;
- runtime structured event response with validated descriptor;
- audit rows for each operator action.

### 8. Security

Run forged request tests:

- invalid Twilio signature;
- invalid Stripe signature;
- invalid Pub/Sub/OIDC authorization;
- invalid owner session;
- invalid signed artifact token;
- cross-account owner access attempt.

Proof required:

- all forged requests denied;
- failures logged safely;
- no raw tokens/signatures/body/secrets in logs or audit details.

## Acceptance Definition

The current MVP is accepted only when all original loop steps have real provider/runtime proof ids and the security checks pass. Until then, status remains:

```text
source-complete; provider/runtime acceptance pending
```
