# 19 — Vector-Native Corrections, Context Relevance, and CSI Validation

Status: controlling implementation/validation addendum
Updated: 2026-07-17
Scope: vector identity, multi-prototype compilation, proposal coverage, and batch subset selection

## Purpose

Close the three highest-impact defects found in the deep review:

1. vector symbols were not namespaced or versioned;
2. secondary page prototypes were lost after the geometry sidecar;
3. agent proposals asserted marginal coverage in prose rather than proving it computationally.

This addendum also defines the correct role of Complement Submodular Information (CSI): a batch-selection and train/validation/test construction arm, not a universal single-page novelty score.

## Research floor

### Contextual neural relevance ranking

Deguang Kong, Daniel Zhou, Zhiheng Huang, and Steph Sigalas, “Personalized Search Via Neural Contextual Semantic Relevance Ranking,” arXiv:2309.05113:

https://arxiv.org/abs/2309.05113

Applicable model:

```text
query q
candidate documents D
explicit context C
human graded relevance labels Y = {Perfect, Good, Fair, Bad}
```

The paper separates:

```text
Pr(D | q, C) ∝ Pr(D | C) · Pr(D | q) · Pr(q, C)
```

where:

- `Pr(D | q)` is ordinary query-document relevance;
- `Pr(D | C)` is document-context compatibility;
- `Pr(q, C)` is a query-context prior.

The paper combines lexical and semantic document-context signals and evaluates contextual ablations and out-of-domain generalization.

Framework consequence:

- an AMTECH page opportunity cannot be represented only by a keyword or page vector;
- proposal validation requires explicit context cases distinct from the proposed document;
- query-document relevance, context-document compatibility, evidence, utility, and commercial value remain separate measurable terms;
- future external test collections require independent graded judgments rather than generated expected IDs.

Not established by this paper:

- HRR/HDC/VSA as the correct representation;
- construction of a public web corpus;
- Google/Bing indexing or ranking lift;
- agent-generated page quality;
- zero-volume commercial value;
- AMTECH conversion or revenue lift.

### HDC/VSA identity and compositional representation

Primary references remain Plate 1995, Kanerva 2009, and the Kleyko et al. surveys listed in `13-academic-and-normative-basis-for-validation-vectors.md`.

Framework consequence:

- role and filler symbols are part of a declared vector-space identity;
- changing namespace or symbol version must change the actual vectors, not only a metadata hash;
- all artifacts must declare the namespace, symbol version, dimensions, compiler version, and source hash needed to reproduce the space;
- multiple prototypes are legitimate when one canonical node serves several coherent, non-convex context regions.

### Facility location and marginal coverage

Classical monotone facility-location objectives model representative coverage using diminishing returns. The current proposal gate uses the equivalent incremental idea:

```text
coverage(S) = Σ_c w_c · max_{p ∈ S} sim(c, p)

marginal(proposal | S) = coverage(S ∪ {proposal}) - coverage(S)
```

where contexts `c` are explicit sourced demand/context cases, pages `p` expose one or more prototypes, and similarity is the best compatible prototype fit.

Framework consequence:

- a proposal must improve at least one declared context;
- gain is measured against the current corpus, not against an empty space;
- a duplicate page receives near-zero marginal gain;
- a separate maximum-existing-page-similarity gate catches near-copy geometry;
- thresholds remain AMTECH engineering policy, not academic constants.

### Complement Submodular Information

Rishabh Iyer, “Complement Submodular Information Measures for Balanced and Robust Data Selection,” arXiv:2605.24779:

https://arxiv.org/abs/2605.24779

CSI defines complement information for a normalized monotone submodular function `f`:

```text
I_f(A ; V \ A) = f(A) + f(V \ A) - f(V)
```

The paper introduces complement-aware variants of Facility Location, Graph Cut, LogDet, coverage, and feature-based functions. Its intended applications include balanced train/validation/test splitting and robust subset selection, especially when latent coherent tail slices should be preserved while isolated outliers should be suppressed.

Framework consequence:

- CSI is a strong comparison arm for selecting a batch of page opportunities, benchmark cases, review cohorts, or train/validation/test contexts;
- CSI can help prevent facility-location selection from concentrating only on dominant head regions;
- CSI can help prevent pure diversity objectives from selecting isolated noise merely because it is dissimilar;
- CSI must not be treated as peer-reviewed production authority: arXiv:2605.24779 is a new 2026 preprint;
- its approximation claims depend on curvature/approximate-monotonicity assumptions that must be separately diagnosed;
- CSI is not the single-page admission gate because a legitimate first node in a new coherent slice can have low complement information when evaluated alone.

## Corrected architecture

```text
manifest.vector_space {
  namespace,
  symbol_version,
  dimensions,
  axes
}
        |
        v
namespaced role/filler symbols
        |
        v
all page prototypes
        |
        +-> CompiledHyperVectorSpace
        +-> SiteSource.vectorPrototypes
        +-> PageIR.vectorPrototypes
        +-> PackedSiteIR.prototypeOffsets
        +-> PackedSiteIR.prototypeIds
        +-> PackedSiteIR.prototypeVectors
        +-> primary page-vector compatibility alias
        |
        v
explicit sourced proposal contexts
        |
        v
computed baseline coverage vs proposed coverage
        |
        +-> marginal gain
        +-> improving contexts
        +-> maximum existing similarity
        +-> CSI diagnostic/batch arm
        |
        v
noindex proposal admission or rejection
```

## Implemented corrections

### C-01 — Vector identity

`reference/src/benchmark.ts`

- added `VectorSpaceIdentity`;
- symbol seeds now include namespace and symbol version;
- empty-context symbols use the same identity;
- rotating namespace or symbol version produces a new deterministic space.

`site-manifest.yaml`

- declares `namespace: amtech-hyper-site-v1`;
- declares `symbol_version: "1"`.

### C-02 — Multi-prototype preservation

`reference/src/framework.ts`

- added `VectorPrototypeSource` and `VectorPrototypeIR`;
- `PageIR` retains all page prototypes;
- `PackedSiteIR` now contains `prototypeOffsets`, `prototypeIds`, and `prototypeVectors`;
- build hashes include all packed prototype artifacts;
- the legacy one-vector-per-page array remains only as a primary compatibility alias.

`reference/src/manifest.ts`

- sends all compiled prototypes through `SiteSource`;
- validates every packed prototype against the canonical geometry;
- agent context exposes every prototype and its atoms.

### C-03 — Canonical vector-space hashing

`reference/src/manifest.ts`

- sorts pages, profiles, prototypes, atoms, neighbors, axes, and vocabulary before hashing;
- semantically identical source collection order produces the same broad `spaceHash`;
- UI-specific and compiler-wide determinism now agree on the source-order invariant.

### C-04 — Computed proposal coverage

`reference/src/manifest.ts`

- proposals require sourced `coverage_contexts`;
- computes current-corpus coverage and proposed-corpus coverage;
- reports normalized marginal gain and improved context IDs;
- rejects proposals below manifest policy;
- rejects proposals over the existing-page-similarity ceiling;
- retains the human hypothesis as rationale, not evidence.

### C-05 — CSI research arm

`reference/src/csi.ts`

- implements Facility Location Complement Information;
- implements deterministic positive-marginal greedy selection under a budget;
- explicitly avoids claiming the paper’s curvature-dependent approximation guarantee without a curvature diagnostic;
- current tests use a coherent head slice, coherent tail slice, and isolated noise point.

## Validation vector

### Vector identity

Run identical features under:

- identical namespace/version;
- changed namespace;
- changed symbol version;
- changed dimensions;
- source reordering.

Measure:

- byte equality under identical identity;
- cosine separation after identity rotation;
- deterministic hashes;
- artifact invalidation;
- parity across TypeScript and future Zig/Wasm.

### Prototype preservation

For every page:

- enumerate manifest prototypes;
- enumerate compiled geometry prototypes;
- enumerate `PageIR` prototypes;
- inspect packed offset range;
- compare every packed float with the reference vector;
- run best-prototype scoring through both unpacked and packed paths.

Measure:

- missing/extra prototype count;
- ID/order drift;
- maximum absolute numeric drift;
- ranking parity;
- primary-alias consistency.

### Proposal marginal coverage

Construct:

- an independently sourced context set;
- a clearly distinct page proposal;
- an exact/near duplicate;
- a plausible but unsupported outlier;
- a coherent rare-slice proposal;
- contexts with graded `Perfect/Good/Fair/Bad` judgments.

Compare:

- lexical query-document relevance;
- learned semantic relevance;
- typed facet fit;
- graph relationship fit;
- HRR prototype fit;
- hybrid scoring;
- facility-location marginal gain;
- human review.

Measure:

- weighted baseline coverage;
- proposed coverage;
- normalized gain;
- improving context count;
- duplicate rejection;
- calibration against human grades;
- head/tail performance;
- out-of-domain performance.

### CSI batch selection

Create latent and labeled head/tail/outlier fixtures. Compare:

- random selection;
- stratified random when labels exist;
- facility location;
- graph cut;
- LogDet/DPP-style diversity;
- saturated coverage;
- CSI counterparts;
- human-curated selection.

Measure:

- head coverage;
- coherent-tail coverage;
- isolated-outlier selection rate;
- train/validation/test distribution distance;
- downstream ranking stability;
- reviewer actionability;
- selection runtime and memory.

## Pass vector

The vector-native source gate passes when:

- identical namespace/version/input produces identical vectors;
- namespace or symbol-version rotation changes the underlying symbol space;
- every declared prototype survives through geometry, `SiteSource`, `PageIR`, packed IR, agent context, and emissions metadata;
- packed floats match the TypeScript reference within declared tolerance;
- broad hashes do not change under source collection reordering;
- a distinct proposal has positive measured marginal coverage;
- an exact or near duplicate fails the coverage/similarity gate;
- proposal contexts carry source provenance and positive finite weights;
- all proposals remain noindex;
- CSI batch selection preserves coherent head and tail regions and rejects isolated noise on the controlled fixture;
- every result remains explicitly labeled synthetic until independently judged or field-observed.

The external relevance gate passes only when:

- query/context/document tuples are independently assembled;
- at least two assessors use graded labels;
- assessor disagreement is retained;
- contextual methods beat the strongest simpler baseline on held-out and out-of-domain cases;
- context-poor queries safely fall back;
- results are not created by encoding the expected page ID into the fixture.

## Fail vector

- namespace/version changes hashes but not vectors;
- secondary prototypes disappear after manifest compilation;
- packed retrieval scores only a centroid or arbitrary first prototype while claiming non-convex support;
- prototype order silently changes the primary alias;
- a proposal passes because its hypothesis sounds persuasive;
- demand/context cases are generated from the proposed page rather than independently sourced;
- negative cosine is shifted into a misleading positive “coverage” score without calibration;
- a duplicate passes due to weak thresholds;
- CSI is used as a single-item novelty oracle;
- CSI theory is cited without checking the assumptions used for the guarantee;
- tail preservation selects isolated noise;
- synthetic expected IDs or forced incompatibility rules are reported as real ranking evidence;
- any source-level result is described as Google/Bing, conversion, or revenue validation.

## Current proof

Validated source head: `9ef48b97308e09d5a97f4978820255e3c8b53c7e`

GitHub Actions run: `29576487817`

Result:

```text
strict TypeScript build: pass
Node tests: 22/22 pass
manifest emission: pass
UI emission: pass
browser target resolution: pass
R3F source build: pass
pages: 6
indexable pages: 0
packed prototypes: 7
```

This proof closes the original namespace/version, prototype-loss, broad-hash, primary-only-agent-context, and prose-only-coverage defects at source level.

## Remaining limitations

- explicit primary-prototype declaration is not yet part of the manifest schema; the primary page-vector alias uses the canonicalized first prototype;
- typed semantic edge/path contracts remain absent;
- proposal contexts are structurally sourced but not yet independently adjudicated external search cases;
- current “semantic” synthetic benchmark is token hashing, not a learned embedding model;
- public AI Employee streaming/task surfaces remain outside the website IR;
- field search and commercial acceptance remain entirely pending.
