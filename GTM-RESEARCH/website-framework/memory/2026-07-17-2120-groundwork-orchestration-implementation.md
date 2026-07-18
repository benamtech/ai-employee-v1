# Website Framework Groundwork Orchestration Handoff

at: 2026-07-17T21:20:00-04:00  
branch: agent/ui-metaprogramming-pass-1  
status: source-level-pass; provider/external-relevance/browser/runtime/field pending

## refs

refs[12]{role,file}:
  current-reality,../README.md
  operating-rules,../AGENTS.md
  source-graph,../CODEGRAPH.md
  implementation-authority,../23-groundwork-orchestration-implementation.md
  operational-validation,../22-agent-operated-framework-workflow-validation-matrix.md
  generation-job-model,../21-vector-to-generation-job-compiler.md
  validation-report,../validation/reports/2026-07-17-groundwork-orchestration-implementation.md
  orchestrator,../reference/src/framework-orchestrator.ts
  project-input,../reference/src/project-input.ts
  context-calibration,../reference/src/context-corpus.ts
  coordinate-selection,../reference/src/page-coordinate.ts;../reference/src/corpus-plan.ts
  jobs-preview,../reference/src/page-generation.ts;../reference/src/framework-preview.ts

## implemented

pipeline:
  "ProjectInput -> ledgers -> independent ContextCorpus -> frozen splits -> isotonic calibration -> explicit-primary PageCoordinates -> typed eligibility/calibrated scoring -> SelectedCorpusPlan -> typed graph -> PageGenerationJobs -> bounded runner/repair -> static preview"

files_added[12]:
  reference/src/validation-contracts.ts
  reference/src/project-input.ts
  reference/src/context-corpus.ts
  reference/src/typed-graph.ts
  reference/src/page-coordinate.ts
  reference/src/corpus-plan.ts
  reference/src/page-generation.ts
  reference/src/framework-preview.ts
  reference/src/framework-orchestrator.ts
  reference/scripts/framework-cli.mjs
  reference/scripts/run-orchestration.mjs
  reference/test/orchestration.test.mjs

operator_commands[4]:
  npm-run-framework-doctor
  npm-run-framework-plan
  npm-run-framework-validate
  npm-run-framework-preview

validation_attributes{project,context,graph,orchestration,total}:
  7,4,3,8,22

## algorithm decisions

decisions[10]{id,decision}:
  G01,"canonical sorted serialization + SHA-256 for all project/orchestration checkpoints"
  G02,"context acceptance requires provenance, source IDs, multiple assessors, graded rationale"
  G03,"generation agent cannot author its own sole acceptance contexts"
  G04,"train-only PAV isotonic calibration; validation/test evaluation only"
  G05,"typed eligibility precedes vector scoring; ineligible fit=0"
  G06,"generated coordinates require explicit primaryPrototypeId; prototype order non-authoritative"
  G07,"page graph edges require type+rationale+sources+eligibility+priority"
  G08,"finite corpus selected under budget with inspectable coverage/information/rare/diversity components"
  G09,"PageGenerationJob is typed noindex state, not generic prompt"
  G10,"agent passes are ordered, source-bound, checkpointed, bounded-repair, reject-on-exhaustion"

## proof

proof{source_head,run,tests,stages}:
  ad3c81cfc202ba94f63f08b54649cfaaf71b00d7,29624909676,"30/30","tests; manifest; UI; orchestration; framework validate; framework preview; browser; R3F; artifacts"

fixture{contexts,splits,candidates,selected,rejected,jobs,validation_coverage,test_coverage}:
  6,"2/2/2",3,2,1,"2/2",1.0,1.0

hashes{project,corpus,prepared,execution,preview,preview_validation}:
  3b695e0952f0c346eeb8a6d5736ecf266531f8c558254d127017d37bc27cba2d,e99f20fb92f2b5729ae91fde99acf21ed33c2bae5934116baeff873880289e81,388c70fe0116512375c4e73c3df00d84a74e707a51f18870befa0d9ac22cb454,1f42528d8a9f8d93db43983ffbd0335f157d588d78b95fbbeca88676508ecb91,1b7c0a0697f8da3e55fc0ac575e92ded15c11b22ddf97cba8191445d8b85d1d4,5dae8aa49c335a5a4a062acdd2e9434181ba150dfaf2c4f11f30759d0155f1a9

selected[2]:
  candidate:landscape-leads
  candidate:painting-estimate

rejected[1]{id,reason}:
  candidate:painting-estimate-copy,"redundant with selected corpus (1.000)"

adversarial[7]:
  self-authored-context-rejected
  ineligible-compatibility-zero
  primary-reorder-invariant
  duplicate-rejected-with-reason
  bounded-repair-exercised
  exhausted-repair-rejects
  preview-has-no-script

## boundaries

not_accepted[10]:
  arbitrary-repository-intake
  real-independent-context-assessment
  bm25-learned-semantic-facet-graph-prefilter
  real-codex-claude-pi-provider
  agent-output-to-manifest-transaction
  public-ai-employee-task-ir
  legacy-manifest-primary-typed-edge-migration
  browser-accessibility-cwv
  zig-native-wasm-full-loop-win
  indexed-search-commercial-proof

interpretation:
  "fixture coverage=1.0 is constructed wiring evidence only; never use as external relevance, SEO, or commercial proof"

## next

next[7]{order,task,gate}:
  1,"repository/source ingestion adapters","derive ProjectInput/ledgers from a real repo without invented truth"
  2,"independent context collection + assessor workflow","frozen externally judged corpus"
  3,"hybrid prefilter","BM25 + learned semantic + facets + graph compared before HRR scoring"
  4,"provider adapter","real AgentPassExecutor with bounded typed outputs"
  5,"manifest transaction","successful outputs become evidence/modules/pages/tasks atomically"
  6,"first cohort","20-40 real noindex jobs/pages with human review"
  7,"field gates","browser/accessibility/performance then matched publication"
