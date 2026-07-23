# AMTECH UI Lab

**Canonical agent entry point:** Claude Code, OpenAI Codex, Cursor, and other coding agents must begin UI Lab work here.

## Agent onboarding prompt

Give the following complete prompt to the coding agent that will prepare and operate the workspace:

```text
Set up and launch the AMTECH employee UI Lab on this computer.

Repository:
https://github.com/benamtech/ai-employee-v1

Required branch:
agent/employee-ui-port-adapters-current

Primary project directory:
mvp-build

Canonical agent entry point:
mvp-build/ui-lab/README.md

Detailed variant contract:
mvp-build/UI_LAB_AGENT_ONBOARDING.md

Your objective is to safely prepare the local development environment, clone or reuse the repository, navigate to the correct project and branch, validate the UI and UI-variant systems, and launch the complete UI Lab collaborator environment.

Before changing anything, inspect:

- operating system and architecture;
- current shell and terminal environment;
- Git availability and version;
- Node.js and npm availability and versions;
- available browser and Playwright tooling;
- whether the repository already exists locally;
- current Git branch and working-tree state;
- whether another coding agent is already controlling the terminal.

Safety requirements:

- Do not run an unattended operating-system upgrade.
- Do not assume a particular OS, package manager, shell, or filesystem layout.
- Do not reset, clean, stash, overwrite, discard, or pull over uncommitted work.
- Do not force-switch branches.
- Do not reinstall working system dependencies or browser tooling without evidence that they are missing or broken.
- Explain any machine-level installation or configuration change before performing it.
- Keep ordinary UI-variant edits inside the selected variant directory.

Required end state:

1. The repository exists locally.
2. The checkout is on `agent/employee-ui-port-adapters-current`.
3. The working tree is preserved.
4. Node.js 20 or newer and npm are available.
5. Dependencies for `mvp-build` are installed and synchronized.
6. The browser required by the UI test harness is available.
7. `node scripts/ui-variant.mjs doctor` passes.
8. The UI Lab launches successfully.
9. The exact selected variant route opens.
10. You continue working only inside the authorized UI boundary unless I explicitly authorize broader changes.

Repository setup:

- If the repository is absent, clone it using the safest normal Git workflow for this environment.
- If it already exists, inspect it before fetching or switching branches.
- Fetch the remote branch.
- Switch to `agent/employee-ui-port-adapters-current` only when doing so will not overwrite local work.
- Fast-forward only when the working tree and branch state make that safe.
- If local work prevents a safe update, preserve it and clearly report the conflict instead of modifying or hiding it.

Once the checkout is ready, read in this order:

1. `identity.md`
2. root `AGENTS.md`
3. root `CLAUDE.md`
4. root `CODEGRAPH.md`
5. `mvp-build/AGENTS.md`
6. `mvp-build/CLAUDE.md`
7. `mvp-build/CODEGRAPH.md`
8. `mvp-build/ui-lab/AGENTS.md`
9. `mvp-build/ui-lab/README.md`
10. `mvp-build/UI_LAB_AGENT_ONBOARDING.md`

Treat repository source, tests, generated contracts, workflows, and the newest applicable memory as higher authority than stale documentation.

From `mvp-build`, prepare the project using the environment-appropriate equivalent of:

npm install
npm run local:browser-install
node scripts/ui-variant.mjs doctor

`npm run local:browser-install` is a bootstrap or repair action. Skip it during repeat sessions when the required browser is already installed and healthy.

After the doctor passes, ask me for:

- the UI variant slug, using lowercase letters, numbers, and hyphens;
- the fixture scenario, defaulting to `clothing-ops` when I do not specify one.

Then launch from `mvp-build`:

node scripts/ui-variant-collaborator.mjs <variant-slug> --agent none --scenario <scenario>

Use `--agent none` because you are already the coding agent controlling the session. Do not launch a nested Claude, Codex, or Cursor process.

The launcher should:

- create the variant folder when absent;
- write the local agent instruction files;
- validate the variant manifest and import boundary;
- regenerate the static variant registry;
- start the UI Lab;
- start the TypeScript and variant watchers;
- open the exact live variant route.

The ordinary UI-variant write boundary is:

mvp-build/apps/web/ui-variants/<variant-slug>/

Do not modify files outside that directory during normal variant work unless a repository-level defect prevents the variant from functioning and I explicitly authorize the broader fix.

Before editing the variant, read its local:

- `TASK.md`
- `instructions.md`
- `AGENTS.md`
- `CLAUDE.md`
- `variant.json`
- `index.tsx`
- `styles.module.css`
- `../contract.ts`

The UI variant must preserve the complete neutral employee capability and information model, including relevant identity, runtime, recovery, work, approvals, waiting conditions, outputs, evidence, connections, conversation, and bounded intents.

It does not need to preserve the production client's visual appearance, layout, navigation, terminology, component hierarchy, DOM structure, or dashboard conventions. The production Web client is an optional reference implementation, not a visual template.

Validate the selected variant before reporting completion. At minimum:

node scripts/ui-variant.mjs validate <variant-slug>
node scripts/ui-variant.mjs doctor

Also inspect the live result at desktop and mobile dimensions and exercise relevant active, waiting, stalled, recovery, and empty states.

At completion, report:

- detected environment;
- repository location;
- checked-out branch and exact Git SHA;
- whether existing user work was found and preserved;
- machine-level changes made;
- dependency or browser setup performed;
- commands run;
- passing and failing checks;
- selected variant folder;
- selected scenario;
- exact local UI Lab URL;
- any remaining uncertainty;
- confirmation that no unauthorized files were changed.
```

## Workbench definition

UI Lab is the standard live design workbench for AMTECH employee Web experiences.

It runs the actual Next.js Web application and production employee components with deterministic fixture data. It is not a screenshot mockup, a second frontend, or a production runtime. A collaborator can edit React, TypeScript, CSS, tokens, layouts, and component registries and see most changes immediately through Next Fast Refresh.

## Start

From `mvp-build/`:

```bash
npm install
npm run local:browser-install
npm run ui:lab:open
```

The normal command is:

```bash
npm run ui:lab
```

It performs the following work:

1. verifies Node, Git, dependencies, loopback host, port, and registry files;
2. builds the shared package once;
3. validates the UI preset registry;
4. starts shared TypeScript output in watch mode;
5. starts Web TypeScript diagnostics in watch mode;
6. starts the actual Next Web application with Turbopack and Fast Refresh;
7. enables fixture routes and tightly bounded local draft-preset writes.

Open `http://127.0.0.1:3000/ui-lab` unless a different port was selected.

## What the collaborator edits

The workbench does not generate arbitrary source code. A collaborator or coding agent edits normal repository files, primarily:

- `apps/web/app/_components/employee-ui/EmployeeUiPort.tsx` for adapter and presentation strategy behavior;
- `apps/web/app/agent/[employeeId]/**` for the authenticated owner client;
- `apps/web/app/free-estimator/**` for the public-form adapter;
- `apps/web/app/ui-lab/**` for workbench-only chrome and preview controls;
- `apps/web/app/globals.css` and scoped CSS modules/styles for shared design behavior;
- `packages/shared/src/employee-ui-presentation.ts` for validated strategy keys and resolver behavior;
- statically declared component registries when a design cannot be expressed with tokens or scoped CSS.

Do not edit generated runtime registry output by hand.

## Workbench model

```text
workbench route /ui-lab/[scenario]
  ├─ scenario and runtime fixture selection
  ├─ adapter, theme, layout, component-set, density and brand controls
  ├─ viewport selection
  ├─ named preset/version browser
  ├─ draft checkpoint form
  ├─ fixture interaction controls
  └─ same-origin iframe
       └─ preview route /ui-lab/preview/[scenario]
            └─ production employee components + deterministic fixture data
```

The iframe isolates preview viewport and styling from workbench chrome while preserving the actual Next route/component environment.

## Presets

A preset is a named, immutable configuration of:

- high-level adapter;
- theme strategy;
- layout strategy;
- component-set strategy;
- density;
- brand tokens;
- intended employee/profile selectors;
- fixture scenario and review viewports;
- Git source provenance.

Canonical files live at:

```text
ui-lab/presets/<preset-id>/vNNNN.json
```

Saving from the workbench always creates a new version. Existing versions are never overwritten.

A dirty-worktree draft is allowed for comparison, but it is marked non-reproducible and cannot be assigned to employees.

## Review and promotion

The safe lifecycle is:

```text
edit source
→ Fast Refresh preview
→ save draft checkpoint
→ compare named versions and viewports
→ commit source
→ run focused validation and browser evidence
→ human review
→ promote a new approved preset version
→ assign approved preset to profile/business/employee selectors
→ regenerate and commit runtime registry
```

List and validate presets:

```bash
npm run ui:lab:presets
npm run ui:lab:registry:validate
```

Run browser evidence:

```bash
npm run ui:lab:test
```

Promotion requires a clean worktree and exact-head PASS evidence:

```bash
npm run ui:lab:promote -- \
  marketing-agency@v0001 \
  --reviewer "Benjamin" \
  --evidence infra/.local/ui-fixtures/<evidence-file>.json \
  --profile marketing_agency \
  --employee-type marketing_operator
```

Assign an already approved preset:

```bash
npm run ui:lab:assign -- \
  marketing-agency@v0002 \
  --reviewer "Benjamin" \
  --profile marketing_agency \
  --business-kind "marketing agency"
```

Use the exact CLI help emitted by `scripts/ui-lab-registry.mjs` when option syntax changes.

## Validation

During development:

```bash
npm run ui:lab:doctor
npm run ui:lab:registry:validate
npm run test:ui:contracts
node scripts/verify-ui-architecture.mjs
```

Before promotion or merge:

```bash
npm run ui:lab:test
npm run ui:validate
npm run repo:merge:check
```

Automated validation proves source contracts, routing, deterministic behavior, responsive mechanics, accessibility structure, and repeatable screenshots. It does not prove that a design is aesthetically good. Promotion therefore requires deliberate human review.

## Safety boundaries

UI Lab is available only when fixture mode is explicitly enabled. Repository writes additionally require development mode, `AMTECH_UI_LAB_WRITE=1`, a loopback host, and a same-origin request.

The browser may create only validated preset versions under `ui-lab/presets/`. It cannot approve, assign, overwrite existing versions, choose arbitrary paths, edit source files, or write to a database.

UI Lab fixtures are production-component demonstrations. They are not provider, authorization, managed database, deployment, pilot, or production evidence.

## Troubleshooting

Run:

```bash
npm run ui:lab:doctor
```

Common causes:

- dependencies were not installed from `mvp-build/`;
- Chromium was not installed for Playwright;
- port 3000 is occupied;
- the workbench was started with ordinary `web:dev` instead of `ui:lab`;
- the host is not loopback, so repository writes are deliberately disabled;
- shared generated registry output is stale after changing assignments;
- a preset was saved from a dirty worktree and is therefore not promotable.

## Deeper authority

Read:

1. `AGENTS.md` in this directory;
2. `../UI_LAB_AGENT_ONBOARDING.md` for the folder-first variant contract;
3. `../docs/ux/09-ui-lab-live-workbench.md`;
4. `../docs/adr/ADR-010-employee-ui-port-and-web-presentation-adapters.md`;
5. `../decision/trace012/research-and-decision-record.md`;
6. `../decision/trace012/validation-vectors.json`;
7. `../decision/trace012/affected-files.json`;
8. `../decision/trace012/script-inventory.json`.
