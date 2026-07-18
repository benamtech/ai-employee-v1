# Website Framework Durable Memory

format: TOON-oriented Markdown  
status: active  
scope: GTM-RESEARCH/website-framework  
updated_at: 2026-07-17T21:20:00-04:00

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

state{branch,pr,status,latest_validated_source_head,workflow_run,tests}:
  agent/ui-metaprogramming-pass-1,17,"draft; groundwork orchestration source-pass; provider/external-relevance/browser/runtime/field pending",ad3c81cfc202ba94f63f08b54649cfaaf71b00d7,29624909676,"30/30"

note:
  "latest_validated_source_head precedes documentation/memory commits; run a final exact-head workflow after authority updates"

product_boundary:
  "coding agent forms project/context/vector/corpus and executes typed PageGenerationJobs; provider adapters and successful-output transaction into canonical manifest remain pending"

pipeline:
  "ProjectInput -> ledgers -> independent ContextCorpus -> frozen splits -> isotonic calibration -> explicit-primary PageCoordinates -> eligibility/calibrated scoring -> SelectedCorpusPlan -> typed graph -> PageGenerationJobs -> bounded runner/repair -> static preview -> existing manifest/compiler/UI"

## handoffs

handoffs[10]{at,file,status,scope}:
  2026-07-17T21:20:00-04:00,2026-07-17-2120-groundwork-orchestration-implementation.md,current,"implemented orchestration spine; 30-test proof; preview/operator UX"
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

read_order[14]{order,file,role}:
  1,../../identity.md,"root identity"
  2,../identity.md,"scope identity"
  3,../../CODEGRAPH.md,"root map"
  4,../AGENTS.md,"operating rules"
  5,../CODEGRAPH.md,"current source graph"
  6,../README.md,"current reality"
  7,MEMORY.md,"durable current state"
  8,2026-07-17-2120-groundwork-orchestration-implementation.md,"latest immutable handoff"
  9,../23-groundwork-orchestration-implementation.md,"implementation authority"
  10,../22-agent-operated-framework-workflow-validation-matrix.md,"whole-system matrix"
  11,../21-vector-to-generation-job-compiler.md,"generation-job model"
  12,../validation/reports/2026-07-17-groundwork-orchestration-implementation.md,"exact proof/boundaries"
  13,../20-agent-operated-vector-site-generation-and-wasm.md,"product/Wasm model"
  14,../site-manifest.yaml,"downstream compiled corpus authority"

## source

layers[10]{layer,file,state}:
  validation,../reference/src/validation-contracts.ts,source-pass
  project-ledgers,../reference/src/project-input.ts,source-pass
  context-calibration,../reference/src/context-corpus.ts,"source-pass; synthetic proof only"
  typed-graph,../reference/src/typed-graph.ts,"source-pass; legacy links not migrated"
  coordinates,../reference/src/page-coordinate.ts,source-pass
  corpus-plan,../reference/src/corpus-plan.ts,"source-pass; small fixture"
  generation-jobs-runner,../reference/src/page-generation.ts,"source-pass; provider-neutral"
  preview,../reference/src/framework-preview.ts,source-pass
  orchestrator,../reference/src/framework-orchestrator.ts,source-pass
  operator-cli,../reference/scripts/framework-cli.mjs,source-pass

validation_attributes{project,context,graph,orchestration,total}:
  7,4,3,8,22

## decisions

decisions[14]{id,decision,ref}:
  G01,"agent first-class at formation and generation",../21-vector-to-generation-job-compiler.md
  G02,"ProjectInput/ledgers are deterministic typed state",../reference/src/project-input.ts
  G03,"acceptance contexts independent of generation agent",../reference/src/context-corpus.ts
  G04,"frozen train/validation/test with stable hashes",../reference/src/context-corpus.ts
  G05,"train-only isotonic calibration; held-out metrics",../reference/src/context-corpus.ts
  G06,"eligibility before scoring; ineligible=0",../reference/src/page-coordinate.ts
  G07,"explicit primary prototype in generated-coordinate path",../reference/src/page-coordinate.ts
  G08,"typed edges replace published raw similarity",../reference/src/typed-graph.ts
  G09,"finite budgeted corpus selection; no Cartesian emission",../reference/src/corpus-plan.ts
  G10,"PageGenerationJob typed/noindex/source-bound",../reference/src/page-generation.ts
  G11,"ordered checkpointed bounded-repair runner",../reference/src/page-generation.ts
  G12,"selected/rejected static preview with reasons",../reference/src/framework-preview.ts
  G13,"every layer carries validation/pass/fail/baseline/severity",../reference/src/validation-contracts.ts
  G14,"canonical HTML static/Wasm-free",../20-agent-operated-vector-site-generation-and-wasm.md

## proof

proof{head,run,tests,stages}:
  ad3c81cfc202ba94f63f08b54649cfaaf71b00d7,29624909676,"30/30","manifest; UI; orchestration; framework validate/preview; browser; R3F; artifact"

fixture{contexts,splits,candidates,selected,rejected,jobs,validation,test}:
  6,"2/2/2",3,2,1,"2/2",1.0,1.0

hashes{project,corpus,prepared,execution,preview}:
  3b695e0952f0c346eeb8a6d5736ecf266531f8c558254d127017d37bc27cba2d,e99f20fb92f2b5729ae91fde99acf21ed33c2bae5934116baeff873880289e81,388c70fe0116512375c4e73c3df00d84a74e707a51f18870befa0d9ac22cb454,1f42528d8a9f8d93db43983ffbd0335f157d588d78b95fbbeca88676508ecb91,1b7c0a0697f8da3e55fc0ac575e92ded15c11b22ddf97cba8191445d8b85d1d4

adversarial[7]:
  self-authored-context-rejected
  ineligible-fit-zero
  primary-reorder-invariant
  duplicate-rejected-with-reason
  repair-exercised
  exhausted-repair-rejects
  preview-no-script

## blockers

p0[5]{id,item,ref}:
  N01,"real repository/source ingestion",../reference/src/project-input.ts
  N02,"real independent context collection/assessment",../reference/src/context-corpus.ts
  N03,"BM25/learned-semantic/facet/graph candidate prefilter",../reference/src/page-coordinate.ts
  N04,"real AgentPassExecutor provider adapter",../reference/src/page-generation.ts
  N05,"successful agent-output transaction into manifest evidence/modules/pages/tasks",../reference/src/framework-orchestrator.ts

p1[6]{id,item}:
  legacy-manifest-explicit-primary-migration
  legacy-links-typed-edge-migration
  public-ai-employee-task-ir
  browser-accessibility-cwv
  zig-native-wasm-full-loop-benchmark
  first-real-noindex-cohort

not_claimed[8]:
  external-relevance
  production-agent-generation
  reviewed-2000-page-corpus
  search-ranking-lift
  ai-citation-lift
  conversion-or-revenue-lift
  wasm-performance-win
  browser-beauty-acceptance

## next

next[7]{order,task,gate}:
  1,"repository/source ingestion adapters","real ProjectInput without invented truth"
  2,"context collection + assessor workflow","frozen externally judged corpus"
  3,"hybrid candidate prefilter","BM25 + learned semantic + facets + graph controls"
  4,"provider adapter","real bounded AgentPassExecutor"
  5,"manifest transaction","atomic successful output -> canonical state"
  6,"first cohort","20-40 real noindex pages with human review"
  7,"field gates","browser/accessibility/performance then matched publication"
