# 00 — Scientific and Feasibility Validation

Status: research basis + falsifiable hypotheses

## Validated scientific foundation

Tony Plate's 1995 Holographic Reduced Representations work establishes that fixed-width real-valued distributed vectors can encode compositional symbolic structures. Circular convolution binds role and filler vectors; vector addition superposes structures; approximate inverse/unbinding retrieves noisy constituents that can be cleaned up against a known dictionary.

Modern Hyperdimensional Computing / Vector Symbolic Architecture surveys support the broader model family: high-dimensional distributed representations, bundling/superposition, binding, permutation, similarity-based retrieval, graceful degradation, and hardware-efficient computation.

Later HRR research reports that projection/normalization can materially improve numerical stability and retrieval quality in learned or repeatedly composed representations.

These facts support using HRR as a compact algebra for structured content and context representation.

## What is not scientifically established

The literature does **not** establish that HRR-based visitor-context matching improves website conversion, organic search performance, AI-answer citations, or user satisfaction.

The following are AMTECH hypotheses requiring experiments:

1. A compositional HRR context shape ranks useful page/component variants better than deterministic rules or ordinary dense embeddings.
2. HRR adds value beyond a typed feature model with cosine similarity.
3. Graph augmentation improves relevance without over-centralizing generic pages.
4. Continuous A/Z materialization improves conversion while preserving performance and trust.
5. A Zig/WASM implementation improves end-to-end edge latency enough to justify binary size and operational complexity.
6. The selected context features are privacy-safe, stable, and causally useful.

Until those hypotheses pass, HRR is a candidate resolver—not the truth of the system.

## Mathematical model

Let every atomic symbol have a deterministic nearly orthogonal unit vector in `R^D`.

- role/value binding: `r ⊗ v`, circular convolution;
- superposition: `x + y`;
- normalized bundle: `normalize(sum(w_i * x_i))`;
- similarity: cosine;
- approximate unbinding: `s ⊗ inverse(r)`;
- cleanup: nearest known vector or constrained dictionary search.

Context example:

```text
CONTEXT =
  1.0 * (ROLE_ROUTE ⊗ VALUE_CONTRACTORS)
+ 0.9 * (ROLE_INTENT ⊗ VALUE_ESTIMATE_FOLLOWUP)
+ 0.5 * (ROLE_DEVICE ⊗ VALUE_MOBILE)
+ 0.4 * (ROLE_REGION ⊗ VALUE_US_WEST)
+ 0.7 * (ROLE_SOURCE ⊗ VALUE_ORGANIC_SEARCH)
```

Content example:

```text
COMPONENT =
  (ROLE_AUDIENCE ⊗ VALUE_CONTRACTOR)
+ (ROLE_JOB_STAGE ⊗ VALUE_ESTIMATING)
+ (ROLE_PROOF_TYPE ⊗ VALUE_WORK_CARD)
+ (ROLE_RISK_GATE ⊗ VALUE_OWNER_APPROVAL)
```

## Dimension is an experiment, not dogma

Evaluate at least `D = 512, 1024, 2048, 4096`.

Higher dimensions generally improve near-orthogonality and bundled retrieval capacity but increase memory, bandwidth, build time, dot-product cost, and WASM asset size. The winning dimension is the smallest one that passes retrieval and robustness vectors on real content.

`D=2048` is the initial candidate, not a guaranteed optimum.

## Critical-path simplification

The original concept assumes request-time FFT binding. The optimized design pre-binds all allowed role/value pairs during the build:

```text
prebound[role,value] = role ⊗ value
```

The request path then performs only:

1. feature lookup;
2. weighted vector addition;
3. normalization;
4. centroid/candidate retrieval;
5. exact dot products;
6. composite score and policy filtering.

This is scientifically equivalent for a fixed feature vocabulary and removes request-time FFT planning/allocation from the default path.

## Graph augmentation

Do not execute PageRank iteratively per request.

At build/offline update time, compute:

- node centrality;
- route/topic adjacency;
- component eligibility edges;
- cluster centroids;
- optional personalized-PageRank basis vectors for approved intent seeds.

At request time, graph pull is a table lookup or sparse dot product over a small candidate set.

## Composite score

Treat all initial weights as priors:

```text
score(candidate) =
  w_hrr      * cosine(context, candidate.vector)
+ w_graph    * graph_pull(context_seeds, candidate)
+ w_business * candidate.business_prior
+ w_fresh    * freshness_or_evidence_prior
- penalties(candidate)
```

The proposed `50% HRR / 30% graph / 20% business` split is an experiment arm. It must not be hard-coded as scientific fact.

Eligibility and claim safety are hard gates, not weighted preferences.

## Zig/WASM feasibility

Zig can compile freestanding WebAssembly. Cloudflare Workers supports precompiled WebAssembly and SIMD but not threads; larger binaries can increase startup cost. Next.js Edge Runtime exposes WebAssembly but disallows dynamic compilation/instantiation from a raw buffer in the edge path, so the module must be bundled/imported in a supported form.

Consequences:

- pin the Zig compiler version;
- avoid WASI and filesystem dependencies in the math core;
- use caller-provided linear memory or bounded static buffers;
- compile with release optimization and run `wasm-opt` where compatible;
- benchmark JS/typed-array, WASM scalar, and WASM SIMD implementations;
- ship Zig/WASM only if end-to-end p95 improves after cold-start and transfer cost.

A JavaScript reference core is mandatory for correctness comparison and fallback.

## Next.js 16 feasibility correction

Next.js 16 uses Cache Components for Partial Prerendering; older `experimental_ppr` assumptions are stale. Next.js 16 also renames middleware to proxy, with important runtime differences: the default `proxy.ts` path is not the same as a guaranteed edge runtime.

A true global edge resolver should therefore be a separately validated edge worker/function in front of the Next origin, or an explicitly supported retained edge-middleware path. Do not put the entire architecture behind an unverified Next proxy assumption.

## Content tooling correction

Contentlayer documentation still contains old beta-era assumptions. It is not accepted as the default until a Next.js 16 compatibility, maintenance, and production-build gate passes.

Preferred options:

1. Velite after dependency-health validation;
2. a small Zod-based MDX/content compiler owned in this repository;
3. another typed compiler with reproducible build output.

The content model and generated artifacts are the contract; the package is replaceable.

## SEO feasibility boundary

Google states that AI Overviews and AI Mode use the same foundational SEO requirements as Search and require no special markup. Google also treats attempts to manipulate generative AI responses, cloaking, doorway pages, scaled low-value content, and misleading structured data as spam risks.

Therefore the framework may specialize presentation, examples, ordering, and CTA emphasis, but it must preserve a stable canonical topic and visible evidence. It cannot present materially different keyword-rich content to crawlers, mass-produce thin shape pages, or hide machine-targeted text.

## Privacy feasibility boundary

Browser fingerprinting can identify/re-identify devices and correlate activity without effective user control. The framework therefore prohibits fingerprinting and replaces it with an allowlisted ephemeral context shape.

No mathematical transformation makes identifying input anonymous by itself. Hashing a fingerprint still produces a fingerprint.

## Research references

- Tony A. Plate, “Holographic Reduced Representations,” IEEE Transactions on Neural Networks 6(3), 1995, DOI `10.1109/72.377968`.
- Kleyko et al., “A Survey on Hyperdimensional Computing aka Vector Symbolic Architectures,” Parts I and II, 2021–2023.
- Ganesan et al., “Learning with Holographic Reduced Representations,” 2021.
- W3C Privacy Working Group, “Mitigating Browser Fingerprinting in Web Specifications,” 2025.
- Google Search Central, “AI features and your website,” “Optimizing your website for generative AI features,” Search Essentials, spam policies, and structured-data guidelines.
- Next.js 16 documentation: Cache Components / Partial Prerendering, version-16 upgrade guide, Edge Runtime limitations.
- Cloudflare Workers WebAssembly documentation.
- Zig 0.15+ WebAssembly language documentation.

## Scientific acceptance rule

The framework graduates from research to production only when:

- algebra correctness passes against independent reference implementations;
- retrieval quality beats simpler baselines on blinded labels;
- edge performance meets budgets on the target platform;
- privacy/security review passes;
- SEO parity and no-cloaking checks pass;
- randomized A/Z evidence shows useful lift without guardrail regression.