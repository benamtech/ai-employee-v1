# UI Docs Canonicalized

Date: 2026-07-14 12:16 EDT
Status: docs/source-map cleanup
Scope: make the current UI/UX documentation order unambiguous after the Avery-first reset and PR #11 fixture-guard merge

## What changed

- Confirmed GitHub `main` and local `main` are at `f75d066`, which includes:
  - the canonical `mvp-build/ui-redesign/` Avery-first owner MVP packet and screenshots;
  - PR #11's UX system docs and fixture/production guard work.
- Moved the stale predecessor `mvp-build/ui-handoff/` packet to
  `mvp-build/docs/archive/ui-handoff-2026-07-14/`.
- Added `mvp-build/docs/archive/README.md`.
- Updated root and MVP README/source-map references so UI contributors start in:
  1. `mvp-build/docs/ux/`
  2. `mvp-build/ui-redesign/`
- Updated `mvp-build/CODEGRAPH.md`, `mvp-build/docs/ux/03-research-source-ledger.md`, the CE-04 handoff prompt,
  and the root generated index to stop treating `ui-handoff/` as current.

## Why

The old `ui-handoff/` packet still called itself the active canonical UI handoff. That was dangerous after
the Avery-first reset because it could send a future agent toward stale visual language, old IA, and pre-reset
surface assumptions. Preserving links was not a good enough reason to keep a misleading entry point.

## Current status

Current UI documentation order:

1. `mvp-build/docs/ux/` - master UX system, research ledger, coverage audit, generative UI frontier,
   fixture/production policy, and roadmap.
2. `mvp-build/ui-redesign/` - active owner MVP direction and fixture-guarded screenshots.
3. `mvp-build/docs/archive/ui-handoff-2026-07-14/` - historical reference only.

No runtime/provider acceptance changed.

## Files / seams touched

- `README.md`
- `index.html`
- `mvp-build/README.md`
- `mvp-build/CODEGRAPH.md`
- `mvp-build/docs/ux/03-research-source-ledger.md`
- `mvp-build/second-half-plan/context-engineering/ce-04-and-estimator-research-handoff-prompt.md`
- `mvp-build/docs/archive/`
- `mvp-build/memory/MEMORY.md`

## Carry-forward / next

Future UI agents should not start from `docs/archive/ui-handoff-2026-07-14/`. If they need old source inventory
or provenance, they may read it after the active `docs/ux/` and `ui-redesign/` packets.

## Verification

- Documentation/source-map change only.
- Checked for current `mvp-build/ui-handoff` references outside archive/memory/worktrees and updated the active ones.
