# Validation Report — Agent Ontology and 10,000-Page Site Program

Date: 2026-07-17  
Scope: `GTM-RESEARCH/website-framework/reference/`  
Source head before this documentation pass: `dcc8beded51290f8084a421996c51c18b2afed83`  
GitHub Actions run: `29628832989`

## Result

```text
strict TypeScript build: pass
Node tests: 46/46 pass
manifest emission: pass
UI emission: pass
orchestration check: pass
framework validate: pass
framework preview: pass
browser target check: pass
R3F build: pass
artifact upload: pass
```

The source implementation passes its synthetic validation vectors. It is not production or field accepted.

## Workload validated

```text
one site-creation run
-> one project
-> one agent ontology proposal
-> one approved ontology and graph
-> 15,000 bounded candidate regions
-> 10,000 selected page regions
-> 10,000 Stage-2 PageConceptJobs
-> 400 deterministic batches of 25 jobs
-> 2,560,000 bytes of packed 64-dimensional Float32 vectors
```

This test does not execute 10,000 model/API page-generation calls and does not serve the resulting site.

## Final recorded profile

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
```

The same workflow class previously recorded approximately 29 seconds before the targeted sparse/algorithmic optimizations. The final source path is approximately 5.5× faster in the recorded runs.

Timings are runner-dependent and are not a general hardware claim.

## HRR/Wasm profile

```text
1,000-region HRR sample: 49.358 ms
linear 10,000 estimate: ~493.58 ms
optimized full build: 5284.510 ms
estimated HRR share: ~9.3%
```

The linear estimate is not a standalone direct 10,000-kernel benchmark.

Wasm promotion result:

```text
disposition: keep-typescript
algorithm-first gate: pass
isolated-kernel size/share gate: fail
bridge-inclusive Wasm benefit: not run
Wasm parity: not run
TypeScript fallback: pass
```

A hypothetical benchmark fixture also proves that promotion occurs only when:

- the dense kernel is large enough;
- inputs cross as contiguous typed arrays;
- at least 20 runs are measured;
- bridge time is included;
- parity passes;
- speedup is at least 1.25×;
- absolute savings are at least 500 ms.

## Validation matrix

### Project page contract

Validation vector:

- positive integer minimum;
- positive integer maximum;
- minimum not greater than maximum;
- measurable conversion/search/utility outcomes.

Pass:

- 10,000 minimum and maximum are explicit in the scale fixture;
- site planning fails if fewer regions are selected.

Fail:

- unbounded generation;
- page count as the only goal;
- silently lowering the minimum.

### Agent ontology proposal

Validation vector:

- proposal ID/version/generator/date;
- source and evidence IDs;
- confidence;
- sensitivity;
- reviewer/public-targeting state;
- material effects;
- dimension hint;
- typed relations and observations.

Pass:

- approved attributes resolve to project ledgers;
- business anchors survive;
- lifestyle/demographic attributes require stronger materiality and reviewer approval;
- rejected attributes remain in a rejected ledger.

Fail proven:

- inferred-sensitive medical attribute rejected;
- unreviewed age cohort rejected;
- duplicate painting attribute rejected.

### Lexical baseline

Validation vector:

- deterministic tokenization;
- stable IDF/postings/hash under source order;
- label-level evidence before duplicate rejection.

Pass:

- TF-IDF related-document ordering is deterministic;
- numeric label variants remain distinct;
- description boilerplate cannot collapse distinct industries;
- strongest-supported exact duplicate survives.

### Ontology graph

Validation vector:

- explicit, co-occurrence, and lexical channels;
- known endpoints;
- typed relation;
- weight and rationale;
- separate requires/excludes plane;
- core number and anchor retention;
- connected macro-region membership.

Pass:

- all accepted edges resolve;
- invalid/rejected-endpoint relations are preserved as rejected findings;
- hard constraints cannot be overridden by similarity;
- anchors remain active.

### Candidate generation

Validation vector:

- bounded frequent closed itemsets;
- one value per dimension;
- graph-neighbor expansion only;
- hard constraints;
- candidate cap;
- anchor/evidence/materiality/coherence eligibility;
- deterministic region hashes.

Pass:

- optimized candidate generator emits the exact ordered region hashes of the transparent baseline on the adversarial fixture;
- 15,000 scale candidates emitted under the configured cap;
- no Cartesian-product enumeration.

### Sparse selection

Validation vector:

- sparse coverage keys;
- diminishing returns;
- minimum/maximum site count;
- local duplicate screen;
- packed HRR vector parity;
- deterministic selection hash.

Pass:

- 10,000 regions selected;
- 2.56 MB packed vector artifact;
- vectors compiled once and Float32 packing preserves accepted cosine parity;
- universal/non-discriminative coverage features do not dominate selection;
- global bucket-wide duplicate scanning removed for exact-only thresholds.

### Site generation plan

Validation vector:

- one job per selected region;
- bounded local neighbors;
- exact batch membership;
- one site-run identity;
- no runtime serving dependency.

Pass:

- 10,000 jobs;
- 400 batches;
- every job appears exactly once;
- nearby-region context is bounded by a finite sparse candidate budget.

### Stage-2 page concept compiler

Validation vector:

- all selected region attributes expressed;
- source/evidence references are bounded;
- canonical question, intent, route, conversion path;
- information object or utility task;
- semantic modules/layout roles/UI capabilities;
- deterministic primary prototype.

Pass:

- valid proposals compile into `CandidatePageSeed` objects;
- missing a single required selected-region attribute fails validation.

## Research decisions

### Retained

- TF-IDF/BM25 baseline;
- typed graph and hard constraints;
- k-core pruning;
- deterministic connected components;
- observed closed conjunctions;
- constrained graph expansion;
- concave sparse coverage;
- HRR after eligibility;
- two agentic stages;
- TypeScript production oracle.

### Demoted

- Leiden to exploratory macro-partition comparison;
- sparse K-means/DBI-SC/HDBSCAN to real customer-row comparison studies;
- learned embeddings and HNSW to later recall/scale tests;
- GraphRAG/GNN/KG completion to proposal/research arms;
- Blackwell to optional agent inference provider.

### Rejected for current implementation

- full Cartesian page matrices;
- protected/private/inferred-sensitive targeting;
- community membership as page truth;
- dense clustering before typed eligibility;
- runtime page prose generation;
- mandatory Rust/Wasm/GPU;
- unverified cost/TPS/crate claims.

## Files added or materially changed

```text
reference/src/project-input.ts
reference/src/sparse-lexical.ts
reference/src/ontology-discovery.ts
reference/src/ontology-graph.ts
reference/src/opportunity-space.ts
reference/src/opportunity-space-optimized.ts
reference/src/opportunity-generation-optimized.ts
reference/src/opportunity-space-production.ts
reference/src/site-program.ts
reference/src/site-program-optimized.ts
reference/src/agent-site-orchestrator.ts
reference/src/acceleration-decision.ts
reference/src/index.ts
reference/fixtures/agent-site-fixture.mjs
reference/test/agent-site-program.test.mjs
reference/test/acceleration-decision.test.mjs
24-agent-discovered-ontology-and-10k-site-program.md
```

## Exact proof fixtures

### Adversarial small fixture

Proves:

- unsafe and unreviewed attributes are rejected;
- exact duplicate retention is evidence/confidence aware;
- lifestyle attributes can survive only with explicit approval and material effects;
- constraints remain separate;
- optimized region generation equals baseline region generation;
- Stage-2 drift fails.

### 10,000-page scale fixture

Proves:

- bounded candidate generation;
- exact minimum page count;
- packed vectors;
- deterministic batching;
- one-shot planning within the fixture budget;
- no serving runtime required.

It does not prove semantic usefulness of the synthetic regions.

## Not run / not accepted

- arbitrary repository/source ingestion;
- real Stage-1 or Stage-2 provider execution;
- a reviewed real ontology;
- real search-demand/customer observations;
- real page body/UI generation at 10,000 pages;
- browser/crawler/accessibility/Core Web Vitals at 10,000 pages;
- native Zig compilation;
- JavaScript versus compiled Wasm kernel benchmark;
- Leiden/sparse clustering/embedding/HNSW comparative acceptance;
- search indexing/ranking/citation;
- conversion, gross profit, revenue, or customer outcome lift.
