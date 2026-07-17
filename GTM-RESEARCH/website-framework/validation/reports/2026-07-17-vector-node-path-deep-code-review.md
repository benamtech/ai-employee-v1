# Vector Node-Path Deep Code Review

Date: 2026-07-17
Branch: `agent/ui-metaprogramming-pass-1`
Scope: validation and conceptual review only; no new source features added
Status: source-level UI proof retained; real proposal cohort blocked pending review disposition

## Review objective

Determine whether the current implementation actually supports the claimed architecture:

```text
approved source
-> hyper-vector context/page regions
-> corpus coverage and page selection
-> typed node paths
-> semantic/UI compilation
-> canonical page emissions
-> optional public AI Employee work
-> search distribution and conversion measurement
```

The review inspected:

- `reference/src/core.ts`
- `reference/src/benchmark.ts`
- `reference/src/optimizer.ts`
- `reference/src/manifest.ts`
- `reference/src/framework.ts`
- `reference/src/agent-harness.ts`
- `reference/src/distribution.ts`
- `reference/src/resolver.ts`
- `reference/src/ui-scaffold.ts`
- `reference/src/ui-metaprogramming.ts`
- `reference/src/ui-renderer.ts`
- current tests, manifest, product/GTM standards, validation authority, and CI evidence.

## Executive finding

The repository is a credible deterministic research and UI scaffold, but it is not yet a vector-native web framework.

The current source proves:

- deterministic HRR/VSA primitives on synthetic fixtures;
- a typed manifest and static semantic compiler;
- one packed vector and CSR links per page;
- noindex page/UI emissions;
- source-level AMTECH renderer determinism;
- optional noncanonical R3F compilation;
- structural agent proposal insertion;
- synthetic corpus and metric scaffolds.

It does not yet prove or fully implement:

- namespace/version-correct vector identity;
- end-to-end preservation of multi-prototype page regions;
- measured opportunity or marginal-coverage gating;
- semantic typed node paths;
- meaningful external relevance evaluation;
- first-class public AI Employee task surfaces;
- production search distribution or conversion attribution.

## Findings

### F-01 — Critical: vector namespace and version do not affect generated symbols

Files:

- `reference/src/benchmark.ts` — `compileHrrFeatures()`
- `reference/src/core.ts` — `deterministicSymbol()`
- `reference/src/manifest.ts` — `compilePageGeometry()`

Current behavior:

```text
role symbol seed  = role:<role>
value symbol seed = value:<role>:<value>
```

The manifest namespace and manifest/compiler version are not passed into symbol generation.

Impact:

- changing the declared vector namespace changes `spaceHash` metadata but not the underlying vectors;
- two logically separate spaces can unintentionally share symbol geometry;
- V01/PF-HRR-01 claims about version/namespace identity are not satisfied;
- artifact invalidation can describe a new space while retaining old vectors.

Disposition:

- blocks claims of versioned first-class vector-space identity;
- corrective source work required before real proposal generation.

### F-02 — Critical: broad `spaceHash` remains source-order-sensitive

File:

- `reference/src/manifest.ts` — `finalizeVectorSpace()`

Current behavior:

- `pageSummary` uses incoming manifest page order;
- prototype order is also preserved as supplied;
- axes are returned without canonical serialization.

The UI pass introduced a separate canonical UI hash, but `CompiledHyperVectorSpace.spaceHash` remains unstable under source reordering.

Impact:

- agent-context and manifest emissions can report different space hashes for semantically identical source;
- cache, provenance, and comparison records cannot treat the broad hash as canonical;
- the unified-architecture pass vector claiming byte-identical space hashes is not met globally.

Disposition:

- source-level UI determinism passes only inside the UI-specific canonicalization boundary;
- global compiler determinism remains blocked.

### F-03 — High: multi-prototype page geometry is lost across the main compiler boundary

Files:

- `reference/src/manifest.ts` — `compileFrameworkManifest()` and `assertPrimaryVectorParity()`
- `reference/src/framework.ts` — `PageSource`, `PageIR`, and `packSite()`

Current behavior:

- `CompiledHyperVectorSpace` preserves all page prototypes;
- `SiteSource.features` is populated only from `geometry.prototypes[0]`;
- `PageIR` carries one feature map;
- `PackedSiteIR.pageVectors` stores one vector per page;
- parity explicitly validates only the primary prototype.

Impact:

- non-convex page compatibility regions are not represented in packed site state;
- downstream scoring from packed vectors cannot reproduce multi-prototype matching;
- the agent/UI layers may list prototype IDs while the main page IR contains only one vector;
- documentation overstates end-to-end prototype preservation.

Disposition:

- multi-prototype support is currently a sidecar property of `CompiledHyperVectorSpace`, not a complete compiler invariant.

### F-04 — High: agent proposal coverage is asserted, not computed

Files:

- `reference/src/manifest.ts` — `validateAgentPageProposal()`
- `reference/src/optimizer.ts`

Current behavior:

- proposals require a nonempty `marginal_coverage_hypothesis` string;
- proposal validation does not invoke facility location, leave-one-out coverage, duplicate detection, or any current-corpus scoring;
- successful structural recompilation is sufficient for insertion into the noindex profile.

Impact:

- the harness does not prove that a proposal covers a missing region;
- agents can submit plausible prose while adding a redundant page;
- the optimizer exists as a disconnected laboratory rather than an admission gate.

Disposition:

- agent proposals remain structural research fixtures;
- do not generate the first real cohort until coverage computation is connected or human review is explicitly declared as the gate.

### F-05 — High: vector-derived internal links are not typed node paths

File:

- `reference/src/manifest.ts` — `deriveNearestPages()`

Current behavior:

- candidate links are selected by maximum raw prototype cosine;
- filtering uses only profile overlap and a global cosine threshold;
- emitted edges are untyped page IDs;
- no edge rationale, canonical relationship, evidence compatibility, stage transition, or commercial path is stored.

Impact:

- a mathematically nearby page can be a poor next step;
- broad hub, prerequisite, proof, comparison, integration, and conversion relationships are indistinguishable;
- search/internal-link strategy cannot explain why the edge exists;
- the graph is insufficient for prospect path optimization.

Disposition:

- current auto-links are suggestions for review, not production authority.

### F-06 — High: the “hyper-aware” agent context exposes only the primary region

File:

- `reference/src/agent-harness.ts`

Current behavior:

- `targetAtoms` comes from `page.prototypes[0]` only;
- neighbor scoring uses the primary prototype against candidate prototype sets;
- secondary entry regions are absent from the generation packet;
- the context returns the globally unstable `spaceHash`.

Impact:

- an agent can unknowingly duplicate or contradict a secondary page region;
- the generation harness is less aware than the compiled vector space it describes;
- multi-prototype pages cannot be reviewed from the emitted agent context alone.

Disposition:

- agent context is a first-pass summary, not a complete geometry handoff.

### F-07 — High: the synthetic relevance benchmark is true largely by construction

File:

- `reference/src/benchmark.ts`

Current behavior:

- expected page IDs are generated directly from the same vertical/task/stage/proof factors used to generate candidate pages;
- `hardCompatible()` requires exact task/vertical/industry matches;
- zero-match contexts are marked `zeroMatch`, and `scoreContextPage()` makes every page ineligible for them;
- zero-match accuracy therefore reaches `1.0` by construction;
- the “semantic” arm is deterministic token hashing, not a learned semantic embedding;
- relevance uses one known relevant document rather than independent graded human judgments.

Impact:

- metrics validate test plumbing, not external document-context compatibility;
- HRR/hybrid comparisons cannot support SEO or real opportunity claims;
- the existing report language must stay explicitly synthetic.

Disposition:

- retain as a deterministic fixture generator only;
- external benchmark requirements in files `05` and `15` remain entirely unpassed.

### F-08 — High: the UI is vector-preserving metadata, not generally vector-selected layout

Files:

- `reference/src/ui-metaprogramming.ts`
- `reference/src/ui-renderer.ts`

Current behavior:

- matrix coordinates, prototype IDs, and neighbors are retained in the plan;
- `chooseArchetype()` selects layout from semantic module kinds and information-object kinds;
- component choice is a fixed map from module kind;
- matrix/vector data is rendered as a visible coordinate and may influence the optional scene, but it does not generally choose the page structure.

Impact:

- “page-matrix/vector-to-layout compiler” is too strong if interpreted literally;
- current beauty/consistency comes from semantic module grammar and AMTECH design rules;
- vector geometry currently informs provenance and some optional visualization, not broad layout metaprogramming.

Disposition:

- source-level UI pass remains valid;
- describe it as deterministic semantic rendering with geometry retention.

### F-09 — High: public AI Employee task surfaces are absent from the website IR

Compared sources:

- `mvp-build/docs/public-interaction-standard.md`
- `mvp-build/docs/ux/05-generative-ui-frontier.md`
- `reference/src/framework.ts`
- `reference/src/ui-metaprogramming.ts`

Current behavior:

- `ModuleKind` supports static content categories only;
- `UiPagePerformanceBudget.canonicalJavascriptBytes` is hardcoded to zero;
- no contract represents task input, secure controls, session streaming, typed artifacts, approval, action, proof, recovery, or runtime capability;
- instruction pointers and R3F scenes are not employee execution surfaces.

Impact:

- pages such as “create an estimate with AI” can currently explain the task but cannot declaratively host the limited free employee experience described by product strategy;
- the web framework and product runtime remain conceptually adjacent but technically disconnected.

Disposition:

- this is the next major architecture contract, but no feature was added in this review;
- file `18` defines the required separation and validation model.

### F-10 — High: distribution aggregation does not enforce experiment boundaries

File:

- `reference/src/distribution.ts` — `aggregateDistribution()`

Current behavior:

- observations are filtered by page ID only;
- events are filtered by page ID only;
- `experimentId`, observation start/end, published date, declared arm, and variant consistency are not enforced during aggregation;
- events outside the experiment can contaminate metrics.

Impact:

- per-arm revenue and conversion metrics are not reliable field-analysis authority;
- a page reused across experiments can contaminate results;
- predeclared observation windows are validated but not applied.

Disposition:

- distribution code is a schema/math scaffold, not accepted experiment analysis.

### F-11 — Medium: conversion event deduplication is not business-idempotent

File:

- `reference/src/distribution.ts` — `createConversionEvent()`

Current behavior:

- the event ID hashes all supplied fields, including `occurredAt`;
- a retry with a slightly changed timestamp becomes a new event;
- there is no provider/business event key.

Impact:

- retries or reimports can double-count conversions or revenue;
- “idempotent conversion-event schema” is overstated.

Disposition:

- require a stable upstream event identity before field use.

### F-12 — Medium: ontology values are open by default

Files:

- `site-manifest.yaml`
- `reference/src/manifest.ts` — `normalizedAtoms()`

Current behavior:

- axis names are declared;
- values are constrained only when an axis supplies `allowed_values`;
- current axes generally do not define controlled vocabularies;
- agents can introduce spelling, synonym, granularity, and category drift.

Impact:

- vector vocabulary can fragment at scale;
- near-identical concepts become unrelated symbols;
- page-count growth can reflect ontology drift rather than demand coverage.

Disposition:

- current free-value axes are acceptable for research fixtures only;
- real proposal work needs vocabulary governance and merge/review policy.

### F-13 — Medium: evidence levels are coarse and not claim-specific enough for production proof

Files:

- `reference/src/framework.ts`
- `site-manifest.yaml`

Current behavior:

- evidence is an integer level plus summary/URL;
- claim validation checks only whether every referenced evidence record meets a numeric minimum;
- applicability, freshness, environment, provider/runtime scope, and contradiction are not modeled.

Impact:

- an evidence record with a sufficient level can still be irrelevant to a claim;
- current validation prevents some inflation but does not establish claim truth.

Disposition:

- appropriate for source-level fixtures only.

## Validation authority reconciliation

### Retained passes

The following evidence remains valid:

- deterministic TypeScript build and tests on the recorded head;
- UI-specific source-order determinism;
- noindex fixture emissions;
- complete static HTML for the two UI pages;
- CSS budget and browser-tier checks;
- successful pinned R3F source build;
- synthetic scale throughput as compiler-only evidence.

### Withdrawn or narrowed interpretations

The review narrows these phrases:

- “first-class vector space feeds everything” means the manifest geometry is compiled before emissions, not that every downstream IR preserves every prototype;
- “hyper-aware agent harness” means geometry and page summaries are supplied, not that opportunity or marginal coverage is computed;
- “vector-derived graph” means untyped similarity links, not semantic prospect paths;
- “page-matrix-to-layout” means matrix provenance plus semantic grammar, not general vector-selected UI;
- “idempotent conversion events” is not accepted;
- “semantic scoring” in the synthetic benchmark is hashed-token scoring;
- “production-oriented pass” remains source scaffolding and synthetic proof only.

## Correct conceptual model

The project should use the three-plane model in `18-vector-node-path-web-framework-model.md`:

1. offline publication/corpus plane;
2. stable canonical navigation/node-path plane;
3. explicit-session public AI Employee interaction plane.

The same product truth and evidence graph feed all three, but their state, validation, and runtime boundaries are different.

## Gate before first real agent proposals

Do not generate the first 20–40 field candidates until each critical/high finding has one of:

- corrected and tested;
- explicitly accepted as a temporary limitation with a manual gate;
- removed from the claimed architecture.

Minimum disposition required:

- F-01 namespace/version vector identity;
- F-02 broad deterministic hashing;
- F-03 multi-prototype preservation boundary;
- F-04 measured or manual marginal-coverage gate;
- F-05 typed/manual internal-link path review;
- F-07 external relevance benchmark plan;
- F-09 public-task surface boundary;
- F-10 experiment-window/identity correctness.

## Validation run

No new build, test, browser, provider, runtime, search, or field experiment was run for this review.

The existing exact-head CI result for PR #17 remains the latest source proof. This report is based on static source inspection and reconciliation against canonical product and interaction documents.