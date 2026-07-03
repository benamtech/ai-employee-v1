# Data Model

Status: complete

This is the logical schema required for the real whole-product MVP.

## Account And Employee

Tables:

- `accounts`: business/org identity, slug, timezone, status.
- `users`: owner login identity.
- `account_memberships`: owner role now, admin roles later.
- `verified_phones`: E.164 phone, verification method, consent fields, Twilio proof.
- `employees`: AMTECH employee record, account id, name, status, profile id, web route.
- `employee_manifests`: structured onboarding summary, raw answers, transcript ref.
- `business_brain_facts`: durable facts learned during onboarding/work, source, confidence, updated by employee.
- `phone_verification_attempts`: Twilio Verify attempt id, session id, phone, status, proof, expiry.
- `claim_tokens`: single-use SMS claim token hash, phone, session id, inbound Twilio proof, consumed/expiry state.
- `owner_web_sessions`: first-party owner web session token hash for the AMTECH wrapper.

Key rule: pricing/logo/template facts are first-class business brain facts so the employee can avoid asking duplicate questions.

## Profile Packages

Tables:

- `profile_packages`: registered AMTECH employee packages, package key, version, supported business kinds, default skills, template lineage, validation command.
- `employee_profile_builds`: per-employee package build record, params payload, generated path, validation/install status, validation output, smoke output.

The first package is `contractor_estimator`, but the platform must not hardcode contractor behavior into provisioning. The claim-time path selects a registered package and renders it from params; it does not run prompt-to-repo authoring after every claim.

## Runtime And Artifacts

Tables:

- `runtime_endpoints`: SMS phone/webhook, webchat API route, public web route, backend type, health.
- `provisioning_jobs`: queue state, idempotency key, logs, repair state.
- `artifacts`: estimate/invoice/report files, mime type, path/object ref, created run, owner.
- `artifact_links`: signed token hash, expiry, access/revocation.
- `approvals`: requested action, risk, draft/artifact refs, channel, resolution, expiry.

Estimate artifacts must store:

- customer name/email if known;
- job description;
- line items;
- assumptions;
- owner idea of price;
- employee recommended price;
- approved total;
- deposit percent/amount;
- source conversation refs.

## Gmail Connector

Tables:

- `connector_accounts`: `connector_key=email`, provider `gmail`, status, scopes, token secret ref.
- `gmail_watches`: connector id, topic, subscription, last `historyId`, expiration, status.
- `email_threads`: Gmail thread id, customer email/name, related estimate/artifact ids.
- `outbound_emails`: draft body, attachments, approval id, Gmail message id, thread id, sent status.
- `inbound_email_events`: Pub/Sub message id, Gmail history id, message id, thread id, normalized summary, delivery status.

Do not store full raw email bodies in ordinary logs. Store safe snippets and provider ids; full bodies belong in scoped connector storage if retained.

## Stripe Connector

Tables:

- `stripe_connections`: connected account id, account type, onboarding status, charges/payouts capability status, token/secret refs if applicable.
- `stripe_account_links`: account id, url created/returned/expired state, refresh/return refs.
- `stripe_customers`: Stripe customer id, customer email/name, account id.
- `stripe_invoices`: Stripe invoice id, connected account id, related estimate id, deposit amount, hosted invoice URL, invoice PDF, status.
- `stripe_webhook_events`: Stripe event id, type, livemode flag, signature verified, processed status, trace.

MVP uses Stripe test mode. Store `livemode=false` and reject live-mode events unless live pilot mode is explicitly enabled.

## Events And Notifications

Tables:

- `inbound_events`: source `gmail | stripe | twilio | manager`, event type, provider id, idempotency key, normalized payload, status, trace.
- `employee_messages`: internal message to employee or owner-visible message, source, channel, status.
- `notification_preferences`: account/employee defaults; SMS default for important events.

Required event types:

- `gmail.reply_received`
- `stripe.invoice_sent`
- `stripe.invoice_paid`
- `manager.connector_connected`
- `manager.connector_failed`

## Reminders

Tables:

- `job_commitments`: estimate/customer/job refs, start date/time/window, notes, source email/message.
- `reminders`: account/employee/job ref, scheduled time, channel, status.

Google Calendar is not required for MVP. Internal reminders are.

## Audit And Usage

Tables:

- `audit_log`: actor, action, resource, result, details.
- `entitlement_policies`: default allow.
- `feature_checks`: logged decisions.
- `usage_events`: provider/action usage without blocking.

Audit every provider-connected action: OAuth start/callback, Gmail send, Gmail watch renewal, Stripe onboarding link, invoice send, webhook process, artifact link access, approval resolution.
