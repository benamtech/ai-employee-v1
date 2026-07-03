# Phase 10 — Admin Operations Surfaces

Status: planned

## Goal / Module

The operator **admin panel**: make the MVP operable without raw SQL — inspect and repair accounts,
provisioning, and providers from UI/API, with account ops tables behind it.

## Depends on

- Phase 9 (admin foundations + safe read model).
- Phase 2 (provisioning/runtime health to display), Phase 3 (repair queue to surface), Phase 8
  (usage summaries to show).
- Design detail: [`../04-admin-and-metering-plan.md`](../04-admin-and-metering-plan.md) (Admin MVP Scope, Admin Data Additions).

## Surface (code + schema)

Pages: `/admin`, `/admin/accounts`, `/admin/accounts/[accountId]`, `/admin/provisioning`,
`/admin/repairs`, `/admin/providers`.

Tables (additive):

- Account ops: `account_invitations`, `account_state_transitions`, `account_health_snapshots`, `account_exports`, `account_cancellations`.
- Provisioning: `provisioning_steps`, `number_assignments`, `runtime_health_checks`.
- Provider ops: `provider_connections`, `provider_health_checks`, `provider_rate_limits`, `oauth_reauth_requests`.

## Build tasks

- Build the admin pages over the Phase 9 read model.
- Account health summaries; provisioning queue with **safe retry**; provider/connector health queues.
- Surface AMTECH billing **state scaffold** (full billing is Phase 11) and current usage summaries (Phase 8).
- Audit every privileged action; capture reason; confirm destructive actions.

## Acceptance proof

- An operator can inspect and **repair** account/provisioning/provider issues from UI/API.
- No raw secrets or payloads appear in any admin surface.
- Owner surfaces are unchanged.

## Seam handed forward

A working operator console that Phase 13 extends with severity queues, incidents, and lifecycle ops.

## Status

`planned`.
