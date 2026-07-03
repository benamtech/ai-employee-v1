# Tests And Demo Acceptance

Status: complete

## Unit Tests

Cover:

- manifest extraction and business brain fact merge;
- OpenAI-compatible onboarding request construction, including `json_schema` response format;
- pricing fact lookup before asking questions;
- approval-required action detection;
- signed artifact link validation;
- Gmail OAuth state validation;
- Gmail Pub/Sub payload decoding;
- Gmail history id update logic;
- Stripe webhook signature verification;
- Stripe test/live mode rejection policy;
- deposit amount calculation;
- idempotency for Gmail/Stripe/Twilio events.
- Manager/MCP tool schema compatibility, output proof fields, execution-error envelopes, and approval gates.
- RLS/private-artifact access rules for account-owned records and storage objects.

## Integration Tests

Use provider test accounts where possible:

- onboarding model provider smoke test through the configured OpenAI-compatible endpoint;
- Twilio inbound/outbound SMS.
- Gmail OAuth and connector test.
- Gmail API send with PDF attachment.
- Gmail watch setup and history sync.
- Stripe Connect test-mode onboarding.
- Stripe invoice creation/send.
- Stripe webhook processing.
- Internal reminder scheduling.
- Hermes capability/toolset discovery, if a real Hermes runtime is available in the test environment.

Provider mocks are allowed only in unit tests and local developer loops, not MVP acceptance.

## Golden Demo Script

### 1. Create Employee

Start at web or SMS. Use a real test business such as landscaper, painter, or florist.

Expected:

- onboarding agent collects context;
- model response conforms to the onboarding JSON schema and produces a valid manifest patch;
- phone is verified;
- AMTECH account is created;
- employee is provisioned;
- first live SMS arrives.

Provider variation check:

- Run once with the default OpenAI-compatible config.
- Run once with Grok/xAI config when available: `ORCHESTRATOR_API_BASE_URL=https://api.x.ai/v1`, `ORCHESTRATOR_MODEL=grok-4.3`, `XAI_API_KEY`.
- Pass only if both web and SMS paths preserve the same state machine and produce the same required proof shape. If a provider rejects `json_schema`, the fallback to `json_object` must be explicit in env/config and covered by logs; do not silently drop structured-output enforcement.

### 2. Estimate Conversation

Owner:

```text
I just walked a backyard cleanup and mulch job. Need an estimate.
```

Expected:

- employee checks business brain;
- asks missing pricing/materials questions only if needed;
- discusses recommended price and materials;
- accepts owner corrections;
- creates PDF estimate;
- sends signed output link.

### 3. Send Estimate By Gmail

Owner:

```text
Looks good, send it to her.
```

Expected:

- Gmail connects if missing;
- connector test runs;
- employee drafts email with PDF attached;
- owner approves;
- Gmail API sends real email;
- sent message id/thread id stored.

### 4. Customer Reply Event

Customer replies to the real email:

```text
Looks good, and the deposit is fine as long as you can start Tuesday at 9:30 when my family leaves.
```

Expected:

- Gmail watch/history detects reply;
- Manager normalizes event;
- employee texts owner with acceptance, timing, deposit recommendation;
- no manual event payload is injected.

### 5. Stripe Deposit Invoice

Owner approves deposit invoice.

Expected:

- Stripe Connect test-mode setup starts if missing;
- owner completes Stripe onboarding/account connection;
- employee creates 20 percent deposit invoice;
- owner approves sending;
- real Stripe invoice/payment URL is sent;
- Stripe webhook trace is stored.

### 6. Job Reminder

Expected:

- employee stores Tuesday 9:30 job start/reminder internally;
- employee offers Google Calendar connection later;
- reminder appears in reminder list and can trigger SMS.

## Demo Pass Criteria

Pass only if all are true:

- no manually injected provider result is needed;
- every external action has provider proof;
- SMS and web reach the same employee;
- PDF link is viewable and access-controlled;
- Gmail send and reply listener work;
- Stripe Connect/invoice/webhook path works in test mode;
- dangerous actions require approval;
- internal reminder works without Google Calendar.
- onboarding provider can be switched without code changes to the state machine, Manager tools, account setup, or provisioning.
- Hermes expansion is observable: the employee runtime reports live capabilities/toolsets, Manager tools return structured proof, and provider events travel through the normalized event mesh rather than raw webhook copy.
