# Source Of Truth And Rules

Status: complete

## Canonical Rule

The MVP must actually work. Test mode from a real provider is allowed where appropriate. A manually injected provider result, bypassed OAuth success, or presentation-only shortcut is not an MVP capability.

## Non-Negotiables

- Account setup activates employee creation. Payment never gates first employee creation.
- The owner only talks to their employee. Manager is backend infrastructure exposed through tools.
- The employee owns implied follow-through: connect, test, verify, report, and suggest the next useful action.
- Every external send, money action, connector scope expansion, delete, or account/security change needs confirmation.
- SMS is the default notification surface because it feels like a working office, not another app.
- Webchat is a richer employee surface, not a raw Hermes dashboard.
- AMTECH account, Hermes profile, runtime, and external provider accounts are separate objects.
- Hermes profiles are not security sandboxes; real runtime containment requires a backend boundary.
- Entitlements exist but default to `allow` in MVP.

## Realness Rules

- Gmail connection is real OAuth, real token custody, real send, real watch/history listener, and real customer reply detection.
- Stripe connection is real Stripe Connect in test mode, real Account Links or OAuth path, real invoice/payment URL, and real signed webhook handling.
- Twilio path is real inbound/outbound SMS with signature validation.
- PDF estimate is a real generated artifact served by an AMTECH signed link.
- Provider test mode is acceptable only when it uses provider APIs and webhooks exactly as production would.
- Local unit tests may mock providers, but MVP acceptance cannot.

## Owner Experience Standard

The owner can say natural things like:

```text
I just walked a job. Need an estimate.
```

The employee should:

- inspect what it already knows;
- ask only for missing pricing, scope, logo, template, or customer details;
- produce the artifact;
- request approval before sending;
- connect missing tools without making the owner project-manage setup;
- react to outside events like an office manager with context.

## Forbidden MVP Language

Do not describe required MVP capabilities as:

- manually injected provider result
- unit-test-only connector success
- bypassed provider event
- demo-only
- stubbed
- smoke-only
- synthetic provider event

Use real provider test mode and explicit setup steps instead.
