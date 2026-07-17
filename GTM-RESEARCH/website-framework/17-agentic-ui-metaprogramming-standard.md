# 17 — Agentic UI Metaprogramming Standard

Status: first executable UI authority
Updated: 2026-07-17
Scope: `GTM-RESEARCH/website-framework/reference/`

## Objective

An agentic developer receives the unified page matrix, compiled hyper-vector geometry, semantic modules, evidence, and AMTECH design authority and must produce a deterministic, clean, professional, fast website without inventing a visual system page by page.

The UI system is not a prompt style guide. It is a compiler boundary:

```text
browser targets
+ AMTECH design authority
+ page matrix coordinate
+ vector prototypes and neighbors
+ semantic module graph
+ approved variant axes
-> deterministic layout archetype
-> constrained component plan
-> complete static HTML and critical CSS
-> optional poster-first interaction islands
```

## Part 1 — Browser and CSS contract

Before CSS is emitted, the compiler reads browser configuration in this order:

1. `package.json` browserslist;
2. `.browserslistrc`;
3. Vite, Next.js, or Astro configuration;
4. explicit Tier 2 fallback.

AMTECH currently declares Tier 2 floors: Chrome/Edge 111+, Firefox 113+, and Safari/iOS Safari 16.4+.

The compiler evaluates a fixed 57-item modern-CSS checklist. Stable Tier 2 features may be emitted directly; narrower features require progressive enhancement; experimental features remain skipped or guarded. The AMTECH rule against dark mode overrides generic CSS recommendations, so `light-dark()` and dark-mode branches are prohibited.

## Part 2 — Page-matrix UI derivation

Every page plan retains its matrix coordinate and vector provenance. Layout is derived from the information structure:

- workflow content -> `workflow-led`;
- technical proof and controls -> `proof-led`;
- decision criteria -> `comparison-led`;
- calculators, datasets, and live utilities -> `utility-led`;
- explanatory pages -> `editorial`.

The compiler maps all eight semantic module kinds and five layout roles to registered component constructors. Agents may select only approved variants. They may not change the canonical question, claims, evidence, graph edges, matrix coordinate, publication gate, or indexability.

## Part 3 — Optional Three.js/R3F capability

3D is a low-level optional projection of page geometry, not a separate content system. A page receives a scene only when its matrix and semantic modules justify an explanatory topology.

Mandatory rules:

- static SVG poster first;
- complete equivalent HTML outside WebGL;
- user activation before loading the island;
- one WebGL scene maximum per page;
- `frameloop="demand"`;
- bounded DPR with performance fallback;
- instanced nodes and batched edge segments;
- no postprocessing by default;
- no continuous decorative animation;
- reduced motion returns the static poster;
- no Wasm in the graphics path until a measured kernel beats JavaScript/Three.js end to end.

The optional adapter is React 19 + React Three Fiber 9.6.1 + Three.js 0.185.1. It remains outside canonical static rendering and can be omitted without changing page meaning, search visibility, conversion actions, or layout stability.

## Validation vector

```text
V_ui = [
  browser_target_resolution,
  css_feature_compatibility,
  matrix_coordinate_fidelity,
  vector_prototype_fidelity,
  semantic_module_coverage,
  layout_role_coverage,
  deterministic_component_selection,
  design_token_compliance,
  hierarchy_and_readability,
  responsive_reflow,
  accessibility,
  no_js_completeness,
  metadata_and_schema_parity,
  critical_css_bytes,
  canonical_javascript_bytes,
  layout_shift_risk,
  interaction_latency_risk,
  optional_scene_justification,
  scene_fallback_equivalence,
  scene_draw_call_budget,
  scene_triangle_budget,
  reduced_motion_behavior,
  source_reordering_determinism
]
```

A high aggregate score cannot override a hard failure in truth, accessibility, canonical parity, browser support, publication policy, or fallback completeness.

## Pass vector

- Browser targets resolve before any CSS recommendation.
- Exactly 57 CSS feature decisions are recorded.
- Every module kind and layout role has a constructor in the scaffold cohort.
- Every page plan contains its matrix coordinate, vector prototype IDs, neighbors, component plan, performance budget, and deterministic hash.
- Reordered source produces identical page-plan and site hashes.
- HTML preserves question, claims, metadata, JSON-LD, links, and robots state.
- JavaScript-disabled pages remain complete and actionable.
- Critical CSS remains within the declared 24 KB uncompressed first-pass budget.
- No dark-mode branch or forbidden palette enters output.
- Optional 3D scenes have poster equivalence, user activation, demand rendering, one-context limit, adaptive DPR, and no default postprocessing.
- The static page remains canonical when R3F is absent or disabled.

## Fail vector

- An agent chooses CSS before reading browser targets.
- Visual quality depends on unconstrained prompting or page-specific style invention.
- Matrix coordinates or vector geometry are discarded after content generation.
- A page can emit without a registered semantic constructor.
- Different agents produce structurally unrelated sites from the same approved inputs.
- UI variation changes facts, price, evidence, canonical intent, links, or publication state.
- Essential content or conversion actions exist only in JavaScript, canvas, or WebGL.
- Three.js loads on every page or runs a permanent 60 fps loop while idle.
- Multiple canvases create redundant WebGL contexts.
- Decorative shaders, postprocessing, textures, or large models enter the critical path.
- Wasm is introduced without a measured end-to-end benefit.
- CSS or interaction exceeds its budget without a recorded exception and benchmark.

## Current implementation boundary

Source-wired in this pass: Tier 2 browser detection, the 57-item CSS engine, AMTECH semantic design standard, deterministic page-matrix-to-layout compiler, static renderer, optional geometry-derived scene contracts, R3F demand adapter, tests, and CI emissions.

Still requiring browser-level proof: visual regression, accessibility/browser matrices, field Core Web Vitals, R3F device performance, and production search/conversion acceptance.
