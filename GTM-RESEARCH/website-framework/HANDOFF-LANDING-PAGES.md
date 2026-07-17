# UI and Page-Generation Session Handoff

Read root/scoped identity, AGENTS, CODEGRAPH, `README.md`, `16-unified-hypervector-manifest-agent-harness.md`, `site-manifest.yaml`, and `reference/UI-DESIGN-SYSTEM-HANDOFF.md`.

Do not create independent HTML pages or bypass the manifest.

For UI work:

1. run `npm run manifest:emit` in `reference/`;
2. consume `ui-scaffold.json`, `vector-space.json`, semantic `PageIR`, and the supplied design system;
3. implement a deterministic design-system superset renderer;
4. preserve noindex, canonical questions, evidence, information objects, links, and instruction projections;
5. run browser, accessibility, metadata, structured-data, JS-disabled, responsive, reduced-motion, and source-order determinism tests.

For agent-generated page work:

1. build the hyper-aware context through `buildHyperAwareAgentContext()`;
2. propose `AgentPageProposal` objects with target feature atoms, marginal-coverage hypothesis, distinct information object, evidence bindings, semantic modules, design capabilities, and source provenance;
3. insert through `applyAgentPageProposal()`;
4. keep every proposal noindex at the research gate;
5. publish nothing until relevance, distinctness, evidence, UI, crawl, field-search, and commercial gates pass.
