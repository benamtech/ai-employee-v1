# Second-Half Plan Wiki And Codegraph Propagation

Date: 2026-07-09 01:45

Status: documentation/source-map update

Scope: Propagated the second-half plan and Hermes GUI/materialization research into root/mvp codegraphs, wiki current/future state, and Phase 1 handoff prompt.

## What Changed

Updated the second-half plan:

- `mvp-build/second-half-plan/README.md` now includes a UI research coverage map for Phases 0-6.
- `mvp-build/second-half-plan/phase-01-handoff-prompt.md` is a copy-ready implementation prompt for a fresh agent to complete Phase 1.
- Phase 0-6 docs now all carry the Hermes GUI/materialization implications without treating Hermes `/v1/capabilities` as the whole capability concept.

Added/updated wiki:

- Added `wiki/MVP/second-half-current-and-future-state.md`.
- Updated `wiki/README.md` to link the new state doc.
- Updated `wiki/product-agent-platform-architecture.md` with the second-half surface/materialization update.
- Updated `wiki/principle-graph-materialization.md` with the runtime materialization contract (`SurfaceEnvelope`, `WorkResource`, `WorkAction`, `EmployeeEventStream`).
- Updated `wiki/principle-deliverable-driven-surfaces.md` with second-half phase mapping.
- Updated `wiki/MVP/event-driven-office-and-generative-ui.md` to point to the new plan and explain the move from `WorkEventDescriptor` toward the broader materialization contracts.

Updated codegraphs:

- `CODEGRAPH.md` now points to `mvp-build/second-half-plan/` and `wiki/MVP/second-half-current-and-future-state.md` as the current second-half forward orientation.
- `mvp-build/CODEGRAPH.md` now includes the second-half read order, current priority, source map entries, and surface target graph.

## Why

The user asked to make sure the plan fully incorporates the Hermes Workspace/WebUI/Desktop research, then update both codegraphs and the root wiki to reflect the current and future application state. The key product correction is that the next era is not more estimate-specific code; it is a surface-agnostic small-business AI employee over Hermes.

## Current Status

Documentation is `source-wired`; no runtime/provider acceptance was claimed.

The immediate next implementation task is Phase 1:

- preserve interrupted Manager-as-MCP/tool-enabled employee fixes;
- run static gates;
- close or honestly block the local live gate;
- record proof ids and handoff memory.

## Files / Seams Touched

- `CODEGRAPH.md`
- `mvp-build/CODEGRAPH.md`
- `mvp-build/second-half-plan/README.md`
- `mvp-build/second-half-plan/phase-01-handoff-prompt.md`
- `wiki/MVP/second-half-current-and-future-state.md`
- `wiki/README.md`
- `wiki/product-agent-platform-architecture.md`
- `wiki/principle-graph-materialization.md`
- `wiki/principle-deliverable-driven-surfaces.md`
- `wiki/MVP/event-driven-office-and-generative-ui.md`
- `mvp-build/memory/MEMORY.md`
- this file

## Carry-Forward / Next

Start the next coding session from:

- `mvp-build/second-half-plan/phase-01-handoff-prompt.md`
- `mvp-build/second-half-plan/phase-01-preserve-and-close-live-gate.md`

Do not start the major web/SMS redesign until Phase 1 is complete or explicitly blocked with exact reasons.

## Verification

No code tests were run. This was a docs/codegraph/wiki update.

Sanity checks run:

- `rg "second-half|SurfaceEnvelope|WorkResource|phase-01-handoff" -n CODEGRAPH.md mvp-build/CODEGRAPH.md wiki/README.md wiki/MVP/second-half-current-and-future-state.md`
- `rg "source of truth|product graph|readiness evidence|boot/readiness|boot/health|not the canonical|not the owner-facing|CapabilityGraph means|health observations|runtime health observations|expected abilities" -n mvp-build/second-half-plan`

The remaining "source of truth" match is unrelated and correct: local-only chat should not be the source of truth for conversation history.
