# UI Lab Agent Onboarding

Status: architecture correction in progress — do not hand this workflow to a collaborator until the variant harness scripts described below exist and pass  
Repository: `benamtech/ai-employee-v1`  
Branch: `agent/employee-ui-port-adapters-current`

## Correct operating boundary

A UI collaborator or coding agent must not receive general write scope over the production Web client.

The intended editing unit is one self-contained UI variant directory:

```text
apps/web/ui-variants/<variant-slug>/
```

The agent may create and edit files inside that directory. It may read the rest of the repository for context, but it must not modify application routes, production employee components, shared schemas, generated registries, preset history, assignments, tests, or scripts during an ordinary visual experiment.

This follows a filesystem-first rule:

```text
A UI variant is a directory.
```

The folder is loose enough to support radically different React structures, CSS, assets, and local components. Integration remains bounded by a small manifest and one typed UI data contract.

## Target folder shape

```text
apps/web/ui-variants/<variant-slug>/
├── variant.json          # identity, compatibility, entrypoint, experiment status
├── instructions.md       # local intent, constraints, and design notes
├── index.tsx             # variant entry component
├── styles.module.css     # optional; styling technology is not prescribed
├── components/           # optional local components
├── assets/               # optional local assets
└── README.md             # optional human notes
```

Only `variant.json` and `index.tsx` are required. The standard does not prescribe a visual style, HTML structure, CSS methodology, component library, or layout system.

## Stable integration contract

Every variant receives the same versioned employee UI model rather than importing private application internals.

The V1 contract should expose these categories:

```text
identity
profile and business context
adapter and presentation selection
runtime status
conversation data
current work
owner-attention items
waiting or return conditions
changes
connections and capabilities
evidence and outputs
bounded interaction intents
fixture and evidence metadata
```

A variant may reorganize, hide, emphasize, rename, or visually transform these fields. It must not obtain additional application data by importing route components, API clients, Manager modules, fixture internals, or database code.

## Two variant modes

The manifest declares one of two modes:

- `shell`: receives the stable model plus production interaction slots. This is the default and safest mode for normal reusable employee layouts.
- `full`: receives the stable model plus bounded UI intents and may replace the visual tree completely. This is experimental until its interaction contract has executable coverage.

Themes, layout ideas, and component choices remain internal to the folder. They do not require new global enums for every experiment.

## Discovery and compilation

A generator must scan `apps/web/ui-variants/*/variant.json`, validate every folder, and generate a static Next.js registry. The generated registry is the only production source file that references variant entrypoints.

This is necessary because Next.js and React lazy loading work best with statically discoverable imports. The collaborator should add a folder, not manually register imports in application code.

Expected scripts:

```bash
npm run ui:variant:new -- <slug>
npm run ui:variant:validate -- <slug>
npm run ui:variant:generate
npm run ui:variant:watch
```

`npm run ui:lab:open` should eventually start `ui:variant:watch` automatically so adding or changing a folder updates the live UI Lab preview.

## Import boundary

Variant validation must reject:

- relative imports that escape the variant directory;
- imports from `apps/web/app/agent`, route handlers, Manager, database, or infrastructure code;
- direct imports of fixture implementations;
- writes outside the active variant folder;
- edits to generated registries;
- network or filesystem access from the variant component;
- undeclared package dependencies.

Allowed imports should be limited to:

- React;
- the public UI variant contract module;
- dependencies explicitly allowed by the manifest;
- files inside the same variant directory.

## Agent workflow after the harness exists

Terminal 1:

```bash
cd /path/to/ai-employee-v1/mvp-build
npm run ui:lab:open
```

Terminal 2:

```bash
cd /path/to/ai-employee-v1/mvp-build
npm run ui:variant:new -- <variant-slug>
cd apps/web/ui-variants/<variant-slug>
claude
# or: codex
# or open this exact folder in Cursor
```

The coding agent must be launched from the variant directory, not from the repository root. Its first instruction should be:

```text
Read instructions.md and the repository UI_LAB_AGENT_ONBOARDING.md. You may modify only the current UI variant directory. You may read repository files for context. Do not modify files outside this directory. Use only the public variant contract and local files. Keep UI Lab running, inspect desktop and mobile after coherent changes, and run the variant validation command before stopping.
```

## Promotion boundary

An experimental folder is not automatically a reusable product UI.

Promotion requires:

```text
valid manifest
+ import-boundary pass
+ TypeScript pass
+ UI Lab browser pass
+ desktop/mobile review
+ clean Git source
+ named immutable preset/version
+ deliberate human assignment
```

The coding agent may prepare a candidate. It must not silently promote or assign its own variant.

## Current hold

The existing UI Lab can still be started for inspection with:

```bash
npm run ui:lab:open
```

Do not instruct a collaborator to edit production source through that session. The folder-first loader, contract, scaffold command, registry generator, boundary validator, and watch integration must be implemented before this document becomes the active collaborator workflow.
