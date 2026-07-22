# AMTECH UI Vibe Coding Quickstart

This is the non-technical collaborator path.

## First run

Download `ui-vibe.sh` from the repository, then run the downloaded file:

```bash
bash ~/Downloads/ui-vibe.sh
```

The script handles:

- Manjaro/Arch system packages;
- repository download;
- exact branch checkout and safe update;
- npm dependencies;
- Chromium installation for UI checks;
- UI-variant doctor verification;
- Claude Code installation when absent;
- variant scaffolding and validation;
- generated registry refresh;
- UI Lab, TypeScript, and variant watchers;
- opening the exact live variant route;
- starting Claude inside the variant folder boundary.

The only required creative input is the variant name, such as:

```text
amtech-command-center
```

Claude may require interactive sign-in the first time.

## Every later session

Run the same file again:

```bash
bash ~/Downloads/ui-vibe.sh
```

It safely updates a clean checkout. When uncommitted UI work exists, it preserves that work and does not pull over it.

## Working rule

Tell Claude what the interface should feel like and what is visually wrong. Claude may edit only:

```text
mvp-build/apps/web/ui-variants/<variant-name>/
```

Stop the complete environment with `Ctrl+C`.

## Advanced/manual path

Technical collaborators may still use `mvp-build/UI_LAB_AGENT_ONBOARDING.md` and the lower-level variant commands. Multi-command user procedures should be represented by executable scripts rather than requiring non-technical collaborators to copy a sequence of terminal commands.
