# Handoff — Full architecture audit: Hermes boundary, event bus, Work Surface, admin (no code changes)

Date: 2026-07-03 12:11
Status: audit/understanding session; no code changed; tree clean at `bf9d0fb`.
Scope: verified-against-source readout of the three critical systems (event bus, generative task/artifact rendering, admin) plus the Hermes connection and the channel/session/presence gap, ahead of Phase 3/3A/4 implementation.

## What was found (file-referenced)

### Hermes boundary — the load-bearing gap
- The entire Hermes client is `apps/manager/src/lib/runtime.ts`: `deliverToRuntime()` POSTs
  `{input, channel}` to `HERMES_MESSAGE_PATH` (default `/messages`); `wakeEmployeeForEvent()` POSTs
  `{kind:"amtech.employee_event", payload, response_schema:"WorkEventDescriptor"}` to
  `HERMES_EVENT_PATH` (default `/events/work`). **Neither path is a native Hermes endpoint.** Per
  `wiki/MVP/hermes-run-session-semantics-research.md`, the native surface is `/api/sessions/{id}/chat`
  (one synchronous turn), `/chat/stream` (SSE over that turn), and the Runs API. The code assumes a
  Hermes-side adapter that does not exist in this repo. This is the single biggest blocker to live
  end-to-end testing.
- No AMTECH code consumes Hermes's own event stream (Runs/SSE/tool progress) anywhere; grep confirms.
  `config.yaml` even sets `ui.tool_progress: off`.
- Scheduler: all four jobs run inside the Manager (`scheduler-runner.ts`); `hermes-jobs-runner.mjs`
  is only an external trigger that stamps `runner_type`/`external_job_id` into `hermes_job_runs`.
  Native Hermes Jobs semantics (fresh session per job, mirror-to-origin delivery) are unused.
- Provisioning renders `packages/agent-template/` into `HERMES_HOME/profiles/client_<id>/` with token
  substitution, writes a Caddy snippet, sets the Twilio webhook, and runs the opaque
  `HERMES_RUNTIME_COMMAND`. Docker-per-employee is documented (RUNBOOK) but no code issues docker; the
  backend policy in `runtime-backend.ts` only labels it. Employee authenticates back to Manager tools
  with the shared `MANAGER_INTERNAL_TOKEN` (not per-employee credentials).
- Dev-mode auth soft spots: `HERMES_API_TOKEN` defaults to `""`; `denyInternal` skips token check
  outside production; `SMS_INSECURE_NO_SIGNATURE` bypass; Pub/Sub JWT verification is skipped when
  `PUBSUB_VERIFICATION_AUDIENCE` is unset (default-open) unless `PUBSUB_REQUIRE_AUTH=true`.

### Event bus (critical system 1)
- Real path today: webhook -> signature check -> per-source inline normalize -> `deliverEmployeeEvent`
  (`apps/manager/src/lib/employee-events.ts:132-329`) -> dedupe (app pre-check + migration `0010`
  unique `idempotency_key` backstop) -> `decideTriage` -> `inbound_events` row + `to_owner`
  `employee_messages` row -> env-gated direct SMS.
- Signature verification is source-wired and real for all three providers (Twilio HMAC-SHA1 on exact
  URL, Stripe raw-body HMAC-SHA256 with 300s tolerance + livemode guard, Pub/Sub OIDC JWT vs Google
  JWKS) — with the default-open Pub/Sub footgun above.
- **No importance engine.** `decideTriage` (`event-triage.ts:34-40`) is only: suppressed -> ignore;
  missing account -> repair; `triage_hint==="silent"` -> batch; else notify. The `WorkMove`
  (notify/question/review) is hardcoded by each caller (Stripe notify, Gmail question) and does not
  feed triage. Nothing decides "genuinely important" — that is Phase 3/4/5 work, not present.
- **Twilio inbound bypasses the rail entirely** (`webhooks/twilio.ts:102-164`): direct
  `employee_messages` insert + synchronous `deliverToRuntime` + reply. No `inbound_events`, no dedupe,
  no triage.
- `events/registry.ts` adapter framework is dead code beside the live path (only a test calls it);
  two divergent `NormalizedEvent` shapes exist (registry vs `shared/event-types.ts`).
- `stripe.invoice_sent` is normalized but never delivered. `event_batches` is write-only — no digest
  flush consumer exists.
- Delivery has **no presence/session check**; channel is `params.channel ?? "sms"`, always web card +
  best-effort SMS. The router seam is exactly `employee-events.ts:295-308`. Three divergent SMS
  "from" resolutions persist (employee-events env vars vs `twilio.ts` runtime number vs provisioner).

### Generative rendering (critical system 2)
- Rendering is genuinely generic: one `WorkEventDescriptor` grammar (`shared/work-events.ts` — moves
  notify/question/review, 11 deliverable types, acceptance grammar, structural gate rule,
  `renderWorkEventSms`) drives both SMS and web; `deliverables/index.tsx` switches only on
  `DeliverableType` with a safe-generic default. One acceptance primitive (`resolve_approval`)
  resolves from web and SMS against the same approvals row.
- **But every descriptor today is a TS literal authored by Manager code per source**
  (gmail.stub, stripe webhook/stub, events.stub, repair.stub). The LLM-authored path
  (`wake_employee` -> `wakeEmployeeForEvent` -> validated descriptor) is wired and validated but
  never invoked by any internal flow — `deliver_only` is the universal default.
- "SSE" route (`apps/web/.../events/route.ts`) sends one snapshot frame and closes; the client polls.
  No live stream, no reconnect.
- Domain leak: `JobFolder`/`group-by-job.ts`/`surface-types.ts` hardcode the estimate/deposit/reminder
  taxonomy (typed estimate/invoice/reminder arrays, "Estimate for ..." strings). The WorkCard path is
  clean; the folder/resources path is Phase-0-shaped.

### Admin (critical system 3)
- **No admin UI, no admin HTTP routes, no operator identity.** Everything in `docs/admin-system-*.md`
  is `planned`. What exists: CLI ops scripts (`ops:healthcheck` — the best end-to-end debug view,
  console-only; `ops:number-pool`; `ops:repair` with 12 audited tool-backed commands),
  `runtime-health.ts` snapshotter, and good observability tables (`audit_log`, `inbound_events`,
  `event_repair_queue`, `event_source_suppressions`, `event_batches`, `hermes_job_runs`,
  `runtime_health_checks`, `usage_events`, `feature_checks`) — all read via stdout/SQL behind one
  shared `MANAGER_INTERNAL_TOKEN`.
- Minimal useful step (admin plan Phase 1): a few admin-only read endpoints doing safe server-side
  joins over those tables; the healthcheck already computes per-employee status and discards it.

## Why this matters (the assessment)

The product docs' architecture (universal inbox -> event spine -> brain -> channel/session/presence
router) is coherent and the code has the right seams, but three truths gate live-testability:
1. The Manager<->Hermes contract is fictional until either an adapter exposes `/messages` +
   `/events/work` on the gateway, or `runtime.ts` is rewritten against native
   `/api/sessions/{id}/chat` (+ Runs for streaming). Decide this FIRST; Phases 3A/4/5 all build on it.
2. "Proactive teammate" does not exist yet: no importance policy, wake path unused, batching
   write-only, Twilio inbound off-rail. Phase 3 (promote registry to the real ingress; put Twilio
   inbound on it) + Phase 4 (first real `wake_employee` caller) are the shortest path.
3. Debugging live will be SQL-spelunking until the thin admin read layer exists; the tables are ready.

## Carry-forward / next (smallest moves to live-testable)

1. **Resolve the Hermes endpoint contract** (adapter vs native-API rewrite of `runtime.ts`). Verify
   against a locally-running hermes-agent; capture what `/api/sessions/{id}/chat` actually accepts.
2. Phase 1 live gate: real `.env` + host; run `acceptance:preflight`/`report` for provider proof ids.
3. Phase 3: make the registry the real ingress; route Twilio inbound through it; single sender
   identity per employee (dedicated number, locked decision).
4. Phase 3A minimal router at the `employee-events.ts:295-308` seam: `channel_sessions` +
   web-heartbeat/SMS-recency presence, active-session-wins, dedupe, `delivery_decisions` proof rows.
5. First real wake: pick one judgment event (Gmail reply) and route it `wake_employee` end-to-end.
6. Thin admin read endpoint(s) over existing tables (healthcheck JSON + repair queue + audit tail).
7. Fix quick incoherences when touching code: Pub/Sub default-open, `stripe.invoice_sent` dead branch,
   batch flush missing, three-way SMS-from divergence.

## Verification

- Read-only session: four parallel audit subagents (event bus, Work Surface, admin, Hermes boundary)
  plus direct reads of `runtime.ts`, `.env.example`, RUNBOOK, phase docs, agent-inbox architecture,
  Hermes semantics research. No builds/tests run; no files changed outside `memory/`.
- `git status` clean at `bf9d0fb` before and after (this memory file is the only addition).
