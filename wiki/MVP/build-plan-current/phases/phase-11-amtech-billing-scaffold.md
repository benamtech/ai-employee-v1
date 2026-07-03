# Phase 11 — AMTECH Billing Scaffold

Status: planned

## Goal / Module

Make **AMTECH subscription** state visible and controllable, kept strictly separate from **owner
Stripe Connect** payments. Two rails, never confused.

## Depends on

- Phase 9 (admin foundations). Soft: Phase 8 (usage for invoicing context).
- Design detail: [`../04-admin-and-metering-plan.md`](../04-admin-and-metering-plan.md) (Billing Boundary).

## Surface (code + schema)

Tables (additive):

- `plans`, `subscriptions`, `subscription_items`, `billing_invoices`, `billing_events`, `billing_credits`.

Plus an admin billing tab and an owner account billing summary.

## Build tasks

- Add plan/subscription/billing-event schema.
- Default MVP/pilot accounts to **allow-all**.
- Model setup fee + monthly plan states; add dunning/grace/suspension policy that is **non-blocking**
  for critical flows.
- Keep AMTECH invoices separate from owner deposit invoices in data and UI.

## Acceptance proof

- Account detail shows **AMTECH subscription state separately** from owner Stripe Connect state.
- Billing gates block **only noncritical outbound work** and only when explicitly enabled — never
  inbound provider event recording, repair, audit, export, cancellation, or security handling.

## Seam handed forward

A subscription rail that Phase 13 wires into cancellation/retention/dunning operations.

## Status

`planned`.
