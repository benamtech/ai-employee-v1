# AMTECH UI Vibe Coding Quickstart

This is the non-technical collaborator path. Do not install operating-system packages from a repository script. Let Claude Code, Codex, Cursor, or another capable coding agent inspect the actual machine and prepare the environment safely.

## Give this task to your coding agent

Open a terminal in the folder where you want the repository, start your coding agent, and paste this:

```text
Set up the AMTECH employee UI variant workspace on this computer.

Repository: https://github.com/benamtech/ai-employee-v1
Branch: agent/employee-ui-port-adapters-current
Project directory: mvp-build
Canonical onboarding: mvp-build/UI_LAB_AGENT_ONBOARDING.md

First inspect the operating system, architecture, shell, installed Git/Node/npm, available browser tooling, repository state, and the coding-agent CLI that is already running. Choose the safest native setup for this machine. Do not perform an unattended operating-system upgrade. Do not overwrite, clean, reset, stash, or pull over uncommitted work.

Required end state:
1. The repository exists locally on the exact branch above.
2. Node.js 20 or newer and npm are available.
3. Project dependencies are installed from mvp-build.
4. The local browser required by the UI test harness is installed.
5. `node scripts/ui-variant.mjs doctor` passes.
6. Ask me for a lowercase hyphenated variant name.
7. Launch `node scripts/ui-variant-collaborator.mjs <variant-name> --agent none --scenario clothing-ops` from mvp-build.
8. After the workspace opens, continue working as my coding agent inside `mvp-build/apps/web/ui-variants/<variant-name>/` only.

Read the canonical onboarding and all local instruction files before editing. Preserve the complete employee capability and information model, but do not copy the production client's appearance or layout. Check desktop and mobile and validate the variant before stopping.

Report exactly what you installed or changed outside the repository, what commands passed, the local variant URL, and any remaining uncertainty.
```

The agent may adapt commands for macOS, Windows, Linux, WSL, containers, remote development, or an existing checkout. The end state and safety invariants are fixed; the installation method is not.

## Every later session

Open the existing repository with your coding agent and say:

```text
Resume the AMTECH UI variant workspace safely. Read mvp-build/UI_LAB_AGENT_ONBOARDING.md, inspect the current branch and working tree, preserve all uncommitted work, update only when a fast-forward is safe, run the lightweight preflight, ask which existing or new variant I want, and launch the collaborator environment. Do not repeat operating-system setup or browser installation unless evidence shows it is missing or broken.
```

A normal repeat session should not reinstall system packages. It should normally perform only a safe branch/working-tree check, dependency synchronization when required, the UI-variant doctor, and workspace launch.

## Creative working rule

Tell the coding agent what the interface should feel like, what is visually wrong, and which user state you are evaluating. During an ordinary design session it may edit only:

```text
mvp-build/apps/web/ui-variants/<variant-name>/
```

The canonical launcher creates the variant when absent, validates it, regenerates the static registry, starts UI Lab and the watchers, opens the exact route, and scopes the selected agent to the variant directory.

Stop the complete environment with `Ctrl+C`.

## Maintainer path

Technical collaborators and coding agents should use `mvp-build/UI_LAB_AGENT_ONBOARDING.md` as the canonical contract. Environment-specific commands are intentionally delegated to the agent after it inspects the real machine; repository scripts must not run package managers or unattended operating-system upgrades.