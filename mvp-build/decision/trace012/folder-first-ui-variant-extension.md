# Trace012 extension — folder-first employee UI variants

Task extension: `AMTECH-UI-LAB-001 / UI-VARIANT-STANDARD`  
Branch: `agent/employee-ui-port-adapters-current`  
Original implementation coordinate: `69ea9c2e23da78ea04c97af88922f529466bebb9`  
Reconciled: 2026-07-23  
Status: **source, unit, typecheck, lint, production build, PostgreSQL integration, five-image build/identity, and source-built signed-manifest verification exist on historical exact candidates; headed supported-browser and human visual/accessibility review remain open**

The original coordinate is retained as provenance. Current structural and exact evidence state lives in [`../../CODEGRAPH.md`](../../CODEGRAPH.md), [`task_state.json`](task_state.json), the current PR, workflows, and release records.

## Problem

The production Web client and original UI Lab workbench support controlled changes to adapters, themes, layouts, component sets, density, and brand tokens. They did not provide a safe way for a collaborator to replace the complete employee experience without inheriting the production client’s visual grammar and private component hierarchy.

The required boundary is capability fidelity rather than visual fidelity:

```text
production Web-client capabilities ⊂ UI variant capability space
```

A valid variant receives enough neutral employee truth to represent identity, owner context, runtime/recovery, conversation, work, decisions, approvals, waiting conditions, changes, connections, capabilities, evidence, outputs, and bounded interactions. It is not required to preserve the production client’s appearance, terminology, navigation, DOM hierarchy, or component model.

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

The host does not supply private product modules, direct network access, ambient storage, filesystem access, undeclared dependencies, or implicit Worker/WASM privileges.

## Architecture decisions

| Dimension | Selected | Rejected default | Reason |
|---|---|---|---|
| Discovery | folder-first generated registry | manual central registration | folder presence is source truth; generation detects drift |
| Rendering | React/Next-native module | iframe for every variant | preserves state, routing, accessibility, and chunking without duplicate bridges |
| Fidelity | neutral capability model | production component hierarchy | capabilities are binding; visual imitation is not |
| Isolation | import boundary + CSS containment | visual uniformity | prevents private coupling and spillover without reducing design freedom |
| Responsiveness | inline-size container queries | viewport-only assumptions | variants respond to allocated surface |
| Loading | literal lazy imports + Suspense | eager bundle of every experiment | Next can statically discover and split concrete module paths |
| Agent context | generated folder-local instructions | one repository-root prompt | gives smallest relevant context and write scope |
| Setup | environment-adaptive coding-agent workflow | OS-specific installer | agents inspect the actual environment and avoid repeated unnecessary setup |
| Extensibility | manifest-declared browser features | fixed visual SDK | ordinary React/CSS stays simple; advanced capabilities remain explicit |

## Checked-in reference variants

- `reference-client` — proves the production Web client is one conforming variant.
- `radical-canvas` — proves a materially different visual and structural experience can retain employee capabilities.
- `editorial-studio` — provides a conventional React/CSS example readable by designers and less experienced collaborators.

## Canonical agent entry

`mvp-build/ui-lab/README.md` is the canonical agent entry point. It instructs Claude Code, Codex, Cursor, or another coding agent to:

1. inspect the OS, architecture, shell, Git, Node/npm, browser tooling, checkout, branch, and working tree;
2. clone or safely reuse the repository;
3. preserve local work and avoid unattended OS upgrades or unnecessary repeated installs;
4. establish the exact required branch and project state;
5. run the UI-variant doctor;
6. launch the collaborator with `--agent none` when already controlling the session;
7. work only in the selected variant folder unless broader changes are explicitly authorized;
8. report exact environment, SHA, commands, validation, URL, and changed-file boundary.

## Executable governance

The canonical doctor validates every variant folder and rejects:

- invalid or missing manifests;
- registry drift or non-literal imports;
- imports escaping the variant root or reaching private application modules;
- direct network/storage/Node/Worker/WASM use without allowed declaration;
- undeclared runtime dependencies;
- missing local agent guidance;
- invalid component exports;
- production-like UI Lab exposure;
- source-owned variants that cannot be reproduced from the repository.

The ordinary write boundary is:

```text
mvp-build/apps/web/ui-variants/<variant-slug>/
```

## Validation and promotion

Minimum machine validation:

```bash
node scripts/ui-variant.mjs validate <variant-slug>
node scripts/ui-variant.mjs doctor
npm run repo:verify:full
npm run test:unit
npm run build
```

Relevant exact-candidate workflows also exercise PostgreSQL integration, production Compose, five image builds, image identity, and independent release-manifest verification.

Promotion additionally requires deliberate desktop/mobile inspection and human visual/accessibility judgment. A green doctor, build, screenshot, ARIA snapshot, or fixture matrix is not aesthetic, supported-browser, live-channel, or production acceptance.

## Higher-order effects

Second order:

- full visual alternatives can be explored against the same neutral employee truth;
- agent work becomes parallelizable and folder-bounded;
- generated registries and local instructions become new drift surfaces requiring executable checks;
- capability preservation becomes testable independently from production visual structure.

Third order:

- variants become a governed product-line mechanism with migration, deprecation, fallback, support, and customer-branding obligations;
- stable variant identities enable experiments, but experiment outcomes cannot create authority or skip release gates;
- broader design freedom increases the importance of manual accessibility and cross-browser review;
- agent-first onboarding lowers setup cost while requiring stricter repository routing and completion reports.

Fourth order:

- successful variants may become commercial product configurations, which creates entitlement, lifecycle, compatibility, and support-policy requirements;
- presentation diversity can reveal missing neutral capabilities, causing the capability contract to evolve under versioning rather than private imports;
- variant proliferation can multiply verification cost, requiring risk-based smoke coverage, pairwise exploration, and explicit golden commercial surfaces rather than exhaustive combinatorics.

## Evidence boundary

Trace012 is complete as an implementation decision and latest completed trace. It is not a new production-planning computation. Historical exact-candidate CI/image evidence does not establish headed all-variant supported-browser coverage, human visual approval, manual accessibility, live provider/channel behavior, managed database, target host, pilot, deployment, or production.
