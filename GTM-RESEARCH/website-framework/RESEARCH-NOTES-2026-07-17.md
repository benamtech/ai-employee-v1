# Holographic Hyper-Targeting Research Notes

Date: 2026-07-17
Branch: `research`
Status: active research log; update whenever an assumption is tested, disproved, or narrowed

## Research question

Can a public website use request/session context encoded with HRR/VSA, plus a content/entity graph and bounded priors, to select a more relevant finite landing-page slice at edge latency while preserving canonical SEO, user trust, and privacy?

This is not yet answered by existing research. The literature supports the representation/retrieval primitives and some recommendation use cases; the web materialization application remains novel and must be validated experimentally.

## Clarified product layers

Three separate systems must not be confused:

1. **Request observability:** what the edge/server/browser can actually observe.
2. **Holographic resolver:** how approved context features rank finite content slices.
3. **SEO knowledge system:** stable canonical pages that search engines crawl and index.

v0.1 tests layers 1 and 2 in a `noindex` Request Mirror Lab. Layer 3 gets a separate stable canonical explainer later.

## Evidence alias validation

### `[HRR-VSA-REC]` — Holographic Factorization Machines, AAAI 2019

Validated.

Paper:

- Yi Tay, Shuai Zhang, Anh Tuan Luu, Siu Cheung Hui, Lina Yao, Tran Dang Quang Vinh.
- “Holographic Factorization Machines for Recommendation.”
- AAAI 2019, pages 5143–5150.
- DOI: `10.1609/aaai.v33i01.33015143`.

Reported result:

- replaces the ordinary factorization-machine inner product with HRR-based interaction;
- consistent improvements over vanilla FMs on nine explicit-feedback datasets;
- up to roughly 4% MSE improvement, with larger gains at smaller parameterizations.

Interpretation:

- supports the claim that HRR can encode useful feature interactions compactly;
- does not prove website conversion lift or edge personalization quality.

### `[HRR-REC-2008]` — Holographic Associative Memory Recommender

Validated.

Paper:

- Matthew F. Rutledge-Taylor, Andre Vellino, Robert West.
- “A Holographic Associative Memory Recommender System.”
- ICDIM 2008.
- DOI: `10.1109/ICDIM.2008.4746700`.

Reported result:

- compared a dynamically structured holographic-memory recommender against user-based collaborative filtering on MovieLens and bibliographic datasets;
- competitive movie-preference accuracy;
- better behavior on very sparse datasets;
- authors noted significant computational-resource requirements for larger practical deployments.

Interpretation:

- supports associative recommendation under sparse data;
- reinforces the need for precomputation, bounded candidate sets, and real latency measurement.

### `[HoloMambaRec-2026]`

Validated as a recent arXiv preprint, not yet treated as settled peer-reviewed evidence.

Paper:

- “Scalable Sequential Recommendation under Latency and Memory Constraints.”
- arXiv: `2601.08360`.
- Introduces HoloMambaRec: HRR attribute binding plus a selective state-space model.

Reported result:

- Amazon Beauty and MovieLens-1M experiments;
- outperforms SASRec in the paper's constrained setup;
- competitive with GRU4Rec;
- lower memory complexity and linear/recurrent inference framing.

Interpretation:

- supports the plausibility of HRR attribute binding under latency/memory constraints;
- preprint evidence only;
- does not validate anonymous web-context materialization.

### `[MnasNet-2019]`

Principle accepted: optimize against measured target-platform latency rather than FLOPs or an abstract proxy.

Application here:

- benchmark optimized TypeScript, WASM scalar, and WASM SIMD on the actual Cloudflare/Vercel runtime;
- include cold start, binary size, artifact transfer, initialization, and total request latency;
- Zig/WASM ships only if it wins end-to-end.

## HRR/VSA foundation

Tony Plate's 1995 HRR paper is the primary foundation:

- fixed-width distributed real vectors;
- circular convolution binding;
- superposition/bundling;
- approximate inverse/unbinding;
- cleanup by similarity to a dictionary;
- graceful degradation and noisy retrieval.

Modern VSA/HDC surveys support a broader algebra of high-dimensional distributed representations and hardware-efficient operations.

Important correction:

- HRR theory supports the representation mechanics;
- it does not scientifically establish the proposed 50/30/20 score weights, conversion benefit, SEO benefit, or “production-ready” claim.

## New synthesis hypotheses

### H1 — compositional context matching

A role/filler context representation may preserve distinctions that an unstructured bag of features loses:

```text
ROLE_AUDIENCE ⊗ HOMEOWNER
ROLE_PET ⊗ DOG
ROLE_NEED ⊗ RESIDENTIAL_PAINTING
```

This could distinguish the same atomic words used in different semantic roles.

Test against:

- deterministic rules;
- ordinary one-hot/facet cosine;
- dense semantic embeddings;
- hybrid graph ranking.

### H2 — holographic slicing

Unbinding and similarity may expose the strongest substructures of a context shape, but runtime page composition should remain finite and typed.

Novel extension:

- use HRR to select approved component IDs, not generate arbitrary copy;
- record which role/value structures resonated;
- render a transparent explanation in the lab.

### H3 — graph pull

The content graph can correct vector ambiguity by preferring nodes that are contextually connected to the current route/topic while penalizing generic over-central nodes.

Novel extension:

- precompute graph centrality and seed-specific pull offline;
- use only a bounded lookup/sparse score at request time;
- evaluate whether graph augmentation adds relevance after controlling for content priors.

### H4 — continuous A/Z testing

Z is not one fixed challenger. It is the resolver's selected point in a finite variant space.

Necessary causal design:

- randomized A holdout;
- shadow mode first;
- fixed evidence/eligibility constraints in both arms;
- offline prior updates;
- performance/privacy/SEO guardrails;
- no per-person posterior or identity profile.

### H5 — edge pre-binding

For a fixed feature vocabulary, build-time pre-binding removes FFT from the hot path without losing the algebraic structure:

```text
prebound[role,value] = role ⊗ value
context = normalize(sum(weight * prebound[role,value]))
```

This is likely the most important performance simplification.

## Stack feasibility notes

### Next.js 16 Cache Components / PPR

Current official behavior:

- Next.js 16 uses `cacheComponents: true` to enable Cache Components and Partial Prerendering;
- request-time data must be isolated behind Suspense or explicitly handled;
- Cache Components requires the Node runtime and is not supported with `runtime = 'edge'`;
- `proxy.ts` is Node runtime in Next.js 16; the edge runtime is not supported there;
- retained `middleware` may still be needed for edge behavior until framework guidance changes.

Decision:

- do not assume the Next request boundary is the global edge resolver;
- prototype a separate Cloudflare Worker in front of Next;
- Next handles static/cached shell and bounded dynamic slice rendering.

### Cloudflare Next.js support

Cloudflare's OpenNext adapter currently documents support for:

- App Router;
- RSC;
- SSG/SSR/ISR;
- Server Actions;
- middleware;
- PPR and composable caching as experimental features.

Decision:

- deployment compatibility requires a real build proof;
- PPR cannot be accepted from documentation alone;
- the v0.1 native Worker lab avoids blocking on the complete adapter path.

### Cloudflare preview and Google indexing

Cloudflare Pages preview deployments include `X-Robots-Tag: noindex` by default.

Worker preview URLs are public when enabled but currently lack normal logs/tail support. They are useful for real request metadata and browser tests, not production observability.

Decision:

- use Worker preview first;
- move to a custom test subdomain for stable logs/load tests;
- keep the lab `noindex` and private/no-store;
- do not use Google indexing as the first functional test.

### Cloudflare request metadata

Official `request.cf` can expose, depending on request/plan:

- country, region, city, timezone, continent;
- latitude/longitude/postal/metro;
- ASN and AS organization;
- colo, protocol/TLS, encoding and RTT-related fields;
- bot-management metadata on eligible plans.

Caveats:

- IP-derived location is approximate;
- fields can be null/plan-dependent;
- `request.cf` is unavailable in the dashboard/playground preview editor;
- exact location should not be persisted or silently used.

### Browser signals

Low-entropy UA Client Hints are intended to reveal less identifying information. High-entropy hints can reveal architecture, model, platform version, and full browser versions, are not uniformly supported, and increase fingerprinting risk.

Other useful but privacy-relevant browser fields include viewport, timezone, languages, hardware concurrency, device-memory bucket, network information, touch/pointer, and preferences.

Decision:

- no active browser collection on initial render;
- explicit reveal action;
- high-entropy hints behind a second explicit action;
- no canvas/audio/WebGL/font/plugin fingerprinting;
- all client signals displayed back to the tester with source and retention.

### Contentlayer

Contentlayer remains part of the requested stack, but current package maintenance and Next.js 16 compatibility have not been proven.

Decision:

- create a package validation gate;
- maintain schemas independent of the package;
- fallback to Velite or a repository-owned Zod/MDX compiler if Contentlayer fails build/runtime maintenance checks.

### ruVector

Current `ruvector-core` describes HNSW, SIMD distance, quantization, and persistence, but also contains explicitly experimental/incomplete agentic features and placeholder-embedding warnings.

Decision:

- no ruVector in v0.1;
- exact in-memory scan is the baseline for five to hundreds of candidates;
- add ruVector as a benchmark arm only when corpus size justifies ANN;
- never use placeholder embeddings as semantic evidence.

### Redis / pgvector

A network lookup is incompatible with the default <50 ms resolver target unless it is strictly necessary and locally cached.

Decision:

- immutable vectors, centroids, graph priors, and eligibility data bundle with the Worker;
- no Redis or pgvector in v0.1 hot path;
- Redis may later map a short-lived consented session to a finite variant, not a unique fingerprint shape;
- pgvector is for offline analysis or larger corpus experiments.

## Google/Search findings

Official current guidance:

- server/static rendering is preferred to bot-specific dynamic rendering;
- Google can render JavaScript, but server-rendered HTML remains faster and more broadly accessible;
- A/B/multivariate tests are acceptable when they do not cloak;
- Googlebot generally does not support cookies and sees the no-cookie/default version;
- tests should run only as long as necessary;
- a specific live URL is best checked with Search Console URL Inspection;
- `site:` searches are incomplete and unreliable as a debug tool;
- indexing/recrawling may take days to months;
- AI Overviews/AI Mode require no special AI markup beyond normal Search fundamentals.

Decision:

- stable canonical content is the SEO truth;
- ephemeral resolver output is not separately indexed;
- crawlers and humans share the same core topic, evidence, price, and limitations;
- v0.1 lab remains `noindex`;
- later canonical explainer is submitted through URL Inspection after parity tests.

## Privacy boundary and directive interpretation

The directive says visitor data includes IP metadata, device fingerprint, behavioral signals, and inferred traits, while business requirements say public/opt-in data only.

These conflict unless constrained.

Research decision:

- treat “device fingerprint” as a research risk, not an accepted implementation requirement;
- v0.1 displays allowed request/browser signals but does not construct a persistent re-identification fingerprint;
- arbitrary family/pet/homeowner traits are not silently inferred from device or geography;
- those combinations are tested through explicit fixtures or user-selected inputs;
- later public-data enrichment requires a separate lawful-source, terms, privacy, accuracy, retention, and sensitive-trait review.

A hash of fingerprint inputs is still a fingerprint. HRR encoding does not anonymize identifying source data.

## v0.1 test decision

Build a plain Request Mirror Lab with:

- immediate server-rendered request and Cloudflare facts;
- optional browser reveal;
- explicit trait fixtures;
- provenance/confidence/inference ledger;
- TypeScript and Zig match output;
- finite candidate slices;
- timings and fallback;
- `noindex`, `private, no-store`;
- no persistent profile;
- no remote vector store.

## Open questions

1. What domain/subdomain should host the stable lab?
2. Is Cloudflare Workers already connected to this repository/account?
3. Which plan-level Cloudflare fields are available in the target account?
4. Does Contentlayer build cleanly with the chosen Next.js 16 version?
5. Does imported Zig/WASM SIMD work through the selected Worker/OpenNext pipeline?
6. How large is the initial real content/component candidate corpus?
7. Which explicit traits are legally and ethically acceptable for live lead-gen versus synthetic fixtures only?
8. What is the first causal conversion metric after the lab graduates?
9. Will the eventual AMTECH site run entirely on Cloudflare or use Cloudflare resolver + Vercel origin?
10. Does a flat scan remain faster than ANN at realistic corpus sizes?

## Failed or narrowed assumptions

- “Run a Cloudflare preview and Google the URL” is not a fast or reliable functional test.
- “PPR at the edge” is not a single Next.js 16 runtime: Cache Components requires Node, so the edge resolver is separate.
- request-time FFT is unnecessary for a fixed feature vocabulary.
- PageRank should not run per request.
- Redis/vector DB is not necessary for the first corpus.
- Contentlayer is not accepted until compatibility proof.
- ruVector is not accepted as the initial hot-path dependency.
- HRR recommendation papers do not make the web system production-ready.
- all-discoverable-information collection is neither bounded nor necessarily ethical; v0.1 uses a transparent allowlist and explicit fixtures.

## Required note-taking discipline

For every implementation/test session append:

- date, branch, commit/deployment version;
- exact hypothesis;
- platform/runtime;
- fixture or traffic cohort;
- configuration and vector dimension;
- result metrics;
- screenshots/HTML/timing artifacts;
- discrepancies between local/preview/custom-domain behavior;
- privacy/SEO/security observations;
- failed assumptions;
- decision and next experiment.

Do not overwrite failed results. The negative evidence is part of the research product.