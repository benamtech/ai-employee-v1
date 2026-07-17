# 14 — Phase 2 Experience Materialization Engine Execution Plan

Status: canonical first-pass Phase 2 execution plan
Updated: 2026-07-17
Scope: `GTM-RESEARCH/website-framework/`

## First-pass objective

Make the holographic/vector experience materialization engine the first integrated Phase 2 deliverable.

The first pass must prove that approved company source objects can be compiled into deterministic vector, graph, eligibility, and page artifacts; that an allowlisted ephemeral context can select a finite reviewed experience through exact measurable scoring; and that the selected experience can be rendered through the intended Cloudflare Worker and Next.js boundary without weakening the canonical baseline.

This plan does not claim or attempt to prove:

- public conversion lift;
- autonomous-company operation;
- provider or model acceptance;
- Google indexing or ranking improvement;
- production runtime acceptance;
- superiority of HRR/VSA over simpler retrieval;
- the ability to reconstruct Google, Bing, Reddit, or any advertising platform's private user profile.

Each workstream has its own validation, pass, and fail vectors. Passing one workstream does not imply that another workstream, Phase 2, or production readiness has passed.

## Reconciled starting state

Phase 1 already records:

- the research/specification packet;
- deterministic generation and independent validation of the synthetic 100-slice matrix;
- HRR/VSA, compiler, privacy, SEO, accessibility, design, and candidate-coverage validation definitions;
- the Request Mirror Lab specification;
- the AMTECH landing-page, content, and design operating model.

Phase 2 still requires executable evidence for:

- current-branch fixture materialization and verification;
- the TypeScript HRR/compiler implementation;
- the owned content/design intermediate representation;
- real AMTECH landing-page compilation;
- flat exact retrieval and candidate coverage experiments;
- Worker, Next.js, and optional Zig/WASM code;
- Cloudflare preview deployment;
- browser, accessibility, load, security, privacy, and SEO-parity tests.

## Mathematical interpretation of an arbitrary context shape

The implementation must not turn the shape metaphor into an unbounded or opaque geometry system.

The engine uses a typed multi-view representation:

```text
context representation
= compositional HRR hypervector
+ interpretable low-dimensional facet point
+ active graph/hypergraph nodes
+ hard eligibility state
+ provenance and confidence state
```

### Compositional resonance space

For dimension `D`, every approved role/value binding is precomputed at build time:

```text
b(role, value) = normalize(role ⊗ value)
```

At request time:

```text
q = normalize(sum_i weight_i * b_i)
q ∈ S^(D-1)
```

A candidate may expose one or more approved prototypes:

```text
P_j = {p_j1, p_j2, ... p_jm}
hrr_score(j) = max_p(q · p), p ∈ P_j
```

For normalized vectors, the exact dot product is exact cosine scoring. Prototype assignment creates spherical nearest-prototype regions; no explicit high-dimensional polytope construction is required in the request path.

### Interpretable facet geometry

A separate small typed facet space represents dimensions that must be inspected directly, for example:

```text
technical_depth
commitment_level
proof_depth
workflow_stage
interaction_density
owner_control_requirement
```

This space may support bounded linear constraints, distance to a candidate region, or a convex-hull research arm. It remains low-dimensional, versioned, and human-auditable.

Do not compute arbitrary convex hulls in the full HRR dimension. High-dimensional hull/facet enumeration is not the default retrieval primitive and must not enter the hot path without evidence.

### Page and module relationships

Relationships between pages are represented as a typed graph or hypergraph, not as literal geometric faces:

```text
canonical_parent
answers
supports
requires
next_step
compatible_with
contrasts_with
conflicts_with
shares_source
shares_proof
```

Hyperedges may connect candidates sharing a route, offer, claim, evidence record, design dependency, or eligibility rule. This graph is the authority for candidate coverage, dependency validation, graph priors, internal-link plans, clustering experiments, and replication accounting.

### Exact composite score

After hard eligibility filtering:

```text
h_j = maximum approved prototype cosine
f_j = interpretable facet similarity or bounded region score
g_j = precomputed sparse graph pull
b_j = bounded editorial/business prior
p_j = explicit penalty vector

score_j = α*h_j + β*f_j + γ*g_j + δ*b_j - p_j
```

All coefficients are versioned. No request may create a symbol, prototype, page, edge, coefficient, component ID, URL, claim, or CTA.

### Offline correspondence research arms

The following are benchmark arms only unless they beat the simpler controls:

- symmetric Chamfer or Hausdorff-style distance between active context anchors and candidate anchor sets;
- distance from the low-dimensional facet point to a candidate convex region;
- spectral clustering of the page graph;
- optimal-transport or Gromov-Wasserstein graph/point-set correspondence;
- learned metric transformations.

Graph optimal transport may compare node and relationship structure, but its optimization cost and non-convexity make it an offline evaluation tool by default.

## Target runtime constraints

Pin concrete versions in the implementation PR rather than using floating toolchains.

Initial research pin:

- repository-compatible Node LTS and strict TypeScript;
- Zig stable `0.15.2`, not a development build;
- pinned Wrangler release;
- pinned Next.js `16.x` release with installed-version Cache Components behavior verified.

Cloudflare constraints:

- import precompiled WebAssembly; do not compile Wasm dynamically per request;
- WebAssembly SIMD may be tested, with scalar fallback;
- Worker threading is unavailable;
- WASI support is experimental, so the Zig core targets `wasm32-freestanding` and has no WASI dependency;
- JavaScript heap and WebAssembly memory share the isolate memory budget;
- Worker bundle size and global-scope initialization affect startup;
- the Workers Free CPU budget is sufficiently tight that CPU measurements are part of the architecture.

Next.js constraints:

- Cache Components/PPR require the Node.js runtime;
- request-derived values stay outside cached scopes and enter only as bounded arguments;
- the Cloudflare Worker remains the edge decision boundary;
- the canonical Next.js shell never depends on resolver availability.

# Workstream 1 — Deterministic mathematical kernel and shape contract

## Part 1A — Fixture materialization and TypeScript reference core

### Objective

Create the executable oracle for every later compiler, Worker, and Zig path.

### Deliverables

- materialize `fixtures/synthetic-persona-matrix.toon` from the committed generator, or emit an equivalent immutable validation artifact;
- independently parse and validate exactly 100 entries;
- record generator version, input checksum, output checksum, byte size, and validation commands;
- deterministic seeded symbol generation;
- circular bind/unbind reference implementation;
- weighted superposition, normalization, dot/cosine, exact top-k, deterministic tie policy, and explicit numeric errors;
- pre-bound role/value lookup;
- dimensions `512`, `1024`, `2048`, and `4096` behind one typed API;
- golden fixtures for valid, zero, NaN, infinity, oversized, corrupted, and near-tie inputs.

### Validation vector

- regenerate the synthetic matrix twice from clean state;
- parse both outputs and compare count, IDs, constraints, and checksums;
- generate symbols repeatedly across processes;
- compare bind/unbind against an independent FFT reference;
- test clean retrieval, superposition, feature dropout, noise, and repeated binding;
- sweep dimensions and publish orthogonality and capacity curves;
- property-test invalid numbers, lengths, bounds, and tie handling;
- compare request-time binding with weighted pre-bound construction.

### Pass vector

- exactly 100 valid unique fixture entries with a recorded reproducible checksum;
- identical pinned inputs produce identical reference artifacts and checksums;
- normalization, invalid-number, and bounds behavior satisfy the P0 algebra gates;
- pre-bound and request-bound paths satisfy the declared equivalence gate;
- no runtime randomness or dynamic symbol creation;
- every failure returns a typed error that the caller can convert to baseline.

### Fail vector

- unexplained fixture count, constraint, ID, parser, or checksum drift;
- symbol or artifact nondeterminism;
- silent NaN/infinity or invalid length behavior;
- golden ranking mismatch;
- pre-bound and request-bound disagreement outside the tie/tolerance policy;
- dimension chosen before the sweep;
- test failure hidden through snapshot replacement.

## Part 1B — Shape semantics and correspondence benchmark

### Objective

Determine which representation improves candidate selection without placing research-grade geometry in the request path by assumption.

### Deliverables

- typed `ContextShape`, `CandidateShape`, `PrototypeSet`, `FacetRegion`, and `RelationshipGraph` contracts;
- exact score decomposition and provenance;
- deterministic rules baseline;
- bag-of-facets cosine baseline;
- HRR single-prototype and multi-prototype arms;
- HRR plus facet and graph arms;
- offline point-set, convex-region, spectral, and graph-correspondence arms;
- adversarial cases for non-convex intent, sparse context, conflicting facets, near-ties, and graph-central generic pages.

### Validation vector

- construct labeled cases where one centroid is insufficient but approved multiple prototypes should work;
- perturb one feature at a time and verify that score changes occur only through declared terms;
- compare prototype cosine with point-set and low-dimensional region distances;
- compare graph prior, spectral partition, and graph-transport arms on the same frozen dataset;
- measure relevance, calibration, runtime, memory, and explanation stability;
- retain assessor disagreement and cases where simpler rules win.

### Pass vector

- chosen representation is typed, versioned, and reproducible;
- every selected score decomposes into HRR, facet, graph, prior, penalty, and eligibility contributions;
- no point-set, hull, spectral, or transport method enters runtime unless it beats the best simpler baseline on preregistered relevance and cost vectors;
- sparse and privacy-restricted contexts fall back rather than manufacture geometry;
- hard-ineligible selection rate is zero.

### Fail vector

- “shape” remains undefined or purely metaphorical;
- a full-dimensional hull or graph-matching solver enters the request path without evidence;
- score terms cannot be explained or reproduced;
- the same signal is counted redundantly across views without a declared policy;
- a complex method wins only on a tuned training set;
- any hard-ineligible candidate can win.

# Workstream 2 — Typed compiler and real experience materialization

## Part 2A — Owned content/design IR and deterministic compiler

### Objective

Compile approved source truth into canonical pages, finite variant manifests, vectors, graph data, eligibility, structured data, and checksums through one owned contract.

### Deliverables

- owned schemas for source objects, claims, evidence, offers, routes, modules, components, visual variants, interaction variants, CTAs, graph edges, and experiment roles;
- stable source and generated IDs;
- dependency graph and cycle detection;
- deterministic source ordering;
- build-time pre-binding and candidate prototype generation;
- eligibility bitsets and exact manifest indexes;
- generated-file headers, source/compiler versions, and checksums;
- build failures for evidence, price, CTA, route, design, accessibility, and dependency contradictions.

### Validation vector

- compile identical source twice with shuffled file order;
- change one claim, price, limitation, proof, CTA, token, and dependency separately;
- inject duplicate IDs, cycles, missing references, evidence upgrades, invalid colors, forbidden component combinations, and dead CTAs;
- diff the affected artifact set;
- verify generated outputs are never accepted as editable source.

### Pass vector

- identical inputs produce byte-identical outputs and checksums;
- source order does not alter semantics;
- contradictions fail before output emission;
- every generated object traces to approved source IDs and versions;
- affected-artifact invalidation is explainable;
- canonical baseline artifacts are complete without resolver data.

### Fail vector

- nondeterministic build;
- silent cycle, dangling reference, duplicate ID, or stale fact;
- claim or structured data exceeds evidence;
- generated page uses an unapproved token, component, or CTA;
- resolver artifacts become the only source of canonical content;
- generated artifacts are treated as hand-editable source.

## Part 2B — Two real AMTECH landing-page families

### Objective

Prove that the compiler can materialize real, visibly distinct experiences from shared truth rather than synthetic labels alone.

### Initial families

1. Contractor owner / estimate and follow-up work
   - low technical burden;
   - immediate work, result, approval, proof, and next-action narrative;
   - Start Free and Managed from $400;
   - no API-key or CLI requirement.

2. Software founder or technical operator / architecture and control proof
   - deeper system, runtime, approval, and security evidence;
   - the same offer, limitations, and proof ceiling;
   - technical depth exposed without replacing the default path.

Each family includes a complete canonical baseline, finite reviewed module/order/proof/density variants, fixed versus variable fields, component/design fixtures, canonical/indexing policy, a distinct owner question, a real CTA, and no public-estimator dependency.

### Validation vector

- compile both families from one canonical offer/evidence registry;
- change the managed price and verify propagation;
- disable the resolver and render both canonical baselines;
- render every allowed variant with JavaScript disabled and reduced motion;
- run duplicate, title, H1, canonical, structured-data, and internal-link checks;
- compare output with AMTECH design-system fixtures;
- verify technical depth is reachable without burdening the contractor baseline.

### Pass vector

- at least two real families compile from shared source objects;
- canonical pages are complete, accessible, truthful, and useful without adaptation;
- all variants preserve AI Employee positioning, Start Free, Managed from $400, owner gates, evidence ceilings, and the real CTA;
- no thin swap-only page or duplicate canonical intent;
- the designer/compiler contract rejects forbidden combinations;
- the public estimator remains non-canonical and unselectable.

### Fail vector

- synthetic fixtures are the only demonstrated output;
- variants differ only by noun replacement;
- canonical baseline depends on client JavaScript or resolver availability;
- price, proof, limitation, or CTA diverges across outputs;
- the technical page invents provider/runtime acceptance;
- design drift or accessibility failure ships.

# Workstream 3 — Exact retrieval, coverage, and replication frontier

## Part 3A — Flat exact resolver and policy/confidence gate

### Objective

Establish the smallest correct request-time resolver before adding candidate grouping.

### Request pipeline

```text
allowlist and normalize context
-> discard unknown/prohibited values
-> weighted pre-bound superposition
-> normalize
-> hard route/evidence/offer/design/privacy eligibility
-> flat exact score over eligible candidates
-> graph/prior augmentation
-> calibrated threshold and top-two margin
-> finite variant ID or baseline
```

### Deliverables

- typed context normalizer;
- exact flat scorer;
- deterministic tie policy;
- composite score explanation;
- confidence/fallback gate;
- signed finite variant envelope;
- corruption/version mismatch handling;
- zero-remote-call hot-path benchmark.

### Validation vector

- exhaustive generated policy combinations;
- malformed, oversized, unknown, sparse, conflicting, and privacy-reduced contexts;
- wrong route, price, evidence, experiment, dependency, and device-layout candidates;
- corrupted checksums and version mismatch;
- confidence calibration and selective coverage analysis;
- exact operation counts by corpus size.

### Pass vector

- prohibited or hard-ineligible selection rate is zero;
- default path performs zero remote database/vector-store calls;
- every error, low score, unresolved tie, timeout, or mismatch returns baseline;
- candidate ordering is deterministic;
- score explanation is reproducible and redacted;
- flat exact scan becomes the required correctness and performance control.

### Fail vector

- eligibility is applied too late to prevent invalid candidates entering the result;
- unknown input creates symbols or IDs;
- confidence is raw cosine without calibration and coverage reporting;
- failure produces a blank page, user-visible error, or contradictory flash;
- resolver depends on Redis, pgvector, ANN, or a remote model.

## Part 3B — Candidate grouping as coverage/replication optimization

### Objective

Test whether route partitions, inverted indexes, centroids, graph partitions, or other bounded grouping can reduce exact work without losing any eligible output.

### Formalization

Treat the candidate corpus as a hypergraph/set-cover system:

- candidate nodes are finite page or module variants;
- feature, route, evidence, dependency, and design groups are hyperedges;
- replication is the number of groups or artifacts in which a candidate or feature appears;
- coverage is the exact rate at which every policy-eligible labeled answer enters the scored set;
- communication cost includes duplicated artifact bytes, initialization, cache pressure, and lookup work;
- scoring cost is the exact dot-product and policy operation count after retrieval.

### Compared strategies

- flat exact scan;
- hard route partition only;
- route plus facet inverted index;
- centroid clusters;
- graph or spectral partitions;
- replicated multi-assignment clusters;
- ANN only at a corpus size where exact evidence justifies it.

### Validation vector

For each corpus size, dimension, and strategy, report:

- eligible-output coverage;
- false-negative candidate retrieval;
- average and maximum candidate-set size;
- candidate and feature replication factors;
- duplicated bytes;
- initialization and cache cost;
- exact score operations;
- p50, p95, and p99 latency;
- relevance and confidence changes;
- worst-case route and sparse-context behavior.

### Pass vector

- eligible labeled output coverage is exactly 100% for the declared corpus;
- policy-ineligible selection remains zero;
- chosen strategy lies on the measured coverage/replication/latency frontier;
- clustering is adopted only if it materially beats flat exact scan at the target corpus size without relevance or operational regression;
- replication and duplicated bytes are bounded and versioned.

### Fail vector

- any eligible candidate becomes unreachable;
- a centroid becomes semantic authority rather than a retrieval shortcut;
- average latency improves while worst-case coverage or p99 fails;
- duplicated artifacts or cache cardinality become unbounded;
- ANN or clustering ships because it appears sophisticated rather than because it beats flat scan.

# Workstream 4 — Worker, Cloudflare, Zig/WASM, and Next.js boundary

## Part 4A — Cloudflare Worker shadow resolver

### Objective

Deploy the TypeScript reference resolver as a transparent `noindex` shadow system that always preserves the baseline.

### Deliverables

- Worker-native Request Mirror response;
- real `request.cf` normalization with missing-field handling;
- `noindex` and private-cache headers;
- request, shape, candidate, score, fallback, and timing diagnostics;
- HTML escaping and bounded diagnostic output;
- signed variant-envelope generation;
- kill switch and baseline-only mode;
- preview deployment and stable lab-subdomain plan;
- local and remote load harness.

### Required response controls

```text
X-Robots-Tag: noindex, nofollow
Cache-Control: private, no-store
Server-Timing: normalize,shape,retrieve,score,policy,render,resolver-total
```

### Validation vector

- local Wrangler and real preview requests;
- multiple devices, browsers, networks, and regions;
- request fields present, absent, malformed, and plan-dependent;
- forged variant header and tampered fixture;
- burst, sustained, cold, warm, and worst-candidate-set loads;
- log inspection for raw IP, cookies, authorization, full referrer, and unique browser data;
- Worker bundle, startup, CPU, memory, and fallback timing.

### Pass vector

- Worker always serves or preserves the complete baseline;
- `noindex` and private headers appear on every lab response;
- no raw secret, IP, cookie, or prohibited feature is stored or reflected;
- default match path has zero remote calls;
- timing and version diagnostics are present;
- timeout, error, or tamper returns baseline inside the declared budget;
- deployment evidence is recorded without declaring production runtime acceptance.

### Fail vector

- preview or fixture URL is indexable;
- raw request or security data appears in HTML, logs, or analytics;
- resolver failure blocks baseline;
- Worker initialization or artifact load is unbounded;
- forged variant data reaches the origin;
- a preview benchmark is described as production acceptance.

## Part 4B — Zig/WASM parity and Next.js materialization

### Objective

Add Zig/WASM only after TypeScript correctness, then prove the signed finite variant can materialize through Next.js without flicker or canonical drift.

### Deliverables

- minimal Zig ABI for weighted add, normalize, dot/top-k, and optional build-time binding;
- scalar `wasm32-freestanding` build;
- optional SIMD build using fixed-width Wasm SIMD;
- feature detection and scalar fallback;
- cross-runtime golden comparison;
- Next.js 16 App Router application with Cache Components enabled;
- complete canonical static shell;
- signed Worker variant envelope validated against the local manifest;
- reserved layout dimensions and meaningful fallback;
- JS-disabled baseline.

### Validation vector

- compare TypeScript, Zig scalar, and Zig SIMD outputs on every golden and randomized fixture;
- fuzz lengths, offsets, NaN/infinity, corrupted modules, and memory boundaries;
- measure binary size, startup, cold/warm CPU, memory, and end-to-end Worker latency;
- disable Wasm and verify TypeScript fallback;
- disable resolver and verify canonical Next baseline;
- capture crawler and browser HTML for baseline and every variant;
- run no-flicker, metadata, structured-data, accessibility, and Core Web Vitals tests.

### Pass vector

- TypeScript and Zig preserve candidate ordering and operation-specific tolerance policy;
- fuzzing finds zero bounds or invalid-number failures;
- Wasm failure falls back to TypeScript and then baseline;
- SIMD is optional and feature-detected;
- Zig/WASM is retained only if it satisfies the declared material performance-benefit gate;
- Next.js canonical content, metadata, price, evidence, links, and CTA remain stable;
- no contradictory flash or material layout shift;
- browser/crawler parity passes for the declared fixtures.

### Fail vector

- Zig becomes the oracle rather than the TypeScript reference;
- WASI, threads, filesystem, or dynamic Wasm compilation becomes required;
- Wasm complexity has no measured benefit;
- Next.js caches unique visitor shapes or unbounded variant keys;
- variant rendering alters canonical truth or crawler-visible primary content;
- any essential experience fails with JavaScript disabled.

# Workstream 5 — Consented context observability and low-cost experimentation

## Part 5A — Self-consented context mirror and portable-data adapters

### Objective

Measure how much useful matching context can be obtained lawfully and transparently without pretending the site can see the private identity profile used by Google, Bing, Reddit, advertising networks, or data brokers.

The first tester may be the owner, with explicit consent. The same mechanism may later be offered to other users only through explicit, granular, revocable consent. Consent does not convert covert fingerprinting or unrelated cross-platform identity resolution into an acceptable default product behavior.

### Signal tiers

#### Tier 0 — request-safe, no identity resolution

- canonical route and allowlisted query keys;
- explicit UTM/campaign fields and signed fixture IDs;
- language headers;
- reduced referrer origin/category;
- coarse Cloudflare country, region, city, timezone, ASN category, colo, protocol, and TLS fields;
- coarse device class;
- DNT/GPC where present.

Raw IP, exact coordinates, postal code, complete referrer paths, cookies, authorization headers, and unique network characteristics do not enter the vector or persistent logs.

#### Tier 1 — explicit browser reveal, session-only

- viewport and screen buckets;
- timezone and languages;
- color scheme and reduced motion;
- pointer, hover, and touch capability;
- bounded network-quality fields;
- hardware-concurrency and device-memory buckets where available;
- geolocation only after a separate browser permission action, reduced immediately to an approved coarse region or distance bucket.

No canvas, audio, font, WebGL renderer, plugin, sensor, battery, local-network, or high-entropy fingerprint collection.

#### Tier 2 — explicit self-imported account data

For the owner's isolated research fixture, support local/manual ingestion of user-controlled exports such as:

- Google Takeout archives;
- Google Data Portability exports for supported Chrome, Maps, Search, YouTube, and related activity, only after separate policy, OAuth, verification, security, and retention review;
- a browser-history export supplied by the user;
- user-supplied search queries, locations, interests, or task history;
- first-party AMTECH interaction exports.

Default budget path: manual Takeout/file upload processed locally or in an isolated development environment. Do not begin Phase 2 by building a verified Google Data Portability production app.

Imported raw data is never copied directly into the request-time vector. An offline adapter produces a bounded, reviewable summary fixture such as approved topic counts, recent explicit task categories, or coarse place categories. The user sees and edits the resulting features before any match. Raw archives are deleted after the declared test or retained only in an encrypted local research directory outside deployment artifacts.

#### Tier 3 — first-party authenticated context

Later research may use user-provided preferences and activity inside AMTECH. This requires a separate retention and account-data design and is not part of the anonymous Request Mirror.

#### Prohibited tier

- covert cross-site identity resolution;
- SpiderFoot, Maltego, data-broker, or social-account correlation against arbitrary visitors;
- private Google/Bing/Reddit history scraping;
- hashed IP/device fingerprinting;
- invisible exact-location or household/lifestyle inference;
- enrichment of a named person from unrelated public records;
- persistent cross-session shape IDs without explicit informed consent.

OSINT platforms may be discussed in a separate defensive self-audit, but they are not input providers for this framework.

### Validation vector

- run the owner fixture through Tier 0 only, Tier 0+1, and Tier 0+1+2;
- display every source, transformation, weight, TTL, and exclusion;
- run feature ablation to show how each source changes ranking;
- compare explicit imported context with the public-request view;
- withdraw each consent tier and verify removal;
- inspect memory, storage, logs, caches, and generated artifacts for raw imported or identifying data;
- test unsupported search/location fields and missing exports;
- verify cross-origin referrers reveal at most the browser-provided data and do not assume search terms are available.

### Pass vector

- every active feature has a visible source, transformation, weight, purpose, and TTL;
- Tier 0 baseline is complete and useful;
- Tier 1 collects nothing before action and clears on withdrawal;
- Tier 2 is user-supplied, isolated, reviewable, and deletable;
- raw archives, exact history, precise location, and named identity never enter runtime artifacts or persistent analytics;
- feature ablation proves what additional data changed without claiming that the hidden search-engine profile was reconstructed;
- prohibited feature count is zero.

### Fail vector

- the system claims to know search, browsing, place, or social history it did not receive explicitly;
- a search-engine referrer is treated as reliable access to the user's query or profile;
- self-consent becomes justification for designing covert collection for later visitors;
- raw Takeout/history/location data enters the deployed vector, logs, cache, or model prompt;
- fingerprinting or cross-platform OSINT enters the product path;
- a consent withdrawal leaves derived features active.

## Part 5B — Experimentation, analytics, and feature-control stack

### Objective

Add enough experimentation infrastructure to run reproducible internal and later A/Z tests without adding a vendor dependency to the resolver hot path or expanding the privacy surface unnecessarily.

### Platform decision

#### Required in code: OpenFeature-compatible boundary

Use OpenFeature or an equivalent small owned interface around assignment and kill-switch decisions. Start with an in-repository provider backed by the signed finite manifest. This keeps the application API vendor-neutral and permits later GrowthBook, Unleash, or another provider without rewriting materialization logic.

#### Preferred experiment analysis/control plane: GrowthBook

GrowthBook is the primary candidate because it is open source, self-hostable, warehouse-native, supports local SDK evaluation, and separates experiment analysis from raw-user-data collection. It is not required for the first local reference; integrate after the event schema and deterministic assignment pass.

Budget sequence:

1. deterministic in-house assignment plus local/Postgres event table;
2. GrowthBook Cloud free or self-hosted evaluation only after the event pipeline is stable;
3. self-host GrowthBook when the operating cost and data-control benefit justify it.

#### Optional product analytics: PostHog

PostHog may be used for explicit allowlisted product events on its free tier or in a separate self-hosted environment. Do not enable default autocapture, person profiles, heatmaps, or session replay in the Request Mirror. Replay is a separate consented experiment with input masking and a data-review checklist.

#### Optional rollout control: Unleash

Unleash is appropriate when the primary need is feature rollout, variants, stickiness, and kill switches. It is not the default statistical analysis engine. Its current open-source licensing and Edge lifecycle must be reviewed before adoption.

### Minimal event contract

```text
experiment_id
assignment_version
arm
variant_id
content_build
vector_build
resolver_version
route_id
coarse context buckets used
fallback reason
resolver timings
canonical/variant exposure
predeclared outcome events
consent state
```

Do not include raw IP, full URL/referrer, exact location, imported account history, arbitrary DOM text, form contents, or persistent anonymous fingerprint IDs.

### Validation vector

- run deterministic A/Z assignment repeatedly with cookies enabled and disabled;
- verify bot and baseline rules;
- replay the same event fixture through the local analyzer and GrowthBook adapter;
- compare counts, assignment ratios, metric definitions, and sample-ratio-mismatch detection;
- exercise kill switch and rollback without GrowthBook/PostHog/Unleash availability;
- inspect outbound payloads and storage schemas;
- test duplicate events, retries, clock skew, version changes, and consent withdrawal;
- measure SDK, network, and bundle overhead;
- compare no-vendor, GrowthBook, PostHog, and Unleash paths against the same operational requirements.

### Pass vector

- resolver and canonical page function with every external experimentation platform unavailable;
- assignment is deterministic, versioned, auditable, and limited to the declared session scope;
- event schema is allowlisted and contains no prohibited identity or imported-history data;
- GrowthBook or any selected platform reproduces the local fixture metrics;
- kill switch restores baseline through one bounded action;
- experiment metrics, guardrails, sample plan, and analysis method are preregistered before outcome review;
- vendor SDK and network overhead stay outside the critical render path.

### Fail vector

- vendor outage or SDK failure blocks the page or resolver;
- a platform becomes the source of canonical truth or eligibility;
- autocapture/replay silently collects page text, forms, imported data, or identifiers;
- assignment depends on a persistent fingerprint or cross-session identity without consent;
- PostHog, GrowthBook, or Unleash is adopted before the in-house control is measurable;
- a dashboard result is treated as conversion acceptance without the declared causal and guardrail gates.

# Integrated first-pass sequence

```text
1A fixture + TypeScript kernel
-> 1B typed shape and correspondence benchmark
-> 2A owned compiler/IR
-> 2B two real AMTECH page families
-> 3A flat exact resolver
-> 3B coverage/replication frontier
-> 5A consented context mirror and ablation fixtures
-> 4A Worker shadow deployment
-> 4B Zig/WASM and Next.js materialization
-> 5B optional experiment platform adapter
```

The Worker may be bootstrapped early to verify Cloudflare request metadata, but materialization priority remains the deterministic compiler/resolver path. Zig/WASM and third-party experimentation platforms are later optimizations, not blockers for the local reference.

# Phase 2 first-pass acceptance boundary

The first pass may claim **working local experience materialization reference** only after:

- the fixture and deterministic TypeScript kernel pass their vectors;
- the owned compiler emits reproducible artifacts;
- two real AMTECH landing-page families compile from shared source truth;
- the flat exact resolver and hard policy gate pass;
- candidate coverage and replication are measured against flat scan;
- the consented context lab records provenance and ablation without prohibited identity resolution;
- all failures and tests not run are recorded.

It still may not claim:

- public conversion lift;
- production Cloudflare performance;
- Google indexing or ranking success;
- Zig/WASM superiority unless its explicit gate passes;
- provider/runtime acceptance;
- arbitrary visitor identity resolution;
- autonomous-company operation;
- production readiness.

# Required artifacts per workstream

- commit SHA and branch;
- exact commands and pinned versions;
- source and generated checksums;
- golden, relevance, coverage, privacy, security, accessibility, load, and SEO reports as applicable;
- representative HTML and screenshot captures;
- JS, Zig scalar, and SIMD comparison where applicable;
- event-schema and outbound-payload capture where applicable;
- explicit failures, fallbacks, and validation not run;
- research-note entry for every changed assumption.

# Stop conditions

Stop materialization and serve baseline if:

- any P0 privacy, security, truth, accessibility, or SEO gate fails;
- any eligible labeled candidate becomes unreachable;
- the resolver exceeds the declared target-runtime budget with no bounded repair;
- HRR does not beat or match the simpler selected baseline within the declared tolerance;
- Zig/WASM adds complexity without material end-to-end benefit;
- imported or inferred traits become inaccurate, hidden, or identity-resolving;
- an experiment platform becomes necessary for page availability;
- the system begins acting like a covert customer profile, fingerprint, data-broker enrichment, or doorway-page engine.

# Primary implementation references

- Plate, Tony A. “Holographic Reduced Representations,” 1995.
- Kleyko et al., VSA/HDC surveys and implementation reviews.
- Cloudflare Workers WebAssembly and platform-limit documentation.
- V8 WebAssembly SIMD documentation.
- Zig stable download and language documentation.
- Next.js 16 Cache Components and runtime documentation.
- OpenFeature specification and JavaScript SDK.
- GrowthBook open-source, local-evaluation, self-hosting, and experimentation documentation.
- PostHog feature-flag, experiment, privacy, and deployment documentation.
- Unleash strategy-variant, A/B-testing, deployment, and licensing documentation.
- Google Takeout and Google Data Portability API documentation.
- MDN Referrer Policy, Geolocation, Permissions, and privacy-control documentation.

These references establish platform behavior, available mechanisms, metrics, and failure modes. They do not establish AMTECH's product thresholds, conversion lift, or production acceptance.