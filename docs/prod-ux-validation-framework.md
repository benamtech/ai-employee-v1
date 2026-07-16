# prod-ux Branch — Validation Framework

**Branch:** `prod-ux`  
**Status:** active  
**Purpose:** Define pass/fail vectors for every layer of work on this branch before any code or surface changes are made.

This framework is derived from the acceptance harness pattern (`wiki/MVP/implementation-records/2026-06-30-phase-01-acceptance-harness-record.md`) and the implementation-plan handoff discipline (`wiki/MVP/implementation-plan-prompt-handoff.md`).

## Layered Validation Model

Every change on `prod-ux` must be validated at four layers. Each layer has explicit **pass criteria** and **fail vectors**.

### Layer 1 — UX Philosophy (Non-Negotiable)

**Source of truth:** `wiki/MVP/event-driven-office-and-generative-ui.md`, `wiki/MVP/ai-native-work-surface-research.md`, `wiki/MVP/phase-3-generative-ui-reframe.md`

**Pass criteria**
- Every proposed surface or interaction is traceable to one of the three canonical UX documents.
- No new surface semantics, work-object definitions, or owner psychology models are introduced.
- Conformance rule is preserved: agent selects and fills pre-approved typed components only.

**Fail vectors**
- Any proposal that redefines "work surface," "confirmation gate," "pro-human," or "chat as command language."
- Any generative UI approach that allows open-ended/raw markup for money or customer actions.
- Any claim that chat is the product rather than the command language.

**Validation method:** Explicit citation of the UX source paragraph or section for every design decision. No citation = blocked.

### Layer 2 — Technical Implementation Patterns (Pi Borrow)

**Source of truth:** `docs/pi-ecosystem-interface-concepts.md` (the narrow technical-only mapping)

**Pass criteria**
- Every borrowed Pi pattern is listed in the "Pi Technical Patterns Worth Borrowing" table.
- The pattern is used only for "how" (streaming, signing, routing, gating), never for "what" or "why."
- The pattern is constrained by the UX source column in the table.

**Fail vectors**
- Borrowing a Pi pattern that is not in the approved table.
- Using a Pi pattern to redefine surface meaning or gate semantics.
- Treating Pi projects as philosophical or UX sources.

**Validation method:** Table-row citation + UX-source cross-check. Any Pi technique outside the table requires a documented exception and UX-source update.

### Layer 3 — Architecture Style

**Source of truth:** `wiki/MVP/event-driven-office-and-generative-ui.md` §2 (the 12-stage canonical lifecycle), second-half `SurfaceEnvelope` direction, `deliverEmployeeEvent` pipeline.

**Pass criteria**
- All surfaces consume the existing `WorkEventDescriptor` / `deliverEmployeeEvent` pipeline.
- Signed preview links and multi-channel delivery are extensions of the RENDER stage (stage 10), not new paths.
- Confirmation gate is implemented strictly inside stages 8–12; no parallel approval flows.

**Fail vectors**
- New event paths, descriptor types, or approval mechanisms that bypass the 12-stage spine.
- Any surface that does not render the same descriptor the SMS path already produces.
- Any approval flow that lives outside the employee-message + proof record.

**Validation method:** Architecture diagram or code path must show the change as a rendering or extension of an existing stage. New stages or bypasses = fail.

### Layer 4 — Specific Features (Web Client, Signed Links, Widgets, Channels)

**Pass criteria (per feature)**
- Feature is one of the five implementation priorities listed in `docs/pi-ecosystem-interface-concepts.md`.
- Feature has a named pass/fail test or acceptance run (modeled on Phase 1 harness runs).
- Feature produces or consumes a `WorkEventDescriptor` and records proof on owner resolution.

**Fail vectors (per feature)**
- Feature introduces a new DeliverableType or component without a `phase-3-generative-ui-reframe.md` update.
- Feature sends money/outbound/schedule actions without a signed preview + owner resolution step.
- Feature renders raw markup or untyped content for any customer- or money-facing action.

**Validation method:** Each feature ships with a minimal acceptance script or test (unit, integration, or golden-path step) that asserts the pass criteria and fails loudly on the fail vectors.

## Validation Workflow on This Branch

1. **Before any work** — State the layer(s) affected and cite the exact UX source paragraph or table row.
2. **During planning** — Produce a pass/fail matrix for the proposed change using the four-layer model above.
3. **During implementation** — Every commit or PR must include the validation citation and a runnable check (test, script, or manual golden-path step) that proves pass criteria.
4. **On review** — Reviewer verifies that no fail vector was triggered and that the UX source citation is accurate.
5. **On merge** — Update this framework if a new pattern or seam is added; otherwise the framework is immutable.

## Current Approved Work Items (All Layers Validated)

Only the five technical priorities in `docs/pi-ecosystem-interface-concepts.md` are in scope:

1. Phase 0–1: acceptance harness emits signed preview tokens for existing WorkEventDescriptors.
2. Early web companion: lists sessions and renders the same cards SMS produces.
3. SMS signed-link hardening: every high-stakes descriptor includes a short-lived preview URL.
4. Typed widget streaming: next DeliverableType renderers using Glimpse-style JSON-lines (approved types only).
5. Multi-channel routing (later): WhatsApp/Slack once descriptor contract is stable.

Any item outside this list must go through the full four-layer validation before being added.

## Enforcement

- No code, doc, or plan change on `prod-ux` is considered valid until it has passed all four layers.
- The framework itself can only be changed by an explicit update that cites the UX source driving the change.
- This document travels with the branch and is the first reference for any future agent or reviewer.