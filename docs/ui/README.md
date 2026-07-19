# AMTECH UI Documentation Index

## Read first

1. [`../AMTECH_WEB_DESIGN_SYSTEM.md`](../AMTECH_WEB_DESIGN_SYSTEM.md) — visual source of truth.
2. [`../AMTECH_AGENT_INTERFACE_STANDARD.md`](../AMTECH_AGENT_INTERFACE_STANDARD.md) — agent state, AG-UI, MCP Apps, authority, and evidence.
3. [`../AMTECH_UI_VALIDATION_STANDARD.md`](../AMTECH_UI_VALIDATION_STANDARD.md) — pass/fail release gates.
4. [`../AMTECH_WEB_DESIGN_SYSTEM_IMPLEMENTATION.md`](../AMTECH_WEB_DESIGN_SYSTEM_IMPLEMENTATION.md) — current implementation ledger only.

## Authority rules

- The first three documents are normative.
- Implementation notes, dated handoffs, research notes, screenshots, fixture descriptions, and historical design-system experiments are informative only.
- Historical “369 method,” square-corner, 3px-grid, black-panel, or ink/white/red-only UI guidance is superseded.
- Research may explain a decision but cannot silently redefine tokens, safety, evidence, or interaction contracts.

## Active artifacts

| Artifact | Purpose |
|---|---|
| `mvp-build/apps/web/app/globals.css` | runtime tokens and base components |
| `mvp-build/validation/amtech-agent-ui-vectors.json` | machine-readable conformance vectors |
| `mvp-build/scripts/validate-ui-system.mjs` | source validator |
| `mvp-build/tests/unit/amtech-agent-ui-contract.test.ts` | source and semantic contracts |
| `.github/workflows/ui-agent-interface-standard.yml` | exact-SHA CI gate |

## Historical material

Dated memory and handoff files remain useful as an audit trail. When they conflict with the canonical documents, preserve them as history and add a superseded notice rather than treating them as current instructions.

Deleted or archived GTM/UI research should be distilled into the canonical standards before removal. Do not retain multiple active design doctrines.

## Surface inventory

The implementation ledger must inventory at least:

- public front door;
- create employee and identity verification;
- login/authentication;
- owner dashboard;
- owner work surface;
- signed Review;
- estimator;
- admin/operator console;
- generated work objects;
- AG-UI event adapters;
- MCP Apps resources and fallbacks.
