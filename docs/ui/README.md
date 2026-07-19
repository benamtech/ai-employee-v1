# AMTECH UI Documentation Index

## Read first

1. [`../AMTECH_WEB_DESIGN_SYSTEM.md`](../AMTECH_WEB_DESIGN_SYSTEM.md) — visual source of truth.
2. [`../AMTECH_AGENT_INTERFACE_STANDARD.md`](../AMTECH_AGENT_INTERFACE_STANDARD.md) — operating primitives, adaptive layout, context compilation, delegation, AG-UI, MCP Apps, authority, and evidence.
3. [`../AMTECH_UI_VALIDATION_STANDARD.md`](../AMTECH_UI_VALIDATION_STANDARD.md) — pass/fail release gates and required evidence artifacts.
4. [`../AMTECH_WEB_DESIGN_SYSTEM_IMPLEMENTATION.md`](../AMTECH_WEB_DESIGN_SYSTEM_IMPLEMENTATION.md) — current branch implementation ledger only.
5. [`HERMES_RUNTIME_UI_DERIVATIONS.md`](HERMES_RUNTIME_UI_DERIVATIONS.md) — runtime-derived UI constraints; informative unless promoted into a canonical standard.

## Authority rules

- The first three documents are normative.
- The implementation ledger records current source and evidence state but cannot redefine doctrine.
- Hermes derivations, dated handoffs, research notes, screenshots, fixture descriptions, and historical design experiments are informative only.
- Historical fixed-tab, Home/Talk/Proof/Connected, “369 method,” square-corner, 3px-grid, black-panel, or ink/white/red-only UI guidance is superseded.
- Research may explain or challenge a decision but cannot silently redefine tokens, authority, safety, evidence, or interaction contracts.
- Raw AGENTS.md, CODEGRAPH.md, soul files, private memory, provider payloads, secrets, and chain-of-thought are never browser UI inputs. They compile into bounded doctrine/version/capability signals.

## Active artifacts

| Artifact | Purpose |
|---|---|
| `mvp-build/apps/web/app/globals.css` | runtime tokens and base components |
| `mvp-build/packages/shared/src/operating-system.ts` | typed work loops, active saves, decisions, changes, delegation, and evidence |
| `mvp-build/packages/shared/src/operating-layout.ts` | deterministic adaptive-layout planner and scoring |
| `mvp-build/apps/manager/src/lib/operating-surface.ts` | owner-safe context compiler and operating-state materialization |
| `mvp-build/apps/web/app/agent/[employeeId]/AgentSurface.tsx` | adaptive owner operating surface |
| `mvp-build/validation/amtech-agent-ui-vectors.json` | machine-readable conformance vectors |
| `mvp-build/scripts/validate-ui-system.mjs` | source validator |
| `mvp-build/tests/unit/amtech-agent-ui-contract.test.ts` | source, semantic, and planner contracts |
| `mvp-build/infra/scripts/ui/fixture-browser.mjs` | browser acceptance matrix; must not encode deleted fixed tabs |
| `.github/workflows/ui-agent-operating-surface.yml` | exact-SHA UI source, browser, and production-build gate |

## Current blocking state

| Blocker | Status |
|---|---|
| PR merge-ref Manager typecheck | Failing because owner-login audit reads `session_id` from a return contract not present on `research` |
| Visible owner login | API route exists; authored form is not connected |
| Adaptive browser acceptance | Existing fixture requires replacement |
| Research-browser rendered fixture | Not yet accepted |
| Real staging and fixture-free packet | Not run; no launch claim |

## Historical material

Dated memory and handoff files remain useful as an audit trail. When they conflict with the canonical documents, preserve them as history and add a superseded notice rather than treating them as current instructions.

Deleted or archived GTM/UI research must be distilled into the canonical standards before removal. Do not retain multiple active design doctrines.

## Surface inventory

The implementation ledger must inventory at least:

- public front door;
- create employee and identity verification;
- login/authentication;
- owner dashboard;
- owner operating surface;
- signed Review;
- estimator;
- admin/operator console;
- generated work objects;
- AG-UI event adapters;
- MCP Apps resources and fallbacks;
- research-browser, ecommerce, and growth fixtures;
- delegated work and active-save states.
