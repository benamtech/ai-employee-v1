# Phase 3 — Generic Ingress & Event Routing

Status: planned

> **Production implementation plan:** [`phase-03-implementation-plan.md`](phase-03-implementation-plan.md)
> (work items, target architecture, acceptance proof, forward seams).
> **Architecture context:** [`../../agent-inbox-and-channel-architecture.md`](../../agent-inbox-and-channel-architecture.md)
> — Phase 3 is the universal "message to the agent" ingress spine across all origin classes (not a connector list).
> Hermes run/session semantics research: [`../../hermes-run-session-semantics-research.md`](../../hermes-run-session-semantics-research.md).

## Goal / Module

Turn the event-bus **front half** from per-provider seams into the primary office spine:
`ingress -> verify -> normalize -> dedupe -> triage -> route`, with one lifecycle for every source.

## Depends on

- Phase 0 seams (generic event-source registry, `deliver_only` vs `wake_employee`, structured event
  call) are already source-wired. This phase promotes them to the primary path.
- Design detail: [`../../event-driven-office-and-generative-ui.md`](../../event-driven-office-and-generative-ui.md) §3.

## Surface (code + schema)

- Promote the **generic event-source registry** into the primary ingress abstraction (Gmail/Stripe/
  Twilio/manager events all enter through it).
- Keep **strict per-provider verification** (signatures/OIDC) at the edge.
- Normalize every event into safe structured facts (no raw provider bodies downstream).
- Route via the existing `deliver_only` vs `wake_employee` flag.

## Build tasks

- Make the generic registry the real ingress entry, not a seam beside provider-specific handlers.
- Preserve per-provider signature/auth verification strictly.
- Normalize all sources to the same safe fact shape; dedupe.
- Classify route: literal/notify-only events stay zero-token `deliver_only`; judgment events flag for
  `wake_employee` (the live wake itself is Phase 4).

## Acceptance proof

- Gmail, Stripe, Twilio, and manager events **all follow one ingress lifecycle** through the generic
  registry, with per-provider verification still enforced.
- Literal events demonstrably take the zero-token `deliver_only` path.
- No raw provider payloads/secrets appear past normalization (verified in logs/audit).

## Seam handed forward

A normalized, routed event stream with a clean `wake_employee` boundary that Phase 4 connects to a
live Hermes run. Channel choice is deliberately handed to Phase 3A, not embedded in source adapters.

## Status

`planned`.
