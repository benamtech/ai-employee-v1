# Hyperperformant Holographic Hyper-Targeting Website Framework

Status: research-grounded implementation specification
Created: 2026-07-17
Implementation root: `GTM-RESEARCH/website-framework/`

## Mission

Build a hyperperformant, hyper-specialized, agentic-search-ready public website whose static knowledge graph is indexable and whose presentation can be resolved into the most relevant bounded content slice for the current request/session context.

This is **not** a customer-profile system. It must not create or maintain a hidden dossier about a named person, business, lead, or customer. The matching input is an ephemeral, non-identifying **context shape** assembled from allowed request, route, campaign, language, coarse region, device-class, and consented in-session interaction features.

The framework applies Holographic Reduced Representations / Vector Symbolic Architecture concepts to:

- encode compositional intent and content structures in fixed-width vectors;
- retrieve resonant content and component candidates;
- augment vector similarity with a precomputed topic/entity graph and business priors;
- materialize a finite, policy-safe variant without sacrificing the canonical SEO shell;
- compare a stable baseline against continuous algorithmic resolution through A/Z experiments.

The framework is an experimental application of established HRR/VSA mathematics. It is not considered production-ready until the scientific, latency, privacy, SEO, and conversion validation vectors in this folder pass.

## Read order

1. `../../identity.md`
2. `../../CODEGRAPH.md`
3. `../../mvp-build/CODEGRAPH.md`
4. `../../mvp-build/memory/MEMORY.md`
5. `../../docs/AMTECH_WEB_DESIGN_SYSTEM.md`
6. `../../docs/amtech-website-rewrite-brief.md`
7. `../../mvp-build/docs/gtm/free-infrastructure-managed-workforce-strategy.md`
8. `00-scientific-and-feasibility-validation.md`
9. `01-system-architecture.md`
10. `02-shape-model-and-hrr-core.md`
11. `03-agentic-seo-system.md`
12. `04-feature-validation-vectors.md`
13. `05-pass-fail-vectors.md`
14. `06-experimentation-privacy-operations.md`
15. `site-manifest.yaml`

## Canonical stack hypothesis

- **Application:** Next.js 16+ App Router with Cache Components / Partial Prerendering.
- **Orchestration:** strict TypeScript.
- **Math core:** Zig compiled to pre-imported WebAssembly, only after the JS reference implementation and runtime compatibility gates pass.
- **Content:** typed MDX/content objects. Prefer Velite or a small Zod-based compiler; do not assume Contentlayer compatibility without a package-health/build proof.
- **Edge resolver:** a dedicated Cloudflare Worker or equivalent edge function in front of the Next origin. Do not assume Next.js 16 `proxy.ts` is an edge runtime.
- **State/cache:** build artifacts plus edge KV/config for immutable vectors and priors; Redis/Postgres/pgvector only where measured network cost and operational value justify them.
- **Deployment:** Vercel and/or Cloudflare, selected by the platform validation matrix rather than preference.

## Fundamental architecture

```text
BUILD TIME
content + entities + route policy
-> deterministic basis vectors
-> pre-bound role/value vectors
-> content/component hypervectors
-> graph centrality + adjacency priors
-> cluster centroids + compact search index
-> typed manifest + static SEO pages

REQUEST TIME
allowed request/session context
-> ephemeral context shape
-> coarse cluster retrieval
-> exact HRR/cosine score
-> precomputed graph pull + business prior
-> eligibility/claim/privacy guards
-> finite variant ID
-> rewrite/header/cookie to Next route
-> static shell + bounded personalized island

EXPERIMENT TIME
A = canonical baseline
Z = algorithmically selected bounded variant
-> randomized holdout
-> conversion + performance + SEO + privacy telemetry
-> offline Bayesian prior/weight update
```

## Key performance insight

Do **not** perform circular convolution for every feature on every request.

At build time, precompute each allowed `role ⊗ value` vector. At request time, construct the context shape by weighted superposition of those pre-bound vectors, normalize it, retrieve a small candidate set, and run exact similarity. This moves FFT work off the critical path and makes the edge core mostly vector addition, dot products, and top-k selection.

FFT binding/unbinding remains available for the build compiler, diagnostics, explainability, and experiments. It is not assumed necessary in the hot path.

## SEO invariants

1. Every indexable URL has stable, useful, server-rendered canonical content.
2. Search crawlers and humans receive the same primary topic, claims, and evidence. Resolver variants may reorder or specialize examples and CTAs; they must not become cloaking.
3. Ephemeral variants are not separate indexable URLs.
4. Stable long-tail pages exist only when they answer a distinct question with original information and a crawlable place in the topic graph.
5. Structured data describes visible content and never upgrades evidence.
6. No thin permutations, scaled-content abuse, hidden prompt injection, fake FAQ/review schema, or “AI Overview manipulation.”

## Privacy invariants

- no browser fingerprinting;
- no persistent identity inferred from device characteristics;
- no raw IP storage in the resolver/analytics path;
- coarse geography only where operationally necessary;
- no sensitive-trait inference or targeting;
- no cross-session shape ID without explicit consent;
- anonymous context shapes expire quickly and degrade to baseline;
- every feature is allowlisted, documented, and removable;
- the baseline experience remains complete when personalization is disabled.

## Performance targets

Resolver targets:

- edge compute p95 <= 10 ms after initialization;
- total resolver overhead p95 <= 80 ms;
- zero network database call on the default hot path;
- deterministic baseline fallback on any timeout/error;
- compact WASM and vector assets with measured cold-start cost.

Website targets:

- cached lab LCP <= 1.0 s on primary landing pages;
- field p75 LCP <= 1.8 s target and <= 2.5 s hard gate;
- field p75 INP <= 100 ms target and <= 200 ms hard gate;
- CLS <= 0.05 target and <= 0.1 hard gate;
- no visual flicker between static shell and resolved island;
- no third-party script on the critical rendering path.

## Product/content mission

The first AMTECH implementation still has one product job:

> **Your business gets an employee that lives in the software.**

The framework must make the right proof slice salient without changing the underlying truth:

```text
owner asks or a business event arrives
-> AI Employee works
-> proof appears
-> owner approves when required
-> customer/provider action happens
-> proof and memory remain
```

Primary CTA: **Build my AI Employee**

Offer: **Start free. Managed AI Employee from $400.**

The public estimator remains outdated and non-canonical.

## Production decision rule

No component is marked production-ready because it sounds mathematically elegant. It must pass the feature-validation and pass/fail vectors in this folder on the actual deployment runtime, with an auditable baseline and fallback.