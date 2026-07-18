# 25 — Academic Crosswalk: Agent Harness, Structured Generation, Vector Space, and Acceleration

Status: verified research crosswalk; implementation authority remains source + validation reports  
Updated: 2026-07-18  
Scope: `GTM-RESEARCH/website-framework/`

## 1. Purpose

This document records which external research actually supports the framework, which conclusions remain inferences, and which implementation choices are only comparison arms.

The framework's canonical product model is:

```text
business/brand/source truth
-> Stage-1 agent proposes ontology, relations, and observations
-> deterministic compiler approves/rejects ontology state
-> sparse lexical + typed graph + constraints organize the space
-> bounded conjunction expansion creates candidate regions
-> sparse coverage and nonredundancy select a finite site corpus
-> HRR/HDC/VSA encodes approved region structure
-> Stage-2 agent maps each selected region to a page concept
-> deterministic compiler validates expression, evidence, utility, graph, and UI contracts
-> existing PageCoordinate/PageGenerationJob/PageIR/static renderer emits the site
```

No single paper validates that full system. The architecture is a synthesis whose components require independent pass/fail evidence.

## 2. Research-intake rule

Externally generated bibliographies are lead lists, not authority.

A citation may influence canonical architecture only when all of the following hold:

```text
exact paper/title/author identity verified
primary source or publisher page available
claimed result is actually present in the source
result applies to the same problem class
implementation has a named simpler baseline
framework validation/pass/fail vectors are updated
source code or field evidence demonstrates the claimed effect
```

Unverified titles, costs, throughput, hardware claims, crate names, and proposed action items remain notes only.

## 3. Verified primary research and exact applicability

### 3.1 HDC/VSA and HRR

Denis Kleyko, Dmitri A. Rachkovskij, Evgeny Osipov, and Abbas Rahimi:

- Part I, models and data transformations: https://arxiv.org/abs/2111.06077
- Part II, applications, cognitive models, and challenges: https://arxiv.org/abs/2112.15424

Established:

- high-dimensional distributed representations are a legitimate representation family;
- binding, bundling/superposition, permutation, associative retrieval, and role-filler composition are established operations;
- HRR is one member of the HDC/VSA family;
- fixed-width compositional state and hardware-oriented implementations are valid research directions.

Not established:

- page eligibility;
- search demand;
- content quality;
- Google/Bing indexing or ranking advantage;
- conversion or revenue lift;
- that HRR should replace typed constraints, evidence, lexical baselines, or graph structure.

Framework decision:

```text
retain HRR after ontology safety/materiality/evidence/graph eligibility
retain typed attribute sets as inspectable authority
require packed-vector parity and versioned symbol namespace
never treat vector similarity alone as page-publication authority
```

### 3.2 Context-document compatibility

Deguang Kong, Daniel Zhou, Zhiheng Huang, and Steph Sigalas, “Personalized Search Via Neural Contextual Semantic Relevance Ranking”:

https://arxiv.org/abs/2309.05113

Established:

- query/document relevance and document/context compatibility are distinguishable signals;
- lexical and semantic context signals can be combined and ablated;
- held-out and out-of-domain evaluation are appropriate controls.

Not established:

- construction of a public website corpus;
- demographic page generation;
- HRR as the representation;
- SEO lift;
- zero-volume page strategy.

Framework decision:

- preserve the independent `ContextCorpus`, frozen splits, scorer identity, and held-out calibration path;
- treat context compatibility as an evaluation layer over proposed pages, not evidence that a page should exist;
- do not call an isotonic mapping a production probability without representative independent labels.

### 3.3 Submodular coverage and CSI

Rishabh Iyer et al., “Submodular Combinatorial Information Measures with Applications in Machine Learning”:

https://arxiv.org/abs/2006.15412

Rishabh Iyer, “Complement Submodular Information Measures for Balanced and Robust Data Selection”:

https://arxiv.org/abs/2605.24779

Established:

- facility-location, set-cover, graph-cut, saturated-coverage, and related objectives are legitimate tools for finite representative selection;
- concave-over-modular feature coverage has diminishing returns;
- complement-aware CSI objectives are relevant to hidden-slice balance and suppressing isolated outliers in the reported selection settings.

Not established:

- a selected region deserves a landing page;
- the framework's composite objective inherits every guarantee of an individual monotone submodular objective;
- CSI improves this website corpus without a representative hidden-slice benchmark.

Framework decision:

- retain sparse concave feature coverage as the scalable production baseline;
- retain exact/small-instance controls and rare-tail/noise fixtures;
- keep CSI as a comparison arm for train/validation/test construction and publication-cohort selection;
- do not claim CSI superiority until it beats the current objective on frozen real hidden slices and does not increase isolated/noisy page admission.

### 3.4 Graph community detection

Vincent Traag, Ludo Waltman, and Nees Jan van Eck, “From Louvain to Leiden: guaranteeing well-connected communities”:

https://doi.org/10.1038/s41598-019-41695-z

Established:

- Leiden improves graph-partition quality and provides connectivity-related guarantees compared with Louvain for its graph objectives.

Not established:

- a community is a coherent customer segment;
- a community corresponds to one search intent or page family;
- modularity or CPM is a publication objective.

Framework decision:

- deterministic connected components remain the current descriptive macro-region baseline;
- Leiden may be benchmarked as an exploratory partitioner;
- no community ID may become page, market, or semantic truth without independent materiality/evidence/context validation.

### 3.5 Deterministic harnesses and external verification

Fan Huang, “ReFlect: An Effective Harness System for Complex Long-Horizon LLM Reasoning”:

https://arxiv.org/abs/2605.05737

Chenyu Zhou et al., “Externalization in LLM Agents: A Unified Review of Memory, Skills, Protocols and Harness Engineering”:

https://arxiv.org/abs/2604.08224

Kaya Stechly, Karthik Valmeekam, and Subbarao Kambhampati, “On the Self-Verification Limitations of Large Language Models on Reasoning and Planning Tasks”:

https://arxiv.org/abs/2402.08115

Established or strongly supported:

- externalized state, skills, protocols, and deterministic harness logic can reduce reliance on a model reconstructing system state internally;
- self-critique by the same model is not a sound correctness oracle;
- sound external verification can materially outperform prompt-only self-correction in the studied tasks.

Framework decision:

```text
agent proposes
-> compiler validates schema, provenance, safety, graph constraints, evidence, and corpus state
-> failed output receives explicit repair findings
-> publication remains separate
```

The framework must not mark a page, ontology, or repair as correct because the producing model says it is correct.

### 3.6 Structured generation

Saibo Geng et al., “Generating Structured Outputs from Language Models: Benchmark and Studies” / JSONSchemaBench:

https://arxiv.org/abs/2501.10868

Established:

- JSON-Schema-constrained generation is an important implementation approach;
- schema coverage, constraint compliance, generation quality, and efficiency are separate evaluation dimensions;
- structured decoding frameworks differ materially across real-world schemas.

Framework decision:

- Stage-1 and Stage-2 provider adapters should emit typed schema-bound proposals;
- successful parsing is necessary but not sufficient;
- provider acceptance must measure schema coverage, invalid-output rate, repair rate, semantic drift, evidence-reference integrity, latency, and token use;
- `AgentOntologyProposal`, `PageConceptProposal`, pass artifacts, and future `PageIR` transactions remain compiler-validated after decoding.

### 3.7 Agent-system ontology

Andreas Ekelhart, Kabul Kurniawan, Fajar J. Ekaputra, and Elmar Kiesling, “AgentO: An Ontology for Modeling Agentic AI Systems,” ESWC 2026:

https://eprints.cs.univie.ac.at/8749/

Established:

- agents, tasks, workflows, and resource dependencies can be represented with a formal ontology for reconstruction, reuse, and auditing.

Framework decision:

- use AgentO as a vocabulary/interoperability comparison for agent, task, workflow, resource, dependency, and audit entities;
- do not replace the website's business/prospect ontology with AgentO;
- add an adapter only after the internal Stage-1/Stage-2 contracts stabilize and an interoperability use case exists.

### 3.8 Structured language-model execution

Lianmin Zheng et al., “SGLang: Efficient Execution of Structured Language Model Programs”:

https://arxiv.org/abs/2312.07104

Established:

- structured multi-call model programs can benefit from execution runtimes, parallelism controls, constrained decoding, and KV-cache reuse;
- repeated shared prefixes can be exploited by the provider/runtime layer.

Framework decision:

- SGLang or an equivalent runtime may become a Stage-1/Stage-2 execution provider;
- it is not a compiler, ontology, evidence, page-selection, or publication authority;
- compare it only after real provider adapters exist, using complete site-run cost, throughput, failure recovery, cache hit rate, and output-quality metrics.

### 3.9 WebAssembly

Official WebAssembly specifications:

https://webassembly.org/specs/

Established:

- WebAssembly supplies a portable execution format and JavaScript/Web/WASI embedding interfaces;
- SIMD and typed numeric kernels are valid implementation targets.

Not established:

- automatic speedup over current JavaScript/V8;
- benefit for map/set/string/hash/heap-heavy compiler work;
- acceptable bridge, copy, startup, toolchain, and fallback cost.

Framework decision:

- TypeScript remains the semantic and production oracle;
- benchmark Wasm only for an isolated, contiguous, sufficiently expensive numeric kernel;
- include bridge/copy/startup time and full-build savings;
- require exact selection-hash parity and vector cosine parity;
- retain complete TypeScript fallback.

## 4. Validation-vector crosswalk

| Feature/workflow | Validation vector | Pass vector | Fail vector | Current status |
|---|---|---|---|---|
| Stage-1 ontology agent | source IDs, evidence IDs, dimensions, confidence, material effects, sensitivity, reviewer state | proposal is explicit; compiler approves/rejects; rejected ledger preserved | prompt-only ontology becomes truth | source-wired; real provider/reviewer pending |
| Lexical ontology baseline | tokenization, TF-IDF, BM25, label overlap, source-order determinism | related concepts exposed; exact/near duplicates require label evidence | boilerplate descriptions collapse distinct concepts | pass on adversarial fixture |
| Typed graph | relation type, endpoints, weight, provenance, constraints, core number | explicit/co-occurrence/lexical channels; requires/excludes separate | similarity overrides hard constraint | pass on synthetic fixtures |
| Opportunity expansion | observed seeds, graph neighbors, dimension uniqueness, constraint checks, candidate cap | bounded connected expansions | unrestricted Cartesian product | pass on 15k-candidate fixture |
| Region eligibility | anchor, evidence, material effects, coherence, safety | all hard gates pass before vectors/pages | mathematically possible point becomes page | pass on synthetic fixtures |
| HRR/VSA | namespace/version, role-filler atoms, dimensions, finite values, packed parity | one deterministic vector per accepted region | vectors replace evidence/constraints or drift under packing | pass on synthetic fixtures |
| Corpus selection | sparse coverage keys, marginal gain, tail/noise controls, determinism | minimum/maximum respected; nonredundant selected set | dense quadratic matrix or quota admits noise | pass for synthetic 10k planning; external usefulness pending |
| Stage-2 page concept | exact region expression, bounded evidence, route/question, information object/task, graph/UI contracts | one validated proposal per selected region | generic or noun-swapped page; undeclared attributes/evidence | source-wired; real model output pending |
| Harness/repair | external findings, bounded attempts, immutable checkpoints, artifact schema | deterministic verifier controls retries | self-critique is sole acceptance | groundwork pass; provider integration pending |
| Structured decoding | schema coverage, valid-output rate, repair rate, semantic/evidence fidelity, latency/tokens | provider emits typed proposals and compiler accepts | JSON parses but semantic/evidence contract fails | not run |
| Agent execution runtime | shared-prefix cache, throughput, total site cost, failure recovery, quality | execution provider improves full-run metrics without semantic drift | microbenchmark only or provider becomes authority | not run |
| Wasm acceleration | stage profile, kernel share, contiguous bytes, repeated bridge-inclusive runs, parity, full-build savings | policy thresholds met; TypeScript fallback identical | native port encodes wrong complexity or changes hashes | keep TypeScript; native/Wasm acceptance not run |
| Publication/search | complete static HTML, crawler/browser/accessibility, indexability, independent field cohort | materially distinct pages and measured outcomes | synthetic region count described as SEO proof | not run |

## 5. Implementation decisions after research review

Retain as canonical now:

```text
external compiler/harness authority
schema-bearing Stage-1 and Stage-2 contracts
TF-IDF/BM25 baseline
explicit typed graph and hard constraints
weighted observations and bounded closed conjunctions
k-core pruning with anchor retention
bounded graph expansion
sparse concave coverage selection
HRR after eligibility
TypeScript semantic oracle
static-first emission
```

Retain as later provider/benchmark arms:

```text
JSON-schema constrained decoding framework comparisons
SGLang or equivalent cache-aware model runtime
AgentO interoperability adapter
CSI hidden-slice publication-cohort selector
Leiden exploratory macro-partitions
learned embeddings and ANN after sparse pruning
native/Wasm HRR kernels after the acceleration gate
```

Do not implement as authority from the supplied bibliography:

```text
same-model self-verification
hypergraph convolution for synthetic profiles without a labeled benchmark
reasoning-trace storage in PageIR
CoT compression as a page-quality mechanism
RadixAttention inside the static UI compiler
GPU/Blackwell dependency for vector construction
unverified 2026 paper titles, costs, TPS, or crate recommendations
```

## 6. Current measured acceleration decision

Recorded source proof:

```text
15,000 candidate regions
10,000 selected page regions
400 Stage-2 batches
2,560,000 packed-vector bytes
5,284.510 ms total recorded CI planning time
```

The original transparent implementation recorded approximately 29 seconds on the same workflow class. The performance gain came primarily from algorithm and data-structure changes, not a language/runtime port.

The current `acceleration-decision.ts` policy requires:

```text
isolated contiguous numeric kernel
20+ repeated JavaScript/Wasm measurements
bridge/copy/startup included
exact selection-hash parity
vector cosine >= 0.999999
>= 1.25x kernel speedup
>= 500 ms full-build savings
complete TypeScript fallback
```

The current measured HRR share does not pass the kernel-size promotion gate. Therefore the correct disposition remains:

```text
keep TypeScript
retain Zig/Wasm source as research
profile 50k/100k builds before reconsidering
benchmark only the exact production kernel
```

## 7. Research leads retained but not promoted

The externally supplied bibliography includes additional 2024–2026 titles concerning harness engineering, token efficiency, constrained decoding, ontology orchestration, hypergraphs, self-correction, sparse retrieval, and inference runtimes.

Those entries are retained as research leads. They must not be cited as framework authority until their exact publication identity, methodology, results, and applicability are verified. In particular:

- a paper title or arXiv identifier generated by another model is not proof that the paper exists;
- a paper's existence is not proof that its recommendation applies to this compiler;
- an action-item list generated from a bibliography is not an implementation plan;
- implementation still requires a simpler baseline and pass/fail acceptance.

## 8. Next evidence gates

```text
1. real repository/business/source ingestion
2. real Stage-1 provider with schema-constrained output
3. reviewer workflow and independently grounded observations
4. frozen real context/assessment corpus
5. 100-500 noindex Stage-2 page-concept and page-generation jobs
6. canonical successful-output transaction into evidence/modules/tasks/PageIR
7. global contradiction, information-gain, and cannibalization evaluation
8. browser/accessibility/crawler/performance acceptance
9. 10,000 complete static pages, not only page-region jobs
10. matched publication cohorts and search/commercial measurement
11. 50k/100k build profile before reconsidering ANN/native/Wasm/GPU layers
```
