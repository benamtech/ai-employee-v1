# Handoff — Phase 5 loose ends · Phase 6 pilot hardening · Phase 7 (event bus) groundwork

Status: active · Date: 2026-06-29

Copy-ready prompt for the next implementation session. **Start in plan mode**; produce a decision-complete plan
grounded in files actually read, then `ExitPlanMode`. The headline: **close the production gaps before new features.**
Many of the §3 gaps below are exactly what separates a chat box from a coworker that is *ChatGPT-superior out of the
box* — they are the priority.

---

## PROMPT

You are the implementation agent for the AMTECH AI Employee MVP at `/home/georgej/AMTECH/GTM-RESEARCH`. Embody
`identity.md`. Build "as if we have all provider creds": implement real provider paths, never fake provider proof,
record anything needing a live env as pending with exact env vars + proof ids.

### Read first (in order)
1. `identity.md`, then `CODEGRAPH.md` (map + canonical facts + invariants).
2. `wiki/MVP/event-driven-office-and-generative-ui.md` — **the controlling forward design.** Internalize **§3 (the
   honest gaps)**, §5 (the frontier F1–F8), and §7 (the call list). This is the production bar.
3. `wiki/MVP/implementation-records/2026-06-29-phase-5-and-work-surface-record.md` — current code state + the
   provider-acceptance-pending table.
4. `wiki/MVP/old-build-plan/{01,09,10,14}.md` — milestones, event mesh (`deliver_only` vs wake-the-employee, line 65),
   security/ops + repair commands, agentic-tooling/efficiency (§A call shapes, §E event→meaning pipeline).
5. Then inspect the actual code (don't trust memory): `apps/manager/src/lib/employee-events.ts`,
   `apps/manager/src/webhooks/{gmail,stripe,twilio}.ts`, `apps/manager/src/tools/{events,gmail,stripe}.stub.ts`,
   `apps/manager/src/lib/runtime.ts`, `infra/scripts/scheduler-tick.mjs`,
   `apps/web/app/agent/[employeeId]/` (the Work Surface), `packages/db/migrations/`.

### Baseline to confirm first
From `mvp-build/`: `npm run typecheck && npm run test:unit && npm run build && npm run lint` (expect 20 files / 99
unit tests green). `npm run test:integration` skips cleanly without Supabase creds.

### Part A — Phase 5 loose ends
- **Provider acceptance.** Apply migrations `0001`–`0006` (`npm run db:migrate`, needs `DATABASE_URL`), then collect
  the live proof ids in the phase-5 record's pending table (RLS, Gmail OAuth/send/reply, Twilio `MessageSid`, Stripe
  test-mode connect/invoice/webhook, scheduler tick). Record each honestly; manually injected results are not acceptance.
- **Promote the scheduler to Hermes Jobs** (build-plan 14, Phase-5 note): Jobs is the runner, the `reminders` table
  stays source of truth. Keep `scheduler:tick` as the dev/cron fallback. Name the seam even if the first cut is thin.
- **Binding approve/reject on work cards.** Today the surface's one-tap gate only works on real `approvals` rows; a
  gated work-event card offers "reply/tweak." Wire gated descriptors to create/resolve the real approval so the card's
  Approve/Reject is binding (still one acceptance primitive).
- **Daily brief → real `[SILENT]`-gated digest** (build-plan 15 §4b): currently client-computed; back it with a
  scheduled job.

### Part B — Phase 6 pilot hardening (build-plan M6 / docs 01, 10, 09 §Repair)
- **Repair command surface:** webhook **replay-by-event-id** (Stripe + Gmail history range), relink thread to
  estimate, mark duplicate, redeliver employee event, suppress noisy source, regenerate Stripe onboarding link
  (watch renewal already exists via `renew_expiring_watches`).
- **Runtime containment** path for first pilots; **operator runbook**.
- **Security acceptance tests:** forged `X-Twilio-Signature` / `Stripe-Signature` / CSRF all fail; **no raw
  tokens/bodies/secrets in logs** (assert). OAuth-state + token-by-reference already in place — add the tests.

### Part C — Phase 7 groundwork: close the §3 gaps (the production / ChatGPT-superior keystone)
These are the most important items for production and for being a coworker instead of a chat box. Lay the seams now,
even if the full build spans Phase 7+. Source: `event-driven-office-and-generative-ui.md` §5 F1–F2 + §7 calls 1–4.
- **Generic event-source ingress + registry (F1 backend):** a uniform path where each source supplies a verifier + a
  normalizer (replace the two bespoke Gmail/Stripe pipelines), with dedupe, an event trace, and a **repair queue** for
  unknown mappings. Adding a system becomes "register a source," not a new pipeline — this is what lets the whole
  office run through the employee.
- **Message-to-agent (wake-the-employee) fork (F1 core):** in `deliverEmployeeEvent`, keep `deliver_only` for trusted
  literals, but for events needing judgment, hand a compact structured payload to the Hermes runtime
  (`lib/runtime.ts` seam → a Run/Session), let the **employee** reason against the brain and **emit the
  `WorkEventDescriptor` itself** (and propose the gated next action). Today the Manager hand-authors descriptors for 3
  flows; this is the move to agent-authored, the real generative-UI step.
- **Triage tier + account-layer batching (F5):** a cheap tier (rules / `claude-haiku-4-5`) decides notify/batch/ignore;
  collapse bursts (10/min → one digest); spend the big model only at the point of human meaning.
- **Live Hermes→Work SSE adapter (F2):** consume Hermes Sessions `/chat/stream` / Runs SSE and move the Work Surface
  off the polled `/resources` snapshot to a live stream → **"doing it now"**, mid-task previews, real-time approval
  cards. AG-UI-shaped vocabulary so surfaces stay thin renderers.

### Guardrails (do not move)
Gate is a property of the deliverable **type**, enforced structurally; money/customer actions never graduate past a
one-line confirm. `deliver_only` only for trusted literals. Structured payloads on internal hops, plain English only at
the owner edge. Secrets by reference; safe summaries only (no raw email/payment bodies). The owner only ever talks to
**one** employee. Conformance over novelty (no open-ended UI). Stripe test mode; never fake provider proof.

### Validate + update
Run `typecheck`/`test:unit`/`build`/`lint` after meaningful changes; `test:integration` / `db:migrate` /
`scheduler:tick` / provider proof only if env exists, else report exact missing vars. Update the **implementation
record**, `CODEGRAPH.md` status lines, and `mvp-build/README.md`. **Do not rewrite `wiki/MVP/old-build-plan/*`** unless
explicitly asked — current facts go in implementation records; `event-driven-office-and-generative-ui.md` carries the
forward sequencing.

### Plan must include
Phased task list (A loose ends → B hardening → C event-bus groundwork); files to touch; reuse of existing primitives
(`deliverEmployeeEvent`, the approval primitive, `WorkEventDescriptor` + `validateWorkEventDescriptor`, `runtime.ts`,
`tests/unit/_helpers/`); pass/fail per capability; exact provider env vars + proof ids for env-gated work; and the
wiki/CODEGRAPH/record update points.
