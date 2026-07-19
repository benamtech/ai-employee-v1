# UX Implementation Coverage Audit

Status: active  
Updated: 2026-07-19  
Purpose: state what is implemented, partial, or still missing

## Implemented On The Integration Branch

- Avery-first owner route built from guidance, attention, work loops, active saves, system changes, delegated work, evidence, connections, context, and contextual command.
- Inline exact review for the first active approval.
- Signed mobile Review aligned with the same work/action model.
- `ResourcePayload`, `OperatingContextManifest`, `OperatingSurfaceState`, `AdaptiveLayoutPlan`, `WorkResource`, `WorkAction`, `SurfaceEnvelope`, `ConnectionSurface`, `CapabilityGraphNode`, and `ResurfaceItem` are preserved.
- Manager-compiled MCP-UI `ui://` resources with sandboxed iframe rendering and host-routed intents.
- Bounded logarithmic layout scoring prevents high-volume low-risk events from monopolizing the surface.
- A research-employee fixture represents question, source trail, competing claims, monitoring, delegated review, synthesis, contradiction, and evidence.
- UI fixture smoke and durable packet screenshots.
- Fixture-mode guard rejects fake data in production-like environments by default.
- Canonical UI standards and machine-readable validation vectors distinguish source wiring, fixture demonstration, and live proof.

## Partial

- Adaptive layout: typed and bounded, but focus selection can still depend on input order and material returned saves/delegated failures need stronger explicit priority tests.
- Aqua-inspired visual system: present in the owner route, not all product surfaces.
- Generated MCP-UI template: action grammar, escaping, approval binding, sandbox, and fallback exist, but `apps/manager/src/lib/ui-resources.ts` still carries an independent legacy dark-mode media query and blue primary action. It must be aligned to the light Avery system and AMTECH red without moving trust decisions into model-authored HTML.
- Feedback/progress: basic message/status feedback exists; durable progress for long-running work needs design.
- Proof refinding: Proof/evidence rendering exists, but search/filter and proof-by-job are immature.
- Connected account capability: owner-readable cards exist; setup/repair flows need expansion.
- Context engineering as UX: source-wired substrate and rationale codes exist, but owner explanation remains thin.
- WYSIWYG: approval previews exist, but output parity across HTML, PDF, signed link, email, and customer portal needs proof.
- Accessibility: global focus and reduced-motion foundations exist; critical-control target size, focus-obscuration, keyboard sequence, and screen-reader behavior need executable browser evidence.
- Browser pipeline: the fixture matrix is useful, but currently launches `next dev`; it does not yet prove the compiled production server.

## Not Implemented Or Not Live-Proven

- Live LLM-generated generative UI driven by provider-backed Hermes tool loops.
- Provider-backed proof that a generated surface maps to the intended approval/action and resulting external proof.
- Human-readable explanation of why the generated surface appeared and what Avery will do next.
- Direct manipulation of work objects.
- Broad undo/revert/forgiveness beyond approval gates.
- Persistent explicit user layout/stability preferences.
- Public/create/claim/login/billing/customer portal/admin full alignment to the Avery-first system.
- Pod-like no-fake-data browser proof.
- Full automated and manual WCAG 2.2 AA audit.
- Fixture-free research, ecommerce, and growth operating-surface packets.

## Research Disposition

`08-speculative-ui-research-disposition.md` is the active decision record for the continuous-field, CSG, WebGPU, psychographic, gradient-flow, attention-model, and chain-of-thought proposals.

The production architecture keeps explicit mixed-initiative states, risk-scaled prominence, typed region composition, visible provenance, stable components, bounded adaptive density, reduced-motion behavior, and recovery. It rejects hidden psychographic inference, private-reasoning inspection, and simulation-heavy rendering from the Tuesday path.

## Current Acceptance Bar

Do not mark a UX idea accepted because fixture UI looks right. Acceptance needs:

1. source and contract proof for deterministic UI-only behavior;
2. production build and production-server browser evidence for the fixture matrix;
3. accessibility, responsive, keyboard, target-size, and reduced-motion evidence;
4. real provider/runtime proof IDs for live employee behavior;
5. exact assignment, approval, C3, receipt, revocation, and context-version agreement on one exact SHA.

Generative UI remains frontier until a provider-backed Hermes run receives real or production-like business context, emits a typed work view through Manager, renders without fixture data, routes the owner action through the same approval/proof path, and leaves auditable proof IDs.
