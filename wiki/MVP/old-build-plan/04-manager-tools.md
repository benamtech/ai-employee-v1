# Manager Tools

Status: complete

The Manager is backend-only. The front-door orchestrator and live employees call Manager tools; the owner never sees Manager as a separate assistant.

## Return Envelope

Every tool returns:

```json
{
  "status": "ok | pending | failed | denied | needs_confirmation",
  "account_id": "acct_...",
  "employee_id": "emp_...",
  "changed_resources": [],
  "proof": {},
  "user_facing_summary_hint": "",
  "required_confirmation": null,
  "next_suggested_action": "",
  "audit_id": "aud_..."
}
```

Proof must include provider ids when applicable.

## Identity And Provisioning

- `send_phone_verification(phone_e164, session_id)`
- `check_phone_code(verification_attempt_id, code)`
- `create_account(email, password_or_auth_ref, verified_phone_ref, business_display_name, timezone)`
- `provision_employee(account_id, manifest, transcript_ref, idempotency_key)`
- `get_provisioning_status(account_id, employee_id_or_job_id)`

`provision_employee` creates the employee, profile/runtime metadata, web route, SMS route, default business brain, and first live SMS.

## Estimate And Artifact

- `get_business_brain(account_id, employee_id, fact_keys)`
- `save_business_brain_fact(account_id, employee_id, fact, source_ref)`
- `create_estimate_artifact(employee_id, estimate_payload)`
- `render_estimate_pdf(artifact_id, branding_payload)`
- `create_signed_artifact_link(artifact_id, audience, expiry)`

The employee uses these tools to avoid duplicate questions, store pricing facts, and produce a real PDF artifact.

## Approval

- `request_approval(employee_id, action_key, summary, risk_level, refs)`
- `resolve_approval(approval_id, owner_response, channel)`
- `get_approval_status(approval_id)`

External sends and money actions require an approval id before execution.

## Gmail

- `connect_email(employee_id, provider="gmail", requested_scopes)`
- `complete_gmail_oauth(state, code)`
- `run_email_connector_test(connector_id)`
- `create_email_draft(employee_id, to, subject, body, attachment_artifact_ids, thread_ref)`
- `send_email_draft(draft_id, approval_id)`
- `start_email_listener(connector_id)`
- `renew_email_watch(connector_id)`
- `handle_gmail_pubsub(pubsub_message)`
- `sync_gmail_history(connector_id, start_history_id, end_history_id)`

`send_email_draft` sends a real Gmail API message. `handle_gmail_pubsub` never directly texts the owner; it normalizes the event and delivers it to the employee.

## Stripe

- `connect_stripe(employee_id, mode="test")`
- `create_stripe_account_link(stripe_connection_id, refresh_url, return_url)`
- `complete_stripe_onboarding(stripe_connection_id)`
- `create_deposit_invoice(employee_id, estimate_id, customer_email, deposit_percent, approval_id)`
- `send_deposit_invoice(stripe_invoice_id, approval_id)`
- `handle_stripe_webhook(raw_body, stripe_signature)`
- `get_stripe_connection_status(employee_id)`

Stripe tools run in test mode for MVP. They must reject unverified webhook payloads.

## Event And Reminder

- `send_employee_event(employee_id, source, event_type, normalized_payload, idempotency_key)`
- `set_internal_reminder(employee_id, job_ref, scheduled_at, message, channel="sms")`
- `get_reminders(employee_id, status_filter)`

## Entitlement And Usage

- `get_entitlements(account_id, employee_id, feature_keys)`
- `record_usage(account_id, employee_id, feature_key, quantity, unit, metadata)`
- `request_upgrade(account_id, employee_id, feature_key, owner_message)`

MVP entitlement policy returns `allow` while recording checks.

## Tool Rules

- Every connector setup includes a test.
- Every external send requires approval.
- Every provider webhook verifies signature/authenticity.
- Every tool writes audit.
- Every provider-backed success returns provider proof.

## MCP Compatibility Note

Current-docs research note, 2026-06-29: keep Manager tools compatible with MCP semantics even before a full MCP server is exposed. Tool names should be stable and schema-first; mutating tools need strict input validation, structured output/proof, idempotency keys where applicable, execution-error envelopes the model can recover from, and audit ids. Read/context surfaces such as business-brain facts, connector status, artifact metadata, approval state, event traces, runtime health, and work queues should be exposable as MCP resources.

Provider-critical actions still run through Manager. Hermes and provider MCPs can discover or trigger capabilities, but Manager owns account authority, approval gates, provider signatures, token custody, and proof.
