# Security, Ops, And Observability

Status: complete

## Security Boundaries

Hard boundaries:

- AMTECH web auth for owner web.
- Verified phone for SMS authority.
- Twilio signature validation for inbound SMS.
- OAuth state validation for Gmail and Stripe.
- Gmail Pub/Sub authenticity checks and connector lookup.
- Stripe `Stripe-Signature` verification.
- Manager authorization for tool calls.
- Runtime containment for pilots.

Prompt instructions are not a security boundary.

## Provider Secrets

- Store OAuth tokens and Stripe secrets by secret reference.
- Do not log raw tokens, API keys, full email bodies, or Stripe webhook signing secrets.
- Separate AMTECH platform secrets from customer connector credentials.
- Revoke connector tools when token revocation or account disconnect occurs.

## Confirmation Gates

Require approval before:

- sending estimate email;
- sending Stripe invoice;
- changing deposit amount;
- expanding Gmail scopes;
- connecting/disconnecting Stripe;
- deleting provider data;
- spending or refunding money.

## Observability

Dashboards/log views must show:

- provisioning status;
- runtime health;
- Twilio inbound/outbound message ids;
- artifact generation/link access;
- Gmail connector status, watch expiration, last history id;
- Gmail send ids/thread ids;
- Gmail reply event traces;
- Stripe connected account status;
- Stripe invoice/payment/webhook event traces;
- pending approvals;
- reminders.

## Repair Commands

Required:

- retry provisioning;
- restart employee runtime;
- send test SMS;
- regenerate artifact link;
- reconnect Gmail;
- renew Gmail watch;
- replay Gmail history;
- reconnect Stripe;
- regenerate Stripe account link;
- resend Stripe invoice;
- replay Stripe event;
- set/cancel reminder.

## Acceptance

- Forged Twilio request fails.
- Forged Stripe webhook fails.
- OAuth CSRF state mismatch fails.
- Gmail watch expiration is visible before it breaks.
- Owner cannot access another account's artifact.
- Logs do not contain raw provider tokens.

## Tooling Security Notes

Current-docs research note, 2026-06-29: MCP/Hermes/provider expansion increases the blast radius unless the control plane stays strict. Do not pass provider tokens through to models or browsers. Validate MCP tool inputs and outputs, use tool include lists per Hermes profile, keep human approval on sensitive tool calls, and distinguish tool execution errors from protocol/auth failures. Verify Twilio signatures with the exact inbound URL/body, Stripe webhooks with raw body plus `Stripe-Signature`, and authenticated Pub/Sub push JWTs by issuer, audience, expected service-account email, signature, and expiry.
