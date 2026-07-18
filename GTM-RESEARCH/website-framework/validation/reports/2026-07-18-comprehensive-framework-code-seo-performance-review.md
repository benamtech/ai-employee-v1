# Comprehensive Website-Framework Code, Systems, SEO, and Scale Review

**Date:** 2026-07-18  
**Repository:** `benamtech/ai-employee-v1`  
**Reviewed branch:** `agent/ui-metaprogramming-pass-1`  
**Reviewed head:** `dcc8beded51290f8084a421996c51c18b2afed83`  
**CI authority:** GitHub Actions run `29628832989`  
**Scope:** `GTM-RESEARCH/website-framework/` and `.github/workflows/website-framework-reference.yml`  
**Review mode:** code and architecture review only; no production-readiness claim and no field SEO claim

---

## 1. Executive verdict

The repository now contains a coherent and technically serious **agent-operated ontology-to-site compiler research system**. It is no longer accurately described as only a five-page request-routing prototype. The source-wired front end now models:

```text
business and brand truth
-> agent-generated ontology proposal
-> compiler approval/rejection
-> sparse evidence graph
-> bounded opportunity-region generation
-> sparse corpus selection
-> one page-concept job per selected region
-> second agentic concept stage
-> existing coordinate, context, generation, semantic-IR, UI, and static-emission layers
```

The strongest implemented properties are:

- deterministic, provenance-bearing project, ontology, graph, vector, plan, and build identities;
- explicit rejection ledgers rather than silent deletion;
- hard targeting-safety boundaries before vector construction;
- sparse lexical and graph baselines before HDC/VSA;
- bounded candidate generation instead of an unrestricted Cartesian product;
- an optimized 10,000-region planning path that completes in approximately **5.285 seconds** on the recorded GitHub Actions runner;
- a portable TypeScript semantic oracle and a rational evidence gate for any future Wasm/native acceleration;
- static-first HTML and UI architecture with zero canonical JavaScript as the default;
- explicit separation between research/noindex state and publication.

However, it is **not yet a functioning end-user web framework**, a 10,000-page content generator, or a validated SEO system. The critical missing product path is:

```text
real business/repository ingestion
-> real Stage-1 provider and reviewer workflow
-> independently grounded ontology and observations
-> real Stage-2 provider
-> typed generated-content transaction
-> global corpus quality and contradiction validation
-> static emission at large scale
-> browser/crawler/accessibility validation
-> controlled publication and field measurement
```

The central scientific conclusion is:

> The vector and graph system is justified as a deterministic **control, representation, coverage, and retrieval layer**. It is not evidence by itself that a page should exist, that the page is useful, that Google will index it, or that it will rank or convert.

The central SEO conclusion is stricter:

> Google’s June 2026 guidance explicitly warns against making separate pages for every possible query variation or fan-out query and states that high page quantity does not make a site higher quality. A selected vector region may become an indexable page only when it requires a materially different answer, expert information object, usable task or tool, evidence set, decision path, or local/operational treatment. Attribute novelty alone is insufficient.

The central performance conclusion is:

> Wasm is technically reasonable for a large contiguous numeric kernel, but it is not currently the highest-value optimization. At 10,000 pages, candidate generation, sparse selection, and job-neighbor planning dominate. The additional sampled HRR compilation was under 1% of the recorded total. Algorithmic and data-layout work should remain first; Wasm should be promoted only after an actual 50k/100k profile isolates a sufficiently expensive numeric kernel and a bridge-inclusive benchmark passes parity and end-to-end savings gates.

### Maturity assessment

| Dimension | Current assessment |
|---|---|
| Conceptual architecture | Strong and substantially coherent |
| Deterministic compiler groundwork | Strong research implementation |
| Ontology discovery product workflow | Contract implemented; real provider/reviewer missing |
| Opportunity-space computation | Implemented and synthetic-scale tested |
| Vector-native claim | Partially true; vectors are first-class outputs, but graph/set logic still performs most region creation and selection |
| Agent page generation | Typed state machine implemented; real provider, content schemas, and output transaction missing |
| 10k planning performance | Passed synthetic fixture |
| 10k complete page generation | Not implemented or measured |
| 100k planning/generation | Not tested |
| Static web framework usability | Incomplete; intended front end is not exposed through the current CLI |
| SEO readiness | Research-only/noindex |
| Search or commercial validation | Not established |

---

## 2. Canonical system model

The correct system model is now documented in `CODEGRAPH.md` and source-wired through `reference/src/agent-site-orchestrator.ts`.

### 2.1 User input boundary

The user supplies business truth, not a page matrix:

- purpose, products, services, offers, prices, constraints, proof, and locations;
- current ICP and known customer situations;
- business workflows and integrations;
- brand voice, design rules, assets, browser/deployment constraints;
- existing customer, market, company, repository, and field sources;
- outcome and publication-risk requirements.

`reference/src/project-input.ts` correctly makes these inputs typed, versioned, hashable, and bounded. The addition of `minimumInitialPages` and `maximumInitialPages` makes the one-shot site-generation goal explicit, but the meaning of the minimum requires correction later in this report.

### 2.2 Stage 1: agent ontology proposal

`reference/src/ontology-discovery.ts` defines:

- `AgentOntologyProposal`;
- proposed attributes, dimensions, relations, observations, sources, and evidence;
- sensitivity and public-targeting state;
- material page effects;
- confidence and reviewer approval;
- accepted and rejected ledgers.

This matches the intended product: the user does not need to know every axis or prospect combination before running the framework.

### 2.3 Compiler-governed opportunity space

The current production path is:

- `ontology-discovery.ts` — proposal approval and sparse lexical duplicate baseline;
- `ontology-graph.ts` — explicit, co-occurrence, and lexical graph channels plus hard constraints and pruning;
- `opportunity-space.ts` — transparent reference itemset and region implementation;
- `opportunity-generation-optimized.ts` — cached constrained candidate expansion;
- `opportunity-space-optimized.ts` — sparse concave coverage and packed HRR vectors;
- `opportunity-space-production.ts` — production composition;
- `site-program-optimized.ts` — bounded nearby-region context and deterministic job batches.

This is a valid compiler decomposition. It also reveals an important precision point: the implementation is presently **graph-and-sparse-set-led with an HDC/VSA representation layer**, not an HRR algorithm that independently discovers the page space.

### 2.4 Stage 2: page-concept generation

`reference/src/site-program.ts` defines one `PageConceptJob` per selected region and validates agent-returned `PageConceptProposal` objects before producing `CandidatePageSeed` objects.

That is the correct location for an agent to decide:

- the real canonical question;
- specific intent and decision stage;
- information object or public AI Employee task;
- route and conversion path;
- semantic module requirements;
- UI capability requirements;
- typed graph role.

### 2.5 Existing downstream compiler

The older but useful downstream path remains:

- independent `ContextCorpus`;
- train/validation/test splits;
- calibrated context compatibility;
- explicit-primary page coordinates;
- finite corpus selection;
- typed graph;
- `PageGenerationJob` state machine;
- `SiteSource` and `PageIR`;
- packed vectors and CSR graph;
- static HTML, metadata, schema, sitemap, instruction projection, and UI.

The architecture is correct in preserving this layer instead of replacing it with direct agent-authored HTML.

---

## 3. Exact current validation reality

The reviewed CI run passed:

```text
46 tests
46 pass
0 fail
strict TypeScript build: pass
manifest emission: pass
UI emission: pass
orchestration emission: pass
framework validate/preview: pass
browser-target resolution: pass
R3F package build: pass
artifact upload: pass
```

The 10,000-page synthetic production profile recorded:

```text
candidate regions             15,000
selected page regions         10,000
Stage-2 batches                  400
packed-vector bytes        2,560,000
vector dimensions                 64
recorded total             5,284.510 ms
```

Stage profile:

| Stage | Time | Share of recorded total |
|---|---:|---:|
| Project normalization | 0.126 ms | ~0.00% |
| Ontology approval | 20.363 ms | ~0.39% |
| Graph compilation | 36.644 ms | ~0.69% |
| Closed itemsets | 202.478 ms | ~3.83% |
| Candidate generation | 2,218.216 ms | ~41.98% |
| Sparse selection | 1,784.044 ms | ~33.76% |
| Site-program planning | 973.168 ms | ~18.42% |
| Additional 1,000-vector HRR sample | 49.358 ms | ~0.93% |

The transparent pre-optimization path was approximately 29 seconds on the same workflow class. The optimized candidate generator has an ordered region-hash parity test against the baseline on the adversarial fixture.

### What this proves

- the selected algorithms can produce and pack 10,000 synthetic regions within the current 30-second planning budget;
- the implementation no longer has an obvious global O(n²) neighbor-planning bottleneck in the tested path;
- TypeScript/V8 is sufficient for the current 10k compiler fixture;
- vector packing is not currently the dominant cost;
- deterministic contracts and rejection behavior work on the supplied fixtures.

### What this does not prove

- a real business will produce 10,000 useful eligible regions;
- the first ontology agent can produce a trustworthy ontology;
- 10,000 pieces of content can be generated at acceptable cost or quality;
- the selected regions represent actual search demand or customer needs;
- the pages are unique after prose generation;
- the emitted site is crawlable, accessible, fast, and maintainable at 10k;
- 100k planning is linear or fits memory;
- Google will crawl, index, rank, cite, or convert the pages;
- a Wasm or native implementation is unnecessary at larger scales.

---

## 4. High-level architecture findings

## 4.1 Strength: correct two-agent-stage separation

`reference/src/agent-site-orchestrator.ts` hard-gates:

```text
ProjectInput
-> ApprovedOntology
-> CompiledOntologyGraph
-> ProductionOpportunitySpace
-> SiteGenerationPlan
```

`compileAgentSiteProgram()` then accepts Stage-2 proposals and compiles seeds. This is a strong separation of concerns. The first agent discovers the conceptual space; the second agent turns selected regions into page concepts.

**Pass vector**

- user does not hand-author the final matrix;
- ontology and pages are distinct checkpoints;
- rejected ontology and page state remains inspectable;
- vector-space and site-plan hashes can be reproduced;
- no direct publication occurs.

**Fail vector**

- Stage 1 and Stage 2 use the same unconstrained conversation as authority;
- a page agent can add undeclared attributes;
- pages bypass the vector/region compiler;
- the first agent’s ontology is accepted because it is syntactically valid rather than externally grounded.

**Status:** architectural pass, product integration pending.

## 4.2 P0 gap: the intended front end is not the operator front end

The current operator CLI, `reference/scripts/framework-cli.mjs`, imports and executes `prepareFrameworkProject()`, which expects a supplied context corpus, calibration observations, and `CandidatePageSeed[]` objects. It does not call `prepareAgentSiteProgram()`.

The `package.json` commands and CI emissions also run the older manifest/orchestration fixture. Therefore, the framework’s intended workflow is currently available as source APIs and tests, not as the normal agent/developer command path.

This is the single clearest reason the repository still does not feel like a web framework.

**Required correction**

Create one authoritative operator path such as:

```text
framework init
framework inspect
framework discover-ontology
framework review-ontology
framework construct-space
framework plan-site
framework generate-concepts
framework generate-pages
framework validate-corpus
framework preview
framework emit
framework publish
```

The old calibrated reference path should become a validation/evaluation subsystem invoked by the new path, not a competing entry point.

## 4.3 P0 gap: no successful agent-output transaction

`reference/src/page-generation.ts` can run ordered passes and record arbitrary `artifacts`, but successful outputs are not converted into:

- typed evidence and claim records;
- real information objects;
- semantic modules;
- public AI Employee task contracts;
- `SiteSource` pages;
- canonical `PageIR`;
- emitted site files.

The current compilation chain therefore ends before the most important product action.

A complete transaction must be atomic and fail closed:

```text
GenerationRunResult
-> validate typed pass artifacts
-> resolve and freeze citations/evidence
-> construct semantic modules and task contracts
-> run page-local validators
-> run corpus-global validators
-> write SiteSource delta
-> recompile complete PageIR/vector/graph/UI state
-> emit noindex fixture
```

No page should be considered generated merely because all executor passes returned `status: pass`.

## 4.4 P0 gap: two corpus-selection authorities are not yet unified

There are two meaningful selectors:

1. `selectOpportunityRegionsIncremental()` chooses a large sparse region corpus using node/pair/effect/community coverage.
2. `selectCorpusPlan()` chooses page coordinates using an independently judged context corpus, isotonic compatibility, information objects, rare-tail groups, and optional diversity.

The first can scale to 10k. The second has the stronger external-validation model but includes matrices that do not scale to a very large candidate corpus.

The architecture needs a hierarchical merge:

```text
large sparse opportunity selector
-> 10k-100k structurally eligible regions
-> independently judged context and demand evaluation by family/slice
-> page-family budgets and publication cohorts
-> final page acceptance
```

Do not run the dense `coordinate x coordinate` kernel from `corpus-plan.ts` over 100k candidates. Do not discard the independent context corpus merely because it is slower. Use it to calibrate families, thresholds, and sampled/blocked holdouts.

## 4.5 Strength: publication remains a separate gate

`site-manifest.yaml` is still `production_ready: false`; current profiles are noindex; `field-candidate` is empty. `PageGenerationJob.publicationGate` is `research`. This is scientifically and operationally correct.

---

## 5. Low-level code review by subsystem

## 5.1 Project intake and ledgers

**Sources:** `reference/src/project-input.ts`, `reference/src/validation-contracts.ts`

### Good

- canonical sorting and hashing;
- unique source and asset IDs;
- explicit confidence, applicability, rights, and retrieval dates;
- browser, deployment, accessibility, and performance budgets;
- hard/soft validation semantics;
- page-count bounds represented as project truth.

### Risks

1. **A minimum page count is currently treated as a hard selection quota.**
   This is dangerous when the business does not actually contain that many useful distinct page opportunities.

2. Missing information such as pricing/proof is recorded but can remain outside the hard pass depending on the exact project fixture.

3. Evidence ledger records currently inherit one summary per project source. Real generation requires claim-level excerpts, location/range pointers, freshness, jurisdiction, and contradiction state.

### Required pass vector

- a requested 10k target may cause the run to fail with “insufficient qualified regions”; it may never lower the usefulness threshold;
- each generated factual claim resolves to a specific evidence span or structured fact, not just a source ID;
- material contradictions prevent downstream concept generation.

## 5.2 Stage-1 ontology discovery

**Source:** `reference/src/ontology-discovery.ts`

### Good

- agent proposal is typed and versioned;
- source/evidence references must resolve;
- exact duplicates retain the stronger supported candidate;
- lexical duplicate detection is label-gated after a real fixture exposed boilerplate-collapse behavior;
- protected, private, and inferred-sensitive values are prohibited;
- demographic/lifestyle values require review and at least two material effects;
- invalid relations and observations are retained as rejected records.

These are exactly the kinds of guardrails supported by recent LLM ontology-engineering research: LLMs are useful auxiliary ontology engineers, but accepted 2025–2026 studies repeatedly emphasize variability, structural mistakes, expert evaluation, competency questions, standardized benchmarks, and hybrid human/compiler workflows.

### Critical semantic weakness

`materialEffects` and `confidence` are agent-supplied declarations. The compiler verifies cardinality and thresholds, not whether the attribute truly changes the page.

An agent can propose:

```text
attribute: dog owner
materialEffects: [vocabulary, ui]
confidence: 0.9
reviewerApproved: true
```

and pass the structural gate even if no evidence shows that dog ownership changes the correct estimate workflow, offer, proof, utility, or conversion path.

### Marketing and safety rule

Attributes like marital status, age, music preference, pet ownership, or homeownership should normally **not** create canonical pages. They may inform examples or creative variants only when:

- they are self-declared or derived from legitimate aggregate research;
- they are legally and ethically acceptable;
- they materially change the task, constraints, answer, utility, or decision;
- they do not imply covert visitor profiling;
- a non-personal problem/workflow page cannot satisfy the need just as well.

The framework should favor explicit operational dimensions:

```text
industry
job role
business size
workflow state
problem
software/integration
constraint
location when legally/operationally material
urgency
proof requirement
buyer stage
requested task
```

### Required improvement

Add ontology competency questions and counterfactual materiality tests:

```text
If this attribute is removed, which facts, steps, evidence, tool behavior,
conversion path, or UI requirements must change?
```

If the answer is “only wording, imagery, or empathy framing,” the attribute should not create a canonical page axis.

## 5.3 Sparse lexical baseline

**Source:** `reference/src/sparse-lexical.ts`

### Good

- deterministic tokenization;
- TF-IDF cosine and BM25;
- postings-based local neighbors;
- a transparent baseline against which embeddings can be tested;
- source-order determinism.

### Limits

- no stemming, lemmatization, phrase modeling, abbreviations, ontology aliases, multilingual handling, or domain synonym dictionary;
- no field weighting despite an unused-looking `fieldWeights` input shape;
- high lexical overlap is not semantic identity;
- low lexical overlap is not semantic distinctness.

**Disposition:** retain as baseline and candidate-generation aid. Add learned embeddings only as a comparison arm with labeled relevance and deterministic fallback.

## 5.4 Ontology graph

**Source:** `reference/src/ontology-graph.ts`

### Good

- explicit, co-occurrence, and lexical channels are distinguishable;
- hard `requires`/`excludes` constraints are separated from positive similarity;
- noisy agent suggestions can be pruned;
- business anchors survive k-core pruning;
- connected components are presented as macro-regions, not semantic truth.

### Risks

1. Relation weights are not calibrated. A `0.8` explicit edge, a co-occurrence Jaccard value, and a lexical cosine are combined as if comparable.
2. Connected components can create one giant component through weak bridges.
3. K-core may eliminate legitimate low-frequency tail nodes; anchor retention does not protect non-anchor but strategically important tail values.
4. Observation co-occurrence from agent-generated observations can become circular evidence.
5. There is no random-graph/null-model significance control.

### Leiden research disposition

Leiden is a legitimate comparison algorithm because it guarantees connected communities and improves on Louvain. It does **not** prove that a detected community is a valid customer segment or page family. Community optimization can also find apparent structure in random graphs, and its resolution parameter materially changes the output.

Use Leiden only if it beats deterministic components/k-core on predeclared metrics:

- held-out context compatibility;
- expert segment coherence;
- stable partitions under edge perturbation;
- useful tail retention;
- outlier rejection;
- downstream page-family quality.

## 5.5 Closed-itemset seeds

**Source:** `reference/src/opportunity-space.ts`, `mineFrequentClosedItemsets()`

### Correct idea

Observed object-attribute conjunctions are a much better starting point than a Cartesian product.

### Performance defect at larger observation width

The implementation enumerates all combinations from width 1 through `maximumWidth` for every observation, then performs a pairwise closure filter over frequent sets.

For an observation with `n` attributes and maximum width `k`, the enumeration is proportional to:

```text
sum(C(n, i), i=1..k)
```

This is harmless in the current narrow synthetic fixture but can explode for rich business/customer observations. The final closure filter is also quadratic in the number of frequent sets.

### Required correction before 100k

- enforce a maximum accepted observation width or split observations into typed subrecords;
- replace exhaustive combination generation with a real vertical miner such as Eclat/CHARM or another bounded closed/maximal itemset algorithm;
- use minimum support by source class, not only aggregate weight;
- distinguish observed closed sets from agent-hypothesized expansions;
- benchmark adversarial broad observations.

## 5.6 Opportunity candidate generation

**Source:** `reference/src/opportunity-generation-optimized.ts`

### Good

- best-first bounded exploration;
- one value per dimension;
- graph-neighbor expansion rather than global Cartesian generation;
- cached summaries, observation postings, active-node sets, and constraint maps;
- candidate cap;
- exact parity with the transparent baseline on the current fixture.

### P0/P1 correctness defect: `requires` is evaluated too early

`violatesConstraints()` rejects a partial state whenever a required attribute is not already present. That means a node with a requirement cannot normally be added first and have the required node added in a later expansion. Valid pairs may only survive when both already appear in a seed.

Correct semantics should be one of:

- add a requiring node and its transitive requirements atomically;
- allow incomplete requirements during exploration and enforce them at eligibility/materialization;
- represent pending requirements in search state and prioritize satisfying them.

### Candidate recall is unmeasured

The generator stops when `maximumCandidateRegions` is reached and expands only the top `neighborExpansionLimit` candidates per state. The result is deterministic, but it is not complete and has no recall estimate.

Add:

- small-ontology exhaustive oracle comparisons;
- beam/cap sensitivity curves;
- seed-reordering and graph-perturbation stability;
- hidden useful-region recall;
- candidate saturation diagnostics.

### Unobserved combinations can pass

Eligibility currently requires anchors, material effects, coherence, and evidence IDs, but not positive observation support. This is acceptable for hypothesis generation only. Such regions should carry an explicit state:

```text
observed
inferred-from-supported-edges
agent-hypothesized
```

Publication thresholds should be stricter for inferred/hypothesized regions.

### Coherence model limitation

Coherence is the mean weight of all attribute pairs. This is simple and interpretable, but it can:

- penalize valid star-shaped structures;
- reward dense generic hubs;
- average away one severe incompatibility if not encoded as a hard constraint;
- depend on incomparable edge-channel scales.

Compare against minimum spanning connectivity, anchor-conditioned coherence, typed path requirements, and calibrated edge-channel models.

## 5.7 Sparse selection and HRR representation

**Source:** `reference/src/opportunity-space-optimized.ts`

### Good

- lazy greedy uses stale gains as upper bounds for a monotone concave-over-modular objective;
- universal features receive near-zero discriminative weight;
- selection uses sparse coverage keys rather than a dense candidate matrix;
- selected region vectors are compiled once and packed in `Float32Array`;
- vector parity is checked;
- the original transparent selector remains an oracle.

### P0 SEO defect: the minimum quota precedes the marginal-quality floor

The code applies `minimumMarginalGain` only after `selected.length >= minimumSelected`.

Therefore, if the project declares a 10,000-page minimum, the selector attempts to fill 10,000 slots before the marginal-gain floor can reject weak remaining candidates.

This makes page count override quality, which is exactly the opposite of current Google guidance.

**Required semantic change**

Treat page counts as:

- `targetPages` — desired capacity planning;
- `maximumPages` — hard upper bound;
- `minimumQualifiedPages` — optional business viability threshold that causes the whole run to fail if not met.

Every page must pass the marginal floor independently. Failure to reach the target should produce:

```text
INSUFFICIENT_QUALIFIED_REGIONS
```

not weaker pages.

### The current novelty gate is often exact-only

The code switches to exact-signature duplicate lookup when:

```text
duplicateJaccardThreshold > (maximumRegionWidth - 1) / maximumRegionWidth
```

With width 7 and thresholds around 0.88–0.98, regions that differ by one attribute can avoid vector comparison entirely. This is efficient, but it weakens the claim that HRR is enforcing semantic nonredundancy.

At current defaults, HRR is primarily:

- a fixed-width structured representation;
- a packed downstream artifact;
- an exact or very-high-overlap duplicate confirmation mechanism.

It is not the main candidate discovery or novelty engine.

### Required novelty stack

Use a tiered local process:

1. exact signature;
2. high-overlap set/Jaccard candidates from postings;
3. HRR structural similarity;
4. lexical/semantic page-concept similarity after Stage 2;
5. generated-content similarity after content creation;
6. same-answer/same-utility consolidation test.

An ANN index may become useful at 100k after measured need, but a sparse postings candidate set should remain the deterministic baseline.

### CSI disposition

The 2026 Complement Submodular Information paper is relevant to balanced head/tail selection and isolated-outlier suppression. It is a new preprint, and CSI objectives are generally non-monotone; its near-`1 - 1/e` result depends on bounded-curvature approximate monotonicity.

The current selector is concave feature coverage, not CSI. It must not inherit CSI guarantees by association.

Use CSI as a controlled comparison arm for:

- page-family train/validation/test splits;
- representative human-review samples;
- publication cohorts;
- rare coherent slice retention.

## 5.8 Page-neighbor planning

**Source:** `reference/src/site-program-optimized.ts`

### Good

- inverted coverage postings;
- common postings are skipped when rarer keys exist;
- per-page candidate budget;
- neighbor results are explicitly advisory;
- deterministic batching.

### Limits

- no neighbor recall metric;
- first bounded candidates can depend on lexicographic posting order;
- shared coverage-key count and attribute Jaccard do not guarantee same query/answer competition;
- page-family and crawl-architecture needs differ from cannibalization-neighbor needs.

Use separate graphs:

```text
semantic-cannibalization graph
editorial related-content graph
crawl/hub hierarchy graph
conversion journey graph
utility/task dependency graph
```

## 5.9 Stage-2 page concepts

**Source:** `reference/src/site-program.ts`

### Good

- page concept is bound to a region and region hash;
- question, intent, evidence, route, information/utility, conversion, module, layout, capability, and graph fields are required;
- all jobs must return a proposal;
- duplicate IDs, routes, and exact normalized questions fail;
- undeclared source/evidence IDs fail;
- accepted proposals produce explicit-primary prototypes.

### P0 semantic-validation gap

`expressedAttributeIds` is self-reported by the agent. The compiler does not inspect the proposed content because the proposal does not contain the actual argument, information-object body, task schema, module bodies, or claim bindings.

Likewise, a unique `informationObjectId` proves only that the string is unique, not that the object is informative or different.

The current fixture can generate:

```text
information:${regionId}
task:${regionId}
```

for every region and pass distinctness structurally.

### Provenance loss

`proposalToSeed()` assigns `proposal.sourceIds[0]` as the source of every generated feature atom, instead of preserving each ontology attribute’s original source/evidence lineage.

### Overly strict downstream eligibility

The generated seed requires every page-job dimension to match a context exactly. This can make independently collected context cases ineligible unless they express every fine-grained dimension. Required dimensions should be separated into:

- hard identity dimensions;
- soft contextual dimensions;
- generation-only creative attributes;
- prohibited publication split dimensions.

### Required Stage-2 schema

A real proposal should include at minimum:

```text
canonical question
search/task intent
one-sentence unique answer thesis
why this cannot be merged into each nearest page
information object schema + body/source plan
public task/tool contract when applicable
claim-evidence bindings
module-level argument plan
explicit changed-by-attribute map
target audience and non-target audience
conversion and follow-up path
route/title/meta candidates
internal graph role
UI capability plan
```

The compiler should calculate semantic expression from these artifacts rather than trust declared IDs.

## 5.10 Context corpus and calibrated compatibility

**Sources:** `reference/src/context-corpus.ts`, `reference/src/page-coordinate.ts`, `reference/src/corpus-plan.ts`

### Good

- separate source provenance and assessor IDs;
- generator-authored acceptance cases can be rejected;
- deterministic train/validation/test splits;
- hidden-slice counts and split hashes;
- graded judgments and disagreement;
- train-only isotonic fit;
- validation and test Brier/MAE/ECE;
- ineligible score is exactly zero;
- explicit primary and multi-prototype support;
- context-fit vectors provide a meaningful page-to-page similarity surface.

This layer aligns well with Kong et al. (2023): document-to-context compatibility is distinct from query-document relevance, explicit cohort context can be modeled, and lexical and semantic context signals can be evaluated together.

### Limitations

- fixed label targets `1, 0.75, 0.35, 0` are a policy choice, not learned truth;
- no minimum sample count or uncertainty interval is required;
- ten-bin ECE is unstable on tiny corpora;
- “calibratedProbability” can overstate what small synthetic calibration establishes;
- current real proof corpus remains synthetic;
- `corpus-plan.ts` forms a dense coordinate-similarity kernel when diversity is enabled, unsuitable for a huge corpus.

Rename or qualify probability until sufficient data exists, for example `calibratedRelevanceScore`.

## 5.11 Agent generation runner

**Sources:** `reference/src/page-generation.ts`, `reference/src/framework-orchestrator.ts`

### Good

- typed job boundary;
- explicit source, evidence, claim, module, graph, design, asset, and conversion context;
- noindex research default;
- ordered state machine;
- bounded repair attempts;
- deterministic outputs and checkpoint hashes;
- undeclared sources and validation attributes fail.

### P0 scale gap: execution is sequential

`executeFrameworkProject()` loops through jobs sequentially. `runPageGenerationJob()` loops through seven passes sequentially for each job.

A literal remote-provider mapping implies up to:

```text
10,000 pages x 7 passes = 70,000 primary executions
100,000 pages x 7 passes = 700,000 primary executions
```

before repairs.

This is not economically or operationally acceptable as the default.

### P0 validation gap: pass artifacts are untyped

`AgentPassOutput.artifacts` is `Record<string, unknown>`. Validation checks the pass name, summary, findings, source IDs, and validation attribute IDs, but not the pass-specific artifact schema.

An executor can return a generic object with a `pass` finding and satisfy the state machine.

### Required generation architecture

Use a hierarchy of shared and page-local work:

1. **Research packs by page family** — one high-quality research artifact shared by hundreds of pages.
2. **Concept batches** — generate and criticize 25–100 structured concepts per call.
3. **Page-generation bundles** — usually one primary content call plus deterministic local validation; use a second model call only for failed/high-risk pages.
4. **Utility/task templates** — compile common tools from typed task families rather than regenerate code for every page.
5. **Corpus-global critics** — operate on embeddings, fingerprints, claims, titles, and summaries in batches.
6. **Risk-based human review** — review high-value, high-risk, sensitive, or weakly evidenced pages plus statistically valid samples.

Add:

- concurrency and provider rate limits;
- token/cost budgets by stage and page family;
- resumable queues and idempotent job claims;
- dead-letter state;
- provider/model/prompt/tool version provenance;
- deterministic artifact schemas per pass;
- partial reruns based on dependencies;
- cancellation and budget exhaustion behavior.

## 5.12 Hyper-aware agent context

**Source:** `reference/src/agent-harness.ts`

### Good

- agent receives vector namespace/version/hash;
- prototypes are projected as typed atoms;
- nearest pages, information objects, design capabilities, and generation rules are available;
- the agent does not need raw packed bytes.

### Scale defect

The current manifest context builder compares each selected page with every other page to find nearest pages. This is O(n²) and is not the same bounded sparse neighbor path used by the new 10k planner.

### Product mismatch

The harness reads the existing compiled manifest, not `SiteGenerationPlan` and `PageConceptJob` objects from the new Stage-1 front end.

### Correct agent interface

The specialized skill should expose tools such as:

```text
get_project_truth()
get_region(region_id)
explain_region(region_id)
get_region_neighbors(region_id)
get_attribute_provenance(attribute_id)
get_evidence(evidence_id)
get_page_family_context(family_id)
compare_page_concepts(page_a, page_b)
validate_concept(proposal)
submit_concept(proposal)
get_generation_job(page_id)
validate_page_artifact(page_id)
```

The agent should receive compact semantic projections, not random HRR coordinates. LLMs understand natural-language/structured relationships; they do not natively interpret the meaning of arbitrary namespaced random hypervector dimensions.

## 5.13 Semantic compiler and packed IR

**Source:** `reference/src/framework.ts`

### Good

- evidence levels bound claims;
- semantic modules and information objects precede rendering;
- explicit primary/multiple prototypes are retained;
- packed page/prototype vectors and CSR link graph;
- static complete HTML;
- canonical, robots, title, description, schema, sitemap;
- dependency index and build hash;
- design-system satisfiability contract.

### P0 large-site technical SEO gaps

1. `renderSitemap()` emits one sitemap. A single sitemap is limited to 50,000 URLs and 50 MB uncompressed. A 100k site requires sitemap shards and a sitemap index.
2. There is no crawl-depth or orphan simulation.
3. There are no deterministic hubs, breadcrumbs, taxonomy landing pages, or section navigation requirements.
4. There is no title/meta/H1/content duplicate detector at emitted-corpus scale.
5. Generic `WebPage` plus `Question` structured data does not guarantee rich-result eligibility and must match visible content.
6. There is no structured-data policy by page/task type or validation against Google’s specific feature rules.
7. There is no robots.txt emission or publication cohort routing.
8. There is no canonical-cluster audit or redirect/tombstone strategy.
9. Visible authorship, review, sourcing, and automation context are not first-class IR fields.
10. `use.md`/instruction projections may help agents, but Google’s June 2026 guide explicitly says unnecessary AI text files and “chunking” tactics are not required for Google Search.

## 5.14 UI metaprogramming and renderer

**Sources:** `reference/src/ui-metaprogramming.ts`, `reference/src/ui-renderer.ts`

### Good

- browser-tier-aware standard;
- semantic modules map to a finite component vocabulary;
- static canonical pages require zero JavaScript;
- critical CSS budget enforced;
- light-only AMTECH design contract is preserved;
- container queries, guarded OKLCH, reduced-motion requirements, and optional bounded 3D scene contract;
- stable page/plan/site hashes.

### Limits

- archetype and density selection are shallow heuristics;
- current CI does not run axe, Playwright, screenshots, visual regression, Lighthouse, or real Core Web Vitals;
- `content-visibility: auto` and intrinsic sizing need browser/accessibility/find-in-page validation;
- optional R3F build success is not a field performance result;
- at 10k pages, CSS is shared but HTML/media variation and image pipelines are unmeasured;
- the new generated page program is not transacted into this UI system.

Three.js/R3F should remain progressive enhancement for pages where an interactive diagram materially improves comprehension. It should never become a default novelty layer.

## 5.15 Documentation and authority drift

`CODEGRAPH.md` is substantially current. `README.md`, the CLI help, and parts of `site-manifest.yaml` still describe the earlier path in which context cases and candidate seeds are supplied manually.

The manifest also declares a fixed set of axes even though the intended Stage-1 system discovers the ontology and dimensions. This can be reconciled by treating the manifest as a compiled downstream artifact, not the initial user-authored input.

Required authority order:

```text
ProjectInput
-> reviewed ApprovedOntology
-> compiled dimensions/atoms/constraints
-> selected regions
-> page concept and generation artifacts
-> compiled unified manifest
-> SiteSource/PageIR/UI/emissions
```

---

## 6. Performance and scaling review

## 6.1 10k result is credible for planning, not generation

The current 5.285-second CI result is meaningful. It demonstrates that the graph/set/vector planning pipeline is not inherently too expensive for 10k.

The result is also favorable:

- only 15k candidates are produced for 10k selections;
- the synthetic ontology has regular dimensions and dense compatibility;
- observations and descriptions are small;
- no real LLM calls, content, media, browser checks, filesystem emission, or network operations occur;
- peak memory/RSS and allocation counts are not recorded;
- only one scale and one runner execution are reported.

## 6.2 100k memory is dominated by objects, not packed vectors

At 64 `Float32` dimensions:

```text
10k vectors   = 2.56 MB
100k vectors  = 25.6 MB
```

The packed vectors are not concerning. The larger risks are:

- candidate and region objects;
- repeated string arrays and coverage keys;
- rejected-reason records;
- full attribute labels/descriptions duplicated into every `PageConceptJob`;
- JSON canonicalization and hashing;
- generated text and semantic module objects;
- filesystem metadata and sitemap/link artifacts.

`PageConceptJob` should become dictionary-backed at scale:

```text
shared ontology dictionary
shared evidence/source dictionary
shared page-family research packs
compact job row of integer/string IDs
separate on-demand human-readable projection
```

## 6.3 Required scale benchmark suite

Run at:

```text
10k, 25k, 50k, 100k selected pages
candidate ratios: 1.5x, 3x, 10x
narrow and broad observations
sparse, giant-component, bridge-heavy, and disconnected graphs
head-heavy, coherent-tail, and isolated-outlier datasets
```

Measure:

- wall-clock p50/p95 over at least 10 warmed runs;
- CPU model, Node/V8 version, runner image;
- peak RSS and heap;
- GC time;
- candidate generation count and cap saturation;
- selected/rejected reason distribution;
- hash parity;
- itemset count;
- postings visited per neighbor query;
- vector bytes;
- plan JSON and compact-binary bytes;
- filesystem emission time and bytes;
- agent projected token count;
- provider calls, retries, cost, and throughput;
- page and corpus validation time.

## 6.4 Wasm/native disposition

### Why Wasm is reasonable in principle

HDC/VSA binding, bundling, normalization, dot products, batched cosine, and packed-vector operations are contiguous numerical workloads that can benefit from low-level vectorization. WebAssembly is a safe, portable low-level format, and standardized SIMD exists.

### Why it should not be the framework substrate now

The measured pipeline is dominated by:

- heaps;
- maps and sets;
- string IDs and hashes;
- graph traversal;
- sparse postings;
- object construction;
- candidate and job orchestration.

Porting these object-heavy stages across a JS/Wasm boundary would add a second memory model and serialization/ABI complexity without correcting algorithmic complexity.

### Promotion criteria

Retain the current `acceleration-decision.ts` approach, but profile the exact current head at 50k/100k. Promote a kernel only when:

- it is isolated as contiguous typed arrays;
- it is a material share of total time and exceeds an absolute duration floor;
- 20+ repeated runs include startup, allocation, copying, and bridge costs;
- selection hashes are exact;
- vector parity passes;
- total build savings are material;
- TypeScript remains the full oracle and fallback.

Because this is primarily a Node one-shot compiler, compare three options rather than assuming Wasm:

```text
optimized TypeScript/V8
Wasm SIMD kernel
native Rust/Zig CLI or Node addon
```

Choose based on end-to-end build economics, portability, deployment, and maintenance—not ideology.

---

## 7. The 10k–100k agent-generation architecture that is actually viable

## 7.1 Do not execute seven remote calls per page

The existing pass taxonomy is valuable as a validation model, but not every pass should be a remote LLM invocation.

Recommended execution model:

### Site-level shared work

- business/source normalization;
- ontology proposal and criticism;
- customer-language and demand research;
- page-family definitions;
- evidence packs;
- design system and UI family plans;
- common task/tool families;
- crawl and conversion architecture.

### Family-level shared work

- one research dossier per industry/problem/workflow/integration cluster;
- shared claims and citations;
- shared workflow truth;
- source excerpts;
- forbidden claims;
- page-differentiation matrix;
- reusable utility/task implementation.

### Batched page-concept work

Generate 25–100 structured concepts in one model call with:

- region IDs and semantic projections;
- nearest concepts;
- required differences;
- merge recommendations;
- evidence and utility requirements.

### Page-local work

Usually:

```text
one generation call
-> deterministic validators
-> optional repair call only on failure
```

### Corpus-global work

- title/meta/question clustering;
- sentence/paragraph fingerprints;
- semantic embedding similarity;
- claim consistency and contradiction graph;
- utility/task uniqueness;
- same-answer consolidation;
- link and crawl validation;
- sampled independent review.

## 7.2 Specialized skill requirements

The coding-agent skill should define:

- exact command sequence;
- typed input/output JSON schemas;
- source-reading and citation rules;
- ontology competency-question protocol;
- materiality counterfactual;
- sensitive-attribute policy;
- evidence/claim thresholds;
- information-gain rubric;
- page merge/split rubric;
- task/utility rubric;
- direct-usefulness test;
- SEO spam-risk test;
- UI module and design-capability contract;
- per-stage token and cost budgets;
- checkpoint/resume protocol;
- failure and human-review escalation.

It should never contain a directive equivalent to “make every vector combination a page.”

## 7.3 Generation acceptance rubric

Every page should answer:

1. What real user task, decision, or problem is this page for?
2. Which evidence shows that context exists?
3. What material information changes because of this region?
4. What does this page contain that its nearest pages do not?
5. Can a user complete a useful task or make a better decision here?
6. Why can this not be merged into an existing page?
7. Are the claims sourced and bounded?
8. Does the page show expert or first-hand operational knowledge?
9. Is the route crawlable and the page reachable from a coherent hub?
10. Would the page still be worth publishing if search engines did not exist?

A “no” on questions 3–6 or 10 is normally a page rejection or merge.

---

## 8. Modern SEO and applied-marketing research disposition

## 8.1 Google’s 2026 guidance directly limits the corpus strategy

Google’s current official guidance states:

- generative AI is useful for research and adding structure;
- many generated pages without user value can violate scaled-content-abuse policy;
- content should be accurate, high quality, relevant, and technically clear;
- successful content should be non-commodity and bring unique expert or experienced insight;
- making separate pages for every query variation/fan-out primarily to influence rankings or AI responses is ineffective and can violate policy;
- high page quantity does not make a site higher quality;
- indexing and serving are not guaranteed;
- unnecessary AI text files and “chunking” tactics are not required for Google;
- agentic experiences are emerging and may be useful when they provide real functionality.

This means the framework’s public value cannot be “100,000 combinations.” Its value must be:

```text
finding the finite set of contexts where AMTECH can provide a genuinely
more useful answer, proof object, workflow, calculator, or public AI Employee
than a generic page can provide
```

## 8.2 Vector-region novelty is not information gain

A region can be mathematically unique while producing the same answer.

Example:

```text
painting contractor + homeowner + dog owner + married
painting contractor + renter + cat owner + divorced
```

If both pages give the same estimate-creation workflow, the personal attributes do not justify separate pages. They are likely search-first segmentation and could be perceived as invasive or nonsensical.

Better coordinates are:

```text
painting contractor
+ exterior repaint
+ incomplete field notes
+ estimate due tonight
+ owner approval required
+ QuickBooks handoff
+ customer-ready scope and exclusions
```

Those dimensions can change the workflow, evidence, examples, task contract, and resulting page.

## 8.3 Zero-volume targets

Low- or zero-reported-volume queries can represent valuable unmet needs. They are not automatically uncontested “knowledge-graph anchors,” and their pages do not automatically aggregate authority to head terms.

Require:

- evidence from customer calls, CRM, sales objections, support tickets, community questions, field data, or task logs;
- a useful information object or tool;
- coherent internal architecture;
- downstream business value;
- field measurement.

## 8.4 Internal links

Typed internal links are useful for discovery, context, and user journeys. There is no support for the simplified claim that Google exposes one internal connectedness score that can be optimized by merely adding edges.

At scale, internal links should be based on:

- parent/child taxonomy;
- task sequence;
- alternative/comparison;
- prerequisite;
- evidence/source relationship;
- conversion journey;
- genuinely related questions.

## 8.5 No fixed 90-day remapping law

There is no reliable general rule that a site-wide information-profile change causes a 90-day global coordinate remapping. Crawl, indexing, ranking, and evaluation timing vary by site, URL, quality, demand, change rate, and systems. Use 30/60/90/180-day reporting windows as an experiment design choice, not as a claimed search-engine mechanism.

## 8.6 Applied marketing science

Modern segmentation literature can support sparse, multidimensional segmentation when dimensions are grounded in observed survey, behavioral, transaction, CRM, or platform data and validated for actionability.

It does not support fabricating hundreds of psychographic/demographic combinations and treating them as market truth.

Recommended evidence hierarchy for ontology attributes:

1. customer and workflow facts;
2. CRM/support/sales/task observations;
3. independently gathered search/community/customer language;
4. aggregate market research;
5. agent hypotheses awaiting review;
6. prohibited inferred/private attributes.

---

## 9. Comprehensive validation/pass/fail matrix

| Feature or workflow | Validation vector | Pass vector | Fail vector | Current disposition |
|---|---|---|---|---|
| Business intake | version, sources, offers, constraints, outcomes | stable project hash and complete ledgers | prompt-only truth | Source-wired |
| Stage-1 ontology agent | provider/prompt/source/model/version | proposal only; compiler and reviewer decide | agent output treated as truth | Contract only |
| Ontology materiality | counterfactual changed-page fields | answer/workflow/proof/tool/conversion changes | cosmetic wording only | Structurally declared; semantic proof missing |
| Sensitive targeting | sensitivity, consent, review, legality | operational/public-safe attributes | private/protected/covert inference | Strong source gate |
| Lexical dedupe | exact, label Jaccard, BM25/TF-IDF | deterministic baseline and review | description boilerplate collapse | Implemented |
| Graph relation | typed channel, source, edge calibration | explainable edge and hard constraints | arbitrary agent weight | Partially implemented |
| Community/macro-region | stability and significance | descriptive grouping only | community = market truth | Components retained; Leiden comparison only |
| Closed itemsets | support, width, closure, runtime | bounded observed conjunctions | combinatorial explosion | Works on fixture; 100k risk |
| Candidate expansion | recall, cap sensitivity, constraint correctness | useful hidden regions recovered | valid `requires` pair pruned; cap bias | Needs correction/evaluation |
| Region eligibility | anchor, evidence, support class, materiality, coherence | independently grounded useful hypothesis | zero-support agent combination | Partial |
| Sparse selection | marginal gain, quota, coverage, stability | every page clears floor | minimum page quota overrides floor | P0 correction needed |
| HRR representation | namespace, symbol version, parity, retrieval tests | structured compact representation | SEO value inferred from vector | Implemented as representation |
| Novelty | set, HRR, concept, content, utility similarity | different answer/object/task | one-attribute variants create duplicates | Current gate too narrow |
| Page-concept job | region hash and bounded context | one typed job per region | free-form page invention | Implemented |
| Stage-2 expression | semantic artifact and changed-by-attribute map | content actually expresses region | self-declared ID list | P0 semantic gap |
| Information object | schema, body, evidence, duplicate check | real calculation/workflow/data/tool | unique ID only | P0 gap |
| Generation runner | artifact schemas, checkpoint, rate/cost/resume | bounded idempotent execution | 7 remote calls/page, arbitrary artifacts | Research state machine only |
| Global corpus critic | title/content/claim/task/graph similarity | duplicate/contradictory pages rejected | independent page passes only | Missing |
| Output transaction | typed PageIR delta and full rebuild | atomic validated noindex emission | successful run not emitted | Missing |
| UI generation | semantic coverage, browser, axe, screenshots, CWV | accessible static page | build-only acceptance | Source-wired, browser proof missing |
| Sitemap/crawl | shards, index, hubs, depth, orphans | all publishable pages discoverable | one sitemap >50k, random links | 100k gap |
| Structured data | page-type policy and visible parity | valid eligible markup | generic schema everywhere | Partial |
| Publication | reviewed cohort, noindex->index gate | explicit field approval | quota-driven mass indexing | Correctly gated today |
| SEO outcome | indexing, impressions, qualified clicks, conversions | matched field lift and quality | compiler tests described as SEO proof | Not run |
| Wasm acceleration | exact hotspot, bridge-inclusive benchmark, parity | material end-to-end savings | porting object-heavy algorithm | Keep TypeScript now |

---

## 10. Ranked findings

## P0 — must be resolved before real large-site generation

1. Wire `prepareAgentSiteProgram()` into the authoritative CLI and agent skill.
2. Change the page-count minimum so it cannot override marginal quality.
3. Implement typed Stage-2 and page-generation artifact schemas.
4. Implement successful output -> evidence/modules/tasks/`SiteSource`/`PageIR` transaction.
5. Implement corpus-global semantic duplicate, same-answer, contradiction, and cannibalization validation.
6. Preserve attribute-level source/evidence provenance through generated atoms and pages.
7. Fix deferred/atomic `requires` constraint semantics.
8. Add large-site sitemap shards/index, deterministic hubs, crawl-depth/orphan validation, and canonical audits.
9. Build a real provider queue with concurrency, retries, rate/cost/token budgets, idempotency, and resume.
10. Keep all generated pages noindex until external usefulness and field gates pass.

## P1 — required before a 10k production candidate

1. Replace exhaustive closed-itemset enumeration for broad observations.
2. Add 25k/50k/100k CPU, memory, allocation, and artifact benchmarks.
3. Add candidate recall/cap/beam sensitivity and adversarial graph fixtures.
4. Calibrate or separately normalize explicit, lexical, and co-occurrence graph channels.
5. Add observed/inferred/hypothesized support classes.
6. Use context corpus evaluation hierarchically without forming huge dense kernels.
7. Add minimum calibration sample sizes and uncertainty reporting.
8. Separate hard identity, soft context, generation-only, and prohibited split dimensions.
9. Add deterministic internal-link family/hub architecture.
10. Add title/meta/schema/content/utility dedupe at emitted-corpus scale.
11. Add visible authorship/review/source/automation metadata to semantic IR.
12. Add browser, axe, screenshot, visual-regression, and crawl tests to CI.

## P2 — controlled research and optimization

1. Compare Leiden against components/k-core with significance and stability controls.
2. Compare learned embeddings against lexical/typed/HRR baselines on labeled contexts.
3. Compare CSI selection on publication/review cohorts.
4. Benchmark Wasm SIMD and native kernels only after 50k/100k profiles.
5. Keep HNSW/ANN optional until sparse local candidate retrieval misses measured neighbors.
6. Keep R3F/Three.js opt-in and utility-led.

---

## 11. Recommended next implementation sequence

```text
1. One authoritative CLI and skill over AgentSiteProgram
2. Real ProjectInput/repository/source ingestion
3. Stage-1 provider adapter + ontology competency questions + reviewer UX
4. Fix requires semantics and selection quota semantics
5. Compact/dictionary-backed 100k planning artifacts
6. Stage-2 typed proposal schema with real information-object/task bodies
7. Batched concept provider + cost/rate/resume scheduler
8. Page-generation typed artifacts and atomic SiteSource/PageIR transaction
9. Global corpus quality/cannibalization/contradiction validators
10. Sitemap shards, hubs, breadcrumbs, crawl simulation, schema policy
11. Browser/accessibility/performance/crawler CI
12. 100–500 real noindex AMTECH pages and public task surfaces
13. 10k complete static emission benchmark
14. Controlled publication cohorts and matched field measurement
15. 50k/100k profile, then reconsider Wasm/native/ANN
```

---

## 12. Field experiment required to establish SEO value

The framework needs a blocked, matched field test rather than a before/after anecdote.

### Suggested cohorts

- **A — conventional:** expert-authored service/problem/location pages using standard research and internal linking.
- **B — vector-selected static:** same quality budget, selected by the ontology/region compiler.
- **C — vector-selected + real utility:** selected pages include a functioning public AI Employee, calculator, validator, or workflow artifact.

### Match or block on

- topic family;
- location/industry;
- estimated demand and competition;
- page age;
- link depth;
- evidence quality;
- content production effort;
- conversion path.

### Metrics

- valid/indexed ratio;
- time to first crawl and index;
- impressions per published page;
- query diversity per page;
- non-brand qualified clicks;
- task starts and completions;
- qualified lead rate;
- revenue/gross profit per page family;
- maintenance cost;
- consolidation/removal rate;
- AI Overview/AI Mode citations where measurable;
- user satisfaction and return-to-search proxies.

### Minimum interpretation rule

Do not claim success from total impressions alone. A 100k corpus can create large totals while having poor page efficiency, low indexation, low satisfaction, and high maintenance cost.

---

## 13. Research crosswalk

### Directly relevant and qualifying

1. **Kong, Zhou, Huang, Sigalas — Personalized Search Via Neural Contextual Semantic Relevance Ranking**  
   https://arxiv.org/abs/2309.05113  
   Supports distinct query-document and document-context relevance, explicit cohort context, lexical plus semantic evaluation. Does not validate SEO corpus construction.

2. **Kleyko et al. — A Survey on Hyperdimensional Computing aka Vector Symbolic Architectures, Part II**  
   https://arxiv.org/abs/2112.15424  
   Supports structured distributed representations, binding/bundling, associative retrieval, and hardware-oriented research. Does not validate page usefulness, rankings, or conversions.

3. **Kleyko et al. — Vector Symbolic Architectures as a Computing Framework for Emerging Hardware**  
   https://arxiv.org/abs/2106.05268  
   Supports VSA as a compositional computing abstraction and future hardware target. Does not imply that Wasm is automatically faster for this compiler.

4. **Iyer — Complement Submodular Information Measures for Balanced and Robust Data Selection**  
   https://arxiv.org/abs/2605.24779  
   Relevant to coherent tail preservation and outlier suppression. New 2026 preprint; guarantees are conditional and do not transfer to the current objective.

5. **Liu et al. — Submodular Optimization Problems and Greedy Strategies: A Survey**  
   https://arxiv.org/abs/1905.03308  
   Supports greedy and lazy-greedy analysis for appropriate submodular objectives. Guarantees require the actual objective and constraints to satisfy the assumptions.

6. **Traag, Waltman, van Eck — From Louvain to Leiden**  
   https://doi.org/10.1038/s41598-019-41695-z  
   Supports well-connected graph-community partitions and Leiden as a stronger Louvain alternative. Community membership is not semantic or commercial truth.

7. **Li, Garijo, Poveda — Large Language Models for Ontology Engineering: A Systematic Literature Review**  
   https://www.semantic-web-journal.org/content/large-language-models-ontology-engineering-systematic-literature-review-1  
   Supports LLMs as auxiliary ontology engineers and emphasizes hybrid human workflows, benchmark inconsistency, and reproducibility gaps.

8. **Lippolis et al. — Ontology Generation using Large Language Models**  
   https://arxiv.org/abs/2503.05388  
   Supports structured LLM ontology drafting with multidimensional and expert evaluation; reports mistakes and variable quality.

9. **Mahlaza et al. — Feasibility of LLM-based Automated Generation and Filtering of Competency Questions**  
   https://aclanthology.org/2025.ldk-1.15/  
   Shows that automated ontology-question generation still produces many spurious or low-quality outputs and benefits from controlled filtering and experts.

10. **Shimizu and Hitzler — Accelerating Knowledge Graph and Ontology Engineering with Large Language Models**  
    https://doi.org/10.1016/j.websem.2025.100862  
    Supports modular LLM-assisted ontology engineering as a promising research direction; does not provide a completed empirical validation of this framework.

### Current authoritative SEO constraints

11. **Google — Generative AI content guidance**  
    https://developers.google.com/search/docs/fundamentals/using-gen-ai-content  
    Many generated pages without added user value may violate scaled-content-abuse policy.

12. **Google — Optimizing for generative AI features in Search, updated 2026-06-29**  
    https://developers.google.com/search/docs/fundamentals/ai-optimization-guide  
    Requires useful non-commodity expert/experience content; warns against separate pages for every fan-out variation; says page quantity does not create quality.

13. **Google — Helpful, reliable, people-first content**  
    https://developers.google.com/search/docs/fundamentals/creating-helpful-content  
    Requires original, substantial, insightful, trustworthy, expert, satisfying content and warns about mass automation.

14. **Google — Spam policies / scaled content abuse**  
    https://developers.google.com/search/docs/essentials/spam-policies  
    Applies regardless of whether pages are generated by AI, automation, humans, or a combination.

15. **Google — Build and submit a sitemap**  
    https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap  
    One sitemap is limited to 50,000 URLs or 50 MB uncompressed; larger sites require multiple sitemaps and optionally a sitemap index.

### Wasm and runtime qualification

16. **W3C WebAssembly Core Specification, 2026**  
    https://www.w3.org/TR/wasm-core-2/  
    Defines a safe, portable, low-level execution format. It is not an end-to-end performance guarantee.

17. **V8 — WebAssembly SIMD**  
    https://v8.dev/features/simd  
    Supports SIMD kernels when data and operations fit the model.

18. **Jangda et al. — Not So Fast: Analyzing the Performance of WebAssembly vs. Native Code**  
    https://arxiv.org/abs/1901.09056  
    Demonstrates that performance depends on workload and implementation; “near-native” cannot replace a workload-specific benchmark.

---

## 14. Final assessment

The framework’s central idea survives deep review, but in a more disciplined form:

```text
agent-assisted ontology discovery
+ independently grounded observations
+ sparse typed graph constraints
+ bounded conjunction and region search
+ deterministic coverage selection
+ HDC/VSA structural representation
+ compiler-bounded agent generation
+ semantic static emission
+ field validation
```

The framework should not be sold or internally understood as an engine that mathematically proves the need for 10,000 or 100,000 landing pages. It is an engine that can efficiently explore a very large opportunity space and then **reject almost all regions that do not justify a materially useful page**.

The best version of this project is not a scaled-content machine. It is a high-throughput, evidence-governed system for discovering and building a finite set of unusually specific, useful, non-commodity pages and public AI Employee experiences that a conventional site-planning process would miss.

That is technically plausible. The current source establishes meaningful compiler groundwork and a credible 10k planning result. The next proof must be complete generated artifacts, global semantic validation, browser/crawler acceptance, and controlled field performance—not more synthetic page counts.
