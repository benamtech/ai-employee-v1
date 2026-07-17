# 02 — Context Shape and HRR Core

Status: mathematical and data contract

## Naming

Use **context shape**, not visitor fingerprint or customer profile.

A context shape is a short-lived vector representation of the current request/session context. It contains only allowlisted coarse features and explicit in-session signals. It is not intended to identify or re-identify a person.

## Feature ontology

Every feature belongs to a versioned role namespace.

```text
route.*
intent.*
audience.*
job_stage.*
work_type.*
proof_preference.*
trust_concern.*
source.*
campaign.*
locale.*
region.*
device_class.*
daypart.*
session_action.*
explicit_selection.*
```

Each role/value pair must declare:

- semantic definition;
- source;
- entropy/privacy class;
- consent requirement;
- TTL;
- allowed routes;
- default weight;
- whether it may affect copy, ordering, CTA, or only analytics;
- owner and review date.

Unknown values are discarded rather than dynamically minted at request time.

## Deterministic vector generation

Use a cryptographic deterministic PRNG seeded by:

```text
framework_version + namespace + symbol
```

Generate zero-mean real vectors and normalize to unit length. The exact PRNG and float conversion are part of the artifact version so TypeScript and Zig fixtures agree.

Do not use process-random vectors in production builds.

## Binding

Circular convolution for vectors `a` and `b`:

```text
bind(a,b) = IFFT(FFT(a) * FFT(b))
```

Approximate inverse may use reversed/permuted coordinates or the mathematically defined HRR involution, depending on the chosen implementation. The same definition must be used in the reference and Zig cores.

For stability experiments, include a projection/normalization step after repeated binding or learned updates.

## Build-time pre-binding

For every allowed role/value pair:

```text
feature_vector[role,value] = normalize(bind(role_vector, value_vector))
```

Store pre-bound feature vectors in the generated artifact. This makes request-time shape construction independent of FFT.

## Context shape construction

```text
raw = sum_i(weight_i * feature_vector[i])
shape = normalize(raw)
```

Weights are bounded, versioned, and route-aware.

Suggested initial weight classes:

- explicit user selection: `1.0`;
- route and explicit query intent: `0.8–1.0`;
- campaign/referrer category: `0.5–0.8`;
- consented session interaction: `0.4–0.8` with decay;
- locale/coarse region/device/daypart: `0.1–0.4`;
- inferred features: prohibited unless separately approved.

No feature may dominate solely because it is high entropy.

## Content vector model

Do not encode entire prose directly into HRR symbols.

Each page/component receives a structured content shape from typed facets:

```ts
interface ContentFacets {
  route: string[];
  audience: string[];
  intent: string[];
  jobStage: string[];
  workType: string[];
  proofType: string[];
  trustConcern: string[];
  complexity: string[];
  evidenceLevel: EvidenceLevel;
  conversionStage: string[];
}
```

The content vector is the normalized weighted bundle of its pre-bound facets.

Dense semantic embeddings may be stored separately and used as a benchmark or secondary score. Do not conflate HRR role/filler structure with opaque text embeddings.

## Hierarchical representation

Represent pages at multiple levels:

- site/category vector;
- route vector;
- section vector;
- component vector;
- proof vector;
- CTA vector.

Candidate eligibility narrows from route to section to component. Do not compare every component in the corpus on every request.

## Candidate retrieval

### Stage 1 — hard route/claim filters

Remove candidates incompatible with:

- canonical route;
- locale;
- evidence ceiling;
- offer/pricing state;
- experiment arm;
- legal/privacy policy;
- component dependency;
- device layout constraints.

### Stage 2 — coarse cluster search

Compare shape to precomputed cluster centroids. Retain top `C` clusters.

### Stage 3 — exact scoring

For candidates in retained clusters:

```text
hrr_score = dot(normalized_shape, normalized_candidate)
```

### Stage 4 — graph and prior augmentation

Apply precomputed graph pull, evidence/freshness prior, and bounded business prior.

### Stage 5 — confidence gate

Require:

- absolute top score;
- top-two margin;
- minimum feature coverage;
- no policy violation.

Otherwise select baseline.

## Graph model

Nodes:

- categories;
- routes;
- entities;
- owner questions;
- job stages;
- work types;
- tools/connectors;
- proof records;
- components;
- CTAs.

Edges:

- answers;
- demonstrates;
- belongs_to;
- prerequisite;
- contrasts_with;
- supports;
- requires_approval;
- connects_to;
- next_step.

Graph weights are editorial/build data, not learned from individual identities.

Compute PageRank/centrality and optional seed-specific graph vectors offline. Runtime graph scoring must be bounded and sparse.

## Explainability

The resolver should produce a redacted diagnostic explanation in non-production or sampled internal logs:

```json
{
  "variant_id": "contractor-estimate-proof-first-v2",
  "top_features": [
    ["route.contractors", 1.0],
    ["intent.estimate_followup", 0.9],
    ["device_class.mobile", 0.2]
  ],
  "score": {
    "hrr": 0.71,
    "graph": 0.64,
    "business": 0.50,
    "final": 0.66
  },
  "fallback": false
}
```

Never log raw URL parameters, full referrers, IP, or unique browser characteristics.

## Zig core API

Keep the ABI small and allocation-light.

Candidate exports:

```zig
export fn normalize(ptr: [*]f32, len: usize) i32;
export fn weighted_add(dst: [*]f32, src: [*]const f32, weight: f32, len: usize) i32;
export fn dot(a: [*]const f32, b: [*]const f32, len: usize) f32;
export fn top_k_dot(query: [*]const f32, matrix: [*]const f32, rows: usize, dim: usize, k: usize, out_ids: [*]u32, out_scores: [*]f32) i32;
export fn bind_circular(a: [*]const f32, b: [*]const f32, out: [*]f32, len: usize) i32;
export fn unbind_circular(bound: [*]const f32, role: [*]const f32, out: [*]f32, len: usize) i32;
```

The hot path may use only `weighted_add`, `normalize`, and `top_k_dot`.

## Memory format

Generated artifacts should include:

```text
manifest.json
feature-index.bin
feature-vectors.f32|f16|i8
cluster-centroids.f32
candidate-index.bin
candidate-vectors.f32|f16|i8
graph-priors.bin
eligibility-bitsets.bin
checksums.json
```

Benchmark f32 first. Quantization is accepted only if relevance/robustness vectors pass.

## TypeScript reference implementation

Required before Zig:

- deterministic vector generation;
- circular bind/unbind;
- superposition/normalization;
- cosine/top-k;
- artifact loader;
- composite scoring;
- fixture explanations.

Zig/WASM outputs must match the reference within declared floating-point tolerances.

## Online updates

Do not mutate basis/content vectors per request.

Online learning updates only bounded priors/weights through a versioned offline job after experiment analysis. New vector artifacts require a build/deploy version.

This prevents nondeterministic content drift and makes every variant reproducible.

## Shape lifetime

- request-only shape: memory only;
- anonymous session shape after consent: first-party opaque session ID, server-side TTL <= 24 hours by default;
- no cross-session identity merge;
- no account/customer profile join;
- deletion/expiry is automatic;
- baseline works without any stored shape.

## Prohibited shortcuts

- hashing raw IP/device data and calling it anonymous;
- generating a unique vector value for every unknown query;
- dynamically generating page copy at edge;
- using a model-generated facet without schema/eligibility review;
- storing shape vectors indefinitely;
- allowing conversion outcomes to directly rewrite content weights without randomized analysis;
- treating cosine score as confidence without calibration.