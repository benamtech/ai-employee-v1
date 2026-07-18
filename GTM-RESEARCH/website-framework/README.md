# Hyper-Targeted Search-Distribution Framework

Status: agent-operated ontology discovery, vector-region planning, 10,000-page site-program compilation, deterministic downstream compiler, and UI scaffold are source-wired; real provider, content, browser, search, and commercial acceptance remain pending  
Updated: 2026-07-17

## Product interface

The intended interface is a repository-aware coding agent such as Codex, Claude Code, Pi, or an equivalent agentic developer.

```text
user supplies
  business purpose + offers/services + audiences/locations
  workflows/integrations + proof/constraints
  brand/assets/style + repository/deployment goals
  source material and measurable outcomes
        |
        v
Stage 1 ontology agent
  inspect -> research -> propose dimensions, attributes,
  typed relationships, and object-attribute observations
        |
        v
compiler approval boundary
  provenance + materiality + targeting safety
  lexical duplicate baseline + typed graph
  constraints + pruning + bounded opportunity expansion
        |
        v
finite selected opportunity space
  at least the project minimum page count
  packed HRR region vectors
        |
        v
one SiteGenerationPlan
  one PageConceptJob per selected region
  deterministic bounded agent/API batches
        |
        v
Stage 2 page-concept agent
  question + intent + route + information object/task
  graph role + conversion path + modules/UI capabilities
        |
        v
compiler expression/distinctness boundary
  CandidatePageSeed -> PageCoordinate/corpus/job/manifest/PageIR/UI
        |
        v
complete static-first website project
```

The user does not hand-author ontology axes, vectors, page coordinates, page matrices, packed IR, or generation jobs.

A framework **job** means one finite site-creation run. The current scale target is at least 10,000 canonical page-region jobs in that run. It does not mean 10,000 concurrent visitors, request-time generation, or an always-on VPS.

## Current production-oriented source path

```text
ProjectInput
  minimumInitialPages / maximumInitialPages
  business + brand + technical + goals
  source/evidence/asset ledgers
        |
        v
AgentOntologyProposal
  attributes + dimension hints
  typed relations + weighted observations
        |
        v
ApprovedOntology
  provenance/materiality/safety/reviewer gates
  TF-IDF/BM25 baseline
  rejected attribute/relation/observation ledgers
        |
        v
CompiledOntologyGraph
  explicit + co-occurrence + lexical channels
  requires/excludes constraints
  k-core pruning + deterministic connected macro-regions
        |
        v
ProductionOpportunitySpace
  bounded frequent closed itemsets
  cached constrained graph expansion
  anchor/evidence/materiality/coherence eligibility
  incremental sparse concave coverage
  local duplicate screen + packed HRR vectors
        |
        v
SiteGenerationPlan
  one PageConceptJob per region
  bounded neighbor context
  deterministic batches
        |
        v
validated Stage-2 PageConceptProposals
  complete region expression
  distinct question/route/information/utility
        |
        v
CandidatePageSeed
  -> existing explicit-primary PageCoordinate
  -> SelectedCorpusPlan and typed graph
  -> PageGenerationJobs and bounded agent runner
  -> unified manifest / SiteSource / PageIR
  -> static HTML, schema, sitemap, instructions, and UI
```

Controlling implementation authority: `24-agent-discovered-ontology-and-10k-site-program.md`.

## Research and implementation verdict

### Canonical now

- deterministic TF-IDF/BM25 lexical baseline;
- typed evidence graph and separate requires/excludes plane;
- weighted object-attribute observations;
- bounded frequent closed itemsets;
- k-core pruning with business-anchor retention;
- deterministic connected components as descriptive macro-regions;
- graph-constrained best-first conjunction expansion;
- sparse concave-over-modular corpus coverage;
- HRR/HDC/VSA after eligibility and pruning;
- two agent stages with compiler validation between and after them;
- TypeScript as the current semantic and production oracle.

### Comparison or research arms

- Leiden for exploratory graph partitioning, not page truth;
- sparse K-means, DBI-SC, or HDBSCAN for actual customer-row segmentation studies;
- learned embeddings after lexical/graph pruning;
- HNSW/ANN only when exact sparse retrieval fails a measured build budget;
- GNN, ontology completion, and GraphRAG as proposal/research helpers;
- Blackwell or other local GPU inference as an optional Stage-1/Stage-2 execution provider;
- Zig/Wasm as a benchmarked numeric-kernel option, not a default architecture.

### Rejected as current authority

- full Cartesian page matrices;
- community membership as semantic or publication truth;
- protected, private, or covertly inferred targeting axes;
- dense ML or clustering before typed eligibility;
- runtime prose/page generation;
- mandatory Rust, Wasm, ANN, or GPU infrastructure;
- unverified model-cost, throughput, hardware-cost, or crate claims.

## Source map

| Area | Primary source |
|---|---|
| Validation model | `reference/src/validation-contracts.ts` |
| Project truth and site bounds | `reference/src/project-input.ts` |
| Sparse lexical baseline | `reference/src/sparse-lexical.ts` |
| Stage-1 ontology compiler | `reference/src/ontology-discovery.ts` |
| Ontology graph and constraints | `reference/src/ontology-graph.ts` |
| Transparent opportunity baseline | `reference/src/opportunity-space.ts` |
| Production candidate generation | `reference/src/opportunity-generation-optimized.ts` |
| Production sparse selection | `reference/src/opportunity-space-optimized.ts` |
| Production opportunity compiler | `reference/src/opportunity-space-production.ts` |
| Stage-2 jobs and proposal compiler | `reference/src/site-program.ts` |
| Sparse neighbor/batch planner | `reference/src/site-program-optimized.ts` |
| Two-stage orchestration | `reference/src/agent-site-orchestrator.ts` |
| Wasm/runtime decision gate | `reference/src/acceleration-decision.ts` |
| Existing context/calibration authority | `reference/src/context-corpus.ts` |
| Existing explicit-primary coordinates | `reference/src/page-coordinate.ts` |
| Existing finite corpus optimizer | `reference/src/corpus-plan.ts` |
| Existing job runner | `reference/src/page-generation.ts` |
| Manifest/PageIR/static compiler | `reference/src/manifest.ts`, `reference/src/framework.ts` |
| Static UI compiler | `reference/src/ui-scaffold.ts`, `reference/src/ui-metaprogramming.ts`, `reference/src/ui-renderer.ts` |
| Adversarial and scale fixtures | `reference/fixtures/agent-site-fixture.mjs` |
| Tests | `reference/test/agent-site-program.test.mjs`, `reference/test/acceleration-decision.test.mjs` |

## Exact source proof

Validated source head before documentation: `dcc8beded51290f8084a421996c51c18b2afed83`  
GitHub Actions run: `29628832989`

```text
strict TypeScript build: pass
Node tests: 46/46
manifest emission: pass
UI emission: pass
orchestration check: pass
framework validate: pass
framework preview: pass
browser target check: pass
R3F build: pass
artifact upload: pass
```

Final recorded one-site scale fixture:

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
packed 64D Float32 HRR   2,560,000 bytes
```

The original implementation recorded approximately 29 seconds on the same workflow class before the targeted sparse/algorithmic pass. The final recorded source path is about 5.5 times faster. These are synthetic CI compiler timings, not hardware, content, search, or commercial claims.

The optimized candidate generator also produces the exact ordered region hashes of the transparent baseline on the adversarial fixture.

## Wasm decision

Current disposition: **keep TypeScript; do not promote Wasm yet**.

The final run measured 49.358 ms for a 1,000-region HRR sample. A linear 10,000-region estimate is roughly 0.49 seconds, about 9% of the recorded full build. That estimate is not a direct standalone 10,000-kernel benchmark.

Wasm promotion requires all of the following:

```text
isolated production numeric kernel
contiguous typed-array boundary
20+ repeated JavaScript/Wasm runs
bridge/copy/startup time included
exact selection-hash parity
vector cosine >= 0.999999
>= 1.25x kernel speedup after bridge costs
>= 500 ms absolute full-build savings
complete TypeScript fallback retained
```

The existing Zig/Wasm source remains a research arm. No compiled native/Wasm parity or performance acceptance is claimed.

## Validation model

Every implemented feature records:

```text
feature and workflow step
algorithm choice
user-visible effect
developer/agent effect
validation vector
pass vector
fail vector
simpler baseline
hard/soft severity
measured findings and stable report hash
```

New validation families cover:

- project one-shot page bounds;
- ontology provenance, discovered dimensions, materiality, safety, lexical duplicate handling, relations, and observations;
- graph channels, constraints, pruning, and macro-regions;
- observed seeds, constrained expansion, eligibility, HRR parity, novelty, sparse selection, and 10k scale;
- Stage-2 region expression, distinctness, seed compilation, local context, and batching;
- stage profiling, algorithm-first optimization, dense-kernel isolation, bridge-inclusive Wasm benefit, numeric parity, and fallback.

## Key pass/fail boundaries

Pass:

- the first agent discovers dimensions and relationships from project truth;
- every accepted attribute is provenance-bearing and materially page-changing;
- protected/private/inferred-sensitive attributes are rejected;
- demographic/lifestyle axes require explicit public-targeting approval, reviewer approval, and stronger materiality;
- candidates originate in observations or bounded graph expansion;
- eligibility runs before HRR similarity or page admission;
- the declared 10,000-page minimum is satisfied before Stage-2 generation;
- every Stage-2 proposal expresses its exact selected region and bounded evidence;
- selected page concepts carry distinct information or utility;
- the full plan is finite, deterministic, static-first, and runtime-independent;
- acceleration follows measured end-to-end benefit, not language preference.

Fail:

- the user must invent vector axes, page coordinates, or page matrices;
- an agent suggestion becomes ontology truth without compiler checks;
- community detection becomes semantic or publication authority;
- demographics become cosmetic stereotype variables;
- an unrestricted Cartesian product becomes the corpus;
- a vector without evidence, utility, intent, conversion, and material effects becomes a page;
- runtime generation or an always-on server becomes necessary for canonical HTML;
- synthetic timing is described as indexing, ranking, content-quality, conversion, or revenue proof;
- Rust/Wasm/GPU/ANN is promoted before a simpler baseline fails measured acceptance.

## Operator commands

From `GTM-RESEARCH/website-framework/reference`:

```bash
npm install
npm test
npm run framework:doctor
npm run framework:plan
npm run framework:validate
npm run framework:preview
npm run orchestration:check
npm run manifest:emit
npm run ui:emit
npm run browser:check
npm run ui:r3f:build
npm run benchmark:scale
```

The source fixtures prove the APIs and rejection behavior. Real projects still require source ingestion, provider adapters, reviewed observations, and a canonical output transaction.

## Still pending

- arbitrary repository/site/business-source ingestion into `ProjectInput` and `AgentOntologyProposal`;
- real Stage-1 and Stage-2 provider adapters;
- real independently collected customer/search observations and assessors;
- successful Stage-2 output transaction into canonical evidence, information objects, modules, tasks, and pages;
- 10,000 generated page bodies/UIs rather than 10,000 validated page-region jobs;
- browser screenshot, accessibility, Core Web Vitals, and crawler acceptance at scale;
- native Zig or Wasm compilation/parity/performance in CI;
- Leiden, sparse clustering, learned semantic, HNSW, or GPU arms beating the production baseline;
- indexing, ranking, AI citation, conversion, gross profit, revenue, or customer outcomes.

## Read order

1. root/scoped `identity.md`, `AGENTS.md`, and `CODEGRAPH.md`;
2. this README;
3. `memory/MEMORY.md` and newest immutable handoff;
4. `24-agent-discovered-ontology-and-10k-site-program.md`;
5. `validation/reports/2026-07-17-agent-ontology-10k-site-program.md`;
6. `23-groundwork-orchestration-implementation.md`;
7. `22-agent-operated-framework-workflow-validation-matrix.md`;
8. `21-vector-to-generation-job-compiler.md`;
9. `20-agent-operated-vector-site-generation-and-wasm.md`;
10. `site-manifest.yaml` and `reference/README.md`.

## Next gate

```text
real repository/source ingestion
-> Stage-1 provider adapter
-> reviewed real ontology proposal and observations
-> 100–500 real noindex PageConceptJobs
-> Stage-2 provider adapter and canonical transaction
-> information-gain/cannibalization/content evaluation
-> browser/accessibility/performance validation
-> expand generation and emission to 10,000 complete static pages
-> separate matched field publication and commercial measurement
```
