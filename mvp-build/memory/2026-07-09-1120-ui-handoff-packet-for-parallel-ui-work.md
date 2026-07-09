# UI Handoff Packet For Parallel UI Work

Date: 2026-07-09 11:20

Status: documentation/source-orientation only

Scope: Added a UI contributor handoff packet so a business partner can work on owner-facing UI while MVP functionality continues.

## What changed

- Added `ui-handoff/README.md` as the UI contributor entry point.
- Added `ui-handoff/product-grounding.md` so a UI coding agent understands AMTECH's product power, the owner mental model, and the difference between the strategic wiki and the implementation truth in `mvp-build/`.
- Added `ui-handoff/current-ui-map.md` with the current web/Work Surface source map, data flow, styling state, implementation notes, and refactor boundaries.
- Added `ui-handoff/research-and-principles.md` with pointers to the newest Hermes GUI/materialization research, second-half plan, generative UI docs, and owner-facing vocabulary.
- Added `ui-handoff/experiments-and-future-surfaces.md` to capture forward UI ideas that were planned but not implemented yet:
  - signed SMS preview routes;
  - preview images/thumbnails/posters;
  - video previews/transcripts;
  - media/artifact/gallery/report/order-cart previews;
  - task progress representations;
  - cross-surface renderings across web, SMS, signed preview, admin, and future desktop.
- Added `ui-handoff/working-protocol.md` with checks, memory/handoff rules, contract boundaries, and coordination guidance for parallel UI work.
- Updated `README.md` and `mvp-build/README.md` so repo-level orientation points UI contributors to `mvp-build/ui-handoff/` and explains the product/surface priority.
- Updated `CODEGRAPH.md` so `ui-handoff/` is discoverable from the MVP source map.

## Why

The founder wants a partner to improve the UI while founder work continues on MVP functionality. The handoff packet gives that partner a practical map without forcing them to rediscover the whole backend, and it captures the experimental surface ideas without making them immediate implementation requirements.

The packet explicitly says the web client is the highest priority now. SMS/media/video/preview experiments should inform the design, but not distract from making the web Work Surface credible first.

## Current status

- UI handoff docs are `source-wired` as documentation.
- No app source behavior changed.
- No live/browser/runtime/provider proof claimed.
- No new tests required beyond markdown/source-map sanity.

## Files / seams touched

- `ui-handoff/README.md`
- `ui-handoff/product-grounding.md`
- `ui-handoff/current-ui-map.md`
- `ui-handoff/research-and-principles.md`
- `ui-handoff/experiments-and-future-surfaces.md`
- `ui-handoff/working-protocol.md`
- `../README.md`
- `CODEGRAPH.md`
- `memory/MEMORY.md`

## Carry-forward / next

- The UI partner should start with the web Work Surface:
  - polish layout and responsive behavior;
  - improve empty/loading/error/degraded states;
  - split `AgentClient.tsx` if useful;
  - make the preview pane/output library/task progress patterns strong enough to later become SMS signed previews.
- When UI implementation begins, add dated memory notes for substantial changes and run the standard static gates.
- Future Phase 3/4 work should use the experiments doc as a backlog for signed mobile previews, media previews, generic resources, and surface-agnostic representations.

## Verification

- Documentation edits only.
- `git diff --check` — pass.
- Static app gates not rerun because no TypeScript/source behavior changed.
