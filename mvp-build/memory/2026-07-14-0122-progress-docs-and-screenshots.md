# Progress docs, wiki state, and screenshots updated

Date: 2026-07-14 01:22 EDT  
Status: docs/source-map update  
Scope: declarative progress record, active redesign packet screenshots, memory/wiki/codegraph propagation

## What changed

- Added `docs/state-of-progress-2026-07-14.md`, a declarative state update across:
  - the whole-product MVP bar;
  - the second-half build plan phase map;
  - recent context-engineering changes.
- Updated the active `ui-redesign/` packet README and index to state that the Avery-first owner MVP route is now
  source-wired locally, not merely a design proposal.
- Copied the latest UI fixture screenshots into `ui-redesign/screenshots/` and embedded them in the packet README:
  - desktop Home;
  - mobile Home;
  - Proof;
  - signed mobile Review.
- Updated memory so the next agent sees the headed UI smoke result and knows where the declarative progress update lives.

## Current product truth

The owner MVP UI direction is now Avery-first Home / Talk / Proof / Connected, centered on Tell Avery,
Needs your say, quiet Watching, exact approvals, and proof. The older multi-region desk, dashboard, and
chat-native agent desktop language is historical context only.

The whole product remains source-wired but not trial-ready. Live provider/runtime acceptance, real-VPS
recovery, egress apply, observability, capacity, old employee reprovisioning, and funded provider-backed
Hermes tool-loop proof are still pending.

## Verification

No new code behavior was added in this docs pass. It carries forward the UI implementation checks:

- focused owner-surface unit test passed;
- web typecheck passed;
- `ui:test` passed;
- headed fixture UI smoke passed against an explicit `127.0.0.1:3200` fixture server;
- full typecheck, lint, unit, and build passed.
