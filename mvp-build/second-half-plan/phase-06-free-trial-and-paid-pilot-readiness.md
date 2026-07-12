# Phase 6 - Free Trial And Paid Pilot Readiness

Status: planned

Goal: finish the product, proof, support, billing, and safety gates needed to hand AMTECH AI Employees to real small-business owners and charge.

## Summary

This phase is the release gate. It does not add a new architecture layer. It proves that the existing layers can safely onboard, operate, and support real trial users.

The release bar includes the Hermes GUI research alignment: web must feel like an employee desk, SMS must be a complete ambient inbox, previews/actions must work from shared materialized state, and admin must make a fleet of employee instances supportable.

## Trial Policy

Define and implement a trial policy:

- who can create a trial;
- trial duration;
- included employee abilities/capabilities;
- enabled connectors;
- cost/budget limits;
- what requires approval;
- what is blocked until paid;
- what support AMTECH provides;
- how conversion to paid works;
- what happens on expiry/cancellation.

Default recommendation:

- trial accounts can use SMS + web + the provisioned/healthy core Hermes tools + estimate/invoice/reminder skills;
- customer-facing sends and money movement require approval;
- Gmail and Stripe can be connected in test/limited mode as appropriate;
- browser/terminal/file capability remains sandboxed and policy-gated;
- cold outbound remains blocked;
- paid conversion unlocks higher support, broader connector setup, and managed office loop.

## Acceptance Gates

Provider/runtime proof:

- Supabase migrations current and RLS proof captured.
- Twilio inbound and outbound proof captured with SIDs.
- Hermes runtime health/capabilities/toolsets proof captured.
- Manager MCP handshake and employee tool-call proof captured.
- Artifact upload/signed-link/generic-render proof captured.
- Gmail OAuth/watch/PubSub/history/send proof captured where trial policy enables it.
- Stripe Connect test-mode account/invoice/webhook proof captured where trial policy enables it.
- Scheduler/Hermes Jobs/reminder proof captured.
- Repair/replay proof captured.
- Security forged-request checks pass.

UX proof:

- Desktop Work Surface happy path.
- Mobile Work Surface happy path.
- SMS-only estimate review/approval path.
- Generic SMS preview/action path for at least one non-estimate resource.
- Connector setup/reconnect path.
- Failure/repair path.
- Paid conversion/billing status path.

Ops proof:

- operator can see account health;
- operator can see production-environment health: core compose, `amtech_runtime`, Caddy config/plugin,
  Cloudflare desired-state proof, DNS/TLS proof tier, employee routing/fleet, backup/restore, red-health,
  and egress status;
- operator can distinguish local mirror, limited live infra, and provider/runtime live proof;
- operator can repair/retry common failures;
- operator can view cost and budget;
- operator can suspend/cancel trial;
- support actions are audited.

## Golden Trial Scenarios

1. Owner creates a trial employee from web.
2. Owner receives/claims SMS.
3. Employee answers a broad business request, not only estimates.
4. Owner asks for an estimate.
5. Employee uses tools to create artifact, preview, and approval.
6. Owner reviews on SMS link and approves.
7. Employee sends Gmail draft/send when connected or offers a connector path if not.
8. Customer reply event becomes a question.
9. Owner answers.
10. Employee creates or sends a Stripe test-mode deposit invoice when connected.
11. Payment event becomes a notify/question.
12. Employee sets reminder.
13. Work Surface shows job folder, receipts, outputs, and history.
14. Admin shows health, usage, and support state.
15. Trial converts to paid or expires cleanly.

Surface/materialization scenario:

16. A non-estimate business request creates a generic work resource/preview/action flow, renders in web, renders by SMS link, and leaves proof in admin.

## Launch Checklist

- Privacy/terms baseline exists.
- Owner consent copy for SMS and connectors exists.
- Provider credentials are production-ready or test-mode labeled.
- A2P/Twilio constraints are understood and documented.
- Support escalation path exists.
- Cancellation/export/retention policy exists.
- Cost alert threshold exists.
- Founder/manual intervention protocol exists.
- Known limitations are written in owner-safe language.
- Demo account and seed data exist.
- Rollback procedure exists.
- Production-environment proof exists at the correct tier for the launch decision:
  - `static`: config/script proof only;
  - `local_mirror`: compose core + `amtech_runtime` + Caddy/employee routing without public DNS;
  - `limited_live_infra`: Cloudflare/Caddy/Docker proof where credentials/host allow;
  - `provider_runtime_live`: real provider/model/runtime proof ids.
- Cloudflare desired state is visible and safe to apply only through explicit CLI confirmation.
- Caddy wildcard DNS-01 image/config path is validated; public cert issuance is claimed only after real ACME proof.

## Tests

- Full local acceptance with browser.
- Full local acceptance with SMS bypass.
- Live provider acceptance report.
- Playwright screenshots for desktop and mobile.
- Security live tests.
- Billing/account-state tests.
- Admin support-action tests.
- Cloudflare DNS planner/dry-run tests.
- Caddy wildcard DNS-01 config/plugin validation tests.
- Production-environment proof aggregation tests.

## Exit Criteria

AMTECH can give a real owner a free trial and know:

- the employee is reachable by SMS and web;
- the employee can use tools;
- the owner can inspect and approve work;
- all customer-facing/money actions are gated;
- artifacts and previews work;
- connectors either work or fail gracefully;
- operator can see and repair health;
- operator can diagnose the production environment before adding a real trial owner;
- usage/cost is visible;
- conversion to paid is operationally supported.

No free trial should start until these criteria are met or explicitly waived in a dated launch decision.
