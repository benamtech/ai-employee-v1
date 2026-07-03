# Phase 5 — Triage, Batching & Live Work Surface Stream

Status: planned

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

`planned`.
