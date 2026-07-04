# 2026-07-04 14:40 — Phase 5: triage, batching, live Work Surface stream, MCP-UI generative UI

Status: source-wired. Local gates green (typecheck, 44 unit files / 254 tests, build, lint). Live
Hermes SSE proof pending; Supabase `0016` RLS proof to run against the live project.

## What this session built

Phase 5 in full, plus a plan decision to adopt MCP-UI now instead of deferring it.

**Triage (rules-first).** `event-triage.ts` `decideTriage` → `{ decision, priority }`. `derivePriority`
marks money/customer/`leaves_business`/payment-shaped events high (never batched); provider bursts
(same source+type ≥ `TRIAGE_BURST_THRESHOLD` within `TRIAGE_BURST_WINDOW_SECONDS`) → batch; suppressed
→ ignore; missing owner ctx → repair. `TRIAGE_MODEL_TIER` seam left for a haiku tier (off).

**Batching + digest.** `event-batching.ts` `flushDueBatches` collapses a due open batch (count ≥
`TRIAGE_FLUSH_COUNT_THRESHOLD` or `flush_after` reached) into ONE `manager.digest` notify via the normal
delivery path; atomic `open→flushing→flushed` claim; idempotent on `digest:<batch.id>`. New
`flush_event_batches` scheduler lane. Migration `0016`: adds `first_seen_at/last_seen_at/flush_after/
priority`, swaps `unique(account,batch_key,status)` for a partial unique index on **open** batches
(repeated digests are now legal), enables RLS on `event_batches`.

**Live stream.** `server.ts` `GET /manager/employee/:id/stream` (owner-session auth): initial
`snapshot`, then cursor `work_event`/`approval_update` deltas + relayed `work_progress`. Woken by
`progress-bus.ts` — an in-process EventEmitter that is BOTH a progress relay and a change signal
(`signalEmployeeChange`/`waitForEmployeeChange`). **This is the testable stand-in for the founder's
"Supabase Realtime / LISTEN-NOTIFY" choice**: single-instance now; swap `signal`/`wait` for
Postgres LISTEN/NOTIFY or Realtime to go multi-instance. Read-model extracted to `employee-stream.ts`
`buildEmployeeSnapshot` (shared by /resources + stream + tests) + `fetchWorkEventsSince`. Web `events`
route is now a pass-through SSE proxy; `AgentClient.tsx` consumes the vocabulary with reconnect/backoff
+ 20s poll fallback + a live "doing it now" line. `deliverEmployeeEvent` calls `signalEmployeeChange`.

**Hermes streaming.** `hermes-client.ts` split into `createRun`/`pollRun`; new
`executeHermesTurnStreaming` consumes `GET /v1/runs/{id}/events` SSE (`parseSseFrames` exported +
tested), degrades create→stream→poll→sessions. `work-verbs.ts` allowlist maps tool→verb; a raw tool
name never reaches the owner. `wake.ts` now uses the streaming turn and publishes progress.

**Generative UI = MCP-UI (utilitarian, real).** Shared: `WorkView` (table/schedule/diff/form) +
`UiResourceEnvelope` on the deliverable; `work-stream.ts`; read-model types moved to
`resource-payload.ts`. Manager `ui-resources.ts` compiles a `view` → real `ui://` `rawHtml`
`UIResource` via `@mcp-ui/server` `createUIResource` from AMTECH-owned, HTML-escaped templates (NOT raw
model HTML). Web `McpUiResource.tsx` renders it in a sandboxed `srcdoc` iframe
(`sandbox="allow-scripts"`, no `allow-same-origin`); `postMessage` intents route through the existing
approval gate in `WorkCard.tsx`. `withUiResource` attaches it after `bindApprovalIfNeeded` in both
delivery branches.

## Decisions

- **MCP-UI adopted now** (founder call, mid-session): "completely implement mcp-ui… utilitarian for
  now." Chose the real `@mcp-ui/server` authoring + native sandboxed-iframe rendering over the heavier
  `@mcp-ui/client` `AppFrame` + sandbox-proxy host (which needs a hosted proxy URL + AppBridge
  transport). `@mcp-ui/client` was installed then removed (unused). Growth seam: `remoteDom` +
  AppFrame + full MCP JSON-RPC transport if we ever expose to third-party hosts.
- **Transport = Realtime/NOTIFY** realized as the in-process change signal above (testable default).
- **Triage = rules-first**, deterministic.

## Repo/git correction

The workspace is **one git repo at root `GTM-RESEARCH` with a GitHub remote** (`origin` →
`benamtech/ai-employee-v1`), branch `main` — NOT the "local-only, no remotes" the old docs claimed.
`mvp-build/` is tracked inside it. The founder confirmed mvp-build should be committed to the repo.
AGENTS.md/CLAUDE.md Git sections updated. Commit guidance: branch off `main`, don't push without asking.

## Next agent inherits

1. **Live Supabase proof** (now reachable): apply `0016` to the live project (project id in the
   `2026-07-04-0043` handoff / local env), run `new-tables-rls.integration.test.ts` — prove RLS on
   `event_batches` + no browser exposure. Then flip the Supabase part of the gate.
2. **Live Hermes SSE proof**: capture a real `/v1/runs/{id}/events` stream to move the stream to
   `runtime-accepted`; pin the exact event JSON field names (parser is defensive until then).
3. **Uncommitted tree**: this Phase 5 work sits on top of the earlier local-bootstrap dirty tree
   (`PROVISIONER_SKIP_SMS`, `infra/scripts/local/`, `0002` fix). Commit the bootstrap first, then
   Phase 5, on a branch — do not mix them.
4. Phase 6 finish (its own plan): env-gated RLS/migration proof of the six ledgers + `run_id` chain —
   NOT the Phase 7 instrumentation.
