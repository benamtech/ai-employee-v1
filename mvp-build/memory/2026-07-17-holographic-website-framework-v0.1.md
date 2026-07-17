# Holographic website framework and v0.1 Request Mirror Lab

Date: 2026-07-17
Branch: `research`
Status: research/specification only; no implementation build or deployment run

## Direction established

The next public-website research frontier is a reusable Hyperperformant Holographic Hyper-Targeting framework, not a specific customer-profile page.

The core research hypothesis is that a short-lived request/session context shape can be encoded using HRR/VSA, augmented with a content/entity graph and bounded priors, then used to select a finite reviewed content slice at edge latency.

The framework must preserve stable canonical SEO content and may not silently become a named customer profile, covert fingerprint, or sensitive-trait inference engine.

## v0.1 decision

The first implementation is a deliberately plain, Web-1-looking **Request Mirror Lab**.

It should:

- server-render allowlisted request headers and Cloudflare `request.cf` metadata;
- show source/provenance, direct vs inferred vs explicit status, confidence, weight, retention, and whether each signal enters the shape;
- collect bounded browser signals only after an explicit reveal action;
- test combinations such as homeowner + family + dog or New York commercial fleet through explicit signed fixtures, not silent inference;
- construct a deterministic HRR shape from build-time pre-bound vectors;
- compare finite candidate slices and expose HRR, graph, prior, penalty, confidence, and fallback scores;
- run TypeScript reference and Zig/WASM implementations side by side;
- use exact in-memory scan, not Redis/pgvector/ruVector, for the initial tiny corpus;
- return generic baseline on error or uncertainty;
- remain `X-Robots-Tag: noindex, nofollow` and `Cache-Control: private, no-store`.

The lab is not the AMTECH marketing homepage and should not be submitted for indexing.

## Research corrections

- HRR/VSA literature validates compositional distributed representation and associative retrieval, not this website application or its conversion lift.
- Holographic Factorization Machines (AAAI 2019) and the 2008 holographic recommender support compact feature interaction and sparse recommendation plausibility; HoloMambaRec 2026 is a relevant preprint. None makes this system production-ready.
- Request-time FFT is unnecessary for a fixed feature vocabulary: pre-bind role/value vectors at build time, then use weighted addition, normalization, and dot products on the hot path.
- PageRank/graph propagation should be precomputed offline, not run per request.
- Next.js 16 Cache Components/PPR require Node runtime; `proxy.ts` is not a guaranteed edge resolver. The preferred topology is a Cloudflare Worker in front of Next.
- Cloudflare Worker preview is the fast observability test. Google indexing is not immediate and Googlebot sees its own request/no-cookie baseline.
- Cloudflare Pages preview deployments are noindex by default; a stable custom lab subdomain is better for later logs/load testing.
- Contentlayer and ruVector remain compatibility/benchmark hypotheses, not accepted v0.1 dependencies.
- A flat exact candidate scan is the correct initial baseline.
- A hash or HRR transform of identifying source data is still identifying; the math does not anonymize it.

## Files created

- `GTM-RESEARCH/website-framework/README.md`
- `GTM-RESEARCH/website-framework/00-scientific-and-feasibility-validation.md`
- `GTM-RESEARCH/website-framework/01-system-architecture.md`
- `GTM-RESEARCH/website-framework/02-shape-model-and-hrr-core.md`
- `GTM-RESEARCH/website-framework/03-agentic-seo-system.md`
- `GTM-RESEARCH/website-framework/04-feature-validation-vectors.md`
- `GTM-RESEARCH/website-framework/05-pass-fail-vectors.md`
- `GTM-RESEARCH/website-framework/06-experimentation-privacy-operations.md`
- `GTM-RESEARCH/website-framework/07-v0.1-request-mirror-lab.md`
- `GTM-RESEARCH/website-framework/08-implementation-plan.md`
- `GTM-RESEARCH/website-framework/RESEARCH-NOTES-2026-07-17.md`
- `GTM-RESEARCH/website-framework/site-manifest.yaml`

## Required next implementation

1. Confirm Cloudflare account/deployment integration and choose a lab subdomain.
2. Create the Worker-native generic baseline with noindex/private headers.
3. Implement TypeScript deterministic HRR reference and golden fixtures.
4. Implement the minimal Zig/WASM ABI and compare against TypeScript.
5. Build the typed manifest/compiler and five finite slices.
6. Render real request/Cloudflare facts and optional browser reveal.
7. Deploy preview, then run cross-device/network/browser validation and append research notes.
8. Integrate with Next.js 16 only after the native edge lab passes.
9. Build a separate canonical SEO explainer and use Search Console URL Inspection later.

## Validation not run

No local checkout, package install, typecheck, unit test, Zig compile, WASM load, Next.js build, Cloudflare Worker upload, custom-domain deployment, browser collection, latency test, Search Console inspection, or Google indexing test was run in this session.