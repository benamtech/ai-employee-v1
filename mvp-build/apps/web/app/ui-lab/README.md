# AMTECH UI Lab

This README is the canonical entry point for starting the AMTECH UI Lab with Claude Code, OpenAI Codex, Cursor, or another capable coding agent.

## Copy this complete onboarding prompt into your coding agent

```text
Set up and launch the AMTECH employee UI Lab on this computer.

Repository:
https://github.com/benamtech/ai-employee-v1

Required branch:
agent/employee-ui-port-adapters-current

Primary project directory:
mvp-build

Canonical onboarding document:
mvp-build/UI_LAB_AGENT_ONBOARDING.md

Your objective is to safely prepare the local development environment, clone or reuse the repository, navigate to the correct project and branch, validate the UI-variant system, and launch the complete UI Lab collaborator environment.

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
- Keep all ordinary UI-variant edits inside the selected variant directory.

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
10. You continue working only inside that variant's folder unless I explicitly authorize broader changes.

Repository setup:

- If the repository is absent, clone it using the safest normal Git workflow for this environment.
- If it already exists, inspect it before fetching or switching branches.
- Fetch the remote branch.
- Switch to `agent/employee-ui-port-adapters-current` only when doing so will not overwrite local work.
- Fast-forward only when the working tree and branch state make that safe.
- If local work prevents a safe update, preserve it and clearly report the conflict instead of modifying or hiding it.

Once the checkout is ready:

1. Read:
   - `identity.md`
   - `CLAUDE.md`
   - `CODEGRAPH.md`
   - `mvp-build/CLAUDE.md`
   - `mvp-build/AGENTS.md`
   - `mvp-build/CODEGRAPH.md`
   - `mvp-build/UI_LAB_AGENT_ONBOARDING.md`

2. Treat repository source, tests, generated contracts, and the newest applicable memory as higher authority than stale documentation.

3. From `mvp-build`, prepare the project using the environment-appropriate equivalent of:

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

The ordinary write boundary is:

mvp-build/apps/web/ui-variants/<variant-slug>/

Do not modify files outside that directory during normal UI design work unless a repository-level defect prevents the variant from functioning and I explicitly authorize the broader fix.

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

It does not need to preserve the production client's:

- visual appearance;
- layout;
- navigation;
- terminology;
- component hierarchy;
- DOM structure;
- dashboard conventions.

The production Web client is an optional reference implementation, not a visual template.

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

## Technical contract

The detailed capability model, folder boundary, commands, validation rules, performance constraints, and promotion gates are maintained in [`mvp-build/UI_LAB_AGENT_ONBOARDING.md`](../../../UI_LAB_AGENT_ONBOARDING.md).

The root-level [`UI_VIBE_QUICKSTART.md`](../../../../../UI_VIBE_QUICKSTART.md) provides the shorter non-technical handoff.