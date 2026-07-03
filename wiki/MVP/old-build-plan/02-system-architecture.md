# System Architecture

Status: complete

## Product Model

```text
AMTECH account/org
  -> owner user + verified phone/email
  -> employee record
  -> Hermes profile
  -> runtime endpoints
  -> Manager tools
  -> provider connectors
     - Twilio SMS
     - Gmail send/listen
     - Stripe Connect/invoices
```

For MVP, assume one owner and one employee per account. Use data names that allow more later.

## Plane 1 - Front Door

The front door is a lean onboarding agent. It runs on web and SMS, gathers business context conversationally, and creates the account/employee only after phone verification and account setup.

Entry points:

- `amtechai.com/create-ai-employee`
- `amtechai.com/claim`
- AMTECH Twilio front-door number

Before account creation, the onboarding agent can answer lightweight product questions and collect context. It should not connect tools, send external messages, or provision until the owner verifies and creates an account.

## Plane 2 - Employee Interaction Wrapper

The owner works with the real employee through:

- SMS for default work and notifications.
- Web at `agent.amtechai.com/{employee_id}` or equivalent for chat, artifacts, approvals, and connector status.

The wrapper handles auth, routing, artifact preview, signed links, approvals, connector consent, and notification state. It never exposes raw Hermes admin surfaces.

## Plane 3 - Manager

Manager is the backend control plane. It is invisible to the owner and exposed to the onboarding agent/live employee through strict tools.

Manager owns:

- provisioning;
- artifact link creation;
- Gmail OAuth/send/watch/history processing;
- Stripe Connect/account/invoice/webhook processing;
- approvals;
- internal reminders;
- audit and repair commands.

Current-docs research note, 2026-06-29: treat Manager as MCP-compatible even when it is called over ordinary HTTP first. Hermes should be extended as the runtime and gateway surface, while Manager remains AMTECH's tenancy, provider-auth, audit, approval, and proof layer. See `14-agentic-tooling-research-notes.md`.

## Event Mesh

Events are real provider events or Manager lifecycle events:

```text
Gmail Pub/Sub notification -> history sync -> inbound email event
Stripe webhook -> verified event -> invoice/payment event
Manager job -> lifecycle event
```

Events enter Manager, are normalized and deduped, then are delivered to the employee as authoritative context. The employee turns them into owner-facing SMS/webchat messages.

## Provider Boundary

Gmail:

- OAuth tokens belong to account/employee connector records.
- Send uses Gmail API.
- Reply listener uses watch/Pub/Sub and `history.list`.

Stripe:

- AMTECH platform creates/connects Stripe accounts in test mode for MVP.
- Deposit invoices are real Stripe invoice objects.
- Webhooks are verified before state changes.

Twilio:

- Inbound SMS signature is mandatory.
- Outbound SMS proof is stored by provider message id.

## Domain Scheme

Use simple stable routes:

- `amtechai.com/create-ai-employee` for signup.
- `amtechai.com/claim` as compatible claim entry.
- `agent.amtechai.com/{employee_id}` for owner web employee surface.
- `api.amtechai.com/manager/*` for backend tool/API routes.
- `api.amtechai.com/webhooks/gmail` for Pub/Sub push.
- `api.amtechai.com/webhooks/stripe` for Stripe.
- `api.amtechai.com/webhooks/twilio/*` for SMS.
- `agent.amtechai.com/{employee_id}/output/{artifact_id}` for signed artifacts.

Specific hostnames can change, but the split between public owner surface and backend webhook/tool surface must not.

## Hermes Extension Rule

The product should aggressively use Hermes capabilities: per-employee profiles, API server, Runs/Sessions/Jobs, SMS/webhook gateways, skills, memory, filtered MCP servers, and toolset discovery. The owner still sees one employee; AMTECH web/SMS wrappers render artifacts, approvals, connector consent, and provider proofs around that employee.
