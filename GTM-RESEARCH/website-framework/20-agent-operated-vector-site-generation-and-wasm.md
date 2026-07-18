# 20 — Agent-Operated Vector Site Generation and Wasm

Status: canonical product-usage and execution model; orchestration implementation pending
Updated: 2026-07-17

## Product definition

The framework is operated through a repository-aware coding agent such as Codex, Claude Code, Pi, or an equivalent agentic developer.

The user supplies business and brand truth. The agent constructs and operates the website compiler.

```text
user input
  business purpose, offers, services, locations, audiences, workflows,
  integrations, proof, constraints, assets, voice, visual rules,
  existing repository/site, deployment target, and success criteria
        |
        v
agentic developer
  inspect -> normalize -> research -> propose -> compile -> validate
  -> repair -> review -> emit -> measure
        |
        v
vector-native website framework
  governed source/evidence/asset ledgers
  -> context and opportunity space
  -> finite page corpus
  -> evidence-bounded content
  -> graph + UI + utility contracts
  -> deterministic static and interactive emissions
```

The user should not need to hand-author `site-manifest.yaml`, vector prototypes, page matrices, semantic modules, or renderer plans. Those are typed intermediate and compiled project state generated and maintained by the agent under framework validation.

## Correct meaning of hyper-targeted

The framework targets coherent prospect situations, not secretly inferred individuals.

Recommended dimensions include:

- industry or operating domain;
- concrete problem;
- task or use case;
- buyer/operator role;
- decision or workflow stage;
- location when it changes the answer;
- integration or software environment;
- constraint, risk, or proof requirement;
- desired outcome;
- service, offer, or public AI Employee capability.

Do not treat protected traits, sensitive demographics, fingerprinted behavior, private history, or named-person profiles as page-generation dimensions.

A useful landing-page coordinate may be:

```text
painting contractor
+ needs estimate from job notes
+ uses QuickBooks
+ owner-review required
+ evening office workflow
+ wants a customer-ready estimate and follow-up
```

That coordinate is more useful than a broad keyword page because it can support a distinct explanation, workflow, example, utility, integration path, proof boundary, and conversion action.

## Does the system make sense?

### Yes, as a corpus compiler and optimizer

The combinatorial space of services, problems, roles, stages, locations, integrations, constraints, and offers is much larger than the number of pages a site should publish.

The framework can use structured vector representations, typed facets, lexical/semantic relevance, graph relationships, and submodular objectives to:

1. represent candidate prospect situations;
2. measure which existing pages already satisfy them;
3. identify coherent uncovered regions;
4. reject redundant or isolated combinations;
5. choose a finite page set with high marginal coverage;
6. provide each generation agent a bounded page-specific context pack;
7. compile the accepted pages into a coherent site.

The valuable output is not every Cartesian product. It is the smallest maintainable corpus that covers valuable, independently supported prospect contexts with distinct utility and evidence.

### No, as a magical page-writing or demographic-personalization algorithm

HDC/VSA and HRR provide compositional distributed representations. They do not independently understand market demand, factual truth, human usefulness, search relevance, or conversion.

The system must remain hybrid:

```text
hard eligibility and ontology rules
+ source/evidence graph
+ lexical relevance
+ learned semantic relevance
+ role-bound HDC/VSA structure
+ business-value weighting
+ facility-location / CSI selection controls
+ human and field validation
```

Random-symbol HRR similarity cannot replace learned language semantics. It is useful for preserving typed conjunctions and structured relations after an ontology maps real concepts into the space.

## Agent-operated generation lifecycle

### 1. Project intake

The agent creates a normalized `ProjectInput` from:

- business and offer facts;
- source documents and existing pages;
- customer questions and workflows;
- proof, limitations, pricing, and approval boundaries;
- brand tokens, assets, component rules, and copy standards;
- technical stack, browsers, hosting, and performance budgets.

Every source receives stable identity, provenance, freshness, applicability, and confidence metadata.

### 2. Independent context corpus

Before generating pages, the agent builds or imports a reviewable context corpus:

```text
query or task
+ explicit non-sensitive context
+ problem/use-case/stage/location/integration/constraint
+ business value
+ source provenance
+ graded relevance expectations
```

This corpus must not be created solely by the same page-generation step. Frozen train/validation/test splits and independent judgments are required before it can become acceptance authority.

### 3. Ontology and hyper-vector compilation

The agent proposes governed axes, values, synonyms, exclusions, and role weights. The compiler creates namespace/version-bound symbols and multi-prototype representations for context regions, existing pages, and candidate pages.

### 4. Candidate generation

The agent generates candidate nodes from:

- uncovered context regions;
- real customer tasks;
- service and offer intersections;
- integration-specific workflows;
- location-specific operational differences;
- comparison and decision requirements;
- reusable public AI Employee tasks;
- original datasets, calculators, templates, examples, and proof objects.

Candidates are proposals, not pages.

### 5. Candidate filtering and corpus selection

Use a staged computation funnel:

```text
A. typed eligibility / prohibited combinations
B. source and evidence sufficiency
C. lexical + semantic prefilter
D. multi-prototype vector compatibility
E. duplicate/cannibalization and graph checks
F. marginal facility-location coverage
G. CSI/random/stratified/diversity batch comparisons
H. lifecycle cost and commercial/mission value
I. human review
```

This avoids performing a full dense comparison over every mathematically possible combination.

### 6. Content and utility generation

For each accepted noindex node, the agent receives a bounded generation packet:

- canonical question and target prototypes;
- approved claims and evidence;
- information/utility object;
- required modules and graph edges;
- nearby pages and cannibalization exclusions;
- brand and design capabilities;
- CTA and offer boundary;
- publication and validation rules.

The agent generates typed modules, examples, task instructions, metadata, schema, media requests, and UI requirements. It does not directly publish HTML.

### 7. UI metaprogramming

The renderer derives layout, components, responsive behavior, media slots, interaction affordances, and optional visualization from semantic modules, page geometry, browser policy, and the supplied design system.

The design system is a renderer input and constraint set. It does not replace the page information model.

### 8. Deterministic compilation and repair

The framework compiles the entire affected dependency closure and returns machine-readable failures. The coding agent repairs sources or proposals and recompiles until all hard gates pass.

### 9. Emission and field publication

Approved nodes emit complete static HTML, CSS, metadata, schema, sitemap entries, instruction projections, optional interactive task manifests, and packed vector/graph artifacts.

Noindex research pages become indexable only through a separate publication decision.

### 10. Measurement and topology update

Search, citation, interaction, lead, revenue, gross-profit, and maintenance evidence updates the context corpus and page topology. It does not silently rewrite canonical truth at request time.

## Public AI Employee utility layer

A page such as “How to create a painting estimate with AI” can be more than content.

```text
canonical static page
  explanation + inputs + limitations + workflow + examples + proof
        |
        v
bounded public employee task
  upload/type job notes
  -> stream progress
  -> produce typed estimate draft
  -> show assumptions and validation
  -> user edits/approves/downloads
  -> Start Free or managed transition
```

A QuickBooks page may expose a different bounded employee task, input schema, artifact, integration explanation, and safety boundary.

The runtime employee engine may be shared, but each canonical page must have a materially distinct question, task contract, input/output shape, evidence, examples, or decision utility. A shared chat widget with noun-swapped copy is not unique page value.

## Why Wasm is relevant

Wasm is justified by a repeated, data-parallel math workload and portability requirement, not by the word “vector.”

The strongest uses are build-time and agent-loop computations:

- role/filler binding and superposition;
- vector normalization and batched dot products;
- multi-prototype context/page scoring;
- top-k candidate retrieval after typed prefiltering;
- duplicate and cannibalization matrices;
- facility-location marginal gains;
- CSI batch-selection kernels;
- clustering and validation sweeps;
- packed IR/vector serialization and parity checks.

Wasm SIMD provides portable 128-bit vector operations. Cloudflare Workers supports Wasm SIMD, but Workers are single-threaded and Wasm module size can increase startup cost. Therefore request-time Wasm must remain small and benchmarked.

### Dual-target kernel

Use one Zig source package with three controls:

```text
TypeScript typed-array oracle
Zig native CLI        -> fastest local/CI bulk compilation candidate
Zig Wasm SIMD module  -> portable deterministic kernel for agent sandboxes,
                         browser diagnostics, CI, and compatible edge runtimes
```

Native Zig may outperform Wasm in a local coding-agent environment. Wasm's principal architectural benefit is one sandboxed deterministic kernel across hosts, not guaranteed superiority over native code or optimized JavaScript.

### Where Wasm should not be used

Do not put these in the Wasm kernel unless profiling proves otherwise:

- LLM inference or provider calls;
- web research and network I/O;
- YAML/JSON orchestration;
- source-document parsing;
- claim/evidence policy;
- prose generation;
- HTML/CSS rendering;
- repository mutations;
- static asset delivery.

Keep those in the agent/orchestration and deterministic TypeScript layers.

## Scale economics

Page count alone does not justify Wasm.

A corpus of 1,000 pages compared with 500 context cases at 512 dimensions requires roughly 256 million scalar dimension operations for one exact all-pairs pass. A 2,000-page corpus against 10,000 context cases requires roughly 10.24 billion. Repeated optimization, ablation, duplicate analysis, and agent repair loops multiply this cost.

At the same time, blindly scoring every proposed Cartesian product is incorrect. Typed eligibility, sparse facet indexes, lexical/semantic prefilters, and graph partitions should reduce the dense vector stage to a bounded shortlist.

Recommended computation path:

```text
millions of possible combinations
-> hard typed pruning
-> tens of thousands of plausible candidates
-> cheap lexical/facet/graph prefilter
-> hundreds or low thousands of vector-scored candidates
-> tens or hundreds of selected nodes
-> static page emissions
```

## Delivery architecture

The public website should remain static-asset-first.

```text
build/agent loop
  native or Wasm SIMD vector kernel
  -> selected corpus + deterministic HTML emissions

request path
  static HTML/CSS/assets from edge cache
  -> optional explicit-session public employee API
  -> optional finite noncanonical UI variant resolver
```

Wasm should not be required to serve canonical pages. Static assets are cheaper, easier to cache, and more robust. Edge Wasm is reserved for a measured finite resolver or computational public utility—not canonical content generation.

## Search-distribution boundary

Google's current guidance permits useful automation but warns against scaled low-value content and creating separate pages for every possible query variation. Therefore the vector system's most important SEO function is rejection.

Every indexable page must provide at least one materially distinct object:

- executable task or public AI Employee utility;
- calculator, estimator, checker, or template;
- original data or field evidence;
- integration-specific workflow;
- location-specific operational answer;
- distinct comparison or decision model;
- unique proof, example, artifact, or failure/recovery path.

Pages that only substitute industry, city, software, or audience nouns fail.

## Validation vector

### System comparison arms

Run the same project through:

1. agent + conventional sitemap/content planning;
2. typed facets and deterministic rules;
3. lexical/BM25 planning;
4. learned semantic embeddings;
5. graph-only materialization;
6. HRR/HDC structured compatibility;
7. hybrid facets + lexical + semantic + graph + HRR;
8. hybrid plus facility-location selection;
9. hybrid plus CSI batch/split controls.

### Execution arms

Benchmark:

- TypeScript arrays/objects;
- TypeScript typed arrays;
- Zig native scalar;
- Zig native SIMD;
- Wasm scalar;
- Wasm SIMD;
- optional GPU arm only after CPU baselines.

Measure:

- exact ranking/parity;
- corpus selection stability;
- full and incremental compile time;
- total vector operations and candidates pruned;
- peak memory and bytes copied;
- kernel/module size and initialization;
- agent repair-loop duration;
- pages accepted/rejected and rejection reasons;
- human relevance and distinctness;
- indexation, query diversity, qualified interaction, and lifecycle return.

## Pass vector

The architecture passes when:

- a coding agent can regenerate the entire site from approved project inputs without hand-authoring pages;
- every emitted page traces to sources, context cases, prototypes, evidence, information/utility objects, graph role, UI requirements, and publication state;
- the optimizer rejects most unsupported Cartesian combinations;
- accepted pages improve held-out context coverage and remain human-distinguishable;
- each indexable page has distinct useful content or functionality;
- all math implementations preserve declared tolerance and ordering;
- Zig native or Wasm SIMD materially improves realistic end-to-end agent/compiler workloads over the TypeScript typed-array control;
- static canonical pages require no Wasm, model call, database call, or client hydration;
- incremental rebuilds touch only the dependency closure;
- the full corpus remains maintainable and measurable after publication.

## Fail vector

The architecture fails when:

- “demographic unique” means hidden personal or sensitive-trait targeting;
- vectors merely encode a Cartesian keyword matrix;
- the same agent invents the page and all evidence used to validate its relevance;
- random HRR similarity is treated as learned semantic understanding;
- page count is optimized instead of marginal useful coverage;
- pages differ only by nouns, metadata, or cosmetic UI;
- a fake or generic chatbot is presented as unique page utility;
- Wasm adds startup, copying, memory, or debugging cost without end-to-end gain;
- edge computation replaces cacheable static HTML;
- canonical content changes by visitor identity or crawler status;
- passing synthetic tests is described as ranking, conversion, or revenue proof.

## Research basis and limits

- Context-document compatibility baseline: https://arxiv.org/abs/2309.05113
- HDC/VSA applications survey: https://arxiv.org/abs/2112.15424
- Complement Submodular Information: https://arxiv.org/abs/2605.24779
- WebAssembly Core/SIMD: https://www.w3.org/TR/wasm-core/
- Cloudflare Workers Wasm: https://developers.cloudflare.com/workers/runtime-apis/webassembly/
- Google AI content guidance: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- Google generative-search optimization guidance: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google spam policies: https://developers.google.com/search/docs/essentials/spam-policies

These sources support the component techniques and external constraints. They do not establish that this combined framework will create ranking or commercial lift. That remains a field experiment.

## Immediate implementation sequence

```text
1. formal ProjectInput / source / asset / evidence intake contracts
2. agent orchestration lifecycle and checkpoint state
3. explicit primary-prototype semantics
4. independent frozen context corpus and calibrated relevance
5. typed semantic graph/path contracts
6. vector-kernel benchmark harness: TS vs Zig native vs Wasm scalar/SIMD
7. candidate funnel and batch corpus optimizer
8. bounded content-generation packets and repair loop
9. public AI Employee task-surface IR
10. first 20–40 noindex generated site cohort
11. browser/accessibility/performance validation
12. separate matched field publication
```