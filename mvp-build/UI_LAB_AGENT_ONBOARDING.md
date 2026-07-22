# AMTECH UI Variant Collaborator Onboarding

Status: active folder-first workflow  
Repository: `benamtech/ai-employee-v1`  
Branch: `agent/employee-ui-port-adapters-current`

## Standard

A UI variant is a directory that receives the complete neutral employee experience model and may invent any frontend appearance or interaction grammar without importing private application internals.

Capability and information fidelity to the normal Web client are required. Visual, structural, terminology, navigation, DOM, component, and layout similarity are not.

```text
normal Web-client capabilities ⊂ UI variant capability space
```

The production Web client is available only as optional `slots.reference_client` evidence. It is not the visual template.

## Environment-adaptive setup contract

The coding agent preparing the workspace must first inspect the real environment: operating system, architecture, shell, Git, Node.js, npm, browser tooling, repository state, permissions, and whether the checkout already contains work.

The setup method is environment-specific. The required end state is not:

```text
repository available locally
+ exact branch checked out
+ Node.js >= 20 and npm available
+ mvp-build dependencies installed
+ UI test browser available
+ UI variant doctor passing
+ collaborator launcher runnable
```

Safety invariants:

- never run an unattended operating-system upgrade;
- never overwrite, clean, reset, stash, or pull over user work;
- do not assume macOS, Windows, Linux, WSL, a container, or a particular package manager;
- use the host's normal installation mechanism and explain any machine-level change;
- reuse working prerequisites rather than reinstalling them;
- install or repair browser tooling only when evidence shows it is missing or broken;
- preserve the exact branch and report any inability to fast-forward safely.

The non-technical handoff prompt is maintained at repository root in `UI_VIBE_QUICKSTART.md`.

## Canonical preparation and preflight

Once the repository and runtime are ready, run from `mvp-build`:

```bash
npm install
npm run local:browser-install
node scripts/ui-variant.mjs doctor
```

`npm run local:browser-install` is a bootstrap or repair operation, not a mandatory repeat-session operation. On later sessions, synchronize dependencies only when the lockfile or installed dependency state requires it, then run the doctor.

## Launch

Launch the complete collaborator environment from `mvp-build`:

```bash
node scripts/ui-variant-collaborator.mjs my-first-variant --agent claude
```

Alternatives:

```bash
node scripts/ui-variant-collaborator.mjs my-first-variant --agent codex
node scripts/ui-variant-collaborator.mjs my-first-variant --agent cursor
node scripts/ui-variant-collaborator.mjs my-first-variant --agent none
```

When the outer coding agent is already controlling the terminal, prefer `--agent none`; the outer agent should then continue inside the generated variant folder. This avoids launching a nested agent unnecessarily.

Use another deterministic scenario when needed:

```bash
node scripts/ui-variant-collaborator.mjs my-first-variant --agent none --scenario contractor
```

The launcher:

1. creates the variant folder if absent;
2. writes local Claude, Codex, and Cursor instructions;
3. validates the folder and manifest;
4. generates literal lazy imports for Next.js;
5. starts UI Lab, TypeScript watchers, and the variant watcher;
6. opens the exact live route;
7. optionally launches the selected coding agent with the variant folder as its working directory.

Default route:

```text
http://127.0.0.1:3000/ui-lab/variant/my-first-variant/clothing-ops
```

Gallery:

```text
http://127.0.0.1:3000/ui-lab/variants
```

## Folder boundary

During an ordinary design session the agent may write only here:

```text
apps/web/ui-variants/<variant-slug>/
```

A scaffold contains:

```text
<variant-slug>/
├── variant.json
├── index.tsx
├── styles.module.css
├── TASK.md
├── instructions.md
├── AGENTS.md
├── CLAUDE.md
└── .cursor/rules/ui-variant.mdc
```

The agent may add local files and folders beneath that directory, including components, assets, workers, shaders, generated art data, and WASM glue. It must not modify files outside the directory during an ordinary design session.

## Standardized boundary

The boundary standardizes only:

- folder identity and discovery;
- the `variant.json` manifest;
- one versioned `EmployeeExperienceModelV1` input;
- one bounded intent dispatcher;
- one optional production reference-client slot;
- declared browser/runtime features;
- dependency and import boundaries;
- performance containment policy;
- validation, evidence, and promotion gates.

It does not standardize visual style, page structure, HTML choices, navigation grammar, cards, panels, tabs, rails, chat bubbles, dashboards, CSS methodology, terminology, or information order.

## Neutral model

Read the public contract before editing:

```text
apps/web/ui-variants/contract.ts
packages/shared/src/ui-variant.ts
```

The model includes identity, business/profile context, presentation context, runtime and recovery state, conversation, work loops and tasks, approvals and decisions, waiting and return conditions, changes, connections, abilities and capabilities, evidence, outputs, bounded interaction intents, and fixture/evidence metadata.

A variant may reorganize, transform, summarize, hide, or visually reinterpret these fields. It cannot fetch additional product data, import route internals, fabricate unavailable capabilities, or bypass the intent bridge.

## Files to read

Inside the variant folder:

```text
TASK.md
instructions.md
variant.json
index.tsx
styles.module.css
../contract.ts
```

For broader read-only context:

```text
UI_LAB_AGENT_ONBOARDING.md
apps/web/app/_components/ui-variant/UiVariantHost.tsx
apps/web/app/_components/ui-variant/buildEmployeeExperienceModel.ts
apps/web/app/_components/ui-variant/registry.generated.ts
apps/web/app/ui-lab/variant/[variant]/[scenario]/VariantFixtureLabClient.tsx
apps/web/app/agent/[employeeId]/fixture-runtime.ts
packages/shared/src/resource-payload.ts
packages/shared/src/operating-system.ts
```

Do not edit the generated registry manually.

## Collaborator levels

A first-time vibe coder should primarily edit `index.tsx`, `styles.module.css`, and `TASK.md`. Describe the desired composition, references, and what should feel different. Ask the agent to test one visual hypothesis at a time.

Example creative prompt:

```text
Read all local instruction files. Turn this employee experience into an expressive editorial control room for a small creative studio. It must not resemble a SaaS dashboard. Preserve all important work, waiting, approval, output, and recovery information. Work only in this folder. Check desktop and mobile and run the local validation command before stopping.
```

A product or UX designer may use local React components, CSS Modules, SVG, container queries, interaction state, and the intent bridge.

An advanced frontend or creative technologist may declare `canvas_2d`, `webgl`, `webgpu`, `web_worker`, `wasm`, `audio`, or `video` in the manifest. These tools do not grant product API, filesystem, storage, or network access.

## Manifest and dependencies

`variant.json` declares compatibility, not appearance. Adding package dependencies requires a maintainer decision. An ordinary variant agent must not change package files.

## Commands

Run from `mvp-build`:

```bash
node scripts/ui-variant.mjs new <slug>
node scripts/ui-variant.mjs validate <slug>
node scripts/ui-variant.mjs validate
node scripts/ui-variant.mjs generate
node scripts/ui-variant.mjs watch
node scripts/ui-variant.mjs list
node scripts/ui-variant.mjs prompt <slug>
node scripts/ui-variant.mjs doctor
npm run ui:lab:open
```

After each coherent iteration, from inside the variant folder:

```bash
node ../../../../scripts/ui-variant.mjs validate <variant-slug>
```

Before review, from `mvp-build`:

```bash
node scripts/ui-variant.mjs doctor
npm run build --workspace @amtech/shared
npm run typecheck --workspace @amtech/web
npm run test:ui:contracts
npm run ui:lab:test:headed
```

Test at minimum:

- desktop and mobile;
- active work;
- waiting or needs-you state;
- heartbeat interruption or stall;
- recovery;
- empty or quiet state when applicable;
- keyboard focus and reduced motion;
- long labels and multiple work items.

## Enforced safety and performance

The validator rejects imports escaping the folder except the public `../contract` module, undeclared packages, Node/server modules, direct network access, ambient browser storage, undeclared Worker or WASM use, invalid manifest identity, and stale generated registry state.

The host provides a lazy-loaded chunk per variant, React Suspense, CSS containment, an inline-size query container, deterministic fixture data, a bounded interaction bridge, and the production client as an optional slot.

## Promotion boundary

A folder marked `experiment` or `lab_only` is not a product assignment. Promotion requires manifest and import-boundary success, shared/Web TypeScript success, browser-matrix evidence, capability coverage review, desktop/mobile/accessibility review, a clean exact Git SHA, deliberate human approval, and explicit assignment.

The variant agent must not promote or assign itself.

## Expected completion report

```text
Objective completed:
Variant folder:
Scenario(s) tested:
Visual hypothesis implemented:
Files changed:
Capabilities represented or intentionally omitted:
Desktop result:
Mobile result:
Runtime states exercised:
Advanced browser features used:
Commands run:
Passing checks:
Machine-level changes made during setup:
Remaining uncertainty:
No files outside the variant folder changed.
No promotion or assignment performed.
```