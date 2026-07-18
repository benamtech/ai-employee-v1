# CODEGRAPH.md — Agent-Operated Vector-Native Website Generation Compiler

Status: agent-discovered ontology front end, sparse 10,000-page site-program planner, existing deterministic compiler, and UI scaffold are source-wired; real providers, content transaction, browser scale, and field acceptance remain pending  
Updated: 2026-07-17  
Scope: `GTM-RESEARCH/website-framework/`

## Product and source graph

```text
user business + brand + assets + sources + goals
        |
        v
ProjectInput + ledgers + one-shot site bounds
  reference/src/project-input.ts
        |
        v
Stage 1 AgentOntologyProposal
  attributes + dimensions + typed relations + observations
        |
        v
ApprovedOntology
  reference/src/ontology-discovery.ts
  provenance + materiality + targeting safety
  TF-IDF/BM25 duplicate baseline
  rejected attribute/relation/observation ledgers
        |
        v
CompiledOntologyGraph
  reference/src/ontology-graph.ts
  explicit + co-occurrence + lexical channels
  requires/excludes + k-core + connected macro-regions
        |
        v
ProductionOpportunitySpace
  reference/src/opportunity-generation-optimized.ts
  reference/src/opportunity-space-optimized.ts
  reference/src/opportunity-space-production.ts
  observed closed sets -> constrained expansion
  -> eligibility -> sparse concave coverage
  -> packed HRR vectors
        |
        v
SiteGenerationPlan
  reference/src/site-program-optimized.ts
  one PageConceptJob per selected region
  bounded local neighbor context + deterministic batches
        |
        v
Stage 2 PageConceptProposal
  reference/src/site-program.ts
  question + intent + route + information/utility
  graph role + conversion + modules/layout/UI capabilities
        |
        v
validated CandidatePageSeed
        |
        v
existing vector/compiler path
  reference/src/page-coordinate.ts
  reference/src/corpus-plan.ts
  reference/src/typed-graph.ts
  reference/src/page-generation.ts
        |
        v
existing unified manifest and semantic compiler
  site-manifest.yaml
  reference/src/manifest.ts
  reference/src/framework.ts
        |
        +-> static HTML/schema/sitemap/instructions
        +-> packed prototype vectors + CSR graph
        +-> static UI scaffold/AMTECH renderer
        +-> optional noncanonical R3F
```

`reference/src/agent-site-orchestrator.ts` is the source-wired two-stage front end. `reference/src/framework-orchestrator.ts` remains the existing independent-context/calibration/corpus/job reference path. Both converge on the existing coordinate, job, manifest, PageIR, and UI authorities rather than creating a second publication system.

`reference/src/validation-contracts.ts` supplies the cross-layer validation/pass/fail report model.

## Workload boundary

```text
one job = one finite site-creation run
one run = one project + one selected site corpus + all batched agent work
current minimum scale fixture = 10,000 page-region jobs
```

This source graph does not require request-time generation, live personalization, a vector database, or an always-on serving process.

## Source-wired now

- deterministic `ProjectInput`, source/evidence/asset ledgers, and minimum/maximum page bounds;
- Stage-1 agent ontology proposal contract;
- confidence, provenance, page-materiality, targeting-safety, and reviewer gates;
- strongest-supported exact duplicate retention and label-gated lexical duplicate rejection;
- rejected attribute, relation, and observation ledgers;
- deterministic TF-IDF/BM25 baseline;
- sparse ontology graph with explicit, co-occurrence, and lexical channels;
- separate hard requires/excludes constraints;
- k-core pruning with business-anchor retention;
- deterministic connected macro-regions;
- bounded frequent closed itemsets and graph-constrained opportunity expansion;
- cached production candidate generator with exact ordered-hash parity against the baseline fixture;
- incremental sparse concave-over-modular selector;
- local nonredundancy and packed HRR vectors;
- bounded sparse page-neighbor planning and deterministic Stage-2 batches;
- Stage-2 page-concept expression/distinctness compiler;
- deterministic `CandidatePageSeed` output with explicit primary prototypes;
- existing independent ContextCorpus, frozen splits, calibration, PageCoordinates, finite corpus optimizer, typed graph, jobs, bounded agent runner, manifest/PageIR compiler, and static UI;
- evidence-gated TypeScript/Wasm acceleration decision contract.

## Critical code paths

| Path | Role | Current boundary |
|---|---|---|
| `reference/src/validation-contracts.ts` | Stable validation attributes/findings/reports | Measurements still depend on supplied fixtures and field data |
| `reference/src/project-input.ts` | Project truth and one-shot page bounds | No arbitrary repository/business scanner yet |
| `reference/src/sparse-lexical.ts` | TF-IDF/BM25 oracle | No learned-semantic acceptance yet |
| `reference/src/ontology-discovery.ts` | Stage-1 proposal approval | No real provider or reviewer workflow adapter yet |
| `reference/src/ontology-graph.ts` | Evidence graph, constraints, pruning, macro-regions | Connected components are descriptive, not semantic truth |
| `reference/src/opportunity-space.ts` | Transparent reference implementation | Retained as correctness baseline, not production performance path |
| `reference/src/opportunity-generation-optimized.ts` | Cached constrained candidate generator | Scale proof is synthetic |
| `reference/src/opportunity-space-optimized.ts` | Sparse selector and packed HRR vectors | No external usefulness/relevance labels at 10k |
| `reference/src/opportunity-space-production.ts` | Production opportunity composition | No Leiden/clustering/embedding comparison accepted |
| `reference/src/site-program.ts` | Stage-2 contracts and seed compiler | No real model-provider output transaction yet |
| `reference/src/site-program-optimized.ts` | Bounded local context and batching | Neighbor context is advisory, not publication authority |
| `reference/src/agent-site-orchestrator.ts` | Two-stage hard-gated front end | Real ingestion/providers pending |
| `reference/src/context-corpus.ts` | Independent contexts, splits, calibration | Current proof corpus remains synthetic |
| `reference/src/page-coordinate.ts` | Explicit-primary coordinates | Real candidate labels/calibration pending |
| `reference/src/corpus-plan.ts` | Existing finite corpus optimizer | Current real-world selection evidence is absent |
| `reference/src/page-generation.ts` | Jobs and bounded agent runner | No real Codex/Claude/Pi adapter yet |
| `reference/src/manifest.ts`, `reference/src/framework.ts` | Canonical semantic/static output | Legacy hand-authored pages need migration |
| `reference/src/acceleration-decision.ts` | Wasm/native promotion gate | No compiled bridge-inclusive Wasm benchmark yet |
| `reference/src/wasm.ts`, `reference/zig/` | Numeric-kernel research | Not production accepted |
| `reference/src/ui-*` | Static UI compiler | Browser/accessibility field proof pending |

## Research disposition

### Retained

```text
TF-IDF/BM25
+ typed graph and hard constraints
+ weighted observations
+ bounded closed conjunctions
+ k-core pruning
+ deterministic connected macro-regions
+ constrained best-first expansion
+ sparse concave coverage
+ HRR after eligibility
+ two compiler-bounded agent stages
```

### Comparison-only

```text
Leiden community detection
sparse K-means / DBI-SC / HDBSCAN
learned embeddings
HNSW/ANN
GNN / ontology completion / GraphRAG
Blackwell or other local inference providers
Zig/Wasm numeric kernels
```

### Rejected as authority

```text
Cartesian page matrices
community membership as page truth
protected/private/inferred-sensitive targeting
hidden visitor profiling
dense clustering before typed eligibility
runtime canonical prose generation
mandatory Rust/Wasm/GPU/ANN
unverified cost/TPS/crate claims
```

## Exact source proof

Validated source head before documentation: `dcc8beded51290f8084a421996c51c18b2afed83`  
Workflow run: `29628832989`

```text
46/46 tests pass
strict TypeScript build: pass
manifest/UI/orchestration emissions: pass
framework validate/preview: pass
browser resolution: pass
R3F build: pass
artifact upload: pass
```

Final recorded 10,000-page planning fixture:

```text
15,000 candidate regions
10,000 selected page regions
400 Stage-2 batches
2,560,000 packed-vector bytes
5,284.510 ms total recorded CI time
```

Stage profile:

```text
project                         0.126 ms
ontology                       20.363 ms
graph                          36.644 ms
closed itemsets               202.478 ms
candidate generation        2,218.216 ms
sparse selection            1,784.044 ms
site-program planning         973.168 ms
```

The transparent pre-optimization path recorded approximately 29 seconds on the same workflow class. Exact ordered candidate-region hash parity is tested on the adversarial fixture.

These are synthetic one-shot compiler results, not content, browser, search, conversion, or revenue proof.

## Wasm boundary

Current disposition: keep TypeScript as semantic and production oracle.

The measured dense HRR share is too small to pass the current Wasm promotion gate. Promotion requires an isolated contiguous numeric kernel, 20 or more repeated bridge-inclusive measurements, exact selection-hash parity, cosine parity of at least 0.999999, at least 1.25 times speedup, at least 500 ms absolute full-build savings, and a complete TypeScript fallback.

## Validation authorities

Read in this order:

1. `README.md`
2. `memory/MEMORY.md` and newest immutable handoff
3. `24-agent-discovered-ontology-and-10k-site-program.md`
4. `validation/reports/2026-07-17-agent-ontology-10k-site-program.md`
5. `23-groundwork-orchestration-implementation.md`
6. `22-agent-operated-framework-workflow-validation-matrix.md`
7. `21-vector-to-generation-job-compiler.md`
8. `20-agent-operated-vector-site-generation-and-wasm.md`
9. `18-vector-node-path-web-framework-model.md`
10. `19-vector-native-corrections-and-csi-validation.md`
11. `site-manifest.yaml`

## Not accepted

- arbitrary repository/source extraction;
- real Stage-1 or Stage-2 provider adapters;
- real reviewed ontology and object-attribute observations;
- independent search/customer context corpus at meaningful scale;
- agent-output transaction into canonical evidence/modules/tasks/pages;
- 10,000 generated page bodies and UIs;
- browser screenshot/accessibility/Core Web Vitals/crawler proof at 10k;
- native Zig or Wasm compilation, parity, and end-to-end benefit;
- Leiden/sparse-clustering/embedding/HNSW/GPU superiority;
- indexing, ranking, AI citation, conversion, gross profit, revenue, or customer outcomes.

## Next path

```text
repository/source ingestion adapters
-> Stage-1 provider + reviewer workflow
-> reviewed real ontology and observations
-> 100–500 real noindex PageConceptJobs
-> Stage-2 provider and canonical output transaction
-> information-gain/cannibalization/content evaluation
-> browser/accessibility/performance validation
-> 10,000 complete static page emissions
-> separate matched field publication and commercial measurement
```
