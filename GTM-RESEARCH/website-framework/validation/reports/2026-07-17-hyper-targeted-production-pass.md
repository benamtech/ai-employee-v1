# Hyper-Targeted Framework Production-Oriented Reference Pass

Date: 2026-07-17
Branch: `agent/phase-2-materialization-engine-plan`
Status: source-wired and locally validated where listed; not live-accepted

## Implemented scope

### Workstream 1A — context algebra and benchmark

- deterministic role/value HRR symbols;
- radix-2 FFT and naive circular convolution controls;
- bind, unbind, superposition, normalization, cosine, and multi-prototype scoring;
- deterministic `500` context / `240` candidate benchmark;
- lexical, hashed-semantic, typed-facet, graph, HRR, and hybrid scoring arms;
- NDCG@5/10, top-one, zero-match, bad-fit, and reciprocal-rank metrics;
- future UI design-capability requirements embedded in context/page feature data.

### Workstream 1B — corpus optimizer

- weighted facility-location objective;
- exact greedy, exhaustive small-instance, and lazy-greedy controls;
- information-object concave saturation;
- coherent rare-tail bonus requiring at least two related pages;
- positive-semidefinite log-determinant diversity arm;
- leave-one-out marginal coverage.

### Workstream 1C — real distribution and conversion infrastructure

- matched cohort manifest for conventional, graph, and hyperdimensional arms;
- search observation schema;
- allowlisted conversion/revenue event schema;
- deterministic experiment assignment and event deduplication;
- per-page indexing, impressions, compatible clicks, query diversity, qualified starts, closed revenue, gross profit, and lifecycle-return metrics.

### Workstream 2A — packed compiler and emissions

- typed evidence, claims, information objects, modules, pages, routes, features, and dependencies;
- renderer-independent semantic PageIR;
- packed Float32 page vectors;
- CSR graph and design-capability indexes;
- deterministic neutral HTML, visible JSON-LD, sitemap, and compact instruction-pointer projections;
- content-addressed hashes and dependency-bounded invalidation;
- design-system superset satisfiability contract.

### Workstream 2B — Zig/Wasm source wiring

- Zig scalar and `@Vector(4, f32)` SIMD dot kernels;
- normalization, weighted add, and facility-marginal ABI;
- `wasm32-freestanding` scalar/SIMD build script pinned to Zig `0.15.2`;
- browser/Worker-compatible Wasm adapter;
- deterministic TypeScript fallback and parity script.

### Workstream 2C — mass emission and edge distribution

- deterministic scale runner at `200/500/1000/2000` pages;
- full static emitter for HTML, `use.md`, sitemap, packed vectors, CSR graph, variant manifest, hashes, and headers;
- Cloudflare Workers Static Assets configuration with assets-first default;
- Worker execution restricted to `__resolve` and `__experiment` routes;
- finite manifest resolver with eligibility, confidence fallback, noindex/private responses, and no persistence in the reference experiment endpoint.

## Commands run

```bash
cd /mnt/data/hyper-framework/reference
npx --yes -p typescript@5.8.3 tsc -p tsconfig.json
node --test test/*.test.mjs
node scripts/run-scale.mjs
node scripts/emit-site.mjs 2000 generated
```

## Test results

```text
tests: 12
passed: 12
failed: 0
```

Validated behaviors:

- FFT circular convolution matched naive convolution within `1e-10` on the declared fixture;
- HRR bind/unbind recovered the intended value with more than `0.5` cosine margin over the distractor;
- multi-prototype scoring selected the intended prototype above `0.99`;
- facility greedy rejected a near-duplicate and matched exhaustive optimum on the small control;
- lazy greedy matched exact greedy on the declared fixture;
- coherent rare-tail selection preserved two related rare pages and rejected isolated noise;
- `500`-case benchmark was deterministic, hybrid did not regress lexical NDCG/bad-fit, and synthetic zero-match accuracy was `1.0`;
- source reordering preserved build hashes;
- design-system superset validation passed for the reference contract;
- conversion metrics deduplicated repeated events.

## Scale results

Local Node/TypeScript reference run:

| Canonical pages | Finite variants | Build ms | HTML bytes | Instruction bytes | Packed vector bytes | Deterministic |
|---:|---:|---:|---:|---:|---:|:---:|
| 200 | 600 | 129.59 | 489,264 | 156,376 | 409,600 | yes |
| 500 | 1,500 | 234.93 | 1,224,794 | 391,576 | 1,024,000 | yes |
| 1,000 | 3,000 | 434.02 | 2,436,851 | 780,479 | 2,048,000 | yes |
| 2,000 | 6,000 | 858.28 | 4,908,451 | 1,570,279 | 4,096,000 | yes |

The `2,000`-page emission produced:

```text
2,000 index.html files
2,000 use.md projections
15 MB generated directory
build hash 16887eda5a917a332c6cc6f2dddc7e80e4cef5b0612755926f9065d2faebabe9
```

These numbers are local synthetic compiler measurements, not Cloudflare, browser, crawl, or production measurements.

## Environment

```text
Node v22.16.0
npm 10.9.2
TypeScript 5.8.3
Zig unavailable
outbound DNS unavailable from execution container
```

## Validation not run

- Zig compilation or tests;
- scalar Wasm or SIMD Wasm parity and performance;
- Wrangler, Cloudflare preview, deployment, static cache, Worker CPU, or billing behavior;
- browser/crawler HTML comparison, accessibility, Core Web Vitals, layout shift, or load tests;
- real human relevance labels, learned semantic embeddings, calibration, held-out verticals, or genuine no-match data;
- Search Console, Bing Webmaster, indexing, rankings, citations, qualified leads, conversion lift, gross profit, or closed revenue;
- optimal transport, Gromov-Wasserstein, full clustering frontier, or production corpus-selection superiority.

## Acceptance state

- Workstreams `1A`, `1B`, `2A`, and the source layer of `1C/2B/2C`: **source-wired with local reference evidence**.
- Zig/Wasm, Cloudflare, browser, SEO, search distribution, conversion, and revenue: **not accepted**.
- Metaprogrammed UI: **semantic capability contract source-wired; AMTECH design renderer pending the user's design system**.
