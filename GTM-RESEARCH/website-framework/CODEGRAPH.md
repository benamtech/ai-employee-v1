# CODEGRAPH.md — Hyper-Targeted Search Distribution Framework Map

Status: Phase 1 complete; Phase 2 production-oriented reference implementation started
Updated: 2026-07-17
Scope: `GTM-RESEARCH/website-framework/`

## Read order

1. `../../identity.md`
2. `identity.md`
3. `../../CODEGRAPH.md`
4. `AGENTS.md`
5. `README.md`
6. numbered specifications `00` through `15`
7. `15-hyper-targeted-search-distribution-workstreams.md`
8. `reference/README.md`
9. `reference/UI-DESIGN-SYSTEM-HANDOFF.md`
10. validation reports

`15` controls the current two-workstream, three-part execution order. `14` remains the broader Phase 2 boundary and supporting workstream inventory.

## Primary category

**Hyper-targeted search-distribution compiler and vector information server.**

The primary commercial emission is a corpus of `200–2,000+` stable canonical pages selected to maximize valuable query/context compatibility, page distinctness, information gain, graph utility, and lifecycle value.

HTML is an emission. The durable system is:

```text
approved source + evidence + information objects
-> context/page geometry
-> corpus optimizer
-> typed ExperienceIR
-> packed vectors + CSR graph + dependencies + page plans
-> canonical HTML + instruction pointers + sitemap + manifests
-> asset-first global distribution
-> search/query/conversion/revenue observations
```

## Current executable implementation

`reference/` now contains:

- deterministic HDC/VSA/HRR symbols, FFT and naive circular convolution, bind/unbind, superposition, cosine, and multi-prototype scoring;
- deterministic `500`-case context benchmark generator with lexical, hashed-semantic, facet, graph, HRR, and hybrid arms;
- NDCG, top-one, zero-match, bad-fit, and reciprocal-rank metrics;
- exact greedy, exhaustive small-instance, lazy-greedy, information-saturation, coherent rare-tail, and log-determinant diversity controls;
- typed evidence/claim/information/module/page source contracts;
- semantic renderer-independent `PageIR` and packed structure-of-arrays vectors;
- CSR internal-link graph and design-capability indexes;
- deterministic neutral HTML, structured data, sitemap, and instruction-pointer emissions;
- dependency-bounded invalidation and content-addressed build hashes;
- deterministic field cohort, conversion event, deduplication, and revenue-per-page metrics;
- finite variant resolver with hard eligibility, confidence fallback, and deterministic holdout;
- Zig scalar/SIMD kernel source, Wasm ABI adapter, and TypeScript fallback;
- Cloudflare Workers Static Assets asset-first configuration and bounded resolver endpoints;
- `200/500/1000/2000` page scale runner and a `2,000`-page static emission script;
- design-system capability vectors and a superset satisfiability validator for the next UI pass.

## Validated locally

- strict TypeScript compilation;
- `12/12` Node tests passed;
- FFT circular convolution matched the naive oracle within `1e-10` on the declared fixture;
- exact greedy matched exhaustive optimum on the small facility-location control;
- lazy greedy matched exact greedy on the declared control;
- coherent rare-page selection rejected isolated noise in the declared composite fixture;
- `500` context / `240` page benchmark was deterministic; hybrid did not regress lexical NDCG/bad-fit and zero-match accuracy was `1.0` on the synthetic fixture;
- source reordering produced the same build hash;
- the reference design contract satisfied every emitted page capability;
- `2,000` canonical pages plus `6,000` finite variant plans compiled deterministically;
- `2,000` HTML files and `2,000` compact `use.md` projections were emitted locally.

Authority: `validation/reports/2026-07-17-hyper-targeted-production-pass.md`.

## Not validated

- Zig `0.15.2` compilation, native execution, scalar Wasm, or Wasm SIMD parity because Zig was unavailable and outbound DNS blocked toolchain download;
- Wrangler/Cloudflare preview or deployment;
- browser, crawler, accessibility, Core Web Vitals, load, cache-hit, or Worker CPU tests;
- real Search Console/Bing data ingestion;
- indexing, ranking, query coverage, conversion lift, closed revenue, or production acceptance;
- learned embeddings, calibrated human relevance labels, optimal transport, Gromov-Wasserstein, or field superiority over simpler controls.

## Governing invariants

- every published page has a stable canonical question, visible information object, evidence, internal graph role, and positive measured marginal value;
- hard eligibility executes before weighted scoring;
- zero-match and uncertainty return the canonical baseline;
- canonical static assets require no resolver, model, database, or client JavaScript;
- runtime cannot generate arbitrary prose, routes, symbols, components, or visitor-specific cache keys;
- crawlers and humans receive the same primary topic, claims, price, evidence, limitations, and links;
- no fingerprinting, named-person dossier, identity stitching, private-history ingestion, or sensitive-trait inference;
- TypeScript remains the semantic oracle; Zig/Wasm ships only after parity and end-to-end benefit;
- design systems map semantic requirements to components and tokens without changing source truth or page geometry.

## Next code path

```text
1. replace synthetic benchmark labels with reviewed real query/context/page tuples;
2. add calibrated human relevance, no-match, held-out-domain, and ablation reports;
3. run Zig native/scalar/SIMD parity once Zig 0.15.2 is available;
4. deploy generated assets to a noindex Cloudflare preview and measure asset-first vs Worker-first behavior;
5. ingest the supplied AMTECH design system and prove it satisfies the UI superset contract;
6. compile the first real matched 20–40 page field cohort;
7. publish only after canonical, accessibility, browser, crawl, and evidence gates pass;
8. measure real search distribution and commercial value before scaling to 200+ pages.
```
