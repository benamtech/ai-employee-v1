# UI Lab Agent Onboarding

Status: active collaborator entrypoint  
Scope: live UI design and implementation against the real AMTECH Web client  
Repository: `benamtech/ai-employee-v1`  
Working branch: `agent/employee-ui-port-adapters-current`

## One-command operating model

UI Lab is not a second mock application. It runs the real Next.js Web application in development mode, renders production employee components through deterministic fixture scenarios, and places the preview inside an isolated same-origin canvas.

The one script-backed command is:

```bash
npm run ui:lab:open
```

That package command invokes `scripts/ui-lab-dev.mjs`. The script:

- checks Node, Git, required files, loopback host, and port;
- builds the shared contracts once;
- validates the UI preset registry;
- starts the shared TypeScript watcher;
- starts the Web TypeScript diagnostic watcher;
- starts the real Next.js application with Turbopack and Fast Refresh;
- enables fixture-only, loopback-only UI Lab draft writes;
- opens `http://127.0.0.1:3000/ui-lab`.

Do not replace this command with `next build`, Storybook, a separate Vite app, or a hand-built mock renderer for ordinary UI iteration.

## Fresh Manjaro setup

```bash
sudo pacman -Syu --needed git nodejs npm base-devel \
  nss atk at-spi2-core cups libdrm dbus libxkbcommon mesa \
  pango cairo alsa-lib gtk3

mkdir -p "$HOME/src"
cd "$HOME/src"
git clone https://github.com/benamtech/ai-employee-v1.git
cd ai-employee-v1
git fetch origin
git switch --track origin/agent/employee-ui-port-adapters-current
cd mvp-build
npm install
npm run local:browser-install
npm run ui:lab:doctor
npm run ui:lab:open
```

For a repository that is already cloned:

```bash
cd /path/to/ai-employee-v1
git fetch origin
git switch agent/employee-ui-port-adapters-current
git pull --ff-only origin agent/employee-ui-port-adapters-current
cd mvp-build
npm install
npm run local:browser-install
npm run ui:lab:doctor
npm run ui:lab:open
```

Leave that terminal running. Open a second terminal in the same `mvp-build` directory for the coding agent.

## What the collaborator sees

The workbench route is:

```text
http://127.0.0.1:3000/ui-lab
```

A scenario route is:

```text
http://127.0.0.1:3000/ui-lab/clothing-ops
```

The workbench can change:

- fixture scenario;
- high-level Web adapter;
- theme;
- layout;
- component set;
- density;
- brand tokens;
- desktop, tablet, mobile, or responsive viewport;
- deterministic runtime state;
- named UI preset version.

The iframe preview renders production components. Changes to normal React, TypeScript, and CSS source should appear through Next.js Fast Refresh without rebuilding the project.

## Source ownership

Edit source when changing the actual UI:

- `apps/web/app/_components/employee-ui/EmployeeUiPort.tsx` — adapter host and presentation strategy application;
- `apps/web/app/agent/[employeeId]/` — standard owner Web-client experience;
- `apps/web/app/ui-lab/[scenario]/ProductionFixtureLabClient.tsx` — production-component fixture host;
- `apps/web/app/ui-lab/[scenario]/UiLabWorkbenchClient.tsx` — workbench controls only;
- `apps/web/app/ui-lab/ui-lab.css` — workbench chrome only;
- `apps/web/app/globals.css` and component-local styles — product UI styling;
- `packages/shared/src/employee-ui-presentation.ts` — typed adapter/theme/layout/component-set contracts;
- `apps/web/app/agent/[employeeId]/fixture-runtime.ts` — deterministic fixture scenarios and transitions.

Do not directly edit generated or lifecycle files during normal visual work:

- `packages/shared/src/ui-lab-runtime-registry.generated.ts`;
- `ui-lab/assignments.json` unless deliberately assigning an approved preset;
- an existing `ui-lab/presets/**/vNNNN.json` file;
- browser evidence under `infra/.local/`.

Existing preset versions are immutable. Use the workbench to save the next draft version.

## Vibe-coding loop

1. Start `npm run ui:lab:open` and leave it running.
2. Select the closest fixture scenario and preview mode.
3. Set the target adapter, viewport, and existing preset before editing.
4. Give the coding agent one bounded visual objective.
5. Tell it to inspect this file and the source files it will modify before editing.
6. Let it edit React/CSS source while watching the browser preview.
7. After each coherent change, inspect desktop and mobile in the workbench.
8. Exercise fixture reset, heartbeat gap, recovery, and one fixture interaction when the edited surface contains runtime state.
9. Review `git diff` before accepting the iteration.
10. Save a named immutable draft in the workbench only after the visual state is worth retaining.
11. Run focused validation before committing.

The browser is the visual feedback instrument. The coding agent edits files and runs checks; it does not need to own or embed the browser server.

## Recommended agent prompt

Use this as the first prompt in Claude Code, Codex, or Cursor Agent:

```text
Read UI_LAB_AGENT_ONBOARDING.md first. UI Lab is already running at http://127.0.0.1:3000/ui-lab through npm run ui:lab:open. Work only in this repository and preserve the production-component fixture architecture. Do not create a second renderer, Storybook app, Vite app, or static mockup. Inspect the selected scenario, EmployeeUiPort, production employee components, relevant CSS, and current git diff before editing.

Goal: <describe one concrete visual or interaction outcome>.
Target scenario: <scenario>.
Target adapter: <owner_web | public_form | boundless_website>.
Target preset or defaults: <preset-ref or unsaved defaults>.
Required viewports: desktop and mobile.

Make the smallest coherent source change. Keep UI Lab workbench chrome separate from product UI styles. Do not edit existing preset versions or the generated runtime registry. After editing, run the focused checks in this file, summarize changed files and risks, and stop before commit or promotion.
```

## Claude Code

Install and validate:

```bash
npm install -g @anthropic-ai/claude-code
claude doctor
```

Run from the repository scope that contains this file:

```bash
cd /path/to/ai-employee-v1/mvp-build
claude
```

Then paste the recommended agent prompt. Keep terminal-command approval enabled. Use `claude -c` to continue the latest session after restarting.

## OpenAI Codex CLI

Install:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Open a new shell if the installer updates `PATH`, then run:

```bash
cd /path/to/ai-employee-v1/mvp-build
codex
```

Sign in with ChatGPT when prompted, then paste the recommended agent prompt. Review proposed commands and diffs before approval.

Alternative npm installation:

```bash
npm install -g @openai/codex
```

## Cursor desktop or Cursor CLI

For Cursor desktop, open the `mvp-build` directory, allow codebase indexing to finish, open Agent with `Ctrl+I`, and paste the recommended prompt. Keep the existing UI Lab terminal running outside or inside Cursor.

Cursor CLI installation and startup:

```bash
curl https://cursor.com/install -fsS | bash
cd /path/to/ai-employee-v1/mvp-build
cursor-agent
```

Cursor CLI reads repository `AGENTS.md` and `CLAUDE.md`; this file remains the specific UI Lab operating guide. Review changes with the CLI review command before accepting them.

## Focused validation during iteration

Run these from `mvp-build` in a separate terminal while UI Lab remains running:

```bash
npm run ui:lab:registry:validate
npm run test:ui:contracts
npm run typecheck --workspace @amtech/web
```

Run the headed browser matrix when the coherent iteration is ready for review:

```bash
npm run ui:lab:test:headed
```

Run the complete repository-level UI and build checks before requesting promotion:

```bash
npm run ui:validate
npm run repo:verify:full
npm run test:unit
npm run build
```

Generate the full deterministic UI coverage case list when changing adapters, strategy axes, scenarios, or validation topology:

```bash
node scripts/generate-ui-coverage.mjs /tmp/amtech-ui-coverage.json --include-cases
```

## Draft, commit, and promotion boundary

A workbench draft records the selected adapter and presentation configuration plus Git provenance. A dirty-tree draft is useful for comparison but is deliberately non-reproducible.

Before treating a design as reusable:

```bash
git status --short
git diff --check
npm run ui:validate
npm run test:ui:contracts
npm run ui:lab:test
```

Then commit the React/CSS/source changes. Promotion and assignment are separate deliberate operations and require clean source, exact-SHA evidence, and human review. Do not ask a coding agent to silently promote its own design.

## Troubleshooting

If port 3000 is busy:

```bash
npm run ui:lab -- --port 3100 --open
```

If dependencies changed:

```bash
rm -rf node_modules apps/web/.next packages/shared/dist
npm install
npm run ui:lab:doctor
npm run ui:lab:open
```

If Fast Refresh performs a full reload repeatedly, inspect the edited component file for anonymous default components or non-component exports used outside the React tree. Move shared constants into a separate module where appropriate.

If Chromium is missing:

```bash
npm run local:browser-install
```

If the workbench loads but saving is disabled, confirm it was started through `npm run ui:lab:open`, is using a loopback hostname, and is in development fixture mode.

## Completion report expected from an agent

Every UI coding session should end with:

```text
Objective completed:
Scenario and adapter tested:
Files changed:
Desktop result:
Mobile result:
Runtime states exercised:
Preset saved, if any:
Commands run:
Passing checks:
Remaining failures or uncertainty:
No commit/promotion performed unless explicitly requested.
```
