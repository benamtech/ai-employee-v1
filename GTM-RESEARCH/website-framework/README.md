# Hyperperformant Holographic Website Framework

Status: Phase 1 specification complete; Phase 2 reference implementation started
Created: 2026-07-17
Implementation root: `GTM-RESEARCH/website-framework/`

## Software category

This is a **hyper-targeted search-distribution compiler and vector information server**, with an adaptive experience compiler and edge decisioning runtime around it.

Its primary commercial emission is a corpus of `200–2,000+` stable canonical pages that fit valuable search/query/context regions unusually well and can be compiled, validated, distributed, invalidated, and re-emitted at negligible marginal cost.

It compiles approved company knowledge, offers, proof, information objects, page-shape geometry, routes, design grammar, and experiment policy into:

- complete canonical websites;
- optimized hyper-targeted page corpora;
- finite context-resolved landing experiences;
- structured data and compact instruction-pointer projections;
- channel artifacts and explainable experiments.

It is not a covert profile system, fingerprinting product, arbitrary AI page generator, doorway-page factory, cloaking system, or substitute for human evidence and brand judgment.

## Governing priority

```text
1. maximize valuable compatibility-space coverage and page distinctness;
2. maximize deterministic compilation, validation, emission, and global delivery performance;
3. add bounded runtime variant selection only where it increases measured value.
```

HTML is a reproducible delivery emission. Canonical source truth is the typed information model, compatibility geometry, evidence graph, dependency graph, and page plan.

## Read order

1. `../../identity.md`
2. `identity.md`
3. `../../CODEGRAPH.md`
4. `CODEGRAPH.md`
5. `AGENTS.md`
6. numbered specifications `00` through `15`
7. `15-hyper-targeted-search-distribution-workstreams.md`
8. `reference/README.md`
9. `site-manifest.yaml`
10. `HANDOFF-LANDING-PAGES.md`
11. `../../docs/amtech-website-rewrite-brief.md`
12. `../../docs/AMTECH_WEB_DESIGN_SYSTEM.md`
13. `../../docs/AMTECH_AGENTIC_GENERATIVE_WEB_DESIGN_ADDENDUM.md`

`15` is the current execution authority. `14` remains the broader Phase 2 boundary and supporting workstream inventory.

## Mathematical thesis

A search context and a page expose partially compatible connector structures. Approved role/value features are encoded through classical Holographic Reduced Representations / Vector Symbolic Architectures:

```text
context = normalize(sum(weight * bind(role, value)))
page_fit = max approved prototype cosine + facets + graph + lexical/semantic fit
```

The contextual-ranking result in arXiv `2309.05113` is a baseline, not the destination. The framework must go beyond ranking an existing corpus by constructing the corpus itself.

The selected page set is a constrained coverage problem:

```text
F_cover(S) = sum_i demand_weight_i * phi(max_{page in S} compatibility(i,page))
```

Weighted facility location is the exact first control. Log-determinant/DPP diversity, complement-aware rare-tail selection, clustering, and optimal transport remain measured research arms.

Every published page must have positive marginal coverage, distinct visible information gain, evidence, a stable canonical question, graph utility, and lifecycle value.

## Architecture

```text
COMPANY SOURCE
knowledge + offers + claims + evidence + information objects + design grammar
        |
        v
TYPED INFORMATION / EXPERIENCE IR
context prototypes + page shapes + modules + routes + graph + dependencies
        |
        +----------------------+----------------------+
        v                      v                      v
CORPUS OPTIMIZER          VECTOR COMPILER       EMISSION COMPILER
coverage + distinctness   HRR + facets + CSR    HTML + schema + pointers
        |                      |                      |
        +----------------------+----------------------+
                               v
COMPILED INFORMATION SERVER
packed vectors + indexes + page plans + fragments + hashes
                               |
                 +-------------+-------------+
                 v                           v
STATIC CANONICAL ASSETS             FINITE EDGE RESOLVER
complete server HTML                bounded variant ID or baseline
                 |                           |
                 +-------------+-------------+
                               v
SEARCH / HUMAN / AGENT OBSERVATION
indexing + query fit + qualified leads + revenue + experiment evidence
```

## Canonical stack hypothesis

- **Reference/compiler:** strict TypeScript with owned IR and deterministic tests.
- **Performance kernel:** Zig `0.15.2` native and `wasm32-freestanding`; SIMD only after parity and end-to-end gain.
- **Representation:** packed structure-of-arrays vectors/facets, CSR graph, page plans, fragments, dependency indexes, hashes.
- **Emission:** complete canonical static HTML plus benchmarked fragments/compact IR where total cost improves.
- **Distribution:** Cloudflare Workers Static Assets with static bypass preferred; Worker resolver optional and baseline-safe.
- **Application renderer:** neutral semantic renderer first; AMTECH renderer later through mappings and tokens.
- **Experiments:** vendor-neutral boundary; external analytics/control planes cannot become page-availability dependencies.

## Compiler invariants

- deterministic builds, IDs, ordering, checksums, and tie policy;
- source/evidence/design contradictions fail before output;
- generated output is never authoritative source;
- one source change invalidates only its dependency closure;
- no unbounded runtime copy, route, symbol, component, or cache-key creation;
- exact controls remain available beside optimized paths;
- every page explains why it exists and what it uniquely covers.

## Search-distribution invariants

1. Every indexable URL has stable, useful, server-readable canonical content.
2. Crawlers and humans receive the same primary topic, claims, price, evidence, limitations, and links.
3. Finite presentation variants are not separate canonical intents by default.
4. No page exists solely because a Cartesian-product row can be generated.
5. Every page contains a distinct information object or synthesis visible in the body.
6. The system measures real query/page fit, qualified discovery, cannibalization, lifecycle cost, and revenue per page.
7. Scale advances through `20–40`, `200`, `500`, `1,000`, then `2,000+` only when the previous cohort passes.

## Privacy and truth invariants

- no browser fingerprinting, named-person dossiers, identity stitching, or sensitive-trait inference;
- no raw IP or private Google/Bing/Reddit history in vectors or persistent analytics;
- synthetic dimensions remain benchmark labels, not runtime inference targets;
- claims cannot exceed evidence;
- canonical pages remain complete without resolver, JavaScript, consent, databases, vectors, or experiments.

## Performance targets

Compiler and corpus:

- byte-identical clean builds;
- dependency-bounded incremental builds;
- approximately linear or better scaling through `2,000` page plans;
- no requirement to retain expanded DOM trees for the whole corpus;
- packed/binary representations retained only when total build+storage+runtime cost improves.

Resolver and delivery:

- cached canonical requests invoke no model, database, dynamic renderer, or scorer;
- static assets remain available when the Worker is disabled;
- default dynamic path performs zero remote data calls;
- edge compute p95 target `<=10 ms` after initialization;
- total resolver overhead p95 target `<=80 ms`;
- Zig/Wasm ships only with material end-to-end benefit.

Website:

- field p75 LCP target `<=1.8 s`, hard gate `<=2.5 s`;
- field p75 INP target `<=100 ms`, hard gate `<=200 ms`;
- CLS target `<=0.05`, hard gate `<=0.1`;
- no contradictory flash or third-party critical-render dependency.

## Current implementation state

Complete:

- Phase 1 scientific, architecture, privacy, SEO, compiler, design, and experiment specifications;
- deterministic 100-slice generator and validation record;
- current two-workstream execution plan in `15`;
- TypeScript reference package in `reference/`;
- deterministic HRR symbols, FFT binding/unbinding, superposition, cosine, and multi-prototype scoring;
- exact weighted facility-location greedy control;
- deterministic neutral HTML emission and dependency-bounded invalidation;
- four passing local reference tests and validation report.

Not complete:

- 500-case reviewed search-context benchmark;
- lexical/semantic/facet/graph/HRR comparison suite, calibration, NDCG, and zero-match validation;
- lazy greedy, exhaustive optimum controls, logdet/DPP, complement-aware, clustering, and OT arms;
- packed IR, CSR graph, streaming compiler, and `200–2,000` page benchmarks;
- Zig native, scalar Wasm, SIMD, Cloudflare deployment, browser/load/accessibility tests;
- real matched search-result field cohort, qualified pipeline, conversion, or revenue evidence.

## Production decision rule

The framework advances because it produces more appropriate real search-result coverage and commercial value per lifecycle dollar—not because it contains HRR, Zig, Wasm, clustering, optimal transport, or thousands of files.
