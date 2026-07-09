# UI Handoff

Status: active

Purpose: this folder helps a UI-focused contributor work on the AMTECH AI Employee interfaces while the founder continues finishing MVP functionality. It is an orientation packet, not a design system and not a final visual spec.

The app does not yet have a deliberate visual language. Most current styling is pragmatic scaffolding: inline React styles, small token objects, and enough layout to prove the Work Surface shape. Treat the current UI as a working prototype that can be improved, reorganized, and made coherent. Preserve product semantics and safety gates; do not treat current colors, spacing, or component styling as sacred.

## Start Here

Read these first, in order:

1. `../identity.md` — AMTECH operating identity and voice.
2. `../CODEGRAPH.md` — whole workspace map, canonical facts, current second-half context.
3. `../mvp-build/CODEGRAPH.md` — MVP build source map and current status.
4. `../mvp-build/CLAUDE.md` and `../mvp-build/AGENTS.md` — build-home rules. Note: if these lag the newer source map, prefer `mvp-build/CODEGRAPH.md` plus newest `mvp-build/memory/` notes for current status.
5. `../mvp-build/memory/MEMORY.md`, then the newest dated handoffs.
6. `../mvp-build/second-half-plan/README.md`.
7. `../wiki/MVP/second-half-current-and-future-state.md`.
8. This folder.

Then read whichever UI area you are touching:

- [Product Grounding](product-grounding.md) for what AMTECH is, why the product is powerful, and how to distinguish the wiki from `mvp-build/`.
- [Current UI Map](current-ui-map.md) for source files, data flow, and existing implementation notes.
- [Research And Principles](research-and-principles.md) for the Hermes GUI discoveries, generative UI direction, and product vocabulary.
- [Experiments And Future Surfaces](experiments-and-future-surfaces.md) for preview media, SMS links, task progress, images/video/artifacts, and cross-surface data representations.
- [Working Protocol](working-protocol.md) for how to work without blocking backend/MVP functionality, what checks to run, and how to write handoffs.

## Current Build Position

The current forward plan is `mvp-build/second-half-plan/`.

Relevant current status:

- Second-half Phase 1 is `source-wired/static-green`; live browser/runtime proof is blocked until a usable model/provider path exists.
- Second-half Phase 2 is `source-wired`: the web Work Surface has been rebuilt into a multi-region employee desk with Today, Chat, Jobs, Tasks, Outputs, Connected, Abilities, Activity, Settings-lite, and a preview pane.
- Phase 3 is planned: SMS ambient inbox and signed mobile previews.
- Phase 4 is planned: `SurfaceEnvelope`, `WorkResource`, `WorkAction`, `EmployeeEventStream`, capability registry, and generic renderers.

For UI work, this means:

- The backend shape is good enough to design against.
- The current web UI is not final and can be improved aggressively.
- SMS/mobile preview work should use the same resource/action thinking as the web desk.
- Do not claim live acceptance unless real runtime/provider proof exists.

## What UI Work Can Safely Focus On

Good areas for an independent UI contributor:

- Visual hierarchy and layout polish for the Work Surface.
- Responsive/mobile behavior for the employee desk and preview pane.
- Better empty, loading, degraded, and error states.
- Clearer owner language for tasks, abilities, connectors, outputs, and activity.
- Component extraction from the large `AgentClient.tsx` file if it reduces complexity.
- Reusable styling/tokens if they make the UI easier to evolve.
- Playwright/browser checks and screenshots once the local surface can run.
- Phase 3 mobile signed-preview designs that consume existing resource/action concepts.
- Experimental preview patterns for images, video, reports, task progress, and other artifacts, as long as the web client remains the first implementation target.

Coordinate before changing:

- Manager API contracts, database migrations, auth, provider secrets, approval semantics, runtime delivery, or Hermes profile behavior.
- The shared `ResourcePayload` shape if the change requires backend support.
- Approval gates around money, customer-facing sends, external changes, deletes, credentials, or dangerous actions.

## Product Mental Model

AMTECH packages Hermes Agent into a small-business employee. The owner should not feel like they are using a developer dashboard or a chatbot wrapper. They should feel like they hired a competent assistant who:

- knows what work is waiting;
- shows outputs before sending or spending;
- asks clear questions;
- leaves receipts and proof;
- can work through web, SMS, signed links, and future surfaces;
- stays behind approval gates for risky actions.

The Manager backend is invisible to the owner. Owner-facing language should say employee, work, abilities, connected accounts, outputs, proof, waiting for you, and recurring work. Keep MCP/API/toolset/runtime/config/token language out of normal owner UI.

## Wiki Versus MVP Build

Use `wiki/` for product strategy, market context, principles, architecture rationale, and research. Use `mvp-build/` for actual implementation state, source files, tests, scripts, and current handoffs.

If a wiki vision and the source differ, do not assume the vision is already built. Check `mvp-build/CODEGRAPH.md`, `mvp-build/memory/MEMORY.md`, the newest memory note, and the source.

## Files In This Packet

- `README.md` — this overview.
- `product-grounding.md` — product power, owner mental model, and wiki versus `mvp-build/`.
- `current-ui-map.md` — concrete source map and current implementation notes.
- `research-and-principles.md` — research index and design/product principles.
- `experiments-and-future-surfaces.md` — forward UI backlog for SMS/media previews and surface representations.
- `working-protocol.md` — checks, handoff rules, memory protocol, and coordination guidance.
