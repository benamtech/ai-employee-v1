# 2026-07-17 02:00 — Design intern handoff: public site → new web client surface

**Status:** ready

## Core References (read in order)

1. `docs/AMTECH_WEB_DESIGN_SYSTEM.md` + `AMTECH_WEB_DESIGN_SYSTEM_IMPLEMENTATION.md`
2. `docs/prod-ux-validation-framework.md` (four-layer pass/fail)
3. `docs/pi-ecosystem-interface-concepts.md` (mechanics only)
4. `mvp-build/apps/web/app/agent/[employeeId]/AgentSurface.tsx` + `surface-types.ts`
5. `mvp-build/memory/2026-07-17-0145-leverage-and-method-distilled.md` (method)
6. `mvp-build/apps/web/app/agent/[employeeId]/page.tsx` (thin wrapper)

## Task

Transform the public AMTECH website (landing + estimator flows) into an interface that feels and behaves like the new owner web client surface (`AgentSurface`).

## Research Guidelines

- Study the four primary views: Home (attention/resurface first), Talk (command language only), Proof (ledger of what left the business), Connected (connector health).
- Map public site sections to these views without inventing new IA.
- Use only the live shared contracts (`@amtech/shared` resource-payload types).
- Preserve signed preview + approval gate semantics (server-side).
- Reference the exact UX philosophy and technical patterns in the validation framework.

## Implementation Rules

- Contracts first: never create new shapes.
- Minimal surface: thin client, heavy logic stays in Manager.
- Non-destructive: keep existing estimator/landing paths until parity.
- Verifiability: every change must pass typecheck + the four-layer framework.
- Token-efficient: produce memory handoffs during work, not after.
- Design system: apply `AMTECH_WEB_DESIGN_SYSTEM_IMPLEMENTATION.md` rules exactly.

## Deliverables

- Updated public pages that mirror `AgentSurface` IA and interaction model.
- One memory handoff per major decision.
- Proof that changes survive the validation framework.

## Method

Read references → validate against framework → implement against contracts → handoff. No exceptions.