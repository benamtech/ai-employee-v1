# Comprehensive Website-Framework Codebase Reorientation Review

Date: 2026-07-17
Branch: `agent/ui-metaprogramming-pass-1`
Scope: full `GTM-RESEARCH/website-framework/reference/` source, manifest, tests, CI, UI, Worker, Zig/Wasm, distribution, validation authority, and memory
Status: source compiler improved; first real page cohort remains blocked

## Executive conclusion

The project is now substantially closer to a vector-native publishing compiler:

- vector namespace and symbol version affect actual HRR symbols;
- every declared prototype survives into packed IR;
- broad compiler hashes are source-order-stable;
- proposal admission computes current-versus-proposed coverage;
- CSI exists as a bounded batch-selection control;
- source CI passes 22 tests and all emission/build stages.

It is still not a production web framework or a validated page-opportunity engine.

The remaining blockers are no longer “the vector space is only a sidecar.” They are now:

1. page-primary semantics and compatibility calibration;
2. independent relevance ground truth;
3. typed graph paths;
4. public AI Employee interaction IR;
5. runtime/distribution correctness and real field proof.

## Files reviewed

source[18]:
  reference/src/core.ts
  reference/src/benchmark.ts
  reference/src/optimizer.ts
  reference/src/csi.ts
  reference/src/framework.ts
  reference/src/manifest.ts
  reference/src/agent-harness.ts
  reference/src/distribution.ts
  reference/src/resolver.ts
  reference/src/wasm.ts
  reference/src/ui-scaffold.ts
  reference/src/ui-metaprogramming.ts
  reference/src/ui-renderer.ts
  reference/src/three-scene.ts
  reference/worker/src/index.ts
  reference/zig/kernel.zig
  reference/scripts/emit-manifest.mjs
  reference/test/*.test.mjs

controls[8]:
  site-manifest.yaml
  reference/package.json
  .github/workflows/website-framework-reference.yml
  README.md
  CODEGRAPH.md
  AGENTS.md
  validation/reports/2026-07-17-vector-node-path-deep-code-review.md
  validation/reports/2026-07-17-vector-native-corrections.md

## Corrected findings

### C-01 — Vector identity is real

State: corrected

`compileHrrFeatures()` seeds role/value symbols with namespace and symbol version. Tests rotate each independently and verify a different vector space.

Remaining requirement:

- add compiler version and role-weight-policy version to emitted identity before durable cross-version migrations.

### C-02 — All prototypes survive compilation

State: corrected

All prototypes now exist in:

- `CompiledHyperVectorSpace`;
- `SiteSource.vectorPrototypes`;
- `PageIR.vectorPrototypes`;
- `PackedSiteIR.prototypeOffsets`;
- `PackedSiteIR.prototypeIds`;
- `PackedSiteIR.prototypeVectors`;
- agent context and emitted metadata.

### C-03 — Broad hashing is canonical

State: corrected for source collection order

Pages, axes, prototypes, atoms, profiles, neighbors, and vocabulary are canonicalized before the broad space hash.

Nested prototype order remains semantically significant because it currently determines the primary compatibility alias.

### C-04 — Proposal coverage is executable

State: partially corrected

The gate now calculates baseline and proposed weighted coverage, improving contexts, and duplicate similarity.

It is no longer a prose-only gate.

It is not yet research-valid because the contexts can be supplied by the same proposal agent and the similarity calibration is not independently validated.

## P0 findings

### R-01 — Primary prototype semantics are implicit

Severity: P0
Files: `reference/src/manifest.ts`, `reference/src/framework.ts`, `site-manifest.yaml`

Current behavior:

- the compiler exposes one legacy `pageVectors` alias;
- `framework.ts` can support `primaryPrototypeId` in `PageSource`;
- the manifest schema does not declare a primary ID;
- current geometry canonicalization orders prototypes by ID, so the alias can differ from the authored top-level page atoms.

Impact:

- primary page vector, visible matrix coordinate, and intended canonical entry region can disagree;
- nested prototype reordering or renaming can alter the compatibility alias;
- resolver code using `pageVectors` can silently ignore the intended primary region.

Pass requirement:

- add explicit `primary_prototype_id` and validate membership, or remove `pageVectors` from authoritative retrieval;
- prove primary/all-prototype parity and source-order semantics.

### R-02 — Coverage uses uncalibrated shifted cosine

Severity: P0
File: `reference/src/manifest.ts`

Current source-level proof used:

```text
bounded(cosine) = (cosine + 1) / 2
```

Therefore unrelated/orthogonal HRR vectors contribute approximately `0.5` coverage rather than zero.

Impact:

- current-corpus baseline coverage is inflated;
- normalized marginal gains are compressed;
- policy threshold `0.01` has no external interpretation;
- a mechanical duplicate test can pass while real calibration remains unknown.

Pass requirement:

- compare raw positive cosine, shifted cosine, calibrated probabilities, typed-facet eligibility, and learned relevance;
- choose the transform using independent graded validation data;
- preregister thresholds and preserve reliability/calibration plots.

Until then, F-04 is “computed mechanics closed; relevance calibration open.”

### R-03 — Proposal contexts can self-confirm the page

Severity: P0
File: `reference/src/manifest.ts`

Current behavior:

- proposal contexts require IDs, positive weights, source IDs, and valid atoms;
- they can still be authored by the same agent that proposes the page;
- `relevance_label` is stored but not used in the gate;
- no assessor independence or source-class policy is enforced.

Impact:

- an agent can construct contexts that exactly match its page;
- positive marginal gain can become circular evidence;
- contextual-ranking-paper methodology is not replicated.

Pass requirement:

- demand/context cases come from an independent frozen corpus;
- train/validation/test splits are fixed before page generation;
- at least two assessors grade query/context/document fit using Perfect/Good/Fair/Bad;
- disagreement and out-of-domain results are retained.

### R-04 — Internal links are not node paths

Severity: P0
File: `reference/src/manifest.ts`

Current behavior:

- auto-links are maximum prototype cosine under profile overlap;
- edges are untyped page IDs;
- no relationship, stage transition, prerequisite, proof dependency, task transition, or rationale is compiled.

Impact:

- similar pages can be poor next steps;
- internal-link authority cannot explain edge purpose;
- prospect and agent navigation cannot be validated as a path.

Pass requirement:

- typed edge schema;
- explicit/derived provenance;
- hard eligibility by node class and product truth;
- human usefulness tests;
- separate similarity suggestion from publication edge approval.

## P1 findings

### R-05 — Synthetic benchmark is plumbing, not relevance evidence

Severity: P1
File: `reference/src/benchmark.ts`

- expected IDs are generated from the same factors as candidate pages;
- hard compatibility removes many wrong candidates;
- zero-match contexts force all pages ineligible;
- “semantic” is token hashing, not a learned semantic model;
- one relevant page is assumed rather than independently graded.

Required use:

- deterministic regression only.

Required next benchmark:

- lexical BM25;
- learned semantic embedding;
- typed facets;
- graph;
- HRR;
- hybrid;
- independent graded labels;
- held-out and out-of-domain tests.

### R-06 — CSI is correctly bounded but not production optimized

Severity: P1
File: `reference/src/csi.ts`

Strengths:

- exact Facility Location Complement Information definition;
- symmetric-kernel validation;
- positive-marginal deterministic greedy stop;
- no unsupported approximation claim.

Limitations:

- naive repeated `O(k n²)` objective evaluation;
- no curvature/approximate-monotonicity diagnostic;
- no random, stratified, facility, LogDet, graph-cut, or human baseline report;
- controlled five-point fixture only.

Use it for batch/split experiments, not request-time or single-proposal authority.

### R-07 — Classical optimizer arms need stronger input validation

Severity: P1
File: `reference/src/optimizer.ts`

Findings:

- lazy facility validation does not validate every similarity row length, candidate count, finite context weights, positive costs, or budget;
- composite metadata IDs are not checked against facility candidate IDs;
- `logDeterminantForSelection()` assumes a positive-definite selected kernel and throws when violated;
- no jitter policy or PSD validation is declared;
- rare-tail reward is a hand-authored grouping control, not latent-slice discovery.

### R-08 — TypeScript resolver is not bound to vector identity

Severity: P1
File: `reference/src/resolver.ts`

Findings:

- manifest has version/dimensions but no namespace, symbol version, source hash, or prototype-layout hash;
- candidate vectors are not checked for finite numbers;
- eligibility uses JavaScript 32-bit bitwise masks, limiting safe independent flags;
- experiment holdout is hardcoded at 50%; no declared experiment policy;
- input context provenance/allowlist is outside the contract;
- no all-prototype packed-page retrieval interface.

### R-09 — Worker and TypeScript resolver semantics diverge

Severity: P1
Files: `reference/src/resolver.ts`, `reference/worker/src/index.ts`

Differences:

- TypeScript resolver implements a 50% holdout; Worker does not;
- error/status shapes differ;
- Worker manifest parsing validates dimensions only;
- no manifest signature/hash/identity parity;
- resolver code is duplicated rather than sharing a compiled contract;
- experiment endpoint accepts and discards events, so it is not measurement infrastructure.

The Worker remains a source scaffold.

### R-10 — Wasm adapter can retain stale views after memory growth

Severity: P1
File: `reference/src/wasm.ts`

`allocate()` returns a typed-array view immediately. A later allocation in the same operation can call `memory.grow()`, replacing/detaching the previous `memory.buffer`. Earlier views may become stale before `.set()` or return-copy operations.

Example risk:

```text
allocate left -> view A
allocate right -> memory.grow()
A may reference the old buffer
```

Additional gaps:

- export validation checks property presence, not callable types/memory type;
- no maximum allocation or overflow guard;
- no concurrent/reentrant contract;
- no compiled Zig/Wasm parity proof on current branch.

### R-11 — Field distribution metrics are not experiment-safe

Severity: P1
File: `reference/src/distribution.ts`

Known defects remain:

- search/events filtered by page ID, not experiment ID and observation window;
- event arm/variant consistency is not checked against page assignment;
- `publishedAt` is not enforced;
- conversion event ID includes timestamp and is not stable across retry/import;
- query normalization is only lowercase;
- no statistical uncertainty, pre-period, seasonality, exposure, or assisted-conversion contract.

Do not use for field acceptance.

### R-12 — Public AI Employee execution is absent

Severity: P1
Files: `reference/src/framework.ts`, `reference/src/ui-metaprogramming.ts`

Current page IR represents static content and optional noncanonical visualization only.

Missing:

- task input schema;
- secure deterministic controls;
- session/stream states;
- typed work artifact;
- approval/action/proof/recovery contract;
- runtime capability and fallback;
- Start Free persistence transition.

The interaction plane must derive from `mvp-build/docs/public-interaction-standard.md`, not generic chat.

### R-13 — Browser/UI proof remains source-only

Severity: P1
Files: `reference/src/ui-metaprogramming.ts`, `reference/src/ui-renderer.ts`, `reference/ui-r3f/`

Current proof establishes deterministic static output and build budgets.

Not tested:

- real browser screenshots;
- keyboard and accessibility tree;
- 400% zoom/reflow;
- contrast and forced colors;
- CSS feature fallback behavior across browser floors;
- field LCP/INP/CLS;
- mobile GPU, context loss, thermal/battery behavior;
- design quality across a representative 20–40-page corpus.

## P2 findings

### R-14 — Ontology values remain open

Most axes have descriptions but no controlled `allowed_values`. Agents can create spelling, synonym, hierarchy, and granularity drift.

Required:

- reviewed vocabularies;
- alias/merge/deprecation rules;
- source provenance;
- versioned ontology migrations.

### R-15 — Evidence validation is level-based, not applicability-based

A claim passes when referenced evidence meets a numeric level. The compiler does not model:

- claim/evidence subject match;
- environment/provider applicability;
- freshness/expiry;
- contradiction;
- first-party versus third-party scope;
- field proof identity.

### R-16 — Static schema is intentionally minimal

The renderer emits generic `WebPage` plus `Question`. It does not yet derive page-class-specific schema, breadcrumbs, FAQ visibility rules, software/integration entities, or public task semantics.

This is acceptable for noindex fixtures, not production SEO acceptance.

### R-17 — Memory authority was previously fragmented

Corrected operationally:

- `memory/MEMORY.md` is now the cumulative index;
- timestamped handoffs are immutable;
- `AGENTS.md` enforces append-only use;
- legacy website memories in `mvp-build/memory/` remain historical references.

## Academic alignment

### Context ranking

The current explicit context-case contract is directionally aligned with Kong et al. 2023, but the code does not yet implement their independent human annotation, lexical BM25, Sentence-BERT semantic representation, triplet/LTR training, context ablation, or out-of-domain evaluation.

Therefore the paper remains a baseline design, not validation.

### CSI

The code implements one complement-aware facility-location objective consistent with the 2026 CSI preprint’s framing. The code correctly does not claim the paper’s conditional approximation guarantee.

The preprint remains one research arm and requires stronger baselines and latent-slice experiments.

## Revised gate status

passed[5]:
  namespaced-versioned-symbol-generation
  all-prototype-end-to-end-packing
  broad-source-order-determinism
  mechanical-computed-proposal-coverage-and-duplicate-fixture
  bounded-csi-control-fixture

partial[2]:
  proposal-coverage,"computed but uncalibrated and potentially self-confirming"
  primary-page-vector,"all prototypes preserved; primary alias implicit"

blocked[7]:
  external-context-relevance
  typed-node-paths
  public-employee-interaction
  experiment-safe-distribution
  wasm-runtime-parity-and-safety
  browser-accessibility-performance
  search-and-commercial-field-acceptance

## Required order

```text
P0. primary prototype + compatibility calibration + independent context corpus
P0. typed graph edges and path validation
P1. external relevance benchmark and train/validation/test selection
P1. runtime contracts: public task, resolver identity, Wasm safety, distribution
P1. browser/accessibility proof
P2. ontology/evidence/schema hardening
then first noindex page cohort
then separate field publication
```

## Validation not run in this review

No new browser, Zig, Wasm, Cloudflare, Search Console, Bing, LLM provider, public employee, conversion, or revenue experiment was run.

The latest exact source proof remains workflow run `29576487817` on commit `9ef48b97308e09d5a97f4978820255e3c8b53c7e`.
