# Immutable Handoff — Agent Ontology and 10,000-Page Site Program

Date: 2026-07-17  
Branch: `agent/ui-metaprogramming-pass-1`  
Source proof head before documentation: `dcc8beded51290f8084a421996c51c18b2afed83`  
Source proof workflow: `29628832989`

## Current canonical model

```text
ProjectInput
-> Stage-1 AgentOntologyProposal
-> ApprovedOntology
-> sparse ontology graph + hard constraints
-> bounded ProductionOpportunitySpace
-> minimum 10,000 selected page regions when project requires it
-> one SiteGenerationPlan
-> deterministic Stage-2 PageConceptJob batches
-> validated PageConceptProposals
-> CandidatePageSeeds
-> existing PageCoordinate / corpus / job / manifest / PageIR / UI compiler
```

A framework job is one finite full-site creation run, not request-time serving or an always-on VPS.

The user supplies project truth and source material. The user does not hand-author dimensions, vectors, page coordinates, matrices, or jobs.

## Source-wired implementation

- `reference/src/project-input.ts`
- `reference/src/sparse-lexical.ts`
- `reference/src/ontology-discovery.ts`
- `reference/src/ontology-graph.ts`
- `reference/src/opportunity-space.ts`
- `reference/src/opportunity-generation-optimized.ts`
- `reference/src/opportunity-space-optimized.ts`
- `reference/src/opportunity-space-production.ts`
- `reference/src/site-program.ts`
- `reference/src/site-program-optimized.ts`
- `reference/src/agent-site-orchestrator.ts`
- `reference/src/acceleration-decision.ts`
- `reference/fixtures/agent-site-fixture.mjs`
- `reference/test/agent-site-program.test.mjs`
- `reference/test/acceleration-decision.test.mjs`

## Accepted algorithms

- TF-IDF/BM25 lexical baseline;
- typed evidence graph and separate requires/excludes plane;
- weighted object-attribute observations;
- bounded frequent closed itemsets;
- k-core pruning with anchor retention;
- deterministic connected components as descriptive macro-regions;
- graph-constrained best-first opportunity expansion;
- sparse concave-over-modular coverage selection;
- HRR/HDC/VSA after eligibility and pruning;
- bounded local page-neighbor context;
- two agent stages separated by compiler validation;
- TypeScript semantic and production oracle.

## Demoted research arms

- Leiden: exploratory graph partitioning only;
- sparse K-means/DBI-SC/HDBSCAN: real customer-row segmentation comparison only;
- learned embeddings: post-pruning recall comparison;
- HNSW/ANN: only if sparse exact planning fails measured budgets;
- GNN/ontology completion/GraphRAG: proposal/research assistance only;
- Blackwell/local GPU: optional agent-inference provider;
- Zig/Wasm: isolated numeric-kernel benchmark only.

## Rejected as current authority

- Cartesian page matrices;
- community membership as semantic/page truth;
- protected/private/inferred-sensitive targeting;
- hidden visitor profiling;
- dense clustering before typed eligibility;
- runtime canonical prose generation;
- mandatory Rust/Wasm/GPU/ANN;
- unverified cost, TPS, hardware-price, or crate claims.

## Validation proof

```text
46 tests
46 pass
0 fail
all workflow emission/build steps pass
```

Adversarial behavior proven:

- inferred-sensitive medical attribute rejected;
- unreviewed age cohort rejected;
- weaker duplicate painting attribute rejected;
- approved lifestyle attribute requires reviewer/public-targeting approval and material effects;
- hard constraints remain separate from similarity;
- optimized candidate generation has exact ordered region-hash parity with the transparent baseline;
- Stage-2 proposal missing one required region attribute fails.

## Final recorded 10k profile

```text
project normalization       0.126 ms
ontology compilation       20.363 ms
graph compilation          36.644 ms
closed itemsets           202.478 ms
candidate generation     2218.216 ms
sparse selection         1784.044 ms
site-program planning     973.168 ms
total                    5284.510 ms

candidate regions          15,000
selected page regions      10,000
Stage-2 batches               400
packed HRR bytes         2,560,000
```

The original implementation recorded approximately 29 seconds on the same workflow class before targeted sparse/algorithmic optimization. The final source path is approximately 5.5 times faster in the recorded CI runs.

These are synthetic one-shot compiler results, not content, browser, search, conversion, or revenue proof.

## Wasm disposition

Current: **keep TypeScript**.

Final run HRR sample:

```text
1,000 regions: 49.358 ms
linear 10,000 estimate: ~0.49 seconds
estimated share of full recorded build: ~9%
```

The 10,000 figure is an estimate, not a direct standalone kernel benchmark.

Promotion gate:

```text
isolated contiguous numeric kernel
20+ repeated bridge-inclusive JS/Wasm runs
exact selection-hash parity
vector cosine >= 0.999999
>= 1.25x speedup
>= 500 ms full-build savings
TypeScript fallback retained
```

No native Zig/Wasm compilation or parity/performance acceptance is claimed.

## Documentation authority

Read next:

1. `../README.md`
2. `../CODEGRAPH.md`
3. `../24-agent-discovered-ontology-and-10k-site-program.md`
4. `../validation/reports/2026-07-17-agent-ontology-10k-site-program.md`
5. `../reference/README.md`

## Not accepted

- arbitrary repository/source ingestion;
- real Stage-1/Stage-2 provider adapters;
- real reviewed ontology and observations;
- real search/customer context collection and assessment;
- canonical transaction from Stage-2 outputs into complete evidence/modules/tasks/pages;
- 10,000 generated page bodies/UIs;
- browser/accessibility/Core Web Vitals/crawler proof at scale;
- native/Wasm benefit;
- Leiden/sparse clustering/embedding/HNSW/GPU superiority;
- indexing, ranking, AI citations, conversion, gross profit, revenue, or customer outcomes.

## Next gate

```text
real source/repository ingestion
-> Stage-1 provider + reviewer workflow
-> reviewed real ontology and observations
-> 100–500 real noindex Stage-2 jobs
-> Stage-2 provider and canonical output transaction
-> content/information-gain/cannibalization evaluation
-> browser/accessibility/performance acceptance
-> 10,000 complete static page emissions
-> separate field publication and commercial measurement
```
