# Implementation Record — Phase 0–4 Loose Ends + Phase 5 Close-the-Loop + Work Surface Redesign

Status: active

Date: 2026-06-29  
Build home: [`../../../mvp-build/`](../../../mvp-build/)  
Plan source: [`../old-build-plan/`](../old-build-plan/)  
Workspace map used: [`../../../CODEGRAPH.md`](../../../CODEGRAPH.md)  
Supersedes the "pending Phase 5 / utilitarian web UI" notes in [`2026-06-29-phase-3-partial-record.md`](2026-06-29-phase-3-partial-record.md).

## Current State

This pass closed the remaining Phase 0–4 loose ends, implemented the genuine Phase 5 "close-the-loop"
job-reminder step **and its previously-missing firing/renewal seam**, and rebuilt the owner Work Surface
into a descriptor-driven coworker surface. All local checks pass; live provider/runtime acceptance is still
**pending** (recorded below, never faked).

Local verification passed on 2026-06-29:

```text
npm run typecheck   # all workspaces clean
npm run test:unit   # 20 files / 99 tests pass
npm run build       # all workspaces + next build pass
npm run lint        # clean
npm run test:integration   # RLS suite present; SKIPS cleanly with no live Supabase creds
```

`npm run test:unit` previously reported 17 files / 79 tests; it now reports **20 files / 99 tests**
(+`stripe-webhook`, +`reminders`, +`group-by-job`).

## Phase 0–4 loose ends closed

- **Pub/Sub env reconciliation.** `apps/manager/src/lib/pubsub.ts` verifies authenticated push with
  OIDC (`PUBSUB_VERIFICATION_AUDIENCE`, `PUBSUB_SERVICE_ACCOUNT_EMAIL`, `PUBSUB_REQUIRE_AUTH`,
  optional `PUBSUB_JWKS_URL`), but `.env.example` only listed the unused shared-secret
  `GMAIL_PUBSUB_VERIFICATION_TOKEN`. Decision: **keep the secure OIDC path** (matches build-plan `10`);
  `.env.example` now documents the `PUBSUB_*` names and `PUBSUB_REQUIRE_AUTH=true`.
- **Stripe webhook unit coverage.** New [`tests/unit/stripe-webhook.test.ts`](../../../mvp-build/tests/unit/stripe-webhook.test.ts)
  exercises `recordAndProcessStripeEvent`: dedupe, livemode persistence, `invoice.paid` normalize→deliver,
  `invoice.sent`/unknown handling — using the fake-Supabase helper (no network).
- **Real RLS integration test.** [`tests/integration/rls-cross-account.test.ts`](../../../mvp-build/tests/integration/rls-cross-account.test.ts)
  is now a real, env-gated test (two accounts/owners, owner-A auth client denied account B, service-role reads
  both), run via a new `npm run test:integration` (`vitest.integration.config.ts`). It skips cleanly without
  live creds; it never passes by mocking the DB.
- **Golden paths step3/4/5** added as markdown runbooks (matching step1/step2), each oriented to real provider
  proof ids: Gmail reply loop, Stripe deposit, and reply/paid→reminder firing.
- **Latent schema bug fixed.** `job_commitments` was in the `0002_rls.sql` owner-scoped RLS list (keyed on
  `account_id`) but `0001_init.sql` never gave it an `account_id` column — `db:migrate` would have failed at
  the 0002 policy on a fresh DB. Since 0001 is unapplied, `account_id` was added to `job_commitments` in
  `0001_init.sql` and is now set by `set_internal_reminder`.

## Phase 5 — close the loop + scheduler seam

- **Owner-confirmed reminders.** `set_internal_reminder` (`apps/manager/src/tools/events.stub.ts`) now accepts
  an optional `approval_id` (gated on a resolved `set_job_reminder` approval) and an employee-written
  `message`; a new additive migration
  [`0006_phase5_reminders.sql`](../../../mvp-build/packages/db/migrations/0006_phase5_reminders.sql) adds
  `reminders.message/sent_at/provider_id/last_error` and a due-scan index. The reminder/`job_commitment`
  rows already existed; this closes the build-plan `04` `set_internal_reminder(... message ...)` signature gap.
- **Reminder firing — `dispatch_due_reminders`** (new Manager tool, Phase 5). Selects `scheduled` reminders
  whose `scheduled_at <= now`, sends each via the shared `deliverEmployeeEvent` primitive (SMS default +
  Work Surface card + audit + Twilio `MessageSid` proof), and flips the row out of `scheduled` exactly once.
  Idempotent at two layers (status transition + delivery idempotency key).
- **Watch renewal — `renew_expiring_watches`** (new Manager tool, Phase 5). Sweeps `gmail_watches` expiring
  within a window (default 24h) and renews via the existing `startOrRenewWatch` (with history-fallback).
- **Scheduler seam (thin first cut).** The Manager fires nothing itself; it exposes the two endpoints above.
  In production the **Hermes runtime's cron (its default cron folder, external to this repo)** drives them on
  a schedule; [`infra/scripts/scheduler-tick.mjs`](../../../mvp-build/infra/scripts/scheduler-tick.mjs)
  (`npm run scheduler:tick`) is the dev/local driver and documented cron entry.
- **Loop wiring.** The Stripe `invoice.paid` and Gmail `reply_received` paths already emit descriptors whose
  next action is "set a reminder"; `packages/agent-template` (`AGENTS.md`, `manager-tools.md`) now instructs
  the close-the-loop sequence (confirm → `set_internal_reminder` with `job` + `message`). The `/resources`
  route returns `job_commitments` so the surface groups reminders into job folders.

## Work Surface redesign (descriptor-driven; no new deps)

`apps/web/app/agent/[employeeId]/AgentClient.tsx` was rebuilt from a flat list into a composed coworker
surface, all rendering driven by `WorkEventDescriptor`/Manager records:

- `surface.tokens.ts` (design tokens), `surface-types.ts` (row + `JobFolder` shapes).
- `lib/group-by-job.ts` — pure, unit-tested join of estimate→reply→deposit→reminder by estimate artifact id.
- `components/DailyBrief.tsx` (one-glance brief), `components/JobFolder.tsx` (the job timeline with status
  chips), `components/WorkCard.tsx` (notify/question/review cards + inline "no, tweak this" feedback loop),
  `components/ApprovalCard.tsx` (the binding approve/reject gate), `components/Receipt.tsx` (quiet proof),
  `components/deliverables/index.tsx` (one renderer per `DeliverableType` ×11, safe generic fallback).
- Accessible-to-the-painter: no tool names, tokens, JSON, or raw payloads; gated deliverables always show the
  approval path; pro-human copy (evenings back, deposits collected).

## Not Provider-Accepted Yet (run with creds, else PENDING)

Apply migrations first (`npm run db:migrate`, needs `DATABASE_URL`): confirm `0001`–`0006`.

| Capability | Env vars | Proof ids to capture |
|---|---|---|
| RLS cross-account denial | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | A-denied + service-role-reads-both assertions pass |
| Gmail OAuth + connector test | `GOOGLE_OAUTH_CLIENT_ID/_SECRET/_REDIRECT_URI` (or `MANAGER_API_ORIGIN`), `GMAIL_PUBSUB_TOPIC` | sealed `token_secret_ref`, profile email, `watch.historyId`, `expiration` |
| Approved Gmail send (PDF) | above + owner approval | Gmail `message.id`, `thread.id`, `historyId` |
| Real Pub/Sub reply → event | `PUBSUB_VERIFICATION_AUDIENCE`, `PUBSUB_SERVICE_ACCOUNT_EMAIL`, `PUBSUB_REQUIRE_AUTH=true` | Pub/Sub `messageId`, normalized `gmail.reply_received`, dedupe key |
| Owner SMS notify + reminder fire | `TWILIO_*`, `EMPLOYEE_SMS_FROM` or `TWILIO_MESSAGING_SERVICE_SID` | Twilio `MessageSid`; reminder `scheduled`→`sent` |
| Stripe Connect test mode | `STRIPE_SECRET_KEY=sk_test_…`, `STRIPE_CONNECT_CLIENT_ID` | connected `account` id, `account_link.url`, status |
| Stripe deposit invoice + webhook | + `STRIPE_WEBHOOK_SECRET=whsec_…` | `invoice.id`, `hosted_invoice_url`, signed `invoice.sent`/`invoice.paid` `event.id` |
| Scheduler tick end-to-end | running Manager + `MANAGER_INTERNAL_TOKEN`, `MANAGER_BASE_URL` | `dispatch_due_reminders` fired count + Twilio SID; `renew_expiring_watches` renewed count |

## Next Implementation Inherits

1. Collect the live provider proof ids above (the MVP is provider-accepted only once these exist).
2. Optionally promote the scheduler from the thin tick to a managed Hermes Job with backoff/alerting.
3. Voice surface + owner-configurable repeatable tasks remain later-phase (build-plan `15` §8 "Later").
4. Google Calendar stays an offer/fast-follow; internal reminders already satisfy the MVP bar without it.
