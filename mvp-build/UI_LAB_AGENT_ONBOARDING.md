# AMTECH UI Variant Collaborator Onboarding

Status: active folder-first workflow  
Repository: `benamtech/ai-employee-v1`  
Branch: `agent/employee-ui-port-adapters-current`

## The standard in one sentence

**A UI variant is a directory that receives the complete neutral employee experience model and may invent any frontend appearance or interaction grammar without importing private application internals.**

Capability and information fidelity to the normal Web client are required. Visual, structural, and layout similarity are not.

```text
normal Web-client capabilities ⊂ UI variant capability space
```

The production Web client is available as an optional `slots.reference_client` reference implementation. It is not the visual template.

## Fastest complete path on Manjaro

Install system dependencies:

```bash
sudo pacman -Syu --needed git nodejs npm base-devel \
  nss atk at-spi2-core cups libdrm dbus libxkbcommon mesa \
  pango cairo alsa-lib gtk3 xdg-utils
```

Clone and prepare the exact branch:

```bash
mkdir -p "$HOME/src"
cd "$HOME/src"
git clone https://github.com/benamtech/ai-employee-v1.git
cd ai-employee-v1
git fetch origin
git switch --track origin/agent/employee-ui-port-adapters-current
cd mvp-build
npm install
npm run local:browser-install
node scripts/ui-variant.mjs doctor
```

Install one coding agent:

```bash
# Claude Code
npm install -g @anthropic-ai/claude-code
claude doctor

# OR OpenAI Codex CLI
npm install -g @openai/codex

# OR install Cursor/Cursor CLI using Cursor's current installer
```

Launch the complete collaborator environment:

```bash
node scripts/ui-variant-collaborator.mjs my-first-variant --agent claude
```

Alternatives:

```bash
node scripts/ui-variant-collaborator.mjs my-first-variant --agent codex
node scripts/ui-variant-collaborator.mjs my-first-variant --agent cursor
node scripts/ui-variant-collaborator.mjs my-first-variant --agent none
```

The command:

1. creates the variant folder if it does not exist;
2. writes local Claude, Codex, and Cursor instructions;
3. validates the folder and manifest;
4. generates literal lazy imports for Next.js;
5. starts the UI Lab, TypeScript watchers, and variant watcher;
6. opens the exact live route;
7. launches the selected coding agent with its working directory set to the variant folder.

Default live route:

```text
http://127.0.0.1:3000/ui-lab/variant/my-first-variant/clothing-ops
```

Use another deterministic scenario:

```bash
node scripts/ui-variant-collaborator.mjs my-first-variant --agent claude --scenario contractor
```

## Folder boundary

The agent may write only here:

```text
apps/web/ui-variants/<variant-slug>/
```

A new scaffold contains:

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

The agent may add any local files and folders beneath that directory, including components, assets, workers, shaders, generated art data, and WASM glue. It must not modify files outside the directory during an ordinary design session.

## What is standardized

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

It does **not** standardize:

- visual style;
- page or component layout;
- HTML element choices;
- navigation grammar;
- cards, panels, tabs, rails, chat bubbles, or dashboards;
- CSS methodology;
- terminology or information order;
- whether the result resembles an application, publication, game, artwork, spatial canvas, website, terminal, or something else.

## Neutral model

Read the public contract before editing:

```text
apps/web/ui-variants/contract.ts
packages/shared/src/ui-variant.ts
```

The model includes:

```text
identity
business/profile context
presentation context
runtime and recovery state
conversation
work loops and tasks
approvals and decisions
waiting/return conditions
changes
connections
abilities and capabilities
evidence
outputs
bounded interaction intents
fixture/evidence metadata
```

A variant can reorganize, transform, summarize, hide, or visually reinterpret these fields. It cannot fetch additional product data, import route internals, fabricate unavailable capabilities, or bypass the intent bridge.

## Files the agent should read

Inside its folder:

```text
TASK.md
instructions.md
variant.json
index.tsx
styles.module.css
../contract.ts
```

For broader context, read-only:

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

## Three collaborator levels

### Graphic designer or first-time vibe coder

Edit primarily:

```text
index.tsx
styles.module.css
TASK.md
```

Describe the desired composition in `TASK.md`, including references and what should feel different. Ask the agent to make one visual hypothesis at a time. Ignore Workers, WASM, Canvas, and advanced manifest features.

Example prompt:

```text
Read all local instruction files. Turn this employee experience into an expressive editorial control room for a small creative studio. It must not resemble a SaaS dashboard. Preserve all important work, waiting, approval, output, and recovery information. Work only in this folder. Check desktop and mobile and run the local validation command before stopping.
```

### Product/UX designer who codes

Use local React components, CSS Modules, SVG, container queries, interaction state, and the intent bridge. Test multiple fixture scenarios and runtime states. The host is a query container, so components can use `@container` rather than assuming full viewport ownership.

### Advanced frontend or creative technologist

Manifest-declared features can include:

```text
canvas_2d
webgl
webgpu
web_worker
wasm
audio
video
```

These remain subject to the same neutral data and intent boundary. Heavy graphics should prefer Worker/OffscreenCanvas patterns where practical. WASM may provide computation, simulation, codecs, layout, or rendering support; it does not grant product API or filesystem access.

## Manifest

`variant.json` declares compatibility, not appearance:

```json
{
  "schema": "amtech.ui-variant.v1",
  "id": "my-first-variant",
  "name": "My First Variant",
  "summary": "A distinct employee experience experiment.",
  "contract_version": 1,
  "entry": "./index.tsx",
  "status": "experiment",
  "supported_adapters": ["owner_web"],
  "capabilities": {
    "required": ["identity", "runtime", "work"],
    "optional": ["attention", "waiting", "outputs", "intents", "reference_client"],
    "intentionally_omitted": []
  },
  "runtime_features": ["dom", "css", "svg"],
  "dependencies": ["react"],
  "isolation": "host_contained",
  "performance": {
    "containment": "layout_paint_style",
    "content_visibility": "visible",
    "initial_render": "lazy"
  },
  "production": {
    "eligibility": "lab_only",
    "requires_reference_client": false
  },
  "tags": ["experiment"]
}
```

Adding package dependencies requires a maintainer decision. An ordinary variant agent must not change package files.

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
```

Run UI Lab normally:

```bash
npm run ui:lab:open
```

Gallery:

```text
http://127.0.0.1:3000/ui-lab/variants
```

## Validation loop

After each coherent iteration:

```bash
node ../../../../scripts/ui-variant.mjs validate <variant-slug>
```

From `mvp-build`, before review:

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
- heartbeat interruption/stall;
- recovery;
- empty/quiet state when applicable;
- keyboard focus and reduced motion;
- long labels and multiple work items.

## Safety and performance rules

The validator rejects:

- relative imports escaping the folder, except the public `../contract` module;
- undeclared package imports;
- Node/server modules;
- direct network access;
- ambient browser storage;
- undeclared Worker or WASM use;
- missing or mismatched manifest identity;
- stale generated registry state.

The host provides:

- one lazy-loaded chunk per variant through literal imports;
- React Suspense fallback;
- CSS layout/style/paint containment according to the manifest;
- an inline-size query container;
- deterministic fixture data;
- a bounded interaction bridge;
- the production client as an optional slot.

`content-visibility: auto` is opt-in for long surfaces, not a universal default.

## Promotion boundary

A folder marked `experiment` or `lab_only` is not a product assignment.

Promotion requires:

```text
manifest and import-boundary pass
+ shared/Web TypeScript pass
+ browser matrix evidence
+ capability coverage review
+ desktop/mobile/accessibility review
+ clean exact Git SHA
+ deliberate human approval
+ explicit assignment
```

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
Remaining uncertainty:
No files outside the variant folder changed.
No promotion or assignment performed.
```
