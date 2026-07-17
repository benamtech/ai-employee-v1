# Hyper-Targeted Framework Reference Validation

Date: 2026-07-17
Branch: `agent/phase-2-materialization-engine-plan`
Status: local TypeScript compile and Node unit tests passed

## Scope

Validated the first executable correctness slice for:

- deterministic HRR symbols;
- FFT circular convolution, bind, and unbind;
- weighted superposition and multi-prototype page scoring;
- exact weighted facility-location corpus selection;
- deterministic neutral HTML emission;
- dependency-bounded invalidation.

## Environment

```text
Node v22.16.0
npm 10.9.2
TypeScript 5.8.3
Zig unavailable
GitHub DNS unavailable from the execution container
```

The exact files committed through the GitHub connector were reproduced in `/mnt/data/hyper-framework/reference` and executed locally.

## Commands

```bash
cd /mnt/data/hyper-framework/reference
rm -rf dist
tsc -p tsconfig.json
node --test test/*.test.mjs
```

## Results

```text
tests: 4
passed: 4
failed: 0
duration: 98.1291 ms
```

Passing cases:

1. deterministic symbols and HRR retrieval are reproducible;
2. multi-prototype page shape selects the compatible context;
3. facility-location optimizer rejects a redundant page under budget;
4. emissions are byte-identical and invalidation is dependency-bounded.

## Findings

- The FFT HRR path recovered the intended bound value with more than `0.5` cosine margin over the declared distractor in the fixture.
- Multi-prototype scoring selected the contractor/estimate prototype with score above `0.99`.
- The weighted facility-location control selected `estimate-hub`, `dispatch`, and `claims`, rejecting the near-duplicate `estimate-copy` under budget `3`.
- Reversing source page and atom ordering produced identical emitted pages and hashes.
- Changing `offer:managed-price` would invalidate only the painting-estimate page in the fixture; changing `proof:approval` would invalidate both dependent pages.

## Validation not run

- naive `O(D^2)` convolution parity;
- randomized/property/fuzz tests;
- dimensions `1024/2048/4096` capacity sweeps;
- lexical, embedding, graph, HRR hybrid, calibration, NDCG, or zero-match benchmarks;
- exhaustive small-instance facility-location optimum;
- lazy-greedy, logdet/DPP, complement-aware, clustering, or optimal-transport arms;
- packed/binary IR, CSR graph, streaming compiler, or `200–2,000` page benchmarks;
- Zig native, scalar Wasm, Wasm SIMD, or Cloudflare execution;
- browser, crawler, accessibility, metadata, structured-data, load, SEO, indexing, search-distribution, conversion, or revenue acceptance.

This report proves only the local reference behaviors listed above.
