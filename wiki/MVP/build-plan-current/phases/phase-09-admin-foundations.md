# Phase 9 — Admin Foundations (platform identity + read model)

Status: planned

## Goal / Module

The admin **access-control + safe read model** foundation: platform operators are distinct from
customer-account members, support access is account-scoped/time-limited/reasoned/audited, and admin
reads go through safe summaries — never raw secrets or payloads.

## Depends on

- Phase 1 (RLS posture / live Supabase). Independent of the metering and event-spine phases.
- Design detail: [`../04-admin-and-metering-plan.md`](../04-admin-and-metering-plan.md) (Admin System, Security Rules).

## Surface (code + schema)

Platform access tables (additive):

- `platform_users`
- `platform_roles`
- `platform_user_roles`
- `support_access_sessions`

Plus admin-safe read endpoints over current tables, and privileged-action **reason capture + audit**.

## Build tasks

- Implement admin vocabulary/types and the admin read model over existing tables.
- Add platform roles and support-access sessions (account-scoped, time-limited, reasoned, audited).
- Enforce authorization **server-side** via database-backed platform roles — never `user_metadata`.
- Ensure no service-role keys, provider keys, Hermes tokens, or raw secret refs reach browser code.

## Acceptance proof

- Platform-role checks are enforced server-side; a non-platform user is denied admin reads.
- A support-access session is account-scoped, time-limited, and leaves an audit row with a reason.
- Admin reads contain no raw secrets/payloads.

## Seam handed forward

The authenticated, audited admin boundary + safe read model that Phases 10, 11, and 12 build their
surfaces on.

## Status

`planned`.
