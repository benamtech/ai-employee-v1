# Implementation Record — Phase 6 Pilot Hardening + Phase 7 Event-Bus Groundwork

Status: active

Date: 2026-06-30  
Build home: [`../../../mvp-build/`](../../../mvp-build/)  
Plan source: [`../phase-6-and-event-bus-session-handoff.md`](../phase-6-and-event-bus-session-handoff.md)  
Workspace map used: [`../../../CODEGRAPH.md`](../../../CODEGRAPH.md)

## Current State

This pass keeps the working Phase 3-5 provider paths intact and adds production hardening seams around them:

- **Phase 5 closure source work:** gated work-event cards now bind to real `approvals` rows, `dispatch_daily_briefs` emits stored `[SILENT]` daily brief events, and `scheduler:tick` drives reminders, Gmail watch renewal, and daily briefs as the dev/cron fallback for Hermes Jobs.
- **Phase 6 pilot hardening:** additive migration `0007_phase6_repair_and_jobs.sql` adds repair queue, source suppression, event batches, Hermes job-run proof, and event trace fields. New Manager repair tools cover Gmail history replay, Stripe event replay, email-thread relink, duplicate marking, employee-event redelivery, noisy-source suppression, and Stripe onboarding-link regeneration.
- **Security/ops:** audit details are redacted structurally for token/signature/raw-body keys and known provider secret patterns. Unit coverage asserts redaction.
- **Runtime containment/runbook:** `infra/hermes/RUNBOOK.md` now names `local` as demo/dev only, `docker` as first-pilot default, and `ssh`/`vm` as later stronger isolation.
- **Phase 7 event-bus groundwork:** a generic event-source registry is present for `gmail`, `stripe`, `twilio`, and `manager`; `deliverEmployeeEvent` supports `deliver_only` vs `wake_employee`; `runtime.ts` has a structured Hermes event call returning a validated `WorkEventDescriptor`; source suppression, triage, repair routing, and batching seams exist.
- **Live Work Surface seam:** `/api/employee/[employeeId]/events` exposes an SSE-shaped snapshot stream; the Work Surface consumes it while keeping polling as fallback.

Local verification passed on 2026-06-30:

```text
npm run typecheck   # all workspaces clean
npm run test:unit   # 22 files / 110 tests pass
npm run build       # all workspaces + next build pass
npm run lint        # clean
npm run test:integration   # RLS suite present; SKIPS cleanly with no live Supabase creds
```

## Provider/Runtime Acceptance

No live provider proof was collected in this environment because these env vars are absent:

- `DATABASE_URL`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `HERMES_API_TOKEN`

Therefore migration application and provider acceptance remain **PENDING**. Do not mark accepted without real proof ids:

| Capability | Env vars | Proof ids to capture |
|---|---|---|
| Apply migrations `0001`-`0007` | `DATABASE_URL` | migration status showing all seven applied |
| RLS cross-account denial | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | denied owner-A/account-B read + service-role read-both assertions |
| Gmail OAuth/send/reply/replay | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `GMAIL_PUBSUB_TOPIC`, `PUBSUB_*` | sealed token ref, profile email, watch `historyId`/expiration, Gmail message/thread ids, Pub/Sub message id, replay result |
| Twilio owner delivery | `TWILIO_*`, `EMPLOYEE_SMS_FROM` or `TWILIO_MESSAGING_SERVICE_SID` | outbound `MessageSid` |
| Stripe Connect/invoice/webhook/replay | `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_CONNECT_CLIENT_ID`, `STRIPE_WEBHOOK_SECRET` | account id, account-link id/url, invoice id/url, signed webhook event id, replayed event id |
| Hermes Jobs/runtime containment | `MANAGER_BASE_URL`, `MANAGER_INTERNAL_TOKEN`, `HERMES_API_TOKEN`, `HERMES_EVENT_PATH`, `HERMES_BACKEND_TYPE=docker` for pilots | job run proof, runtime health, validated descriptor from `wake_employee` |

## Next Implementation Inherits

1. Apply migrations `0001`-`0007` with `DATABASE_URL` and record status.
2. Configure Hermes Jobs to call `dispatch_due_reminders`, `renew_expiring_watches`, and `dispatch_daily_briefs`; keep `scheduler:tick` for local fallback.
3. Replace the current SSE snapshot seam with live Hermes Sessions/Runs events once a live Hermes runtime is available.
4. Keep provider acceptance honest: local unit tests prove logic, not provider rails.
