# Handoff — Phase 0–4 Loose Ends + Phase 5 + Work Surface

Created: 2026-06-29 03:51 EDT
For: a brand-new session that will START IN PLAN MODE. Produce a plan first; do not edit code until the plan is approved.
Paste the "PROMPT" block below into the new session.

---

## PROMPT

You are the implementation agent for the AMTECH AI Employee MVP at `/home/georgej/AMTECH/GTM-RESEARCH`. You are in **plan mode**: explore, then write a decision-complete plan and call ExitPlanMode. Do not start coding until the plan is approved.

Mission: **tie up every loose end across Phase 0–4 and do the serious Phase 5 work**, while elevating the **Work Surface** so a non-technical owner feels a trusted coworker — not a dashboard. Build "as if we have all provider creds": implement real provider paths, never fake provider proof, and record any acceptance that needs a live env honestly as pending.

### Read first (in order)
1. `identity.md` — embody it (Ogilvy · Paul Graham · psycho-cybernetics · AMTECH spirit). Required.
2. `CODEGRAPH.md` — map + canonical facts + invariants.
3. `wiki/MVP/old-build-plan/` — the whole-product source of truth (esp. `01` milestones, `04` manager-tools, `08` Gmail, `09` event-mesh, `10` security, `12` tests, `15` Work Surface).
4. `wiki/MVP/phase-3-generative-ui-reframe.md` — the typed `WorkEventDescriptor` contract; surfaces render known components from descriptors, not raw payloads.
5. `wiki/MVP/implementation-records/2026-06-29-phase-0-2-record.md` then `…/2026-06-29-phase-3-partial-record.md` — current code truth.
6. `mvp-build/README.md`, then inspect actual code (do not trust memory): `packages/shared/src/{work-events,tool-contracts,event-types,ids}.ts`; `apps/manager/src/lib/{google-gmail,gmail-tokens,mime,pubsub,employee-events,stripe-signature,twilio,runtime}.ts`; `apps/manager/src/tools/{gmail,stripe,events,estimate}.stub.ts`; `apps/manager/src/webhooks/{gmail,stripe}.ts`; `apps/web/app/agent/[employeeId]/AgentClient.tsx`; `packages/db/migrations/`; `tests/`.

### Current state (verify, don't assume)
- Phase 0–2 wired. Phase 3 (Gmail + work-events) and Phase 4 (Stripe test-mode Connect/account-link/deposit-invoice/send/webhook) are **source-complete and locally green** (last record: 17 test files / 79 tests pass) but **not provider-accepted**.
- `stripe.stub.ts` now *implements* the Stripe tools (no longer honest stubs). `WorkEventDescriptor` drives notify/question/review + typed deliverables (`outbound_message`, `money_movement`, `job_folder`, …) with a conformance gate (customer/money deliverables require approve/respond).
- Local checks to run first to confirm the baseline: from `mvp-build/` → `npm run typecheck && npm run test:unit && npm run build && npm run lint`.

### Loose ends to close (Phase 0–4)
- **RLS test still a skeleton** (`tests/integration/rls-cross-account.test.ts` is `it.todo`). Make it a real, env-gated integration test with exact setup (accounts A/B, anon client denied B, service-role reads both).
- **Golden paths incomplete**: only `step1`/`step2` exist. Add executable/precise `step3` (Gmail connect→test→draft→approve→send→reply event), `step4` (Stripe Connect→deposit invoice→send→webhook), `step5` (reply/paid→reminder), each oriented to **real provider proof ids**.
- **Env-name reconciliation**: `pubsub.ts` reads `PUBSUB_VERIFICATION_AUDIENCE` / `PUBSUB_SERVICE_ACCOUNT_EMAIL`, but `.env.example` lists `GMAIL_PUBSUB_VERIFICATION_TOKEN`. Reconcile names across code + `.env.example` + records so Pub/Sub auth actually configures.
- **Missing pure-fn test**: add a `stripe-webhook` test for `recordAndProcessStripeEvent` (dedupe, livemode handling, normalize→deliver) using the fake-Supabase + fetch-mock helpers in `tests/unit/_helpers/`.
- **Provider acceptance (env-gated, do not fake)**: apply `0005_phase3_gmail.sql`; live Gmail OAuth→connector test→approved send (Gmail message/thread/history ids); real Pub/Sub reply→normalized event; Twilio `MessageSid` for owner notify; Stripe test-mode connected-account/account-link/invoice/hosted-URL/signed-webhook ids. Record each as pending with exact env vars + proof ids if no live env.

### Phase 5 — the serious work (close the loop)
- **Wire the loop end**: customer reply (`gmail.reply_received`) and `stripe.invoice_paid` → owner approves → **`set_internal_reminder`** creating the `job_commitments` + `reminders` rows. This is the final MVP step (build-plan `01`/`12`).
- **Scheduled firing + renewal seam**: reminders must fire SMS at `scheduled_at` (Twilio proof), and Gmail `watch` must auto-renew before expiry + history fallback — via a clear Manager/Hermes Jobs or cron seam (not ad hoc). Name the seam even if the scheduler itself is a thin first cut.
- **Surface it**: `get_reminders` + job_commitments render on the Work Surface as a grouped **job folder**; SMS stays the default important-event channel. Google Calendar remains an offer/fast-follow, not required.

### Work Surface / UX (the product vision — hold it, build toward it)
The Work Surface is the "Macintosh moment": render Hermes's developer event stream into a coworker a non-technical owner **trusts and enjoys**. Setup must be *easier than raw Hermes* and maximally productive — within ~30 min of an account the owner gets a real, valuable answer/output with no API keys or code. Materialized surfaces + positive feedback loops (the owner, and anyone who sees the output, feels the value). Be the **no-brainer single integration**: fastest turnaround to "everything's handled," to making more money without hiring, to the best employee keeping up when the owner 2x's estimates and adds deposit invoicing.
- Elevate `AgentClient.tsx` from utilitarian to descriptor-driven coworker cards (notify/question/review), richer job-folder grouping, and a clean iterative-feedback loop ("no, tweak this, <repeat>"). Keep all rendering driven by `WorkEventDescriptor` — no raw payloads, no raw Hermes dashboards.
- Pro-human framing only: time back, more money, augment never replace.

### Wiki realignment (continue what's in progress)
The brain is being realigned so short- and long-term strategy match the current product + Work Surface vision (README → GTM surface; 4-year plan treated as active; `00-decision.md` losing the stale three-rung wording). Finish aligning the decision/offer/strategy docs to the current surface; **propagate per CODEGRAPH §3 canonical facts + §7 invariants** (no superseded/archaeology content — rewrite or delete). Then update: the implementation record, `CODEGRAPH.md` status lines, and `mvp-build/README.md`. **Do not rewrite `wiki/MVP/old-build-plan/*` unless explicitly asked** — it is the product source of truth; current facts go in implementation-records.

### Guardrails
- No external send / money movement / customer-visible action without a **resolved owner approval**. Descriptor conformance gate must hold.
- Secrets by reference (`sealSecret`/`openSecret`); never log raw tokens/refresh tokens/API keys/webhook secrets/full email or payment bodies.
- Provider HTTP via `fetch` (match `twilio.ts`/`google-gmail.ts`); avoid new heavy SDK deps unless justified.
- Manager is the backend control plane; the owner only ever talks to the employee. Keep onboarding OpenAI-compatible (no hardwired model provider).
- Manager test mode for Stripe; manually injected provider results are **not** acceptance.

### Plan must include
Phased task list (0–2 cleanup → 3/4 acceptance + loose ends → 5 loop/scheduler → Work Surface UX → wiki/codegraph propagation); files to touch; reuse of existing libs/helpers (`tests/unit/_helpers/`, `employee-events.deliverEmployeeEvent`, `work-events` validators); pass/fail criteria per capability; exact provider env vars + proof ids for anything env-gated; and the wiki/CODEGRAPH/record update points. Validate after meaningful changes with `typecheck`/`test:unit`/`build`/`lint`; run db/migration/smoke only if env exists, else report exact missing vars.

### Final response must
Summarize by phase; list files changed; list validation commands + outcomes; list provider acceptance still pending with exact env vars/proof ids; name any tests not run and why; confirm build-plan docs untouched; point to the updated implementation record + CODEGRAPH lines.

---

## Maintainer notes (not part of the prompt)
- This handoff supersedes the older `phase-3-*-session-handoff.md` files for scope; keep them only if still useful, else prune (living-brain rule).
- The anecdote driving the Work Surface vision: non-technical owners (e.g., a Shopify stuffed-animal shop, or making cat memes with voice/video gen) get immediate, fun, money-relevant value through an iterative "tweak it, repeat" loop with zero code/API keys. AMTECH must deliver that ease + materialized-surface delight by default, across surfaces — the no-brainer central integration every SMB will soon want.
