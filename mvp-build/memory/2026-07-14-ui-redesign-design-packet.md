# 2026-07-14 UI Redesign Design Packet

Status: complete  
Branch/worktree: `agent/ui-redesign-docs-packet` at `worktrees/ui-redesign-docs-packet`

## What changed

Created the build-ready UI redesign documentation packet in `mvp-build/ui-redesign/`:

- `00-index-and-reading-order.md`
- `01-research-synthesis.md`
- `02-product-mental-model.md`
- `03-information-architecture.md`
- `04-visual-system.md`
- `05-interaction-model-and-intent.md`
- `06-notification-and-attention-lifecycle.md`
- `07-abilities-and-task-execution.md`
- `08-work-objects-artifacts-approvals-proof.md`
- `09-surface-by-surface-spec.md`
- `10-future-and-push-to-limits-use-cases.md`
- `11-implementation-translation.md`

Also added this memory handoff.

## Why

The current UI is source-wired functional scaffolding, but the next MVP UI pass needs a stronger product model: a chat-native business operating surface where chat is command language, work objects are the task apps, events are the office inbox, approvals are business permissions, and proof is part of the interface.

## Source grounding

The packet is constrained to current contracts:

- `ResourcePayload`
- `WorkResource`
- `WorkAction`
- `SurfaceEnvelope`
- `CapabilityGraphNode`
- `ConnectionSurface`
- `ResurfaceItem`
- `WorkEventDescriptor`

The docs distinguish source-wired capability from future ambition and preserve the rule that owner UI must not expose implementation vocabulary.

Important correction captured during review: `Open` must not be treated as read-only by default. In an AI-native product, opening a document, artifact, report, generated card, or work object means entering an authorized object-specific work surface. That surface may be interactive, editable, chat-assisted, generated, metaprogrammed, or connector-backed. The nuance is scope: SMS artifact links, proof links, unauthenticated sessions, and tokens scoped only to view should default to a strong read-only view unless the owner authenticates or the signed scope explicitly allows more. The safety boundary is effect-based: customer-facing sends, money movement, public publishing, protected sharing, and durable external writes remain gated by exact preview and approval.

## Research grounding

The packet synthesizes local AMTECH wiki/UI handoff material plus external anchors:

- Engelbart augmentation/working surface;
- Licklider man-computer symbiosis;
- Xerox Star object-first office UI;
- Malone/PIM piles, reminders, refinding;
- Suchman situated action and repair;
- Winograd/Flores language as action and commitments;
- Norman/Nielsen cognitive ergonomics and heuristics;
- notification/interruption guidance and research;
- Microsoft HAX/human-AI interaction guidance.

## Next implementation agent

Read the docs in order, then implement from `11-implementation-translation.md`.

Recommended implementation sequence:

1. Extract/refactor a shared `WorkResource` renderer using `ReviewClient.tsx` as reference.
2. Add `SurfaceEnvelope` renderer routing by `render_hints.tier`.
3. Rebuild the owner Work Surface IA around Today, Ask Avery, Work, Library, Connected, History, and Settings.
4. Use fixtures to prove flows before wiring live data.
5. Align signed review, artifact, generated card, and admin surfaces.
6. Run browser screenshots and accessibility checks.

Do not implement unrestricted standing approvals, generic automation builder UI, raw connector dashboards, or owner-visible internal diagnostics.
