# Phase 5 — Triage, Batching & Live Work Surface Stream

Status: source-wired

## Goal / Module

The event **delivery/presentation** layer: real triage and account-layer batching, and a **live
Hermes→Work event stream** replacing the polled snapshot — so an entire office runs through one
employee with live progress.

## Depends on

- Phase 4 (live wake path + validated descriptors).

## Surface (code + schema)

- Triage + account-layer batching logic.
- Replace the SSE-shaped **snapshot** endpoint with a live Hermes→Work event stream.
- One `WorkEventDescriptor` renders identically to **SMS and web** from the same record.

## Build tasks

- Implement real triage (priority/grouping) and per-account batching.
- Replace the polled snapshot with the live event stream when the runtime supports it.
- Keep SMS (ambient inbox) and web (Work Surface) rendering from the same descriptor.
- Show live progress and bound approval cards on the Work Surface.

## Acceptance proof

- The Work Surface shows **live progress and bound approval cards** sourced from the live stream
  (not a poll).
- A burst of events is triaged/batched coherently for the owner; literal events remain
  zero-token `deliver_only`.

## Seam handed forward

Completes the event spine. The office can run through one employee with live, trustworthy surfaces —
the keystone the operating-layer phases (admin/metering/billing) measure and manage.

## Status

`source-wired` (2026-07-04). Real rules-first triage with priority + provider-burst detection
(`event-triage.ts`) and account-layer batching with count/time flush → one digest
(`event-batching.ts` + `flush_event_batches` scheduler lane; migration `0016`). The polled snapshot is
replaced by a live Manager SSE stream (`server.ts` `employeeStream` + `employee-stream.ts`
`buildEmployeeSnapshot`/`fetchWorkEventsSince`), woken by an in-process change signal
(`progress-bus.ts` — the testable stand-in for the Supabase Realtime/NOTIFY decision) with cursor
catch-up + poll fallback. The Hermes runs client gained a real streaming path (`/v1/runs/{id}/events`
SSE → owner-safe work-verbs via `work-verbs.ts`, poll fallback) surfaced as live "doing it now"
progress. **Generative UI = MCP-UI (MCP Apps):** the agent authors a typed `view`, Manager compiles it
into a real `ui://` `rawHtml` `UIResource` (`ui-resources.ts`, `@mcp-ui/server`), and the Work Surface
renders it in a sandboxed `srcdoc` iframe whose `postMessage` intents route through the existing
approval gate (`McpUiResource.tsx`, `WorkCard.tsx`). +31 unit tests (254 total). **Supabase proven live:** migration
`0016` applied to the live project and RLS on `event_batches` proven real (owner denied / service-role
allowed) via `new-tables-rls.integration.test.ts` (4/4). Remaining `runtime-accepted` gate: real
Hermes `/v1/runs/{id}/events` SSE proof (needs a running runtime). See
`../../implementation-records/2026-07-04-phase-05-record.md`.
