# 15 — Hyper-Targeted Search Distribution: Two Priority Workstreams

Status: current Phase 2 execution authority; implementation started
Updated: 2026-07-17
Scope: `GTM-RESEARCH/website-framework/`

## Governing objective

Build a hyper-performant vector information server whose primary commercial emission is a corpus of `200–2,000+` stable canonical pages that fit valuable search/query/context regions unusually well and can be compiled, validated, distributed, invalidated, and re-emitted at negligible marginal cost.

Priority order:

```text
1. maximize valuable compatibility-space coverage and page distinctness;
2. maximize deterministic compilation, validation, emission, and global delivery performance;
3. add bounded runtime variant selection only where it increases measured value.
```

The contextual-ranking result in arXiv `2309.05113` is a baseline: query/document relevance and context/document compatibility are separable. This framework must go beyond ranking an existing corpus by constructing the corpus itself, selecting the minimum valuable set of page shapes, and emitting coordinated human/search/instruction-pointer projections.

HTML is a disposable emission. Canonical source truth is the typed information model, compatibility geometry, evidence graph, and page plan.

This document narrows `14-phase-2-experience-materialization-engine-plan.md` into the two highest-value workstreams. Existing truth, privacy, evidence, accessibility, canonical-baseline, and finite-runtime constraints remain active.

## Current executable state

Started in `reference/`:

- deterministic seeded HRR symbols;
- radix-2 FFT circular convolution, involution, binding, and unbinding;
- weighted superposition, normalization, cosine, and multi-prototype page scoring;
- exact weighted facility-location corpus selection under a budget;
- deterministic neutral HTML emission;
- dependency-bounded invalidation indexing;
- four passing local reference tests.

This is a correctness oracle only. It does not establish search ranking, revenue, large-corpus performance, Zig/Wasm benefit, browser behavior, or production acceptance.

# Mathematical contract

## Context and page shapes

Let `C = {c_i}` be a frozen set of weighted valuable search-context prototypes. A prototype is built from approved role-bound features:

```text
h(c_i) = normalize(sum_k w_ik * bind(role_k, value_ik))
```

A page `p_j` may represent a non-convex compatibility region through multiple approved prototypes:

```text
P_j = {p_j1, ..., p_jm}
hrr_fit(i,j) = max_t cosine(h(c_i), p_jt)
```

The complete auditable fit is:

```text
kappa(i,j) = eligibility(i,j) * calibrate(
  alpha * hrr_fit(i,j)
+ beta  * facet_fit(i,j)
+ gamma * lexical_semantic_fit(i,j)
+ delta * graph_fit(i,j)
+ eta   * evidence_fit(i,j)
- penalties(i,j)
)
```

`eligibility` is a hard Boolean gate. A weighted score cannot rescue an unsupported claim, duplicate canonical intent, wrong offer, missing evidence, inaccessible page, or prohibited context.

## Corpus objective

Choose a finite corpus `S` from candidate page shapes under build, review, crawl, and lifecycle budgets:

```text
F_cover(S) = sum_i demand_weight_i * phi(max_{j in S} kappa(i,j))
```

where `phi` is monotone and saturating. Weighted facility location is the exact first optimization control and is monotone submodular under non-negative weights.

Research arms may add:

```text
F(S) = F_cover(S)
     + lambda * concave_information_object_coverage(S)
     + rho    * logdet(I + tau*K_S)
     + xi     * rare_tail_preservation(S)
     - lifecycle_cost(S)
```

- `logdet`/DPP-style terms reward diversity when the kernel is positive semidefinite.
- complement-aware submodular information is a 2026 research arm for preserving rare coherent regions without selecting isolated noise.
- optimal transport and Gromov-Wasserstein are offline correspondence arms, not request-path assumptions.
- hard page-count, cost, evidence, and route constraints are handled as knapsack/matroid-style constraints or rejection gates.

The compiler must report marginal coverage for every published page:

```text
marginal_value(p | S) = F(S union {p}) - F(S)
```

A page with no meaningful marginal value is consolidated or rejected.

# Workstream 1 — Holographic Compatibility and Corpus Optimization

## Part 1A — Search-context algebra and ground-truth benchmark

### Objective

Create the executable representation and frozen benchmark required to prove that compositional page/context fit outperforms keyword, graph-only, embedding-only, and contextual-ranking baselines.

### Deliverables

- typed `ContextPrototype`, `PageShape`, `PrototypeSet`, `FacetRegion`, `EvidenceGate`, and `CompatibilityExplanation` contracts;
- deterministic role/value dictionary and pre-bound vectors;
- multi-prototype HRR page regions;
- lexical, dense-semantic, typed-facet, graph, and HRR scoring arms behind one interface;
- at least `500` reviewed query/context/page tuples across five verticals;
- explicit context-rich, context-poor, ambiguous, conflicting, no-match, and held-out-domain cases;
- relevance labels `0..4`, commercial weights, provenance, and assessor disagreement;
- zero-match and calibrated-fallback evaluation;
- ablation runner for every feature family.

The benchmark models plausible search contexts and explicit query evidence. It does not claim access to a search engine's private user profile.

### Validation vector

- regenerate symbols and benchmark artifacts from a clean state;
- compare naive and FFT circular convolution;
- test bind/unbind retrieval, superposition capacity, feature dropout, noise, and repeated binding at dimensions `512/1024/2048/4096`;
- compare contextual lexical-semantic ranking equivalent in scope to arXiv `2309.05113` against facets, graph, embeddings, HRR, and hybrid arms;
- hold out entire industries, tasks, and context combinations;
- measure NDCG@5/10, top-one grade, bad-fit rate, zero-match accuracy, calibration, context-poor fallback, runtime, and explanation stability;
- blind-review errors and cases where simpler controls win;
- verify no target page ID, slug, or answer label leaks into features.

### Pass vector

- deterministic artifact and symbol parity across clean runs;
- naive and FFT convolution agree within declared tolerance;
- hard-ineligible selection rate is zero;
- zero-match and sparse-context cases return a broad valid baseline rather than the least-bad specialized page;
- the chosen representation materially improves held-out relevance or bad-fit rejection over the strongest simpler control;
- every score decomposes into declared terms and source features;
- multi-prototype pages beat single centroids on preregistered non-convex cases;
- dimension is selected from measured capacity/latency curves;
- no private, sensitive, or unavailable visitor attribute is required.

### Fail vector

- HRR merely reproduces keyword or embedding clusters;
- gains disappear on held-out industries or context combinations;
- exact target labels leak into the representation;
- raw cosine is treated as confidence without calibration;
- the nearest page is returned when no valid match exists;
- a complex method wins only after post-hoc tuning;
- page compatibility cannot be explained in visible content terms;
- synthetic demographic labels become runtime inference targets.

## Part 1B — Submodular page-set optimizer and distinctness compiler

### Objective

Select the smallest economically useful set of canonical page shapes that maximizes valuable context coverage while preserving rare coherent regions, information gain, graph connectivity, and lifecycle efficiency.

### Deliverables

- exact weighted facility-location objective and deterministic greedy control;
- lazy-greedy and memoized implementations;
- budgeted cost-aware selection;
- information-object saturation term;
- route/evidence/canonical-intent hard constraints;
- optional log-determinant/DPP diversity arm;
- complement-aware rare-tail research arm;
- duplicate/cannibalization graph;
- page create/expand/consolidate/reject decisions;
- per-page marginal coverage and lifecycle-cost explanation;
- corpus frontier reports at `200/500/1000/2000` pages.

### Validation vector

- compare optimizer output with exhaustive optimum on small frozen instances;
- compare exact greedy, lazy greedy, DPP/logdet, graph cut, set cover, embedding clustering, HRR clustering, and random selection;
- inject duplicate pages, broad hubs, narrow perfect fits, isolated outliers, and rare coherent slices;
- vary page/review/crawl/update budgets;
- perturb demand weights and measure selection stability;
- remove each selected page and recompute lost coverage;
- change one canonical fact and measure dependency fan-out;
- score human-review actionability and information-gain distinctness blind to method.

### Pass vector

- exact and lazy implementations select the same deterministic set under the same objective;
- greedy matches exhaustive optimum on declared small controls or remains within the expected approximation envelope;
- every selected page has positive preregistered marginal coverage and at least one distinct information object;
- duplicate canonical-intent rate is zero;
- broad hubs do not suppress narrow high-value pages solely through aggregate demand;
- coherent rare slices survive when valuable; isolated noise does not;
- the optimizer rejects low-value Cartesian-product pages;
- the framework explains why page `n` exists, what it uniquely covers, and which page would replace it;
- lifecycle cost, crawl load, and review cost remain inside budget.

### Fail vector

- page count becomes the objective;
- metadata or noun substitution is mistaken for distinctness;
- rare-tail weighting selects incoherent outliers;
- a diversity term sacrifices high-value compatibility without measurable benefit;
- most pages have negligible leave-one-out coverage;
- the optimizer cannot recommend consolidation or rejection;
- demand-weight changes cause unexplained corpus collapse;
- a single fact update unnecessarily invalidates the whole corpus.

## Part 1C — Real search-result distribution experiment

### Objective

Prove that compatibility-optimized pages are discovered for more appropriate non-branded query regions and produce more qualified business value per page than conventional and graph-only page cohorts.

### Deliverables

- predeclared matched page cohorts: conventional expert, old graph-materialized, and hyperdimensional-optimized;
- `20–40` initial canonical pages, not thousands;
- one original information object per page;
- Search Console and Bing Webmaster ingestion;
- query/page compatibility adjudication;
- indexing, canonical, crawl, internal-link, and cannibalization monitors;
- first-party qualified-lead and revenue attribution;
- scale decision for `200`, then `500+` pages.

### Validation vector

- freeze page opportunities, cohorts, primary metrics, observation window, and exclusions before publication;
- verify server-readable canonical HTML, metadata, structured data, evidence, links, and CTA parity;
- track non-branded impressions, clicks, query diversity, indexation, cited/grounding queries where available, qualified leads, assisted pipeline, closed revenue, and gross profit;
- manually grade observed query-to-page fit;
- normalize results by page count, publishing age, link support, and production cost;
- detect cannibalization and pages receiving only irrelevant traffic;
- retain null and negative outcomes.

### Pass vector

- treatment pages surface for a broader or more precise valuable query set than matched controls;
- manual query/page compatibility improves without lower human usefulness;
- qualified discovery or attributable commercial value per page improves;
- gains are not explained only by publishing more pages or branded demand;
- no material indexing, trust, canonical, accessibility, or cannibalization regression;
- results justify the next corpus scale step.

### Fail vector

- treatment creates impressions without qualified discovery;
- most pages remain unindexed or search systems consolidate them as duplicates;
- conventional pages perform equally at lower lifecycle cost;
- observed gains depend on branded/self traffic;
- the system optimizes synthetic geometry but not real queries;
- the field test does not justify scaling beyond the initial cohort.

# Workstream 2 — Hyper-Performance Vector Information Server and Emission Runtime

## Part 2A — Packed IR, dependency compiler, and deterministic emissions

### Objective

Make the vector information server—not HTML—the authoritative compiled system, with HTML and other surfaces emitted reproducibly through renderer adapters.

### Deliverables

- owned typed source model for knowledge, claims, evidence, information objects, page shapes, routes, modules, links, offers, and instruction pointers;
- semantic `ExperienceIR` independent of React, Next.js, Cloudflare, and AMTECH styling;
- stable integer/string IDs and deterministic ordering;
- packed structure-of-arrays vectors and facets;
- CSR graph and dependency indexes;
- page plans and fragment tables;
- neutral semantic HTML emitter;
- optional compact instruction-pointer projection;
- content-addressed hashes and generated headers;
- exact dependency-closure invalidation;
- streaming build path that does not retain the expanded corpus in memory.

### Validation vector

- compile identical inputs three times with shuffled source order;
- render through neutral HTML and a second deliberately different adapter;
- change one claim, proof, price, information object, graph edge, route, and shared shell item independently;
- inject duplicate IDs/routes, cycles, dangling references, unsupported schema, invalid CTAs, and evidence contradictions;
- compare array-of-objects, structure-of-arrays, JSON IR, and compact binary IR;
- measure clean/incremental build time, peak memory, bytes, invalidation fan-out, and byte-identical output at `200/500/1000/2000` pages.

### Pass vector

- repeated clean builds are byte-identical;
- source order does not affect semantics;
- all emissions trace to versioned source IDs;
- unsupported claims, duplicate routes, cycles, and broken dependencies fail before output;
- one source change rebuilds only the exact dependency closure;
- the compiler processes `2,000` page plans without retaining `2,000` expanded DOM trees;
- renderer changes do not alter canonical truth, heading semantics, links, metadata, structured data, or CTA contracts;
- adding the AMTECH design system requires mappings/tokens rather than content-model changes.

### Fail vector

- generated HTML or prose becomes source truth;
- renderer code leaks into compatibility or evidence logic;
- every change forces a full rebuild without measured necessity;
- compact formats save bytes but make builds slower or unreviewable;
- human and instruction-pointer projections contradict each other;
- the compiler can emit quickly but cannot reject invalid pages quickly.

## Part 2B — Zig native and WebAssembly SIMD kernels

### Objective

Move proven bulk vector, coverage, duplicate, and emission operations into a retargetable high-performance kernel only where measured end-to-end gains justify it.

### Deliverables

- TypeScript oracle retained as semantic authority;
- Zig `0.15.2` native library/CLI;
- `wasm32-freestanding` scalar build;
- optional Wasm SIMD build using fixed-width vector operations;
- minimal ABI for normalize, dot/top-k, weighted add, optional FFT bind, similarity matrix blocks, facility-location marginal gains, and duplicate scans;
- shared golden binary fixtures;
- feature detection and scalar/TypeScript fallback;
- native build-time benchmark and Worker-compatible Wasm benchmark.

### Validation vector

- compare TypeScript, Zig native, scalar Wasm, and SIMD Wasm across every golden and randomized fixture;
- fuzz lengths, alignment, offsets, NaN/infinity, zero norms, corrupted buffers, and memory boundaries;
- measure compilation throughput, vector throughput, similarity-matrix throughput, marginal-gain throughput, initialization, binary size, memory, and end-to-end build/runtime latency;
- benchmark dimensions and corpus sizes rather than one favorable microcase;
- test strict and optimized floating-point policies separately;
- disable Wasm and verify deterministic fallback.

### Pass vector

- candidate ordering and page-set selection remain identical under the declared tolerance/tie policy;
- fuzzing finds zero memory-safety or invalid-number escapes;
- SIMD is optional and feature-detected;
- retained kernels produce a material end-to-end benefit, not only a synthetic instruction benchmark;
- native/Wasm artifacts remain small enough for target startup and memory budgets;
- failure falls back to TypeScript and then canonical emission.

### Fail vector

- Zig or Wasm becomes the oracle;
- scalar/SIMD ranking or corpus selection drifts;
- optimized float mode changes deterministic decisions;
- ABI copies outweigh compute savings;
- binary/startup cost exceeds measured benefit;
- Wasm is required for canonical page availability.

## Part 2C — Mass emission, edge distribution, and search delivery

### Objective

Emit and globally distribute thousands of complete hyper-targeted canonical pages with near-zero cached delivery cost while preserving a minimal finite resolver for optional presentation variants.

### Deliverables

- canonical static HTML emission for every approved URL;
- benchmarked full-page, precompiled-fragment, compact semantic-tree, and binary-patch artifact strategies;
- content-addressed immutable assets;
- Cloudflare Workers Static Assets deployment;
- optional Worker route/variant selector that can always bypass to the canonical asset;
- cache-prewarm policy for high-demand pages and materialize-once policy for finite rare variants;
- sitemap partitions, feeds, internal-link graph, and crawl-budget reports;
- load and cold/warm test harness;
- `200/500/1000/2000` page plus `2–3` finite-variant stress suites.

### Validation vector

- compare full canonical HTML, fragments, compact IR assembly, and binary patches on build time, stored/compressed bytes, cache cardinality, first miss, cache hit, CPU, memory, and operational complexity;
- benchmark static-asset bypass versus Worker-first routing;
- measure p50/p95/p99 lookup, score, assembly, and response latency;
- test cold/warm/burst/worst-route loads;
- capture browser and crawler HTML with JavaScript disabled;
- run accessibility, metadata, structured-data, canonical, internal-link, duplicate, and layout-shift tests;
- purge/change one dependency and verify bounded re-emission and cache invalidation;
- verify Worker/platform outages still serve canonical assets.

### Pass vector

- every approved URL has complete server-readable canonical HTML;
- cached canonical requests require no scoring, database, model, or dynamic rendering;
- static assets remain available when the Worker/resolver is disabled;
- the chosen emission strategy minimizes total build+storage+miss+hit cost at target scale;
- `2,000` pages and `6,000` finite experiences build, validate, and deploy inside a fixed reproducible budget;
- artifact count remains within platform limits and cache cardinality is bounded by page/variant IDs, never visitor identity;
- crawler/browser primary content, claims, evidence, links, metadata, and structured data remain equivalent;
- search distribution metrics can be joined back to page shapes and optimizer decisions.

### Fail vector

- runtime generates prose or page structure;
- variants require hydration for essential content;
- Worker-first routing adds cost to every static request without measured value;
- cache keys grow with unbounded context or identity;
- full HTML duplication is retained when compact plans materially lower total cost—or compact plans are retained when full static assets are faster and cheaper;
- edge failure blocks canonical pages;
- emission speed is high but crawlability, distinctness, or real search distribution fails.

# Immediate implementation sequence

```text
1A.1 finish TypeScript HRR oracle and golden fixtures
1B.1 finish exact/lazy facility-location optimizer and exhaustive small controls
2A.1 define packed ExperienceIR and dependency compiler
1A.2 generate 500-case search-context benchmark
1B.2 compile first 200-page synthetic candidate universe and reject redundant pages
2A.2 emit neutral canonical HTML and instruction-pointer projections
2B.1 implement Zig native/scalar Wasm parity kernels
2C.1 run 200/500/1000/2000 emission benchmarks
1C.1 publish only the first matched 20–40-page field cohort
2B.2 add SIMD only after scalar parity
2C.2 deploy static assets plus baseline-safe Worker
```

# Graduation rule

The framework advances because it produces more appropriate real search-result coverage and commercial value per lifecycle dollar—not because it contains HRR, Zig, Wasm, clustering, optimal transport, or thousands of files.
