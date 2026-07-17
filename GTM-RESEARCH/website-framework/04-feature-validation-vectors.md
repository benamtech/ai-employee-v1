# 04 — Feature Validation Vectors

Status: required validation matrix

A feature is not complete when it compiles. Each feature below has a validation vector: inputs, controlled perturbations, expected outputs, telemetry, and failure behavior.

## V00 — Baseline canonical page

**Purpose:** prove the site is complete without resolver logic.

Inputs:

- direct request with no cookies, query, referrer, or client JavaScript;
- bot and ordinary browser user agents;
- JS disabled;
- personalization kill switch enabled.

Validate:

- HTTP `200`;
- complete primary answer in initial HTML;
- stable title, H1, description, canonical, structured data, and CTA;
- no missing module or empty Suspense hole;
- onboarding destination works;
- visual hierarchy follows AMTECH design system.

Failure behavior: serve the same baseline.

## V01 — Deterministic symbol generation

Inputs:

- same framework version, namespace, seed, role, and value across TypeScript and Zig;
- changed version/namespace/symbol.

Validate:

- identical generated vectors for identical inputs;
- different symbols remain approximately orthogonal;
- version changes intentionally invalidate artifact checksums;
- no runtime randomness.

Telemetry/artifact:

- golden vector fixture hashes for each supported dimension.

## V02 — HRR bind/unbind algebra

Inputs:

- random role/filler pairs;
- fixed semantic dictionary;
- single binding, multi-binding bundle, repeated bindings;
- noise and feature dropout.

Validate:

- circular convolution matches independent FFT reference;
- unbinding retrieves intended filler as nearest dictionary item;
- superposition behaves linearly within tolerance;
- projection/normalization improves or preserves retrieval where enabled;
- TypeScript and Zig agree within tolerance.

Failure behavior: HRR core cannot graduate; use simpler matcher.

## V03 — Dimension and quantization sweep

Arms:

- dimensions `512, 1024, 2048, 4096`;
- storage `f32`, optional `f16`, optional `i8`;
- scalar JS, optimized JS, WASM scalar, WASM SIMD.

Validate:

- relevance;
- noisy retrieval;
- memory and artifact size;
- cold and warm compute;
- cross-runtime determinism;
- quantization-induced ranking inversions.

Output:

- Pareto frontier; choose smallest/fastest representation that passes quality gates.

## V04 — Pre-bound hot path equivalence

Inputs:

- context features constructed by full request-time binding;
- same context constructed by weighted pre-bound vectors.

Validate:

- shape similarity and candidate ranking equivalence;
- major latency/allocation reduction;
- artifact lookup correctness;
- no missing unknown-feature behavior.

Failure behavior: fall back to reference implementation for diagnosis, then baseline.

## V05 — Context normalization

Inputs:

- valid feature combinations;
- malformed/oversized query parameters;
- unsupported locale;
- exact IP/device data present in request environment;
- absent consent;
- consented session interactions;
- sensitive-looking terms.

Validate:

- only allowlisted normalized buckets enter the shape;
- raw IP/full referrer/high-entropy values are discarded;
- sensitive inference is blocked;
- unsupported values become absent, not new symbols;
- consented features disappear when consent is withdrawn;
- feature count and weights are bounded.

## V06 — Candidate eligibility

Inputs:

- candidates with wrong route, locale, evidence level, price, experiment, device layout, or dependency;
- valid candidate with lower raw score.

Validate:

- hard-ineligible candidate can never win regardless of similarity;
- evidence ceiling is enforced;
- public estimator/non-canonical claims cannot be selected;
- invalid CTA destinations cannot be rendered.

## V07 — HRR relevance quality

Dataset:

- at least 200 blinded context scenarios;
- each labeled by multiple human reviewers with acceptable component/page variants;
- disagreement retained rather than forced away.

Baselines:

- canonical default;
- deterministic rules;
- bag-of-facets cosine;
- dense semantic embedding;
- hybrid without HRR;
- HRR only;
- HRR + graph + priors.

Validate:

- NDCG, MRR, Recall@k, calibrated confidence, reviewer preference;
- performance by route/context sparsity;
- no systematic degradation for privacy-restricted contexts.

## V08 — Graph augmentation

Inputs:

- isolated vector score;
- graph-only score;
- hybrid score;
- central generic nodes and specific low-centrality nodes;
- stale/removed edges.

Validate:

- graph improves related retrieval without always selecting central pages;
- removed/stale nodes cannot be selected;
- request path uses precomputed bounded data;
- graph version mismatch triggers baseline.

## V09 — Confidence and fallback

Inputs:

- strong unambiguous context;
- sparse context;
- tied candidates;
- low absolute scores;
- corrupted artifacts;
- WASM exception;
- compute timeout.

Validate:

- variant only selected above threshold and margin;
- every failure returns baseline;
- no user-visible error or flicker;
- fallback reason is sampled in redacted telemetry.

## V10 — Edge runtime compatibility

Platforms:

- Cloudflare Worker;
- selected Vercel/Next edge path if retained;
- Node reference.

Validate:

- precompiled WASM import works;
- no dynamic compilation, filesystem, threads, or unsupported Node APIs;
- SIMD feature detection and scalar fallback;
- worker/module size and startup behavior;
- signed resolver header reaches origin;
- origin rejects forged external header.

## V11 — Resolver latency

Load profiles:

- cold start;
- warm single request;
- burst;
- sustained concurrency;
- multiple regions;
- worst allowed feature count;
- largest candidate cluster;
- JS and WASM paths.

Measure:

- feature normalization;
- vector construction;
- cluster retrieval;
- exact scoring;
- policy filtering;
- total edge overhead;
- CPU time, allocations, binary startup, cache hit rate.

## V12 — Partial Prerendering/no flicker

Inputs:

- baseline and each variant;
- direct navigation and client navigation;
- slow dynamic response;
- JS disabled;
- reduced motion;
- cache miss/hit.

Validate:

- canonical shell is complete;
- variant island never flashes conflicting hero/price/claim;
- layout dimensions are reserved;
- Suspense fallbacks are meaningful;
- metadata remains canonical and stable;
- Core Web Vitals do not regress.

## V13 — SEO parity/no cloaking

For every canonical route and variant:

- capture rendered HTML as crawler and ordinary browser;
- extract title, H1, main entities, offer, trust boundary, evidence labels, links, structured data, and word-level content map.

Validate:

- same primary topic and factual claims;
- no crawler-only text or keywords;
- no variant evidence upgrade;
- all canonical content remains human-accessible;
- ephemeral variants use same canonical;
- variant parameters/IDs are not indexable.

## V14 — Structured data truth

Inputs:

- all route schemas;
- every evidence level;
- absent price/review/FAQ data;
- stale entity relationship.

Validate:

- schema matches visible canonical content;
- unsupported values omitted rather than invented;
- no fake ratings/reviews;
- canonical `@id` references resolve consistently;
- build fails on evidence/schema contradiction.

## V15 — Specialized page quality

For every proposed indexable page:

Validate:

- distinct owner question/decision;
- unique answer and information-gain object;
- non-duplicate internal-link role;
- no title/H1/canonical collision;
- no substantially similar template body;
- no doorway/funnel-only behavior;
- sufficient editorial evidence.

Output: `publish`, `merge with existing page`, or `do not index`.

## V16 — Crawl and sitemap integrity

Validate:

- every sitemap URL returns canonical `200` and is indexable;
- no variant/session/query URL appears;
- no orphan canonical page;
- robots does not block required assets/content;
- redirects and canonicals are acyclic;
- last-modified derives from source revision;
- Search Console inspection matches build expectations after deployment.

## V17 — Consent and privacy

Scenarios:

- no consent;
- consent granted;
- consent revoked;
- Global Privacy Control where honored by policy;
- privacy-conscious browser with reduced signals;
- repeated visits;
- cache/log inspection.

Validate:

- complete baseline without consent;
- no fingerprint APIs;
- no raw IP persistence;
- no cross-session shape correlation without explicit consent;
- feature-level TTL enforcement;
- deletion/expiry;
- no sensitive or prohibited features in logs/model;
- transparent explanation available.

## V18 — Security and abuse

Inputs:

- forged variant header;
- oversized feature set;
- malformed vector artifact;
- NaN/infinity values;
- WASM out-of-bounds attempts;
- query injection and encoded payloads;
- cache poisoning;
- bot flood;
- experiment config tampering.

Validate:

- schema and bounds checks;
- signed header verification;
- fail closed to baseline;
- rate limits and cache partitioning;
- content IDs cannot escape manifest;
- no arbitrary module/copy injection;
- config changes are authenticated and audited.

## V19 — A/Z assignment

Inputs:

- first visit;
- cookie-disabled visit;
- returning consented session;
- bot;
- multiple tabs;
- deployment/version change.

Validate:

- randomized A holdout and Z assignment;
- assignment is stable only for declared session scope;
- no identity stitching;
- bots excluded or consistently baseline;
- version changes do not corrupt experiment analysis;
- baseline and Z share identical eligibility/evidence guardrails.

## V20 — Causal conversion experiment

Measure:

- onboarding start;
- qualified managed-interest action;
- proof/security engagement;
- bounce/return;
- conversion completion where available;
- performance and trust guardrails.

Validate:

- predeclared primary metric and minimum detectable effect;
- randomized holdout;
- no peeking-based auto-promotion;
- credible interval / sequential method documented;
- heterogeneity analysis is exploratory unless powered;
- winner must pass performance, privacy, and SEO guardrails.

## V21 — Bayesian prior updates

Inputs:

- clean randomized experiment data;
- low-volume cluster;
- missing telemetry;
- bot/spam traffic;
- sudden content/version change.

Validate:

- updates happen offline;
- minimum sample/quality threshold;
- shrinkage toward global prior;
- bounded weight change per release;
- full version/rollback record;
- no direct per-person optimization.

## V22 — Observability and explainability

Validate:

- correlation ID links edge timing, variant exposure, Next render, and conversion event;
- sampled diagnostics list coarse features and score components without identifying data;
- resolver version/content build/experiment arm always present;
- dashboards separate algorithm lift from cache/platform effects;
- alerting catches fallback spikes, variant skew, latency, and evidence invalidation.

## V23 — Kill switch and rollback

Inputs:

- resolver disabled;
- specific route/variant disabled;
- WASM disabled;
- stale artifact rollback;
- bad experiment config.

Validate:

- global baseline within one config/deploy action;
- no cache requires long purge to recover;
- old artifact version can be restored;
- active sessions degrade cleanly;
- canonical SEO pages remain unaffected.

## V24 — AMTECH product truth

Validate every generated variant against canonical facts:

- AI Employee category, not chatbot/estimator;
- owner approval at customer/money/reputation gates;
- Start free; managed from $400;
- no unsupported live/provider/runtime claim;
- public estimator non-canonical;
- proof evidence level visible and accurate;
- CTA points to the real employee-building path.