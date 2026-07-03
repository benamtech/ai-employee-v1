# Agent Team Workstreams

Status: complete

## Architecture Lead

Owns the real whole-product sequence, cross-doc consistency, and rejection of presentation-only demo paths.

Deliverable: one acceptance checklist that traces every MVP claim to provider-backed proof.

## Accounts And Front Door

Owns web/SMS onboarding, phone verification, account creation, manifest extraction, employee claim, and handoff to provisioning.

Proof: account id, verified phone proof, employee id, first live SMS.

## Employee Brain And Estimate

Owns pricing discovery behavior, business brain storage, estimate drafting, PDF rendering, logo/template fallback, artifact links, and estimate approval flow.

Proof: estimate artifact id, PDF link, pricing facts stored.

## Provisioning And Runtime

Owns profile/runtime creation, SMS/web routes, health checks, first live message, and pilot containment.

Proof: runtime health record, SMS provider id, web route.

## Gmail Connector

Owns Gmail OAuth, send, attachment handling, watch/Pub/Sub, history sync, reply normalization, revoke/reconnect.

Proof: Gmail profile id, watch history id, sent message id, reply message id.

## Stripe Connector

Owns Stripe Connect test-mode onboarding, connected account status, deposit invoice creation, invoice send/payment URL, webhook verification.

Proof: Stripe connected account id, invoice id, hosted invoice URL, webhook event id.

## Event Mesh

Owns provider event normalization, idempotency, employee event delivery, SMS notification policy, event repair.

Proof: inbound event trace, employee message id, outbound SMS id.

## Security And Ops

Owns provider signatures, OAuth state, token custody, logs, support commands, backup/restore, and abuse controls.

Proof: failing forged-provider tests, visible repair runbook.

## Handoff Standard

Every workstream handoff includes:

- routes/env vars;
- provider setup steps;
- Manager tools;
- data tables;
- proof ids emitted;
- failure modes;
- acceptance tests.
