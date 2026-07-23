# UI Lab Live Workbench

Status: active canonical UI-Lab architecture and operating guide  
Updated: 2026-07-22  
Task: `AMTECH-UI-LAB-001`

## Purpose

UI Lab is the standard development and review environment for AMTECH employee Web experiences. It provides production-faithful rendering, rapid live iteration, deterministic fixture states, named immutable UI versions, human review, and controlled assignment to employee/profile selectors.

It exists because a complete employee experience is larger than a component story. The relevant unit includes route composition, Talk and Workspace behavior, fixture runtime transitions, adapters, presentation strategies, viewports, loading and failure states, and accessibility behavior.

UI Lab does not replace the Web application. It runs inside it.

## Architecture

```text
Next development server with Fast Refresh
│
├─ /ui-lab
│   └─ scenario and preset index
│
├─ /ui-lab/[scenario]
│   └─ UiLabWorkbenchClient
│       ├─ scenario controls
│       ├─ adapter and presentation controls
│       ├─ viewport controls
│       ├─ immutable preset browser
│       ├─ local draft capture
│       ├─ fixture interaction controls
│       └─ same-origin iframe
│
└─ /ui-lab/preview/[scenario]
    └─ ProductionFixtureLabClient
        └─ EmployeeUiPortHost
            ├─ LiveEmployeeOperatingShell + CapabilityDrawer
            └─ AgentSurface with deterministic fixture payload
```

The iframe is an isolation boundary for viewport and styling, not a separate application. It runs the same Next build graph and production components.

## Why this architecture

### Fast Refresh instead of repeated production builds

Next development mode updates React, TypeScript, and CSS during editing. The standard collaborator loop is therefore:

```text
edit source → compile changed module → refresh preview
```

Production builds remain merge and release evidence, not the ordinary visual feedback loop.

### Full-route fixture workbench instead of Storybook as the primary system

Storybook's isolated canvas, controls, and named states are useful patterns. AMTECH applies those patterns to the real application because complete employee behavior crosses route, fixture runtime, layout, adapter, and interaction boundaries. Storybook may still become useful for small isolated atoms, but it is not the canonical employee-experience workbench.

### Source-controlled presets instead of localStorage or a database

A reusable UI version must identify both configuration and source. Presets therefore live in Git as immutable JSON and record the source commit, branch, dirty state, changed paths, scenario, review viewports, adapter, strategies, and intended selectors.

A database would add runtime infrastructure to a source-authoring workflow. LocalStorage would be easy to lose, impossible to review, and unable to prove which React/CSS source produced a design.

## Port, adapter, strategy, preset, assignment

- **Port:** the stable employee UI contract consumed by a Web experience.
- **Adapter:** a high-level purposeful Web experience: `owner_web`, `public_form`, or `boundless_website`.
- **Strategy:** theme, layout, component set, density, and brand-token choices inside an adapter.
- **Preset:** an immutable named version of adapter plus strategies and source provenance.
- **Assignment:** a mapping from an approved preset to profile keys, business kinds, or employee types.

Do not create an adapter for a color change. Do not create a page fork for each employee archetype. Use the smallest adequate layer.

## Preset lifecycle

### Draft capture

The workbench may save a draft while source is dirty. It creates the next immutable version and records changed paths. Such a version is useful for comparison but is non-reproducible and cannot be assigned.

### Candidate review

A collaborator compares versions through stable preset references and review links across desktop, tablet, mobile, responsive, full-owner-client, and focused-workspace modes.

### Validation

Before approval, run:

```bash
npm run ui:lab:registry:validate
npm run test:ui:contracts
node scripts/verify-ui-architecture.mjs
npm run ui:lab:test
npm run ui:validate
```

The browser evidence must identify exact Git SHA, preset, scenario, viewport, adapter, strategies, fixture source, and evidence class.

### Human approval and promotion

Promotion is deliberately outside the browser. It requires:

- clean Git worktree;
- exact-head passing evidence;
- human reviewer identity;
- at least one assignment selector;
- a new immutable approved preset version;
- regenerated runtime assignment registry.

A green test suite cannot determine visual quality. The human review remains a first-class release input.

### Assignment

Approved presets can be assigned to:

- profile package keys;
- normalized business kinds;
- employee types.

Runtime selection order is:

```text
explicit presentation override
→ approved preset assignment for selected adapter
→ generated profile hint
→ business/profile heuristic
→ adapter default
```

Assignments are generated into TypeScript so production rendering does not read repository files at runtime.

## Collaborator workflow

```bash
cd mvp-build
npm install
npm run local:browser-install
npm run ui:lab:open
```

Then:

1. choose a representative fixture scenario;
2. choose or clone a named preset;
3. edit normal React/CSS/shared source with an editor or coding agent;
4. inspect immediate preview updates;
5. exercise runtime transitions and viewports;
6. save versions worth comparing;
7. copy a stable review link;
8. commit the selected source;
9. run validation and browser evidence;
10. ask the product owner to approve and assign the preset.

UI Lab does not include or depend on a coding agent. It provides the deterministic application, scripts, routes, data, and evidence surfaces any coding agent needs.

## Repository write boundary

The browser save route is allowed only under this conjunction:

```text
fixture mode
AND development mode
AND explicit AMTECH_UI_LAB_WRITE flag
AND loopback request host
AND same-origin request
AND validated preset payload
AND derived preset path
AND exclusive create
```

The browser cannot:

- choose arbitrary filesystem paths;
- overwrite a version;
- edit source code;
- approve or assign a preset;
- write in production-like environments;
- write to a database or remote service.

## Validation space

UI Lab validation spans:

```text
scenario
× adapter
× preset
× theme
× layout
× component set
× density
× viewport
× runtime state
× reduced-motion/accessibility condition
× network/reconnect condition where supported
× evidence class
```

Do not execute the unrestricted Cartesian product on every change. Use:

- focused explicit pass/fail vectors for critical states;
- one smoke vector for every approved preset;
- pairwise or constrained covering arrays for broad interactions;
- mobile and desktop golden combinations for commercial presets;
- human review for visual quality;
- controlled-runner screenshot baselines only where stable.

## Second-order effects

### Product-line capability

Approved presets turn recurring UI designs into versioned product assets. A marketing-agency and an e-commerce employee can share one preset, use different presets, or receive a custom override without copying the entire page.

### Faster parallel design work

Collaborators can work against deterministic fixtures without provisioning runtimes or rebuilding production images. This increases parallelism but also increases merge pressure in shared styles and component registries. New variants should remain scoped and statically registered.

### Better review language

Feedback can reference `marketing-agency@v0003` instead of an ambiguous screenshot or branch. Source provenance prevents a chosen visual state from becoming detached from the code that produced it.

### Larger validation obligation

Every approved adapter/preset combination creates responsive, accessibility, loading, error, and maintenance obligations. Approval should be selective; draft proliferation is acceptable, assignment proliferation is not.

## Third-order effects

### Lightweight software product line

The preset and assignment system becomes a bounded software-product-line mechanism. It should remain source-owned and registry-driven. Do not let it drift into an unrestricted low-code renderer without evidence that such complexity improves employee UI quality.

### Customer-specific lifecycle

Custom designs create future migration, deprecation, support, and fallback obligations. Preset references must remain immutable, assignments explicit, and deprecated versions retained for audit and rollback.

### Experimentation platform

Stable fixture/preset/view links make controlled UI experiments possible. Experimental evidence must remain separate from production acceptance and must not automatically alter customer assignments.

## Evidence boundaries

UI Lab can establish:

- source architecture;
- schema and resolver behavior;
- fixture runtime behavior;
- compiled browser rendering;
- responsive and accessibility mechanics;
- reproducible UI version provenance;
- deliberate human visual approval.

UI Lab cannot establish:

- live provider correctness;
- real customer data isolation;
- managed database behavior;
- target-host deployment;
- production performance;
- commercial acceptance;
- pilot or production readiness.

## Canonical files

- `ui-lab/README.md`
- `ui-lab/AGENTS.md`
- `decision/trace012/research-and-decision-record.md`
- `decision/trace012/validation-vectors.json`
- `decision/trace012/affected-files.json`
- `decision/trace012/script-inventory.json`
- `docs/adr/ADR-010-employee-ui-port-and-web-presentation-adapters.md`
- `scripts/ui-lab-dev.mjs`
- `scripts/ui-lab-registry.mjs`
- `infra/scripts/ui/fixture-browser-v2.mjs`
