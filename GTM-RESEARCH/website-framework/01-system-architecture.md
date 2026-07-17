# 01 — System Architecture

Status: decision-ready architecture plan

## Architectural objective

Resolve each request into a bounded, evidence-safe content variant in less than 80 ms of edge overhead while preserving a stable, indexable canonical page and a complete baseline experience.

## Planes

### 1. Knowledge plane

Source-controlled typed content:

- canonical pages;
- answer blocks;
- entities and relationships;
- work examples;
- proof/evidence records;
- components and eligibility rules;
- route and claim policies;
- experimental priors.

This plane is human-reviewable and build-reproducible.

### 2. Build compiler

A deterministic Node/TypeScript build process:

1. validates content schemas and evidence levels;
2. emits canonical HTML/content inputs for Next.js;
3. seeds deterministic basis vectors;
4. pre-binds all allowed role/value pairs;
5. creates page, section, component, CTA, and proof hypervectors;
6. computes graph centrality, adjacency, and clusters;
7. quantizes/compacts vector assets where accuracy permits;
8. emits edge resolver artifacts and checksums;
9. creates sitemaps, feeds, metadata, and structured data;
10. writes a build manifest with source hashes and model/version identifiers.

No uncontrolled runtime content generation is required for resolution.

### 3. Edge resolver

Preferred deployment: Cloudflare Worker in front of the Next origin.

Responsibilities:

- normalize the request into allowlisted context features;
- select baseline or A/Z arm;
- construct the ephemeral context shape from pre-bound vectors;
- retrieve the coarse cluster and top candidate variants;
- apply graph/business priors and hard policy gates;
- emit a finite `variant_id` and diagnostic correlation ID;
- set a short-lived first-party session cookie only when permitted;
- rewrite or forward with signed internal resolver headers;
- fall back to baseline on any uncertainty, timeout, missing asset, or error.

The resolver must not:

- identify a person;
- execute a remote LLM;
- perform network vector search on the default hot path;
- generate arbitrary copy;
- mutate content claims;
- create indexable ephemeral URLs;
- persist raw IP or high-entropy device data.

### 4. Next.js 16 application

Use App Router + Cache Components.

For every indexable route:

- static/cached canonical shell contains the complete primary answer;
- dynamic content is wrapped in explicit Suspense boundaries;
- the variant resolver selects among prevalidated components or orderings;
- metadata, canonical, H1, and principal topic remain stable for ephemeral variants;
- personalized islands do not cause hydration flicker;
- no client fetch is required to understand the page.

### 5. Experiment and analytics plane

Privacy-bounded events record:

- experiment arm;
- variant ID;
- resolver version;
- coarse feature buckets used;
- performance timings;
- content exposure;
- CTA/conversion outcomes;
- explicit consent state;
- error/fallback reason.

No owner/customer content, raw IP, fingerprint, or hidden identity profile is collected.

Offline jobs update priors and evaluate causal lift. Runtime requests only read immutable versioned priors.

## Repository layout target

```text
GTM-RESEARCH/website-framework/
  app/                         Next.js 16 application
    app/
    components/
    content/
    lib/
    public/
  resolver/                    edge resolver
    src/worker.ts
    src/context.ts
    src/matcher.ts
    generated/
  hrr-core/                    Zig + JS reference
    src/hrr.zig
    src/reference.ts
    build.zig
    tests/
  compiler/                    build-time content/vector graph compiler
    schemas/
    src/
    generated/
  experiments/
  validation/
  docs/                        this specification family
```

The implementation session may adjust names, but the separation between app, resolver, math core, compiler, experiments, and validation must remain explicit.

## Request flow

```text
1. request reaches edge resolver
2. bot/static exclusions and route policy checked
3. experiment arm assigned or restored
4. allowlisted context features normalized
5. pre-bound vectors loaded from process memory
6. context vector superposed and normalized
7. nearest cluster(s) selected
8. exact candidate similarity calculated
9. graph prior and business prior applied
10. claim/evidence/route eligibility filters applied
11. minimum-confidence and margin gates checked
12. finite variant selected or baseline used
13. signed x-amtech-variant header forwarded
14. Next renders cached shell + selected bounded component set
15. server timing and exposure event emitted asynchronously
```

## Crawler and bot policy

Known crawlers receive the canonical baseline, but the system must not rely only on user-agent detection for SEO compliance.

The stronger invariant is semantic equivalence:

- all humans can access the canonical content;
- variants preserve the same primary product/topic truth;
- bots are not shown hidden keyword content;
- variant-only claims never exceed baseline evidence;
- stable specialized pages use their own canonical URLs and are linked normally.

The resolver should bypass experiments for asset, API, preview, admin, auth, and onboarding routes.

## Context feature sources

Allowed without persistent identity:

- current canonical route and route taxonomy;
- explicit URL query/campaign parameters after validation;
- referrer category, not full sensitive path;
- `Accept-Language` normalized to a supported language bucket;
- coarse country/region supplied by the edge platform, if permitted;
- broad device class derived from low-entropy client hints/headers;
- broad connection capability where reliably available;
- daypart in the selected locale;
- consented in-session page/category interactions;
- explicit user selection such as “I run a painting company.”

Prohibited:

- canvas/audio/font fingerprinting;
- exact device model or OS build;
- raw IP in resolver state;
- email, phone, account, CRM, or customer identity;
- sensitive category inference;
- cross-site browsing history;
- purchased data enrichment;
- protected-class proxies;
- hidden lead scoring.

## Edge data strategy

### Immutable hot assets

Bundle or edge-cache:

- basis/vector version metadata;
- pre-bound feature vectors;
- centroids;
- candidate IDs and compact vectors;
- graph priors;
- eligibility bitsets;
- route policies;
- baseline fallback map.

### Mutable but noncritical data

Read asynchronously or version at deployment:

- experiment weights;
- business priors;
- kill switches;
- content freshness multipliers.

Use Edge Config/KV or a small cached configuration object. A remote Redis/pgvector call is forbidden on the default hot path until measurements prove it stays within budget and materially improves retrieval.

### Durable analytics

Batch to a durable store outside the response path. Do not block rendering on analytics delivery.

## Cache key design

Do not cache by unique context shape hash.

Cache only by bounded values:

```text
route_id
+ experiment_arm
+ variant_id
+ locale
+ content_build_version
```

This prevents cache explosion and accidental identity persistence.

## Variant materialization

A variant is a finite manifest, not arbitrary generated markup:

```ts
interface VariantManifest {
  id: string;
  routeId: string;
  heroExampleId?: string;
  moduleOrder: string[];
  emphasizedProofIds: string[];
  ctaId: string;
  toneId: "direct" | "technical" | "contractor" | "trust_first";
  evidenceCeiling: EvidenceLevel;
}
```

All referenced components are build-validated. Runtime selection cannot introduce a new claim, URL, structured-data entity, price, or proof level.

## Resolver confidence policy

Use baseline when any condition holds:

- fewer than the minimum context features;
- top score below absolute threshold;
- top-two margin below threshold;
- selected variant violates route eligibility;
- resolver exceeds time budget;
- artifact/version mismatch;
- consent-required feature is unavailable;
- bot/crawler or unknown automation policy requires baseline;
- experiment kill switch is active.

## Failure isolation

- Edge resolver failure forwards baseline without user-visible error.
- Missing/invalid variant header is ignored by Next.
- Next validates the variant against its own build manifest; edge headers are not trusted blindly.
- WASM failure falls back to JS matcher, then baseline.
- Analytics failure is dropped/retried asynchronously.
- A single bad content vector fails the build, not runtime traffic.

## Deployment options and gates

### Option A — Cloudflare resolver + Next origin

Advantages:

- true Worker edge runtime;
- precompiled WASM + SIMD support;
- coarse request geolocation supplied at edge;
- independent resolver deployment and kill switch.

Risks:

- two-platform cache/observability complexity if origin is Vercel;
- Worker bundle/startup limits;
- signed header/origin hardening required.

### Option B — Vercel/Next edge middleware path

Advantages:

- fewer platforms;
- direct integration with Next rewrites.

Risks:

- Next.js 16 proxy/runtime transition;
- imported WASM compatibility must be proven;
- tighter framework/platform coupling.

### Option C — Node resolver at origin

Advantages:

- simplest development and broad package support.

Risks:

- weaker global latency;
- resolver competes with page rendering;
- does not meet the intended edge-first architecture unless measured deployment is sufficient.

Run the platform validation vectors before selecting the canonical production option.

## Security controls

- only the edge resolver can set the internal variant header; origin rejects unsigned external copies;
- resolver artifact manifests are checksummed and versioned;
- no eval/dynamic code generation in edge path;
- WASM memory ranges and dimensions validated before invocation;
- content IDs and array offsets bounds-checked;
- all campaign/query features schema-validated;
- experiment and content controls require authenticated deploy/config paths;
- variant diagnostics are redacted and non-identifying.

## Implementation phases

1. Baseline Next shell and typed content graph.
2. TypeScript reference resolver with deterministic fixtures.
3. Build compiler and pre-bound HRR artifacts.
4. Offline quality evaluation against rules/embedding baselines.
5. Edge worker prototype without WASM.
6. Zig/WASM scalar and SIMD benchmark.
7. Bounded variant materialization and no-flicker PPR integration.
8. Privacy/SEO/security validation.
9. Shadow mode: score but do not alter pages.
10. A/Z experiment with holdout and kill switch.
11. Production graduation only after pass/fail gates.