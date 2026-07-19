# AMTECH UX System

Status: active  
Created: 2026-07-14  
Updated: 2026-07-19  
Audience: UI/product agents working on the AMTECH owner, signed-review, onboarding, public, and operator surfaces

This folder is the UX organization layer for AMTECH. It maps current implementation, research, testing, production boundaries, and post-release work. Current source, contracts, executable validation, and newest memory outrank older screenshots or handoffs.

## Source Order

1. Current source and contracts in `mvp-build/apps`, `mvp-build/packages`, and `mvp-build/infra`.
2. `docs/AMTECH_WEB_DESIGN_SYSTEM.md`, `docs/AMTECH_AGENT_INTERFACE_STANDARD.md`, and `docs/AMTECH_UI_VALIDATION_STANDARD.md`.
3. This folder for the cross-surface UX map, research ledger, coverage audit, production policy, disposition record, and roadmap.
4. Newest relevant `mvp-build/memory/` handoff and implementation/proof records.
5. Older `mvp-build/ui-redesign/` screenshots and `wiki/MVP/` material as historical context only.

## Reading Order

1. `01-aqua-ai-interface-principles.md`
2. `02-current-ux-system-map.md`
3. `03-research-source-ledger.md`
4. `04-implementation-coverage-audit.md`
5. `05-generative-ui-frontier.md`
6. `06-fixture-production-ui-policy.md`
7. `08-speculative-ui-research-disposition.md`
8. `07-post-release-ui-roadmap.md`

## Current UX Thesis

AMTECH is building an AI employee interface, not a SaaS dashboard or transcript shell. The owner experiences one stable operating point whose bounded regions answer:

1. what changed;
2. what is moving;
3. what needs the owner;
4. what the employee is holding for return;
5. what completed and what proves it;
6. what the owner can ask or change now.

The active owner route is composed from guidance, attention, work loops, active saves, system changes, delegated work, evidence, relevant connections, inspectable owner-safe context, and contextual command. Empty regions disappear; typed state and explicit owner preferences may change ordering and density. Authority, approval, evidence, stable landmarks, and accessibility do not adapt away.

Generative UI remains the highest-upside frontier. It is source-wired through typed descriptors, `OperatingSurfaceState`, `AdaptiveLayoutPlan`, `SurfaceEnvelope`, `WorkResource`, and sandboxed MCP-UI resources, but is not live-proven until a provider-backed Hermes run drives a real work object through owner action and external proof.

## Current Research Boundary

`08-speculative-ui-research-disposition.md` is the governing decision record for the continuous-field, CSG, WebGPU, psychographic, gradient-flow, attention-model, and chain-of-thought proposals.

AMTECH keeps explicit mixed-initiative states, risk-scaled prominence, registered components, deterministic adaptive density, visible rationale, reduced-motion-safe transitions, and recovery. It does not use hidden emotion/personality inference, private reasoning, arbitrary generated DOM, or simulation-heavy visual engines on the Tuesday release path.

## Non-Negotiables

- Production and production-build fixture tests use the same UI routes and components.
- Fixture data is visibly labeled and cannot enter a real production or staging environment. A narrowly named CI-only production-build fixture mode may exist solely to test compiled assets and must fail closed outside that exact tuple.
- Owner UI does not expose implementation vocabulary such as MCP, tool call, payload, schema, envelope, RLS, bearer token, or webhook unless a bounded expert/support view specifically requires it.
- Customer-facing, money, publishing, protected sharing, credential, and durable external writes require exact authority and approval moments.
- Screenshots prove fixture rendering only. Live acceptance requires fixture-free browser/channel, provider/runtime, receipt, and deployment proof IDs on one exact SHA.
- Adaptive layout uses explicit settings and owner-safe typed state. It never infers emotion, vulnerability, fatigue, personality, persuasion susceptibility, or private chain-of-thought.
