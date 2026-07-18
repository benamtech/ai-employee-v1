# First UI metaprogramming pass handoff

Status: executable first-pass renderer and optional R3F adapter source-wired
Updated: 2026-07-17

The UI pass starts from the compiled `ui-scaffold` profile, not hand-authored pages and not the synthetic 2,000-page scale output.

## Generate the inputs and rendered fixtures

```bash
cd GTM-RESEARCH/website-framework/reference
npm install
npm run manifest:emit
npm run ui:emit
npm run browser:check
npm run ui:r3f:build
```

Primary outputs:

- `generated-manifest/ui-scaffold.json`;
- `generated-manifest/vector-space.json`;
- `generated-manifest/agent-context.json`;
- `generated-ui/ui-plan.json`;
- `generated-ui/browser-targets.json`;
- `generated-ui/css-checklist.json`;
- `generated-ui/assets/amtech-ui.css`;
- complete noindex HTML fixtures;
- optional `three-scene.json` contracts.

## Browser-first rule

Before writing CSS, read browser targets from `package.json`, `.browserslistrc`, or framework configuration. The reference declares a Tier 2 baseline in `../.browserslistrc`: Chrome/Edge 111+, Firefox 113+, Safari/iOS Safari 16.4+.

Every CSS pass must emit the 57-item decision report. Do not introduce a feature outside the report, and do not generate dark-mode CSS.

## Required semantic constructors

`hero`, `answer`, `workflow`, `proof`, `comparison`, `faq`, `cta`, and `instruction`.

Required roles: `lead`, `support`, `proof`, `decision`, and `conversion`.

## Metaprogramming contract

The renderer receives:

```text
page-matrix coordinate
+ vector prototypes and nearest pages
+ semantic module sequence and layout roles
+ capabilities and variant axes
+ canonical content/evidence
+ browser target report
+ AMTECH design authority
```

It returns deterministic archetypes, component trees, static HTML, critical CSS, optional scene contracts, and hashes. It may not change target atoms, prototypes, questions, claims, evidence, information objects, graph edges, profiles, indexability, or publication gates.

## Page-matrix complement

Agents choose among `editorial`, `workflow-led`, `proof-led`, `comparison-led`, and `utility-led`. Selection must be explainable from page modules and matrix coordinates. Agents vary only declared axes.

## Optional 3D adapter

`reference/ui-r3f/` is optional, not a site dependency. It loads only after user activation, keeps static equivalent HTML/poster, permits one canvas, uses `frameloop="demand"`, adaptive DPR, instanced nodes and batched edges, no default postprocessing, no mandatory Wasm, and cannot alter canonical meaning, SEO, CTA, or layout stability.

## Required first-pass proof

- all `ui-scaffold` pages render;
- all module kinds and roles have coverage;
- browser resolution precedes CSS;
- 57 CSS decisions exist;
- source reordering preserves hashes;
- HTML meaning, metadata, JSON-LD, links, and noindex match compiler truth;
- no-JS output is complete;
- CSS stays below 24 KB;
- no forbidden palette or dark-mode branch;
- optional 3D is poster-first, bounded, demand-rendered, reduced-motion safe, and non-canonical.

## Still required before field pages

Browser visual regression, keyboard/screen-reader/zoom testing, measured LCP/INP/CLS, real mobile R3F performance, and reviewed search-distribution field gates.
