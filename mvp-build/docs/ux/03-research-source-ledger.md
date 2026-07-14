# UX Research Source Ledger

Status: active  
Purpose: keep external and internal UX research findable

## Primary External Sources

| Source | Use in AMTECH |
|---|---|
| Mac OS X Human Interface Guidelines, June 2002: https://dn721903.ca.archive.org/0/items/apple-hig/MacOSX_HIG_2002_06_01.pdf | Concrete metaphors, direct manipulation, user control, feedback, consistency, WYSIWYG, forgiveness, perceived stability, aesthetic integrity, and modelessness. |
| MCP resources spec: https://modelcontextprotocol.io/specification/2025-06-18/server/resources | Resources are application-driven; hosts choose how users discover, select, and use them. Supports AMTECH's resource/work-object layer. |
| MCP tools spec: https://modelcontextprotocol.io/specification/2025-06-18/server/tools | Tools are model-controlled, but human-in-the-loop denial/confirmation and visible invocation indicators are safety expectations. Supports approval gates. |
| MCP-UI project: https://github.com/MCP-UI-Org/mcp-ui | Current AMTECH implementation compiles typed work views into `ui://` resources and renders them in a sandboxed host. |
| CHAI-T trust framework: https://arxiv.org/abs/2404.01615 | Trust depends on ability, integrity, benevolence, predictability, and transparency; AMTECH should show proof and boundaries, not raw internals. |
| AI confidence calibration research: https://arxiv.org/abs/2402.07632 | AI confidence can distort human judgment; AMTECH should ask for exact approval and show evidence rather than over-selling certainty. |
| Mixed-initiative interaction / locus of control: https://arxiv.org/abs/2107.00690 | AMTECH should vary initiative by risk: Avery prepares independently, owner commands/corrects/approves at boundaries. |

## Internal Sources

| Source | Role |
|---|---|
| `mvp-build/ui-redesign/` | Active owner MVP design packet and screenshots. |
| `mvp-build/docs/state-of-progress-2026-07-14.md` | Current whole-product / second-half / context-engineering progress state. |
| `wiki/MVP/ai-native-work-surface-research.md` | AI-native operating-surface research spine. |
| `wiki/MVP/event-driven-office-and-generative-ui.md` | Event flow and generative UI product framing. |
| `mvp-build/second-half-plan/surface-research-hermes-gui-and-materialization.md` | Hermes/materialization research behind `SurfaceEnvelope` and work resources. |
| `mvp-build/second-half-plan/context-engineering/` | Context-engineering UX substrate: memory, primer, compression, hooks, rotation, connector policy. |
| `mvp-build/docs/archive/ui-handoff-2026-07-14/` | Archived historical UI collaborator packet and data catalog. Use only for provenance or older source inventory; current UX work starts in `mvp-build/docs/ux/` and `mvp-build/ui-redesign/`. |
