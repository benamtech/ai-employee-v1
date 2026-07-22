# Trace012 extension — folder-first employee UI variants

Task extension: `AMTECH-UI-LAB-001 / UI-VARIANT-STANDARD`  
Branch: `agent/employee-ui-port-adapters-current`  
Recorded code head: `69ea9c2e23da78ea04c97af88922f529466bebb9`  
Status: source, unit, typecheck, lint, and production build verified; headed browser review remains open

## Problem

The production Web client and the original UI Lab workbench support controlled changes to adapters, themes, layouts, component sets, density, and brand tokens. They do not provide a safe way for a collaborator to replace the complete employee experience without inheriting the production client's visual grammar and private component hierarchy.

The required boundary is capability fidelity rather than visual fidelity:

```text
production Web-client capabilities ⊂ UI variant capability space
```

A valid variant must receive enough neutral employee truth to represent identity, owner context, runtime and recovery, conversation, work, decisions, approvals, waiting conditions, changes, connections, capabilities, evidence, outputs, and bounded interactions. It must not be forced to preserve the production client's appearance, terminology, navigation, DOM hierarchy, or component model.

## Repository evidence

The repository already had:

- a typed production employee payload;
- deterministic fixture scenarios and runtime transitions;
- a guarded UI Lab;
- Next.js App Router and React Suspense;
- a production client that could be retained as a reference implementation;
- source-controlled agent guidance and repository governance tests.

The missing layer was a public neutral variant contract, folder-level write boundary, deterministic discovery, and executable validation.

## Architecture hypotheses

| Dimension | Retained | Rejected default | Decision reason |
|---|---|---|---|
| Discovery | Folder-first generated registry | Manual central registration | Folder existence is the source of truth; generation catches stale registries. |
| Rendering | React/Next-native module | Iframe for every variant | Native modules preserve existing state, routing, accessibility, and chunking without duplicate bridges. |
| Fidelity | Neutral capability model | Production component hierarchy | Capability preservation is required; visual and structural imitation is not. |
| Isolation | Import boundary plus CSS containment | Visual uniformity | Prevents private coupling and rendering spillover without reducing design freedom. |
| Responsiveness | Inline-size container queries | Viewport-only assumptions | Variants respond to their allocated surface rather than assuming viewport ownership. |
| Loading | Literal lazy imports and Suspense | Eagerly bundle every experiment | Next.js can statically discover chunks and preload concrete module paths. |
| Heavy graphics | Worker, OffscreenCanvas, and WASM opt-in | Unrestricted main-thread computation | Advanced techniques remain available but must be explicit and reviewable. |
| Agent context | Generated folder-local instructions | One repository-root prompt | The smallest relevant context and write scope are placed next to the code. |
| Safety | Agent launched inside variant folder | Repository-root write access | Tool working-directory boundaries reinforce the repository contract. |
| Extensibility | Manifest-declared browser features | Fixed component SDK | Beginners can use React/CSS while advanced variants declare only the features they need. |

## Selected standard

```text
apps/web/ui-variants/<variant-slug>/
├── variant.json
├── index.tsx
├── styles.module.css
├── TASK.md
├── instructions.md
├── AGENTS.md
├── CLAUDE.md
└── .cursor/rules/ui-variant.mdc
```

The host supplies:

- `EmployeeExperienceModelV1`;
- a bounded `dispatchIntent` bridge;
- the production client as optional `slots.reference_client`.

The host does not supply private product modules, direct network access, ambient storage, filesystem access, or implicit Worker/WASM privileges.

The generated registry uses literal manifest imports and literal dynamic component imports. This is required because Next.js module matching and preloading depend on statically discoverable import paths.

## Checked-in reference variants

- `reference-client`: proves the normal production Web client is one conforming variant.
- `radical-canvas`: proves a materially different visual and structural experience can retain employee capabilities.
- `editorial-studio`: provides a conventional React/CSS example that is readable by designers and less experienced collaborators.

## Executable governance

The canonical doctor validates every folder and rejects:

- folder-escaping imports;
- private application imports;
- undeclared dependencies;
- Node/server modules;
- direct network APIs;
- ambient browser storage;
- undeclared Worker or WebAssembly use;
- malformed or mismatched manifests;
- stale generated registries.

The collaborator launcher scaffolds when needed, validates, regenerates, starts UI Lab and the registry watcher, opens the exact route, and launches Claude Code, Codex, Cursor, or no agent with the variant directory as working directory.

## Verification snapshot

At code head `69ea9c2e23da78ea04c97af88922f529466bebb9`:

- complete merge gate: PASS, run `29941013090`;
- release-candidate source and UI job: PASS, run `29941013083`;
- PostgreSQL integration job: PASS;
- unit suite: 132 files and 743 tests PASS;
- repository governance, typecheck, and lint: PASS;
- Next.js production build: PASS;
- generated UI variant registry parity: PASS;
- generated UI Lab assignment registry parity: PASS.

The trace records this as source/build evidence, not browser, provider, target-host, pilot, or production acceptance.

## Remaining evidence boundary

Still required before calling the variant subsystem merge-ready for visual review:

1. headed browser checks for all three variants;
2. desktop and mobile scenarios including active, waiting, stalled, recovery, and relevant empty states;
3. human visual and accessibility review;
4. final exact-head CI after documentation reconciliation.

Live-provider behavior, production authorization, target-host deployment, commercial acceptance, and aesthetic quality are not inferred from this work.
