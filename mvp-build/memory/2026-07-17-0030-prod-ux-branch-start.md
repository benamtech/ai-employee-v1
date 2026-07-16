# 2026-07-17 00:30 — prod-ux branch start + first-principles web surface redesign

**Branch:** `prod-ux` (new, independent of `main`)

## Context & Intent

Started a dedicated `prod-ux` branch to execute the next-level owner UX redesign while keeping the legacy `AgentClient.tsx` scaffolding intact for safe merge. The redesign is grounded exclusively in the canonical UX sources (`wiki/MVP/event-driven-office-and-generative-ui.md`, `ai-native-work-surface-research.md`, `phase-3-generative-ui-reframe.md`) and the live runtime contracts (Hermes streaming, `deliverOwnerTurnToRuntime`, `deliverEmployeeEvent`, `WorkEventDescriptor`/`WorkResource`/`WorkAction`, signed preview links, progress bus).

## Validation Framework Created

Wrote `docs/prod-ux-validation-framework.md` — a four-layer pass/fail system (UX Philosophy → Pi Technical Patterns → Architecture Style → Specific Features) modeled on the Phase 1 acceptance harness. Every change on this branch must cite a UX source and survive the fail vectors before implementation.

## Pi Ecosystem Technical Mapping

Wrote `docs/pi-ecosystem-interface-concepts.md` (narrow technical-only extraction). Pi projects (`pi-companion`, `pi-generative-ui+Glimpse`, `pi-queue`, `Mercury`, `pi-gui`, `pi-acp/mcp-adapter`) are consulted **only** for implementation mechanics (web companion structure, JSON-lines widget streaming, signed preview tokens, multi-channel routing, approval-before-execute). All meaning, semantics, and contracts remain AMTECH-owned.

## First Implementation — Clean AgentSurface

Created `mvp-build/apps/web/app/agent/[employeeId]/AgentSurface.tsx` from first principles using only live backend contracts:

- `ResourcePayload`, `WorkEventRow`, `WorkResource`, `WorkAction`, `SurfaceEnvelope` from `@amtech/shared`
- `POST /resources`, `POST /message` (maps to `owner_web_chat`), `GET /stream` (new thin SSE proxy to `MANAGER_API.employeeStream`)
- Hermes streaming + `publishProgress` via progress bus
- Signed preview + approval gates remain server-side (`attachPreviewLink`, `deliverEmployeeEvent`)

Core IA (directly from UX sources):
- **Home** — “Needs your say” (attention/resurface) first, then recent work
- **Talk** — Command language only
- **Proof** — Audit/ledger of what left the business
- **Connected** — Connector health placeholder

Only `page.tsx` was edited (one-line swap). Legacy `AgentClient.tsx` + all supporting files untouched — non-destructive posture.

## Merge Safety

- 28 files touched total on branch
- Legacy scaffolding preserved
- New stream proxy is a thin edge route (no Manager changes)
- All signed-preview/approval logic stays server-side

## Next Approved Work (Four-Layer Validated)

1. Minimal attention cards using existing `WorkResource` shapes
2. Signed-preview rendering in Home view
3. Phase 0–1 acceptance harness exposure of preview tokens
4. Typed widget streaming for next DeliverableType (Glimpse-style, approved types only)

## Carry-Forward

This branch is the controlled surface for next-level UX delivery. All future changes must pass the four-layer validation framework and cite the canonical UX sources. The legacy client remains the safe fallback until the new surface reaches feature parity.