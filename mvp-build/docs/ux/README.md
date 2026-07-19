# AMTECH UX System

Status: active  
Created: 2026-07-14  
Updated: 2026-07-19  
Audience: UI/product agents working on owner, signed-review, onboarding, public, customer, account/billing, and operator surfaces

This folder is the UX organization layer for AMTECH. It maps current implementation, research, testing, production boundaries, and post-release work. Current source, contracts, executable validation, current architecture, and newest memory outrank older screenshots or handoffs.

## Required orientation

Before UX work:

1. read root/scoped CODEGRAPH and the newest relevant handoff;
2. read `../architecture/README.md`;
3. select the owner UI/UX/generated-view role in `../architecture/11-agent-orientation-and-role-map.md`;
4. review current P1 UX gates in `../architecture/09-current-bug-risk-and-production-gap-register.md`;
5. inspect the actual source, contracts, fixture guard, browser harness, and current diff.

Trajectory artifacts may explain interactions such as focus × load × trust or approval × fatigue, but they cannot justify hidden psychographic inference, change authority, or promote fixture evidence to live acceptance.

## Source order

1. Current source and contracts in `mvp-build/apps`, `mvp-build/packages`, and `mvp-build/infra`.
2. `docs/AMTECH_WEB_DESIGN_SYSTEM.md`, `docs/AMTECH_AGENT_INTERFACE_STANDARD.md`, and `docs/AMTECH_UI_VALIDATION_STANDARD.md`.
3. `../architecture/05-web-client-work-surfaces-and-tool-agnostic-ag-ui.md` for the cross-system Web/materialization/action boundary.
4. This folder for the cross-surface UX map, research ledger, coverage audit, production policy, disposition record, and roadmap.
5. Newest relevant `mvp-build/memory/` handoff and implementation/proof records.
6. Older `mvp-build/ui-redesign/` screenshots and `wiki/MVP/` material as historical context only.

## Reading order

1. `01-aqua-ai-interface-principles.md`
2. `02-current-ux-system-map.md`
3. `03-research-source-ledger.md`
4. `04-implementation-coverage-audit.md`
5. `05-generative-ui-frontier.md`
6. `06-fixture-production-ui-policy.md`
7. `08-speculative-ui-research-disposition.md`
8. `09-hermes-programmatic-integration-and-webui-findings.md`
9. `07-post-release-ui-roadmap.md`

## Current UX thesis

AMTECH is building an AI employee interface, not a SaaS dashboard or transcript shell. The owner experiences one stable operating point whose bounded regions answer:

1. what changed;
2. what is moving;
3. what needs the owner;
4. what the employee is holding for return;
5. what completed and what proves it;
6. what the owner can ask or change now.

The active owner route is composed from guidance, attention, work loops, active saves, system changes, delegated work, evidence, relevant connections, inspectable owner-safe context, and contextual command. Empty regions disappear; typed state and explicit owner preferences may change ordering and density. Authority, approval, evidence, stable landmarks, and accessibility do not adapt away.

Generative UI is source-wired through typed descriptors, `OperatingSurfaceState`, `AdaptiveLayoutPlan`, `SurfaceEnvelope`, `WorkResource`, and sandboxed Manager-compiled `ui://` resources. It is not live-proven until a provider-backed Hermes run drives a real work object through exact owner action, external effect, and durable proof.

## UX coherence contract

The system makes sense only when these interactions remain aligned:

- **state × layout:** bounded source state produces deterministic region order and rationale;
- **risk × prominence:** high-risk, failed, returned, blocked, ambiguous, or revoked work stays visible before low-risk volume;
- **action × authority:** each visible terminal action maps to one current WorkResource action and one durable Manager resource;
- **SSE × strict snapshot:** deltas improve latency while snapshots remain authoritative and failures remain visible;
- **context × explanation:** the owner sees bounded rationale and source, not prompts, private memory, secrets, or implementation jargon;
- **channel × resource:** Web, SMS, and signed Review refer to the same approval/artifact identity;
- **fixture × production:** fixtures exercise the same components but remain labeled and cannot satisfy live proof;
- **adaptation × accessibility:** reordering cannot remove landmarks, break focus, shrink controls, or make motion the only state signal.

## Current research boundary

`08-speculative-ui-research-disposition.md` governs continuous-field, CSG, WebGPU, psychographic, gradient-flow, attention-model, and chain-of-thought proposals.

`09-hermes-programmatic-integration-and-webui-findings.md` governs Hermes protocol choice, third-party WebUI lessons, the verified stdio-only `hermes mcp serve` messaging bridge, operator-adapter scope, and generated-view congruence.

AMTECH keeps explicit mixed-initiative states, risk-scaled prominence, registered components, deterministic adaptive density, visible rationale, reduced-motion-safe transitions, and recovery. It does not use hidden emotion/personality inference, private reasoning, arbitrary generated DOM, or simulation-heavy visual engines on the release path.

## Current P1 UX trajectory

1. align public/create/claim/login/account/billing/customer/admin/artifact surfaces to the Avery system;
2. add concise “why this is here / what happens next” rationale;
3. improve proof refinding by job/customer/action/provider/failure;
4. normalize connector setup, degraded, revoked, and repair states;
5. prove preview/output parity across HTML, PDF, email, signed link, and customer portal;
6. complete keyboard, screen-reader, zoom/reflow, focus-obscuration, contrast, and error-announcement evidence;
7. prove durable progress, interruption, reconnect, and recovery for long-running work;
8. capture one fixture-free provider-backed generated work object and cross-channel owner action.

These are product/acceptance trajectories, not permission to add feature-local authority or a second renderer.

## Non-negotiables

- Production and production-build fixture tests use the same UI routes and components.
- Fixture data is visibly labeled and cannot enter a real production or staging environment. A narrowly named CI-only production-build fixture mode may exist solely to test compiled assets and must fail closed outside that exact tuple.
- Owner UI does not expose implementation vocabulary such as MCP, tool call, payload, schema, envelope, RLS, bearer token, or webhook unless a bounded expert/support view specifically requires it.
- Customer-facing, money, publishing, protected sharing, credential, and durable external writes require exact authority and approval moments.
- Screenshots prove fixture rendering only. Live acceptance requires fixture-free browser/channel, provider/runtime, receipt, and deployment proof IDs on one exact SHA.
- Adaptive layout uses explicit settings and owner-safe typed state. It never infers emotion, vulnerability, fatigue, personality, persuasion susceptibility, or private chain-of-thought.
- Generated UI is presentation. The host resolves current durable resources and intersects all intents with current actions.
