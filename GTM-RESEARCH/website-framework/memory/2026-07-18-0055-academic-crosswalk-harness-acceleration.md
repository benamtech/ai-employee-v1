# 2026-07-18 00:55 ET — Academic Crosswalk, Harness, and Acceleration Handoff

format: TOON-oriented Markdown  
status: immutable handoff  
scope: `GTM-RESEARCH/website-framework/`

## state

branch_pr{branch,pr,reviewed_code_head,exact_head_ci,ci_status}:
  agent/ui-metaprogramming-pass-1,17,f6d726d08491c63f8aac3e8de28ddb84edaa93a1,29629423243,pass

new_docs[2]:
  ../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md
  ../validation/reports/2026-07-18-academic-crosswalk-harness-and-acceleration.md

job_boundary:
  "one job = one finite full-site generation run; current synthetic contract = 10,000 selected page-region jobs and all bounded Stage-2 batches; not request-time serving"

canonical_pipeline:
  "ProjectInput -> Stage-1 AgentOntologyProposal -> ApprovedOntology -> sparse lexical/typed graph/constraints -> bounded opportunity regions -> sparse corpus selection -> HRR structure -> SiteGenerationPlan -> Stage-2 PageConceptProposal -> CandidatePageSeed -> existing PageCoordinate/PageGenerationJob/PageIR/static UI compiler"

## research authority

verified[13]{topic,source,status}:
  hdc-vsa-part1,https://arxiv.org/abs/2111.06077,"representation authority only"
  hdc-vsa-part2,https://arxiv.org/abs/2112.15424,"representation/applications authority only"
  context-document-compatibility,https://arxiv.org/abs/2309.05113,"evaluation baseline; not SEO proof"
  submodular-information,https://arxiv.org/abs/2006.15412,"finite coverage/selection basis"
  complement-submodular-information,https://arxiv.org/abs/2605.24779,"comparison arm for hidden-slice balance"
  leiden,https://doi.org/10.1038/s41598-019-41695-z,"exploratory graph partition only"
  reflect-harness,https://arxiv.org/abs/2605.05737,"external deterministic harness support"
  agent-externalization,https://arxiv.org/abs/2604.08224,"memory/skills/protocol/harness framing"
  self-verification-limits,https://arxiv.org/abs/2402.08115,"same-model self-critique not authority"
  jsonschemabench,https://arxiv.org/abs/2501.10868,"future provider structured-output evaluation"
  agento,https://eprints.cs.univie.ac.at/8749/,"future agent/task/workflow interoperability comparison"
  sglang,https://arxiv.org/abs/2312.07104,"future execution-provider comparison"
  wasm-specs,https://webassembly.org/specs/,"portable numeric target; no automatic speedup"

research_rule:
  "generated bibliography = lead list; exact identity + primary source + applicability + simpler baseline + validation vector required before promotion"

## decisions

decisions[12]{id,decision,ref}:
  R01,"HRR/VSA remains first-class structural representation after evidence/safety/materiality/graph gates",../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md
  R02,"vectors do not establish page usefulness, search demand, or publication eligibility",../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md
  R03,"independent ContextCorpus and held-out compatibility remain evaluation authority",../reference/src/context-corpus.ts
  R04,"sparse concave coverage remains production selector; CSI comparison waits for real hidden slices",../reference/src/opportunity-space-optimized.ts
  R05,"Leiden remains comparison-only; communities are not prospect/page truth",../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md
  R06,"same-model self-critique never accepts ontology/page output",../reference/src/page-generation.ts
  R07,"external compiler findings and bounded repair remain harness authority",../reference/src/validation-contracts.ts
  R08,"Stage-1/Stage-2 adapters should use schema-constrained output plus post-decode compiler validation",../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md
  R09,"AgentO is an interoperability vocabulary candidate, not the business/prospect ontology",../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md
  R10,"SGLang/equivalent may optimize provider execution only after real adapters exist",../25-academic-crosswalk-agent-harness-structured-generation-and-acceleration.md
  R11,"TypeScript remains semantic/production oracle; Zig/Wasm remains research",../reference/src/acceleration-decision.ts
  R12,"unverified paper/cost/TPS/crate/action-item claims remain notes only",../validation/reports/2026-07-18-academic-crosswalk-harness-and-acceleration.md

## proof

source_proof{head,run,tests,status}:
  dcc8beded51290f8084a421996c51c18b2afed83,29628832989,"46/46",pass

latest_exact_head{head,run,status}:
  f6d726d08491c63f8aac3e8de28ddb84edaa93a1,29629423243,pass

scale{candidate_regions,selected_regions,batches,packed_bytes,total_ms}:
  15000,10000,400,2560000,5284.510

baseline{transparent_ms,optimized_ms,recorded_speedup}:
  "~29000",5284.510,"~5.5x"

wasm_disposition:
  "keep TypeScript; benchmark only isolated contiguous production numeric kernel with 20+ bridge-inclusive runs, exact selection-hash parity, cosine>=0.999999, >=1.25x kernel speedup, >=500ms full-build savings, complete TS fallback"

## current validation truth

pass[10]:
  agent-ontology-is-proposal-not-authority
  provenance-materiality-safety-reviewer-gates
  deterministic-tfidf-bm25-baseline
  typed-graph-and-separate-hard-constraints
  bounded-non-cartesian-region-expansion
  sparse-10k-selection
  packed-hrr-parity
  exact-region-stage2-contract
  external-harness-validation-model
  algorithm-first-acceleration-decision

pending[11]:
  real-repository-source-ingestion
  stage1-provider-schema-benchmark
  reviewer-workflow
  independent-real-context-corpus
  csi-real-hidden-slice-comparison
  stage2-provider-schema-semantic-evidence-benchmark
  successful-output-transaction-to-pages
  100-500-real-noindex-cohort
  10000-complete-page-bodies-ui
  browser-crawler-accessibility-field-validation
  native-wasm-bridge-inclusive-parity-performance

not_claimed[9]:
  hrr-generates-good-content
  communities-equal-market-segments
  selected-regions-equal-search-demand
  10000-useful-pages
  indexing-ranking-ai-citation-lift
  conversion-revenue-lift
  wasm-speedup
  sglang-provider-superiority
  gpu-blackwell-cost-throughput

## next

next[8]{order,task,gate}:
  1,"real repository/business/source ingestion","no invented ProjectInput truth"
  2,"Stage-1 provider with JSON-schema constrained proposal","schema + semantic + evidence fidelity"
  3,"reviewer and independent observation workflow","approved real ontology"
  4,"frozen real ContextCorpus","held-out compatibility and hidden-slice evidence"
  5,"100-500 noindex Stage-2 jobs","content/information-gain/cannibalization validation"
  6,"atomic successful-output transaction","evidence/modules/tasks/PageIR/static emission"
  7,"browser/crawler/accessibility and complete 10k emissions","delivery acceptance"
  8,"50k/100k profile then provider/native comparisons","measured need before ANN/Wasm/GPU"
