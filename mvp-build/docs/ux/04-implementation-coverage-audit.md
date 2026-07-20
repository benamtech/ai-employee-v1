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
- Generated views use the exhaustive typed renderer registry and the canonical light AMTECH design tokens, red primary actions, 44px controls, visible focus, and reduced-motion behavior.
- Bounded logarithmic layout scoring and deterministic planner parity prevent high-volume low-risk events or duplicate planner implementations from monopolizing or destabilizing the surface.
- A research-employee fixture represents question, source trail, competing claims, monitoring, delegated review, synthesis, contradiction, and evidence.
- UI fixture smoke and durable packet screenshots.
- Fixture-mode guard rejects fake data in production-like environments by default.
- The browser matrix compiles and launches the standalone production Next server for production-build evidence; product-shell and fixture matrices retain exact-head artifacts.
- The Web resources proxy rejects a successful Manager response that omits `operating_state`, preventing production protocol drift from becoming a plausible local fallback surface.
- Canonical UI standards and machine-readable validation vectors distinguish source wiring, fixture demonstration, and live proof.

## Partial

- Aqua-inspired visual system: present in the owner route and generated work resources, not all product surfaces.
- Feedback/progress: basic message, SSE work-progress, acceptance/ambiguity, and recovery feedback exist; durable long-running progress and operator interruption/recovery explanation need broader live design proof.
- Proof refinding: Proof/evidence rendering exists, but search/filter and proof-by-job/customer/action are immature.
- Connected account capability: owner-readable cards exist; setup, consent, degraded, revoked, and repair flows need expansion and cross-provider consistency.
- Context engineering as UX: source-wired context signals, rationale codes, owner-safe context panel, and doctrine versions exist, but owner explanation of why a region appeared and what the employee will do next remains thin.
- WYSIWYG: approval previews and typed resources exist, but output parity across HTML, PDF, signed link, email, and customer portal needs exact-content proof.
- Accessibility: global focus, 44px critical controls, no-overflow checks, and reduced-motion foundations exist; focus-obscuration, complete keyboard sequence, screen-reader semantics, and full manual WCAG 2.2 AA evidence remain incomplete.
- Public/create/claim/login/account/billing/customer portal/admin/artifact surfaces do not yet share one complete Avery visual and interaction language.
- Adaptive preference persistence: explicit owner experience/density values are consumed when present, but a complete owner-facing settings and stability contract is not live-proven.

## Not Implemented Or Not Live-Proven

- Live LLM-generated generative UI driven by provider-backed Hermes tool loops.
- Provider-backed proof that a generated surface maps to the intended approval/action and resulting external proof.
- Human-readable explanation of why each generated surface appeared, which source facts shaped it, and what Avery will do next.
- Direct manipulation of work objects.
- Broad undo/revert/forgiveness beyond approval gates and repair/reconciliation paths.
- Persistent explicit user layout/stability preferences with migration and cross-device behavior.
- Public/create/claim/login/billing/customer portal/admin full alignment to the Avery-first system.
- Pod-like no-fake-data browser proof.
- Full automated and manual WCAG 2.2 AA audit.
- Fixture-free research, ecommerce, growth, and multi-role operating-surface packets.
- Deployed proof that browser, reverse-proxy, and application logs never expose the owner session bearer.
- Live target-host proof that Caddy host networking reaches Web, Manager, and each loopback-published employee runtime.

## UX Coherence Tests

The owner system makes sense only when all of these interactions hold together:

1. **State × layout:** the same bounded state produces the same region order, focus, and rationale.
2. **Risk × prominence:** high-risk, returned, failed, blocked, ambiguous, or revoked work remains visible before low-risk volume.
3. **Action × authority:** every visible terminal action maps to one current WorkResource action and one Manager-owned durable resource.
4. **Live delta × snapshot:** SSE improves latency, while strict snapshots remain authoritative and failures remain visible.
5. **Context × explanation:** the owner can inspect business/runtime context without seeing secrets, raw provider payloads, private memory, or implementation jargon.
6. **Channel × resource:** Web, SMS, and signed Review refer to the same approval/artifact identity.
7. **Fixture × production:** fixtures exercise the same routes/components but are visibly labeled and cannot satisfy live acceptance.
8. **Accessibility × adaptation:** reordering cannot remove landmarks, create focus loss, shrink controls, or make motion the only state signal.

## Research Disposition

`08-speculative-ui-research-disposition.md` is the active decision record for the continuous-field, CSG, WebGPU, psychographic, gradient-flow, attention-model, and chain-of-thought proposals.

The production architecture keeps explicit mixed-initiative states, risk-scaled prominence, typed region composition, visible provenance, stable components, bounded adaptive density, reduced-motion behavior, and recovery. It rejects hidden psychographic inference, private-reasoning inspection, and simulation-heavy rendering from the Tuesday path.

## Current Acceptance Bar

Do not mark a UX idea accepted because fixture UI looks right. Acceptance needs:

1. source and contract proof for deterministic UI-only behavior;
2. production build and standalone production-server browser evidence for the fixture/product-shell matrix;
3. accessibility, responsive, keyboard, target-size, focus, and reduced-motion evidence;
4. real provider/runtime proof IDs for live employee behavior;
5. exact assignment, approval, C3, receipt, revocation, context-version, runtime-revision, and deployed-SHA agreement;
6. one provider-backed typed generated work object through owner action and external receipt;
7. fixture-free owner Web, SMS, and signed Review proof on the exact deployed release.

Generative UI remains frontier until a provider-backed Hermes run receives real or production-like business context, emits a typed work view through Manager, renders without fixture data, routes the owner action through the same approval/proof path, and leaves auditable proof IDs.
