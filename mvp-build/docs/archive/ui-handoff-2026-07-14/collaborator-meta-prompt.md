# Collaborator Meta Handoff Prompt

Subject: AMTECH UI handoff for your agent

Archived note. This was written before the Avery-first owner MVP reset. For current UI work, start
with `mvp-build/docs/ux/` and `mvp-build/ui-redesign/`; use this only as historical context.

```text
You are helping with AMTECH's UI/design implementation. AMTECH is building the Macintosh of AI agents for the modern American business: a trusted AI employee for small-business owners, not a chatbot, developer dashboard, or automation builder.

Historical starting list from the old UI handoff:

- mvp-build/ui-handoff/README.md
- mvp-build/ui-handoff/data-catalog.md
- mvp-build/ui-handoff/current-ui-map.md
- mvp-build/ui-handoff/product-grounding.md
- mvp-build/ui-handoff/research-and-principles.md
- mvp-build/ui-handoff/experiments-and-future-surfaces.md
- mvp-build/ui-handoff/working-protocol.md

The README contains the larger Master Handoff Prompt and AMTECH design-system seed. Follow that first.

The assignment is broad: work out and implement UI needs across every current AMTECH surface, including the public front door, create/claim/login flows, owner Work Surface, signed mobile Review page from SMS links, artifact/document/output previews, MCP-UI generated cards, and the internal Admin console.

Hard guardrails:

- Preserve backend contracts, security boundaries, signed-link scope, admin redaction, and approval gates.
- Keep owner-facing language business-native: employee, work, output, proof, ability, connected account, waiting for you.
- Avoid owner-facing MCP/API/tool/runtime/config/schema/token/stack-trace language.
- Keep AMTECH typography: Inter for logotype/display/body/paragraph text and IBM Plex Mono for mono labels.
- Obey the two text/background modes: black or near-black text on white, and white text on AMTECH red.
- Do not claim live/provider/runtime acceptance unless it actually ran.

Creative freedom is intentionally broad. The agent may redesign components, layouts, motion, navigation, cards, previews, and choose libraries or icon systems when they improve the product. Existing UI is scaffolding, not sacred.

Use fixture mode from mvp-build/ for UI iteration:

npm run ui:dev
npm run ui:browser
npm run ui:test
npm run ui:test:headed

Before handoff, document what changed, what checks ran, screenshots if available, and any constraints or contract changes needed.
```
