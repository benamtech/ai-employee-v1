# Website Framework Durable Memory

format: TOON-oriented Markdown  
status: active  
scope: GTM-RESEARCH/website-framework  
updated_at: 2026-07-18T01:15:00-04:00

## protocol

memory_model{index,handoffs,mutation}:
  "memory/MEMORY.md","memory/YYYY-MM-DD-HHMM-<slug>.md","append immutable handoff; reconcile this index; never rewrite timestamped files"

rules[8]:
  read-MEMORY-first
  read-newest-handoff-next
  timestamped-handoffs-immutable
  never-repurpose-prior-handoff
  index-newest-first
  file-reference-heavy-TOON-style
  no-source-report-duplication
  TOON-context-encoding-not-app-data

## current

state{branch,pr,status,latest_validated_head,workflow_run,tests}:
  agent/ui-metaprogramming-pass-1,17,"draft; two-stage agent ontology/site compiler + 10k planning + academic/graph-method crosswalk pass; real ingestion/providers/content/browser/search/field pending",9cf5e449280c21debb7b908fd35ac2a950126910,29631800270,"46/46"

note:
  "validated head includes graph-paper triage docs and prior memory reconciliation; this memory-index-only commit follows that proof and changes no source or research decision"

job_boundary:
  "one job is one finite full-site creation run with the declared minimum page-region jobs and batched agent/API work; it is not request-time serving or an always-on VPS"

product_boundary:
  "Stage-1 agent discovers ontology from project truth; compiler approves attributes/relations/observations and selects vector regions; Stage-2 agent proposes page concepts; compiler validates expression/distinctness and emits CandidatePageSeeds into the existing coordinate/job/manifest/PageIR/UI path"

pipeline:
  "ProjectInput -> AgentOntologyProposal -> ApprovedOntology -> sparse ontology graph/constraints -> ProductionOpportunitySpace -> SiteGenerationPlan -> PageConceptProposals -> CandidatePageSeeds -> existing PageCoordinate/SelectedCorpusPlan/PageGenerationJob/manifest/PageIR/UI compiler"

research_boundary:
  "external/generated bibliography is a lead list; exact primary source, problem-class applicability, simpler baseline, validation vector, and measured result are required before a claim becomes framework authority"

## handoffs

handoffs[14]{at,file,status,scope}:
  2026-07-18T01:15:00-04:00,2026-07-18-0115-graph-triage-ci-closure.md,current,"exact-head CI closure for graph-paper triage and memory"
  2026-07-18T01:05:00-04:00,2026-07-18-0105-graph-learning-paper-triage.md,current-foundation,"verified WWW 2026 graph papers; learned-method promotion gates; no model promotion"
  2026-07-18T00:55:00-04:00,2026-07-18-0055-academic-crosswalk-harness-acceleration.md,current-foundation,"verified research; external harness; structured generation; Wasm boundary"
  2026-07-17T23:40:00-04:00,2026-07-17-agent-ontology-10k-site-program.md,current-foundation,"agent-discovered ontology; sparse 10k planning; Wasm decision"
  2026-07-17T21:20:00-04:00,2026-07-17-2120-groundwork-orchestration-implementation.md,current-foundation,"implemented orchestration spine; preview/operator UX"
  2026-07-17T20:45:00-04:00,2026-07-17-2045-agent-generation-workflow-ci-closure.md,historical-authority,"pre-implementation workflow authority"
  2026-07-17T20:30:00-04:00,2026-07-17-2030-agent-generation-jobs-workflow-validation.md,historical-design,"PageGenerationJob and workflow validation model"
  2026-07-17T20:05:00-04:00,2026-07-17-2005-agent-operated-generation-wasm-research.md,current-foundation,"agent lifecycle; Wasm/search-scale research"
  2026-07-17T08:15:00-04:00,2026-07-17-0815-comprehensive-reorientation.md,current-code-review,"compiler/runtime review"
  2026-07-17T07:30:00-04:00,2026-07-17-0730-vector-native-reorientation.md,superseded-interpretation,"earlier compiler corrections"
  2026-07-17T06:30:00-04:00,2026-07-17-ui-metaprogramming-pass-1.md,historical-source-pass,"browser-first CSS; semantic UI; R3F"
  2026-07-17T02:00:00-04:00,../../../mvp-build/memory/2026-07-17-website-framework-phase-1-closure.md,historical,"Phase 1 spec closure"
  2026-07-17T00:55:00-04:00,../../../mvp-build/memory/2026-07-17-holographic-website-framework-v0.1.md,historical,"initial HRR/VSA lab"
  2026-07-17T00:22:00-04:00,../../../mvp-build/memory/2026-07-17-ws1-ws2-doc-reconciliation-and-website-frontier.md,historical,"GTM/source reconciliation"

## authority

read_order[22]{order,file,role}:
  1,../../identity.md,"root identity"
  2,../identity.md,"scope identity"
  3,../../CODEGRAPH.md,"root map"
  4,../AGENTS.md,"operating rules"
  5,../CODEGRAPH.md,"current source graph"
  6,../README.md,"current reality"
  7,MEMORY.md,"durable current state"
  8,2026-07-18-0115-graph-triage-ci-closure.md,"latest immutable CI handoff"
  9,2026-07-18-0105-graph-learning-paper-triage.md,"graph-paper research handoff"
  10,../26-graph-learning-paper-triage-and-promotion-gates.md,"learned graph method research authority"
  11,../validation/reports/2026-07-18-graph-learning-paper-triage.md,"graph-method validation report"
  12,2026-07-18-0055-academic-crosswalk-harness-acceleration.md,"academic/harness/acceleration handoff"
  13,../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md,"verified research crosswalk"
  14,../validation/reports/2026-07-18-academic-crosswalk-harness-and-acceleration.md,"research validation report"
  15,../validation/reports/2026-07-18-comprehensive-framework-code-seo-performance-review.md,"deep current code/SEO/performance review"
  16,../24-agent-discovered-ontology-and-10k-site-program.md,"current implementation/research authority"
  17,../validation/reports/2026-07-17-agent-ontology-10k-site-program.md,"exact source proof and boundaries"
  18,../23-groundwork-orchestration-implementation.md,"groundwork implementation authority"
  19,../22-agent-operated-framework-workflow-validation-matrix.md,"whole-system matrix"
  20,../21-vector-to-generation-job-compiler.md,"generation-job model"
  21,../20-agent-operated-vector-site-generation-and-wasm.md,"historical product/Wasm model"
  22,../site-manifest.yaml,"downstream compiled corpus authority"

## source

layers[18]{layer,file,state}:
  validation,../reference/src/validation-contracts.ts,source-pass
  project-ledgers-bounds,../reference/src/project-input.ts,source-pass
  sparse-lexical,../reference/src/sparse-lexical.ts,source-pass
  ontology-discovery,../reference/src/ontology-discovery.ts,"source-pass; provider/reviewer pending"
  ontology-graph,../reference/src/ontology-graph.ts,source-pass
  opportunity-baseline,../reference/src/opportunity-space.ts,"source-pass; transparency oracle"
  opportunity-generation,../reference/src/opportunity-generation-optimized.ts,"source-pass; exact small-fixture parity"
  opportunity-selection,../reference/src/opportunity-space-optimized.ts,source-pass
  opportunity-production,../reference/src/opportunity-space-production.ts,source-pass
  site-stage2-contracts,../reference/src/site-program.ts,"source-pass; provider transaction pending"
  site-sparse-planner,../reference/src/site-program-optimized.ts,source-pass
  agent-site-orchestrator,../reference/src/agent-site-orchestrator.ts,source-pass
  acceleration-decision,../reference/src/acceleration-decision.ts,"source-pass; Wasm not promoted"
  context-calibration,../reference/src/context-corpus.ts,"source-pass; synthetic proof only"
  coordinates,../reference/src/page-coordinate.ts,source-pass
  corpus-plan,../reference/src/corpus-plan.ts,"source-pass; small fixture"
  generation-jobs-runner,../reference/src/page-generation.ts,"source-pass; provider-neutral"
  manifest-pageir-ui,../reference/src/framework.ts,"source-pass; real content/browser acceptance pending"

## decisions

decisions[24]{id,decision,ref}:
  G01,"agent first-class at formation and generation",../21-vector-to-generation-job-compiler.md
  G02,"ProjectInput/ledgers are deterministic typed state",../reference/src/project-input.ts
  G03,"one-shot minimum/maximum site page counts are explicit project truth",../reference/src/project-input.ts
  G04,"Stage-1 agent proposes ontology; compiler is authority",../reference/src/ontology-discovery.ts
  G05,"protected/private/inferred-sensitive attributes rejected",../reference/src/ontology-discovery.ts
  G06,"demographic/lifestyle axes require approval and stronger materiality",../reference/src/ontology-discovery.ts
  G07,"TF-IDF/BM25 is deterministic lexical baseline",../reference/src/sparse-lexical.ts
  G08,"typed graph channels and hard constraints precede HRR",../reference/src/ontology-graph.ts
  G09,"k-core prunes isolated non-anchors; connected components descriptive only",../reference/src/ontology-graph.ts
  G10,"observed closed conjunctions and bounded graph expansion replace Cartesian matrices",../reference/src/opportunity-space-production.ts
  G11,"sparse concave coverage selects the finite corpus",../reference/src/opportunity-space-optimized.ts
  G12,"HRR represents approved structure after eligibility/pruning",../reference/src/opportunity-space-optimized.ts
  G13,"Stage-2 receives one exact selected region per PageConceptJob",../reference/src/site-program.ts
  G14,"Stage-2 drift or missing information/utility fails",../reference/src/site-program.ts
  G15,"bounded local neighbors are advisory, not publication authority",../reference/src/site-program-optimized.ts
  G16,"candidate seeds compile into existing explicit-primary path",../reference/src/site-program.ts
  G17,"Leiden is exploratory comparison only",../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md
  G18,"sparse clustering reserved for real customer-row studies",../24-agent-discovered-ontology-and-10k-site-program.md
  G19,"learned embeddings/HNSW/GNN/GraphRAG are later comparison arms",../24-agent-discovered-ontology-and-10k-site-program.md
  G20,"Blackwell/local GPU is optional agent provider, not compiler dependency",../24-agent-discovered-ontology-and-10k-site-program.md
  G21,"TypeScript remains semantic/production oracle",../reference/src/acceleration-decision.ts
  G22,"Wasm requires isolated dense kernel, bridge-inclusive repeated speedup, parity, and fallback",../reference/src/acceleration-decision.ts
  G23,"canonical HTML remains static and runtime-independent",../20-agent-operated-vector-site-generation-and-wasm.md
  G24,"source/scale proof cannot be described as search/commercial proof",../validation/reports/2026-07-17-agent-ontology-10k-site-program.md

research_decisions[8]{id,decision,ref}:
  R01,"generated bibliography is not authority until primary-source verification",../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md
  R02,"same-model self-critique cannot accept ontology/page output",../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md
  R03,"external deterministic compiler findings control repair and acceptance",../reference/src/validation-contracts.ts
  R04,"JSON-schema constrained decoding is future provider infrastructure, not semantic authority",../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md
  R05,"AgentO is future interoperability comparison, not business ontology replacement",../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md
  R06,"SGLang/equivalent is future execution-provider comparison only",../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md
  R07,"CSI waits for frozen real hidden-slice evaluation",../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md
  R08,"Wasm remains benchmark-gated after algorithm-first optimization",../reference/src/acceleration-decision.ts

graph_research_decisions[10]{id,decision,ref}:
  GL01,"graph-paper existence does not establish framework applicability",../26-graph-learning-paper-triage-and-promotion-gates.md
  GL02,"learned graph methods require exact problem-class match",../26-graph-learning-paper-triage-and-promotion-gates.md
  GL03,"learned clustering cannot define customer/page truth without external labels",../26-graph-learning-paper-triage-and-promotion-gates.md
  GL04,"graph transformers/foundation models require many reviewed project graphs and held-out tasks",../26-graph-learning-paper-triage-and-promotion-gates.md
  GL05,"positive-unlabeled learning requires accepted positives and genuinely unlabeled candidates",../26-graph-learning-paper-triage-and-promotion-gates.md
  GL06,"temporal/anomaly models require versioned histories and independent drift labels",../26-graph-learning-paper-triage-and-promotion-gates.md
  GL07,"VSAL is a possible operator-visualization lead only",../26-graph-learning-paper-triage-and-promotion-gates.md
  GL08,"no graph-learning model promoted from the WWW 2026 paper set",../validation/reports/2026-07-18-graph-learning-paper-triage.md
  GL09,"graph-model selection and Wasm target selection are independent",../reference/src/acceleration-decision.ts
  GL10,"real ingestion/providers/context/content remain prerequisites to learned-model comparison",../26-graph-learning-paper-triage-and-promotion-gates.md

## proof

proof{source_head,source_run,validated_docs_head,validated_docs_run,tests,stages}:
  dcc8beded51290f8084a421996c51c18b2afed83,29628832989,9cf5e449280c21debb7b908fd35ac2a950126910,29631800270,"46/46","TypeScript; manifest; UI; orchestration; framework validate/preview; browser; R3F; artifact"

scale{candidates,selected,batches,packed_bytes,total_ms}:
  15000,10000,400,2560000,5284.510

profile_ms{project,ontology,graph,itemsets,candidates,selection,site_program}:
  0.126,20.363,36.644,202.478,2218.216,1784.044,973.168

baseline_comparison{original_ms,production_ms,recorded_speedup}:
  "~29000",5284.510,"~5.5x"

hrr_sample{regions,ms,linear_10k_estimate_ms,estimated_share}:
  1000,49.358,"~493.58","~9.3%"

adversarial[13]:
  inferred-sensitive-medical-rejected
  unreviewed-age-rejected
  weaker-exact-duplicate-rejected
  lifestyle-requires-approval-materiality
  relation-to-rejected-endpoint-ledgered
  hard-exclusion-separate
  numeric-labels-distinct
  description-boilerplate-not-duplicate-authority
  optimized-candidate-ordered-hash-parity
  minimum-10k-enforced
  exact-batch-coverage
  stage2-missing-attribute-rejected
  wasm-not-promoted-with-small-dense-share

## blockers

p0[5]{id,item,ref}:
  N01,"real repository/source ingestion",../reference/src/project-input.ts
  N02,"Stage-1 provider + reviewer workflow",../reference/src/ontology-discovery.ts
  N03,"real customer/search observations and assessment",../reference/src/context-corpus.ts
  N04,"Stage-2 provider and canonical output transaction",../reference/src/site-program.ts
  N05,"100-500 real noindex cohort with content/information-gain review",../24-agent-discovered-ontology-and-10k-site-program.md

p1[9]{id,item}:
  legacy-manifest-explicit-primary-migration
  legacy-links-typed-edge-migration
  public-ai-employee-task-ir
  provider-json-schema-benchmark
  sglang-equivalent-runtime-comparison
  10000-complete-page-emissions
  browser-accessibility-cwv-crawler-scale
  zig-wasm-bridge-inclusive-kernel-benchmark
  matched-field-publication

not_claimed[18]:
  external-relevance
  production-agent-generation
  reviewed-10000-page-corpus
  complete-10000-page-bodies-ui
  search-indexing-ranking-lift
  ai-citation-lift
  conversion-or-revenue-lift
  wasm-performance-win
  leiden-clustering-embedding-ann-superiority
  graph-transformer-or-foundation-model-superiority
  learned-clustering-equals-market-segments
  positive-unlabeled-page-eligibility
  anomaly-model-drift-value
  blackwell-cost-throughput
  browser-beauty-acceptance
  sglang-provider-superiority
  agento-interoperability-acceptance
  csi-superiority-on-real-corpus

## next

next[9]{order,task,gate}:
  1,"repository/source ingestion adapters","real ProjectInput/OntologyProposal without invented truth"
  2,"Stage-1 schema-constrained provider + reviewer workflow","reviewed ontology and observations"
  3,"independent context/assessor workflow","external labels and held-out relevance"
  4,"Stage-2 schema-constrained provider adapter","bounded real PageConceptProposals"
  5,"canonical transaction","atomic successful output -> evidence/modules/tasks/pages"
  6,"first cohort","100-500 real noindex pages with information-gain/cannibalization review"
  7,"scale emissions","10000 complete static pages + browser/accessibility/performance acceptance"
  8,"50k/100k profile and learned-graph comparisons","measured need before ANN/native/Wasm/GPU/model promotion"
  9,"field gates","matched publication then search/commercial measurement"
