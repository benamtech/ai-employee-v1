# Phase 4 — Live Employee Wake Path & Descriptors

Status: planned

> **Architecture context:** this phase is the brain's reason-branch in
> [`../../agent-inbox-and-channel-architecture.md`](../../agent-inbox-and-channel-architecture.md) (conductor + Jobs
> + serialized inbox; channel-agnostic intents). Read it before building the wake path.

## Goal / Module

The event-bus **back half**: when a routed event needs judgment, **wake the employee against a live
Hermes Run/Session**, and make the employee's emitted `WorkEventDescriptor` a first-class, validated
output.

## Depends on

- Phase 2 (live runtime + scheduled runner).
- Phase 3 (normalized events with a clean `wake_employee` boundary).
- Phase 3A (Channel/Session/Presence router), so the employee emits channel-agnostic intents and the Manager decides
  where they surface.

## Surface (code + schema)

- Live Hermes Run/Session wake path (replaces the structured-event seam with a real run).
- First-class employee-authored `WorkEventDescriptor`: schema validation, rejection of malformed
  descriptors, safe-fact enforcement.

## Build tasks

- Complete the real message-to-agent wake path against live Hermes Runs/Sessions.
- Make employee-emitted `WorkEventDescriptor` records first-class (not Manager-authored only).
- Validate descriptors against the typed grammar; reject/repair malformed ones.
- Serialize wake attempts per employee brain; do not depend on Hermes accepting mid-run injected messages.
- Keep the owner seeing one employee — Manager remains the invisible control plane.

## Acceptance proof

- `runtime-accepted`: a judgment event **wakes the employee on live Hermes** and the run returns a
  validated `WorkEventDescriptor` (capture run/session ids + descriptor id).
- Malformed descriptors are rejected with audit, not surfaced to the owner.

## Seam handed forward

A live stream of validated descriptors that Phase 5 triages, batches, and renders live.

## Status

`planned`.
