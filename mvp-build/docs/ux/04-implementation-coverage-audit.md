# UX Implementation Coverage Audit

Status: active  
Purpose: state what is implemented, partial, or still missing

## Implemented Locally

- Avery-first owner route: Home / Talk / Proof / Connected.
- Tell Avery, Needs your say, quiet Watching, Recent proof.
- Inline exact review for the first active approval.
- Signed mobile Review aligned with the same work/action model.
- `ResourcePayload`, `WorkResource`, `WorkAction`, `SurfaceEnvelope`, `ConnectionSurface`,
  `CapabilityGraphNode`, and `ResurfaceItem` are preserved.
- Manager-compiled MCP-UI `ui://` resources with sandboxed iframe rendering and host-routed intents.
- UI fixture smoke and durable packet screenshots.
- Fixture-mode guard rejects fake data in production-like/pod-like environments.

## Partial

- Aqua-inspired visual system: present in owner route, not all product surfaces.
- Feedback/progress: basic message/status feedback exists; durable progress for long-running work needs design.
- Proof refinding: Proof surface exists, but search/filter and proof-by-job are immature.
- Connected account capability: owner-readable cards exist; setup/repair flows need expansion.
- Context-engineering as UX: source-wired substrate exists, but it is not yet visible as owner trust/proof.
- WYSIWYG: approval previews exist, but output parity across HTML, PDF, signed link, email, and customer portal needs proof.

## Not Implemented Or Not Live-Proven

- Live LLM-generated generative UI driven by provider-backed Hermes tool loops.
- Direct manipulation of work objects.
- Broad undo/revert/forgiveness beyond approval gates.
- Persistent user layout/stability preferences.
- Public/create/claim/login/billing/customer portal/admin full alignment to the Avery-first system.
- Pod-like no-fake-data browser proof.
- Accessibility audit of the new visual system.

## Current Acceptance Bar

Do not mark a UX idea accepted because fixture UI looks right. Acceptance needs either local source proof
for UI-only behavior or real provider/runtime proof ids for live employee behavior. Generative UI remains
frontier until a live model produces and resolves real work objects through Manager.
