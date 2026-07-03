# Phase 1 — Live Provider & Runtime Acceptance (gate)

Status: pending

## Goal / Module

Prove the source-wired Phase 0 loop against **real providers and a real runtime host**. This phase
adds little code; it is the **acceptance gate** that turns `source-wired` into `provider-accepted` /
`runtime-accepted`. Until it passes, the product is not live and most operating-layer phases should
not be declared accepted on top of an unproven loop.

## Depends on

- Phase 0 (source-wired loop).
- Live credentials/host: Supabase, Twilio, Hermes/runtime, Google/Gmail/PubSub, Stripe test mode,
  LLM front-door key. Full env list and per-run proof ids are in the detailed runbook:
  [`../03-provider-runtime-acceptance-plan.md`](../03-provider-runtime-acceptance-plan.md).

## Surface (code + schema)

No new schema. The deliverable is **captured proof** plus the **acceptance harness** that executes
and verifies the runs.

**Acceptance harness — built (`source-wired`, locally verified 2026-06-30):**

- `npm run acceptance:preflight` — runnable/blocked matrix for the 8 runs (`infra/scripts/acceptance/preflight.mjs`).
- `infra/scripts/acceptance/run1-db-rls.mjs` … `run8-security.mjs` — per-run proof verifiers (assert doc-03 proof ids; `run8` is a live forged-request probe).
- `npm run acceptance:report` — runs all 8, writes `infra/acceptance/reports/phase01-<ts>.json|md`, marks pass/fail/not-run (never a fabricated pass).
- Ops scripts: `npm run ops:number-pool` / `ops:healthcheck` / `ops:repair`.
- `tests/unit/forged-requests.test.ts` (always-on §8 boundary) + `tests/integration/security-live.test.ts` (env-gated).
- Runbooks: `tests/golden-path/step1..7*.md`.

See the record: [`../../implementation-records/2026-06-30-phase-01-acceptance-harness-record.md`](../../implementation-records/2026-06-30-phase-01-acceptance-harness-record.md).

## Build tasks (acceptance runs)

Execute runbook §1–§8 in [`../03-provider-runtime-acceptance-plan.md`](../03-provider-runtime-acceptance-plan.md):

1. **DB & RLS** — apply `0001`–`0007`; owner A denied account B; service role reads both.
2. **Account/claim/provisioning** — verify phone, create account, provision employee, first SMS.
3. **Estimate artifact** — produce PDF, open signed link, audit `artifact:access`.
4. **Gmail send & reply** — connect, approved send, real customer reply via Pub/Sub/history → notify.
5. **Stripe Connect deposit** — connect test account, approved deposit invoice, verified webhook.
6. **Reminder & scheduler** — confirmed reminder, `dispatch_due_reminders`, watch renewal, daily brief.
7. **Repair & event bus** — replay Gmail/Stripe, suppress a source, redeliver, exercise both route flags.
8. **Security** — forged Twilio/Stripe/PubSub/session/artifact-token/cross-account all denied, no secret logs.

## Acceptance proof

Every MVP loop step has **real provider/runtime proof ids** (Twilio SID, Gmail message/thread/history
ids, Pub/Sub message id, Stripe account/invoice/webhook ids, Supabase storage/signed-URL evidence,
migration status, RLS denial proof, Hermes runtime/job proof) **and** all forged-request security
checks pass with no raw secrets in logs/audit.

## Seam handed forward

A live environment + captured env var set + a runtime host the later phases assume exists. Phases 2,
3, 6, and 9 can start in parallel once Phase 1's environment is standing.

## Status

Harness: `source-wired` (built + locally verified). Gate: `pending` — blocked on live credentials/
host; no provider proof ids captured yet. Do not fake acceptance; manually injected provider results
are not acceptance.
