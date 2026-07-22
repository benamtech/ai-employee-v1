# AMTECH UX System

Status: active  
Updated: 2026-07-22  
Audience: UI/product contributors and coding agents working on employee, onboarding, public, customer, account, review, generated-view, and operator surfaces

This folder is the active UX organization layer. Current source, typed contracts, exact-head tests, browser evidence, and the current architecture map outrank older screenshots, handoffs, and speculative design notes.

## Required orientation

Before UI or UX work:

1. read root and scoped `AGENTS.md` and `CODEGRAPH.md`;
2. read `02-current-ux-system-map.md`;
3. for employee presentation or UI Lab work, read `../../ui-lab/AGENTS.md` and `10-ui-lab-live-workbench.md`;
4. read `../adr/ADR-010-employee-ui-port-and-web-presentation-adapters.md`;
5. inspect the actual route, component, fixture, preset, script, test, and current diff;
6. resolve the current evidence class before making a claim.

## Source order

1. Executable source and contracts in `apps/`, `packages/`, `infra/`, `scripts/`, and `tests/`.
2. `docs/AMTECH_WEB_DESIGN_SYSTEM.md`, `docs/AMTECH_AGENT_INTERFACE_STANDARD.md`, and `docs/AMTECH_UI_VALIDATION_STANDARD.md`.
3. `02-current-ux-system-map.md` and `10-ui-lab-live-workbench.md`.
4. `../architecture/05-web-client-work-surfaces-and-tool-agnostic-ag-ui.md` for cross-system Web/materialization boundaries.
5. `../../decision/trace012/**` for UI Lab decisions, vectors, affected files, and scripts.
6. Newest relevant `memory/` implementation handoff.
7. Older `ui-redesign/`, archived handoffs, screenshots, and wiki material as historical context only.

## Reading order

1. `01-aqua-ai-interface-principles.md`
2. `02-current-ux-system-map.md`
3. `10-ui-lab-live-workbench.md`
4. `03-research-source-ledger.md`
5. `04-implementation-coverage-audit.md`
6. `05-generative-ui-frontier.md`
7. `06-fixture-production-ui-policy.md`
8. `08-speculative-ui-research-disposition.md`
9. `09-hermes-programmatic-integration-and-webui-findings.md`
10. `07-post-release-ui-roadmap.md`

## Current UX thesis

AMTECH is an AI employee interface, not one fixed dashboard and not one page fork per employee type.

One employee UI port supports high-level Web adapters:

- authenticated owner Web client;
- public bounded form/conversation;
- employee-dominant public website.

Inside an adapter, presentation strategies select theme, layout, component set, density, and brand tokens. Approved UI Lab presets can assign those strategies to profile, business-kind, or employee-type selectors.

The loaded employee data and runtime projection remain available while presentation can vary from a color-only theme change to a materially different registered React component set.

## UI Lab thesis

UI Lab is the standard production-faithful design workbench:

- real Next application;
- production employee components;
- deterministic fixtures;
- isolated same-origin preview canvas;
- Fast Refresh for live iteration;
- named immutable preset versions;
- Git provenance;
- human review;
- controlled promotion and assignment.

UI Lab is not a second frontend, not a production runtime, and not aesthetic automation.

## UX coherence contract

The system remains coherent when these relationships hold:

- **employee data × presentation:** presets change display, not the underlying loaded employee payload;
- **adapter × purpose:** a new adapter requires a meaningfully different high-level Web experience;
- **strategy × scope:** themes/layouts/components stay scoped and do not leak into unrelated routes;
- **preset × source:** every reusable version records the source that produced it;
- **approval × reproducibility:** only clean exact-source, tested, human-approved presets can be assigned;
- **fixture × evidence:** fixture rendering cannot satisfy live or production acceptance;
- **viewport × accessibility:** variation cannot remove keyboard access, focus, labels, contrast, target size, or reduced-motion behavior;
- **workbench × preview:** workbench chrome must not contaminate preview viewport or styling;
- **generated view × host:** embedded generated views remain bounded and sandboxed.

## Standard commands

```bash
npm run ui:lab:doctor
npm run ui:lab
npm run ui:lab:registry:validate
npm run test:ui:contracts
node scripts/verify-ui-architecture.mjs
npm run ui:lab:test
npm run ui:validate
```

Final merge evidence remains `npm run repo:merge:check` and exact-head CI.

## Evidence labels

- source-inferred;
- unit-contract verified;
- fixture-render verified;
- compiled-browser verified;
- human visually approved;
- live observed;
- production accepted.

Do not collapse these labels.

## Non-negotiables

- Production components and fixture browser tests share the same route/component implementation.
- UI Lab is denied in normal production-like environments.
- Browser repository writes are limited to validated immutable draft preset creation on loopback development.
- Approval and assignment require CLI/review, clean Git provenance, passing evidence, and a human reviewer.
- Generated runtime assignment files are never hand-edited.
- No hidden psychographic inference, private reasoning display, arbitrary generated DOM, or unrestricted low-code renderer enters the release path.
- A screenshot or green browser test is not production evidence and is not aesthetic approval.
