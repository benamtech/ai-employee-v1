# AMTECH AI Employee MVP Build Plan

Status: complete

This folder is the implementation handoff for the real AMTECH AI Employee MVP. The MVP is not a staged demo and not a form plus a manually injected provider result. It is the smallest whole product that actually works: a non-technical business owner creates an employee, uses it to produce an estimate, sends the estimate through a real email connector, receives a real customer reply event, sends a real Stripe deposit invoice in provider test mode, and gets the next job reminder.

## Source Of Truth

Read these first:

1. `../../identity.md`
2. `../../CODEGRAPH.md`
3. `../../wiki/product-ai-employee-context.md`
4. `../../wiki/product-agent-platform-architecture.md`
5. `../../wiki/ai-employee-mvp-build-plan-handoff.md`
6. `../../wiki/offers/estimator-whole-product.md`

If this folder and the root wiki disagree, update the older text to this real whole-product bar. The root wiki is the company brain; this folder is the build packet.

## MVP Bar

The MVP is complete only when this real path works end to end:

1. Owner starts at `amtechai.com/create-ai-employee`, `amtechai.com/claim`, or by texting an AMTECH-owned Twilio number.
2. Owner chats with the onboarding agent, verifies phone, creates an AMTECH account, and claims a real employee.
3. Owner talks to the employee over SMS and web at an AMTECH-owned route such as `agent.amtechai.com/{employee_id}`.
4. Owner describes a walkthrough and asks for an estimate.
5. Employee checks the business brain, asks only missing pricing/logo/template questions, and drafts an estimate.
6. Employee creates a real PDF artifact and returns a signed output link.
7. Owner approves sending the estimate.
8. Employee connects Gmail if needed, drafts the email with the PDF attached, asks for approval, and sends through the Gmail API.
9. Customer replies to the real email.
10. Gmail push/history sync delivers the reply to AMTECH, Manager normalizes it, and the employee texts the owner with context and a next action.
11. Owner approves a 20 percent deposit invoice.
12. Employee connects Stripe if needed through Stripe Connect onboarding in test mode, creates/sends a real Stripe invoice/payment link, and records webhook events.
13. Employee stores an internal job start/reminder and offers Google Calendar connection later.

Stripe test mode is acceptable for MVP because it exercises real Stripe APIs, account links, invoices, payment URLs, and webhooks without moving live money. Manually injected invoice results do not satisfy MVP acceptance.

## Provider Grounding

Implementation should follow official provider primitives:

- Front-door LLM: OpenAI-compatible endpoint with strict structured output when supported. OpenAI and xAI/Grok both document schema-constrained structured outputs; Grok can be reached through OpenAI-compatible clients by changing the base URL to `https://api.x.ai/v1`. This is a technical portability boundary for onboarding only; the main product architecture is Hermes + MCP/Manager tools + provider-backed artifacts/events.
- Gmail send: MIME/RFC 2822 message encoded as base64url and sent with `users.messages.send`.
- Gmail listen: `users.watch` to Cloud Pub/Sub, store `historyId`, process changes with `history.list`, renew watches before expiration.
- Stripe Connect: Standard account creation or OAuth where applicable, Account Links for onboarding, authenticated redirects, one-time account-link URLs.
- Stripe invoices: draft invoice plus invoice items, `collection_method=send_invoice`, finalize/send, hosted invoice/payment URL.
- Stripe webhooks: verify `Stripe-Signature` with the endpoint secret before acting.

## Document Map

- `00-source-of-truth-and-rules.md` - product invariants and realness rules.
- `01-mvp-scope-and-milestones.md` - build sequence and acceptance gates.
- `02-system-architecture.md` - planes, surfaces, connectors, event rails.
- `03-data-model.md` - logical schema for accounts, employees, estimates, email, Stripe, events, reminders.
- `04-manager-tools.md` - tool contracts the employee/front door call.
- `05-front-door-orchestrator.md` - signup and onboarding agent.
- `06-interaction-wrapper.md` - SMS/web employee surface, artifacts, approvals.
- `07-provisioning-runtime.md` - provisioning, routing, runtime health.
- `08-connectors-email-v1.md` - real Gmail send/listen connector.
- `09-event-mesh-v1.md` - real Gmail reply and Stripe webhook event mesh.
- `10-security-ops-observability.md` - trust boundaries, provider signatures, repair.
- `11-agent-team-workstreams.md` - agent/developer split.
- `12-tests-demo-acceptance.md` - real golden-path test script.
- `13-backlog-non-goals.md` - deferred work after the real loop works.
- `14-agentic-tooling-research-notes.md` - current-docs research addendum for expanding Hermes/MCP/Manager/provider tool surface without making model choice the center of the architecture; includes the efficiency synthesis (call-shape selection, token economics, MCP resources-vs-tools, idempotency, the event→meaning pipeline).
- `15-interaction-reimagined-the-work-surface.md` - product-vision addendum: the "Macintosh moment" — how AMTECH renders Hermes's developer-facing event stream (Runs/SSE, tool progress, approvals, jobs) into a coworker a non-technical owner trusts (SMS ambient inbox + the web Work Surface), and the Hermes→Work translation adapter to build in Phase 3.

## Working Rule

Every claimed capability must leave a provider-backed proof: Twilio message SID, Gmail message/thread/history id, Stripe account/invoice/payment/webhook id, artifact id/link, approval id, or runtime health record. If the proof is not real, the feature is not done.
