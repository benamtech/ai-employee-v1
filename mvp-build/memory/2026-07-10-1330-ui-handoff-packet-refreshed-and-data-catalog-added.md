# UI handoff packet refreshed + data catalog added

Date: 2026-07-10 13:30

Status: docs only; no source/schema/tests touched

Scope: refresh `mvp-build/ui-handoff/` so a UI collaborator (and their agents) can work from an accurate
picture of everything available to the UI — data shapes, surfaces, routes, and artifact/preview
plumbing — instead of the Phase 2-era snapshot the packet had frozen at.

## What changed

- Added `mvp-build/ui-handoff/data-catalog.md` (new file): a full inventory of every data shape
  reachable by the UI, organized as three layers (raw Manager rows → `ResourcePayload` read model →
  surface-agnostic `SurfaceEnvelope`/`WorkResource`/`CapabilityGraphNode` materialization), with
  concrete field tables, a dedicated section on the artifact/output-link and preview-image rendering
  mechanism (stored-file signed URL vs. generic HTML fallback vs. fixture HTML; `WorkResource.media`/
  `body_html`/`open_url`; what's real vs. still-planned for thumbnails/posters/OG images), a section on
  MCP-UI generative cards, a section on the Admin console contracts, a route map, and a fixture-mode
  coverage table.
- Rewrote the rest of the packet's stale "Phase 3/4/5 are planned" framing — they are all `source-wired`
  as of 2026-07-09/10 (signed mobile Review surface, Phase 4 materialization/capability registry, Phase
  5 Admin console, MCP-UI generative rendering) — across `README.md`, `current-ui-map.md`,
  `research-and-principles.md`, `experiments-and-future-surfaces.md`, `working-protocol.md`, and
  `product-grounding.md`. Each now names the concrete already-built files (`review/ReviewClient.tsx`,
  `admin/AdminClient.tsx`, `ui-resources.ts`, `McpUiResource.tsx`, `preview-links.ts`,
  `materialization.ts`, `admin.ts`) instead of describing them as future work, while still marking what
  inside each surface remains thin/unpolished (see each file's own "still thin" notes).
- Added a `data-catalog.md` row to `mvp-build/CODEGRAPH.md` §6 docs table.

## Why

The packet (written 2026-07-09, before Phase 3-5 landed) was the entry point named in the user's ask
for a collaborator + their AI agents to work from "overall design system to a complete web UI." It
undersold what exists (three real additional surfaces beyond the web desk: signed mobile Review, Admin
console, MCP-UI generative cards) and had no single place enumerating the data shapes/fields a new
renderer could actually draw on — a UI agent reading only the old packet would have designed the
Review/Admin/MCP-UI surfaces from scratch, duplicating already-built contracts, or missed that
`WorkResource`/`SurfaceEnvelope` exist as the intended generic rendering target.

## Current status

- Packet accurately reflects `mvp-build/CODEGRAPH.md` §3 phase status as of 2026-07-10.
- `data-catalog.md` is a reference document, not a design system — it inventories what data/routes
  exist, not what anything should look like.
- No visual design system exists yet for any surface; that's still fully open work for the
  collaborator, correctly scoped as such in the refreshed packet.

## Files / seams touched

- `mvp-build/ui-handoff/data-catalog.md` (new).
- `mvp-build/ui-handoff/README.md`, `current-ui-map.md`, `research-and-principles.md`,
  `experiments-and-future-surfaces.md`, `working-protocol.md`, `product-grounding.md` (edited).
- `mvp-build/CODEGRAPH.md` (added one docs-table row).

## Carry-forward / next

- If the collaborator's agents propose changes to `WorkResource`/`SurfaceEnvelope`/`CapabilityGraphNode`,
  those are shared contracts — coordinate per `working-protocol.md`'s contract-boundary list, same as
  `ResourcePayload`.
- The Admin console has no inline `WorkResource`/artifact preview yet (noted as an open gap in
  `data-catalog.md` §7) — a reasonable first slice if the collaborator wants an admin-side win.
- No thumbnail/poster/OG-image generation pipeline exists; `data-catalog.md` §5.3 names exactly what
  field (`WorkResource.media.url`) any such pipeline should populate.

## Verification

- `npm run typecheck` — not run (docs-only change, no source touched).
- `npm run test:unit` — not run (docs-only change).
- `npm run lint` — not run (docs-only change).
- `npm run build` — not run (docs-only change).
- Manually cross-checked every claim in `data-catalog.md` against the actual current source
  (`resource-payload.ts`, `preview-links.ts`, `materialization.ts`, `admin.ts`, `ui-resources.ts`,
  `McpUiResource.tsx`, `artifact-view.ts`, `artifacts.ts`, `routes.ts`, `ReviewClient.tsx`,
  `AdminClient.tsx`, the output route) rather than from memory notes alone.
