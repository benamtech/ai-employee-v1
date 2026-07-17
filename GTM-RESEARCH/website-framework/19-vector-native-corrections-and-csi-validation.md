# 19 — Vector-Native Corrections, Context Relevance, and CSI Validation

Status: controlling academic/validation addendum; proposal relevance gate remains partial
Updated: 2026-07-17

## Scope

Three deep-review defects were corrected at the compiler-mechanics level:

1. namespace/version now affect actual vector symbols;
2. all page prototypes survive into packed IR and agent context;
3. proposal coverage is numerically computed against the current corpus instead of accepted from prose alone.

The comprehensive review found that item 3 is not yet externally valid: contexts can self-confirm the proposal and the validated code uses shifted cosine, giving orthogonal vectors about `0.5` coverage. Treat the coverage gate as a structural research gate only.

## Academic floor

### Context-document relevance

Deguang Kong, Daniel Zhou, Zhiheng Huang, and Steph Sigalas, “Personalized Search Via Neural Contextual Semantic Relevance Ranking,” arXiv:2309.05113:

https://arxiv.org/abs/2309.05113

The paper defines:

```text
query q
candidate documents D
explicit context C
human relevance labels Y = {Perfect, Good, Fair, Bad}

Pr(D | q, C) ∝ Pr(D | C) · Pr(D | q) · Pr(q, C)
```

Applicable findings:

- query-document relevance and context-document compatibility are distinct;
- explicit cohort-level context can reduce ambiguity;
- lexical and semantic context-document signals should be compared;
- context ablation and out-of-domain tests are appropriate;
- human graded labels are required for a credible test collection.

Framework consequence:

- page proposals require context cases independent of the candidate document;
- query fit, context fit, evidence, utility, and commercial value remain separate terms;
- expected page IDs generated from the same fixture factors are not relevance evidence.

Not established:

- HRR/HDC/VSA as the correct representation;
- public corpus construction;
- Google/Bing lift;
- zero-volume strategy;
- agent-generated quality;
- conversion or revenue.

### HDC/VSA identity and prototypes

Primary authority remains Plate 1995, Kanerva 2009, and the Kleyko et al. surveys in `13-academic-and-normative-basis-for-validation-vectors.md`.

Framework consequence:

- namespace, symbol version, dimensions, role weights, and compiler version define a reproducible space;
- namespace/version rotation must change underlying symbols;
- multiple prototypes are required when one stable page serves several coherent non-convex context regions;
- no downstream compiler stage may silently collapse those regions while claiming multi-prototype behavior.

### Facility-location marginal coverage

The intended proposal objective is:

```text
coverage(S) = Σ_c w_c · max_{p ∈ S} sim(c, p)

marginal(x | S) = coverage(S ∪ {x}) - coverage(S)
```

This is appropriate only when:

- contexts `c` are independently sourced;
- weights are meaningful;
- similarity is calibrated against graded relevance;
- hard eligibility and evidence rules are applied before scoring.

The current implementation computes this form, but its context provenance and similarity transform are not accepted.

### Complement Submodular Information

Rishabh Iyer, “Complement Submodular Information Measures for Balanced and Robust Data Selection,” arXiv:2605.24779:

https://arxiv.org/abs/2605.24779

CSI defines:

```text
I_f(A ; V \ A) = f(A) + f(V \ A) - f(V)
```

Applicable use:

- train/validation/test splitting;
- benchmark/review cohort construction;
- batch page-opportunity selection;
- preserving coherent rare/tail regions while suppressing isolated outliers.

Boundaries:

- it is a new 2026 preprint;
- approximation claims depend on curvature/approximate-monotonicity assumptions;
- CSI is not a single-page novelty oracle;
- the current implementation is a naive Facility Location Complement Information control, not a production optimizer.

## Implemented mechanics

### Vector identity

Files:

- `reference/src/benchmark.ts`
- `site-manifest.yaml`
- `reference/scripts/emit-manifest.mjs`

Implemented:

- `VectorSpaceIdentity { namespace, symbolVersion }`;
- namespace/version-prefixed role, value, and empty-context symbols;
- emitted vector identity metadata;
- tests for deterministic repeat and namespace/version rotation.

### Multi-prototype preservation

Files:

- `reference/src/framework.ts`
- `reference/src/manifest.ts`
- `reference/src/agent-harness.ts`

Implemented:

- all prototypes in `SiteSource` and `PageIR`;
- `PackedSiteIR.prototypeOffsets`, `prototypeIds`, `prototypeVectors`;
- every packed float checked against reference geometry;
- all prototype atoms supplied to generation agents;
- build hashes include packed prototype state.

Residual:

- one legacy page-vector alias remains;
- primary prototype is not explicitly declared in the manifest;
- prototype ordering can affect that alias.

### Computed proposal mechanics

Files:

- `reference/src/manifest.ts`
- `site-manifest.yaml`
- `reference/test/manifest.test.mjs`

Implemented:

- sourced weighted context objects;
- baseline and proposed weighted coverage;
- normalized marginal gain;
- improving-context count;
- maximum existing-page similarity;
- duplicate fixture rejection;
- noindex recompilation.

Residual P0 issues:

- contexts can be proposed by the same agent;
- `relevance_label` is not used;
- validated source maps cosine using `(cos + 1) / 2`;
- orthogonal vectors therefore receive approximately `0.5` compatibility;
- thresholds are not calibrated to human labels.

### CSI control

Files:

- `reference/src/csi.ts`
- `reference/test/vector-native.test.mjs`

Implemented:

- Facility Location Complement Information;
- symmetric kernel validation;
- deterministic positive-marginal greedy selection;
- coherent head/tail fixture with isolated-noise rejection;
- no unsupported approximation guarantee.

## Validation vector

### Vector identity

Run identical features under identical and rotated namespace/version/dimension/role-policy inputs.

Measure:

- byte identity under pinned inputs;
- cosine separation after rotation;
- artifact invalidation;
- TypeScript/Zig/Wasm parity.

### Prototype preservation

For every page compare:

```text
manifest prototypes
CompiledHyperVectorSpace
SiteSource
PageIR
packed offsets/IDs/vectors
agent context
resolver/retrieval candidates
```

Measure count, ID, order/primary semantics, numeric drift, and ranking parity.

### External proposal relevance

Freeze independent query/context cases before page generation. Use at least two assessors and Perfect/Good/Fair/Bad labels.

Compare:

- BM25/lexical;
- learned semantic embeddings;
- typed facets;
- graph;
- HRR;
- hybrid;
- human review.

Measure:

- NDCG@5/10;
- top-fit and bad-fit rates;
- calibration;
- context-poor fallback;
- assessor disagreement;
- head/tail and out-of-domain performance.

### Batch/split selection

Compare random, stratified random, facility location, graph cut, LogDet/diversity, CSI variants, and human selection.

Measure:

- head coverage;
- coherent-tail coverage;
- isolated-outlier rate;
- split distribution distance;
- downstream ranking stability;
- runtime/memory.

## Pass vector

Source identity/prototype gate:

- namespace/version changes actual symbols;
- all prototypes survive every claimed stage;
- packed parity and broad hash determinism pass;
- all current pages remain noindex.

External relevance gate:

- independent contexts and graded labels;
- calibrated compatibility;
- strongest simpler baseline comparison;
- held-out and out-of-domain improvement;
- no expected-ID leakage;
- safe context-poor fallback.

CSI batch gate:

- coherent head and tail regions retained;
- isolated noise suppressed;
- improvement over random, stratified, facility, and diversity controls;
- assumptions and optimization behavior reported.

## Fail vector

- namespace/version changes metadata only;
- secondary prototypes disappear;
- primary alias changes accidentally;
- proposal contexts are generated from the page they evaluate;
- shifted/positive cosine is selected without calibration;
- duplicate rejection is the only relevance evidence;
- token hashing is called neural semantic relevance;
- CSI is used as a single-item admission gate;
- CSI guarantees are claimed without assumptions;
- synthetic labels are reported as search lift;
- source tests are reported as indexing, conversion, or revenue proof.

## Current proof and boundary

Validated code head: `9ef48b97308e09d5a97f4978820255e3c8b53c7e`

Workflow run: `29576487817`

```text
strict TypeScript build: pass
Node tests: 22/22
manifest/UI/browser/R3F source stages: pass
pages: 6
indexable: 0
packed prototypes: 7
```

This closes vector identity, prototype loss, and prose-only mechanics. It does not close external proposal relevance.
