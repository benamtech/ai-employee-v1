# 26 — Graph-Learning Paper Triage and Promotion Gates

Status: verified research triage; no learned graph method promoted to framework authority  
Updated: 2026-07-18  
Scope: `GTM-RESEARCH/website-framework/`

## 1. Why this document exists

The framework uses a graph, but that does not make every graph-learning paper applicable.

The current problem is:

```text
small agent-generated ontology proposal
-> evidence/safety/materiality approval
-> typed sparse graph + hard constraints
-> bounded conjunction expansion
-> finite nonredundant site corpus
-> HRR structural representation
-> Stage-2 page-concept generation
```

Most graph-learning papers instead study supervised node classification, graph classification, anomaly detection, graph-property detection, representation transfer, or clustering on benchmark datasets. Those are different problem classes.

A graph method may enter the production path only when it solves a measured framework failure better than the deterministic baseline while preserving evidence, safety, reproducibility, and complete compiler authority.

## 2. Current baseline that a learned method must beat

```text
TF-IDF/BM25 lexical baseline
+ typed explicit/co-occurrence/lexical graph channels
+ separate requires/excludes plane
+ k-core pruning with business-anchor retention
+ deterministic connected components as descriptive macro-regions
+ bounded frequent closed conjunctions
+ graph-constrained best-first expansion
+ sparse concave-over-modular coverage selection
+ HRR after eligibility
```

Current synthetic one-site proof:

```text
15,000 candidate regions
10,000 selected page regions
400 Stage-2 batches
2,560,000 packed HRR bytes
5,284.510 ms recorded total planning time
```

This is the comparison floor. It is not evidence that the selected pages are useful, indexable, or commercially valuable.

## 3. Verified paper-by-paper triage

### 3.1 GraphTARIF

Zhaolin Hu, Kun Li, Hehe Fan, and Yi Yang, “GraphTARIF: Linear Graph Transformer with Augmented Rank and Improved Focus.”

- arXiv: https://arxiv.org/abs/2510.10631
- problem studied: scalable learned graph attention for node representation/classification, with rank and attention-focus corrections;
- potentially relevant later: a supervised comparison arm if the framework accumulates many independently labeled ontology graphs and a concrete node-classification task;
- not established: ontology truth, page eligibility, evidence integrity, search demand, corpus distinctness, or benefit on small per-project graphs;
- disposition: **do not implement now**.

### 3.2 VSAL

Jiahao Xie and Guangmo Tong, “VSAL: A Vision Solver with Adaptive Layouts for Graph Property Detection.”

- arXiv: https://arxiv.org/abs/2602.13880
- DOI: https://doi.org/10.1145/3774904.3792224
- problem studied: vision-based detection of structural graph properties using adaptive graph layouts;
- potentially relevant later: operator/debug visualization experiments where layout quality affects human inspection;
- not relevant to: ontology approval, region generation, candidate selection, HRR, or page publication;
- disposition: **UI/debug visualization lead only; no compiler role**.

### 3.3 Node-feature-transfer graph foundation model

Jitao Zhao, Yi Wang, Yawen Li, Dongxiao He, Di Jin, Zhiyong Feng, and Weixiong Zhang, “Towards Graph Foundation Model: Node Feature Transfer Invariant Modeling on General Graphs.”

- DOI: https://doi.org/10.1145/3774904.3792236
- problem studied: transferable learned node representations across heterogeneous graphs;
- potentially relevant later: cross-project ontology prior or proposal ranking after a large, versioned, independently assessed multi-site graph corpus exists;
- not established: correctness for one small business ontology, safe demographic discovery, page usefulness, or publication authority;
- disposition: **future cross-project research only**.

### 3.4 Unified graph clustering network

Renda Han et al., “A Unified Graph Clustering Network.”

- DOI: https://doi.org/10.1145/3774904.3792266
- problem studied: learned graph clustering across graph settings;
- potentially relevant later: comparison against connected components and Leiden on real customer/search graphs with frozen external segment labels;
- not established: discovered clusters equal prospect segments, search intents, page families, or canonical routes;
- disposition: **comparison-only after a real labeled benchmark**.

### 3.5 Sustained vertex cover on temporal graphs

Junqiang Peng, Tian Bai, Jingyang Zhao, and Mingyu Xiao, “Sustained Vertex Cover on Temporal Graphs.”

- DOI: https://doi.org/10.1145/3774904.3792250
- problem studied: temporal vertex-cover scheduling where selected vertices have bounded lifespans;
- potentially relevant later: scheduling which sources, pages, or graph regions receive recurring review when the framework has real time-versioned operational history;
- not relevant to: initial ontology construction or static page-region selection;
- disposition: **no current implementation**.

### 3.6 Positive-unlabeled graph classification

Junghun Kim, Shihyung Park, and U Kang, “Dual-level Reweighting for Positive-Unlabeled Graph Classification.”

- DOI: https://doi.org/10.1145/3774904.3792251
- problem studied: graph classification with positive and unlabeled examples using hop- and graph-level reweighting;
- potentially relevant later: candidate-review prioritization after the framework has independently accepted positive pages/regions and a genuinely unlabeled pool;
- not established: that rejected or unreviewed page candidates are negatives, or that PU learning should replace compiler gates;
- disposition: **future triage experiment only after real labels**.

### 3.7 Dynamic graph anomaly detection with prototypes

Jialun Zheng et al., “DP-DGAD: A Generalist Dynamic Graph Anomaly Detector with Dynamic Prototypes.”

- arXiv: https://arxiv.org/abs/2508.00664
- DOI: https://doi.org/10.1145/3774904.3792268
- problem studied: anomaly detection in evolving graphs with dynamic prototype memory;
- potentially relevant later: drift/anomaly detection across versioned ontology, corpus, link, and outcome histories;
- not relevant to: first-run opportunity construction where no temporal normal/anomalous history exists;
- disposition: **future maintenance/monitoring comparison only**.

### 3.8 Spiking graph neural network efficiency

Han Zhao, Xu Yang, Cheng Deng, and Fan Liu, “E²SGNN: Reconciling Expression and Efficiency in Spiking Graph Neural Network.”

- DOI: https://doi.org/10.1145/3774904.3792271
- problem studied: expressive and efficient spiking graph neural networks;
- framework fit: no current supervised graph-learning workload, hardware target, or energy/latency bottleneck requiring a spiking model;
- disposition: **out of scope**.

### 3.9 Streaming graph interaction anomaly detection

Shuai Ren et al., “Anomaly Detection of Interaction Behaviors in Streaming Graphs.”

- DOI: https://doi.org/10.1145/3774904.3792282
- problem studied: anomaly detection over continually arriving graph interactions;
- potentially relevant later: live field/outcome monitoring after the framework has streaming interaction data;
- not relevant to: one-shot static site generation;
- disposition: **future field-monitoring lead only**.

### 3.10 Graph-to-tree self-supervised learning

Yejiang Wang et al., “Graph-to-Tree: Topological Decomposition for Self-Supervised Learning.”

- DOI: https://doi.org/10.1145/3774904.3792286
- problem studied: learned graph representations through topological decomposition and self-supervised objectives;
- potentially relevant later: representation comparison across many real ontology/site graphs;
- not established: better page-region eligibility, evidence handling, or corpus selection in the current framework;
- disposition: **future representation benchmark only**.

## 4. Unified promotion validation vector

Any learned graph, clustering, anomaly, transfer, or transformer method must satisfy the same gate.

| Attribute | Validation vector | Pass vector | Fail vector |
|---|---|---|---|
| Problem-class match | training target, inference target, graph type, labels, temporal/static state | method solves the exact measured framework failure | paper studies a different graph task |
| Data sufficiency | graph count, node/edge count, independent labels, train/validation/test split | enough real independent data for the claimed objective | synthetic fixture or agent-authored labels treated as training truth |
| Baseline dominance | TF-IDF/BM25, typed graph, connected components, sparse coverage, HRR | material held-out gain over the simpler baseline | novelty of architecture is the only argument |
| Semantic integrity | evidence references, hard constraints, safety/materiality gates | learned output remains subordinate to compiler gates | model score overrides evidence or exclusions |
| Tail/noise behavior | head/tail slices, isolated outliers, false admissions | improves hidden-slice coverage without increasing noisy pages | diversity or clustering selects unsupported outliers |
| Determinism/auditability | model/version/data hash, seed variance, explanation artifact | reproducible bounded result with inspectable provenance | unstable cluster/page authority |
| Cost/performance | complete one-site build time, memory, training/inference cost | measurable full-run benefit within budget | benchmark-only accuracy or GPU microbenchmark |
| Publication effect | information gain, cannibalization, browser/crawler quality, field cohort | improves independently assessed pages/outcomes | cluster quality described as SEO or commercial proof |

## 5. Method-specific future gates

### Learned clustering or community detection

Pass only when:

```text
real multi-view graph corpus
+ frozen external segment/page-family labels
+ head/tail/noise slices
+ connected-components and Leiden baselines
+ stability across seeds
+ no safety/evidence regression
```

### Graph transformer or graph foundation model

Pass only when:

```text
many independently reviewed project graphs
+ explicit supervised/self-supervised task
+ cross-project holdout
+ typed-graph baseline
+ ablation of node text, relations, and constraints
+ measurable full-site benefit
```

### Positive-unlabeled classifier

Pass only when:

```text
independently accepted positive set
+ truly unlabeled candidate set
+ no assumption that unreviewed means negative
+ calibrated review-prioritization objective
+ compiler still controls acceptance
```

### Temporal or anomaly model

Pass only when:

```text
versioned graph/corpus/outcome history
+ independently defined anomaly/drift labels
+ temporal holdout
+ simpler change-point/rule baseline
+ action policy for each detected anomaly
```

## 6. Wasm and graph-learning are separate decisions

None of these papers establishes that WebAssembly is the correct execution target.

```text
algorithm/model choice
!=
execution target
```

The current measured bottlenecks were reduced primarily through sparse algorithms and data-structure changes. HRR remains a compact numeric kernel, but its measured share is not yet large enough to pass the existing Wasm promotion policy.

Current Wasm rule remains:

```text
TypeScript is semantic/production oracle
-> isolate exact contiguous numeric kernel
-> 20+ bridge-inclusive JS/Wasm runs
-> exact selection-hash parity
-> cosine >= 0.999999
-> >=1.25x kernel speedup
-> >=500ms absolute full-build savings
-> complete TypeScript fallback
```

## 7. Implementation decision

No new graph-learning model is implemented from this paper set.

That is a positive implementation decision, not an omission. The current source already contains the right extension boundary:

```text
agent proposal
-> deterministic ontology approval
-> sparse typed graph
-> bounded opportunity compiler
-> external validation
```

The next code work remains real repository/source ingestion, Stage-1 provider/reviewer integration, independent context assessment, Stage-2 provider transactions, and a 100–500 page noindex cohort. Those produce the real data required to test learned graph methods scientifically.

## 8. Current claim boundary

Established now:

- the supplied paper titles above are real publications or preprints;
- they define legitimate graph-learning, clustering, transfer, temporal, or anomaly methods;
- none currently dominates the framework's deterministic baseline on its actual task;
- none validates SEO, page usefulness, search demand, or commercial outcomes;
- no learned graph implementation or Wasm promotion is warranted from this evidence alone.

Still pending:

- real ontology and context corpora;
- independent labels;
- graph-method comparison fixtures;
- 100–500 real noindex generated pages;
- complete 10,000-page content/UI emission;
- browser, crawler, accessibility, search, and commercial field evidence.
