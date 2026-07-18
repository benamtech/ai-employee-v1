# 24 — Agent-Discovered Ontology and 10,000-Page Site Program

Status: source-wired and synthetic-scale validated; real source ingestion, model providers, page-content transactions, browser acceptance, and search/commercial field evidence remain pending  
Updated: 2026-07-17  
Controlling implementation: `reference/src/agent-site-orchestrator.ts`

## 1. Corrected workload definition

A framework **job** is one bounded site-creation run:

```text
one ProjectInput
-> one agent-discovered ontology proposal
-> one approved ontology/graph/opportunity space
-> one finite site-generation plan
-> at least the declared minimum page count
-> batched agent/API generation work
-> deterministic static/compiler artifacts
```

For the current target, one job contains at least **10,000 canonical page-region jobs**.

This is not:

- 10,000 concurrent visitors;
- an always-on vector database;
- a request-time page generator;
- an always-on VPS serving personalized pages;
- a claim that all 10,000 pages are automatically indexable or useful.

Serving is a later delivery concern. The current work optimizes the one-shot compiler and generation plan.

## 2. Research verdict

### Retain

| Method | Retained role | Boundary |
|---|---|---|
| TF-IDF/BM25 | deterministic lexical baseline and duplicate/related-concept inspection | not semantic truth |
| typed evidence graph | compatibility, requires, excludes, hierarchy, offer/topic/workflow support | edge provenance required |
| weighted object-attribute observations | co-occurrence and closed-conjunction seeds | no unrestricted Cartesian product |
| bounded frequent closed itemsets | observed conjunction seeds | maximum width and support floor |
| k-core pruning | remove isolated non-anchor proposals | anchors survive and all pruning is reported |
| connected components | deterministic macro-regions | descriptive only, not market truth |
| graph-constrained best-first expansion | explore reasonable unobserved conjunctions | one value per dimension, hard constraints, candidate cap |
| concave-over-modular sparse coverage | finite corpus coverage over nodes, pairs, communities, anchors, and material effects | no dense candidate-by-context matrix at 10k |
| HRR/HDC/VSA | fixed-width structural representation after eligibility/pruning | not the source of evidence or eligibility |
| bounded local neighbor retrieval | page-agent cannibalization context | advisory, finite, and not publication authority |
| two agent stages | ontology discovery first; page-concept generation second | compiler validates both stages |

### Demote to comparison/research arms

| Method | Reason |
|---|---|
| Leiden | useful for exploratory graph partitioning and guarantees connected communities, but modularity/CPM communities do not establish page usefulness, intent, evidence, or commercial materiality |
| sparse K-means / DBI-SC / HDBSCAN | relevant when the project has actual customer-row observations and a validated distance/clustering objective; the current ontology is a typed discrete constraint/evidence system, not a Euclidean consumer table |
| learned embeddings | useful after lexical/graph pruning for held-out semantic recall tests; not required for current bounded 15,000-candidate build |
| HNSW/ANN | useful only when exact sparse candidate retrieval stops meeting measured build budgets |
| GNN/link prediction | potential ontology-completion proposal arm; never direct approval authority |
| GraphRAG | possible research/source synthesis arm; not the canonical page compiler |
| Blackwell/local GPU inference | possible execution provider for bounded generation bursts; not a dependency of ontology, selection, or serving |

### Reject as current canonical claims

- dense ML or clustering as the first ontology authority;
- community membership as proof of page eligibility;
- unrestricted demographic or protected/private targeting;
- arbitrary hidden visitor profiling;
- full Cartesian page matrices;
- runtime prose generation;
- `5 cents per article`, `$2–3/hour`, or Blackwell throughput claims without a specific model, hardware, quantization, batch, token, energy, and provider benchmark;
- unverified Rust/HDC/search crates as production dependencies;
- Wasm or Rust adoption because it sounds advanced.

## 3. Verified research interpretation

### HDC/VSA and HRR

Kleyko et al., Parts I and II, support high-dimensional distributed representations, binding, bundling, and compositional structure. They do **not** prove SEO, page usefulness, or commercial lift. The framework therefore uses HRR after evidence, safety, graph, materiality, and eligibility gates.

### LLM-assisted ontology engineering

The research and industry methodologies consistently support a modular workflow:

```text
LLM/agent proposes
-> typed schema and provenance
-> compiler validation
-> anti-pattern and conformance checks
-> test harness
-> human/reviewer boundary where required
```

The implementation follows this separation. The agent is a proposal engine, not ontology authority.

### Leiden/community detection

Leiden improves on Louvain by guaranteeing connected communities and optimizing a graph quality function. That is useful for descriptive macro-regions. It does not prove that a community corresponds to a coherent search intent, useful page, or market segment. The production compiler therefore retains deterministic connected components and explicit constraints; Leiden is an optional benchmark.

### Sparse customer clustering

The verified sparse-market-segmentation papers address high-dimensional customer rows, RFM/behavior features, mixed variables, and clustering objectives. Those methods become relevant only when a project supplies comparable row-level evidence and the clusters are evaluated externally. They are not substituted for the current typed ontology graph.

### Submodular coverage

The selected objective is a sparse sum of concave functions over modular feature counts. This supplies diminishing returns across page-region coverage. The original global-revision implementation was correct on fixtures but slow; the production implementation uses lazy upper bounds and discriminative sparse features.

### WebAssembly

Wasm is portable and SIMD-capable. It is not an automatic speedup. A useful Wasm boundary requires a large isolated numeric kernel, contiguous typed-array inputs, parity, repeated measurements, and bridge-inclusive end-to-end savings.

The measured 10,000-page profile does not meet that promotion gate.

## 4. Implemented pipeline

```text
ProjectInput
  minimumInitialPages / maximumInitialPages
  business + brand + technical + goals
  sources + evidence + assets
        |
        v
Stage 1 ontology agent
  AgentOntologyProposal
  attributes + dimension hints
  typed relations
  object-attribute observations
        |
        v
compileApprovedOntology
  provenance resolution
  confidence/materiality gates
  protected/private/inferred-sensitive rejection
  demographic/lifestyle reviewer gate
  strongest-supported exact duplicate retention
  label-gated lexical duplicate rejection
  rejected attribute/relation/observation ledgers
        |
        v
compileOntologyGraph
  explicit + co-occurrence + lexical channels
  requires/excludes plane
  k-core pruning with anchor retention
  deterministic connected macro-regions
        |
        v
compileProductionOpportunitySpace
  bounded frequent closed itemsets
  cached constrained best-first expansion
  hard eligibility
  incremental sparse concave coverage
  local duplicate screen
  packed HRR region vectors
        |
        v
compileSparseSiteGenerationPlan
  one PageConceptJob per selected region
  bounded nearby-region context
  deterministic batches
        |
        v
Stage 2 page-concept agent
  canonical question + intent + route
  information object + utility/task
  graph role + conversion path
  semantic modules + UI capabilities
        |
        v
compilePageConceptProposals
  complete region-expression check
  source/evidence bounds
  distinct route/question/object/task
  deterministic CandidatePageSeed
        |
        v
existing PageCoordinate / corpus / job / manifest / PageIR / UI compiler
```

The user does not author dimensions, vectors, page coordinates, page matrices, or generation jobs.

## 5. Source map

| Source | Role |
|---|---|
| `reference/src/project-input.ts` | project truth, minimum/maximum site page contract |
| `reference/src/sparse-lexical.ts` | TF-IDF/BM25 baseline |
| `reference/src/ontology-discovery.ts` | governed agent ontology proposal compiler |
| `reference/src/ontology-graph.ts` | sparse graph, constraints, pruning, macro-regions |
| `reference/src/opportunity-space.ts` | transparent original/reference implementation |
| `reference/src/opportunity-generation-optimized.ts` | cached production candidate generator |
| `reference/src/opportunity-space-optimized.ts` | incremental sparse selector and packed HRR vectors |
| `reference/src/opportunity-space-production.ts` | production opportunity compiler |
| `reference/src/site-program.ts` | typed Stage-2 job/proposal contracts and seed compiler |
| `reference/src/site-program-optimized.ts` | bounded sparse page-neighbor and batch planner |
| `reference/src/agent-site-orchestrator.ts` | hard-gated two-stage entrypoint |
| `reference/src/acceleration-decision.ts` | evidence-gated TypeScript/Wasm decision contract |
| `reference/fixtures/agent-site-fixture.mjs` | adversarial and 10k synthetic fixtures |
| `reference/test/agent-site-program.test.mjs` | ontology/graph/region/site/scale proof |
| `reference/test/acceleration-decision.test.mjs` | Wasm keep/promote gates |

## 6. Validation vectors added

### Project

- explicit minimum and maximum one-shot page counts;
- minimum must be positive and not exceed maximum;
- page count is an output contract, not the only quality goal.

### Ontology

- proposal identity, generator, source/evidence references;
- discovered dimensions and business anchors;
- material page effects;
- targeting safety and reviewer approval;
- deterministic lexical baseline;
- typed relations and rejected-edge ledger;
- weighted observations and rejected-observation ledger.

### Graph

- explicit/co-occurrence/lexical channels;
- separate hard constraints;
- k-core pruning and anchor retention;
- deterministic connected macro-regions.

### Opportunity space

- observed conjunction seeds;
- constrained bounded expansion;
- anchor/materiality/evidence/coherence eligibility;
- packed HRR parity;
- local nonredundancy;
- sparse concave coverage selection;
- one-site 10k planning scale.

### Site program

- one Stage-2 job per selected region;
- bounded local corpus context;
- exact batch coverage;
- complete region expression;
- route/question/information/utility distinctness;
- deterministic CandidatePageSeed output.

### Acceleration

- stage-level profile;
- algorithm-before-runtime gate;
- isolated dense-kernel gate;
- bridge-inclusive repeated Wasm benefit;
- numeric/selection parity;
- complete TypeScript fallback.

## 7. Exact synthetic scale proof

GitHub Actions source run before documentation:

```text
run: 29628832989
head: dcc8beded51290f8084a421996c51c18b2afed83
46 tests
46 pass
0 fail
all emission/build steps pass
```

Final 10,000-page fixture profile from that run:

```text
project normalization       0.126 ms
ontology compilation       20.363 ms
graph compilation          36.644 ms
closed itemsets           202.478 ms
candidate generation     2218.216 ms
sparse selection         1784.044 ms
site-program planning     973.168 ms
-----------------------------------
total                    5284.510 ms

candidate regions          15,000
selected page regions      10,000
agent batches                 400
packed HRR vectors       2,560,000 bytes
```

Original pre-optimization profile was approximately 29 seconds. The production sparse/algorithmic path is therefore about 5.5× faster on the recorded CI runs. Timing varies by runner; the acceptance fact is that both paths were measured on the same workflow class and the production path remains far below the 30-second fixture budget.

The 1,000-region HRR sample took 49.358 ms in the final run. A linear 10,000-region extrapolation is about 0.49 seconds. This is an estimate, not a direct standalone 10,000-kernel benchmark.

## 8. Wasm decision

Current disposition: **keep TypeScript as production oracle; do not promote Wasm yet**.

Reasons:

1. algorithmic changes already reduced the full 10k plan below six seconds in the final recorded run;
2. the dominant stages are sparse candidate construction, selection state, and job planning;
3. the isolated HRR numeric share is below the current 25% / 1.5-second promotion floor;
4. no compiled bridge-inclusive Wasm benchmark has established accepted parity and at least 1.25× / 500 ms end-to-end savings;
5. the existing Zig/Wasm source remains a research arm, not production authority.

Promotion requires:

```text
isolated exact production kernel
+ contiguous typed-array boundary
+ 20+ repeated JS/Wasm runs
+ bridge/copy/startup included
+ exact selection-hash parity
+ vector cosine >= 0.999999
+ >= 1.25x speedup
+ >= 500 ms absolute full-build savings
+ TypeScript fallback retained
```

## 9. Pass/fail boundary

Pass:

- the first agent discovers dimensions and relationships from project truth;
- every accepted attribute is provenance-bearing and materially page-changing;
- protected/private/inferred-sensitive axes are rejected;
- demographic/lifestyle axes require explicit public-targeting approval, reviewer approval, and stronger materiality;
- candidate conjunctions originate in observations or bounded graph expansion;
- all selected regions have anchors, evidence, material effects, coherence, and no hard-constraint violation;
- the 10,000-page minimum is satisfied before Stage-2 API generation;
- each Stage-2 job expresses one exact selected region;
- candidate and job planning remain one-shot and runtime-independent;
- acceleration decisions are benchmark-gated.

Fail:

- the user must invent vector axes or page coordinates;
- an agent suggestion becomes an ontology node without provenance/materiality/safety checks;
- community detection becomes semantic or publication authority;
- demographics are cosmetic stereotype variables;
- a full Cartesian matrix is emitted;
- dense embeddings, clustering, HNSW, GPU, Rust, or Wasm are mandatory before simpler baselines fail;
- 10,000 means live sessions or always-on serving;
- synthetic scale timing is described as search, ranking, content, conversion, or revenue proof.

## 10. Still not accepted

- arbitrary repository/site/business-source ingestion into `ProjectInput` and `AgentOntologyProposal`;
- a real provider adapter for Stage 1 or Stage 2;
- real independent customer/search observations and assessors;
- successful Stage-2 outputs transacted into canonical evidence/modules/tasks/pages;
- 10,000 generated page bodies or UIs;
- browser screenshot, accessibility, Core Web Vitals, and crawler acceptance at 10k;
- native Zig or Wasm compilation/parity/performance in CI;
- Leiden, sparse clustering, learned semantic, HNSW, or GPU arms beating the production baseline;
- indexing, ranking, AI citation, conversion, gross profit, revenue, or customer outcomes.

## 11. Next gate

```text
real source/repository ingestion
-> Stage-1 provider adapter
-> reviewed real ontology proposal
-> 100–500 real noindex PageConceptJobs
-> Stage-2 provider adapter and canonical transaction
-> content/information-gain/cannibalization evaluation
-> browser/accessibility/performance validation
-> expand to 10,000 generated static pages
-> separate field publication and commercial measurement
```
