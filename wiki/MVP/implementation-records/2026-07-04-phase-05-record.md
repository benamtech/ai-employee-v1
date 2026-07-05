# Implementation Record — Phase 5: Triage, Batching & the Live, Next-Gen Work Surface

Status: source-wired; Supabase migration + RLS proven live; live Hermes SSE proof pending

Date: 2026-07-04

Follows `2026-07-03-phase-04-hardening-and-phase-06-record.md`. Phase 5 turns the `deliver_only` demo
into a live, event-driven office: real triage + account-layer batching, a live Work Surface stream
replacing the polled snapshot, and **generative UI via MCP-UI (the official MCP Apps extension)**.

## Local proof

- `npm run typecheck` — pass (all four workspaces).
- `npm run test:unit` — **44 files / 254 tests** pass (was 38 / 223; +31).
- `npm run build` — pass (incl. Next.js web; MCP-UI iframe in the `/agent` route).
- `npm run lint` — clean.

## What shipped

**Triage (rules-first, deterministic).** `event-triage.ts` `decideTriage` now returns
`{ decision, priority }`. Money/customer/`leaves_business` → `notify` high (never batched); provider
bursts (same source+type ≥ threshold within a window) → `batch`; suppressed → `ignore`; missing owner
context → `repair`. A `TRIAGE_MODEL_TIER` seam is left for a haiku tier (off by default).

**Batching + digest.** `event_batches` gains `first_seen_at`/`last_seen_at`/`flush_after`/`priority`
(migration `0016`; the old `unique(account,batch_key,status)` is swapped for a partial unique index on
open batches so repeated digests are legal). `event-batching.ts` `flushDueBatches` collapses a due
batch (count- or time-triggered) into one `manager.digest` notify via the normal delivery path, claimed
atomically (`open`→`flushing`→`flushed`) and idempotent on a stable digest key. Runs on the new
`flush_event_batches` scheduler lane.

**Live stream.** `server.ts` adds `GET /manager/employee/:id/stream` (owner-session auth). It emits an
initial `snapshot`, then cursor-driven `work_event`/`approval_update` deltas woken by an in-process
change signal (`progress-bus.ts` — the testable realization of the Supabase Realtime/LISTEN-NOTIFY
decision; single-instance now, seam to cross-process), plus `work_progress` verbs relayed from in-flight
wakes. The read-model is extracted to `employee-stream.ts` `buildEmployeeSnapshot` (shared by /resources,
the stream, and tests) with `fetchWorkEventsSince` for deltas. The web `events` route is now a
pass-through SSE proxy; `AgentClient.tsx` consumes the full vocabulary with reconnect/backoff, a poll
fallback, and a live "doing it now" line.

**Hermes streaming.** `hermes-client.ts` refactors runs into `createRun`/`pollRun` and adds
`executeHermesTurnStreaming` consuming `GET /v1/runs/{id}/events`, degrading safely to poll → sessions
chat. The live Hermes API-server contract is now pinned in source: capabilities expose
`features.run_events_sse`, `features.tool_progress_events`, `features.approval_events`, and
`endpoints.run_events`; run event JSON uses the `event` field with `message.delta`, `tool.started`,
`tool.completed`, `reasoning.available`, `approval.request`, `run.completed`, `run.failed`, and
`run.cancelled`. `work-verbs.ts` maps tool names to owner-safe verbs — a raw tool name can never reach the
owner. `wake.ts` publishes progress.

**Generative UI = MCP-UI (utilitarian, real).** New shared contract: `WorkView` (`table`/`schedule`/
`diff`/`form`) on the deliverable + `UiResourceEnvelope`; `work-stream.ts` event union; read-model types
moved to shared `resource-payload.ts`. Manager compiles a `view` into a real `ui://` `rawHtml`
`UIResource` (`ui-resources.ts`, `@mcp-ui/server` `createUIResource`) from AMTECH-owned, HTML-escaped
templates — never raw model HTML. The Work Surface renders it in a sandboxed `srcdoc` iframe
(`McpUiResource.tsx`, `sandbox="allow-scripts"`, no `allow-same-origin`) whose `postMessage` intents
route through the **existing approval gate** — mirroring MCP Apps' "UI actions use the same consent
path." Growth seams: agent-authored `remoteDom`, and `@mcp-ui/client` `AppFrame` + sandbox-proxy host.

## Guardrails held

- Owner never sees a tool name/JSON — work-verb allowlist + descriptor-only surfaces.
- Money/customer UI is Manager-templated and un-spoofable; a `view` never relaxes the gate
  (`validateWorkEventDescriptor` proven in `work-view.test.ts`).
- Raw meter/batch rows stay Manager-only; `0016` enables RLS on `event_batches`.
- Secrets by reference — `ui-resources.test.ts` proves no secret/raw payload enters `htmlString`.

## New tests (deterministic)

`event-triage`, `event-batching`, `employee-stream`, `hermes-stream` (SSE parser + verb safety),
`work-view` (gate invariance), `ui-resources` (compile determinism + escaping + no-secret + approval
binding). Fake Supabase gained `gt`/`lt` filters and exact-`count`/`head` support.

## Live gate

- **Supabase — DONE (real proof).** Migration `0016` applied to the live project via the repo runner
  (`_migrations` tracks it; `0001`-`0016` applied). Verified live: the four new columns exist, RLS is
  enabled on `event_batches`, the old `unique(account,batch_key,status)` constraint is gone, and the
  partial `uq_event_batches_open` + `idx_event_batches_flush` indexes exist. `event_batches` added to
  `new-tables-rls.integration.test.ts` and proven real (owner denied / service-role allowed), 4/4
  against live Supabase.
- **Hermes runtime — partial live proof, still pending `runtime-accepted`.** Fresh local employee
  `emp_vhz8kw3bhvh67zu292ukgl` proved the sibling Docker runtime path with `/health` 200
  (`status:"ok"`, `platform:"hermes-agent"`, `version:"0.18.0"`) and `/v1/capabilities` 200 including
  `run_events_sse` and `endpoints.run_events`. Provisioning now renders the normal Hermes model setup
  choices (`model.provider`, `model.default`, `model.base_url`) into every profile so a new employee no
  longer falls into the `hermes model` wizard. The chat probe then reached the OpenAI-compatible provider
  and failed honestly with provider auth (`HTTP 401`) because the local env has no funded provider key.
  Therefore there is no valid `/v1/runs/{id}/events` transcript or external runtime run id yet, and the
  Phase 5 runtime gate remains pending.
