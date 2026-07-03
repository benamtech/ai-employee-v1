# Reconciled Scope And Status

Status: active

## Product Scope

The MVP is the smallest real office loop for a contractor:

1. owner signs up or claims an employee over web/SMS;
2. owner verifies phone and creates an AMTECH account;
3. Manager provisions a real employee profile/runtime route;
4. owner uses SMS/web to ask for an estimate;
5. employee creates a real PDF estimate artifact and signed link;
6. owner approves Gmail send;
7. Gmail sends the PDF from the connected mailbox;
8. a real customer reply enters through Gmail Pub/Sub/history;
9. employee/Manager notifies the owner and proposes next action;
10. owner approves a Stripe Connect test-mode deposit invoice;
11. Stripe sends a real hosted invoice/payment link and webhook events are recorded;
12. employee records and fires an internal job reminder.

## Current Source Status

| Area | Source state | Local proof | Live/provider acceptance |
|---|---|---|---|
| Monorepo/build | wired | typecheck/build/lint pass | n/a |
| Unit tests | wired | 25 files / 124 tests pass | n/a |
| Supabase migrations | `0001`-`0007` present | migration runner present | pending `DATABASE_URL` |
| RLS cross-account test | env-gated integration test present | skips cleanly without creds | pending live Supabase |
| Front door/onboarding | web/SMS/account/provisioning source wired | unit/build proof | pending live Twilio/Supabase/Hermes |
| Provisioning/runtime | HTTP provisioner, profile package render, Caddy/Twilio/runtime hooks | source/build proof | pending live host/Hermes/Twilio |
| Estimate artifact/approval | Manager artifact tools, storage refs, signed routes, approval UI | unit/build proof | pending live Supabase Storage |
| Gmail send/reply | OAuth/send/watch/history/PubSub/reply normalization source wired | unit proof | pending live Google/PubSub |
| Stripe deposit | Connect/account-link/invoice/webhook source wired | unit proof | pending live Stripe test mode |
| Reminder loop | set/dispatch reminders, scheduler tick, watch renewal | unit proof | pending live Manager/Twilio/Gmail |
| Work Surface | descriptor-driven surface, job folders, receipts, SSE-shaped stream | unit/build proof | pending live runtime stream |
| Repair/event hardening | repair tools, suppressions, batches, generic source registry seams | unit/build proof | pending live replay proof |
| Admin system | designed | docs only | planned — [Phases 9-10](phases/README.md) |
| Metering | designed | docs only/current `usage_events` seam | planned — [Phases 6-8](phases/README.md) |

## Current Acceptance Gap

The code is source-complete for the original whole-product loop plus production seams. It is not business-accepted until the live environment proves:

- Supabase migrations and RLS denial;
- Twilio verification/SMS/webhooks;
- Hermes runtime reachability/job proof;
- Gmail OAuth/send/watch/reply;
- Stripe Connect/invoice/webhook;
- signed artifact storage route;
- scheduler/reminder firing;
- no-secret logging under provider traffic.

## What Is Now In Scope

The build plan now includes the operating layer needed to sell and manage the product. It is sequenced as the **next-era phase plan in [`phases/`](phases/)** (Phase 0 baseline + Phases 1-13):

- live provider/runtime acceptance ([Phase 1](phases/phase-01-provider-runtime-acceptance.md));
- runtime/scheduler productionization ([Phase 2](phases/phase-02-runtime-scheduler-productionization.md));
- event-bus and Work Surface completion ([Phases 3-5](phases/README.md));
- production metering ledgers, instrumentation, rollups/budgets ([Phases 6-8](phases/README.md));
- operator admin panel, account space, provisioning, provider/runtime health ([Phases 9-10](phases/README.md));
- AMTECH subscription billing scaffold ([Phase 11](phases/phase-11-amtech-billing-scaffold.md));
- LLM provider registry and model routes ([Phase 12](phases/phase-12-llm-provider-registry.md));
- operations queues/incidents/diagnostic bundles for up to roughly 1000 users ([Phase 13](phases/phase-13-1000-user-operations.md)).

These are not required to demo the original loop, but they are required before AMTECH can manage paid pilots safely.
